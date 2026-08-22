# Cart Checkout and Chatbot Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a premium cart modal, illustrated checkout summary, regional delivery selectors, and an on-site customer chatbot.

**Architecture:** Keep cart and checkout data in their existing contexts, introduce focused presentational components, and replace the external WhatsApp action with a local chat panel that uses a narrow customer-chat API boundary.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Tailwind CSS 4, next-intl, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-22-storefront-dashboard-experience-design.md`

## Global Constraints

- Quantity never falls below one.
- Checkout summaries show product images, selected variants, quantities, line totals, and subtotal.
- Europe and Africa buttons use distinct SVG/icon-library illustrations.
- The floating customer control must not open WhatsApp.
- Preserve the existing cart, checkout, and server messaging domain contracts unless a tested adapter is required.

---

### Task 1: Restyle the cart as a responsive popup

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/cart/CartLineItem.tsx`
- Create: `src/components/cart/CartDrawer.test.tsx`
- Inspect: `src/context/CartContext.tsx`

**Interfaces:**
- Consumes: `useCart()` and `useCartDrawer()`
- Produces: accessible centered cart dialog with quantity controls

- [ ] **Step 1: Write failing cart behavior tests**

Render the real providers with one cart line. Open the cart, click `Augmenter la quantité`, assert quantity and line total increase; click decrement at quantity one and assert it remains one; click remove and assert the empty state; click checkout and assert navigation to `/commande/livraison`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/cart/CartDrawer.test.tsx`

Expected: FAIL against at least the centered-dialog presentation/accessibility contract.

- [ ] **Step 3: Implement the responsive modal shell**

Use a centered `role="dialog"` panel with `max-h-[90dvh]`, rounded four-corner desktop styling, near-full mobile bounds, scrollable lines, and a fixed summary/footer. Preserve Escape, backdrop close, and body-scroll restoration.

- [ ] **Step 4: Implement explicit quantity behavior**

Keep increment/decrement buttons labeled, call `updateQuantity` with the cart line identity, disable decrement at one, and display unit and line prices separately.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/components/cart/CartDrawer.test.tsx src/context/CartContext.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/components/cart/CartDrawer.tsx src/components/cart/CartLineItem.tsx src/components/cart/CartDrawer.test.tsx
git commit -m "feat: redesign cart as responsive popup"
```

### Task 2: Add a reusable illustrated order summary

**Files:**
- Create: `src/components/checkout/OrderSummary.tsx`
- Create: `src/components/checkout/OrderSummary.test.tsx`
- Modify: `src/app/[locale]/commande/livraison/page.tsx`
- Modify: `src/app/[locale]/commande/paiement/page.tsx`

**Interfaces:**
- Consumes: `CartItem[]`, locale, currency
- Produces: `OrderSummary({ items, locale, currency })`

- [ ] **Step 1: Write failing summary tests**

Render a literal cart fixture and assert the product image URL, localized name, `Taille`, `Couleur`, quantity, literal line total, and literal subtotal are visible.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/checkout/OrderSummary.test.tsx`

Expected: FAIL because the component is absent.

- [ ] **Step 3: Implement the summary**

Use `next/image`, the established product-image fallback, currency context formatting conventions, and a compact responsive list. Do not recompute checkout domain pricing differently from the cart context.

- [ ] **Step 4: Integrate both checkout steps**

Use a single-column layout on mobile and a form plus sticky summary column at large breakpoints on shipping and payment pages.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/components/checkout/OrderSummary.test.tsx src/context/CheckoutContext.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/components/checkout/OrderSummary.tsx src/components/checkout/OrderSummary.test.tsx src/app/[locale]/commande/livraison/page.tsx src/app/[locale]/commande/paiement/page.tsx
git commit -m "feat: add illustrated checkout summary"
```

### Task 3: Illustrate Europe and Africa delivery regions

**Files:**
- Modify: `src/app/[locale]/commande/livraison/page.tsx`
- Create or modify: `src/components/checkout/DeliveryRegionSelector.tsx`
- Create: `src/components/checkout/DeliveryRegionSelector.test.tsx`

**Interfaces:**
- Produces: `DeliveryRegionSelector({ value, onChange, locale })`

- [ ] **Step 1: Write the failing selector test**

