# Reign Fullstack Store and Dashboard Correlation Design

Date: 2026-08-10
Status: approved

## Goal

Prepare Reign as a complete, credential-free fullstack application in which the storefront and administration dashboard share one persistent source of truth. External production services will be connected later without redesigning the commerce domain.

## Scope

The delivered system must work locally with deterministic development adapters. It must cover catalog browsing, cart and checkout, customers, orders, inventory, shipments, returns, refunds, messages, settings, authentication, and dashboard reporting. No deployment, destructive database reset, or production provider connection is included.

## Architecture

The relational commerce database is the source of truth. Storefront pages and admin APIs must use server repositories rather than separate static or page-local collections. Route handlers and Server Actions validate inputs, authenticate administrators close to protected data, and delegate business rules to domain services or repositories.

Payment, notification, AI, WhatsApp, media storage, and database hosting remain behind provider boundaries. Development adapters make supported workflows testable without credentials. Production adapters must fail closed when required configuration is absent and document the variables needed for future activation.

## Storefront and Dashboard Contract

- Products, translations, variants, prices, availability, images, and inventory shown on the storefront originate from the same records edited by the dashboard.
- Checkout resolves current variants and prices on the server, creates or updates the customer, persists the order and its items, records the development payment, and adjusts inventory atomically.
- New orders, customers, stock movements, and messages appear in dashboard lists and badges without demo-only duplication.
- Admin product and inventory changes affect subsequent storefront reads.
- Admin order transitions follow the domain state machine. Shipment creation persists carrier and tracking information.
- Returns and refunds have explicit persisted states. A development refund records intent and state without claiming that external funds moved.
- Store settings are validated and persisted. Storefront code consumes only settings that have a defined public effect.

## Dashboard Behavior

Every visible command must either perform a real supported mutation, navigate to a functional workflow, or be removed/disabled with accurate copy. Pages must expose loading, empty, success, validation, authorization, and server-error states. Currency and locale formatting must use persisted order or product currency rather than hard-coded assumptions.

The dashboard covers overview metrics, products and inventory, orders and shipments, customers, returns and refunds, unified messages, and store settings. Authentication and role authorization are enforced on every admin route, including mutations.

## Data Integrity and Security

- Server-calculated totals and stock constraints remain authoritative.
- Mutations use transactions when multiple records must change together.
- Request bodies are schema validated and malformed JSON returns a controlled 400 response.
- Missing authentication returns 401 and insufficient roles return 403.
- Secrets never reach client components, logs, Git, or API responses.
- Provider webhooks require signature validation and idempotency before production activation.
- Existing data is preserved; migrations are additive and repeatable.

## External Provider Readiness

The application will retain credential-free adapters for local use and explicit interfaces for PostgreSQL hosting, payments, transactional email, WhatsApp, AI, and media storage. `.env.example` and operations documentation describe required variables and readiness checks. No development simulation may masquerade as a real production transaction.

## Verification

Verification includes focused unit and integration tests, authenticated route tests, full type checking, linting, the complete Vitest suite, a production build, and browser journeys for login, catalog-to-checkout, dashboard visibility, inventory correlation, order fulfillment, returns, messages, and settings. Browser checks cover desktop and mobile layouts, console errors, failed requests, and incoherent overlaps.

## Deliverables

- Implemented and tested storefront-dashboard correlation.
- Functional dashboard actions with unsupported decoration removed.
- Provider-ready configuration and documentation.
- Final audit organized by severity and a store-to-dashboard correlation matrix.
- Evidence for every verification command that completes, with unresolved environmental or external gates stated explicitly.

## Explicit Non-Goals

- Connecting or purchasing production provider accounts.
- Deploying the application.
- Resetting existing production or local data.
- Claiming real payment, email, WhatsApp, AI, or media delivery without configured credentials.
