# Product Color Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store a validated HEX code per product variant and render its exact color consistently in administration and storefront interfaces.

**Architecture:** A nullable `color_hex` column extends variants without breaking existing rows. Catalog schemas and repository mappings carry `colorHex`; admin inputs synchronize a color picker and text field, while storefront swatches fall back safely for legacy data.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zod, SQL migrations, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-27-chat-dashboard-settings-product-colors-design.md`

## Global Constraints

- Read relevant installed Next.js guides before modifying routes or pages.
- Canonical HEX format is exactly `#RRGGBB`; API input may be normalized to uppercase.
- `colorHex` remains nullable for legacy variants.
- The readable color name remains the cart and order identity field.
- Use test-driven development and focused commits.

---

### Task 1: Database migration and catalog contract

**Files:**
- Create: `src/server/db/migrations/0006_variant_color_hex.sql`
- Create: `src/server/db/migration-0006.test.ts`
- Modify: `src/server/db/migrate.ts`
- Modify: `src/server/catalog/schemas.ts`
- Modify: `src/server/catalog/repository.ts`
- Modify: `src/server/catalog/repository.test.ts`

**Interfaces:**
- Produces: `CatalogVariant.colorHex: string | null`.
- Produces: create/add variant inputs with `colorHex: string | null`.

- [ ] **Step 1: Write failing migration and repository tests**

Assert migration 0006 adds nullable `color_hex`, preserves a legacy row, and allows `#172554`. Assert create/list/add variant round trips `colorHex`.

```ts
expect(product.variants[0]).toMatchObject({ color: 'Bleu nuit', colorHex: '#172554' });
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm.cmd test -- src/server/db/migration-0006.test.ts src/server/catalog/repository.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because migration 0006 and `colorHex` do not exist.

- [ ] **Step 3: Add migration and repository mapping**

Use:

```sql
ALTER TABLE product_variants ADD COLUMN color_hex TEXT;
```

Register `0006_variant_color_hex`, extend Zod with `z.string().regex(/^#[0-9A-F]{6}$/).nullable()`, include `color_hex` in insert/select statements, and map it to `colorHex`.

- [ ] **Step 4: Run migration and repository tests**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/server/db/migrations/0006_variant_color_hex.sql src/server/db/migration-0006.test.ts src/server/db/migrate.ts src/server/catalog/schemas.ts src/server/catalog/repository.ts src/server/catalog/repository.test.ts
git commit -m "feat: store product variant color codes"
```

### Task 2: Product administration API contract

**Files:**
- Modify: `src/app/api/admin/products/route.ts`
- Modify: `src/app/api/admin/products/[id]/variants/route.ts`
- Modify: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`
- Create: `src/app/api/admin/products/color-hex-routes.test.ts`

**Interfaces:**
- Consumes: `colorHex` repository contract from Task 1.
- Produces: create/update variant JSON field `colorHex: string | null`.

- [ ] **Step 1: Write failing API validation tests**

Test accepted lowercase input normalized to uppercase, accepted null, and rejected values such as `blue`, `#123`, and `#GGGGGG`. Test that editing an existing variant can update both `color` and `colorHex` without changing stock.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm.cmd test -- src/app/api/admin/products/color-hex-routes.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because routes do not accept or persist `colorHex`.

- [ ] **Step 3: Extend route schemas and update operation**

Define one reusable schema in `src/server/catalog/schemas.ts`:

```ts
export const colorHexSchema = z.string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^#[0-9A-F]{6}$/))
  .nullable();
```

Add a repository `updateVariantAppearance(variantId, { color, colorHex })` method and call it only when appearance fields are supplied.

- [ ] **Step 4: Run API and repository tests**

Run: `npm.cmd test -- src/app/api/admin/products/color-hex-routes.test.ts src/server/catalog/repository.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/server/catalog/schemas.ts src/server/catalog/repository.ts src/app/api/admin/products/route.ts 'src/app/api/admin/products/[id]/variants/route.ts' 'src/app/api/admin/products/[id]/variants/[variantId]/route.ts' src/app/api/admin/products/color-hex-routes.test.ts
git commit -m "feat: validate product color codes in admin API"
```

### Task 3: Synchronized color controls in ProductForm

**Files:**
- Modify: `src/components/admin/ProductForm.tsx`
- Modify: `src/components/admin/AdminExperience.test.tsx`

**Interfaces:**
- Consumes: API `colorHex` from Task 2.
- Produces: each editable variant row contains `{ color, colorHex, size, stock }`.

- [ ] **Step 1: Write failing form tests**

Test that selecting `#172554` updates the text field, typing `#AABBCC` updates the picker, invalid text displays a nearby French/English validation message, creation sends uppercase `colorHex`, and edit mode preloads/saves the existing code.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because variant rows currently store only a color name.

- [ ] **Step 3: Implement synchronized controls**

Extend the form variant state with `colorHex`. Render `<input type="color">` and a text input with `pattern="#[0-9A-Fa-f]{6}"`; normalize valid values on blur/submission and block invalid submission with field-level copy.

- [ ] **Step 4: Run the focused form tests**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/admin/ProductForm.tsx src/components/admin/AdminExperience.test.tsx
git commit -m "feat: add variant color picker to product form"
```

### Task 4: Storefront color swatches

**Files:**
- Modify: `src/server/catalog/storefront.ts`
- Modify: `src/server/catalog/storefront.test.ts`
- Modify: `src/lib/products.ts`
- Modify: `src/components/product/ProductDetailView.tsx`
- Modify: `src/components/product/ProductDetailView.test.tsx`
- Modify: `src/components/checkout/OrderSummary.tsx`
- Modify: `src/components/checkout/OrderSummary.test.tsx`

**Interfaces:**
- Consumes: nullable catalog `colorHex`.
- Produces: storefront color option `{ name: string; hex: string | null }` while cart identity remains `name`.

- [ ] **Step 1: Write failing mapping and UI tests**

Assert exact HEX mapping, legacy fallback, selected swatch accessible name, readable color in cart/summary, and a decorative swatch only when a valid code exists.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm.cmd test -- src/server/catalog/storefront.test.ts src/components/product/ProductDetailView.test.tsx src/components/checkout/OrderSummary.test.tsx --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because storefront products expose only color names.

- [ ] **Step 3: Implement mapping and presentation**

Prefer the stored `colorHex`; fall back to `COLOR_SWATCHES[name]`; finally use `#D4D4D4`. Preserve the name sent to cart and checkout APIs.

- [ ] **Step 4: Run focused tests and commit**

Run the Step 2 command. Expected: PASS.

```powershell
git add -- src/server/catalog/storefront.ts src/server/catalog/storefront.test.ts src/lib/products.ts src/components/product/ProductDetailView.tsx src/components/product/ProductDetailView.test.tsx src/components/checkout/OrderSummary.tsx src/components/checkout/OrderSummary.test.tsx
git commit -m "feat: render exact product color swatches"
```
