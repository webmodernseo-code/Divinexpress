# Checkout & Paiement GeniusPay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the decorative "Commander" button (clears the cart, shows a toast, writes nothing) with a real checkout: a real `Order`/`OrderItem`/`Payment` created in Postgres, stock decremented, shipping cost computed by zone, and payment processed through GeniusPay's hosted checkout page with asynchronous webhook confirmation.

**Architecture:** A client-side checkout page reads the existing `CartContext`, submits to a Server Action (`createOrder`) that validates stock, decrements it, creates the order records in a transaction, then calls GeniusPay's REST API to get a hosted `checkout_url` and redirects the browser there. GeniusPay confirms payment asynchronously via a webhook (`app/api/checkout/webhook/route.ts`, a plain Route Handler — not a Server Action, since it must accept a raw HTTP POST with GeniusPay's own signature headers) which is the only source of truth for whether a payment succeeded; the success/error redirect URLs GeniusPay sends the customer to afterward are not trusted for that purpose.

**Tech Stack:** Next.js 14 (App Router), Prisma 5 / PostgreSQL, Vitest (Node environment, no jsdom), Node's built-in `crypto` module (HMAC signature verification — no new dependency), native `fetch` (no HTTP client dependency).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-23-checkout-geniuspay-design.md`
- No new npm dependency for this whole plan — GeniusPay is a plain REST API called with `fetch`; signature verification uses Node's built-in `crypto` (`createHmac`, `timingSafeEqual`), matching the pattern already used in `lib/adminPassword.ts`.
- Vitest is configured for `**/*.test.ts` only, Node environment, no jsdom — only pure `lib/*.ts` functions get automated tests; the checkout page/form, the webhook route, and the Server Action are verified manually against a running dev server (and, for the webhook, against GeniusPay's sandbox once deployed).
- Design tokens already exist in `app/styles/tokens.css` (`--space-*`, `--radius-*`, `--shadow-card`, `--color-black`, `--color-white`, `--color-cream`, `--font-sans`, `--border-hairline`, `--color-price-sale`) — reuse via `var(--token, fallback)`, matching every existing page/component in this codebase.
- `Order`/`OrderItem`/`Payment`/`ShippingZone` already exist in `prisma/schema.prisma` (lines 63–122) exactly as needed — **no schema changes, no new migration** in this whole plan.
- `Order.currency`/`Order.totalCents` are always in **EUR** (the catalogue's canonical currency, matching `ProductVariant.priceCents` everywhere else). `Payment.currency`/`Payment.amountCents` are always in **XOF** (what GeniusPay actually settles) — the two records intentionally use different currencies for different reasons; do not "fix" this into one currency.
- The EUR→XOF conversion uses the fixed historical peg **1 EUR = 655.957 XOF** — a hardcoded constant, not a live exchange-rate lookup.
- GeniusPay secrets (`GENIUSPAY_PUBLIC_KEY`, `GENIUSPAY_SECRET_KEY`, `GENIUSPAY_WEBHOOK_SECRET`) are read only from `process.env`, only in server-only files (`'use server'` actions, Route Handlers, `lib/geniuspay.ts`) — never passed to a Client Component, never logged.
- Stock is decremented at order creation (before payment confirmation), not at webhook time — a documented, accepted limitation of this iteration (see spec §4). Do not add automatic stock-release logic; it is out of scope.

---

### Task 1: Rename `CartItem.productId` → `CartItem.variantId`

**Files:**
- Modify: `components/Cart/CartContext.tsx`
- Modify: `components/Cart/CartDrawer.tsx`
- Modify: `components/ProductDetail/ProductDetailClient.tsx`

**Context:** `ProductDetailClient.tsx` already passes `activeVariant.id` (the **variant's** id) into the field currently named `productId` on `CartItem`. This is harmless for today's cart/drawer (the field is only ever used as an opaque line-identifier), but Task 6 needs the real variant id to create `OrderItem.variantId` correctly, and building on a field whose name lies about its contents is exactly the kind of trap worth removing before it's load-bearing. This is a pure rename — no behavior changes anywhere.

**Interfaces:**
- Produces: `CartItem.variantId: string` (replaces `CartItem.productId`) — consumed by Task 7 (`CheckoutForm.tsx`, which maps cart lines to `{ variantId, quantity }` for `createOrder`).

- [ ] **Step 1: Rename in `CartContext.tsx`**

In `components/Cart/CartContext.tsx`, replace the `CartItem` interface and the three functions that reference `productId`:

```typescript
export interface CartItem {
  variantId: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  size: string;
  color: string;
  quantity: number;
}
```

Replace the `removeFromCart` and `updateQuantity` signatures in `CartContextType`:

```typescript
  removeFromCart: (variantId: string, size: string, color: string) => void;
  updateQuantity: (variantId: string, size: string, color: string, quantity: number) => void;
```

Replace the `addToCart` implementation's matching logic:

```typescript
  const addToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = newItem.quantity ?? 1;
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.variantId === newItem.variantId &&
          item.size === newItem.size &&
          item.color === newItem.color
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qtyToAdd };
        return updated;
      }
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
    setIsOpen(true);
  };
```

Replace `removeFromCart`:

```typescript
  const removeFromCart = (variantId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.variantId === variantId && item.size === size && item.color === color)
      )
    );
  };
```

Replace `updateQuantity`:

```typescript
  const updateQuantity = (variantId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };
```

Nothing else in this file changes.

- [ ] **Step 2: Rename usages in `CartDrawer.tsx`**

In `components/Cart/CartDrawer.tsx`, replace every `item.productId` with `item.variantId`:

```tsx
              <div key={`${item.variantId}-${item.size}-${item.color}`} className={styles.item}>
```

```tsx
                        onClick={() => updateQuantity(item.variantId, item.size, item.color, item.quantity - 1)}
```

```tsx
                        onClick={() => updateQuantity(item.variantId, item.size, item.color, item.quantity + 1)}
```

```tsx
                      onClick={() => removeFromCart(item.variantId, item.size, item.color)}
```

Nothing else in this file changes yet — the "Commander" button's behavior is changed in Task 7, not here.

- [ ] **Step 3: Rename in `ProductDetailClient.tsx`**

In `components/ProductDetail/ProductDetailClient.tsx`, in `handleAddToBag`, change:

```tsx
    addToCart({
      productId: activeVariant.id,
```

to:

```tsx
    addToCart({
      variantId: activeVariant.id,
```

The rest of that call (`slug`, `name`, `image`, `priceCents`, `size`, `color`, `quantity`) is unchanged.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `productId`, `CartContext`, `CartDrawer`, or `ProductDetailClient` (a leftover `item.productId` anywhere would now be a type error, since `CartItem` no longer has that field — this is what makes the rename provably complete).

- [ ] **Step 5: Manual smoke check**

Run: `npm run dev` (skip if already running), open a product page, add it to the cart, open the cart drawer, change its quantity with +/-, then remove it. Confirm all three still work exactly as before (this step changed no behavior, only a field name).

- [ ] **Step 6: Commit**

```bash
git add components/Cart/CartContext.tsx components/Cart/CartDrawer.tsx components/ProductDetail/ProductDetailClient.tsx
git commit -m "refactor: rename CartItem.productId to variantId to match its actual contents"
```

---

### Task 2: `lib/orderNumber.ts` — order number generation (TDD)

**Files:**
- Create: `lib/orderNumber.ts`
- Test: `lib/orderNumber.test.ts`

**Interfaces:**
- Produces: `generateOrderNumber(date?: Date): string` — consumed by Task 6 (`createOrder`).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/orderNumber.test.ts
import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from './orderNumber';

describe('generateOrderNumber', () => {
  it('matches the format DX-YYYYMMDD-XXXXXXXX for a given date', () => {
    const result = generateOrderNumber(new Date('2026-07-23T10:00:00Z'));
    expect(result).toMatch(/^DX-20260723-[0-9A-F]{8}$/);
  });

  it('produces different values on successive calls for the same date', () => {
    const date = new Date('2026-07-23T10:00:00Z');
    const a = generateOrderNumber(date);
    const b = generateOrderNumber(date);
    expect(a).not.toBe(b);
  });

  it('defaults to the current date when none is given', () => {
    const result = generateOrderNumber();
    const todayPart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(result.startsWith(`DX-${todayPart}-`)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/orderNumber.test.ts`
Expected: FAIL — `Cannot find module './orderNumber'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/orderNumber.ts
import { randomBytes } from 'crypto';

export function generateOrderNumber(date: Date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = randomBytes(4).toString('hex').toUpperCase();
  return `DX-${datePart}-${randomPart}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/orderNumber.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/orderNumber.ts lib/orderNumber.test.ts
git commit -m "feat: add order number generation helper"
```

---

### Task 3: `lib/shippingZone.ts` — zone resolution (TDD) + seed the two zones

**Files:**
- Create: `lib/shippingZone.ts`
- Test: `lib/shippingZone.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: `resolveShippingZone(countryCode: string, zones: { countries: string[] }[]): number` — consumed by Task 6 (`createOrder`) and Task 7 (`CheckoutForm.tsx`, to compute the displayed shipping cost as the customer picks a country).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/shippingZone.test.ts
import { describe, it, expect } from 'vitest';
import { resolveShippingZone } from './shippingZone';

const zones = [
  { countries: ['FR', 'GB'] },
  { countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'] }
];

describe('resolveShippingZone', () => {
  it('finds the Europe zone (index 0) for FR', () => {
    expect(resolveShippingZone('FR', zones)).toBe(0);
  });

  it('finds the Afrique zone (index 1) for SN', () => {
    expect(resolveShippingZone('SN', zones)).toBe(1);
  });

  it('returns -1 for a country in no zone', () => {
    expect(resolveShippingZone('US', zones)).toBe(-1);
  });

  it('returns -1 for an empty zones list', () => {
    expect(resolveShippingZone('FR', [])).toBe(-1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/shippingZone.test.ts`
Expected: FAIL — `Cannot find module './shippingZone'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/shippingZone.ts
export function resolveShippingZone(countryCode: string, zones: { countries: string[] }[]): number {
  return zones.findIndex((zone) => zone.countries.includes(countryCode));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/shippingZone.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Seed the two shipping zones**

In `prisma/seed.ts`, add this block inside `main()`, right after the admin-account block at the end (before the closing `}` of `main`):

```typescript
  const shippingZoneCount = await prisma.shippingZone.count();
  if (shippingZoneCount === 0) {
    await prisma.shippingZone.createMany({
      data: [
        { countries: ['FR', 'GB'], carrier: 'Colissimo', etaDays: 5, costCents: 590 },
        {
          countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'],
          carrier: 'DHL Express',
          etaDays: 7,
          costCents: 1200
        }
      ]
    });
    console.log('Shipping zones seeded: Europe (FR, GB), Afrique (UEMOA).');
  } else {
    console.log(`Shipping zones already present (${shippingZoneCount}) — skipping seed.`);
  }
```

This is guarded by a count check (not `upsert`, since `ShippingZone` has no natural unique key besides its generated `id`) so that re-running the seed never overwrites costs an admin has already edited via `/admin/parametres/livraison` (Task 10).

- [ ] **Step 6: Run the seed against your local database**

Run: `npm run db:seed`
Expected: output includes `Shipping zones seeded: Europe (FR, GB), Afrique (UEMOA).` on first run, or the "already present" line on any later run.

- [ ] **Step 7: Commit**

```bash
git add lib/shippingZone.ts lib/shippingZone.test.ts prisma/seed.ts
git commit -m "feat: add shipping zone resolution helper and seed Europe/Afrique zones"
```

---

### Task 4: `lib/geniuspay.ts` — GeniusPay API client

**Files:**
- Create: `lib/geniuspay.ts`
- Test: `lib/geniuspay.test.ts`

**Interfaces:**
- Produces:
  - `eurCentsToXof(amountCents: number): number` — pure, unit-tested.
  - `initiatePayment(input: InitiatePaymentInput): Promise<{ reference: string; checkoutUrl: string }>` — consumed by Task 6 (`createOrder`). Not unit-tested (network-dependent, same convention as `lib/cloudinary.ts`) — verified manually in Task 6/12 against GeniusPay's sandbox.

- [ ] **Step 1: Write the failing test for the pure conversion function**

```typescript
// lib/geniuspay.test.ts
import { describe, it, expect } from 'vitest';
import { eurCentsToXof } from './geniuspay';

describe('eurCentsToXof', () => {
  it('converts 100.00 EUR to its XOF equivalent at the fixed peg', () => {
    // 100 EUR * 655.957 = 65595.7 -> rounds to 65596
    expect(eurCentsToXof(10000)).toBe(65596);
  });

  it('converts a single cent and rounds to the nearest XOF', () => {
    // 0.01 EUR * 655.957 = 6.55957 -> rounds to 7
    expect(eurCentsToXof(1)).toBe(7);
  });

  it('converts zero to zero', () => {
    expect(eurCentsToXof(0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/geniuspay.test.ts`
Expected: FAIL — `Cannot find module './geniuspay'`

- [ ] **Step 3: Write the implementation**

```typescript
// lib/geniuspay.ts
const XOF_PER_EUR = 655.957;

export function eurCentsToXof(amountCents: number): number {
  return Math.round((amountCents / 100) * XOF_PER_EUR);
}

export type InitiatePaymentInput = {
  amountXof: number;
  description: string;
  customer: { email?: string; name?: string; phone?: string };
  successUrl: string;
  errorUrl: string;
  metadata: Record<string, string>;
};

export type InitiatePaymentResult = {
  reference: string;
  checkoutUrl: string;
};

export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  const response = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.GENIUSPAY_PUBLIC_KEY ?? '',
      'X-API-Secret': process.env.GENIUSPAY_SECRET_KEY ?? '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: input.amountXof,
      currency: 'XOF',
      description: input.description,
      customer: input.customer,
      success_url: input.successUrl,
      error_url: input.errorUrl,
      metadata: input.metadata
    })
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json?.error?.message ?? 'GeniusPay payment initiation failed');
  }

  return {
    reference: json.data.reference,
    checkoutUrl: json.data.checkout_url ?? json.data.payment_url
  };
}
```

`payment_method` is deliberately omitted from the request body — per the spec, this project only uses GeniusPay's hosted "Checkout" mode (§2 of the spec), which is what makes `checkout_url` come back in the response.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/geniuspay.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Manual verification against the GeniusPay sandbox**

This confirms the real API responds as documented before building on top of it. Create a scratch file (not committed) `scratch-test-geniuspay.mjs`:

```javascript
process.loadEnvFile('.env');
const response = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.GENIUSPAY_PUBLIC_KEY,
    'X-API-Secret': process.env.GENIUSPAY_SECRET_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 5000, description: 'Test manuel plan checkout' })
});
console.log(await response.json());
```

Run: `node scratch-test-geniuspay.mjs`
Expected: JSON response with `"success": true` and a `data.checkout_url` starting with `https://geniuspay.ci/checkout/`.

Then delete the scratch file — it's only a manual confirmation step, not part of the codebase:

```bash
rm scratch-test-geniuspay.mjs
```

- [ ] **Step 6: Commit**

```bash
git add lib/geniuspay.ts lib/geniuspay.test.ts
git commit -m "feat: add GeniusPay API client (EUR/XOF conversion + payment initiation)"
```

---

### Task 5: `lib/geniuspayWebhook.ts` — webhook signature verification (TDD)

**Files:**
- Create: `lib/geniuspayWebhook.ts`
- Test: `lib/geniuspayWebhook.test.ts`

**Interfaces:**
- Produces:
  - `verifyWebhookSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean`
  - `isValidWebhookTimestamp(timestamp: number, now?: number): boolean`
  - Both consumed by Task 9 (`app/api/checkout/webhook/route.ts`).

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/geniuspayWebhook.test.ts
import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { verifyWebhookSignature, isValidWebhookTimestamp } from './geniuspayWebhook';

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test_secret';
  const timestamp = '1735587600';
  const body = '{"event":"payment.success"}';
  const validSignature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  it('accepts a correctly computed signature', () => {
    expect(verifyWebhookSignature(body, timestamp, validSignature, secret)).toBe(true);
  });

  it('rejects a signature computed over a different (tampered) body', () => {
    const tamperedBody = '{"event":"payment.failed"}';
    expect(verifyWebhookSignature(tamperedBody, timestamp, validSignature, secret)).toBe(false);
  });

  it('rejects a signature computed with the wrong secret', () => {
    const wrongSignature = createHmac('sha256', 'wrong_secret').update(`${timestamp}.${body}`).digest('hex');
    expect(verifyWebhookSignature(body, timestamp, wrongSignature, secret)).toBe(false);
  });

  it('rejects a malformed (non-hex or wrong-length) signature without throwing', () => {
    expect(verifyWebhookSignature(body, timestamp, 'not-a-valid-signature', secret)).toBe(false);
  });
});

describe('isValidWebhookTimestamp', () => {
  it('accepts a timestamp within the 5 minute window', () => {
    expect(isValidWebhookTimestamp(1000, 1000 + 200)).toBe(true);
  });

  it('accepts a timestamp exactly at the 300 second boundary', () => {
    expect(isValidWebhookTimestamp(1000, 1000 + 300)).toBe(true);
  });

  it('rejects a timestamp older than 5 minutes', () => {
    expect(isValidWebhookTimestamp(1000, 1000 + 301)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/geniuspayWebhook.test.ts`
Expected: FAIL — `Cannot find module './geniuspayWebhook'`

- [ ] **Step 3: Write the implementation**

```typescript
// lib/geniuspayWebhook.ts
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_TIMESTAMP_SKEW_SECONDS = 300;

export function isValidWebhookTimestamp(timestamp: number, now: number = Math.floor(Date.now() / 1000)): boolean {
  return Math.abs(now - timestamp) <= MAX_TIMESTAMP_SKEW_SECONDS;
}

export function verifyWebhookSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  const expectedHex = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  let expectedBuffer: Buffer;
  let signatureBuffer: Buffer;
  try {
    expectedBuffer = Buffer.from(expectedHex, 'hex');
    signatureBuffer = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
```

`Buffer.from(str, 'hex')` never actually throws on invalid hex (it silently stops decoding at the first invalid character, producing a shorter buffer) — the surrounding `try/catch` is defensive, but the real safety net against a malformed signature string is the length check right after: a non-hex or wrong-length `signature` parameter almost never produces a buffer of the exact same length as a real SHA-256 HMAC (32 bytes), so it's rejected there.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/geniuspayWebhook.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/geniuspayWebhook.ts lib/geniuspayWebhook.test.ts
git commit -m "feat: add GeniusPay webhook signature and timestamp verification"
```

---

### Task 6: `createOrder` Server Action

**Files:**
- Create: `app/[locale]/checkout/actions.ts`

**Interfaces:**
- Consumes: `generateOrderNumber` (Task 2), `resolveShippingZone` (Task 3), `eurCentsToXof` + `initiatePayment` (Task 4).
- Produces: `createOrder(input: CheckoutInput): Promise<CheckoutResult>` — consumed by Task 7 (`CheckoutForm.tsx`).
  ```typescript
  export type CheckoutCartLine = { variantId: string; quantity: number };
  export type CheckoutInput = {
    locale: Locale; // from '@/i18n'
    email: string;
    shippingAddr: string;
    country: string;
    cart: CheckoutCartLine[];
  };
  export type CheckoutResult = { checkoutUrl: string } | { error: string };
  ```

- [ ] **Step 1: Write the Server Action**

```typescript
// app/[locale]/checkout/actions.ts
'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/orderNumber';
import { resolveShippingZone } from '@/lib/shippingZone';
import { eurCentsToXof, initiatePayment } from '@/lib/geniuspay';
import type { Locale } from '@/i18n';

export type CheckoutCartLine = { variantId: string; quantity: number };

export type CheckoutInput = {
  locale: Locale;
  email: string;
  shippingAddr: string;
  country: string;
  cart: CheckoutCartLine[];
};

export type CheckoutResult = { checkoutUrl: string } | { error: string };

function buildConfirmationUrl(locale: string, orderNumber: string): string {
  const host = headers().get('host') ?? 'divinexpress.fr';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}/${locale}/checkout/confirmation/${orderNumber}`;
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  if (!input.email || !input.shippingAddr || !input.country || input.cart.length === 0) {
    return { error: 'Merci de renseigner tous les champs et de vérifier votre panier.' };
  }

  const zones = await prisma.shippingZone.findMany();
  const zoneIndex = resolveShippingZone(input.country, zones);
  if (zoneIndex === -1) {
    return { error: "Ce pays n'est pas encore livré, désolé." };
  }
  const zone = zones[zoneIndex];

  const variantIds = input.cart.map((line) => line.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });

  for (const line of input.cart) {
    const variant = variants.find((v) => v.id === line.variantId);
    if (!variant || variant.stock < line.quantity) {
      return { error: "Un ou plusieurs articles de votre panier ne sont plus disponibles en quantité suffisante." };
    }
  }

  const subtotalCents = input.cart.reduce((sum, line) => {
    const variant = variants.find((v) => v.id === line.variantId)!;
    return sum + variant.priceCents * line.quantity;
  }, 0);
  const totalCents = subtotalCents + zone.costCents;
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    for (const line of input.cart) {
      await tx.productVariant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } }
      });
    }

    return tx.order.create({
      data: {
        orderNumber,
        customerEmail: input.email,
        shippingAddr: input.shippingAddr,
        country: input.country,
        currency: 'EUR',
        status: 'PENDING',
        totalCents,
        items: {
          create: input.cart.map((line) => {
            const variant = variants.find((v) => v.id === line.variantId)!;
            return {
              variantId: line.variantId,
              quantity: line.quantity,
              unitPriceCents: variant.priceCents
            };
          })
        },
        payment: {
          create: {
            provider: 'geniuspay',
            reference: orderNumber,
            status: 'PENDING',
            amountCents: eurCentsToXof(totalCents),
            currency: 'XOF'
          }
        }
      }
    });
  });

  const confirmationUrl = buildConfirmationUrl(input.locale, orderNumber);

  try {
    const payment = await initiatePayment({
      amountXof: eurCentsToXof(totalCents),
      description: `Commande ${orderNumber}`,
      customer: { email: input.email },
      successUrl: confirmationUrl,
      errorUrl: confirmationUrl,
      metadata: { order_id: order.id }
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { reference: payment.reference }
    });

    return { checkoutUrl: payment.checkoutUrl };
  } catch {
    await prisma.$transaction(async (tx) => {
      for (const line of input.cart) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock: { increment: line.quantity } }
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
      await tx.payment.update({ where: { orderId: order.id }, data: { status: 'FAILED' } });
    });
    return { error: "Le paiement n'a pas pu être initié, merci de réessayer." };
  }
}
```

`Payment.reference` is a required field with no default, but the real GeniusPay reference doesn't exist yet at the point the row is created — it's set to `orderNumber` as a placeholder and overwritten once `initiatePayment` returns. `buildConfirmationUrl` reads the request's `Host` header (via `next/headers`) rather than hardcoding `divinexpress.fr`, so this works unmodified against `localhost` during local development and against the real domain once deployed.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/checkout/actions.ts"
git commit -m "feat: add createOrder Server Action (stock check, order creation, GeniusPay initiation)"
```

