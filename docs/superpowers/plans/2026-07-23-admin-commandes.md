# Admin Commandes (Order Management) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Commandes` `ComingSoon` stub with a real order list (search/filter/pagination) and order detail page (line items, shipping, client, payment info, and manual status transitions).

**Architecture:** Two Server-Component pages reading Prisma directly (no caching layer, matching every other admin page in this codebase), following the exact list/detail split already established by `app/admin/(dashboard)/produits/`. Status transitions are two `'use server'` functions using an atomic conditional `updateMany` (not a naive read-then-write) to guard against concurrent double-submission, mirroring the oversell-race fix already applied to `createOrder` in the checkout work.

**Tech Stack:** Next.js 14 (App Router), Prisma 5 / PostgreSQL. No new dependency.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-23-admin-commandes-design.md`
- No schema changes — `Order`, `OrderItem`, `Payment` already exist in `prisma/schema.prisma` exactly as needed.
- No new npm dependency.
- This project's Vitest setup covers pure `lib/*.ts` functions only — admin pages and Server Actions here are UI, verified manually against a running dev server. No new test files in this plan.
- `Order.totalCents` is always EUR — display it directly via `formatEURCents` from `lib/adminStats.ts`. Never re-derive it from current `ShippingZone` costs (those may have changed since the order was placed).
- `Payment.amountCents` is in XOF and, despite the field name, already holds a whole XOF amount (not sub-unit cents) — display it directly with a thousands-separator, never divide by 100. This is intentionally a different currency from `Order.totalCents`; do not "fix" them into one currency.
- CSS Modules are per-file in this codebase — no cross-file class imports. New stylesheets mirror `produits/page.module.css`'s existing class definitions (confirmed present: `.header`, `.title`, `.error`, `.filterBar`, `.input`, `.select`, `.filterButton`, `.tableCard`, `.empty`, `.table`, `.table th`, `.table td`, `.statusBadge`, `.actions`, `.actionLink`, `.pagination`, `.pageLink`, `.pageActive`) rather than inventing new visual treatments.
- `.statusBadge` is a single flat style (cream background, black text) regardless of status value — matching `Produits`' existing badge exactly, not a per-status color system.
- Design tokens already exist in `app/styles/tokens.css` (`--space-*`, `--radius-*`, `--shadow-card`, `--color-black`, `--color-white`, `--color-cream`, `--font-sans`, `--border-hairline`, `--color-price-sale`) — reuse via `var(--token, fallback)`.
- Next.js is pinned at 14.2.35 — route params/searchParams are synchronous objects, not Promises.
- Canceling an order from the admin restores stock (`ProductVariant.stock` incremented back) — a deliberate improvement over the GeniusPay webhook's current behavior (which does not restore stock on a failed/cancelled payment, per the checkout plan's documented accepted limitation). This plan does not modify the webhook or `createOrder`.

---

### Task 1: Order list page

**Files:**
- Modify: `app/admin/(dashboard)/commandes/page.tsx` (replaces the `ComingSoon` stub)
- Create: `app/admin/(dashboard)/commandes/page.module.css`

**Interfaces:**
- Consumes: `formatEURCents` (`lib/adminStats.ts`), `parsePage`/`pageHref` (`lib/adminPagination.ts`), `prisma` (`lib/prisma.ts`).
- Produces: the `/admin/commandes` route. The sidebar link (`components/Admin/AdminSidebar.tsx`) already points here — no sidebar change needed.

- [ ] **Step 1: Replace the stub page**

```tsx
// app/admin/(dashboard)/commandes/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';
import { formatEURCents } from '@/lib/adminStats';
import { parsePage, pageHref } from '@/lib/adminPagination';
import styles from './page.module.css';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => urlSearchParams.append(key, v));
    } else if (value !== undefined) {
      urlSearchParams.append(key, value);
    }
  }

  const page = parsePage(urlSearchParams);
  const q = (urlSearchParams.get('q') ?? '').trim();
  const status = urlSearchParams.get('statut') ?? '';

  const where = {
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: 'insensitive' as const } },
            { customerEmail: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {}),
    ...(status ? { status: status as OrderStatus } : {})
  };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.order.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Commandes</h1>
      </div>

      <form method="get" className={styles.filterBar}>
        <input
          type="text"
          name="q"
          placeholder="Rechercher un n° de commande ou un email"
          defaultValue={q}
          className={styles.input}
        />
        <select name="statut" defaultValue={status} className={styles.select}>
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Payée</option>
          <option value="FULFILLED">Expédiée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <button type="submit" className={styles.filterButton}>
          Filtrer
        </button>
      </form>

      <div className={styles.tableCard}>
        {orders.length === 0 ? (
          <p className={styles.empty}>Aucune commande ne correspond à ces critères.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° commande</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatOrderDate(order.createdAt)}</td>
                  <td>{order.customerEmail}</td>
                  <td>{formatEURCents(order.totalCents)}</td>
                  <td>
                    <span className={styles.statusBadge}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/commandes/${order.id}`} className={styles.actionLink}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={pageHref(urlSearchParams, pageNumber)}
              className={pageNumber === page ? styles.pageActive : styles.pageLink}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

The `AdminOrdersPage` function name and `searchParams: Record<string, string | string[] | undefined>` shape, plus the manual `URLSearchParams` reconstruction loop, are copied verbatim from `produits/page.tsx` — this is the established pattern for any admin list page that needs multi-param filtering + pagination together (the simpler `searchParams: { error?: string }` typed-object shape used by `categories/page.tsx` is for pages with only a single optional param, which doesn't apply here).

- [ ] **Step 2: Stylesheet**

```css
/* app/admin/(dashboard)/commandes/page.module.css */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6, 24px);
  flex-wrap: wrap;
  gap: var(--space-4, 16px);
}

