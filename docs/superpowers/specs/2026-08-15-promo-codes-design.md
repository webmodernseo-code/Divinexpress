# Promo codes — design

## Context

DivinExpress currently has no promo-code system. The homepage `PromoBanner`
(`src/components/home/PromoBanner.tsx`) shows a hardcoded marketing string
(`t('promoCode')` = "DIVINEXPRESS10") with a fake "end of month" countdown.
Nothing validates it — the checkout flow never reads it, and the admin
dashboard has no way to create or manage codes.

Goal: admins create/activate a promo code from the dashboard; the active
code appears on the storefront and actually reduces the order total at
checkout; deactivating a code makes it disappear from the site and stop
working at checkout.

Scoping decisions (confirmed with the user):
- Functional end-to-end (real discount at checkout), not display-only.
- Exactly one active code at a time.
- Minimal fields: code, discount (percentage or fixed amount), active flag.
  No expiry date, no minimum-purchase threshold, no description field.
- Banner redesign: dark theme matching the new Nouveautés carousel
  (`bg-ink`/`text-paper`), with a background image + overlay (like the
  original editorial section this branch already removed), no countdown
  timer (it was fictional — no expiry data exists to back it).

## Data model

New migration `src/server/db/migrations/0005_promo_codes.sql`, registered in
the `MIGRATIONS` array in `src/server/db/migrations/migrate.ts`. Follows the
existing STRICT-table style (see `orders`/`order_items` in `0001_initial.sql`):

```sql
CREATE TABLE promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100) OR
    (discount_type = 'fixed' AND discount_value > 0)
  )
) STRICT;

-- At most one active code at a time, enforced at the DB level.
CREATE UNIQUE INDEX idx_promo_codes_one_active ON promo_codes(active) WHERE active = 1;
```

`discount_value` semantics: for `percentage`, an integer 1-100 (checked at
the DB row level, not just in zod); for `fixed`, minor currency units
(matches the `_minor` convention used everywhere else, e.g. `priceMinor`).

## Domain layer

New `src/server/promotions/` module, mirroring `src/server/catalog/`'s
shape (repository class + zod schemas):

- `schemas.ts` — `createPromoCodeInputSchema` (`code`, `discountType`,
  `discountValue`).
- `repository.ts` — `PromoCodeRepository(database)`:
  - `list()` — all codes, newest first.
  - `create(input)` — validates via schema, inserts with `randomUUID()`,
    wrapped in `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK` (matches
    `CatalogRepository.createProduct`). Unique-code violations surface as
    `DomainError('CONFLICT', 'Code already exists')`.
  - `setActive(id, active)` — if activating, deactivates all other rows in
    the same transaction before setting this one (belt-and-suspenders with
    the partial unique index, which is the actual guarantee).
  - `delete(id)`.
  - `findActive()` — `SELECT * FROM promo_codes WHERE active = 1 LIMIT 1`
    → `PromoCode | null`. Used by both the storefront banner and checkout.
  - `findByCode(code)` — case-insensitive lookup, used by checkout
    validation (independent of `findActive` so a *correct but inactive*
    code can return a clear "this code is no longer active" error instead
    of a generic "not found").

## Checkout integration — security note

Today `OrderService.createOrder` (`src/server/orders/service.ts`) accepts
`discountMinor` as a trusted input on `CreateOrderInput`
(`src/server/orders/schemas.ts`), but the only real caller,
`src/app/api/checkout/route.ts:87`, hardcodes it to `0` — the client never
actually supplies a discount today.

That must stay true. The client will send the **code string** it wants to
apply, never a discount amount:

- `requestSchema` in `src/app/api/checkout/route.ts` gains
  `promoCode: z.string().optional()`.
- The route passes `promoCode` through `checkout.start()` 
  (`src/server/checkout/service.ts`) into `OrderService.createOrder`,
  instead of the hardcoded `discountMinor: 0`.