---

### Task 7: Checkout page and form

**Files:**
- Create: `app/[locale]/checkout/page.tsx`
- Create: `components/Checkout/CheckoutForm.tsx`
- Create: `components/Checkout/CheckoutForm.module.css`
- Modify: `components/Cart/CartDrawer.tsx`

**Interfaces:**
- Consumes: `createOrder` (Task 6), `resolveShippingZone` (Task 3), `useCart()` (existing `CartContext`), `formatPrice` (existing `lib/pricing.ts`).
- Produces: the `/[locale]/checkout` route.

- [ ] **Step 1: Server page — fetch zones, render the form**

```tsx
// app/[locale]/checkout/page.tsx
import { prisma } from '@/lib/prisma';
import { CheckoutForm } from '@/components/Checkout/CheckoutForm';
import type { Locale } from '@/i18n';

export default async function CheckoutPage({ params }: { params: { locale: Locale } }) {
  const zones = await prisma.shippingZone.findMany({ select: { id: true, countries: true, costCents: true } });
  return <CheckoutForm zones={zones} locale={params.locale} />;
}
```

- [ ] **Step 2: The client form component**

```tsx
// components/Checkout/CheckoutForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart/CartContext';
import { resolveShippingZone } from '@/lib/shippingZone';
import { createOrder } from '@/app/[locale]/checkout/actions';
import type { Locale } from '@/i18n';
import styles from './CheckoutForm.module.css';

type ShippingZone = { id: string; countries: string[]; costCents: number };

const COUNTRY_NAMES: Record<string, { fr: string; en: string }> = {
  FR: { fr: 'France', en: 'France' },
  GB: { fr: 'Royaume-Uni', en: 'United Kingdom' },
  BJ: { fr: 'Bénin', en: 'Benin' },
  BF: { fr: 'Burkina Faso', en: 'Burkina Faso' },
  CI: { fr: "Côte d'Ivoire", en: 'Ivory Coast' },
  GW: { fr: 'Guinée-Bissau', en: 'Guinea-Bissau' },
  ML: { fr: 'Mali', en: 'Mali' },
  NE: { fr: 'Niger', en: 'Niger' },
  SN: { fr: 'Sénégal', en: 'Senegal' },
  TG: { fr: 'Togo', en: 'Togo' }
};

function formatEUR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function CheckoutForm({ zones, locale }: { zones: ShippingZone[]; locale: Locale }) {
  const { cart, subtotalCents, clearCart } = useCart();
  const countryCodes = zones.flatMap((zone) => zone.countries);

  const [email, setEmail] = useState('');
  const [shippingAddr, setShippingAddr] = useState('');
  const [country, setCountry] = useState(countryCodes[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zoneIndex = resolveShippingZone(country, zones);
  const shippingCostCents = zoneIndex === -1 ? 0 : zones[zoneIndex].costCents;
  const totalCents = subtotalCents + shippingCostCents;

  if (cart.length === 0) {
    return (
      <main className={styles.container}>
        <p className={styles.emptyMessage}>
          {locale === 'fr' ? 'Votre panier est vide.' : 'Your cart is empty.'}
        </p>
        <Link href="/" className={styles.backLink}>
          {locale === 'fr' ? "Retour à la boutique" : 'Back to the shop'}
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createOrder({
      locale,
      email,
      shippingAddr,
      country,
      cart: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clearCart();
    window.location.href = result.checkoutUrl;
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{locale === 'fr' ? 'Commander' : 'Checkout'}</h1>

      <div className={styles.layout}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.label}>
            {locale === 'fr' ? 'Email' : 'Email'}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </label>

          <label className={styles.label}>
            {locale === 'fr' ? 'Adresse de livraison complète' : 'Full shipping address'}
            <textarea
              value={shippingAddr}
              onChange={(e) => setShippingAddr(e.target.value)}
              required
              rows={4}
              className={styles.textarea}
            />
          </label>

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
            {submitting
              ? locale === 'fr'
                ? 'Traitement en cours…'
                : 'Processing…'
              : locale === 'fr'
                ? 'Payer'
                : 'Pay'}
          </button>
        </form>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>{locale === 'fr' ? 'Récapitulatif' : 'Summary'}</h2>
          {cart.map((item) => (
            <div key={`${item.variantId}-${item.size}-${item.color}`} className={styles.summaryLine}>
              <span>
                {item.name} ({item.size}, {item.color}) × {item.quantity}
              </span>
              <span>{formatEUR(item.priceCents * item.quantity)}</span>
            </div>
          ))}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
            <span>{formatEUR(subtotalCents)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
            <span>{formatEUR(shippingCostCents)}</span>
          </div>
          <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
            <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
            <span>{formatEUR(totalCents)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
```

