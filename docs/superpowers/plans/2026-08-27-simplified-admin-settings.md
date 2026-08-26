# Simplified Admin Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the settings page’s redundant internal menu and fictitious panels with one responsive page containing only operational store, commerce, and chatbot settings.

**Architecture:** The API whitelists a compact settings contract and preserves unlisted database keys. The page uses focused cards in one responsive grid, one save action, dirty-state feedback, and explicit load/save errors.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zod, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-27-chat-dashboard-settings-product-colors-design.md`

## Global Constraints

- Read the installed Next.js page/component guidance before editing the page.
- Do not delete legacy `store_settings` rows.
- Remove WhatsApp, payment, notification, team, security, billing, redundant brand preview, and unused accent controls from the UI.
- Keep one page-level save button and localized success/error feedback.
- Use test-driven development and focused commits.

---

### Task 1: Compact settings API contract

**Files:**
- Modify: `src/app/api/admin/settings/route.ts`
- Create: `src/app/api/admin/settings/route.test.ts`

**Interfaces:**
- Produces: `StoreSettings` with `shop_name`, `email`, `phone`, `address`, `country`, `currency`, `timezone`, `min_shipping_free`, `return_period`, `chatbot_enabled`, `chatbot_name`, and `chatbot_handoff_message`.

- [ ] **Step 1: Write failing API tests**

Test authentication, defaults, accepted compact payload, rejection of unknown keys, chatbot field bounds, and preservation of an existing legacy `whatsapp_sync` row after saving.

```ts
expect(await readSetting(db, 'whatsapp_sync')).toBe(true);
expect(await readSetting(db, 'chatbot_name')).toBe('Assistant DivinExpress');
```

- [ ] **Step 2: Run the route tests and confirm RED**

Run: `npm.cmd test -- src/app/api/admin/settings/route.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because chatbot keys are absent and the schema still models WhatsApp/accent settings.

- [ ] **Step 3: Implement the compact schema and defaults**

Use strict Zod validation. Bound `chatbot_name` to 2–60 characters and `chatbot_handoff_message` to 10–240 characters. Upsert only submitted allowed keys; never delete rows omitted from the request.

- [ ] **Step 4: Run the route tests and confirm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/app/api/admin/settings/route.ts src/app/api/admin/settings/route.test.ts
git commit -m "feat: simplify admin settings contract"
```

### Task 2: Single-page responsive settings UI

**Files:**
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`
- Modify: `src/components/admin/AdminExperience.test.tsx`

**Interfaces:**
- Consumes: compact `StoreSettings` contract from Task 1.
- Produces: one form with sections `Boutique`, `Commerce`, and `Chatbot`.

- [ ] **Step 1: Write failing page tests**

Assert there is no internal navigation and none of the removed labels are rendered. Assert all retained inputs load, chatbot activation/name/handoff fields edit correctly, dirty state appears, cancel restores fetched values, one save button posts the compact payload, and load/save failures display inline localized alerts rather than `alert()`.

```ts
expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
expect(screen.getByRole('heading', { name: 'Chatbot' })).toBeVisible();
```

- [ ] **Step 2: Run the dashboard test and confirm RED**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because the current page contains the internal tab menu and fictitious panels.

- [ ] **Step 3: Replace tabs with focused cards**

Remove `Tab`, `activeTab`, the tab `<nav>`, unused icons, and inactive panel markup. Keep one semantic `<form>` and three cards in `grid-cols-1 xl:grid-cols-2`; allow the Chatbot card to span both columns. Use green for saved/secure status and the established admin blue for primary actions and focus states.

Store the last successfully loaded/saved object separately so Cancel restores real values. Disable Save while unchanged or pending. Render `role="alert"` for failures and `role="status"` for success.

- [ ] **Step 4: Run the focused page test and confirm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- 'src/app/[locale]/(dashboard)/parametres/page.tsx' src/components/admin/AdminExperience.test.tsx
git commit -m "feat: streamline admin settings page"
```

### Task 3: Cross-feature verification and production readiness

**Files:**
- Modify only when a failing assertion proves a regression in a file already touched by the three approved plans.

**Interfaces:**
- Consumes: all deliverables from the unified chat, color code, and settings plans.
- Produces: verified production candidate.

- [ ] **Step 1: Run focused suites together**

Run:

```powershell
npm.cmd test -- src/server/messaging/repository.test.ts src/app/api/chat/route.test.ts src/components/layout/ChatbotBubble.test.tsx src/components/admin/AdminExperience.test.tsx src/server/db/migration-0006.test.ts src/server/catalog/repository.test.ts src/server/catalog/storefront.test.ts src/components/product/ProductDetailView.test.tsx src/components/checkout/OrderSummary.test.tsx src/app/api/admin/settings/route.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism
```

Expected: PASS with no unhandled promise rejection.

- [ ] **Step 2: Run static verification**

Run `npm.cmd run typecheck`, then `npm.cmd run lint`, then `npm.cmd run build`.

Expected: all commands exit 0.

- [ ] **Step 3: Perform responsive manual checks**

At mobile, tablet, and desktop widths verify: chat restore/send/admin reply; dashboard ordering and AI takeover; product color creation/edit/storefront swatch; settings load/edit/cancel/save; no duplicate settings menu.

- [ ] **Step 4: Commit any evidence-driven integration correction**

Stage only the exact correction files and use:

```powershell
git commit -m "fix: complete chat settings integration"
```

If no correction is required, do not create an empty commit.

