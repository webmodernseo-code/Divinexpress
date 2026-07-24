# Codes Promo (Réductions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Réductions` `ComingSoon` stub with a real discount/promo code system: admin CRUD for codes (percentage or fixed amount, optional expiration), a live preview on the checkout page, and real server-side application to `Order` at commande creation.

**Architecture:** A new `DiscountCode` Prisma model plus three new fields on `Order` (real schema migration). Admin CRUD follows the exact list/create/edit split already established by `app/admin/(dashboard)/produits/` (list page + `nouveau/` + `[id]/` pages, a shared form component, Server Actions with redirect-on-error). Checkout gets a new `validateDiscountCode` Server Action for live preview and `createOrder` is extended to independently re-validate and apply the code — the previewed amount is never trusted at order-creation time.

**Tech Stack:** Next.js 14 (App Router), Prisma 5 / PostgreSQL, Vitest (Node environment, no jsdom).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-24-codes-promo-design.md`
- This plan requires a real Prisma migration (`npx prisma migrate dev --name add_discount_codes`) — unlike the checkout-geniuspay and admin-commandes plans, which explicitly needed none.
- No new npm dependency.
- Vitest is configured for `**/*.test.ts` only, Node environment, no jsdom — only `lib/discountCode.ts` gets an automated test; admin pages, Server Actions, and the checkout UI change are verified manually against a running dev server, matching every other admin/checkout page in this codebase.
- `code` is always stored and compared **uppercased** — normalize at every write (admin create/update) and every read (checkout preview and `createOrder`), never a case-insensitive DB query.
- A code's `value` means different things by `type`: `PERCENT` stores a plain integer 1-100 (not cents); `FIXED` stores **EUR cents** (matching `ProductVariant.priceCents` convention everywhere else). Never divide a `PERCENT` value by 100 when displaying it, and never treat a `FIXED` value as a raw euro amount without the `×100`/`÷100` conversion at the admin form boundary (same pattern as `updateShippingZoneCost`'s `costEuros` field).
- A discount only ever reduces the product subtotal, never `shippingCostCents` — decided explicitly in the spec, do not apply it to shipping.
- Only one code per order — no stacking, no code list, a single text field.
- No usage-count limit and no minimum-order-amount gate on a code — only `isActive` and an optional `expiresAt` bound it. Do not add either of these; explicitly out of scope.
- Deleting a `DiscountCode` that past orders reference must not fail or touch those orders — `Order.discountCodeId` uses `onDelete: SetNull` (see Task 1); `Order.discountCents` stays as already recorded regardless.
- Design tokens already exist in `app/styles/tokens.css` (`--space-*`, `--radius-*`, `--shadow-card`, `--color-black`, `--color-white`, `--color-cream`, `--font-sans`, `--border-hairline`, `--color-price-sale`) — reuse via `var(--token, fallback)`, matching every existing page/component in this codebase.
- This plan does **not** touch the checkout page's visual layout — the coupon field and "Réduction" summary line are added using the form/summary CSS classes that already exist in `CheckoutForm.module.css` (`.label`, `.input`, `.summaryLine`, `.error`), not a redesign. A separate future project handles the visual restyle.
- Next.js is pinned at 14.2.35 — route params/searchParams are synchronous objects, not Promises.

---

### Task 1: `DiscountCode` model and `Order` schema migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create (generated): `prisma/migrations/<timestamp>_add_discount_codes/migration.sql`

**Interfaces:**
- Produces: `DiscountCode` model (`id`, `code`, `type: DiscountType`, `value: Int`, `isActive: Boolean`, `expiresAt: DateTime?`, `orders: Order[]`, `createdAt`, `updatedAt`); `Order.discountCodeId: String?`, `Order.discountCents: Int` (default `0`) — consumed by every later task.

- [ ] **Step 1: Add the enum and model to `prisma/schema.prisma`**

Add this enum near the other enums (after `enum PaymentStatus { ... }`, before `model ShippingZone`):

```prisma
enum DiscountType {
  PERCENT
  FIXED
}

model DiscountCode {
  id        String       @id @default(cuid())
  code      String       @unique
  type      DiscountType
  value     Int
  isActive  Boolean      @default(true)
  expiresAt DateTime?
  orders    Order[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

- [ ] **Step 2: Add the new fields to `model Order`**

In `prisma/schema.prisma`, find:

```prisma
model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  customerEmail String
  shippingAddr  String
  country       String
  currency      String
  status        OrderStatus @default(PENDING)
  totalCents    Int
  items         OrderItem[]
  payment       Payment?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

Replace it with:

```prisma
model Order {
  id             String        @id @default(cuid())
  orderNumber    String        @unique
  customerEmail  String
  shippingAddr   String
  country        String
  currency       String
  status         OrderStatus   @default(PENDING)
  totalCents     Int
  discountCode   DiscountCode? @relation(fields: [discountCodeId], references: [id], onDelete: SetNull)
  discountCodeId String?
  discountCents  Int           @default(0)
  items          OrderItem[]
  payment        Payment?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

`onDelete: SetNull` is what makes it safe to delete a `DiscountCode` that past orders reference — Postgres nulls out `discountCodeId` on those orders instead of blocking the delete (`Order.discountCents` is untouched, it's a plain snapshot column, not derived from the relation).

- [ ] **Step 3: Run the migration**

```bash
npx prisma migrate dev --name add_discount_codes
```

Expected: prints `Your database is now in sync with your schema` and a new folder appears under `prisma/migrations/` named `<timestamp>_add_discount_codes`. This also regenerates `@prisma/client` (via the `postinstall`/migrate hook) — no separate `prisma generate` call needed.

- [ ] **Step 4: Verify the client picked up the new types**

```bash
npx tsc --noEmit
```

Expected: passes with no errors (nothing references the new fields yet, so this just confirms the generated client compiles).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add DiscountCode model and Order discount fields"
```

---

### Task 2: `lib/discountCode.ts` — pure discount calculation (TDD)

**Files:**
- Create: `lib/discountCode.ts`
- Test: `lib/discountCode.test.ts`

**Interfaces:**
- Consumes: nothing (pure function, no Prisma import — mirrors `lib/shippingZone.ts`'s structural-typing style).
- Produces: `computeDiscountCents(subtotalCents: number, type: DiscountKind, value: number): number` and `type DiscountKind = 'PERCENT' | 'FIXED'` — consumed by Task 3 (admin display), Task 6 (`validateDiscountCode` and `createOrder`).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/discountCode.test.ts
import { describe, it, expect } from 'vitest';
import { computeDiscountCents } from './discountCode';

describe('computeDiscountCents', () => {
  it('computes a percentage discount', () => {
    expect(computeDiscountCents(10000, 'PERCENT', 20)).toBe(2000);
  });

  it('rounds a percentage discount to the nearest cent', () => {
    expect(computeDiscountCents(333, 'PERCENT', 10)).toBe(33); // 33.3 rounds to 33
  });

  it('computes a fixed discount', () => {
    expect(computeDiscountCents(10000, 'FIXED', 1000)).toBe(1000);
  });

  it('clamps a fixed discount to the subtotal, never going negative', () => {
    expect(computeDiscountCents(3000, 'FIXED', 5000)).toBe(3000);
  });

  it('treats 100% as the full subtotal', () => {
    expect(computeDiscountCents(4785, 'PERCENT', 100)).toBe(4785);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/discountCode.test.ts`
Expected: FAIL — `Cannot find module './discountCode'`.

- [ ] **Step 3: Write the implementation**

```typescript
// lib/discountCode.ts
export type DiscountKind = 'PERCENT' | 'FIXED';

export function computeDiscountCents(subtotalCents: number, type: DiscountKind, value: number): number {
  const raw = type === 'PERCENT' ? Math.round((subtotalCents * value) / 100) : value;
  return Math.min(Math.max(raw, 0), subtotalCents);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/discountCode.test.ts`
Expected: PASS — 5/5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/discountCode.ts lib/discountCode.test.ts
git commit -m "feat: add computeDiscountCents pure helper"
```

---

### Task 3: Admin Réductions Server Actions

**Files:**
- Create: `app/admin/(dashboard)/reductions/actions.ts`

**Interfaces:**
- Consumes: `prisma` (`lib/prisma.ts`), `Prisma.PrismaClientKnownRequestError` (`@prisma/client`) — same P2002-catch pattern as `app/admin/(dashboard)/produits/actions.ts:88`.
- Produces: `createDiscountCode(formData)`, `updateDiscountCode(id, formData)`, `toggleDiscountCodeActive(id)`, `deleteDiscountCode(id)` — consumed by Task 5's pages.

- [ ] **Step 1: Write the actions**

```typescript
// app/admin/(dashboard)/reductions/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function parseValue(type: string, rawValue: FormDataEntryValue | null): number | null {
  if (rawValue === null || String(rawValue).trim() === '') return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return null;

  if (type === 'PERCENT') {
    if (!Number.isInteger(value) || value < 1 || value > 100) return null;
    return value;
  }
  if (type === 'FIXED') {
    if (value <= 0) return null;
    return Math.round(value * 100);
  }
  return null;
}

function parseExpiresAt(raw: FormDataEntryValue | null): Date | null {
  const trimmed = String(raw ?? '').trim();
  return trimmed ? new Date(trimmed) : null;
}

export async function createDiscountCode(formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? '');

  if (!code) {
    redirect('/admin/reductions?error=code-requis');
  }
  const value = parseValue(type, formData.get('value'));
  if (value === null) {
    redirect('/admin/reductions?error=valeur-invalide');
  }

  try {
    await prisma.discountCode.create({
      data: {
        code,
        type: type as 'PERCENT' | 'FIXED',
        value,
        expiresAt: parseExpiresAt(formData.get('expiresAt'))
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      redirect('/admin/reductions?error=code-deja-utilise');
    }
    throw err;
  }

  redirect('/admin/reductions');
}

export async function updateDiscountCode(id: string, formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? '');

  if (!code) {
    redirect(`/admin/reductions/${id}?error=code-requis`);
  }
  const value = parseValue(type, formData.get('value'));
  if (value === null) {
    redirect(`/admin/reductions/${id}?error=valeur-invalide`);
  }

  try {
    await prisma.discountCode.update({
      where: { id },
      data: {
        code,
        type: type as 'PERCENT' | 'FIXED',
        value,
        expiresAt: parseExpiresAt(formData.get('expiresAt'))
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      redirect(`/admin/reductions/${id}?error=code-deja-utilise`);
    }
    throw err;
  }

  redirect('/admin/reductions');
}

export async function toggleDiscountCodeActive(id: string): Promise<void> {
  const discountCode = await prisma.discountCode.findUniqueOrThrow({ where: { id } });
  await prisma.discountCode.update({ where: { id }, data: { isActive: !discountCode.isActive } });
  redirect('/admin/reductions');
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await prisma.discountCode.delete({ where: { id } });
  redirect('/admin/reductions');
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(dashboard)/reductions/actions.ts"
git commit -m "feat: add discount code create/update/toggle/delete server actions"
```

---

### Task 4: `DiscountCodeForm` shared component

**Files:**
- Create: `components/Admin/DiscountCodeForm.tsx`
- Create: `components/Admin/DiscountCodeForm.module.css`

**Interfaces:**
- Consumes: nothing external — a plain, stateless form component (no `'use client'` needed, no interactivity beyond native HTML controls).
- Produces: `<DiscountCodeForm action={...} initialValues={...} />` — consumed by Task 5's `nouveau/page.tsx` and `[id]/page.tsx`.

- [ ] **Step 1: Write the component**

```tsx
// components/Admin/DiscountCodeForm.tsx
import styles from './DiscountCodeForm.module.css';

export type DiscountCodeFormValues = {
  code: string;
  type: 'PERCENT' | 'FIXED';
  valueDisplay: string; // '20' for a 20% code, '10.00' for a 10,00€ code
  expiresAt: string; // 'YYYY-MM-DD' or ''
};

export function DiscountCodeForm({
  action,
  initialValues
}: {
  action: (formData: FormData) => Promise<void>;
  initialValues?: DiscountCodeFormValues;
}) {
  return (
    <form action={action} className={styles.form}>
      <label className={styles.label}>
        Code
        <input
          type="text"
          name="code"
          defaultValue={initialValues?.code}
          required
          className={styles.input}
        />
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Type</legend>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="type"
            value="PERCENT"
            defaultChecked={!initialValues || initialValues.type === 'PERCENT'}
          />
          Pourcentage
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="type"
            value="FIXED"
            defaultChecked={initialValues?.type === 'FIXED'}
          />
          Montant fixe
        </label>
      </fieldset>

      <label className={styles.label}>
        Valeur
        <input
          type="number"
          name="value"
          step="0.01"
          min="0"
          defaultValue={initialValues?.valueDisplay}
          required
          className={styles.input}
        />
        <span className={styles.hint}>Pourcentage (1-100) si Pourcentage, montant en euros si Montant fixe.</span>
      </label>

      <label className={styles.label}>
        Expiration (optionnelle)
        <input
          type="date"
          name="expiresAt"
          defaultValue={initialValues?.expiresAt}
          className={styles.input}
        />
      </label>

      <button type="submit" className={styles.submitButton}>
        Enregistrer
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write the CSS module**

```css
/* components/Admin/DiscountCodeForm.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
  max-width: 420px;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
}

.input {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  padding: 10px 12px;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  outline: none;
}

.hint {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}

.fieldset {
  display: flex;
  gap: var(--space-4, 16px);
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  padding: 12px 14px;
  margin: 0;
}

.legend {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  padding: 0 4px;
}

.radioLabel {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
}

.submitButton {
  align-self: flex-start;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border: none;
  border-radius: var(--radius-full, 999px);
  padding: 12px 28px;
  cursor: pointer;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Admin/DiscountCodeForm.tsx components/Admin/DiscountCodeForm.module.css
git commit -m "feat: add shared DiscountCodeForm component"
```

---

### Task 5: Réductions admin pages (list, create, edit)

**Files:**
- Modify: `app/admin/(dashboard)/reductions/page.tsx` (replaces the `ComingSoon` stub)
- Create: `app/admin/(dashboard)/reductions/page.module.css`
- Create: `app/admin/(dashboard)/reductions/nouveau/page.tsx`
- Create: `app/admin/(dashboard)/reductions/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 3's actions, Task 4's `DiscountCodeForm`, `formatEURCents` (`lib/adminStats.ts`), `prisma` (`lib/prisma.ts`).
- Produces: the `/admin/reductions`, `/admin/reductions/nouveau`, and `/admin/reductions/[id]` routes. The sidebar link (`components/Admin/AdminSidebar.tsx:38`) already points at `/admin/reductions` — no sidebar change needed.

- [ ] **Step 1: Replace the stub list page**

```tsx
// app/admin/(dashboard)/reductions/page.tsx
import Link from 'next/link';
import type { DiscountType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatEURCents } from '@/lib/adminStats';
import { toggleDiscountCodeActive, deleteDiscountCode } from './actions';
import styles from './page.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  'code-requis': 'Merci de renseigner un code.',
  'valeur-invalide': 'Merci de renseigner une valeur valide (1-100 pour un pourcentage, un montant positif pour un montant fixe).',
  'code-deja-utilise': 'Ce code existe déjà.'
};

function formatValue(type: DiscountType, value: number): string {
  return type === 'PERCENT' ? `${value}%` : formatEURCents(value);
}

function formatExpiresAt(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function AdminDiscountsPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Réductions</h1>
        <Link href="/admin/reductions/nouveau" className={styles.addLink}>
          + Nouveau code
        </Link>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Valeur</th>
              <th>Expiration</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((discountCode) => (
              <tr key={discountCode.id}>
                <td>{discountCode.code}</td>
                <td>{discountCode.type === 'PERCENT' ? 'Pourcentage' : 'Montant fixe'}</td>
                <td>{formatValue(discountCode.type, discountCode.value)}</td>
                <td>{formatExpiresAt(discountCode.expiresAt)}</td>
                <td>
                  <span className={discountCode.isActive ? styles.badgeActive : styles.badgeInactive}>
                    {discountCode.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Link href={`/admin/reductions/${discountCode.id}`} className={styles.actionLink}>
                    Modifier
                  </Link>
                  <form action={toggleDiscountCodeActive.bind(null, discountCode.id)}>
                    <button type="submit" className={styles.actionButton}>
                      {discountCode.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </form>
                  <form action={deleteDiscountCode.bind(null, discountCode.id)}>
                    <button type="submit" className={styles.deleteButton}>
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the list page CSS**

```css
/* app/admin/(dashboard)/reductions/page.module.css */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6, 24px);
}