`window.location.href = result.checkoutUrl` is a plain browser navigation, deliberately not the locale-aware `useRouter` from `@/i18n/navigation` — `checkoutUrl` is an external GeniusPay domain, not an internal app route.

- [ ] **Step 3: Stylesheet**

```css
/* components/Checkout/CheckoutForm.module.css */
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 48px var(--space-10) 96px;
}

.title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 40px;
  color: var(--color-black, #0c0407);
  margin: 0 0 32px;
}

.layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-10, 40px);
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.input,
.textarea {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  padding: 12px 14px;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  outline: none;
}

.textarea {
  resize: vertical;
}

.error {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-price-sale, #b3271e);
  background: rgba(179, 39, 30, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 12px;
  margin: 0;
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
  padding: 14px 32px;
  cursor: pointer;
}

.submitButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary {
  background: var(--color-cream, #f8f4f0);
  border-radius: var(--radius-lg, 16px);
  padding: var(--space-6, 24px);
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summaryTitle {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 4px;
}

.summaryLine {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-black, #0c0407);
}

.summaryDivider {
  height: 1px;
  background: rgba(12, 4, 7, 0.08);
  margin: 4px 0;
}

.summaryTotal {
  font-weight: 700;
  font-size: 15px;
}

.emptyMessage {
  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--color-black, #0c0407);
  margin-bottom: 16px;
}

.backLink {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
}
```