Render both regions, assert each button has a distinct accessible SVG/icon, select Africa, and assert `onChange('africa')` plus pressed-state behavior.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/checkout/DeliveryRegionSelector.test.tsx`

Expected: FAIL because the focused selector does not exist.

- [ ] **Step 3: Implement the selector**

Use `Globe2`/landmark styling or dedicated inline SVG silhouettes with `aria-hidden`, visible Europe/Afrique labels, and existing shipping form values. Do not alter country validation or shipping prices.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/checkout/DeliveryRegionSelector.test.tsx src/components/checkout/AddressAutocomplete.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/checkout/DeliveryRegionSelector.tsx src/components/checkout/DeliveryRegionSelector.test.tsx src/app/[locale]/commande/livraison/page.tsx
git commit -m "feat: illustrate checkout delivery regions"
```

### Task 4: Replace WhatsApp with an on-site chatbot

**Files:**
- Create: `src/components/layout/ChatbotBubble.tsx`
- Create: `src/components/layout/ChatbotBubble.test.tsx`
- Create: `src/app/api/chat/route.ts`
- Create: `src/app/api/chat/route.test.ts`
- Modify: `src/components/layout/SiteChrome.tsx`
- Delete: `src/components/layout/WhatsAppBubble.tsx`

**Interfaces:**
- Produces: `POST /api/chat` accepting `{ message: string; locale: 'fr' | 'en' }`
- Produces: `{ reply: string }` response

- [ ] **Step 1: Write failing chatbot UI tests**

Assert the floating control has chatbot—not WhatsApp—labeling, opens an on-site dialog, submits a customer question, renders a reply, and never renders a `wa.me` destination.

- [ ] **Step 2: Verify UI RED**

Run: `npm test -- src/components/layout/ChatbotBubble.test.tsx`

Expected: FAIL because the chatbot is absent.

- [ ] **Step 3: Write failing route tests**

Assert blank messages return 400, oversized messages return 400, and a valid French question returns a non-empty reply. Mock only the external AI call while exercising real validation.

- [ ] **Step 4: Verify route RED**

Run: `npm test -- src/app/api/chat/route.test.ts`

Expected: FAIL because the route is absent.

- [ ] **Step 5: Implement the narrow chat API**

Validate locale and a trimmed 1–1000 character message with Zod. Call the existing AI agent through an adapter suitable for customer support; return a localized fallback reply on unavailable external configuration without exposing secrets or stack traces.

- [ ] **Step 6: Implement the chat panel**

Provide a welcome message, scrollable transcript, text input, sending state, retryable error, Escape close, focus-safe dialog semantics, and a bot icon with availability indicator.

- [ ] **Step 7: Replace the public bubble**

Render `ChatbotBubble` from `SiteChrome` and remove public WhatsApp imports and copy.

- [ ] **Step 8: Verify GREEN**

Run: `npm test -- src/components/layout/ChatbotBubble.test.tsx src/app/api/chat/route.test.ts src/server/ai/agent.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add -- src/components/layout/ChatbotBubble.tsx src/components/layout/ChatbotBubble.test.tsx src/components/layout/SiteChrome.tsx src/app/api/chat/route.ts src/app/api/chat/route.test.ts
git rm -- src/components/layout/WhatsAppBubble.tsx
git commit -m "feat: replace WhatsApp bubble with chatbot"
```

### Task 5: Full release verification and dashboard deferral report

**Files:**
- Modify only files required by verification findings
- Inspect: all files changed by the three implementation plans

**Interfaces:**
- Produces: verified release and final list of dashboard features safe to defer

- [ ] **Step 1: Run the full automated suite**

Run: `npm run test`

Expected: all tests pass with no unhandled errors.

- [ ] **Step 2: Run type and lint checks**

Run: `npm run typecheck`

Run: `npm run lint`

Expected: both exit code 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: successful Next.js production build.

- [ ] **Step 4: Perform visual checks**

Verify at representative mobile, tablet, and desktop widths: header lockup, category selection, testimonials, rounded carousel, cart modal, checkout summaries, delivery selectors, chatbot, dashboard navigation, and carousel manager.

- [ ] **Step 5: Report deferred dashboard elements**

Based on live behavior, list controls that remain demonstrative and can be ignored now, separating them from revenue-critical product, promotion, order, payment, and customer-support flows.

- [ ] **Step 6: Commit verification-only fixes if any**

If verification required a code change, stage each exact file named by the failing command individually, confirm `git diff --cached` contains no unrelated user work, then run:

```powershell
git commit -m "fix: complete storefront experience verification"
```

If verification required no code change, skip this commit.
