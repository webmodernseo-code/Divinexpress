# Admin — Commandes (Order Management) — Design Spec

**Context:** DivinExpress's admin dashboard has 8 sections still behind the `ComingSoon` stub. This is the first of them to be built out, chosen because the checkout & GeniusPay work (already implemented, on branch `worktree-checkout-geniuspay`) means real `Order`/`OrderItem`/`Payment` rows now exist with no admin surface to view or act on them. This is the first of a planned sequence of 8 independent sub-projects (Commandes → Clients → Analytique → Paramètres (remainder) → Réductions → Messages → Retours → Blog), each getting its own spec/plan/implementation cycle.

**Goal:** Replace the `Commandes` stub (`app/admin/(dashboard)/commandes/page.tsx`, currently `<ComingSoon title="Commandes" />`) with a real order list and detail view, following the exact list/detail pattern already established by the `Produits` section (`app/admin/(dashboard)/produits/`).

## 1. Data (no schema changes)

`Order`, `OrderItem`, `Payment` already exist in `prisma/schema.prisma` exactly as needed — no migration in this project. Relevant shape:

```
Order { id, orderNumber, customerEmail, shippingAddr, country, currency, status: OrderStatus, totalCents, items: OrderItem[], payment: Payment?, createdAt, updatedAt }
OrderItem { id, orderId, variantId, quantity, unitPriceCents }
Payment { id, orderId, provider, reference, status: PaymentStatus, amountCents, currency, createdAt }
OrderStatus = PENDING | PAID | FULFILLED | CANCELLED
PaymentStatus = PENDING | SUCCEEDED | FAILED | REFUNDED
```

## 2. Route structure

