# Reign Fullstack Audit - 2026-08-10

## Executive Summary

The storefront and dashboard previously had a relational backend, but the public catalog still read a static TypeScript collection. Admin edits therefore did not affect the products customers saw. This audit corrected that primary disconnect and hardened the adjacent cart, checkout, inventory, order, and settings flows.

Reign now has a credential-free fullstack path suitable for local development. Production services remain intentionally inactive until their accounts and secrets are supplied.

## Resolved Findings

### Critical

- **Storefront/dashboard catalog split:** the home collection and product pages now read active products, translations, variants, prices, and aggregate stock from the same database used by the admin product API.
- **Order status bypass:** dashboard order updates now use the domain state machine instead of writing arbitrary statuses directly.

### High

- **Multi-variant inventory divergence:** setting dashboard stock now targets aggregate product stock rather than overwriting only the first variant.
- **Multi-variant price divergence:** dashboard base-price edits now update every active variant, so checkout does not charge an old price for a different size or color.
- **Checkout error data loss:** the payment page validates both HTTP status and response shape before clearing the cart. Failed or malformed responses preserve the cart.
- **Unrestricted settings writes:** the settings API now accepts only a strict, typed allowlist and rejects unknown or invalid values.

### Medium

- **Dynamic product cart totals:** cart lines retain the displayed price for products created through the dashboard; checkout still recalculates the authoritative price from the database.
- **Misleading integration state:** Stripe, PayPal, GeniusPay, and WhatsApp are no longer shown as connected without credentials. Their controls clearly remain unavailable until provider setup.

## Correlation Matrix

| Store action/state | Persistent records | Dashboard visibility/action | Status |
| --- | --- | --- | --- |
| Browse product | products, variants, inventory movements | Products and inventory | Connected |
| Admin edits product translation/status | products | Public home/product pages | Connected |
| Admin edits base price | all active product variants | Public price and server checkout price | Connected |
| Admin edits aggregate stock | inventory movements | Public availability data and checkout constraint | Connected |
| Add dynamic product to cart | browser cart with display snapshot | Server resolves current variant at checkout | Connected |
| Complete development checkout | customers, addresses, orders, items, payments, payment events, inventory movements, notifications | Overview, orders, customers, stock badges | Connected |
| Update order state | orders | Order list/detail and dashboard metrics | Connected with state machine |
| Create shipment | shipments | Order detail tracking | Connected; carrier and tracking required |
| Submit contact/WhatsApp message | conversations and messages | Unified messages and unread badge | Connected; live delivery requires credentials |
| Update store settings | store_settings | Settings dashboard | Connected with allowlist |
| Return/refund workflow | returns/refunds/orders | Returns and order pages | Persisted foundation present; live provider refund requires credentials |

## Verification Evidence

- `npm.cmd run typecheck`: passed after the implementation changes.
- Catalog repository and storefront: 6 focused tests passed.
- Order service: 5 focused tests passed, including invalid transitions and missing orders.
- Cart and checkout-response handling: 11 focused tests passed.
- HTTP smoke checks: `/fr`, `/en`, `/fr/produit/homme-hoodie-yahweh`, and `/fr/connexion` returned 200 from the running Next.js server.
- Anonymous admin API checks: products, orders, customers, returns, messages, and settings all returned 401.
- `git diff --check`: passed before the implementation commit.

## Environment-Limited Checks

- Full ESLint and targeted ESLint both exceeded five minutes without output in the OneDrive workspace.
- The complete Vitest invocation starts but intermittently cannot start a worker. Focused tests pass when run with `--pool=forks` and Node test environments.
- A controlled browser was unavailable in this session, so visual desktop/mobile screenshots and interactive UI automation are not claimed.
- Repeated `db:setup` was blocked by Windows reporting `uv_os_get_passwd returned ENOMEM`; earlier schema/seed idempotency tests remain in the suite.
- A fresh production build must be rerun after freeing memory or from CI/a non-synced checkout.

## External Gates

- Managed PostgreSQL connection and rehearsed migration/restore.
- Signed production payment provider and webhook credentials.
- Transactional email provider and verified sender domain.
- WhatsApp Business credentials and verified webhook.
- Object storage/CDN and secure media upload flow.
- Final company identity, taxes, shipping rates, return policy, privacy/cookie policy, catalog, and opening stock.
- Monitoring, alerting, backups, retention, and incident ownership.

## Recommended Launch Gate

Do not enable production checkout until all external gates are configured and CI proves typecheck, lint, the complete test suite, production build, browser checkout, payment failure/cancellation/idempotency, concurrent stock protection, and accessibility/security review.