- [ ] **Step 4: Wire the "Commander" button to navigate to checkout**

In `components/Cart/CartDrawer.tsx`, remove the `handleCheckout` function and the `useToast` import/usage (no longer needed here — the toast-based fake confirmation is gone), and replace the checkout button with a `Link`:

```tsx
'use client';

import { useCart } from './CartContext';
import { Link } from '@/i18n/navigation';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const {
    cart,
    isOpen,
    subtotalCents,
    closeCart,
    updateQuantity,
    removeFromCart
  } = useCart();
```

(`clearCart` is dropped from this destructure too — it's no longer called here.)

Replace the footer button:

```tsx
          <Link href="/checkout" onClick={closeCart} className={styles.checkoutButton}>
            Continuer vers le paiement
          </Link>
```

`styles.checkoutButton` was a `<button>` style — check `CartDrawer.module.css` for a rule targeting `.checkoutButton` written for a `<button>` element (e.g. `border: none`, `cursor: pointer` are harmless no-ops on an `<a>`, but if the rule includes `width: 100%` or similar layout properties they carry over fine since `Link` renders an `<a>`); no CSS change is needed unless the existing rule assumes button-only behavior like `:disabled` (it doesn't — `handleCheckout` never disabled it).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev` (skip if already running).
- Add a couple of items to the cart, open the drawer, click "Continuer vers le paiement" → lands on `/fr/checkout` (or `/en/checkout`), drawer closes, cart items still present (not cleared yet).
- Confirm the récapitulatif shows the right subtotal.
- Change the country dropdown between an Europe entry and an Afrique entry → confirm the displayed "Livraison" line changes between 5,90 € and 12,00 € (the seeded costs).
- Submit with an empty email → native browser `required` validation blocks submission (no network call).
- Submit with valid data and a real GeniusPay sandbox key configured → button shows "Traitement en cours…", then the browser navigates away to a `geniuspay.ci/checkout/...` URL. Confirm in the database (`npx prisma studio` or a direct query) that an `Order` row now exists with status `PENDING`, correct `totalCents`, and its variants' `stock` decremented by the ordered quantities.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/checkout/page.tsx" components/Checkout/CheckoutForm.tsx components/Checkout/CheckoutForm.module.css components/Cart/CartDrawer.tsx
git commit -m "feat: add checkout page/form and wire the cart drawer to it"
```

---

### Task 8: Order confirmation page

**Files:**
- Create: `app/[locale]/checkout/confirmation/[orderNumber]/page.tsx`
- Create: `app/[locale]/checkout/confirmation/[orderNumber]/page.module.css`

**Interfaces:**
- Consumes: `Order` (Prisma), keyed by `orderNumber` (this is where GeniusPay's `success_url`/`error_url` — built in Task 6 — point).

- [ ] **Step 1: Write the page**

```tsx
// app/[locale]/checkout/confirmation/[orderNumber]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

const STATUS_COPY: Record<string, { fr: string; en: string }> = {
  PENDING: {
    fr: 'Paiement en cours de confirmation. Rechargez cette page dans quelques instants.',
    en: 'Payment confirmation pending. Reload this page in a moment.'
  },
  PAID: {
    fr: 'Commande confirmée — merci pour votre achat !',
    en: 'Order confirmed — thank you for your purchase!'
  },
  FULFILLED: {
    fr: 'Commande confirmée — merci pour votre achat !',
    en: 'Order confirmed — thank you for your purchase!'
  },
  CANCELLED: {
    fr: "Le paiement n'a pas abouti. Vous pouvez réessayer depuis votre panier.",
    en: 'Payment did not go through. You can try again from your cart.'
  }
};

export default async function CheckoutConfirmationPage({
  params
}: {
  params: { locale: Locale; orderNumber: string };
}) {
  const order = await prisma.order.findUnique({ where: { orderNumber: params.orderNumber } });
  if (!order) notFound();

  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.PENDING;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{params.locale === 'fr' ? 'Votre commande' : 'Your order'}</h1>
      <p className={styles.orderNumber}>{order.orderNumber}</p>
      <p className={styles.status}>{copy[params.locale]}</p>
    </main>
  );
}
```

The page always reads `order.status` fresh from the database on every load — it never trusts a query string or any other client-supplied signal to decide whether to show a success message, exactly per spec §6.

- [ ] **Step 2: Stylesheet**

```css
/* app/[locale]/checkout/confirmation/[orderNumber]/page.module.css */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 96px var(--space-10);
  text-align: center;
}