- `app/admin/(dashboard)/commandes/page.tsx` — list (Server Component, direct Prisma read, matching every other admin page's no-cache-needed convention).
- `app/admin/(dashboard)/commandes/[id]/page.tsx` — detail.
- `app/admin/(dashboard)/commandes/[id]/actions.ts` — Server Actions for status transitions.
- `app/admin/(dashboard)/commandes/page.module.css`, `app/admin/(dashboard)/commandes/[id]/page.module.css` — new stylesheets. CSS Modules are per-file in this codebase (no cross-file class imports anywhere in the admin dashboard); mirror `produits/page.module.css`'s existing class definitions verbatim into these new files (`.tableCard`, `.table`, `.statusBadge`, `.actionLink`, `.actionButton`, `.actionButtonDanger`, `.select`, `.empty` all confirmed present there) rather than inventing new visual treatments.

## 3. List page (`/admin/commandes`)

**Columns:** order number, date (`createdAt`, formatted as an absolute short date via `new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })` — a paginated, searchable historical list needs scannable absolute dates, not relative ones; `lib/adminActivity.ts`'s `formatRelativeTime` is the right tool for the Vue d'ensemble's "recent activity" feed but the wrong one here — do not reuse it for this table), client email, total (formatted via `formatEURCents` from `lib/adminStats.ts`, already used on the Vue d'ensemble page — `Order.totalCents` is always EUR per the checkout work's Global Constraints), status badge (reuses `.statusBadge` — single style, no per-status color, matching `Produits`' existing badge exactly — not the multi-color badge treatment).

**Filters:** status (`<select>` populated from `OrderStatus`, matching Produits' status filter `<select name="statut">` pattern exactly) and free-text search box matching against `orderNumber` (via `contains`, case-insensitive) OR `customerEmail` (via `contains`, case-insensitive) — combined with Prisma's `OR` clause, same shape as Produits' name-search `where` clause.

**Pagination:** reuses `lib/adminPagination.ts` (`parsePage`, `pageHref`) and the `PAGE_SIZE = 20` / `skip`/`take` / `totalPages` pattern verbatim from `produits/page.tsx`.

**Sort:** newest first (`orderBy: { createdAt: 'desc' }`) — no sort control, matching Produits' fixed default sort.

**Row action:** clicking anywhere on the row (or an explicit "Voir" link, matching Produits' "Éditer" link styling) navigates to `/admin/commandes/[id]`.

**Empty state:** if `totalCount === 0`, show `<p className={styles.empty}>Aucune commande ne correspond à ces critères.</p>` — the exact wording/class pattern `produits/page.tsx` already uses for its own zero-results case. No special first-run illustration needed.

## 4. Detail page (`/admin/commandes/[id]`)

`notFound()` if the order doesn't exist, matching `produits/[id]/page.tsx`'s existing detail-page-by-id pattern (same admin section, same shape). Reads the order with `items: { include: { variant: { include: { product: true } } } }` and `payment: true`.

**Sections:**
1. **Header:** order number, status badge, created date.
2. **Articles:** table of `OrderItem`s — product name, size, color (via `variant`), quantity, unit price, line total. A subtotal + shipping-cost-implied-total line is NOT recomputed here — `Order.totalCents` is shown directly as the source of truth (it was frozen at order creation; do not re-derive it from current `ShippingZone` costs, which may have changed since).
3. **Livraison:** shipping address (`shippingAddr`, preserved as the single multi-line field it is — no decomposition), country.
4. **Client:** `customerEmail` (plain text, no link — a full customer view is the separate, later "Clients" sub-project).
5. **Paiement:** provider (`"geniuspay"`), reference, payment status, amount + currency (`Payment.amountCents` in XOF — display as-is, e.g. "41 916 XOF", no conversion; this is intentionally a different currency from the order total per the checkout work's Global Constraints, and must not be "fixed" into one currency here either).

**Actions** (both are `'use server'` functions bound to the order id, submitted via a `<form action={...}>` button — matching `produits/page.tsx`'s existing `setProductStatus.bind(null, id, ...)` button-form pattern, not client-side fetch calls):

- **"Marquer comme Expédiée"** — visible only when `status === 'PAID'`. Transitions `Order.status` to `FULFILLED`. No stock or payment changes.
- **"Annuler la commande"** — visible whenever `status` is `PENDING` or `PAID` (not shown for already-`FULFILLED` or already-`CANCELLED` orders). In a single Prisma `$transaction`: increments each `OrderItem`'s `variant.stock` by its `quantity` (restoring what `createOrder` decremented at checkout), and sets `Order.status` to `CANCELLED`. This intentionally improves on the webhook's current behavior (which does not restore stock on a failed/cancelled payment, per the checkout plan's accepted limitation) — scoped only to this manual admin action, not a retroactive fix to the webhook.

**Invalid transition handling:** if a transition is attempted on an order whose current status no longer permits it (e.g., a concurrent request already cancelled the order), the Server Action re-checks status inside the transaction and redirects back to the detail page with an error query param + inline message, matching `produits/categories/actions.ts` + `categories/page.tsx`'s existing `redirect('...?error=...')` + `ERROR_MESSAGES` map pattern — no exception-based 500.

## 5. Out of scope for this sub-project

- Refunds (no `PaymentStatus.REFUNDED` transition wired up — `Payment.status` stays whatever the webhook set it to; this page never writes to `Payment`).
- Editing order contents, address, or email after creation.
- Customer purchase history / customer-level view (belongs to the later "Clients" sub-project).
- Any change to `createOrder`, the webhook route, or the storefront checkout flow.
- Notifying the customer (e.g., a "shipped" email) when marking Fulfilled — no email infrastructure exists in this project yet.

## 6. Testing

Per this project's established convention (Vitest covers pure `lib/*.ts` only; admin pages/Server Actions are UI, verified manually against a running dev server) — no new `lib/*.ts` pure functions are introduced here, so no new Vitest suite is expected. Manual verification: paginate/filter/search the list against real seeded orders, open a detail page, mark an order Fulfilled, cancel a Pending and a Paid order and confirm stock increments correctly in both cases, attempt an invalid transition (e.g., reload a stale Cancelled order's page and try to cancel again) and confirm the friendly error path.
