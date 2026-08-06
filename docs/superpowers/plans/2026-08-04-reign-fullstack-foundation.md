# Reign Full-Stack Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-only demo persistence with a tested server-side foundation that runs locally without external credentials.

**Architecture:** The Next.js application calls focused domain services backed by repository interfaces. A local SQL adapter provides development persistence; authentication, payment, and email are server-side interfaces with deterministic development implementations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, SQLite-compatible ORM, Zod, Vitest, Testing Library.

## Global Constraints

- Preserve all existing uncommitted frontend work.
- Do not require external API keys for local development or tests.
- Keep guest checkout, FR/EN, and EUR/GBP behavior.
- Store money as integer minor units with an ISO currency code.
- Enforce validation, pricing, authorization, and state transitions on the server.
- Do not embed a production credential or default production password.

---

### Task 1: Reproducible quality baseline

**Files:**
- Modify: `vitest.config.mts`
- Modify: `package.json`
- Create: `.env.example`
- Create: `docs/development.md`

**Interfaces:**
- Produces: deterministic commands `check`, `test`, `test:integration`, and documented local environment variables.

- [ ] Run each existing quality command separately and record its exit status and duration.
- [ ] Restrict Vitest workers and file parallelism in configuration so `npm test` terminates reliably on this Windows workspace.
- [ ] Add a single `npm run check` command that runs typecheck, lint, and tests sequentially.
- [ ] Document Node version, environment variables, database lifecycle, and the dedicated development port.
- [ ] Verify `npm run typecheck`, `npm run lint`, and `npm test` independently.
- [ ] Commit only the baseline files with `chore: stabilize local quality checks`.

### Task 2: Local database and migrations

**Files:**
- Modify: `package.json`
- Create: `src/server/db/schema.ts`
- Create: `src/server/db/client.ts`
- Create: `src/server/db/migrations/0001_initial.sql`
- Create: `src/server/db/migrate.ts`
- Create: `src/server/db/seed.ts`
- Create: `src/server/db/schema.test.ts`

**Interfaces:**
- Produces: `getDatabase(): Database`, `migrateDatabase(db): void`, and `seedDevelopmentDatabase(db): void`.

- [ ] Write a schema integration test that creates an isolated database, migrates it, inserts related category/product/variant/order records, and verifies foreign keys.
- [ ] Run the test and confirm failure because the database modules do not exist.
- [ ] Define tables for users, sessions, audit events, categories, products, variants, inventory movements, customers, addresses, orders, order items, payments, payment events, shipments, returns, refunds, settings, contacts, and notification deliveries.
- [ ] Add timestamp, archival, unique-key, currency, and referential constraints in the migration.
- [ ] Implement database creation, migration tracking, development seed, and cleanup-safe test helpers.
- [ ] Add `db:migrate` and `db:seed` scripts and verify migration idempotency.
- [ ] Commit database files with `feat: add local relational persistence`.

### Task 3: Domain validation and repositories

**Files:**
- Create: `src/server/domain/errors.ts`
- Create: `src/server/domain/money.ts`
- Create: `src/server/domain/order-status.ts`
- Create: `src/server/catalog/schemas.ts`
- Create: `src/server/catalog/repository.ts`
- Create: `src/server/customers/repository.ts`
- Create: `src/server/orders/repository.ts`
- Create: `src/server/domain/domain.test.ts`

**Interfaces:**
- Produces: `DomainError`, `Money`, `addMoney`, `assertOrderTransition`, `CatalogRepository`, `CustomerRepository`, and `OrderRepository`.

- [ ] Test mismatched currencies, negative money, invalid order transitions, archived product visibility, and historical order snapshots.
- [ ] Run tests and confirm the new domain cases fail.
- [ ] Implement stable domain error codes and strict money helpers.
- [ ] Implement explicit order transition rules.
- [ ] Implement validated catalog, customer, and order repositories using transactions for multi-record writes.
- [ ] Verify domain and repository tests, then commit with `feat: add commerce domain repositories`.

### Task 4: Server-side authentication and authorization

