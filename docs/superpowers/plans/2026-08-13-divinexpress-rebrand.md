# Rebrand Reign → DivinExpress — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer toutes les mentions visibles et fonctionnelles de « Reign » par « DivinExpress » (texte, config, identifiants internes), sans changer le concept business ni casser les tests.

**Architecture:** Remplacement ciblé fichier par fichier, en respectant la casse. Les tests qui asservissent une valeur « reign » sont mis à jour AVANT le code (cycle échec→correction). Les chaînes d'affichage sans test sont vérifiées par `typecheck` + `grep`. Les chemins d'images logo sont volontairement conservés (vrais logos = phase ultérieure).

**Tech Stack:** Next.js 16 (App Router), next-intl, Vitest, TypeScript, Tailwind v4, SQLite (dev) / Postgres-Neon (prod).

## Global Constraints

- Formes de casse : `Reign`→`DivinExpress`, `REIGN`→`DIVINEXPRESS`, `reign`→`divinexpress`.
- Domaine : `https://divinexpress.fr`. Emails : `contact@divinexpress.fr` (général), `support@divinexpress.fr` (support admin).
- **NE PAS toucher** : les chemins d'images `/branding/logo-reign.png`, `/branding/logo-reign-white.png`, `/image/reign-admin-hoodie.png` (fichiers et références) ; les docs `docs/superpowers/plans|specs/**`, `HANDOFF.md`, `docs/audits/**`, `docs/autonomous-fullstack-handoff.md`, `docs/deploiement-o2switch.md`.
- **Politique de test** : si une valeur « reign » est asservie par un test → MAJ du test d'abord (il échoue), puis du code (il repasse). Si la chaîne est purement d'affichage et non testée → édition + `typecheck`/`grep`, sans fabriquer de test trivial.
- Commits fréquents, un par tâche.
- Nettoyage `.next/dev` avant `typecheck` (un serveur dev laisse un artefact qui corrompt le typecheck). Bash : `rm -rf .next/dev`. PowerShell : `Remove-Item -Recurse -Force .next\dev -ErrorAction SilentlyContinue`.
- **Baseline typecheck préexistante : 19 erreurs `TS7016`**, toutes sur `lucide-react` et `react-icons` (déclarations de types manquantes, sans rapport avec le rebrand). Quand une étape dit « typecheck → 0 », lire **« 0 NOUVELLE erreur au-delà de ces 19 »** (le total doit rester à 19). Ne PAS chercher à corriger ces 19 ici — c'est hors périmètre (voir note propriétaire).
- **Prérequis d'environnement (déjà appliqué) :** le lockfile a été restauré à l'état commité et `npm install` relancé pour réinstaller `@testing-library/dom` (une modif lockfile héritée l'avait retiré, cassant les exports `screen`/`waitFor`/… des tests). Si les tests réclament à nouveau ces exports, relancer `npm install`.
- Vérification finale (Task 8) : `npm run test` vert · `typecheck` → 0 · `grep -ri reign src messages` ne laisse QUE les 3 chemins d'images ci-dessus.

## Pré-vol (état de l'arbre de travail)

Avant de commencer : `package.json` et `package-lock.json` portent déjà une modification non commitée héritée d'antigravity (`"dev": "next dev --webpack"` + lockfile allégé). La **Task 1 modifie `package.json`**. Résoudre d'abord cet état (committer ou mettre de côté cette modif `--webpack`) pour garder les commits du rebrand propres. Décision à confirmer avec le propriétaire du repo — voir handoff.

## Structure des fichiers

Aucun fichier créé. Modifications regroupées par responsabilité :
- **Config/identité** : `package.json`, `.env.example`, `db/client.ts`, `connexion/actions.ts`.
- **Identifiants de stockage/session** : 4 contexts + tests, `CookieBanner`, `paiement/page.tsx`, `admin/repository.ts`, `auth/runtime.ts`, `auth/logout/route.ts`.
- **Contenu i18n** : `messages/fr.json`, `messages/en.json`, `legalText.test.ts`.
- **SEO/metadata** : `seo.ts`, `layout.tsx`, `page.tsx`, `produit/[slug]/page.tsx`.
- **Contact/IA/paiement** : `contactInfo.ts`, `ai/agent.ts`, `ai/rules.ts`, `stripe-provider.ts`, `genius-provider.ts`.
- **Catalogue** : `products.ts`.
- **UI marque + polices** : `Logo.tsx`, `Footer.tsx`(+test), `AdminShell.tsx`, `AdminSidebar.tsx`, `LoginPanel.tsx`, pages dashboard, `api/admin/settings`, `globals.css`, `fonts.ts`.
- **Fixtures de test résiduelles** : `auth.test.ts`, `schema.test.ts`, `orders/service.test.ts`, `checkout.test.ts`, `cloudinary.test.ts`, `ImageUploader.test.tsx`.

---

### Task 1: Config, packaging & identité seed

**Files:**
- Modify: `package.json` (champ `name`)
- Modify: `.env.example` (commentaire URL prod, `DATABASE_URL`, `SEED_ADMIN_EMAIL`)
- Modify: `src/server/db/client.ts:71` (chemin DB par défaut)
- Modify: `src/app/[locale]/(auth)/connexion/actions.ts:24` (fallback email seed)

- [ ] **Step 1 — Éditer `package.json`** : `"name": "reign"` → `"name": "divinexpress"`.
- [ ] **Step 2 — Éditer `.env.example`** :
  - Commentaire `# Production (o2switch): https://reign.webmodernseo.co` → `# Production (Vercel): https://divinexpress.fr`
  - `DATABASE_URL=file:./data/reign.db` → `DATABASE_URL=file:./data/divinexpress.db`
  - `SEED_ADMIN_EMAIL=admin@reign.local` → `SEED_ADMIN_EMAIL=admin@divinexpress.local`
- [ ] **Step 3 — Éditer `src/server/db/client.ts:71`** : la valeur par défaut `'file:./data/reign.db'` → `'file:./data/divinexpress.db'`.
- [ ] **Step 4 — Éditer `connexion/actions.ts:24`** : `|| 'admin@reign.local'` → `|| 'admin@divinexpress.local'`.
- [ ] **Step 5 — Régénérer le lockfile** : `npm install` (met à jour le `name` dans `package-lock.json`).
- [ ] **Step 6 — Typecheck** : `rm -rf .next/dev && npm run typecheck` → Attendu : 0 erreur.
- [ ] **Step 7 — Commit**
```bash
git add package.json package-lock.json .env.example src/server/db/client.ts "src/app/[locale]/(auth)/connexion/actions.ts"
git commit -m "chore(rebrand): package name, env defaults, DB path, seed email -> divinexpress"
```

---

### Task 2: Identifiants de stockage & cookie de session admin

**Files:**
- Test: `src/context/CartContext.test.tsx`, `src/context/FavoritesContext.test.tsx`, `src/context/CurrencyContext.test.tsx`, `src/context/CheckoutContext.test.tsx`
- Modify: `src/context/CartContext.tsx:14`, `src/context/FavoritesContext.tsx:7`, `src/context/CurrencyContext.tsx:6`, `src/context/CheckoutContext.tsx:6`, `src/app/[locale]/commande/paiement/page.tsx:69`, `src/components/layout/CookieBanner.tsx:7`, `src/lib/admin/repository.ts:4`, `src/server/auth/runtime.ts:6`, `src/app/api/auth/logout/route.ts:5`

**Interfaces:**
- Le cookie `ADMIN_SESSION_COOKIE` (`runtime.ts`) et le regex de `logout/route.ts` doivent porter la **même** valeur : `divinexpress_admin_session`.

- [ ] **Step 1 — MAJ des tests (asservissent les clés localStorage)** :
  - `CartContext.test.tsx` : les 3 `'reign-cart'` → `'divinexpress-cart'`
  - `FavoritesContext.test.tsx` : les 3 `'reign-favorites-v2'` → `'divinexpress-favorites-v2'`
  - `CurrencyContext.test.tsx` : les 3 `'reign-currency'` → `'divinexpress-currency'`
  - `CheckoutContext.test.tsx:6` : `const STORAGE_KEY = 'reign-checkout-shipping'` → `'divinexpress-checkout-shipping'`
- [ ] **Step 2 — Lancer ces tests → FAIL** :
```bash
npx vitest run src/context/CartContext.test.tsx src/context/FavoritesContext.test.tsx src/context/CurrencyContext.test.tsx src/context/CheckoutContext.test.tsx
```
Attendu : échecs (le code utilise encore les clés `reign-*`).
- [ ] **Step 3 — MAJ du code (clés + cookie)** :
  - `CartContext.tsx:14` `'reign-cart'` → `'divinexpress-cart'`
  - `FavoritesContext.tsx:7` `'reign-favorites-v2'` → `'divinexpress-favorites-v2'`
  - `CurrencyContext.tsx:6` `'reign-currency'` → `'divinexpress-currency'`
  - `CheckoutContext.tsx:6` `'reign-checkout-shipping'` → `'divinexpress-checkout-shipping'`
  - `paiement/page.tsx:69` `'reign-checkout-idempotency'` → `'divinexpress-checkout-idempotency'`
  - `CookieBanner.tsx:7` `'reign-cookie-consent'` → `'divinexpress-cookie-consent'`
  - `admin/repository.ts:4` `'reign:admin-demo:v1'` → `'divinexpress:admin-demo:v1'`
  - `auth/runtime.ts:6` `'reign_admin_session'` → `'divinexpress_admin_session'`
  - `logout/route.ts:5` regex `reign_admin_session=` → `divinexpress_admin_session=`
- [ ] **Step 4 — Lancer les tests → PASS** :
```bash
npx vitest run src/context/ src/server/auth/
```
Attendu : tous verts.
- [ ] **Step 5 — Typecheck** : `rm -rf .next/dev && npm run typecheck` → 0.
- [ ] **Step 6 — Commit**
```bash
git add src/context/ "src/app/[locale]/commande/paiement/page.tsx" src/components/layout/CookieBanner.tsx src/lib/admin/repository.ts src/server/auth/runtime.ts src/app/api/auth/logout/route.ts
git commit -m "refactor(rebrand): storage keys + admin session cookie -> divinexpress"
```

---

### Task 3: Catalogues de traduction (i18n)

**Files:**
- Modify: `messages/fr.json`, `messages/en.json`
- Test: `src/lib/legalText.test.ts:6-7` (fixture)

Ces deux fichiers ne contiennent AUCUN chemin d'image → remplacement scopé sûr.

- [ ] **Step 1 — MAJ fixture `legalText.test.ts`** : `'Le Site est édité par Reign SAS.'` → `'Le Site est édité par DivinExpress SAS.'` (les deux occurrences lignes 6-7). `parseLegalText` est agnostique au contenu : le test reste vert (fixture cosmétique).
- [ ] **Step 2 — Remplacement scopé dans les messages** (ordre important) :
```bash
perl -pi -e 's/REIGN10/DIVINEXPRESS10/g; s/contact\@reign\.example/contact\@divinexpress.fr/g; s/Reign/DivinExpress/g;' messages/fr.json messages/en.json
```
Couvre : nom de marque, code promo, mentions légales « Reign SAS », emails légaux `contact@reign.example`, textes éditoriaux/À propos.
- [ ] **Step 3 — Vérifier 0 résidu dans les messages** :
```bash
grep -in "reign" messages/fr.json messages/en.json
```
Attendu : aucune sortie.
- [ ] **Step 4 — Valider parsing + typecheck** :
```bash
npx vitest run src/lib/legalText.test.ts
rm -rf .next/dev && npm run typecheck
```
Attendu : test vert, typecheck 0. (JSON valide — `perl` ne modifie que les valeurs textuelles.)
- [ ] **Step 5 — Commit**
```bash
git add messages/fr.json messages/en.json src/lib/legalText.test.ts
git commit -m "i18n(rebrand): brand, promo code, legal entity + emails -> DivinExpress"
```

---

### Task 4: SEO, metadata & JSON-LD

**Files:**
- Modify: `src/lib/seo.ts:4,40` (SITE_URL, nom Organization — **conserver** le chemin logo ligne 42)
- Modify: `src/app/[locale]/layout.tsx:21-22` (title/description)
- Modify: `src/app/[locale]/page.tsx:82` (nom fil d'Ariane)
- Modify: `src/app/[locale]/produit/[slug]/page.tsx:58` (nom fil d'Ariane)

- [ ] **Step 1 — `seo.ts`** :
  - Ligne 4 : `export const SITE_URL = 'https://www.reign-example.com';` → `export const SITE_URL = 'https://divinexpress.fr';`
  - Ligne 40 : `name: 'Reign',` → `name: 'DivinExpress',`
  - Ligne 42 : **NE PAS toucher** `logo: \`${SITE_URL}/branding/logo-reign.png\``.
- [ ] **Step 2 — `layout.tsx`** : `title: 'Reign'` → `title: 'DivinExpress'` ; `description: 'Reign — vêtements et accessoires premium.'` → `description: 'DivinExpress — vêtements et accessoires premium.'`.
- [ ] **Step 3 — `page.tsx:82`** : `{ name: 'Reign', url: ... }` → `{ name: 'DivinExpress', url: ... }`.
- [ ] **Step 4 — `produit/[slug]/page.tsx:58`** : `{ name: 'Reign', url: ... }` → `{ name: 'DivinExpress', url: ... }`.
- [ ] **Step 5 — Typecheck + grep ciblé** :
```bash
rm -rf .next/dev && npm run typecheck
grep -in "reign" src/lib/seo.ts src/app/[locale]/layout.tsx src/app/[locale]/page.tsx "src/app/[locale]/produit/[slug]/page.tsx"
```
Attendu : typecheck 0 ; grep ne laisse que le chemin logo dans `seo.ts`.
- [ ] **Step 6 — Commit**
```bash
git add src/lib/seo.ts "src/app/[locale]/layout.tsx" "src/app/[locale]/page.tsx" "src/app/[locale]/produit/[slug]/page.tsx"
git commit -m "feat(rebrand): SITE_URL divinexpress.fr + brand in metadata/JSON-LD"
```

---

### Task 5: Contact, persona IA & libellés de paiement

**Files:**
- Modify: `src/lib/contactInfo.ts:7,11-12` (email + messages WhatsApp)
- Modify: `src/server/ai/agent.ts:57,72,77` (persona/équipe)
- Modify: `src/server/ai/rules.ts:88-89` (message d'accueil)
- Modify: `src/server/payments/stripe-provider.ts:27` (libellé commande — **visible client**)
- Modify: `src/server/payments/genius-provider.ts:27` (description — **visible client**)

- [ ] **Step 1 — `contactInfo.ts`** :
  - Ligne 7 : `email: 'contact@reign.webmodernseo.co'` → `email: 'contact@divinexpress.fr'`
  - Ligne 11 : `'Bonjour Reign, j'aimerais avoir des informations.'` → `'Bonjour DivinExpress, j'aimerais avoir des informations.'`
  - Ligne 12 : `'Hello Reign, I would like some information.'` → `'Hello DivinExpress, I would like some information.'`
- [ ] **Step 2 — `ai/agent.ts`** : remplacer chaque `Reign` (lignes 57, 72, 77 : « assistant commercial IA de Reign », « l'équipe Reign », « Signe implicitement en tant que Reign ») → `DivinExpress`. Conserver le reste du texte (concept premium, pièce YAHWEH).
- [ ] **Step 3 — `ai/rules.ts:88-89`** : `l'assistant Reign` → `l'assistant DivinExpress` (fr) et `the Reign assistant` → `the DivinExpress assistant` (en).
- [ ] **Step 4 — `stripe-provider.ts:27`** : `` `Reign Order #${request.orderNumber}` `` → `` `DivinExpress Order #${request.orderNumber}` ``.
- [ ] **Step 5 — `genius-provider.ts:27`** : `` `Reign Order #${request.orderNumber}` `` → `` `DivinExpress Order #${request.orderNumber}` ``.
- [ ] **Step 6 — Tests providers + typecheck** :
```bash
npx vitest run src/server/payments/ src/server/ai/
rm -rf .next/dev && npm run typecheck
```
Attendu : verts (aucun test n'asserte le libellé), typecheck 0.
- [ ] **Step 7 — Commit**
```bash
git add src/lib/contactInfo.ts src/server/ai/agent.ts src/server/ai/rules.ts src/server/payments/stripe-provider.ts src/server/payments/genius-provider.ts
git commit -m "feat(rebrand): contact email, AI persona, payment order labels -> DivinExpress"
```

---

### Task 6: Données catalogue

**Files:**
- Modify: `src/lib/products.ts:183,267-268,283-284,299-300`

- [ ] **Step 1 — Éditer `products.ts`** :
  - Ligne 183 : `{ fr: 'T-shirt graphique Reign', en: 'Reign graphic t-shirt' }` → `{ fr: 'T-shirt graphique DivinExpress', en: 'DivinExpress graphic t-shirt' }`
  - Lignes 267-268 : `'... boucle métal brossé gravée Reign.'` / `'... brushed metal buckle engraved Reign.'` → `DivinExpress`
  - Lignes 283-284 : `'... gravure minimaliste Reign.'` / `'... minimalist Reign engraving.'` → `DivinExpress`
  - Lignes 299-300 : `'... patch Reign discret.'` / `'... discreet Reign patch.'` → `DivinExpress`
- [ ] **Step 2 — Tests catalogue + typecheck** :
```bash
npx vitest run src/lib/
rm -rf .next/dev && npm run typecheck
grep -in "reign" src/lib/products.ts
```
Attendu : verts, typecheck 0, grep sans sortie.
- [ ] **Step 3 — Commit**
```bash
git add src/lib/products.ts
git commit -m "content(rebrand): product names + engravings -> DivinExpress"
```

---

### Task 7: UI marque (vitrine + back-office) & variables de police

**Files:**
- Modify (texte, **conserver les `src` d'images**) : `src/components/ui/Logo.tsx:6,9`, `src/components/layout/Footer.tsx:71`, `src/components/admin/AdminShell.tsx:47`, `src/components/admin/AdminSidebar.tsx:89`, `src/components/admin/LoginPanel.tsx:22,26,32,58,145,156`
- Modify (dashboard) : `src/app/[locale]/(dashboard)/produits/page.tsx:218` (préfixe SKU), `src/app/[locale]/(dashboard)/clients/page.tsx:74-75`, `src/app/[locale]/(dashboard)/parametres/page.tsx:43-44,286`, `src/app/api/admin/settings/route.ts:38-39`
- Modify (polices couplées) : `src/lib/fonts.ts:8,14`, `src/app/globals.css:9,37-38`
- Test: `src/components/layout/Footer.test.tsx:100`

**Interfaces:**
- Les noms de variables CSS de `fonts.ts` (`--divinexpress-font-serif`, `--divinexpress-font-sans`) doivent correspondre EXACTEMENT à ce que `globals.css` consomme.

- [ ] **Step 1 — MAJ test `Footer.test.tsx:100`** : `getByAltText('Reign')` → `getByAltText('DivinExpress')` ; **conserver** l'attribut `src` attendu `'/branding/logo-reign.png'`.
- [ ] **Step 2 — Lancer → FAIL** : `npx vitest run src/components/layout/Footer.test.tsx` (le code a encore `alt="Reign"`).
- [ ] **Step 3 — Textes vitrine (conserver les `src`)** :
  - `Logo.tsx:6` `aria-label="Reign — accueil"` → `aria-label="DivinExpress — accueil"` ; `:9` `alt="Reign"` → `alt="DivinExpress"` ; **garder** `src="/branding/logo-reign.png"`.
  - `Footer.tsx:71` `alt="Reign"` → `alt="DivinExpress"` ; garder le `src`.
- [ ] **Step 4 — Textes back-office (conserver les `src`)** :
  - `AdminShell.tsx:47` `alt="Reign"` → `alt="DivinExpress"` ; garder `src` ligne 46.
  - `AdminSidebar.tsx:89` texte `REIGN` → `DIVINEXPRESS`.
  - `LoginPanel.tsx` : `:22` `alt="Hoodie noir Reign suspendu"` → `alt="Hoodie noir DivinExpress suspendu"` (garder `src`) ; `:26` `REIGN` → `DIVINEXPRESS` ; `:32` `REIGN BACK OFFICE` → `DIVINEXPRESS BACK OFFICE` ; `:58` `alt="Reign"` → `alt="DivinExpress"` (garder `src` ligne 57) ; `:145` `mailto:support@reign.com` → `mailto:support@divinexpress.fr` ; `:156` `© 2026 Reign` → `© 2026 DivinExpress`.
- [ ] **Step 5 — Dashboard** :
  - `produits/page.tsx:218` `` `REIGN-${slug.toUpperCase()}-...` `` → `` `DIVINEXPRESS-${slug.toUpperCase()}-...` `` ; **NE PAS toucher** la ligne 39 (chemin image).
  - `clients/page.tsx:74-75` « boutique Reign » (fr) / « Reign boutique » (en) → « boutique DivinExpress » / « DivinExpress boutique ».
  - `parametres/page.tsx:43` `shop_name: 'Reign'` → `'DivinExpress'` ; `:44` `email: 'contact@reign-store.com'` → `'contact@divinexpress.fr'` ; `:286` fallback `|| 'Reign'` → `|| 'DivinExpress'`.
  - `api/admin/settings/route.ts:38` `??= 'Reign'` → `??= 'DivinExpress'` ; `:39` `??= 'contact@reign.webmodernseo.co'` → `??= 'contact@divinexpress.fr'`.
- [ ] **Step 6 — Variables de police (les deux fichiers ensemble)** :
  - `fonts.ts:8` `variable: '--reign-font-serif'` → `'--divinexpress-font-serif'` ; `:14` `variable: '--reign-font-sans'` → `'--divinexpress-font-sans'`.
  - `globals.css:9` commentaire `Reign Administration...` → `DivinExpress Administration...` ; `:37` `var(--reign-font-sans)` → `var(--divinexpress-font-sans)` ; `:38` `var(--reign-font-serif)` → `var(--divinexpress-font-serif)`.
- [ ] **Step 7 — Tests + typecheck** :
```bash
npx vitest run src/components/ "src/app/[locale]/(dashboard)" src/app/api/admin/
rm -rf .next/dev && npm run typecheck
```
Attendu : Footer.test vert, autres verts, typecheck 0.
- [ ] **Step 8 — Commit**
```bash
git add src/components/ "src/app/[locale]/(dashboard)" src/app/api/admin/settings/route.ts src/lib/fonts.ts src/app/globals.css src/components/layout/Footer.test.tsx
git commit -m "feat(rebrand): storefront + dashboard brand text, SKU prefix, font vars -> DivinExpress"
```

---

### Task 8: Fixtures de test résiduelles, dossier Cloudinary & vérification finale

**Files:**
- Modify: `src/server/auth/auth.test.ts` (emails fixtures), `src/server/db/schema.test.ts:25,29` (SKU), `src/server/orders/service.test.ts:36` (adresse), `src/server/checkout/checkout.test.ts:35` (adresse), `src/server/media/cloudinary.test.ts:7,9,15,16` (dossier), `src/components/admin/ImageUploader.test.tsx:14` (dossier)

- [ ] **Step 1 — `auth.test.ts`** : remplacer chaque email fixture `admin@reign.local` → `admin@divinexpress.local`, `Owner@Reign.Local` → `Owner@DivinExpress.Local`, `owner@reign.local` → `owner@divinexpress.local` (lignes 26-28, 32, 52, 57, 63, 69, 71, 74, 79). La casse mixte ligne 52 teste la normalisation → conserver la logique (majuscule en entrée, minuscule en assertion).
- [ ] **Step 2 — `schema.test.ts`** : `'REIGN-SHIRT-M'` → `'DIVINEXPRESS-SHIRT-M'` (lignes 25 et 29).
- [ ] **Step 3 — `orders/service.test.ts:36` & `checkout.test.ts:35`** : `line1: '1 rue Reign'` → `line1: '1 rue DivinExpress'`.
- [ ] **Step 4 — `cloudinary.test.ts`** : remplacer les 4 occurrences `reign/products` → `divinexpress/products`. **Attention ligne 9** : la chaîne littérale `'folder=reign/products&timestamp=1700000000SECRET'` sert au calcul SHA-1 attendu ; elle DOIT devenir `'folder=divinexpress/products&timestamp=1700000000SECRET'` pour rester cohérente avec l'entrée ligne 7.
- [ ] **Step 5 — `ImageUploader.test.tsx:14`** : `folder: 'reign/products'` → `folder: 'divinexpress/products'`.
- [ ] **Step 6 — Suite complète** :
```bash
npx vitest run --no-file-parallelism
```
Attendu : tous les fichiers verts. (En cas d'erreur générique « Cannot read properties of undefined (reading 'config') », fermer les process node en trop et relancer — voir HANDOFF.md piège #3.)
- [ ] **Step 7 — Typecheck final** : `rm -rf .next/dev && npm run typecheck` → 0.
- [ ] **Step 8 — Grep de vérification finale** :
```bash
grep -rin "reign" src messages
```
Attendu : UNIQUEMENT les chemins d'images `/branding/logo-reign.png`, `/branding/logo-reign-white.png`, `/image/reign-admin-hoodie.png` (dans `Logo.tsx`, `Footer.tsx`, `Footer.test.tsx`, `AdminShell.tsx`, `LoginPanel.tsx`, `seo.ts`, `dashboard/queries.ts`, `produits/page.tsx`, `commandes/page.tsx`). Toute autre occurrence = à corriger avant commit.
- [ ] **Step 9 — Lint (contrôle non-régression)** : `npm run lint` — le total d'avertissements ne doit pas augmenter par rapport à la baseline (voir HANDOFF.md : ~31 problèmes préexistants).
- [ ] **Step 10 — Commit**
```bash
git add src/server/auth/auth.test.ts src/server/db/schema.test.ts src/server/orders/service.test.ts src/server/checkout/checkout.test.ts src/server/media/cloudinary.test.ts src/components/admin/ImageUploader.test.tsx
git commit -m "test(rebrand): update residual fixtures + Cloudinary folder -> divinexpress"
```

---

## Phase 2 (hors code — nécessite les infos du propriétaire)

Non couvert par ce plan, à faire quand le lien Neon et l'accès Vercel sont fournis :
- Vercel : variables `DATABASE_URL` (chaîne Neon), `NEXT_PUBLIC_SITE_URL=https://divinexpress.fr`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, providers paiement/email.
- Base : `npm run db:setup` exécuté contre Neon (l'app détecte `postgres://` automatiquement — aucun code).
- Domaine `divinexpress.fr` pointé sur le projet Vercel.

## Phase 3 (plus tard)

Remplacer les vrais fichiers logo (`public/branding/logo-reign*.png`, `public/image/reign-admin-hoodie.png`) par les assets DivinExpress et aligner les chemins dans les fichiers listés au grep résiduel.
