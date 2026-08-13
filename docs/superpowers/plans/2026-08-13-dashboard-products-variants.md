# Dashboard Produits — Multi-variantes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la gestion des produits du dashboard complète et fiable : créer/modifier des produits avec plusieurs variantes (taille/couleur), chacune avec son stock, images et prix barré éditables, avec reflet immédiat sur la vitrine.

**Architecture:** Prix de base unique par produit (appliqué à toutes les variantes) + stock par variante via `inventory_movements` (append-only). Opérations variantes granulaires (ajouter / ajuster stock / désactiver). Aucune migration DB. Serveur d'abord (repository → API), puis UI.

**Tech Stack:** Next.js 16 (App Router, route handlers), zod, SQLite (dev) + Postgres/Neon (prod) via adaptateur maison, Vitest, React 19 client components, lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-13-dashboard-products-variants-design.md`

## Global Constraints

- **Prix** : un prix de base unique par produit, appliqué à toutes les variantes actives ; prix barré (compare-at) unique. Pas de prix par variante au dashboard.
- **Stock** : par variante, via `inventory_movements` (`reason='initial'` à la création, `'adjustment'` ensuite). `quantity_delta` doit être **≠ 0** (n'insérer un mouvement que si delta ≠ 0).
- **Suppression variante** = désactivation (`active=0`), jamais de DELETE (préserve l'historique).
- **Devise** : `EUR` pour les variantes créées au dashboard.
- **Auth** : chaque route admin renvoie `401` si non connecté, `403` si rôle hors `['owner','manager']` (`requireRole`), `400` sur zod, `404`/`409` via `DomainError`, `500` sinon.
- **Baseline typecheck préexistante : 19 erreurs `TS7016`** (lucide-react/react-icons). « typecheck → 0 » signifie **0 nouvelle erreur** (total reste 19). Nettoyer `.next/dev` avant : `rm -rf .next/dev && npm run typecheck`.
- Tests ciblés : `npx vitest run <fichier> --no-file-parallelism` (le runner est lent/flaky sous charge sur ce poste). Commits fréquents.
- Bilingue fr+en pour toute chaîne UI visible.

## File Structure

- `src/server/catalog/schemas.ts` — ajouter `stock` + `status` aux schémas d'entrée.
- `src/server/catalog/repository.ts` — `createProduct` (stock initial + statut), `addVariant`, `deactivateVariant`, `adjustVariantStock`, `replaceImages`, `setCompareAt`.
- `src/app/api/admin/products/route.ts` — POST étendu (stock/status).
- `src/app/api/admin/products/[id]/route.ts` — PATCH étendu (images, compareAt).
- `src/app/api/admin/products/[id]/variants/route.ts` — **créer** (POST add variant).
- `src/app/api/admin/products/[id]/variants/[variantId]/route.ts` — **créer** (PATCH stock/active).
- `src/app/[locale]/(dashboard)/produits/page.tsx` — UI création/édition multi-variantes.
- Tests : `*.test.ts(x)` associés.

---

### Task 1: Schéma + création avec stock initial par variante et statut

**Files:**
- Modify: `src/server/catalog/schemas.ts`
- Modify: `src/server/catalog/repository.ts` (`createProduct`)
- Test: `src/server/catalog/repository.test.ts`

**Interfaces:**
- Produces: `productVariantInputSchema` gagne `stock: number` (≥0, défaut 0) ; `createProductInputSchema` gagne `status: 'draft'|'active'` (défaut `'active'`). `createProduct` insère le stock initial par variante et applique le statut.

- [ ] **Step 1: Test** — ajouter à `repository.test.ts` (suivre le style des tests existants pour construire une DB en mémoire migrée) :

```ts
it('creates a product with per-variant initial stock and honors status', async () => {
  const repo = new CatalogRepository(db);
  const product = await repo.createProduct({
    id: 'p-multi', categoryId: 'category:homme', slug: 'multi-tee',
    nameFr: 'T', nameEn: 'T', descriptionFr: 'd', descriptionEn: 'd',
    status: 'draft',
    variants: [
      { id: 'v-s', sku: 'SKU-S', size: 'S', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 3 },
      { id: 'v-m', sku: 'SKU-M', size: 'M', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 0 },
    ],
  });
  expect(product.status).toBe('draft');
  const byId = Object.fromEntries(product.variants.map((v) => [v.id, v.stock]));
  expect(byId['v-s']).toBe(3);
  expect(byId['v-m']).toBe(0);
});
```

- [ ] **Step 2:** `npx vitest run src/server/catalog/repository.test.ts --no-file-parallelism` → FAIL (status ignoré / stock 0).

- [ ] **Step 3: Implémentation** — dans `schemas.ts`, ajouter à `productVariantInputSchema` : `stock: z.number().int().nonnegative().default(0),`. Ajouter à `createProductInputSchema` : `status: z.enum(['draft', 'active']).default('active'),`.

Dans `repository.ts` `createProduct`, remplacer le `VALUES (?, ?, ?, ?, ?, ?, ?, 'active')` par un statut paramétré :

```ts
await this.database.prepare(`INSERT INTO products
  (id, category_id, slug, name_fr, name_en, description_fr, description_en, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(input.id, input.categoryId, input.slug, input.nameFr, input.nameEn,
       input.descriptionFr, input.descriptionEn, input.status);
```

Après la boucle d'insertion des variantes, insérer le stock initial :

```ts
const insertMovement = this.database.prepare(`INSERT INTO inventory_movements
  (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`);
for (const variant of input.variants) {
  if (variant.stock > 0) {
    await insertMovement.run(randomUUID(), variant.id, variant.stock);
  }
}
```

(Placer cette boucle **dans** la transaction, avant `COMMIT`.)

- [ ] **Step 4:** relancer le test → PASS. Vérifier aussi que les tests existants de `repository.test.ts` passent toujours.

- [ ] **Step 5: Commit** `feat(catalog): createProduct honors status + per-variant initial stock`

---

### Task 2: Opérations variantes du repository (add / deactivate / adjust stock)

**Files:**
- Modify: `src/server/catalog/repository.ts`
- Test: `src/server/catalog/repository.test.ts`

**Interfaces:**
- Produces:
  - `addVariant(productId: string, input: { sku: string; size: string | null; color: string | null; priceMinor: number; currency: 'EUR'|'GBP'; stock: number }): Promise<string>` — retourne l'id de variante créé.
  - `deactivateVariant(variantId: string): Promise<void>` — `active=0` ; `NOT_FOUND` si 0 ligne.
  - `adjustVariantStock(variantId: string, targetStock: number, actorId: string): Promise<void>` — insère un mouvement `adjustment` si delta ≠ 0 ; `NOT_FOUND` si variante inexistante.

- [ ] **Step 1: Test**

```ts
it('adds, adjusts stock, and deactivates a variant', async () => {
  const repo = new CatalogRepository(db);
  await repo.createProduct({
    id: 'p1', categoryId: 'category:homme', slug: 'p1', nameFr: 'a', nameEn: 'a',
    descriptionFr: '', descriptionEn: '', status: 'active',
    variants: [{ id: 'v1', sku: 'S1', size: 'M', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 2 }],
  });
  const vid = await repo.addVariant('p1', { sku: 'S2', size: 'L', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 5 });
  await repo.adjustVariantStock(vid, 8, 'admin-1');
  let p = await repo.findBySlug('p1', true);
  expect(p!.variants.find((v) => v.id === vid)!.stock).toBe(8);
  await repo.deactivateVariant(vid);
  p = await repo.findBySlug('p1', true);
  expect(p!.variants.some((v) => v.id === vid)).toBe(false); // listProducts ne renvoie que active
});
```

- [ ] **Step 2:** run → FAIL (méthodes absentes).

- [ ] **Step 3: Implémentation** — ajouter à `CatalogRepository`. Note : `listProducts` filtre déjà implicitement via le JOIN sur variantes ; s'assurer que `listProducts` ne renvoie que les variantes `active` (ajouter `WHERE v.active = 1` à la requête variantes de `listProducts`).

```ts
async addVariant(productId: string, input: { sku: string; size: string | null; color: string | null; priceMinor: number; currency: 'EUR' | 'GBP'; stock: number }): Promise<string> {
  const id = randomUUID();
  await this.database.exec('BEGIN IMMEDIATE');
  try {
    await this.database.prepare(`INSERT INTO product_variants
      (id, product_id, sku, size, color, price_minor, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, productId, input.sku, input.size, input.color, input.priceMinor, input.currency);
    if (input.stock > 0) {
      await this.database.prepare(`INSERT INTO inventory_movements
        (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`)
        .run(randomUUID(), id, input.stock);
    }
    await this.database.exec('COMMIT');
  } catch {
    await this.database.exec('ROLLBACK');
    throw new DomainError('CONFLICT', 'Variant SKU already exists');
  }
  return id;
}

