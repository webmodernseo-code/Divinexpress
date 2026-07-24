# Checkout Redesign (Wizard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-page checkout into a 3-step wizard (Informations → Paiement → Confirmée) with a persistent product-review column, matching the client's reference mockup's layout, and add an "Acheter maintenant" quick-buy button on the product page — without touching the GeniusPay payment redirect or collecting any card data ourselves.

**Architecture:** `CheckoutForm.tsx` becomes a thin orchestrator holding all shared state (step, form fields, coupon, submission) and assembling four new presentational components: `CheckoutStepper` (step indicator, also reused on the confirmation page), `CheckoutProductReview` (persistent left column: items, coupon, totals), `CheckoutStepInformation` (email/address/country), and `CheckoutStepPayment` (info summary + Payer button). No new routes — steps are client state, not URLs.

**Tech Stack:** Next.js 14 (App Router), React 18, CSS Modules, next-intl.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-24-checkout-redesign-design.md`
- No visual redesign of the payment mechanism itself — `createOrder` is called exactly as today and still redirects to GeniusPay's hosted checkout. No card fields, no new payment provider (Stripe is a separate, later project).
- No new routes. `step: 'informations' | 'paiement'` is local state in `CheckoutForm`; the 3rd "step" (Confirmée) is the already-existing `/[locale]/checkout/confirmation/[orderNumber]` page, only visually fitted with the same stepper.
- CSS Modules are per-file in this codebase — no cross-file class imports (confirmed convention: `ProductForm.module.css`, `DiscountCodeForm.module.css`, and every admin page module each define their own `.error`/`.submitButton`-style rules independently rather than sharing one file). Each new component below gets its own dedicated `.module.css`, even where a rule is nearly identical to another component's.
- Design tokens already exist in `app/styles/tokens.css` (`--space-*`, `--radius-*`, `--color-black`, `--color-white`, `--color-cream`, `--font-sans`, `--border-hairline`, `--color-price-sale`) — reuse via `var(--token, fallback)`, matching every existing page/component.
- No coupon-preset badges (5%/10%/15%), no "Credit" line, no tax/GST line — explicitly out of scope per the spec. The recap stays Sous-total / Réduction / Livraison / Total.
- "Acheter maintenant" adds to the existing cart (same `addToCart` call as "Ajouter au panier") and navigates straight to `/checkout` — it does not create a separate "quick buy" cart concept.
- No new automated tests are expected for this plan (no new pure logic — step transitions and quick-buy navigation are trivial, verified manually against a running dev server, matching this project's established convention of no jsdom/React Testing Library).
- Next.js is pinned at 14.2.35 — route params/searchParams are synchronous objects, not Promises.

---

### Task 1: `CheckoutStepper` component

**Files:**
- Create: `components/Checkout/CheckoutStepper.tsx`
- Create: `components/Checkout/CheckoutStepper.module.css`

**Interfaces:**
- Produces: `CheckoutStep = 'informations' | 'paiement' | 'confirmee'` and `<CheckoutStepper currentStep={CheckoutStep} locale={Locale} />` — consumed by Task 5 (`CheckoutForm.tsx`) and Task 6 (confirmation page).

- [ ] **Step 1: Write the component**

```tsx
// components/Checkout/CheckoutStepper.tsx
import type { Locale } from '@/i18n';
import styles from './CheckoutStepper.module.css';

export type CheckoutStep = 'informations' | 'paiement' | 'confirmee';

const STEPS: { key: CheckoutStep; label: { fr: string; en: string } }[] = [
  { key: 'informations', label: { fr: 'Informations', en: 'Information' } },
  { key: 'paiement', label: { fr: 'Paiement', en: 'Payment' } },
  { key: 'confirmee', label: { fr: 'Confirmée', en: 'Completed' } }
];