**Files:**
- Create: `src/server/auth/password.ts`
- Create: `src/server/auth/session.ts`
- Create: `src/server/auth/authorization.ts`
- Create: `src/server/auth/rate-limit.ts`
- Create: `src/server/auth/auth.test.ts`
- Create: `src/app/[locale]/(auth)/connexion/actions.ts`
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`
- Modify: `src/components/admin/LoginPanel.tsx`

**Interfaces:**
- Produces: `hashPassword`, `verifyPassword`, `createSession`, `getCurrentAdmin`, `requireRole`, `loginAction`, and `logoutAction`.

- [ ] Test password hashing, constant-time verification behavior, expiry, revocation, cookie attributes, role denial, and rate limiting.
- [ ] Run tests and confirm missing auth modules fail.
- [ ] Implement password hashing with a per-password salt and server-side sessions with hashed tokens.
- [ ] Implement authorization for `owner`, `manager`, and `support`.
- [ ] Implement login/logout actions with generic error messages and authentication rate limiting.
- [ ] Protect the dashboard layout server-side and wire the existing form without redesigning it.
- [ ] Verify auth tests and localized redirects, then commit with `feat: secure admin dashboard access`.

### Task 5: Catalog and inventory application services

**Files:**
- Create: `src/server/catalog/service.ts`
- Create: `src/server/inventory/service.ts`
- Create: `src/server/catalog/actions.ts`
- Create: `src/server/catalog/service.test.ts`
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`

**Interfaces:**
- Produces: `listProducts`, `getProduct`, `createProduct`, `updateProduct`, `archiveProduct`, `adjustInventory`, and validated admin actions.

- [ ] Test SKU uniqueness, variant validation, archival, insufficient stock, and append-only inventory adjustments.
- [ ] Implement services with authorization and audit recording at mutation boundaries.
- [ ] Seed the current static catalog into the local database without deleting `src/lib/products.ts`.
- [ ] Replace dashboard demo product mutations with server actions while preserving markup.
- [ ] Verify catalog tests and dashboard rendering, then commit with `feat: connect catalog and inventory services`.

### Task 6: Customers, orders, and dashboard queries

**Files:**
- Create: `src/server/customers/service.ts`
- Create: `src/server/orders/service.ts`
- Create: `src/server/dashboard/queries.ts`
- Create: `src/server/orders/service.test.ts`
- Modify: `src/app/[locale]/(dashboard)/clients/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/commandes/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/dashboard/page.tsx`

**Interfaces:**
- Produces: `upsertGuestCustomer`, `createOrder`, `transitionOrder`, `listCustomers`, `listOrders`, and `getDashboardSummary`.

- [ ] Test server-side total recalculation, idempotent order creation, customer address persistence, stock reservation, and authorized transitions.
- [ ] Implement transaction-safe services and dashboard aggregate queries.
- [ ] Replace demo reads on the three dashboard pages without changing their visual structure.
- [ ] Verify service tests and empty/loading/error states, then commit with `feat: connect customer and order workflows`.

### Task 7: Checkout and development provider adapters

**Files:**
- Create: `src/server/payments/provider.ts`
- Create: `src/server/payments/development-provider.ts`
- Create: `src/server/payments/service.ts`
- Create: `src/server/notifications/provider.ts`
- Create: `src/server/notifications/development-provider.ts`
- Create: `src/server/checkout/service.ts`
- Create: `src/server/checkout/checkout.test.ts`
- Create: `src/app/api/webhooks/payments/[provider]/route.ts`
- Modify: `src/app/[locale]/commande/paiement/page.tsx`
- Modify: `src/app/[locale]/commande/confirmation/page.tsx`

**Interfaces:**
- Produces: `PaymentProvider`, `NotificationProvider`, `startCheckout`, `handlePaymentEvent`, and deterministic development payment outcomes.

- [ ] Test price tampering rejection, insufficient stock, idempotent checkout, duplicate events, success/failure transitions, and notification recording.
- [ ] Implement provider interfaces and local adapters that persist every event.
- [ ] Implement checkout orchestration and webhook event deduplication.
- [ ] Wire the existing payment UI to the development provider and label simulation outside production.
- [ ] Verify checkout tests and the full local guest flow, then commit with `feat: add server-backed development checkout`.

### Task 8: Operational hardening and final verification

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `src/server/observability/logger.ts`
- Create: `src/server/security/redaction.ts`
- Create: `docs/operations.md`
- Create: `docs/production-readiness.md`
- Modify: `README.md`

**Interfaces:**
- Produces: redacted structured logging, CI checks, migration/deployment runbook, backup/restore checklist, and owner decision checklist.

- [ ] Test that credentials, session tokens, payment data, and sensitive address fields are redacted from logs.
- [ ] Implement correlation IDs and structured server logging.
- [ ] Add CI for install, typecheck, lint, tests, build, and migration validation.
- [ ] Replace the template README with project-specific setup and architecture documentation.
- [ ] Document production environment variables, migrations, rollback, backup/restore, monitoring, and unresolved owner decisions.
- [ ] Run fresh install-compatible checks, typecheck, lint, tests, build, and migration/seed smoke tests.
- [ ] Review `git diff` to ensure existing user work was preserved, then commit with `chore: harden fullstack operations`.
