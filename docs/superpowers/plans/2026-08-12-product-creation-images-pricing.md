# Création produit : images Cloudinary + prix barré — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre d'uploader jusqu'à 6 images (Cloudinary) et un prix barré optionnel à la création d'un produit dans le dashboard, affichés sur la vitrine — sans rien casser de l'existant.

**Architecture:** Upload direct navigateur → Cloudinary, signé côté serveur (secret jamais exposé). Les URLs sont stockées dans `product_media` (déjà existant). Le prix barré = colonne additive `compare_at_price_minor`. La vitrine porte `images: string[]` (media UNIQUEMENT, vide pour les produits seed) + `compareAtEur?`; l'affichage fait `images[0] ?? getProductImageUrl(...)` → les produits existants gardent leur comportement actuel.

**Tech Stack:** Next.js 16 (App Router), zod, `crypto` (signature Cloudinary, pas de SDK), SQLite (dev) + Postgres/Neon (prod), Vitest.

## Global Constraints

- Secret Cloudinary **jamais** renvoyé au client ; upload signé côté serveur.
- Migrations **additives uniquement** (`ADD COLUMN` nullable), même SQL SQLite + Postgres.
- **Non-breaking** : `Product.images` = media uniquement (vide = pas de media) ; affichage `images[0] ?? getProductImageUrl(...)`. Aucune modification du rendu des produits existants.
- Env : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Bilingue fr + en. TDD, commits fréquents.
- Vérif : `rm -rf .next/dev && npm run typecheck` doit finir à 0. Tests ciblés via `npx vitest run <fichier>`.

---

### Task 1: Signature Cloudinary (helper)

**Files:**
- Create: `src/server/media/cloudinary.ts`
- Test: `src/server/media/cloudinary.test.ts`

**Interfaces:**
- Produces: `signUpload(params: Record<string, string>, apiSecret: string): string` — SHA-1 hex de `<params triés k=v joints par &>` + `apiSecret`.

- [ ] **Step 1 — Test**
```ts
import { describe, it, expect } from 'vitest';
import { signUpload } from './cloudinary';
import { createHash } from 'node:crypto';

describe('signUpload', () => {
  it('sorts params and hashes with the secret (Cloudinary scheme)', () => {
    const sig = signUpload({ timestamp: '1700000000', folder: 'reign/products' }, 'SECRET');
    const expected = createHash('sha1').update('folder=reign/products&timestamp=1700000000SECRET').digest('hex');
    expect(sig).toBe(expected);
  });
});
```
- [ ] **Step 2** — `npx vitest run src/server/media/cloudinary.test.ts` → FAIL (module manquant)
- [ ] **Step 3 — Implémentation**
```ts
import { createHash } from 'node:crypto';

/** Cloudinary signed-upload signature: SHA-1 of sorted `k=v` params joined by `&`, then the api_secret appended. */
export function signUpload(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}
```
- [ ] **Step 4** — test → PASS
- [ ] **Step 5 — Commit** `feat(media): Cloudinary signed-upload signature helper`

---

### Task 2: Route de signature `/api/admin/upload-signature`

**Files:**
- Create: `src/app/api/admin/upload-signature/route.ts`

**Interfaces:**
- Consumes: `signUpload` (Task 1), `getCurrentAdmin` (`@/server/auth/runtime`), `requireRole` (`@/server/auth/authorization`).
- Produces: `POST` → `{ cloudName, apiKey, timestamp, folder, signature }` (401 si non admin, 503 si env manquante).

- [ ] **Step 1 — Implémentation** (pas de test unitaire : dépend de l'env runtime ; vérifié à l'usage)
```ts
import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { signUpload } from '@/server/media/cloudinary';

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  requireRole(admin.role, ['owner', 'manager']);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'CLOUDINARY_NOT_CONFIGURED' }, { status: 503 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = 'reign/products';
  const signature = signUpload({ folder, timestamp }, apiSecret);
  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
```
- [ ] **Step 2** — `rm -rf .next/dev && npm run typecheck` → 0
- [ ] **Step 3 — Commit** `feat(media): signed Cloudinary upload signature route (admin)`

---

### Task 3: Migration 0003 — `compare_at_price_minor`