.title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 32px;
  color: var(--color-black, #0c0407);
  margin: 0 0 12px;
}

.orderNumber {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 24px;
}

.status {
  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--color-black, #0c0407);
  margin: 0;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Visit `/fr/checkout/confirmation/does-not-exist` → 404 page. After completing a real checkout in Task 7's manual test, visit the `orderNumber` printed/redirected-to and confirm the "paiement en cours" (PENDING) message shows before the webhook (Task 9) has run.

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/checkout/confirmation/[orderNumber]/page.tsx" "app/[locale]/checkout/confirmation/[orderNumber]/page.module.css"
git commit -m "feat: add order confirmation page"
```

---

### Task 9: Webhook Route Handler

**Files:**
- Create: `app/api/checkout/webhook/route.ts`

**Interfaces:**
- Consumes: `verifyWebhookSignature`, `isValidWebhookTimestamp` (Task 5).

- [ ] **Step 1: Write the route handler**

```typescript
// app/api/checkout/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, isValidWebhookTimestamp } from '@/lib/geniuspayWebhook';

const SUCCESS_EVENTS = new Set(['payment.success']);
const FAILURE_EVENTS = new Set(['payment.failed', 'payment.cancelled', 'payment.expired']);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature') ?? '';
  const timestamp = request.headers.get('x-webhook-timestamp') ?? '';
  const event = request.headers.get('x-webhook-event') ?? '';

  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET ?? '';
  if (!secret || !verifyWebhookSignature(rawBody, timestamp, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  if (!isValidWebhookTimestamp(Number(timestamp))) {
    return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
  }

  if (!SUCCESS_EVENTS.has(event) && !FAILURE_EVENTS.has(event)) {
    return NextResponse.json({ received: true });
  }

  let payload: { data?: { metadata?: { order_id?: string } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const orderId = payload.data?.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'PENDING') {
    return NextResponse.json({ received: true });
  }

  if (SUCCESS_EVENTS.has(event)) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } }),
      prisma.payment.update({ where: { orderId }, data: { status: 'SUCCEEDED' } })
    ]);
  } else {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } }),
      prisma.payment.update({ where: { orderId }, data: { status: 'FAILED' } })
    ]);
  }

  return NextResponse.json({ received: true });
}
```

The `order.status !== 'PENDING'` guard makes this idempotent: GeniusPay may redeliver the same webhook if it doesn't get a fast 200 back, and a second delivery for an already-`PAID`/`CANCELLED` order is a no-op that still returns 200 (so GeniusPay doesn't keep retrying a webhook that already succeeded from its point of view).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification — signature enforcement (no live GeniusPay needed)**

Run: `npm run dev` (skip if already running), then from another terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/checkout/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: 0000000000000000000000000000000000000000000000000000000000000000" \
  -H "X-Webhook-Timestamp: $(date +%s)" \
  -H "X-Webhook-Event: payment.success" \
  -d '{"data":{"metadata":{"order_id":"does-not-matter"}}}'
```