- Inside `createOrder`, before computing `totalMinor` (currently
  `src/server/orders/service.ts:65`, in the same `BEGIN IMMEDIATE`
  transaction as stock validation): if `promoCode` is present, look it up
  via `PromoCodeRepository.findByCode`. Not found or `active === 0` →
  throw `DomainError('INVALID_PROMO_CODE', ...)`. Otherwise compute
  `discountMinor` from `subtotalMinor` (percentage: `Math.round(subtotalMinor
  * discountValue / 100)`; fixed: `discountValue`), capped at
  `subtotalMinor` so the existing "discount exceeds total" guard
  (`service.ts:66`) still holds as the safety net.
- The server recomputes the discount from the DB every time — the client's
  own "is this code valid" check (below) is a UX convenience only, never
  trusted for the actual charge.

## Checkout UI

There is currently no order-total display anywhere before the confirmation
page (`commande/livraison` and `commande/paiement` show neither subtotal
nor total). Minimal addition, not a full order-summary rebuild:

- New public endpoint `POST /api/promo/validate` — body `{ code }`, no
  auth. Looks up via `findByCode`, returns `{ valid: true, discountType,
  discountValue }` or `{ valid: false }`. Used only for inline feedback
  while typing; the checkout submission always re-validates server-side
  regardless of this response.
- `commande/paiement/page.tsx` gets a small "Code promo" text input +
  "Appliquer" button above the submit button. On success, shows inline
  confirmation text (e.g. "Code appliqué : -10 %"); on failure, an inline
  error, no blocking. Applied code is stored in `CheckoutContext`
  (`src/context/CheckoutContext.tsx`), sessionStorage-backed the same way
  `shipping` already is.
- `/api/checkout` request body includes `promoCode` (from context) when
  present.
- `commande/confirmation/page.tsx` already renders `order.totalMinor`; add
  a discount line showing `order.discountMinor` when it's `> 0`, using the
  same formatter already in scope.

## Admin UI

New dashboard section `src/app/[locale]/(dashboard)/promotions/` (added to
`AdminSidebar.tsx`'s nav list), one page — list + inline create form at the
top (code, discount type select, discount value), each row with an
Activer/Désactiver toggle and a delete action. No separate create/edit
routes needed given the minimal field set — this matches the lighter
`retours` pattern (`src/app/[locale]/(dashboard)/retours/page.tsx` +
`src/app/api/admin/returns/route.ts`) rather than the fuller `produits`
multi-page pattern, since there's no multi-step editing here.

API routes, following the exact auth/error conventions used by
`src/app/api/admin/products/`(`getCurrentAdmin()` → 401,
`requireRole(admin.role, ['owner','manager'])`, zod parse, `DomainError` →
`{ error: error.code }`):

- `src/app/api/admin/promo-codes/route.ts` — `GET` (list), `POST` (create).
- `src/app/api/admin/promo-codes/[id]/route.ts` — `PATCH` (toggle
  `active`), `DELETE`.

## Storefront display

`src/app/[locale]/page.tsx` fetches the active code server-side alongside
the existing `products` fetch — a small standalone function (mirroring
`findOrderConfirmation`'s minimal style, not a full repository round-trip)
— and passes it into `<PromoBanner />` as a prop instead of the banner
calling `t('promoCode')` itself.

`PromoBanner.tsx` redesign:
- If there's no active code, the section **renders nothing** (`return
  null`) — this is the visible "deactivated" signal the user asked for.
- If active: dark themed (`bg-ink`/`text-paper`, matching
  `NewArrivalsCarousel`) with a background image + dark overlay (same
  visual language as the original editorial section this branch replaced:
  full-bleed image, `bg-ink/50` overlay, centered content), showing the
  real code and the real discount (formatted as "-10%" or "-5,00 €"
  depending on `discountType`), a copy-to-clipboard button (kept from the
  current implementation), and no countdown timer.
- The existing copy-code interaction (`navigator.clipboard`, "Copié !"
  feedback) is preserved as-is; only the data source and countdown are
  removed/replaced.

## Out of scope (flagged, not building now)

- Minimum-purchase thresholds, expiry dates, per-customer/one-time-use
  limits, multiple simultaneous codes, usage analytics. All would layer
  cleanly onto `promo_codes` later (more columns + more admin fields) but
  aren't part of this pass.