**Files:**
- Create: `src/server/db/migrations/0003_compare_at_price.sql`
- Modify: `src/server/db/migrate.ts` (ajouter `'0003_compare_at_price'` à `MIGRATIONS`)
- Test: `src/server/db/schema.test.ts` (ajouter un cas)

**Interfaces:**
- Produces: colonne `product_variants.compare_at_price_minor INTEGER` (nullable).

- [ ] **Step 1 — Écrire la migration**
```sql
ALTER TABLE product_variants ADD COLUMN compare_at_price_minor INTEGER;
```
- [ ] **Step 2 — Enregistrer** dans `migrate.ts` :
```ts
const MIGRATIONS = ['0001_initial', '0002_conversations', '0003_compare_at_price'] as const;
```
- [ ] **Step 3 — Test** (ajouter à `schema.test.ts`, après migration d'une DB `:memory:`)
```ts
it('has a nullable compare_at_price_minor column on product_variants', async () => {
  const cols = (await db.prepare("SELECT name FROM pragma_table_info('product_variants')").all()) as Array<{ name: string }>;
  expect(cols.map((c) => c.name)).toContain('compare_at_price_minor');
});
```
- [ ] **Step 4** — `npx vitest run src/server/db/schema.test.ts` → PASS
- [ ] **Step 5 — Commit** `feat(db): migration 0003 add compare_at_price_minor (nullable)`

---

### Task 4: Schéma + repository catalogue (images + prix barré)

**Files:**
- Modify: `src/server/catalog/schemas.ts`, `src/server/catalog/repository.ts`
- Test: `src/server/catalog/repository.test.ts`

**Interfaces:**
- `createProductInputSchema` : + `images: z.array(z.string().url()).max(6).optional()`, + `compareAtPriceMinor: z.number().int().nonnegative().optional()`.
- `CatalogProduct` : + `images: string[]`, + `compareAtMinor: number | null`.
- `createProduct` insère les `product_media` + `compare_at_price_minor` (même valeur sur chaque variante).
- `listProducts` renseigne `images` (depuis `product_media` triées par `position`) et `compareAtMinor` (depuis `variants[0].compare_at_price_minor`).

- [ ] **Step 1 — Test** (le repo test crée déjà une DB `:memory:` migrée ; suivre son style)
```ts
it('persists images (product_media) and compare-at price on create', async () => {
  const repo = new CatalogRepository(database);
  await repo.createProduct({
    id: 'p-img', categoryId: 'category:test', slug: 'produit-img',
    nameFr: 'Img', nameEn: 'Img', descriptionFr: '', descriptionEn: '',
    images: ['https://res.cloudinary.com/x/a.jpg', 'https://res.cloudinary.com/x/b.jpg'],
    compareAtPriceMinor: 9900,
    variants: [{ id: 'v-img', sku: 'SKU-IMG', size: 'M', color: 'Noir', priceMinor: 7900, currency: 'EUR' }],
  });
  const product = (await repo.findBySlug('produit-img', true))!;
  expect(product.images).toEqual(['https://res.cloudinary.com/x/a.jpg', 'https://res.cloudinary.com/x/b.jpg']);
  expect(product.compareAtMinor).toBe(9900);
});

it('leaves images empty and compareAtMinor null when not provided', async () => {
  const repo = new CatalogRepository(database);
  await repo.createProduct({
    id: 'p-plain', categoryId: 'category:test', slug: 'produit-plain',
    nameFr: 'Plain', nameEn: 'Plain', descriptionFr: '', descriptionEn: '',
    variants: [{ id: 'v-plain', sku: 'SKU-PLAIN', size: 'M', color: 'Noir', priceMinor: 5000, currency: 'EUR' }],
  });
  const product = (await repo.findBySlug('produit-plain', true))!;
  expect(product.images).toEqual([]);
  expect(product.compareAtMinor).toBeNull();
});
```
- [ ] **Step 2** — `npx vitest run src/server/catalog/repository.test.ts` → FAIL
- [ ] **Step 3 — Implémentation**
  - `schemas.ts` : ajouter les 2 champs optionnels à `createProductInputSchema` (voir Interfaces).
  - `repository.ts` :
    - `CatalogProduct` : ajouter `images: string[];` et `compareAtMinor: number | null;`.
    - `VariantRow` : ajouter `compare_at_price_minor: number | null;`.
    - `createProduct` — inclure `compare_at_price_minor` dans l'INSERT variante et insérer les media :
```ts
const insertVariant = this.database.prepare(`INSERT INTO product_variants
  (id, product_id, sku, size, color, price_minor, currency, compare_at_price_minor)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
for (const variant of input.variants) {
  await insertVariant.run(variant.id, input.id, variant.sku, variant.size, variant.color,
    variant.priceMinor, variant.currency, input.compareAtPriceMinor ?? null);
}
const insertMedia = this.database.prepare(`INSERT INTO product_media
  (id, product_id, url, position) VALUES (?, ?, ?, ?)`);
(input.images ?? []).forEach(async (url, index) => {
  await insertMedia.run(randomUUID(), input.id, url, index);
});
```
      (Insérer les media dans la transaction, avant COMMIT. Utiliser une boucle `for` `await` plutôt que `forEach` async.)
    - `listProducts` — récupérer media + compare-at :
```ts
// dans la requête variants : ajouter v.compare_at_price_minor
// nouvelle requête :
const media = (await this.database.prepare(
  `SELECT product_id, url FROM product_media ORDER BY product_id, position, rowid`
).all()) as unknown as Array<{ product_id: string; url: string }>;
// dans le map produit :
images: media.filter((m) => m.product_id === product.id).map((m) => m.url),
compareAtMinor: (variantsForProduct[0]?.compare_at_price_minor) ?? null,
```
      (Adapter `VariantRow` + le SELECT variants pour inclure `compare_at_price_minor`. `Postgres` n'a pas `rowid` — trier par `position` seul suffit ; remplacer `, rowid` par rien pour compat : `ORDER BY product_id, position`.)
- [ ] **Step 4** — test → PASS
- [ ] **Step 5 — Commit** `feat(catalog): persist product images + compare-at price on create`

---

### Task 5: Type vitrine `Product` + `StorefrontCatalog`

**Files:**
- Modify: `src/lib/products.ts` (type `Product`), `src/server/catalog/storefront.ts`
- Test: `src/server/catalog/storefront.test.ts`

**Interfaces:**
- `Product` : + `images: string[]` (media uniquement, peut être vide), + `compareAtEur?: number`.
- `toStorefrontProduct` : `images: product.images` (les URLs media du repo) ; `compareAtEur: product.compareAtMinor != null ? product.compareAtMinor / 100 : undefined`.

- [ ] **Step 1 — Test** (le test storefront crée des CatalogProduct ; suivre son style)
```ts
it('exposes media images and compare-at price on the storefront product', () => {
  const sf = toStorefrontProduct({
    id: 'homme-x', categoryId: 'category:homme', slug: 'x', nameFr: 'X', nameEn: 'X',
    descriptionFr: '', descriptionEn: '', status: 'active',
    images: ['https://res.cloudinary.com/x/a.jpg'], compareAtMinor: 9900,
    variants: [{ id: 'v', sku: 'S', size: 'M', color: 'Noir', priceMinor: 7900, currency: 'EUR', stock: 3 }],
  })!;
  expect(sf.images).toEqual(['https://res.cloudinary.com/x/a.jpg']);
  expect(sf.compareAtEur).toBe(99);
  expect(sf.priceEur).toBe(79);
});
```
  (Note : `toStorefrontProduct` est actuellement non exporté — l'exporter pour le test.)
- [ ] **Step 2** — FAIL
- [ ] **Step 3 — Implémentation** : exporter `toStorefrontProduct` ; ajouter `images` + `compareAtEur` au retour et au type `Product`. Ne PAS toucher `getProductImageUrl`.
- [ ] **Step 4** — PASS
- [ ] **Step 5 — Commit** `feat(catalog): storefront product carries media images + compareAtEur`

---

### Task 6: API produits — accepter images + prix barré

**Files:**
- Modify: `src/app/api/admin/products/route.ts`

- [ ] **Step 1 — Implémentation** : étendre `inputSchema` (POST) :
```ts
images: z.array(z.string().url()).max(6).optional(),
compareAtPriceMinor: z.number().int().nonnegative().optional(),
```
  et les passer à `createProduct` :
```ts
const product = await new CatalogRepository(db).createProduct({
  id: randomUUID(), ...input,
  variants: input.variants.map((variant) => ({ id: randomUUID(), ...variant })),
});
```
  (`...input` porte déjà `images`/`compareAtPriceMinor` ; rien d'autre à changer si les noms correspondent au schéma repo.)
- [ ] **Step 2** — `rm -rf .next/dev && npm run typecheck` → 0
- [ ] **Step 3 — Commit** `feat(api): product create accepts images + compareAtPriceMinor`

---

### Task 7: Composant d'upload `ImageUploader`

**Files:**
- Create: `src/components/admin/ImageUploader.tsx`
- Test: `src/components/admin/ImageUploader.test.tsx`

**Interfaces:**
- Produces:
```ts
function ImageUploader(props: {
  value: string[];
  max?: number;              // défaut 6
  onChange: (urls: string[]) => void;
  labels: { add: string; uploading: string; remove: string };
}): JSX.Element
```
- Comportement : bouton d'ajout → `POST /api/admin/upload-signature` → `POST https://api.cloudinary.com/v1_1/<cloudName>/image/upload` (FormData: file, api_key, timestamp, folder, signature) → `secure_url` ajouté à `value`. Aperçus + suppression. Bloque au-delà de `max`.

- [ ] **Step 1 — Test** (mock `fetch` : 1er appel = signature, 2e = Cloudinary)
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImageUploader } from './ImageUploader';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ cloudName: 'c', apiKey: 'k', timestamp: '1', folder: 'reign/products', signature: 's' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/c/up.jpg' }) }));
});
afterEach(() => vi.unstubAllGlobals());