Expected: `401` (invalid signature rejected, since it doesn't match any real HMAC of this body).

- [ ] **Step 4: Manual verification — a correctly signed payload updates a real order**

This requires a real `PENDING` order (from Task 7's manual test) and `GENIUSPAY_WEBHOOK_SECRET` set in `.env` (from Task 11 — if Task 11 hasn't run yet, come back to this step after it has). With that order's real `id` and the real webhook secret:

```bash
node -e "
const crypto = require('crypto');
const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({ data: { metadata: { order_id: 'PASTE_REAL_ORDER_ID_HERE' } } });
const signature = crypto.createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex');
console.log(JSON.stringify({ timestamp, body, signature }));
"
```

Take the printed `timestamp`, `body`, and `signature` and send them:

```bash
curl -s -X POST http://localhost:3000/api/checkout/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: PASTE_SIGNATURE" \
  -H "X-Webhook-Timestamp: PASTE_TIMESTAMP" \
  -H "X-Webhook-Event: payment.success" \
  -d 'PASTE_BODY'
```

Expected: `{"received":true}`, and re-checking that order in the database shows `status: 'PAID'` and its `Payment.status: 'SUCCEEDED'`.

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/webhook/route.ts
git commit -m "feat: add GeniusPay webhook route handler for payment confirmation"
```

---

### Task 10: Admin shipping zone cost editor

**Files:**
- Create: `app/admin/(dashboard)/parametres/livraison/page.tsx`
- Create: `app/admin/(dashboard)/parametres/livraison/actions.ts`
- Create: `app/admin/(dashboard)/parametres/livraison/page.module.css`
- Modify: `app/admin/(dashboard)/parametres/page.tsx`
- Create: `app/admin/(dashboard)/parametres/page.module.css`

**Interfaces:**
- Produces: `/admin/produits/../parametres/livraison` — a real page carved out of the `Paramètres` stub, the same way `Catégories` was carved out of the `Produits` stub.

- [ ] **Step 1: Server Action to update a zone's cost**

```typescript
// app/admin/(dashboard)/parametres/livraison/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function updateShippingZoneCost(id: string, formData: FormData): Promise<void> {
  const costEuros = Number(formData.get('costEuros'));
  if (!Number.isFinite(costEuros) || costEuros < 0) {
    redirect('/admin/parametres/livraison?error=cout-invalide');
  }

  await prisma.shippingZone.update({
    where: { id },
    data: { costCents: Math.round(costEuros * 100) }
  });

  redirect('/admin/parametres/livraison');
}
```

- [ ] **Step 2: The page**

```tsx
// app/admin/(dashboard)/parametres/livraison/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { updateShippingZoneCost } from './actions';
import styles from './page.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  'cout-invalide': 'Merci de renseigner un coût valide (nombre positif).'
};