export function CheckoutStepper({ currentStep, locale }: { currentStep: CheckoutStep; locale: Locale }) {
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <ol className={styles.stepper}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <li key={step.key} className={styles.step}>
            <span
              className={
                isCompleted || isActive ? styles.circleActive : styles.circleUpcoming
              }
            >
              {isCompleted ? '✓' : index + 1}
            </span>
            <span className={isActive ? styles.labelActive : styles.label}>{step.label[locale]}</span>
            {index < STEPS.length - 1 && (
              <span className={isCompleted ? styles.connectorCompleted : styles.connector} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Write the CSS module**

```css
/* components/Checkout/CheckoutStepper.module.css */
.stepper {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0 0 var(--space-10, 40px);
  padding: 0;
  flex-wrap: wrap;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
}

.circleActive,
.circleUpcoming {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle, 50%);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.circleActive {
  background: var(--color-black, #0c0407);
  color: var(--color-white, #ffffff);
}

.circleUpcoming {
  background: var(--color-cream, #f6f1e9);
  color: var(--color-black, #0c0407);
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.label,
.labelActive {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #9ca3af;
}

.labelActive {
  color: var(--color-black, #0c0407);
  font-weight: 700;
}

.connector,
.connectorCompleted {
  width: 48px;
  height: 1px;
  margin: 0 4px;
}

.connector {
  background: rgba(12, 4, 7, 0.08);
}

.connectorCompleted {
  background: var(--color-black, #0c0407);
}

@media (max-width: 800px) {
  .connector,
  .connectorCompleted {
    width: 24px;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors (component isn't used anywhere yet, this just confirms it compiles standalone).

- [ ] **Step 4: Commit**

```bash
git add components/Checkout/CheckoutStepper.tsx components/Checkout/CheckoutStepper.module.css
git commit -m "feat: add CheckoutStepper component"
```

---

### Task 2: `CheckoutProductReview` component

**Files:**
- Create: `components/Checkout/CheckoutProductReview.tsx`
- Create: `components/Checkout/CheckoutProductReview.module.css`

**Interfaces:**
- Consumes: `CartItem` type (`components/Cart/CartContext.tsx`), `formatPrice` (`lib/pricing.ts`).
- Produces: `<CheckoutProductReview ... />` (full props list in the code below) — consumed by Task 5 (`CheckoutForm.tsx`).

**Context:** This extracts and combines two pieces that exist today in `CheckoutForm.tsx`: the summary aside (items/totals) and the coupon UI (input, Appliquer button, error/success messages) already built and working. The item rendering also borrows the thumbnail-based layout already used in `components/Cart/CartDrawer.tsx` (image + name + size/color/qty), instead of the current checkout's plain text line — this is the only visual change to existing, working logic; the coupon and totals logic itself is copied verbatim, not altered.

- [ ] **Step 1: Write the component**

```tsx
// components/Checkout/CheckoutProductReview.tsx
import type { Locale } from '@/i18n';
import type { CartItem } from '@/components/Cart/CartContext';
import { formatPrice } from '@/lib/pricing';
import styles from './CheckoutProductReview.module.css';

export function CheckoutProductReview({
  cart,
  subtotalCents,
  shippingCostCents,
  discountCents,
  totalCents,
  locale,
  couponInput,
  onCouponInputChange,
  couponPending,
  couponError,
  appliedDiscount,
  onApplyCoupon
}: {
  cart: CartItem[];
  subtotalCents: number;
  shippingCostCents: number;
  discountCents: number;
  totalCents: number;
  locale: Locale;
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  couponPending: boolean;
  couponError: string | null;
  appliedDiscount: { code: string; discountCents: number } | null;
  onApplyCoupon: () => void;
}) {
  return (
    <aside className={styles.summary}>
      <h2 className={styles.summaryTitle}>{locale === 'fr' ? 'Récapitulatif' : 'Summary'}</h2>

      {cart.map((item) => (
        <div key={`${item.variantId}-${item.size}-${item.color}`} className={styles.item}>
          <img src={item.image} alt={item.name} className={styles.itemImage} />
          <div className={styles.itemDetails}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemOptions}>
              {item.size}, {item.color} × {item.quantity}
            </span>
          </div>
          <span className={styles.itemPrice}>{formatPrice(item.priceCents * item.quantity, locale)}</span>
        </div>
      ))}

      <div className={styles.summaryDivider} />

      <label className={styles.couponLabel}>
        {locale === 'fr' ? 'Code promo' : 'Discount code'}
        <div className={styles.couponRow}>
          <input
            type="text"
            value={couponInput}
            onChange={(e) => onCouponInputChange(e.target.value)}
            className={styles.couponInput}
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            disabled={couponPending || !couponInput.trim()}
            className={styles.applyButton}
          >
            {locale === 'fr' ? 'Appliquer' : 'Apply'}
          </button>
        </div>
      </label>
      {couponError && <p className={styles.error}>{couponError}</p>}
      {appliedDiscount && (
        <p className={styles.success}>
          {locale === 'fr' ? 'Code appliqué : ' : 'Code applied: '}
          {appliedDiscount.code}
        </p>
      )}

      <div className={styles.summaryDivider} />

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
      <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
        <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
        <span>{formatPrice(totalCents, locale)}</span>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Write the CSS module**

```css
/* components/Checkout/CheckoutProductReview.module.css */
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

.item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.itemImage {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: var(--radius-sm, 8px);
  flex-shrink: 0;
}

.itemDetails {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.itemName {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
}

.itemOptions {
  font-family: var(--font-sans);
  font-size: 12px;
  color: #6b7280;
}

.itemPrice {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  white-space: nowrap;
}

.summaryDivider {
  height: 1px;
  background: rgba(12, 4, 7, 0.08);
  margin: 4px 0;
}

.couponLabel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
}

.couponRow {
  display: flex;
  gap: 8px;
}

.couponInput {
  flex: 1;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  padding: 10px 12px;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  outline: none;
}

.applyButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border: none;
  border-radius: var(--radius-full, 999px);
  padding: 10px 20px;
  cursor: pointer;
  white-space: nowrap;
}

.applyButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.success {
  font-family: var(--font-sans);
  font-size: 13px;
  color: #0d6630;
  background: rgba(13, 102, 48, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 12px;
  margin: 0;
}

.summaryLine {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-black, #0c0407);
}

.summaryTotal {
  font-weight: 700;
  font-size: 15px;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Checkout/CheckoutProductReview.tsx components/Checkout/CheckoutProductReview.module.css
git commit -m "feat: add CheckoutProductReview component"
```

---

### Task 3: `CheckoutStepInformation` component

**Files:**
- Create: `components/Checkout/CheckoutStepInformation.tsx`
- Create: `components/Checkout/CheckoutStepInformation.module.css`

**Interfaces:**
- Produces: `<CheckoutStepInformation ... />` — consumed by Task 5.

**Context:** This is the email/address/country form fields, extracted verbatim from the current `CheckoutForm.tsx` (no field logic changes), wrapped in its own `<form>` so the browser's native `required` validation still gates the "Suivant" button — same mechanism the current single form already relies on, not a new validation system.

- [ ] **Step 1: Write the component**

```tsx
// components/Checkout/CheckoutStepInformation.tsx
import type { Locale } from '@/i18n';
import styles from './CheckoutStepInformation.module.css';

export function CheckoutStepInformation({
  email,
  onEmailChange,
  shippingAddr,
  onShippingAddrChange,
  country,
  onCountryChange,
  countryCodes,
  countryNames,
  locale,
  onNext
}: {
  email: string;
  onEmailChange: (value: string) => void;
  shippingAddr: string;
  onShippingAddrChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  countryCodes: string[];
  countryNames: Record<string, { fr: string; en: string }>;
  locale: Locale;
  onNext: () => void;
}) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label className={styles.label}>
        {locale === 'fr' ? 'Email' : 'Email'}
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          className={styles.input}
        />
      </label>

      <label className={styles.label}>
        {locale === 'fr' ? 'Adresse de livraison complète' : 'Full shipping address'}
        <textarea
          value={shippingAddr}
          onChange={(e) => onShippingAddrChange(e.target.value)}
          required
          rows={4}
          className={styles.textarea}
        />
      </label>

      <label className={styles.label}>
        {locale === 'fr' ? 'Pays' : 'Country'}
        <select value={country} onChange={(e) => onCountryChange(e.target.value)} className={styles.input}>
          {countryCodes.map((code) => (
            <option key={code} value={code}>
              {countryNames[code]?.[locale] ?? code}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className={styles.submitButton}>
        {locale === 'fr' ? 'Suivant' : 'Next'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write the CSS module**

```css
/* components/Checkout/CheckoutStepInformation.module.css */
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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Checkout/CheckoutStepInformation.tsx components/Checkout/CheckoutStepInformation.module.css
git commit -m "feat: add CheckoutStepInformation component"
```

---

### Task 4: `CheckoutStepPayment` component

**Files:**
- Create: `components/Checkout/CheckoutStepPayment.tsx`
- Create: `components/Checkout/CheckoutStepPayment.module.css`

**Interfaces:**
- Produces: `<CheckoutStepPayment ... />` — consumed by Task 5.

**Context:** This is new UI (the current checkout has no "review your info before paying" screen — everything was on one page), but the actual submission behavior it triggers (`onSubmit`, wired to `createOrder` in Task 5) is unchanged from today.

- [ ] **Step 1: Write the component**

```tsx
// components/Checkout/CheckoutStepPayment.tsx
import type { Locale } from '@/i18n';
import styles from './CheckoutStepPayment.module.css';

export function CheckoutStepPayment({
  email,
  shippingAddr,
  country,
  countryNames,
  locale,
  onEditInformation,
  submitting,
  error,
  onSubmit
}: {
  email: string;
  shippingAddr: string;
  country: string;
  countryNames: Record<string, { fr: string; en: string }>;
  locale: Locale;
  onEditInformation: () => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.infoSummary}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>{locale === 'fr' ? 'Contact' : 'Contact'}</span>
          <span className={styles.infoValue}>{email}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
          <span className={styles.infoValue}>
            {shippingAddr} — {countryNames[country]?.[locale] ?? country}
          </span>
        </div>
        <button type="button" onClick={onEditInformation} className={styles.editLink}>
          {locale === 'fr' ? 'Modifier' : 'Edit'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="button" onClick={onSubmit} disabled={submitting} className={styles.payButton}>
        {submitting
          ? locale === 'fr'
            ? 'Traitement en cours…'
            : 'Processing…'
          : locale === 'fr'
            ? 'Payer'
            : 'Pay'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write the CSS module**

```css
/* components/Checkout/CheckoutStepPayment.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.infoSummary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-4, 16px);
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
}

.infoRow {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: var(--font-sans);
}

.infoLabel {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.infoValue {
  font-size: 14px;
  color: var(--color-black, #0c0407);
}

.editLink {
  align-self: flex-start;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  background: transparent;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
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

.payButton {
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

.payButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Checkout/CheckoutStepPayment.tsx components/Checkout/CheckoutStepPayment.module.css
git commit -m "feat: add CheckoutStepPayment component"
```

---

### Task 5: Rewire `CheckoutForm.tsx` as the wizard orchestrator

**Files:**
- Modify: `components/Checkout/CheckoutForm.tsx`
- Modify: `components/Checkout/CheckoutForm.module.css`

**Interfaces:**
- Consumes: `CheckoutStepper` (Task 1), `CheckoutProductReview` (Task 2), `CheckoutStepInformation` (Task 3), `CheckoutStepPayment` (Task 4), `createOrder`/`validateDiscountCode` (unchanged, `app/[locale]/checkout/actions.ts`).

**Context:** This is the highest-risk task — it's where the previously-working single-page form gets torn apart and reassembled. `createOrder`'s call site, its exact arguments (including `discountCode: appliedDiscount?.code`), and the coupon-application logic (`handleApplyCoupon`, including its `try/catch/finally`) must be preserved byte-for-byte from the current file — only their *presentation* moves into child components. Do not alter `createOrder`, `validateDiscountCode`, or anything in `app/[locale]/checkout/actions.ts` in this task.

- [ ] **Step 1: Replace `CheckoutForm.tsx`**

```tsx
// components/Checkout/CheckoutForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart/CartContext';
import { resolveShippingZone } from '@/lib/shippingZone';
import { createOrder, validateDiscountCode } from '@/app/[locale]/checkout/actions';
import type { Locale } from '@/i18n';
import { CheckoutStepper } from './CheckoutStepper';
import { CheckoutProductReview } from './CheckoutProductReview';
import { CheckoutStepInformation } from './CheckoutStepInformation';
import { CheckoutStepPayment } from './CheckoutStepPayment';
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

export function CheckoutForm({ zones, locale }: { zones: ShippingZone[]; locale: Locale }) {
  const { cart, subtotalCents, clearCart } = useCart();
  const countryCodes = zones.flatMap((zone) => zone.countries);

  const [step, setStep] = useState<'informations' | 'paiement'>('informations');
  const [email, setEmail] = useState('');
  const [shippingAddr, setShippingAddr] = useState('');
  const [country, setCountry] = useState(countryCodes[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponPending, setCouponPending] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);

  const zoneIndex = resolveShippingZone(country, zones);
  const shippingCostCents = zoneIndex === -1 ? 0 : zones[zoneIndex].costCents;
  const discountCents = appliedDiscount?.discountCents ?? 0;
  const totalCents = subtotalCents - discountCents + shippingCostCents;

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

  async function handlePay() {
    setSubmitting(true);
    setError(null);

    const result = await createOrder({
      locale,
      email,
      shippingAddr,
      country,
      cart: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      discountCode: appliedDiscount?.code
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clearCart();
    window.location.href = result.checkoutUrl;
  }

  async function handleApplyCoupon() {
    setCouponPending(true);
    setCouponError(null);

    try {
      const result = await validateDiscountCode(couponInput, subtotalCents);

      if ('error' in result) {
        setCouponError(result.error);
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({ code: result.code, discountCents: result.discountCents });
      }
    } catch {
      setCouponError(locale === 'fr' ? 'Une erreur est survenue, réessayez.' : 'Something went wrong, try again.');
      setAppliedDiscount(null);
    } finally {
      setCouponPending(false);
    }
  }

  return (
    <main className={styles.container}>
      <CheckoutStepper currentStep={step} locale={locale} />
      <h1 className={styles.title}>{locale === 'fr' ? 'Commander' : 'Checkout'}</h1>

      <div className={styles.layout}>
        <CheckoutProductReview
          cart={cart}
          subtotalCents={subtotalCents}
          shippingCostCents={shippingCostCents}
          discountCents={discountCents}
          totalCents={totalCents}
          locale={locale}
          couponInput={couponInput}
          onCouponInputChange={setCouponInput}
          couponPending={couponPending}
          couponError={couponError}
          appliedDiscount={appliedDiscount}
          onApplyCoupon={handleApplyCoupon}
        />

        {step === 'informations' ? (
          <CheckoutStepInformation
            email={email}
            onEmailChange={setEmail}
            shippingAddr={shippingAddr}
            onShippingAddrChange={setShippingAddr}
            country={country}
            onCountryChange={setCountry}
            countryCodes={countryCodes}
            countryNames={COUNTRY_NAMES}
            locale={locale}
            onNext={() => setStep('paiement')}
          />
        ) : (
          <CheckoutStepPayment
            email={email}
            shippingAddr={shippingAddr}
            country={country}
            countryNames={COUNTRY_NAMES}
            locale={locale}
            onEditInformation={() => setStep('informations')}
            submitting={submitting}
            error={error}
            onSubmit={handlePay}
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Replace `CheckoutForm.module.css`**

The classes now used only by the extracted child components (`.form`, `.label`, `.input`, `.textarea`, `.error`, `.submitButton`, `.summary`, `.summaryTitle`, `.summaryLine`, `.summaryDivider`, `.summaryTotal`) move out — `CheckoutForm.module.css` keeps only what the orchestrator itself renders:

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
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-10, 40px);
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }
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

Note the column order flip: `CheckoutProductReview` (item recap) is now the **left** column (`1fr`), the active step's content is the **right** column (`1.2fr`) — matching the reference mockup, reversed from the current form-left/summary-right layout.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 4: Manual verification against the dev server**

Run `npm run dev`, add an item to cart, go to `/fr/checkout`:
1. Stepper shows "Informations" active, "Paiement"/"Confirmée" upcoming.
2. Right column shows email/adresse/pays fields; left column shows the item(s) + coupon field + totals.
3. Leaving a required field empty and clicking "Suivant" shows the browser's native validation message, does not advance.
4. Filling all fields and clicking "Suivant" advances to "Paiement" (stepper updates, right column now shows the info summary + "Modifier" + "Payer").
5. Clicking "Modifier" returns to "Informations" with the previously entered values still filled in.
6. Applying a valid discount code (e.g. one created via `/admin/reductions`) updates the "Réduction" line and Total in the left column, from either step.
7. Clicking "Payer" creates the order and redirects to GeniusPay's hosted page, exactly as before this task.

- [ ] **Step 5: Commit**

```bash
git add components/Checkout/CheckoutForm.tsx components/Checkout/CheckoutForm.module.css
git commit -m "feat: rewire CheckoutForm as a 2-step wizard orchestrator"
```

---

### Task 6: Wire `CheckoutStepper` into the confirmation page

**Files:**
- Modify: `app/[locale]/checkout/confirmation/[orderNumber]/page.tsx`

**Interfaces:**
- Consumes: `CheckoutStepper` (Task 1).

- [ ] **Step 1: Add the stepper**

Find:

```tsx
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{params.locale === 'fr' ? 'Votre commande' : 'Your order'}</h1>
```

Replace with:

```tsx
  return (
    <main className={styles.container}>
      <CheckoutStepper currentStep="confirmee" locale={params.locale} />
      <h1 className={styles.title}>{params.locale === 'fr' ? 'Votre commande' : 'Your order'}</h1>
```

Add the import at the top of the file, alongside the existing imports:

```tsx
import { CheckoutStepper } from '@/components/Checkout/CheckoutStepper';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 3: Manual verification**

Visit `/fr/checkout/confirmation/<any-existing-orderNumber>` (or one created during Task 5's verification) and confirm the stepper renders above the order status, with "Confirmée" shown as the active/final step.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/checkout/confirmation/[orderNumber]/page.tsx"
git commit -m "feat: show CheckoutStepper on the order confirmation page"
```

---

### Task 7: "Acheter maintenant" button on the product page

**Files:**
- Modify: `components/ProductDetail/ProductDetailClient.tsx`
- Modify: `components/ProductDetail/ProductDetailClient.module.css`

**Interfaces:**
- Consumes: `useRouter` (`@/i18n/navigation`), `addToCart` (`useCart()`, unchanged).

**Context:** `ProductDetailClient.tsx` already has `handleAddToBag` (calls `addToCart` with the active variant, shows a toast) rendered inside `.ctaPulseWrap` next to the quantity stepper in `.actionsRow`. This task adds a second, secondary-styled button below that row — same `addToCart` call, but navigating straight to checkout instead of opening the cart drawer.

- [ ] **Step 1: Add the router and the handler**

Find the existing import block (near the top of the file):

```tsx
import { useState } from 'react';
import { useCart } from '../Cart/CartContext';
import { useToast } from '../Toast/ToastContext';
```

Add `useRouter`:

```tsx
import { useState } from 'react';
import { useCart } from '../Cart/CartContext';
import { useToast } from '../Toast/ToastContext';
import { useRouter } from '@/i18n/navigation';
```

Find:

```tsx
  const { addToCart } = useCart();
  const { showToast } = useToast();
```

Replace with:

```tsx
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
```

Find the existing `handleAddToBag` function and add `handleBuyNow` right after it:

```tsx
  const handleBuyNow = () => {
    if (!activeVariant) return;

    addToCart({
      variantId: activeVariant.id,
      slug: product.slug,
      name: locale === 'fr' ? product.nameFr : product.nameEn,
      image: baseImages[0]?.url || '/placeholder-product.svg',
      priceCents: activeVariant.priceCents,
      size: activeVariant.size,
      color: activeVariant.color,
      quantity
    });

    router.push('/checkout');
  };
```

- [ ] **Step 2: Add the button to the JSX**

Find:

```tsx
              <div className={styles.ctaPulseWrap}>
                {inStock ? (
                  <button
                    type="button"
                    onClick={handleAddToBag}
                    className={styles.addToBagBtn}
                  >
                    {locale === 'fr' ? 'Ajouter au panier' : 'Add to Bag'}
                  </button>
                ) : (
                  <button type="button" className={styles.outOfStockBtn} disabled>
                    {locale === 'fr' ? 'Rupture de stock' : 'Out of Stock'}
                  </button>
                )}
              </div>
            </div>
          </div>
```

Replace with:

```tsx
              <div className={styles.ctaPulseWrap}>
                {inStock ? (
                  <button
                    type="button"
                    onClick={handleAddToBag}
                    className={styles.addToBagBtn}
                  >
                    {locale === 'fr' ? 'Ajouter au panier' : 'Add to Bag'}
                  </button>
                ) : (
                  <button type="button" className={styles.outOfStockBtn} disabled>
                    {locale === 'fr' ? 'Rupture de stock' : 'Out of Stock'}
                  </button>
                )}
              </div>
            </div>

            {inStock && (
              <button type="button" onClick={handleBuyNow} className={styles.buyNowBtn}>
                {locale === 'fr' ? 'Acheter maintenant' : 'Buy now'}
              </button>
            )}
          </div>
```

(This closes the `.actionsRow` div one level up as before, then adds the new button as a sibling below it, still inside `.selectors`.)

- [ ] **Step 3: Add the CSS**

Add to the end of `components/ProductDetail/ProductDetailClient.module.css`:

```css
.buyNowBtn {
  background: transparent;
  color: var(--color-black);
  border: 1px solid var(--color-black);
  border-radius: 10px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  text-align: center;
  height: 44px;
  margin-top: 12px;
  transition: background-color var(--duration-fast), color var(--duration-fast);
  font-family: var(--font-sans);
}

.buyNowBtn:hover {
  background: var(--color-black);
  color: var(--color-white);
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes with no errors.

- [ ] **Step 5: Manual verification against the dev server**

On any product page, click "Acheter maintenant": confirm the item is added to the cart (check via reopening the drawer afterward, or via the checkout page itself) and the browser navigates straight to `/[locale]/checkout` showing that item in `CheckoutProductReview`, without the cart drawer ever opening/staying open. Then add a second, different product via "Ajouter au panier" on another product page, and click "Acheter maintenant" on a third product — confirm all three end up listed together on `/checkout` (single shared cart, not a separate quick-buy cart).

- [ ] **Step 6: Commit**

```bash
git add components/ProductDetail/ProductDetailClient.tsx components/ProductDetail/ProductDetailClient.module.css
git commit -m "feat: add Acheter maintenant quick-buy button to product page"
```

---

### Task 8: Full end-to-end verification pass

**Files:** none (verification only).

- [ ] **Step 1: Automated checks**

Run, in order:
```bash
npx tsc --noEmit
npm run lint
npx vitest run --exclude '.claude/**'
```
Expected: all clean, same pass counts as before this plan (no new automated tests were added, per Global Constraints — this just confirms nothing regressed).

- [ ] **Step 2: Full real-browser walkthrough**

Against a running dev server (or `next build && next start` if this machine's free RAM makes `next dev` unreliable — see this project's own notes on low-RAM compile crashes):

1. From a product page, click "Acheter maintenant" → lands on `/checkout`, stepper on "Informations", item present in the left column.
2. Fill email/address/country, click "Suivant" → stepper advances to "Paiement", right column shows the info summary.
3. Apply a real discount code (create one via `/admin/reductions` if none exists) → "Réduction" line appears, Total updates.
4. Click "Payer" → real redirect to GeniusPay's hosted sandbox checkout (confirm the URL, same as the existing, already-verified GeniusPay integration — do not complete a real payment).
5. Separately, load `/checkout/confirmation/<orderNumber>` for an existing order → stepper shows "Confirmée" as the final/active step, order status renders as before.
6. Check the browser console throughout — zero errors.

- [ ] **Step 3: Report**

No commit for this task (verification only) — if all checks pass, the branch is ready for the final whole-branch review.