it('uploads a file and reports the returned URL', async () => {
  const onChange = vi.fn();
  render(<ImageUploader value={[]} onChange={onChange} labels={{ add: 'Ajouter', uploading: '...', remove: 'X' }} />);
  const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByTestId('image-uploader-input'), { target: { files: [file] } });
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(['https://res.cloudinary.com/c/up.jpg']));
});
```
- [ ] **Step 2** — FAIL
- [ ] **Step 3 — Implémentation** : `<input type="file" accept="image/*" multiple data-testid="image-uploader-input">` caché derrière un bouton ; pour chaque fichier (jusqu'à `max - value.length`) : fetch signature → build FormData → POST Cloudinary → push `secure_url` ; state d'upload + erreurs ; grille d'aperçus avec bouton supprimer (retire l'URL de `value`).
- [ ] **Step 4** — PASS
- [ ] **Step 5 — Commit** `feat(admin): Cloudinary ImageUploader component`

---

### Task 8: Formulaire produit dashboard (images + prix barré)

**Files:**
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`

**Interfaces:**
- Consumes: `ImageUploader` (Task 7).

- [ ] **Step 1 — Implémentation**
  - State : `const [formImages, setFormImages] = useState<string[]>([])` ; `const [formCompareAt, setFormCompareAt] = useState('')`.
  - Dans le modal (formulaire), ajouter :
    - `<ImageUploader value={formImages} onChange={setFormImages} labels={{...}} />`
    - un champ optionnel « Prix initial (barré) » lié à `formCompareAt`.
  - Dans `createPayload` (branche création), ajouter :