async deactivateVariant(variantId: string): Promise<void> {
  const result = await this.database.prepare(
    `UPDATE product_variants SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(variantId);
  if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
}

async adjustVariantStock(variantId: string, targetStock: number, actorId: string): Promise<void> {
  if (!Number.isSafeInteger(targetStock) || targetStock < 0) {
    throw new DomainError('CONFLICT', 'Stock must be a non-negative integer');
  }
  const exists = await this.database.prepare(`SELECT id FROM product_variants WHERE id = ?`).get(variantId);
  if (!exists) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
  const row = (await this.database.prepare(
    `SELECT COALESCE(SUM(quantity_delta), 0) AS stock FROM inventory_movements WHERE variant_id = ?`
  ).get(variantId)) as { stock: number } | undefined;
  const delta = targetStock - (row?.stock ?? 0);
  if (delta !== 0) {
    await this.database.prepare(`INSERT INTO inventory_movements
      (id, variant_id, quantity_delta, reason, actor_id) VALUES (?, ?, ?, 'adjustment', ?)`)
      .run(randomUUID(), variantId, delta, actorId);
  }
}
```

Modifier la requête variantes de `listProducts` pour n'inclure que `v.active = 1` :
`FROM product_variants v LEFT JOIN inventory_movements m ON m.variant_id = v.id WHERE v.active = 1 GROUP BY v.id ORDER BY v.created_at, v.id`.

- [ ] **Step 4:** run → PASS. Vérifier que les tests existants (setBasePrice/setAggregateStock qui filtrent `active=1`) passent toujours.

- [ ] **Step 5: Commit** `feat(catalog): variant add/deactivate/adjust-stock + active-only listing`

---

### Task 3: Images et prix barré du repository (replaceImages / setCompareAt)

**Files:**
- Modify: `src/server/catalog/repository.ts`
- Test: `src/server/catalog/repository.test.ts`

**Interfaces:**
- Produces:
  - `replaceImages(productId: string, urls: string[]): Promise<void>` — remplace toute la galerie.
  - `setCompareAt(productId: string, compareAtMinor: number | null): Promise<void>` — met à jour `compare_at_price_minor` de toutes les variantes actives.

- [ ] **Step 1: Test**

```ts
it('replaces images and sets compare-at price', async () => {
  const repo = new CatalogRepository(db);
  await repo.createProduct({
    id: 'p2', categoryId: 'category:homme', slug: 'p2', nameFr: 'a', nameEn: 'a',
    descriptionFr: '', descriptionEn: '', status: 'active',
    images: ['https://x/1.png'],
    variants: [{ id: 'v', sku: 'S', size: 'M', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 1 }],
  });
  await repo.replaceImages('p2', ['https://x/a.png', 'https://x/b.png']);
  await repo.setCompareAt('p2', 6000);
  const p = await repo.findBySlug('p2', true);
  expect(p!.images).toEqual(['https://x/a.png', 'https://x/b.png']);
  expect(p!.compareAtMinor).toBe(6000);
});
```

- [ ] **Step 2:** run → FAIL.

- [ ] **Step 3: Implémentation**

```ts
async replaceImages(productId: string, urls: string[]): Promise<void> {
  await this.database.exec('BEGIN IMMEDIATE');
  try {
    await this.database.prepare(`DELETE FROM product_media WHERE product_id = ?`).run(productId);
    const insert = this.database.prepare(`INSERT INTO product_media (id, product_id, url, position) VALUES (?, ?, ?, ?)`);
    for (let i = 0; i < urls.length; i += 1) {
      await insert.run(randomUUID(), productId, urls[i], i);
    }
    await this.database.exec('COMMIT');
  } catch (e) {
    await this.database.exec('ROLLBACK');
    throw e;
  }
}

async setCompareAt(productId: string, compareAtMinor: number | null): Promise<void> {
  await this.database.prepare(
    `UPDATE product_variants SET compare_at_price_minor = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND active = 1`
  ).run(compareAtMinor, productId);
}
```

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5: Commit** `feat(catalog): replaceImages + setCompareAt`

---

### Task 4: API POST /products étendu (stock par variante + statut)

**Files:**
- Modify: `src/app/api/admin/products/route.ts`
- Test: `src/app/api/admin/products/route.test.ts` (créer si absent, sinon étendre)

**Interfaces:**
- Consumes: `createProduct` (Task 1).
- Produces: `POST /api/admin/products` accepte `variants[].stock` et `status?`.

- [ ] **Step 1: Test** — vérifier que le `inputSchema` accepte `stock`/`status` et que la création renvoie 201 avec le statut demandé. Suivre le style des tests API existants (mock de `getCurrentAdmin` / DB en mémoire selon la convention du repo — inspecter un test API voisin comme `checkout` ou `stripe-webhook` pour le pattern de mock).

```ts
it('accepts per-variant stock and status', async () => {
  // admin mock = owner ; body avec variants[].stock et status:'draft'
  const res = await POST(makeRequest({
    id: 'p-api', categoryId: 'category:homme', slug: 'p-api', nameFr: 'n', nameEn: 'n',
    descriptionFr: '', descriptionEn: '', status: 'draft',
    variants: [{ id: 'v', sku: 'SK', size: 'M', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 4 }],
  }));
  expect(res.status).toBe(201);
});
```

- [ ] **Step 2:** run → FAIL (schéma rejette `stock`/`status`).

- [ ] **Step 3: Implémentation** — dans `route.ts`, étendre `inputSchema` :

```ts
const inputSchema = z.object({
  categoryId: z.string().min(1), slug: z.string().min(1), nameFr: z.string().min(1),
  nameEn: z.string().min(1), descriptionFr: z.string(), descriptionEn: z.string(),
  images: z.array(z.string().url()).max(6).optional(),
  compareAtPriceMinor: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'active']).optional(),
  variants: z.array(z.object({
    sku: z.string().min(1), size: z.string().nullable(), color: z.string().nullable(),
    priceMinor: z.number().int().nonnegative(), currency: z.enum(['EUR', 'GBP']),
    stock: z.number().int().nonnegative().default(0),
  })).min(1),
});
```

Dans le POST, passer `status: input.status ?? 'active'` et les variantes (avec `id: randomUUID()` et `stock`) à `createProduct`. `createProduct`/`createProductInputSchema` acceptent déjà `status` (défaut) et `stock` (Task 1).

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5: Commit** `feat(api): product create accepts per-variant stock + status`

---

### Task 5: API PATCH /products/[id] étendu (images + prix barré)

**Files:**
- Modify: `src/app/api/admin/products/[id]/route.ts`
- Test: `src/app/api/admin/products/[id]/route.test.ts` (créer/étendre)

**Interfaces:**
- Consumes: `replaceImages`, `setCompareAt` (Task 3).
- Produces: `PATCH /products/[id]` accepte `images?: string[]` (URLs) et `compareAtPriceMinor?: number | null`.

- [ ] **Step 1: Test** — PATCH avec `images` + `compareAtPriceMinor` renvoie `{ ok: true }` et met à jour la galerie/le prix barré (vérifier via `GET`/repo).

- [ ] **Step 2:** run → FAIL.

- [ ] **Step 3: Implémentation** — étendre `patchSchema` :

```ts
images: z.array(z.string().url()).max(6).optional(),
compareAtPriceMinor: z.number().int().nonnegative().nullable().optional(),
```

Dans le bloc transactionnel du PATCH, après les updates produits/prix/stock existants :

```ts
if (body.images !== undefined) await new CatalogRepository(db).replaceImages(id, body.images);
if (body.compareAtPriceMinor !== undefined) await new CatalogRepository(db).setCompareAt(id, body.compareAtPriceMinor);
```

(Rester dans la transaction `BEGIN IMMEDIATE`/`COMMIT` déjà en place.)

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5: Commit** `feat(api): product PATCH updates images + compare-at price`

---

### Task 6: API endpoints variantes

**Files:**
- Create: `src/app/api/admin/products/[id]/variants/route.ts`
- Create: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`
- Test: `src/app/api/admin/products/[id]/variants/route.test.ts`

**Interfaces:**
- Consumes: `addVariant`, `adjustVariantStock`, `deactivateVariant` (Task 2).
- Produces:
  - `POST /api/admin/products/[id]/variants` body `{ size: string|null, color: string|null, stock: number, priceMinor?: number }` → `{ id }` 201.
  - `PATCH /api/admin/products/[id]/variants/[variantId]` body `{ stock?: number, active?: boolean }` → `{ ok: true }`.

- [ ] **Step 1: Test** — POST crée une variante (201, renvoie `id`) ; PATCH avec `{stock}` ajuste ; PATCH avec `{active:false}` désactive ; 401 sans admin ; 403 rôle `staff`.

- [ ] **Step 2:** run → FAIL (routes absentes).

- [ ] **Step 3: Implémentation** — `variants/route.ts` :

```ts
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const schema = z.object({
  size: z.string().trim().min(1).nullable(),
  color: z.string().trim().min(1).nullable(),
  stock: z.number().int().nonnegative().default(0),
  priceMinor: z.number().int().nonnegative().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const body = schema.parse(await request.json());
    const db = await getCommerceDatabase();
    const repo = new CatalogRepository(db);
    const existing = (await repo.listProducts({ includeArchived: true })).find((p) => p.id === id);
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    const priceMinor = body.priceMinor ?? existing.variants[0]?.priceMinor ?? 0;
    const sku = `DIVINEXPRESS-${existing.slug.toUpperCase()}-${randomUUID().slice(0, 8)}`;
    const variantId = await repo.addVariant(id, {
      sku, size: body.size, color: body.color, priceMinor, currency: 'EUR', stock: body.stock,
    });
    return NextResponse.json({ id: variantId }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'VARIANT_CREATE_FAILED' }, { status: 500 });
  }
}
```

`variants/[variantId]/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const schema = z.object({
  stock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { variantId } = await params;
    const body = schema.parse(await request.json());
    const db = await getCommerceDatabase();
    const repo = new CatalogRepository(db);
    if (body.stock !== undefined) await repo.adjustVariantStock(variantId, body.stock, admin.id);
    if (body.active === false) await repo.deactivateVariant(variantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'VARIANT_UPDATE_FAILED' }, { status: 500 });
  }
}
```

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5: Commit** `feat(api): admin variant endpoints (add / adjust-stock / deactivate)`

---

### Task 7: UI création multi-variantes + statut honoré

**Files:**
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/products` étendu (Task 4).

