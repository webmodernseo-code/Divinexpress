# Reign Premium Pre-Supabase Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a persisted, premium storefront and operational dashboard with no runtime demo records, honest provider states, and verified desktop/mobile behavior before Supabase integration.

**Architecture:** Preserve the current Next.js 16 server-page, route-handler, domain-service, and repository boundaries. Move initial reads to server code, keep mutations behind validated server endpoints, and isolate external services behind provider capability contracts so Supabase and real API keys can be connected later without changing product components.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 5, next-intl 4, Tailwind CSS 4, Zod 4, Vitest 4, Testing Library, relational database adapters.

## Global Constraints

- Work in this order: storefront, dashboard, transversal hardening.
- Preserve and refine the current Reign visual identity.
- Do not connect Supabase in this phase and do not import Supabase clients into UI code.
- No hard-coded product, order, customer, return, message, or settings records may be used at runtime.
- Development fixtures may exist only in `src/server/db/seed.ts` and run through an explicit seed command.
- Missing provider credentials must produce an accurate unavailable state and must fail closed in production.
- Read the relevant guide in `node_modules/next/dist/docs/` before changing a Next.js API or convention.
- Use `apply_patch` for manual edits, preserve unrelated worktree changes, and commit each completed task independently.
- Do not claim a verification gate passed without fresh command or browser evidence.

---

### Task 1: Persisted Storefront Catalog Contract