```ts
images: formImages,
compareAtPriceMinor: formCompareAt ? Math.round(parseFloat(formCompareAt) * 100) : undefined,
```
  - Réinitialiser `formImages`/`formCompareAt` à l'ouverture du modal de création.
- [ ] **Step 2** — `rm -rf .next/dev && npm run typecheck` → 0
- [ ] **Step 3** — Test manuel dev : créer un produit avec 2 images + prix barré.
- [ ] **Step 4 — Commit** `feat(dashboard): image upload + compare-at price in product create form`

---

### Task 9: Affichage vitrine (vraies images + prix barré)

**Files:**
- Modify: `src/components/product/ProductCard.tsx`, `src/components/product/ProductGallery.tsx`, page produit (`src/app/[locale]/produit/[slug]/page.tsx` ou le composant de prix)

- [ ] **Step 1 — Implémentation** (non-breaking)
  - `ProductCard` : image de couverture = `product.images[0] ?? getProductImageUrl(product, selectedColor)`. Prix : si `product.compareAtEur && product.compareAtEur > product.priceEur` → afficher `<s>{formatPrice(compareAtEur)}</s>` (gris) + `formatPrice(priceEur)`.
  - `ProductGallery` : si `product.images.length > 0` → afficher ces images (image active = `product.images[activeIndex]`, miniatures = `product.images`) ; sinon → comportement actuel inchangé (`getProductImageUrl` + logique `isYahweh`).
  - Page produit : même règle prix barré (réutiliser le composant/prix).