**Contexte :** le formulaire actuel fige une variante `{ size:'M', color:'Noir' }` et fait un 2ᵉ PATCH pour le stock. On remplace par une liste dynamique de variantes envoyée en une fois.

- [ ] **Step 1:** Ajouter l'état des variantes du formulaire, sous les autres `useState` :

```tsx
type VariantRow = { size: string; color: string; stock: string };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];
const [formVariants, setFormVariants] = useState<VariantRow[]>([{ size: 'M', color: 'Noir', stock: '' }]);
```

Réinitialiser dans `openCreateModal` : `setFormVariants([{ size: 'M', color: 'Noir', stock: '' }]);`

- [ ] **Step 2:** Handlers d'édition de la liste :

```tsx
const addVariantRow = () => setFormVariants((rows) => [...rows, { size: 'M', color: 'Noir', stock: '' }]);
const removeVariantRow = (i: number) => setFormVariants((rows) => rows.filter((_, idx) => idx !== i));
const updateVariantRow = (i: number, patch: Partial<VariantRow>) =>
  setFormVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
```

- [ ] **Step 3:** Dans `handleSaveProduct`, branche création (`!editingProduct`), remplacer le `variants: [ ... M/Noir ... ]` figé et le 2ᵉ PATCH stock par la construction depuis `formVariants` :

