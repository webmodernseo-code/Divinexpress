# Reign Full-Stack Foundation Design

## Objective

Turn the existing Reign storefront and demonstration dashboard into a real server-backed application while preserving the current visual work and avoiding dependencies on external credentials.

## Scope and delivery strategy

The work is split into independently usable increments:

1. platform baseline and local persistence;
2. authentication and authorization;
3. catalog, inventory, customer, and order services;
4. dashboard integration;
5. checkout and provider adapters;
6. operational hardening.

Each increment must work locally without a paid service or API key. External payment, email, media, analytics, and hosting providers remain adapters until credentials and commercial choices are supplied.

## Architecture

Reign remains a single Next.js App Router application. Server Components read through domain services; mutations use authenticated Server Actions or route handlers. UI components never access the database directly.

The dependency flow is:

`UI -> application service -> repository interface -> local database adapter`

Payment, email, and media follow the same boundary:

`application service -> provider interface -> development adapter / production adapter`

This keeps the local application fully testable and allows SQLite to be replaced by managed PostgreSQL without rewriting UI or business rules.

## Data model

The initial domain contains:

- admin users, sessions, roles, and audit events;
- categories, products, variants, media, inventory, and inventory movements;
- customers and addresses;
- carts, cart items, orders, and order items;
- payments, payment events, shipments, returns, and refunds;
- store settings, contact messages, and notification deliveries.

Money is stored as integer minor units plus an ISO currency code. Order items snapshot product names, SKUs, prices, taxes, and discounts so historical orders do not change when the catalog changes. Inventory changes are append-only movements with a computed current quantity.

## Authentication and authorization

The dashboard uses server-side sessions stored in the database. Passwords are salted and hashed by a memory-hard or platform-supported password KDF. Session cookies are HTTP-only, same-site, secure in production, rotated after login, and revocable.

The first local administrator is created by an explicit seed command using development-only environment values. No default production password is embedded in source control. Roles are `owner`, `manager`, and `support`; authorization is enforced in services, not only in navigation.

## Business rules

- Server code recalculates every price and total.
- A checkout cannot request unavailable stock.
- Order and payment creation use idempotency keys.
- Provider callbacks are signature-checked by production adapters and deduplicated before state changes.
- Order state transitions are explicit and audited.
- Destructive catalog operations archive records referenced by orders.
- All external input is validated at the server boundary.

## Development providers

Development payment and email adapters record events locally. They expose deterministic success and failure scenarios for automated tests, but the interface and event lifecycle match production needs. The UI must label simulated payments outside production.

## Error handling and observability

Domain errors use stable codes and safe user messages. Unexpected failures are logged with a correlation ID, while secrets and sensitive personal data are redacted. Audit events record actor, action, entity, timestamp, and structured metadata.

## Testing

- unit tests cover validation, totals, state transitions, and authorization;
- repository integration tests run against an isolated local database;
- route/action tests cover authentication and malformed input;
- end-to-end smoke tests cover admin login, catalog mutation, checkout, and order management;
- production verification requires typecheck, lint, unit/integration tests, build, migration check, and a clean secret scan.

## Security and privacy

Use least privilege, rate-limit authentication and public mutation endpoints, validate uploads, keep secrets out of client bundles, and document retention/export/deletion workflows. Real legal identity, tax policy, consent tooling, and retention durations require owner confirmation before launch.

## Autonomous defaults

- local persistence is used until a managed database is selected;
- guest checkout remains supported;
- the existing FR/EN and EUR/GBP behavior remains intact;
- no subjective redesign is included;
- existing uncommitted frontend changes are preserved;
- no external account, deployment, or real transaction is created autonomously.

## Deferred owner decisions

Production database and hosting, domain, payment providers, transactional email, media storage, tax and shipping rules, legal company data, final catalog assets, and subjective visual approval are explicitly deferred.