export default async function AdminShippingPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const zones = await prisma.shippingZone.findMany({ orderBy: { carrier: 'asc' } });
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Livraison</h1>
        <Link href="/admin/parametres" className={styles.backLink}>
          ← Retour aux paramètres
        </Link>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pays</th>
              <th>Transporteur</th>
              <th>Délai</th>
              <th>Coût</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td>{zone.countries.join(', ')}</td>
                <td>{zone.carrier}</td>
                <td>{zone.etaDays} jours</td>
                <td>
                  <form action={updateShippingZoneCost.bind(null, zone.id)} className={styles.editForm}>
                    <input
                      type="number"
                      name="costEuros"
                      step="0.01"
                      min="0"
                      defaultValue={(zone.costCents / 100).toFixed(2)}
                      className={styles.inlineInput}
                    />
                    <span className={styles.currencyLabel}>€</span>
                    <button type="submit" className={styles.saveButton}>
                      Enregistrer
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

- [ ] **Step 3: Stylesheet (mirrors `produits/categories/page.module.css`)**

```css
/* app/admin/(dashboard)/parametres/livraison/page.module.css */
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

.backLink {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  text-decoration: none;
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

.editForm {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inlineInput {
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 10px 12px;
  width: 90px;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  outline: none;
}

.currencyLabel {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #6b7280;
}

.saveButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border: none;
  border-radius: var(--radius-full, 999px);
  padding: 10px 18px;
  cursor: pointer;
  white-space: nowrap;
}
```

- [ ] **Step 4: Turn the `Paramètres` stub into a small index page linking to Livraison**

Replace `app/admin/(dashboard)/parametres/page.tsx` entirely:

```tsx
// app/admin/(dashboard)/parametres/page.tsx
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className={styles.title}>Paramètres</h1>
      <Link href="/admin/parametres/livraison" className={styles.card}>
        <h2 className={styles.cardTitle}>Livraison</h2>
        <p className={styles.cardText}>Gérer les frais de livraison par zone.</p>
      </Link>
      <p className={styles.message}>Les autres réglages arrivent bientôt.</p>
    </div>
  );
}
```

```css
/* app/admin/(dashboard)/parametres/page.module.css */
.title {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 var(--space-6, 24px);
}

.card {
  display: block;
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
  max-width: 320px;
  text-decoration: none;
  margin-bottom: var(--space-6, 24px);
}

.cardTitle {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 4px;
}

.cardText {
  font-family: var(--font-sans);
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.message {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #6b7280;
}
```

The `ComingSoon` component/import is no longer used on this page — the rest of `Paramètres` (only this one page existed under that route) is now this small index instead. No other route changes.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Log into `/admin`, click "Paramètres" in the sidebar → see the new index page with the "Livraison" card. Click it → see the 2-row table (Europe, Afrique) with their seeded costs. Change one cost, save → confirm the new value persists after a reload. Then go back to `/[locale]/checkout` on the storefront and confirm the displayed shipping cost for that zone's country reflects the new value immediately (no cache/revalidation step needed, matching the rest of this dashboard's already-established direct-Prisma-read pattern).

- [ ] **Step 7: Commit**