.title {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0;
}

.filterBar {
  display: flex;
  gap: 10px;
  margin-bottom: var(--space-4, 16px);
  flex-wrap: wrap;
}

.input,
.select {
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 10px 12px;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  outline: none;
}

.input {
  flex: 1;
  min-width: 240px;
}

.filterButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border: none;
  border-radius: var(--radius-full, 999px);
  padding: 10px 18px;
  cursor: pointer;
}

.tableCard {
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
}

.empty {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 14px;
}

.table th {
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
  padding: 8px 12px;
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.table td {
  padding: 12px;
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  vertical-align: middle;
  color: var(--color-black, #0c0407);
}

.statusBadge {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full, 999px);
  background: var(--color-cream, #f6f1e9);
  color: var(--color-black, #0c0407);
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.actionLink {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  background: transparent;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.12));
  border-radius: var(--radius-full, 999px);
  padding: 6px 12px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.pagination {
  display: flex;
  gap: 6px;
  margin-top: var(--space-4, 16px);
}

.pageLink,
.pageActive {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm, 8px);
  padding: 6px 12px;
  text-decoration: none;
}

.pageLink {
  color: var(--color-black, #0c0407);
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.12));
}

.pageActive {
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `npm run dev` (skip if already running). Log into `/admin`, click "Commandes" in the sidebar → the page loads (empty state if no orders exist yet in this database, or a populated table if some do — either is a valid pass, this step just confirms no crash and correct empty-state copy). Try the status filter dropdown and the search box (even against zero/few results) and confirm the URL updates with `?statut=` / `?q=` and the page re-renders without error.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(dashboard)/commandes/page.tsx" "app/admin/(dashboard)/commandes/page.module.css"
git commit -m "feat: add admin order list page with search, status filter, and pagination"
```

---

### Task 2: Order detail page and status-transition Server Actions

**Files:**
- Create: `app/admin/(dashboard)/commandes/[id]/page.tsx`
- Create: `app/admin/(dashboard)/commandes/[id]/page.module.css`
- Create: `app/admin/(dashboard)/commandes/[id]/actions.ts`

**Interfaces:**
- Consumes: `formatEURCents` (`lib/adminStats.ts`), `prisma` (`lib/prisma.ts`). Consumed by Task 1's list page via the `/admin/commandes/${order.id}` links already wired there.
- Produces: `markOrderFulfilled(id: string): Promise<void>` and `cancelOrder(id: string): Promise<void>` — both bound via `.bind(null, order.id)` in `<form action={...}>`, matching `produits/page.tsx`'s existing `setProductStatus.bind(null, product.id, ...)` pattern.

- [ ] **Step 1: Server Actions**

```typescript
// app/admin/(dashboard)/commandes/[id]/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function markOrderFulfilled(id: string): Promise<void> {
  const result = await prisma.order.updateMany({
    where: { id, status: 'PAID' },
    data: { status: 'FULFILLED' }
  });

  if (result.count === 0) {
    redirect(`/admin/commandes/${id}?error=transition-invalide`);
  }

  redirect(`/admin/commandes/${id}`);
}

export async function cancelOrder(id: string): Promise<void> {
  const cancelled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return null;

    const result = await tx.order.updateMany({
      where: { id, status: { in: ['PENDING', 'PAID'] } },
      data: { status: 'CANCELLED' }
    });
    if (result.count === 0) return null;

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } }
      });
    }

    return order;
  });

  if (!cancelled) {
    redirect(`/admin/commandes/${id}?error=transition-invalide`);
  }

  redirect(`/admin/commandes/${id}`);
}
```

`markOrderFulfilled`'s guard is a single atomic `updateMany` with the required prior status baked into its `where` clause — if the order isn't currently `PAID` (already fulfilled, cancelled, or a concurrent request got there first), `result.count` is `0` and nothing is written. `cancelOrder` uses the same atomic-`updateMany`-as-guard technique inside a `$transaction` (so the status flip and the stock restoration succeed or fail together): it reads the order once for its `items` and existence check, then only proceeds to restore stock if the conditional `updateMany` actually matched and flipped a row — a concurrent request that already changed the status makes this `updateMany` match zero rows, so stock is never double-restored. This mirrors the oversell-race fix already applied to `createOrder` in the checkout work (`app/[locale]/checkout/actions.ts`), which uses the identical atomic-conditional-`updateMany`-inside-`$transaction` technique for the same class of concurrency problem.

- [ ] **Step 2: Detail page**

```tsx
// app/admin/(dashboard)/commandes/[id]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { OrderStatus, PaymentStatus } from '@prisma/client';
import { formatEURCents } from '@/lib/adminStats';
import { markOrderFulfilled, cancelOrder } from './actions';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  SUCCEEDED: 'Réussi',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé'
};