- [ ] **Step 2** — `rm -rf .next/dev && npm run typecheck` → 0
- [ ] **Step 3** — Test manuel : produit avec media → galerie des vraies images ; produit seed → inchangé ; prix barré visible si renseigné.
- [ ] **Step 4 — Commit** `feat(storefront): show uploaded images + strikethrough compare-at price`

---

### Task 10: Image réelle dans la liste produits du dashboard

**Files:**
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`

- [ ] **Step 1 — Implémentation** : le GET `/api/admin/products` (via `CatalogRepository.listProducts`) renvoie désormais `images`. Dans le mapping de la liste, utiliser `p.images?.[0] ?? getProductImage(p.id, cat.fr)` (garde le placeholder actuel en repli). Adapter le type local du produit dashboard pour inclure `images?: string[]`.
- [ ] **Step 2** — `rm -rf .next/dev && npm run typecheck` → 0
- [ ] **Step 3 — Commit** `fix(dashboard): product list uses real uploaded image when present`

---

### Task 11: i18n

**Files:**
- Modify: `messages/fr.json`, `messages/en.json`

- [ ] **Step 1** — Ajouter (namespace du dashboard produits) : « Images », « Ajouter une image », « Envoi… », « Supprimer », « Prix initial (barré) ». Repérer le namespace utilisé par la page produits dashboard et y ajouter les clés fr + en.
- [ ] **Step 2** — Vérifier qu'aucune clé n'est manquante (pas d'erreur console).
- [ ] **Step 3 — Commit** `i18n(dashboard): product images + compare-at price labels`

---

### Task 12: Vérification finale + déploiement

- [ ] **Step 1** — Tests ciblés du périmètre : `npx vitest run src/server/media/cloudinary.test.ts src/server/catalog/repository.test.ts src/server/catalog/storefront.test.ts src/components/admin/ImageUploader.test.tsx src/server/db/schema.test.ts` → vert.
- [ ] **Step 2** — `rm -rf .next/dev && npm run typecheck` → 0.
- [ ] **Step 3** — Commit final éventuel + push `feature/frontend-storefront` (déploiement Vercel). Rappel : `CLOUDINARY_*` doivent être dans Vercel.
- [ ] **Step 4** — Test réel sur la prod : créer un produit avec images + prix barré depuis le dashboard, vérifier l'affichage vitrine.

## Self-Review

- **Couverture spec :** upload signé (T1-T2), product_media (T4), migration prix barré (T3), schéma/repo (T4), type vitrine (T5), API (T6), composant upload (T7), formulaire dashboard (T8), affichage vitrine + prix barré (T9), image liste dashboard (T10), i18n (T11), non-breaking (T5/T9 via `images[0] ?? getProductImageUrl`), env (T2/T12). ✅
- **Placeholders :** aucun ; code réel à chaque étape. Les « repérer le namespace » (T11) / test manuel (T8, T9) sont des étapes d'intégration concrètes.
- **Cohérence des types :** `images: string[]` et `compareAtMinor`/`compareAtEur` traversent repo → storefront → affichage ; `signUpload(params, secret)` (T1) consommé en T2 ; `ImageUploader` props (T7) consommé en T8.

## Hors périmètre (v1)

- Édition des images/prix barré d'un produit existant (create only en v1 ; le repo n'a pas d'`updateProduct`).
- Réordonnancement drag & drop, images liées à une couleur précise.
- Transformations Cloudinary (on stocke `secure_url` brut).
