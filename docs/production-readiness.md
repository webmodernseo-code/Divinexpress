# Production readiness

## Implemented without external credentials

- relational schema and versioned SQLite migration;
- idempotent catalog seed from the existing storefront;
- server-side password hashing, sessions, roles, route protection, and login rate limiting;
- server-calculated order totals, stock reservations, and idempotent order creation;
- payment and notification interfaces with persistent development adapters;
- local checkout API disabled in production;
- structured redaction utilities, CI definition, and operating runbook.

## Owner decisions and credentials required before launch

- managed PostgreSQL provider and production connection string;
- public domain and final `NEXT_PUBLIC_SITE_URL`;
- Stripe, PayPal, GeniusPay, Orange Money, or Wave contract and credentials;
- transactional email provider, sender domain, SPF, DKIM, and DMARC;
- object storage/CDN provider and upload limits;
- legal company identity, registered address, SIREN, VAT status, and host details;
- tax jurisdictions, prices including/excluding tax, invoice numbering, and rounding rules;
- shipping zones, carriers, rates, free-shipping threshold, and tracking integration;
- return window, cancellation, refund, privacy retention, and cookie policies;
- final catalog, SKUs, opening stock, product photos, and visual approval.

## Mandatory launch gates

- replace the development payment adapter with a signed-webhook production adapter;
- replace SQLite with managed PostgreSQL and rehearse migration/restore;
- configure secrets in the hosting platform, never in Git;
- pass typecheck, lint, tests, build, end-to-end checkout, accessibility, and security review;
- test payment success, failure, cancellation, duplicate webhook, refund, and provider outage;
- test overselling with concurrent checkouts;
- configure monitoring, alert recipients, backups, retention, and incident ownership;
- complete all legal copy and remove placeholder company/domain values.