```bash
git add "app/admin/(dashboard)/parametres/livraison" "app/admin/(dashboard)/parametres/page.tsx" "app/admin/(dashboard)/parametres/page.module.css"
git commit -m "feat: add admin shipping zone cost editor under Paramètres"
```

---

### Task 11: Webhook registration script and environment variables

**Files:**
- Create: `scripts/register-genius-webhook.ts`
- Modify: `.env.example`
- Modify: `package.json`

**Interfaces:** none — this is an operational, one-shot script, not imported by application code.

- [ ] **Step 1: Add the GeniusPay variables to `.env.example`**

In `.env.example`, append:

```
# GeniusPay — hosted checkout + mobile money/card payments.
# Public/secret keys from your GeniusPay dashboard (Paramètres → API).
GENIUSPAY_PUBLIC_KEY=
GENIUSPAY_SECRET_KEY=
# Set after running `npm run register-genius-webhook` once (see scripts/register-genius-webhook.ts).
GENIUSPAY_WEBHOOK_SECRET=
```

- [ ] **Step 2: Write the registration script**

```typescript
// scripts/register-genius-webhook.ts
const WEBHOOK_URL = 'https://divinexpress.fr/api/checkout/webhook';

async function main() {
  const publicKey = process.env.GENIUSPAY_PUBLIC_KEY;
  const secretKey = process.env.GENIUSPAY_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new Error('GENIUSPAY_PUBLIC_KEY / GENIUSPAY_SECRET_KEY must be set in .env before running this script.');
  }

  const response = await fetch('https://geniuspay.ci/api/v1/merchant/webhooks', {
    method: 'POST',
    headers: {
      'X-API-Key': publicKey,
      'X-API-Secret': secretKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'DivinExpress checkout',
      url: WEBHOOK_URL,
      events: ['payment.success', 'payment.failed', 'payment.cancelled', 'payment.expired']
    })
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(`GeniusPay webhook registration failed: ${JSON.stringify(json)}`);
  }

  console.log('Webhook registered against', WEBHOOK_URL);
  console.log('Full response (find the webhook secret in here — the exact field name was not confirmed');
  console.log('from the docs alone; look for something starting with "whsec_"):');
  console.log(JSON.stringify(json, null, 2));
  console.log('\nCopy that secret into .env as GENIUSPAY_WEBHOOK_SECRET — it is only ever shown once.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

The exact JSON field name for the returned webhook secret wasn't shown in a literal response example on the GeniusPay docs page (only prose: "Le secret webhook (`whsec_...`) est retourné uniquement à la création"). The script prints the full response so you can find it by eye the first time; if you want to run this non-interactively in the future, come back and tighten `console.log(JSON.stringify(json.data.secret))` (or whatever the real field turns out to be) once you've seen a real response.

- [ ] **Step 3: Add an npm script for it**

In `package.json`, add to `"scripts"` (matching the existing `db:seed` convention):

```json
    "register-genius-webhook": "tsx scripts/register-genius-webhook.ts",
```

- [ ] **Step 4: Run it against the sandbox keys, once `divinexpress.fr` is deployed with Task 9's webhook route live**

Run: `npm run register-genius-webhook`
Expected: console output ending with the full JSON response; copy the `whsec_...` value into `.env` as `GENIUSPAY_WEBHOOK_SECRET`.

If this step is run before deployment (webhook route not live yet), GeniusPay's `POST /webhooks` call itself doesn't require the URL to be reachable at registration time — only actual webhook *delivery* later will fail silently until it is. It's fine to register now and deploy after.

- [ ] **Step 5: Commit**

```bash
git add scripts/register-genius-webhook.ts .env.example package.json
git commit -m "feat: add GeniusPay webhook registration script and .env.example entries"
```

---

### Task 12: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including every new suite from this plan (`orderNumber`, `shippingZone`, `geniuspay`, `geniuspayWebhook`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors (pre-existing `<img>` warnings elsewhere in the codebase are expected and not part of this plan's scope).

- [ ] **Step 4: Confirm no new dependency was added**

Run: `git diff main -- package.json` (or `git log -p package.json` if already committed across this branch)
Expected: only the new `"register-genius-webhook"` script line under `"scripts"` — no new entries under `"dependencies"`.

- [ ] **Step 5: Full manual walkthrough against the spec's acceptance criteria**

Using `docs/superpowers/specs/2026-07-23-checkout-geniuspay-design.md`'s 8 acceptance criteria as the checklist, with the dev server running:

1. Add items to the cart, click "Continuer vers le paiement" → lands on `/[locale]/checkout` with the cart's contents summarized.
2. Switch the country dropdown between an Europe and an Afrique entry → the displayed shipping line changes accordingly.
3. Submit with sufficient stock → `Order`/`OrderItem[]`/`Payment` exist in the database with status `PENDING`, stock decremented, browser redirected to a `geniuspay.ci/checkout/...` URL.
4. Submit a quantity exceeding available stock (temporarily set a variant's stock very low via `/admin/produits` to test this, then restore it) → friendly error shown, nothing written to the database (recheck stock unchanged and no new `Order` row).
5. Complete a sandbox payment on the GeniusPay checkout page → the registered webhook (Task 11) fires, and reloading `/[locale]/checkout/confirmation/{orderNumber}` shows the `PAID` message.
6. Trigger (or simulate, per Task 9 Step 4) a failed/cancelled payment → the same confirmation page shows the `CANCELLED` message.
7. Edit a shipping zone's cost in `/admin/parametres/livraison` → confirm the checkout page reflects the new cost on the very next load, no cache-clear needed.
8. Steps 1–4 of this task all still pass; grep the diff for any of `GENIUSPAY_SECRET_KEY`/`GENIUSPAY_WEBHOOK_SECRET` appearing as a literal string anywhere outside `.env`/`.env.example` (`git grep -n "GENIUSPAY_SECRET_KEY\s*="` should only match `.env.example`'s empty placeholder and `process.env.GENIUSPAY_SECRET_KEY` reads).

- [ ] **Step 6: Commit any final fixups**

If Step 5 surfaced issues, fix them and commit:

```bash
git add -A
git commit -m "fix: address manual QA findings from checkout/GeniusPay pass"
```

If no issues were found, no commit is needed for this task.