const ERROR_MESSAGES: Record<string, string> = {
  'transition-invalide':
    "Cette commande ne peut plus être modifiée dans cet état — la page a peut-être été rechargée après une autre action."
};

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      payment: true
    }
  });

  if (!order) notFound();

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{order.orderNumber}</h1>
          <p className={styles.subtitle}>{formatOrderDate(order.createdAt)}</p>
        </div>
        <span className={styles.statusBadge}>{STATUS_LABELS[order.status]}</span>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.actions}>
        {order.status === 'PAID' && (
          <form action={markOrderFulfilled.bind(null, order.id)}>
            <button type="submit" className={styles.actionButton}>
              Marquer comme Expédiée
            </button>
          </form>
        )}
        {(order.status === 'PENDING' || order.status === 'PAID') && (
          <form action={cancelOrder.bind(null, order.id)}>
            <button type="submit" className={styles.actionButtonDanger}>
              Annuler la commande
            </button>
          </form>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Articles</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Taille</th>
              <th>Couleur</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.variant.product.nameFr}</td>
                <td>{item.variant.size}</td>
                <td>{item.variant.color}</td>
                <td>{item.quantity}</td>
                <td>{formatEURCents(item.unitPriceCents)}</td>
                <td>{formatEURCents(item.unitPriceCents * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.totalRow}>
          <span>Total commande</span>
          <span>{formatEURCents(order.totalCents)}</span>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Livraison</h2>
        <p className={styles.infoLine}>{order.shippingAddr}</p>
        <p className={styles.infoLine}>{order.country}</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Client</h2>
        <p className={styles.infoLine}>{order.customerEmail}</p>
      </div>

      {order.payment && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Paiement</h2>
          <p className={styles.infoLine}>Fournisseur : {order.payment.provider}</p>
          <p className={styles.infoLine}>Référence : {order.payment.reference}</p>
          <p className={styles.infoLine}>Statut : {PAYMENT_STATUS_LABELS[order.payment.status]}</p>
          <p className={styles.infoLine}>
            Montant : {new Intl.NumberFormat('fr-FR').format(order.payment.amountCents)} {order.payment.currency}
          </p>
        </div>
      )}
    </div>
  );
}
```

`order.payment.amountCents` is formatted with `Intl.NumberFormat('fr-FR')` **without** dividing by 100 and **without** `style: 'currency'` (which would force it through EUR/GBP-style 2-decimal currency formatting) — per this plan's Global Constraints, that field already holds a whole XOF amount despite its name, e.g. `41916` renders as `41 916` (thousands-separated), followed by the literal `XOF` from `order.payment.currency`.

- [ ] **Step 3: Stylesheet**

```css
/* app/admin/(dashboard)/commandes/[id]/page.module.css */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6, 24px);
  gap: var(--space-4, 16px);
}

.title {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0;
}

.subtitle {
  font-family: var(--font-sans);
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0 0;
}