```tsx
const variants = formVariants.map((v, idx) => ({
  id: `var-${uniqueId}-${idx}`,
  sku: `${sku}-${v.size}-${idx}`,
  size: v.size === 'Unique' ? null : v.size,
  color: v.color || null,
  priceMinor: priceMinorValue,
  currency: 'EUR' as const,
  stock: parseInt(v.stock) || 0,
}));
const createPayload = {
  id: uniqueId, categoryId: formCategoryId, slug,
  nameFr: formName, nameEn: formNameEn || formName,
  descriptionFr: formDescriptionFr, descriptionEn: formDescriptionEn || formDescriptionFr,
  images: formImages,
  compareAtPriceMinor: formCompareAt ? Math.round(parseFloat(formCompareAt) * 100) : undefined,
  status: formStatus,
  variants,
};
res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createPayload) });
// (supprimer le bloc de 2ᵉ PATCH stock)
```

- [ ] **Step 4:** UI — remplacer le champ « Stock de départ » unique (création) par la liste de variantes (le champ Stock global reste pour l'édition — voir Task 8). Sous le prix, quand `!editingProduct` :

```tsx
<div className="space-y-2">
  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
    {systemLocale === 'fr' ? 'Variantes (taille / couleur / stock)' : 'Variants (size / color / stock)'}
  </span>
  {formVariants.map((v, i) => (
    <div key={i} className="flex items-center gap-2">
      <select value={v.size} onChange={(e) => updateVariantRow(i, { size: e.target.value })} className="h-10 px-2 border border-slate-200 rounded-lg text-xs">
        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input value={v.color} onChange={(e) => updateVariantRow(i, { color: e.target.value })} placeholder={systemLocale === 'fr' ? 'Couleur' : 'Color'} className="h-10 px-2 border border-slate-200 rounded-lg text-xs flex-1" />
      <input type="number" min="0" value={v.stock} onChange={(e) => updateVariantRow(i, { stock: e.target.value })} placeholder="Stock" className="h-10 px-2 border border-slate-200 rounded-lg text-xs w-24" />
      {formVariants.length > 1 && (
        <button type="button" onClick={() => removeVariantRow(i)} aria-label="remove" className="p-2 text-admin-muted hover:text-admin-error"><X className="size-4" /></button>
      )}
    </div>
  ))}
  <button type="button" onClick={addVariantRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
    + {systemLocale === 'fr' ? 'Ajouter une variante' : 'Add a variant'}
  </button>
</div>
```

- [ ] **Step 5:** Vérif : `rm -rf .next/dev && npm run typecheck` → 0 nouvelle erreur. Commit `feat(dashboard): multi-variant product create form + honored status`.

---

### Task 8: UI édition (images + prix barré + variantes) + fiabilité

**Files:**
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`

**Interfaces:**
- Consumes: `PATCH /products/[id]` étendu (Task 5), endpoints variantes (Task 6).

- [ ] **Step 1:** Étendre `ProductItem` et le mapping `refreshProducts` pour porter les variantes (`variants: { id; size; color; stock }[]`) et les images (`images: string[]`), afin de les charger en édition :

```tsx
// dans le map de refreshProducts :
variants: (p.variants ?? []).map((v: any) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock ?? 0 })),
images: p.images ?? [],
```

(Adapter le type `ProductItem` et `CatalogProductRaw` en conséquence : `variants` doit inclure `id`, `size`, `color`, `stock`.)

- [ ] **Step 2:** En édition (`openEditModal`), pré-remplir `setFormImages(product.images)`, `setFormCompareAt('')` (le prix barré courant n'est pas exposé par l'API GET — laisser vide = inchangé sauf saisie), et exposer désormais l'`ImageUploader` **et** le champ prix barré **aussi en édition** (retirer les gardes `!editingProduct` autour de ces deux blocs).

- [ ] **Step 3:** En édition, dans `handleSaveProduct`, inclure `images` et `compareAtPriceMinor` dans le `payload` PATCH :

```tsx
const payload = {
  categoryId: formCategoryId, nameFr: formName, nameEn: formNameEn || formName,
  descriptionFr: formDescriptionFr, descriptionEn: formDescriptionEn || formDescriptionFr,
  status: formStatus, priceMinor: priceMinorValue,
  images: formImages,
  ...(formCompareAt ? { compareAtPriceMinor: Math.round(parseFloat(formCompareAt) * 100) } : {}),
};
```

- [ ] **Step 4:** Section variantes en édition — sous le formulaire, quand `editingProduct`, lister ses variantes avec stock éditable + désactiver, et un bouton ajouter :

```tsx
{editingProduct && (
  <div className="space-y-2">
    <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Variantes</span>
    {editingProduct.variants.map((v) => (
      <div key={v.id} className="flex items-center gap-2">
        <span className="text-xs flex-1">{v.size ?? 'Unique'} / {v.color ?? '—'}</span>
        <input type="number" min="0" defaultValue={v.stock}
          onBlur={(e) => adjustVariantStock(editingProduct.id, v.id, parseInt(e.target.value) || 0)}
          className="h-9 px-2 border border-slate-200 rounded-lg text-xs w-24" />
        <button type="button" onClick={() => deactivateVariant(editingProduct.id, v.id)} className="p-2 text-admin-muted hover:text-admin-error"><Trash2 className="size-4" /></button>
      </div>
    ))}
    <button type="button" onClick={() => addVariant(editingProduct.id)} className="text-xs font-bold text-indigo-600">+ {systemLocale === 'fr' ? 'Ajouter une variante' : 'Add a variant'}</button>
  </div>
)}
```

Avec les handlers (appellent les endpoints Task 6, puis `refreshProducts()`), en affichant une erreur en cas d'échec :

```tsx
const adjustVariantStock = async (pid: string, vid: string, stock: number) => {
  const r = await fetch(`/api/admin/products/${pid}/variants/${vid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }) });
  if (!r.ok) alert(systemLocale === 'fr' ? 'Échec ajustement stock' : 'Stock update failed'); else refreshProducts();
};
const deactivateVariant = async (pid: string, vid: string) => {
  if (!confirm(systemLocale === 'fr' ? 'Désactiver cette variante ?' : 'Deactivate this variant?')) return;
  const r = await fetch(`/api/admin/products/${pid}/variants/${vid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }) });
  if (!r.ok) alert(systemLocale === 'fr' ? 'Échec' : 'Failed'); else refreshProducts();
};
const addVariant = async (pid: string) => {
  const size = prompt(systemLocale === 'fr' ? 'Taille (XS..XXL ou Unique)' : 'Size') ?? '';
  if (!size) return;
  const color = prompt(systemLocale === 'fr' ? 'Couleur' : 'Color') ?? 'Noir';
  const stock = parseInt(prompt(systemLocale === 'fr' ? 'Stock' : 'Stock') ?? '0') || 0;
  const r = await fetch(`/api/admin/products/${pid}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ size: size === 'Unique' ? null : size, color, stock }) });
  if (!r.ok) alert(systemLocale === 'fr' ? 'Échec ajout variante' : 'Add failed'); else refreshProducts();
};
```

- [ ] **Step 5:** Fiabilité + icône : remplacer l'icône `Eye` du bouton éditer par `Pencil` (importer depuis `lucide-react`) ; dans `refreshProducts`, remplacer `.catch(() => undefined)` par un état d'erreur affiché (`setLoadError(true)` + bandeau) OU un `alert` clair. Vérif `typecheck` → 0 nouvelle. Commit `feat(dashboard): edit images/compare-at + variant management + error surfacing`.

---

### Task 9: Vérification vitrine (variantes → tailles/couleurs, stock, panier)

**Files:**
- Test: `src/server/catalog/storefront.test.ts`
- (Correctif éventuel: `src/server/catalog/storefront.ts` ou la résolution de variante au checkout, si un écart est trouvé.)

**Interfaces:**
- Consumes: `StorefrontCatalog.list` / `toStorefrontProduct`.

- [ ] **Step 1: Test** — un produit multi-variantes actif expose ses tailles/couleurs et exclut les variantes inactives :

```ts
it('maps active variants to sizes/colors and sums stock', async () => {
  const repo = new CatalogRepository(db);
  await repo.createProduct({
    id: 'sp', categoryId: 'category:homme', slug: 'sp', nameFr: 'A', nameEn: 'A',
    descriptionFr: '', descriptionEn: '', status: 'active',
    variants: [
      { id: 'a', sku: 'A', size: 'S', color: 'Noir', priceMinor: 5000, currency: 'EUR', stock: 2 },
      { id: 'b', sku: 'B', size: 'M', color: 'Blanc', priceMinor: 5000, currency: 'EUR', stock: 3 },
    ],
  });
  const [p] = await new StorefrontCatalog(db).list();
  expect(p.sizes.sort()).toEqual(['M', 'S']);
  expect(p.colors.sort()).toEqual(['Blanc', 'Noir']);
  expect(p.availableQuantity).toBe(5);
});
```

- [ ] **Step 2:** run → doit PASSER si le mapping est déjà correct (Task 2 a filtré `active=1`). Sinon, corriger `toStorefrontProduct`/`list`.

- [ ] **Step 3: Revue résolution panier** — inspecter la fiche produit (`src/components/product/ProductDetailView.tsx`) et la route checkout (`src/app/api/checkout/route.ts` + `server/checkout/service.ts`) : la sélection taille/couleur doit résoudre la **bonne variante** et vérifier son stock. Documenter le constat. Si un écart réel existe (mauvaise variante / stock ignoré), ajouter un test rouge + correctif minimal ici.

- [ ] **Step 4:** run les tests touchés → PASS. `rm -rf .next/dev && npm run typecheck` → 0 nouvelle.
- [ ] **Step 5: Commit** `test(catalog): storefront multi-variant mapping (+ checkout variant resolution fix if needed)`

---

## Self-Review (rempli par l'auteur du plan)

- **Couverture spec :** création multi-variantes (T1,T4,T7), stock par variante (T1,T2,T6,T8), édition images/compareAt (T3,T5,T8), opérations variantes (T2,T6,T8), statut honoré (T1,T4,T7), fiabilité/erreurs+icône (T8), reflet vitrine (T9). ✓
- **Placeholders :** aucun — code réel à chaque étape. Les blocs UI donnent le code exact à insérer.
- **Cohérence des types :** `addVariant`/`adjustVariantStock`/`deactivateVariant`/`replaceImages`/`setCompareAt` définis en T2/T3 et consommés en T5/T6/T8 avec les mêmes signatures.
- **Point ouvert honnête :** T9 Step 3 peut révéler un correctif checkout — borné à ce sous-projet.
