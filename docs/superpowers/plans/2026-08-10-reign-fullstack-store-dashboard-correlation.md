# Reign Fullstack Store and Dashboard Correlation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a credential-free fullstack Reign application whose storefront and dashboard operate on the same persistent commerce data.

**Architecture:** The relational database remains the source of truth. Storefront reads and authenticated admin mutations go through focused repositories and domain services; external services remain replaceable providers with deterministic development implementations.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, Zod 4, SQLite/PostgreSQL database abstraction, Vitest, Testing Library.

## Global Constraints

- Read the relevant Next.js 16.3 guides in `node_modules/next/dist/docs/` before changing framework code.
- Preserve existing data and use additive, repeatable migrations.
- Do not deploy, connect paid services, or expose secrets.
- Use test-driven development for every behavior change.
- Keep production simulations disabled and clearly labeled.
- Enforce authentication and authorization at every protected server boundary.

---

### Task 1: Baseline Audit and Correlation Contract

**Files:**
- Create: `docs/audits/2026-08-10-fullstack-baseline.md`
- Create: `src/server/commerce/correlation.test.ts`
- Inspect: `src/app/[locale]`, `src/app/api`, `src/server`, `src/components/admin`

**Interfaces:**
- Consumes: current database schema, repositories, route handlers, and UI requests.
- Produces: an evidence-backed store-to-dashboard matrix and failing integration assertions for missing correlations.

- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; record exact outcomes without editing code.
- [ ] Trace product, checkout, customer, order, stock, return, message, and setting data from storefront entry point to dashboard read/mutation.
- [ ] Write focused tests proving the expected shared-source behavior; verify each new assertion fails only where correlation is missing.
- [ ] Record inactive buttons, static fallbacks, hard-coded currency/country values, swallowed request failures, and missing loading/error states with file references.
- [ ] Commit the baseline evidence and tests with `test: define storefront dashboard correlation contract`.

### Task 2: Catalog and Inventory Source of Truth

**Files:**
- Modify: `src/server/catalog/repository.ts`
- Modify: `src/lib/products.ts`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/produit/[slug]/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`
- Modify: `src/app/api/admin/products/route.ts`
- Modify: `src/app/api/admin/products/[id]/route.ts`
- Test: `src/server/catalog/repository.test.ts`
- Test: `src/lib/products.test.ts`

**Interfaces:**
- Consumes: `CatalogRepository`, product/category/variant/media/inventory tables.
- Produces: `getStorefrontProducts(locale)` and `getStorefrontProductBySlug(slug, locale)` results derived from persisted active products and current stock.

- [ ] Add tests that edit a product price, status, translation, and stock through repository operations and then assert storefront queries return the updated values.
- [ ] Run the targeted tests and confirm failures identify static catalog reads or incomplete mappings.
- [ ] Implement persisted storefront catalog queries and remove runtime demo fallbacks from successful database paths.
- [ ] Validate admin create/update/archive payloads, return 404 for unknown records, and keep inventory adjustments transactional.
- [ ] Run catalog, product, typecheck, and lint checks; commit with `feat: correlate storefront catalog with admin inventory`.

### Task 3: Checkout, Customers, Orders, and Stock

**Files:**
- Modify: `src/server/checkout/service.ts`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/[locale]/commande/paiement/page.tsx`
- Modify: `src/app/api/admin/orders/route.ts`
- Modify: `src/app/api/admin/orders/[id]/route.ts`
- Modify: `src/app/api/admin/customers/route.ts`
- Modify: `src/app/[locale]/(dashboard)/commandes/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/clients/page.tsx`
- Test: `src/server/checkout/checkout.test.ts`
- Test: `src/server/dashboard/queries.test.ts`

**Interfaces:**
- Consumes: validated checkout request and current catalog variants.
- Produces: an idempotent persisted order containing customer, items, totals, development payment, notification, and stock movements visible through admin queries.

- [ ] Add tests for guest-customer reuse, server price recalculation, multi-line item details, stock decrement, duplicate idempotency key, insufficient stock, and dashboard visibility.
- [ ] Confirm the new tests fail for any incomplete cross-layer mapping.
- [ ] Implement the smallest service/repository changes needed to make order creation atomic and admin DTOs complete.
- [ ] Replace hard-coded order item, country, currency, and shipment display fields with persisted values; surface request errors in both checkout and dashboard UI.
- [ ] Run checkout/dashboard tests, typecheck, and lint; commit with `feat: complete checkout to dashboard order flow`.

### Task 4: Order Fulfillment, Returns, and Development Refunds

**Files:**
- Modify: `src/server/domain/order-status.ts`
- Create: `src/server/returns/service.ts`
- Create: `src/server/returns/service.test.ts`
- Modify: `src/app/api/admin/orders/[id]/route.ts`
- Modify: `src/app/api/admin/returns/route.ts`
- Modify: `src/app/[locale]/(dashboard)/commandes/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/retours/page.tsx`

**Interfaces:**
- Consumes: authenticated admin, order/return identifier, requested transition, carrier/tracking, and refund reason.
- Produces: validated order transitions, shipment records, return state transitions, refund records, and inventory restoration where policy permits.