.statusBadge {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full, 999px);
  background: var(--color-cream, #f6f1e9);
  color: var(--color-black, #0c0407);
  white-space: nowrap;
}

.error {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-price-sale, #b3271e);
  background: rgba(179, 39, 30, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 12px;
  margin: 0 0 var(--space-4, 16px);
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: var(--space-6, 24px);
}

.actionButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border: none;
  border-radius: var(--radius-full, 999px);
  padding: 10px 18px;
  cursor: pointer;
}

.actionButtonDanger {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-price-sale, #b3271e);
  background: transparent;
  border: 1px solid rgba(179, 39, 30, 0.3);
  border-radius: var(--radius-full, 999px);
  padding: 10px 18px;
  cursor: pointer;
}

.card {
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
  margin-bottom: var(--space-4, 16px);
}

.sectionTitle {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 var(--space-4, 16px);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 14px;
}

.table th {
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
  padding: 8px 12px;
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.table td {
  padding: 12px;
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  vertical-align: middle;
  color: var(--color-black, #0c0407);
}

.totalRow {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin-top: var(--space-4, 16px);
  padding-top: var(--space-4, 16px);
  border-top: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.infoLine {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-black, #0c0407);
  margin: 0 0 6px;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev` (skip if already running).
- Visit `/admin/commandes/does-not-exist` → 404 page (via `notFound()`).
- From the list page, click "Voir" on a real order → detail page renders all five sections (Articles, Livraison, Client, Paiement — Paiement only if a `Payment` row exists) with correct values; confirm the payment amount shows the raw XOF integer with a thousands separator (e.g. "41 916 XOF"), not a 2-decimal currency-formatted number.
- On a `PAID` order: click "Marquer comme Expédiée" → status badge becomes "Expédiée", the button disappears (no longer `PAID`), "Annuler la commande" also disappears (no longer `PENDING`/`PAID`).
- On a `PENDING` or `PAID` order with known variant stock: note the variant's current stock (e.g. via `/admin/produits`), click "Annuler la commande" → status badge becomes "Annulée", both action buttons disappear, and the variant's stock has increased by exactly the cancelled order's quantity for that variant.
- Reload a `CANCELLED` order's detail page directly by URL after cancelling (simulating a stale page / double-submit) — since neither action button renders for a `CANCELLED` order, confirm there's no way to resubmit from the UI; if you want to exercise the `?error=transition-invalide` path directly, submit a raw POST to the action route via browser dev tools or accept that this path is covered by the `updateMany` guard's logic (already exercised indirectly: submitting either action on an already-terminal order via a second browser tab open to the same detail page before reload would hit it).

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(dashboard)/commandes/[id]/page.tsx" "app/admin/(dashboard)/commandes/[id]/page.module.css" "app/admin/(dashboard)/commandes/[id]/actions.ts"
git commit -m "feat: add order detail page with Fulfilled/Cancel status transitions"
```

---

### Task 3: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors (pre-existing `<img>` warnings elsewhere in the codebase are expected and not part of this plan's scope).

- [ ] **Step 3: Full test suite (regression check)**

Run: `npm test`
Expected: all existing tests still pass — this plan adds no new `lib/*.ts` files, so the count should be unchanged from before this plan started.

- [ ] **Step 4: Confirm no new dependency was added**

Run: `git diff main -- package.json` (or `git log -p package.json` if already committed across this branch)
Expected: no changes to `package.json` at all — this plan adds no scripts and no dependencies.

- [ ] **Step 5: Full manual walkthrough**

With the dev server running and logged into `/admin`:
1. Click "Commandes" in the sidebar → list page loads.
2. Search by a known order number → exactly that order shows. Clear search, search by a known customer email substring → matching orders show.
3. Filter by each of the four statuses in turn → only matching orders show.
4. If there are more than 20 orders, confirm pagination controls appear and page 2+ loads different rows.
5. Click into an order → detail page shows correct articles, livraison, client, and paiement sections.
6. Exercise both status transitions (Fulfilled from Paid, Cancel from Pending or Paid) at least once each and confirm the stock-restoration behavior on cancel, as detailed in Task 2 Step 5.
7. Confirm the storefront and every other admin page are unaffected (`/`, `/fr`, `/en`, `/admin/produits`, `/admin` overview all still load normally).

- [ ] **Step 6: Commit any final fixups**

If Step 5 surfaced issues, fix them and commit:

```bash
git add -A
git commit -m "fix: address manual QA findings from admin Commandes pass"
```

If no issues were found, no commit is needed for this task.