.title {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0;
}

.addLink {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border-radius: var(--radius-full, 999px);
  padding: 10px 18px;
  text-decoration: none;
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

.tableCard {
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
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
}

.badgeActive,
.badgeInactive {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  background: var(--color-cream, #f6f1e9);
  color: var(--color-black, #0c0407);
  border-radius: var(--radius-full, 999px);
  padding: 4px 10px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.actionLink {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  text-decoration: none;
}

.actionButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  background: transparent;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-full, 999px);
  padding: 6px 14px;
  cursor: pointer;
}

.deleteButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-price-sale, #b3271e);
  background: transparent;
  border: 1px solid rgba(179, 39, 30, 0.3);
  border-radius: var(--radius-full, 999px);
  padding: 6px 14px;
  cursor: pointer;
}
```

- [ ] **Step 3: Write the create page**

```tsx
// app/admin/(dashboard)/reductions/nouveau/page.tsx
import { DiscountCodeForm } from '@/components/Admin/DiscountCodeForm';
import { createDiscountCode } from '../actions';
import styles from '../page.module.css';

export default function NewDiscountCodePage() {
  return (
    <div>
      <h1 className={styles.title}>Nouveau code promo</h1>
      <DiscountCodeForm action={createDiscountCode} />
    </div>
  );
}
```

- [ ] **Step 4: Write the edit page**

```tsx
// app/admin/(dashboard)/reductions/[id]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DiscountCodeForm } from '@/components/Admin/DiscountCodeForm';
import { updateDiscountCode } from '../actions';
import styles from '../page.module.css';

export default async function EditDiscountCodePage({ params }: { params: { id: string } }) {
  const discountCode = await prisma.discountCode.findUnique({ where: { id: params.id } });
  if (!discountCode) notFound();

  const valueDisplay =
    discountCode.type === 'PERCENT' ? String(discountCode.value) : (discountCode.value / 100).toFixed(2);

  return (
    <div>
      <h1 className={styles.title}>Modifier {discountCode.code}</h1>
      <DiscountCodeForm
        action={updateDiscountCode.bind(null, discountCode.id)}
        initialValues={{
          code: discountCode.code,
          type: discountCode.type,
          valueDisplay,
          expiresAt: discountCode.expiresAt ? discountCode.expiresAt.toISOString().slice(0, 10) : ''
        }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 6: Manual verification against the dev server**

Run `npm run dev`, then:
1. Visit `/admin/reductions` — list is empty, "+ Nouveau code" link visible.
2. Create a code `SOLDES20` (Pourcentage, 20, no expiration) — redirects to the list, shows `SOLDES20 | Pourcentage | 20% | — | Actif`.
3. Click "Modifier", change the value to 25, save — list reflects `25%`.
4. Click "Désactiver" — badge flips to `Inactif`, button label flips to "Activer".
5. Try creating a duplicate code — see "Ce code existe déjà."
6. Click "Supprimer" — row disappears.
7. Create a second code, use it on a real order (via Task 6/7's flow once wired), then delete the code from `/admin/reductions` — confirm the delete succeeds (no FK error) and that the past order's `discountCents` is unchanged when inspected in the DB (`onDelete: SetNull` only nulls `discountCodeId`, never touches `discountCents`).

- [ ] **Step 7: Commit**

```bash
git add "app/admin/(dashboard)/reductions"
git commit -m "feat: add discount code admin list, create, and edit pages"
```

---

### Task 6: Checkout discount Server Actions (`validateDiscountCode` + `createOrder` extension)

**Files:**
- Modify: `app/[locale]/checkout/actions.ts`

**Interfaces:**
- Consumes: `computeDiscountCents` (`lib/discountCode.ts`).
- Produces: `validateDiscountCode(code: string, subtotalCents: number): Promise<DiscountPreviewResult>` and `CheckoutInput.discountCode?: string` — consumed by Task 7's `CheckoutForm.tsx`.

- [ ] **Step 1: Add the import and the new type**

At the top of `app/[locale]/checkout/actions.ts`, add to the existing imports:

```typescript
import { computeDiscountCents } from '@/lib/discountCode';
```

Add this new exported type near `CheckoutResult`:

```typescript
export type DiscountPreviewResult = { discountCents: number; code: string } | { error: string };
```

- [ ] **Step 2: Add `discountCode` to `CheckoutInput`**

Change:

```typescript
export type CheckoutInput = {
  locale: Locale;
  email: string;
  shippingAddr: string;
  country: string;
  cart: CheckoutCartLine[];
};
```

To:

```typescript
export type CheckoutInput = {
  locale: Locale;
  email: string;
  shippingAddr: string;
  country: string;
  cart: CheckoutCartLine[];
  discountCode?: string;
};
```

- [ ] **Step 3: Add `validateDiscountCode`**

Add this new function anywhere after `buildConfirmationUrl` and before `createOrder`:

```typescript
export async function validateDiscountCode(code: string, subtotalCents: number): Promise<DiscountPreviewResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { error: 'Merci de renseigner un code.' };
  }

  const discountCode = await prisma.discountCode.findUnique({ where: { code: normalized } });
  if (!discountCode || !discountCode.isActive) {
    return { error: 'Code promo invalide.' };
  }
  if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
    return { error: 'Ce code a expiré.' };
  }

  const discountCents = computeDiscountCents(subtotalCents, discountCode.type, discountCode.value);
  return { discountCents, code: normalized };
}
```

- [ ] **Step 4: Re-validate and apply the discount inside `createOrder`**

In `createOrder`, find this existing block:

```typescript
  const subtotalCents = input.cart.reduce((sum, line) => {
    const variant = variants.find((v) => v.id === line.variantId)!;
    return sum + variant.priceCents * line.quantity;
  }, 0);
  const totalCents = subtotalCents + zone.costCents;
  const orderNumber = generateOrderNumber();
```

Replace it with:

```typescript
  const subtotalCents = input.cart.reduce((sum, line) => {
    const variant = variants.find((v) => v.id === line.variantId)!;
    return sum + variant.priceCents * line.quantity;
  }, 0);

  let discountCents = 0;
  let discountCodeId: string | null = null;
  if (input.discountCode) {
    const normalized = input.discountCode.trim().toUpperCase();
    const discount = await prisma.discountCode.findUnique({ where: { code: normalized } });
    if (!discount || !discount.isActive) {
      return { error: "Ce code promo n'est plus valide." };
    }
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return { error: 'Ce code promo a expiré.' };
    }
    discountCents = computeDiscountCents(subtotalCents, discount.type, discount.value);
    discountCodeId = discount.id;
  }

  const totalCents = subtotalCents - discountCents + zone.costCents;
  const orderNumber = generateOrderNumber();
```

This re-validation happens **independently** of any client-side preview — it re-fetches the code and re-checks `isActive`/`expiresAt` at the exact moment of order creation, and recomputes the amount from the server-side `subtotalCents` (real DB prices), never from a client-supplied number.

- [ ] **Step 5: Persist the discount on the created order**

Find this line inside the `tx.order.create({ data: { ... } })` call:

```typescript
          currency: 'EUR',
          status: 'PENDING',
          totalCents,
          items: {
```

Replace it with:

```typescript
          currency: 'EUR',
          status: 'PENDING',
          totalCents,
          discountCents,
          discountCodeId,
          items: {
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 7: Manual verification against the dev server**

Using the `SOLDES20` code created in Task 5:
1. Call `validateDiscountCode('soldes20', 10000)` (e.g. via a scratch `tsx` script or by wiring Task 7 first) — expect `{ discountCents: 2000, code: 'SOLDES20' }`.
2. Submit a real checkout with `discountCode: 'SOLDES20'` — confirm the created `Order.discountCents` is `2000` and `Order.discountCodeId` matches the code's `id`, and `Order.totalCents` is `subtotal - 2000 + shipping`.
3. Deactivate the code in `/admin/reductions`, submit again with the same code — confirm `createOrder` returns `{ error: "Ce code promo n'est plus valide." }` and no `Order` is created.

- [ ] **Step 8: Commit**

```bash
git add app/[locale]/checkout/actions.ts
git commit -m "feat: add validateDiscountCode and apply discounts in createOrder"
```

---

### Task 7: Wire the coupon field into `CheckoutForm`

**Files:**
- Modify: `components/Checkout/CheckoutForm.tsx`

**Interfaces:**
- Consumes: `validateDiscountCode` and the updated `CheckoutInput`/`createOrder` from Task 6.

- [ ] **Step 1: Import `validateDiscountCode` and add discount state**

Change:

```typescript
import { createOrder } from '@/app/[locale]/checkout/actions';
```

To:

```typescript
import { createOrder, validateDiscountCode } from '@/app/[locale]/checkout/actions';
```

In the component body, find:

```typescript
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
```

Add after it:

```typescript
  const [couponInput, setCouponInput] = useState('');
  const [couponPending, setCouponPending] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);
```

- [ ] **Step 2: Include the discount in the displayed total**

Find:

```typescript
  const zoneIndex = resolveShippingZone(country, zones);
  const shippingCostCents = zoneIndex === -1 ? 0 : zones[zoneIndex].costCents;
  const totalCents = subtotalCents + shippingCostCents;
```

Replace with:

```typescript
  const zoneIndex = resolveShippingZone(country, zones);
  const shippingCostCents = zoneIndex === -1 ? 0 : zones[zoneIndex].costCents;
  const discountCents = appliedDiscount?.discountCents ?? 0;
  const totalCents = subtotalCents - discountCents + shippingCostCents;
```

- [ ] **Step 3: Add the "Appliquer" handler**

Add this function next to `handleSubmit` (before or after it):

```typescript
  async function handleApplyCoupon() {
    setCouponPending(true);
    setCouponError(null);

    const result = await validateDiscountCode(couponInput, subtotalCents);

    if ('error' in result) {
      setCouponError(result.error);
      setAppliedDiscount(null);
    } else {
      setAppliedDiscount({ code: result.code, discountCents: result.discountCents });
    }
    setCouponPending(false);
  }
```

- [ ] **Step 4: Pass the applied code into `createOrder`**

Find inside `handleSubmit`:

```typescript
    const result = await createOrder({
      locale,
      email,
      shippingAddr,
      country,
      cart: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
    });
```

Replace with:

```typescript
    const result = await createOrder({
      locale,
      email,
      shippingAddr,
      country,
      cart: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      discountCode: appliedDiscount?.code
    });
```

- [ ] **Step 5: Add the coupon input to the form**

Find (the country `<label>` block, right before the submit `<button>`):

```typescript
          <label className={styles.label}>
            {locale === 'fr' ? 'Pays' : 'Country'}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={styles.input}>
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_NAMES[code]?.[locale] ?? code}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting} className={styles.submitButton}>
```

Insert a coupon block between them:

```typescript
          <label className={styles.label}>
            {locale === 'fr' ? 'Code promo' : 'Discount code'}
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className={styles.input}
            />
          </label>
          {couponError && <p className={styles.error}>{couponError}</p>}
          {appliedDiscount && (
            <p className={styles.error} style={{ color: '#0d6630', background: 'rgba(13, 102, 48, 0.08)' }}>
              {locale === 'fr' ? 'Code appliqué : ' : 'Code applied: '}
              {appliedDiscount.code}
            </p>
          )}
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={couponPending || !couponInput.trim()}
            className={styles.submitButton}
          >
            {locale === 'fr' ? 'Appliquer' : 'Apply'}
          </button>

          <label className={styles.label}>
            {locale === 'fr' ? 'Pays' : 'Country'}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={styles.input}>
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_NAMES[code]?.[locale] ?? code}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting} className={styles.submitButton}>
```

- [ ] **Step 6: Add the "Réduction" line to the summary**

Find:

```typescript
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
            <span>{formatPrice(subtotalCents, locale)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
            <span>{formatPrice(shippingCostCents, locale)}</span>
          </div>
```

Replace with:

```typescript
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
            <span>{formatPrice(subtotalCents, locale)}</span>
          </div>
          {appliedDiscount && (
            <div className={styles.summaryLine}>
              <span>{locale === 'fr' ? 'Réduction' : 'Discount'}</span>
              <span>-{formatPrice(discountCents, locale)}</span>
            </div>
          )}
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
            <span>{formatPrice(shippingCostCents, locale)}</span>
          </div>
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 8: Manual verification against the dev server**

Using `SOLDES20` (20%, active, no expiration) from Task 5:
1. Add an item to cart, go to `/fr/checkout`.
2. Type `soldes20`, click "Appliquer" — a green "Code appliqué : SOLDES20" message appears, a "Réduction" line appears in the summary showing 20% of the subtotal, negative, and the Total updates accordingly.
3. Type an unknown code, click "Appliquer" — "Code promo invalide." appears, no summary change.
4. Click "Payer" with `SOLDES20` still applied — redirects to GeniusPay as before; confirm in the DB that the created `Order.discountCents`/`discountCodeId` match.

- [ ] **Step 9: Commit**

```bash
git add components/Checkout/CheckoutForm.tsx
git commit -m "feat: add coupon field to checkout form"
```