**Files:**
- Modify: `src/lib/products.ts`
- Modify: `src/server/catalog/storefront.ts`
- Modify: `src/server/catalog/storefront.test.ts`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/components/home/HomeCollection.tsx`

**Interfaces:**
- Produces: `StorefrontCatalog.list(): Promise<Product[]>`
- Produces: `StorefrontCatalog.search(query: string, locale: Locale): Promise<Product[]>`
- Produces: `StorefrontCatalog.findBySlug(slug: string): Promise<Product | null>`
- Produces: `Product` values fully derived from persisted catalog records.

- [ ] **Step 1: Add failing repository mapping tests**

Add cases proving inactive products are excluded, persisted translations and variant stock are mapped, an empty database returns `[]`, and search matches localized persisted names without reading `ALL_PRODUCTS`.

```ts
it('searches only active persisted products in the requested locale', async () => {
  await seedCatalogProduct(database, {
    id: 'product:linen-shirt',
    slug: 'linen-shirt',
    status: 'active',
    nameFr: 'Chemise en lin',
    nameEn: 'Linen shirt',
  });

  const catalog = new StorefrontCatalog(database);
  expect((await catalog.search('lin', 'fr')).map((product) => product.slug))
    .toEqual(['linen-shirt']);
  expect(await catalog.search('robe', 'fr')).toEqual([]);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm.cmd test -- src/server/catalog/storefront.test.ts --pool=forks`

Expected: FAIL because `StorefrontCatalog.search` does not exist or static records leak into results.

- [ ] **Step 3: Remove runtime catalog constants from component defaults**

Keep only domain types, category identifiers, swatch metadata, and pure helpers in `src/lib/products.ts`. Do not export runtime product records to pages or components. Require `HomeCollection` to receive `products: Product[]` without a static default.

```ts
export function HomeCollection(props: {
  initialCategory: Category | null;
  initialSubcategory: string | null;
  products: Product[];
}) { /* existing filtered presentation */ }
```

- [ ] **Step 4: Implement persisted localized search**

Filter the result of `CatalogRepository.listProducts()` through the existing storefront mapper and normalize query/name/description with `toLocaleLowerCase()` and Unicode normalization. Return `[]` for blank queries.

- [ ] **Step 5: Run catalog and filtering tests**

Run: `npm.cmd test -- src/server/catalog/storefront.test.ts src/lib/productFilters.test.ts --pool=forks`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/products.ts src/server/catalog/storefront.ts src/server/catalog/storefront.test.ts src/app/[locale]/page.tsx src/components/home/HomeCollection.tsx
git commit -m "refactor: make persisted catalog authoritative"
```

### Task 2: Persisted Search And Empty Storefront States

**Files:**
- Create: `src/components/product/ProductGridState.tsx`
- Create: `src/components/product/ProductGridState.test.tsx`
- Modify: `src/app/[locale]/recherche/page.tsx`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `StorefrontCatalog.search(query, locale)` from Task 1.
- Produces: `ProductGridState({ products, emptyTitle, emptyBody }: Props)`.

- [ ] **Step 1: Write failing state tests**

```tsx
it('renders a useful empty state without fake products', () => {
  render(<ProductGridState products={[]} emptyTitle="Aucun résultat" emptyBody="Essayez un autre terme." />);
  expect(screen.getByRole('heading', { name: 'Aucun résultat' })).toBeVisible();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm.cmd test -- src/components/product/ProductGridState.test.tsx --pool=forks`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the shared grid state**

Render an unframed empty state for zero results and a stable responsive product grid otherwise. Do not nest cards or inject placeholder products.

- [ ] **Step 4: Convert search to a persisted server read**

Open the database through the existing runtime helper, construct `StorefrontCatalog`, call `search(query, locale)`, and render `ProductGridState`. Add FR/EN copy for blank query, result count, and no results.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npm.cmd test -- src/components/product/ProductGridState.test.tsx src/server/catalog/storefront.test.ts --pool=forks`

Run: `npm.cmd run typecheck`

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/product/ProductGridState.tsx src/components/product/ProductGridState.test.tsx src/app/[locale]/recherche/page.tsx messages/fr.json messages/en.json
git commit -m "feat: connect storefront search to persisted catalog"
```

### Task 3: Product, Favorites, And Cart Persistence Snapshots

**Files:**
- Modify: `src/lib/cart.ts`
- Modify: `src/lib/cart.test.ts`
- Modify: `src/lib/favorites.ts`
- Modify: `src/lib/favorites.test.ts`
- Modify: `src/context/CartContext.tsx`
- Modify: `src/context/FavoritesContext.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/product/ProductDetailView.tsx`
- Modify: `src/components/cart/CartLineItem.tsx`
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/app/[locale]/favoris/page.tsx`
- Modify: `src/app/[locale]/panier/page.tsx`

**Interfaces:**
- Produces: `CartLineSnapshot` containing product id, slug, localized name, image URL, selected variant attributes, display price/currency, and quantity.
- Produces: `FavoriteSnapshot` containing product id, slug, localized name, image URL, and display price/currency.
- The checkout server remains authoritative and resolves current variant prices and stock.

- [ ] **Step 1: Write failing serialization tests**

```ts
it('round-trips a persisted product snapshot without consulting static products', () => {
  const line = createCartLineSnapshot(product, { size: 'M', color: 'Noir', quantity: 2 });
  expect(parseStoredCart(JSON.stringify([line]))).toEqual([line]);
  expect(line.slug).toBe('linen-shirt');
});
```

Add migration tests proving malformed or obsolete browser data is discarded safely rather than backfilled from static product arrays.

- [ ] **Step 2: Run cart and favorites tests and confirm failure**

Run: `npm.cmd test -- src/lib/cart.test.ts src/lib/favorites.test.ts --pool=forks`

Expected: FAIL because snapshots lack required persisted display fields.

- [ ] **Step 3: Implement versioned snapshot schemas**

Use Zod or explicit type guards to parse browser storage. Increment storage keys, accept only finite non-negative prices and positive integer quantities, and never import product collections during hydration.

- [ ] **Step 4: Render snapshots throughout favorites and cart**

Update card/detail add actions and cart/favorites pages to render stored snapshots. Preserve accessible icon labels, stable media aspect ratios, stock-aware quantity controls, and localized names.

- [ ] **Step 5: Run affected component and context tests**

Run: `npm.cmd test -- src/lib/cart.test.ts src/lib/favorites.test.ts src/context/CartContext.test.tsx src/context/FavoritesContext.test.tsx src/context/CartDrawerContext.test.tsx --pool=forks`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/cart.ts src/lib/cart.test.ts src/lib/favorites.ts src/lib/favorites.test.ts src/context/CartContext.tsx src/context/FavoritesContext.tsx src/components/product src/components/cart src/app/[locale]/favoris/page.tsx src/app/[locale]/panier/page.tsx
git commit -m "feat: preserve persisted product snapshots in cart flows"
```

### Task 4: Single Concrete Checkout Journey

**Files:**
- Modify: `src/app/[locale]/commande/livraison/page.tsx`
- Modify: `src/app/[locale]/commande/paiement/page.tsx`
- Modify: `src/app/[locale]/commande/confirmation/page.tsx`
- Modify: `src/context/CheckoutContext.tsx`
- Modify: `src/context/CheckoutContext.test.tsx`
- Modify: `src/lib/checkoutValidation.ts`
- Modify: `src/lib/checkoutValidation.test.ts`
- Modify: `src/lib/checkoutResponse.ts`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/server/checkout/service.ts`
- Modify: `src/server/checkout/checkout.test.ts`

**Interfaces:**
- Produces: validated `ShippingDetails` persisted only for the active browser checkout.
- Produces: `POST /api/checkout` result `{ orderNumber: string; checkoutUrl?: string }`.
- Produces: confirmation page data loaded from persisted order number, not cart state.

- [ ] **Step 1: Add failing checkout journey tests**

Test that shipping submission never clears the cart, payment failure preserves both cart and idempotency key, successful development checkout clears the cart once, and confirmation rejects an unknown order reference.

```ts
it('does not create an order or clear items during shipping submission', async () => {
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  expect(clearCart).not.toHaveBeenCalled();
  expect(router.push).toHaveBeenCalledWith('/commande/paiement');
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm.cmd test -- src/context/CheckoutContext.test.tsx src/lib/checkoutValidation.test.ts src/server/checkout/checkout.test.ts --pool=forks`

Expected: FAIL because the delivery page currently simulates payment and clears the cart.

- [ ] **Step 3: Make delivery a validated shipping-only step**

Remove provider selection, artificial delay, and `clearCart()` from delivery. Validate fields, store `ShippingDetails`, and navigate to `/commande/paiement`.

- [ ] **Step 4: Make payment capability-driven**

Render only methods returned as available by the server provider configuration. Keep unavailable methods visible only when useful, with accurate disabled copy. Submit through `/api/checkout`; never claim external redirection without a returned `checkoutUrl`.

- [ ] **Step 5: Load confirmation from persistence**

Resolve `searchParams.order` on the server, query a public-safe order confirmation projection, and call `notFound()` for missing references. Do not expose customer-private data beyond what the active checkout needs.

- [ ] **Step 6: Run checkout tests and typecheck**

Run: `npm.cmd test -- src/context/CheckoutContext.test.tsx src/lib/checkoutValidation.test.ts src/lib/checkoutResponse.test.ts src/server/checkout/checkout.test.ts --pool=forks`

Run: `npm.cmd run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/app/[locale]/commande src/context/CheckoutContext.tsx src/context/CheckoutContext.test.tsx src/lib/checkoutValidation.ts src/lib/checkoutValidation.test.ts src/lib/checkoutResponse.ts src/app/api/checkout/route.ts src/server/checkout
git commit -m "fix: unify persisted checkout journey"
```

### Task 5: Shared Storefront Route States And Accessibility

**Files:**
- Create: `src/app/[locale]/loading.tsx`
- Create: `src/app/[locale]/error.tsx`
- Create: `src/app/[locale]/commande/loading.tsx`
- Create: `src/components/ui/InlineNotice.tsx`
- Create: `src/components/ui/InlineNotice.test.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/product/ProductGallery.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `InlineNotice({ tone, title, children, action }: Props)` with `role="alert"` for errors and `role="status"` for non-error feedback.

- [ ] **Step 1: Write failing notice and keyboard tests**

Test notice semantics, Escape dismissal for overlays, focus return to the opener, and descriptive accessible names for icon-only buttons.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm.cmd test -- src/components/ui/InlineNotice.test.tsx src/components/product/ProductDetailView.test.tsx --pool=forks`

Expected: FAIL for the missing notice or focus behavior.

- [ ] **Step 3: Implement route loading and recovery UI**

Use stable skeleton dimensions matching real page regions. Implement the locale error boundary as a Client Component accepting `{ error, reset }`, logging only the digest, and exposing a translated retry action.

- [ ] **Step 4: Harden overlays and focus styles**

Use existing Lucide icons, preserve focus-visible outlines, lock background scroll only while overlays are open, close on Escape, and restore focus. Do not introduce decorative cards or viewport-scaled font sizes.

- [ ] **Step 5: Run tests, lint affected files, and commit**

Run: `npm.cmd test -- src/components/ui/InlineNotice.test.tsx src/components/product/ProductDetailView.test.tsx --pool=forks`

Run: `npm.cmd exec eslint -- src/components src/app/[locale]/loading.tsx src/app/[locale]/error.tsx`

Expected: PASS with no new warnings.

```powershell
git add src/app/[locale]/loading.tsx src/app/[locale]/error.tsx src/app/[locale]/commande/loading.tsx src/components/ui/InlineNotice.tsx src/components/ui/InlineNotice.test.tsx src/components/layout/Header.tsx src/components/cart/CartDrawer.tsx src/components/product/ProductGallery.tsx src/app/globals.css
git commit -m "feat: harden storefront states and accessibility"
```

### Task 6: Remove Runtime Admin Demo State

**Files:**
- Delete: `src/context/AdminDemoContext.tsx`
- Delete: `src/lib/admin/demoData.ts`
- Delete: `src/lib/admin/repository.ts`
- Delete: `src/lib/admin/repository.test.ts`
- Modify: `src/components/admin/AdminShell.tsx`
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`
- Modify: `src/app/[locale]/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/clients/page.tsx`

**Interfaces:**
- Consumes: authenticated admin APIs and server dashboard queries.
- Produces: true empty dashboard states when persistence contains no records.

- [ ] **Step 1: Add a guard test against runtime demo imports**

```ts
it('does not ship runtime admin demo modules', () => {
  expect(sourceFiles.join('\n')).not.toMatch(/AdminDemoContext|admin\/demoData|admin\/repository/);
});
```

Place this source-boundary assertion in `src/server/domain/domain.test.ts` or a new focused `src/test/runtime-boundaries.test.ts`.

- [ ] **Step 2: Run the guard and confirm failure**

Run: `npm.cmd test -- src/test/runtime-boundaries.test.ts --pool=forks`

Expected: FAIL while demo imports exist.

- [ ] **Step 3: Replace demo consumers with persisted reads**

Remove the provider from the dashboard layout. Use server query results or authenticated API state for every screen. Empty result arrays must render `EmptyState`, not fallback records.

- [ ] **Step 4: Delete unreferenced runtime demo modules**

Verify first with `rg -n "AdminDemoContext|createAdminDemoSeed|admin/repository" src`. Delete only after no production consumer remains. Keep explicit fixtures in `src/server/db/seed.ts`.

- [ ] **Step 5: Run dashboard tests and commit**

Run: `npm.cmd test -- src/test/runtime-boundaries.test.ts src/components/admin/AdminExperience.test.tsx src/server/dashboard/queries.test.ts --pool=forks`

Expected: PASS.

```powershell
git add src/context/AdminDemoContext.tsx src/lib/admin src/components/admin/AdminShell.tsx src/app/[locale]/\(dashboard\) src/test/runtime-boundaries.test.ts
git commit -m "refactor: remove runtime dashboard demo data"
```

### Task 7: Operational Product And Order Workflows

**Files:**
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/commandes/page.tsx`
- Modify: `src/app/api/admin/products/route.ts`
- Modify: `src/app/api/admin/products/[id]/route.ts`
- Modify: `src/app/api/admin/orders/route.ts`
- Modify: `src/app/api/admin/orders/[id]/route.ts`
- Create: `src/components/admin/ui/ConfirmDialog.tsx`
- Create: `src/components/admin/ui/ConfirmDialog.test.tsx`
- Create: `src/components/admin/ui/ToastRegion.tsx`
- Create: `src/components/admin/ui/ToastRegion.test.tsx`

**Interfaces:**
- Produces: reusable accessible confirmation and transient feedback primitives.
- Product and order route responses use `{ data: T }` on success and `{ error: { code: string; message: string; fields?: Record<string,string> } }` on expected failure.

- [ ] **Step 1: Write failing primitive and route tests**

Cover dialog focus trapping/cancellation, toast live-region semantics, malformed JSON as 400, anonymous access as 401, role denial as 403, and invalid order transitions as 409.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm.cmd test -- src/components/admin/ui/ConfirmDialog.test.tsx src/components/admin/ui/ToastRegion.test.tsx src/server/orders/service.test.ts --pool=forks`

Expected: FAIL for missing primitives or inconsistent error shapes.

- [ ] **Step 3: Implement primitives and normalized route responses**

Use native dialog semantics or a tested focus-managed implementation. Replace every `alert()` in product and order pages with inline field feedback, confirmation dialog, or toast as appropriate.

- [ ] **Step 4: Expose only allowed order transitions**

Derive actions from the domain transition table, disable the active mutation, and reconcile the returned persisted order rather than optimistic fake state.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm.cmd test -- src/components/admin/ui src/server/orders/service.test.ts --pool=forks`

Run: `npm.cmd run typecheck`

Expected: PASS.

```powershell
git add src/components/admin/ui src/app/[locale]/\(dashboard\)/produits/page.tsx src/app/[locale]/\(dashboard\)/commandes/page.tsx src/app/api/admin/products src/app/api/admin/orders
git commit -m "feat: complete product and order operations"
```

### Task 8: Returns, Messages, And Settings Workflows

**Files:**
- Modify: `src/app/[locale]/(dashboard)/retours/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/messages/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`
- Modify: `src/app/api/admin/returns/route.ts`
- Modify: `src/app/api/admin/messages/route.ts`
- Modify: `src/app/api/admin/settings/route.ts`
- Modify: `src/server/messaging/repository.ts`
- Modify: `src/server/messaging/repository.test.ts`
- Create: `src/server/integrations/capabilities.ts`
- Create: `src/server/integrations/capabilities.test.ts`

**Interfaces:**
- Produces: `getIntegrationCapabilities(): IntegrationCapabilities` with `status: 'configured' | 'unavailable' | 'error'` for payment, email, WhatsApp, AI, and media.
- Returns and messages use persisted state returned by authenticated routes.

- [ ] **Step 1: Write failing workflow and capability tests**

```ts
it('reports missing production credentials as unavailable', () => {
  expect(getIntegrationCapabilities({ nodeEnv: 'production', env: {} }).payment.status)
    .toBe('unavailable');
});
```

Also test return approval/rejection conflicts, reply failures preserving draft text, resolution updating unread state, and settings rejecting unknown keys.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm.cmd test -- src/server/integrations/capabilities.test.ts src/server/messaging/repository.test.ts --pool=forks`

Expected: FAIL because the capability contract does not exist.

- [ ] **Step 3: Implement capability detection and persisted mutations**

Read environment configuration only on the server. Never return secrets. Return safe provider names, status, and a localized status code suitable for UI copy.

- [ ] **Step 4: Replace alerts and fake local successes**

Use `InlineNotice`, `ConfirmDialog`, and `ToastRegion`. Do not clear message drafts on failure. Update return/message/settings state only from successful server responses.

- [ ] **Step 5: Run tests and commit**

Run: `npm.cmd test -- src/server/integrations/capabilities.test.ts src/server/messaging/repository.test.ts src/components/admin/AdminExperience.test.tsx --pool=forks`

Expected: PASS.

```powershell
git add src/app/[locale]/\(dashboard\)/retours/page.tsx src/app/[locale]/\(dashboard\)/messages/page.tsx src/app/[locale]/\(dashboard\)/parametres/page.tsx src/app/api/admin/returns src/app/api/admin/messages src/app/api/admin/settings src/server/messaging src/server/integrations
git commit -m "feat: complete returns messaging and settings workflows"
```

### Task 9: Dashboard Route States And Responsive Hardening

**Files:**
- Create: `src/app/[locale]/(dashboard)/loading.tsx`
- Create: `src/app/[locale]/(dashboard)/error.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminTopbar.tsx`
- Modify: `src/components/admin/AdminShell.tsx`
- Modify: `src/components/admin/ui/AdminButton.tsx`
- Modify: `src/components/admin/ui/AdminCard.tsx`
- Modify: `src/components/admin/AdminExperience.test.tsx`

**Interfaces:**
- Consumes shared admin primitives from Tasks 7 and 8.
- Produces stable desktop and mobile dashboard shells with keyboard-operable navigation.

- [ ] **Step 1: Add failing responsive and semantics tests**

Test mobile menu accessible name/state, Escape close, focus return, active navigation `aria-current="page"`, pending buttons, and error-boundary retry.

- [ ] **Step 2: Run component tests and confirm failure**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx src/components/admin/ui/AdminPrimitives.test.tsx --pool=forks`

Expected: FAIL for one or more missing interaction contracts.

- [ ] **Step 3: Implement stable shell states**

Use fixed icon-button dimensions, responsive grid constraints, compact headings, and non-nested operational cards. Add loading skeletons aligned with dashboard tables and metrics.

- [ ] **Step 4: Run tests and targeted lint**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx src/components/admin/ui/AdminPrimitives.test.tsx --pool=forks`

Run: `npm.cmd exec eslint -- src/components/admin src/app/[locale]/(dashboard)`

Expected: PASS with no new warnings.

- [ ] **Step 5: Commit**

```powershell
git add src/app/[locale]/\(dashboard\)/loading.tsx src/app/[locale]/\(dashboard\)/error.tsx src/components/admin
git commit -m "feat: harden dashboard responsive states"
```

### Task 10: Environment Contract And Provider Documentation

**Files:**
- Modify: `.env.example`
- Modify: `src/server/db/runtime.ts`
- Modify: `src/server/payments/provider.ts`
- Modify: `src/server/payments/development-provider.ts`
- Modify: `src/server/notifications/provider.ts`
- Modify: `src/server/notifications/development-provider.ts`
- Modify: `docs/development.md`
- Modify: `docs/operations.md`
- Modify: `docs/production-readiness.md`

**Interfaces:**
- Consumes: `IntegrationCapabilities` from Task 8.
- Produces: explicit environment validation and development-only provider gating.

- [ ] **Step 1: Add failing production fail-closed tests**

Add tests proving development adapters reject `NODE_ENV=production`, missing secrets do not produce configured capabilities, and environment parsing never logs secret values.

- [ ] **Step 2: Run provider tests and confirm failure**

Run: `npm.cmd test -- src/server/integrations/capabilities.test.ts src/server/checkout/checkout.test.ts src/server/security/redaction.test.ts --pool=forks`

Expected: FAIL if any simulation remains available in production.

- [ ] **Step 3: Implement environment validation and update documentation**

List variable names, purpose, required environment, and activation gate. Use empty example values for secrets. Document that `db:seed` is optional development setup and is never a runtime fallback.

- [ ] **Step 4: Run tests and inspect tracked secrets**

Run: `npm.cmd test -- src/server/integrations/capabilities.test.ts src/server/checkout/checkout.test.ts src/server/security/redaction.test.ts --pool=forks`

Run: `git grep -n -E "(sk_live_|service_role|BEGIN PRIVATE KEY|api[_-]?key[=:][^[:space:]]+)" -- . ':!.env.local'`

Expected: tests PASS and grep returns no tracked secret value.

- [ ] **Step 5: Commit**

```powershell
git add .env.example src/server/db/runtime.ts src/server/payments src/server/notifications docs/development.md docs/operations.md docs/production-readiness.md
git commit -m "docs: define concrete provider activation contract"
```

### Task 11: Full Verification And Closing Audit

**Files:**
- Create: `docs/audits/2026-08-11-premium-pre-supabase-readiness.md`
- Modify: only files required to fix failures discovered by the commands below.

**Interfaces:**
- Produces: evidence-based readiness audit separating passed checks, failures, environment limitations, provider gates, and Supabase-deferred work.

- [ ] **Step 1: Run static verification**

Run: `npm.cmd run typecheck`

Run: `npm.cmd run lint`

Run: `git diff --check`

Expected: all PASS. Fix product-code failures before continuing; do not hide warnings with blanket disables.

- [ ] **Step 2: Run the complete automated suite**

Run: `npm.cmd test -- --pool=forks`

Expected: all tests PASS. Record exact file/test counts.

- [ ] **Step 3: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0 with no missing environment secret required merely to build.

- [ ] **Step 4: Start a local server on an unused port**

Run: `npm.cmd run dev -- -p 3210`

Expected: server remains running and reports `http://localhost:3210` or another selected free port.

- [ ] **Step 5: Verify browser journeys on desktop and mobile**

Use the browser skill and inspect at 1440x900 and 390x844:

- FR and EN home, search, product, favorites, cart, shipping, payment, and confirmation.
- Admin login, products, orders, customers, returns, messages, settings, logout, and anonymous redirect.
- Empty-database states without fake records.
- Failed checkout and failed admin mutation preserve user input.
- Keyboard focus order, Escape behavior, visible focus, console errors, failed network requests, text fit, and overlap.

Expected: no blank views, incoherent overlap, console error, misleading provider state, or inaccessible primary action.

- [ ] **Step 6: Write the closing audit**

Include command, exit status, exact counts, browser viewport evidence, unresolved defects, external credentials still required, and the exact boundaries ready for a future Supabase adapter. Do not mark environment-limited checks as passed.

- [ ] **Step 7: Commit verification evidence**

```powershell
git add docs/audits/2026-08-11-premium-pre-supabase-readiness.md
git commit -m "docs: record pre-supabase readiness evidence"
```

