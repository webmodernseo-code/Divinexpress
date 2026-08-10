# Reign Premium Pre-Supabase Hardening Design

Date: 2026-08-11
Status: approved

## Goal

Make Reign a credible, premium, end-to-end commerce product before the Supabase integration phase. Work proceeds in this strict order: customer storefront, operational dashboard, then transversal hardening. The existing visual identity remains intact and is refined rather than redesigned.

## Scope

This phase completes the storefront purchase journey, removes misleading or incomplete dashboard interactions, eliminates runtime hard-coded business data, standardizes application states, and prepares external providers for later API-key activation. It does not connect Supabase, purchase provider accounts, deploy the application, or claim that an unavailable external service is connected.

## Architecture

Reign keeps its existing layered architecture:

- Next.js pages orchestrate data and metadata.
- Client Components own only local, interactive state.
- Route Handlers and Server Actions validate input and enforce access at the server boundary.
- Domain services own pricing, stock, order, return, refund, and status-transition rules.
- Repositories are the only database-dependent layer.
- Provider interfaces isolate payments, notifications, WhatsApp, AI, and media storage.

Initial reads occur in Server Components where practical. Client-side requests are reserved for mutations and interactions requiring local refresh. Application and domain types remain independent from database-vendor types so a later Supabase adapter can replace persistence without rewriting the UI or business rules.

Large components are split only where there is a clear responsibility boundary, such as search, mobile navigation, order summary, or product editing. Unrelated refactors are excluded.

## Storefront Experience

The customer journey is completed before dashboard work:

- Desktop and mobile navigation are stable, accessible, and usable by keyboard.
- Search returns persisted catalog results and provides useful empty and error states.
- Home content has consistent rhythm without adding decorative marketing sections.
- Product cards use stable media dimensions and consistently expose price, availability, favorites, and interaction feedback.
- Product details clearly present gallery media, variants, availability, sizing information, and add-to-cart state.
- Favorites, cart drawer, cart page, delivery, payment, and confirmation share consistent product and price information.
- Forms validate at field level, preserve entered data after expected failures, and expose pending state without layout shift.
- Order confirmation contains the persisted reference, summary, and accurate next steps.
- Unconfigured payment methods are accurately disabled or marked unavailable.
- Mobile, tablet, and desktop layouts prioritize purchasing actions and prevent text or control overlap.

Every visible action must perform a supported command, navigate to a functional destination, or be removed or accurately disabled.

## Operational Dashboard

The dashboard remains visually consistent with its current direction while behaving like a dense, predictable operational tool:

- Products support persisted search, filtering, creation, editing, activation, pricing, inventory adjustment, and confirmed deletion.
- Orders expose persisted detail, allowed status transitions, shipment creation, carrier, and tracking data.
- Customers expose useful persisted identity and order history without decorative commands.
- Returns support review, approval, rejection, and development refund-state tracking without claiming external funds moved.
- Messages support selection, reply, resolution, internal notes, and unread state.
- Settings are schema validated, persisted, and accompanied by inline success and failure feedback.
- External integrations expose their actual configuration state and remain unavailable until configured.
- Browser alerts are replaced with accessible, contextual feedback.
- Loading, empty, validation, authorization, network-error, success, and mutation-pending states follow shared patterns.
- Mobile navigation, keyboard operation, stable control dimensions, and non-overlapping layouts are required.

The UI only offers mutations allowed by the current server-side domain state.

## Data Integrity And Runtime Data Policy

No page, component, production repository, or runtime fallback may contain or silently substitute hard-coded business records. Products, variants, inventory, orders, customers, returns, messages, and store settings come exclusively from persistence. A genuinely empty database renders useful empty states.

Development fixtures remain allowed only in the explicit database seed at `src/server/db/seed.ts`. They are loaded only through an intentional command such as `npm run db:seed`, never automatically and never as a production fallback. Legacy browser-storage demo repositories and runtime demo contexts are removed when no longer referenced.

Server-calculated prices, totals, availability, and allowed transitions remain authoritative. Multi-record operations use transactions. Inputs are schema validated, malformed bodies return controlled errors, administrative reads and mutations enforce authentication and roles, and logs never expose secrets or sensitive payloads.

## Mutations And Error Handling

Each mutation follows one contract:

1. Parse and validate input with Zod.
2. Authenticate and authorize administrative operations.
3. Delegate to a domain service or focused repository operation.
4. Return a structured success value or an expected error value.
5. Update or revalidate the smallest relevant UI scope.

Expected validation, conflict, unavailable-provider, and authorization failures appear in context with an appropriate recovery action. Unexpected rendering failures are handled by route-level error boundaries and logged through the redacting logger. Route-level loading UI or local skeletons stabilize important transitions. Empty results are treated as a supported state rather than an exception.

## External Provider Readiness

Payment, transactional email, WhatsApp, AI, and media storage providers expose explicit `configured`, `unavailable`, and `error` states through their existing or refined interfaces. Missing credentials fail clearly and never masquerade as a live connection.

Credential-free adapters may support deterministic local development but are gated to development and must fail closed in production. `.env.example` and operational documentation list required variables without real secrets or misleading default credentials. Provider-specific code remains behind adapters so keys can be added later without changing product components or domain rules.

Supabase is intentionally deferred. The future phase may replace the persistence adapter and add selected storage or authentication capabilities, but UI components must not call Supabase directly.

## Verification

Verification scales with the affected workflow and includes:

- Unit and component tests for critical UI behavior and mutation contracts.
- Tests for loading, empty, validation, error, success, and authorization states.
- Route tests for malformed JSON, missing authentication, insufficient roles, and domain conflicts.
- Browser journeys for storefront navigation, search, product selection, favorites, cart, checkout, confirmation, login, products, orders, returns, messages, and settings.
- Desktop and mobile visual checks for layout stability, text fit, interaction states, console errors, failed requests, and keyboard navigation.
- Full TypeScript checking, ESLint, Vitest, a production build, and `git diff --check`.

The closing audit distinguishes verified behavior, environment-limited checks, external provider gates, and work intentionally deferred to Supabase. No check is described as passing without fresh command or browser evidence.

## Delivery Order

1. Audit and complete the customer storefront journey.
2. Complete dashboard workflows and remove misleading interactions.
3. Remove runtime demo data and harden shared states, accessibility, responsive behavior, tests, and provider readiness.
4. Run the full verification matrix and record remaining external gates.

## Non-Goals

- Connecting Supabase during this phase.
- Connecting, purchasing, or claiming production payment, email, WhatsApp, AI, or storage services.
- Replacing the established Reign identity with a new visual direction.
- Adding speculative features that do not improve the current commerce or operational journeys.
- Automatically seeding production or using demonstration records as runtime fallback data.