- [ ] Write failing tests for invalid order transitions, missing tracking on shipment, unknown return IDs, approval/refusal/receipt flows, duplicate refunds, and development refund labeling.
- [ ] Implement transactional services and map domain errors to 400/404/409 responses.
- [ ] Replace `prompt`, `confirm`, and silent catches with accessible forms/dialog state and visible success/error feedback.
- [ ] Remove unsupported create/export/email actions or implement them only when backed by persisted behavior.
- [ ] Run domain/return/API tests, typecheck, and lint; commit with `feat: add persisted fulfillment returns and refund workflows`.

### Task 5: Messaging and Settings Correlation

**Files:**
- Modify: `src/server/messaging/repository.ts`
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/app/api/admin/messages/route.ts`
- Modify: `src/app/api/admin/settings/route.ts`
- Modify: `src/app/[locale]/(dashboard)/messages/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`
- Modify: `src/app/api/admin/sidebar-badges/route.ts`
- Test: `src/server/messaging/repository.test.ts`
- Create: `src/server/settings/repository.test.ts`

**Interfaces:**
- Consumes: contact submissions, persisted conversations, authenticated replies/status changes, and validated store setting patches.
- Produces: real inbox threads and badges plus a typed allowlist of persisted settings with documented storefront effects.

- [ ] Write failing tests for contact-to-inbox visibility, unread counts, mark-read, AI/human attribution, malformed input, and setting key/type validation.
- [ ] Consolidate messaging and settings access behind typed repositories and controlled DTOs.
- [ ] Make inbox polling resilient, show delivery/draft states honestly, and eliminate page-local fabricated conversations or counters.
- [ ] Persist only allowlisted settings and consume public settings where the storefront already exposes the corresponding behavior.
- [ ] Run messaging/settings tests, typecheck, and lint; commit with `feat: correlate messages and store settings`.

### Task 6: Authentication and Route Hardening

**Files:**
- Modify: `src/server/auth/runtime.ts`
- Modify: `src/server/auth/authorization.ts`
- Modify: `src/app/api/admin/**/route.ts`
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`
- Create: `src/app/api/admin/admin-routes.test.ts`
- Test: `src/server/auth/auth.test.ts`

**Interfaces:**
- Consumes: signed session cookie and role requirements.
- Produces: consistent 401, 403, 400, 404, and domain conflict responses without secret or stack leakage.

- [ ] Write a route matrix test covering anonymous access, insufficient role, malformed JSON, invalid Zod payloads, and missing resources for every admin mutation family.
- [ ] Verify failures and trace inconsistent response behavior to exact handlers.
- [ ] Centralize safe request parsing and authorization helpers where repetition is real; keep checks close to each data operation.
- [ ] Add audit events for sensitive inventory, order, return, refund, and settings mutations without logging personal data or secrets.
- [ ] Run auth/route/security tests, typecheck, and lint; commit with `fix: harden admin server boundaries`.

### Task 7: Dashboard Interaction and Responsive Audit

**Files:**
- Modify: `src/components/admin/AdminShell.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminTopbar.tsx`
- Modify: `src/components/admin/DashboardOverview.tsx`
- Modify: `src/app/[locale]/(dashboard)/*/page.tsx`
- Test: `src/components/admin/AdminExperience.test.tsx`

**Interfaces:**
- Consumes: authenticated API DTOs and mutation results.
- Produces: stable loading, empty, success, validation, and failure states for every dashboard workflow.

- [ ] Add component tests for loading, empty, unauthorized, server failure, successful mutation refresh, and duplicate sidebar request prevention.
- [ ] Verify each test fails against the current silent fallback or decorative behavior.
- [ ] Implement shared fetch/error primitives only where they remove actual duplication; keep layout dimensions stable and controls accessible.
- [ ] Audit FR/EN text encoding, currency formatting, mobile overflow, button labels, tooltips, focus, and disabled states.
- [ ] Run component tests, typecheck, and lint; commit with `fix: complete dashboard interaction states`.

### Task 8: Provider Readiness, End-to-End Verification, and Final Audit

**Files:**
- Modify: `.env.example`
- Modify: `docs/operations.md`
- Modify: `docs/production-readiness.md`
- Modify: `docs/audits/2026-08-10-fullstack-baseline.md`
- Create or modify: browser end-to-end test files following the repository's installed browser tooling.

**Interfaces:**
- Consumes: completed credential-free application and provider interfaces.
- Produces: connection instructions, verified browser journeys, final findings, and an explicit list of remaining external gates.

- [ ] Verify each provider selects a deterministic development implementation locally and fails closed in production when required credentials are absent.
- [ ] Document exact environment variables, webhook requirements, migration/backup steps, and activation checks without including secrets.
- [ ] Start the development server and exercise FR/EN storefront, login, product edit, checkout, stock correlation, fulfillment, return/refund, messaging, settings, logout, and unauthorized dashboard access.
- [ ] Capture desktop and mobile screenshots, check console/network errors, and inspect pages for blank regions, overflow, overlap, broken assets, and misleading actions.
- [ ] Run `npm run check`, `npm run build`, database migration/seed idempotency, and dependency audit; record exact evidence.
- [ ] Update the audit with resolved findings, residual risks, correlation matrix, and external provider gates; commit with `docs: complete fullstack readiness audit`.
