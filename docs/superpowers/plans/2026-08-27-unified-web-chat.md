# Unified Web Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the public chatbot conversation in the existing messaging database and expose the same ordered thread to customers and dashboard administrators.

**Architecture:** A random browser visitor ID keys one `web` conversation in the existing repository. Public chat routes validate and filter access, while the authenticated admin route remains the dashboard interface; the widget polls only its own public-safe thread.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod, Vitest, PostgreSQL/SQLite database abstraction.

**Spec:** `docs/superpowers/specs/2026-08-27-chat-dashboard-settings-product-colors-design.md`

## Global Constraints

- Read the relevant route and component guides in `node_modules/next/dist/docs/` before changing Next.js code.
- Preserve WhatsApp and e-mail conversation behavior.
- Never expose customer records, orders, internal notes, admin IDs, or WhatsApp IDs through the public chat API.
- Persist every accepted customer message before attempting AI generation.
- Use test-driven development and commit only the files named by each task.

---

### Task 1: Web conversation repository contract

**Files:**
- Modify: `src/server/messaging/repository.ts`
- Modify: `src/server/messaging/repository.test.ts`

**Interfaces:**
- Produces: `getPublicWebThread(db, visitorId): Promise<PublicChatMessage[]>`
- Produces: `linkWebConversationEmail(db, conversationId, email): Promise<void>`
- Produces: `PublicChatMessage = { id: string; author: 'customer' | 'ai' | 'admin'; body: string; createdAt: string }`

- [ ] **Step 1: Write failing repository tests**

Add tests that create a `web` conversation, insert customer/AI/admin messages, and assert the public thread returns only the four public fields in chronological order. Add a customer with a normalized e-mail and assert `linkWebConversationEmail` sets `customer_id`; assert an unknown e-mail leaves it null.

```ts
expect(await getPublicWebThread(db, 'visitor-123')).toEqual([
  { id: expect.any(String), author: 'customer', body: 'Bonjour', createdAt: expect.any(String) },
  { id: expect.any(String), author: 'ai', body: 'Bonjour !', createdAt: expect.any(String) },
]);
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npm.cmd test -- src/server/messaging/repository.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because the two repository functions and public type do not exist.

- [ ] **Step 3: Implement the repository functions**

Select only messages belonging to `channel = 'web'` and the exact opaque `external_id`. Map snake_case database fields to `createdAt`. Normalize e-mail with `trim().toLowerCase()` and reuse a non-deleted customer only.

```ts
export interface PublicChatMessage {
  id: string;
  author: 'customer' | 'ai' | 'admin';
  body: string;
  createdAt: string;
}
```

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/server/messaging/repository.ts src/server/messaging/repository.test.ts
git commit -m "feat: add public web conversation repository"
```

### Task 2: Persistent public chat API

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/chat/route.test.ts`

**Interfaces:**
- Consumes: repository interfaces from Task 1.
- Produces: `POST /api/chat` body `{ visitorId, message, locale, email? }` and response `{ conversationId, messages, aiEnabled }`.
- Produces: `GET /api/chat?visitorId=<uuid>` response `{ messages, aiEnabled }`.

- [ ] **Step 1: Read the installed Next.js route-handler guide**

Run: `rg -n "Route Handlers|Request" node_modules/next/dist/docs --glob '*.md' --glob '*.mdx'`

Open the matching guide completely before editing the route.

- [ ] **Step 2: Replace the old route tests with persistent-flow tests**

Mock `getCommerceDatabase` and AI generation using the project’s existing Vitest patterns. Test invalid UUID/message/locale/e-mail, first-message conversation creation, second-message reuse, ordered persistence, GET restoration, AI-disabled behavior, and a response shape with no `customer_id`, `admin_id`, `wa_message_id`, orders, or notes.

```ts
const body = { visitorId: crypto.randomUUID(), message: 'Bonjour', locale: 'fr' };
const response = await POST(request(body));
expect(await response.json()).toMatchObject({
  aiEnabled: true,
  messages: [
    { author: 'customer', body: 'Bonjour' },
    { author: 'ai', body: expect.any(String) },
  ],
});
```

- [ ] **Step 3: Run the route tests and confirm RED**

Run: `npm.cmd test -- src/app/api/chat/route.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because the current endpoint neither accepts `visitorId` nor persists a thread.

- [ ] **Step 4: Implement GET and POST orchestration**

Validate `visitorId` with `z.string().uuid()`, e-mail with `z.string().trim().email().max(254).optional()`, and preserve the 1–1000 character message bound. Upsert a `web` conversation, optionally link e-mail, save the inbound message, generate and save an AI response only when `ai_enabled === 1`, then return `getPublicWebThread`.

When AI generation fails, retain the inbound message and return the human-takeover copy as an AI/system-safe response. Apply a bounded in-memory limiter keyed by visitor ID plus forwarded address when present.

- [ ] **Step 5: Run repository and route tests**

Run: `npm.cmd test -- src/server/messaging/repository.test.ts src/app/api/chat/route.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/app/api/chat/route.ts src/app/api/chat/route.test.ts
git commit -m "feat: persist website chat conversations"
```

### Task 3: Customer widget synchronization

**Files:**
- Modify: `src/components/layout/ChatbotBubble.tsx`
- Modify: `src/components/layout/ChatbotBubble.test.tsx`

**Interfaces:**
- Consumes: GET and POST response contracts from Task 2.
- Produces: local-storage key `divinexpress_chat_visitor_id` and a synchronized customer-facing thread.

- [ ] **Step 1: Write failing widget tests**

Test creation/reuse of a UUID, restoration on open, POST payload, rendering of `customer`, `ai`, and `admin` bubbles, optional e-mail submission, polling while open, retry after network failure, and cleanup of the polling timer on close/unmount.

```ts
expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
  method: 'POST',
  body: expect.stringContaining('divinexpress'),
}));
expect(screen.getByText('Conseiller DivinExpress')).toBeVisible();
```

- [ ] **Step 2: Run the widget tests and confirm RED**

Run: `npm.cmd test -- src/components/layout/ChatbotBubble.test.tsx --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL on persistence and synchronization assertions.

- [ ] **Step 3: Implement the synchronized widget**

Keep the component’s visual language. Generate the UUID client-side, fetch on open, poll every 5 seconds only while open, reconcile by message ID, label admin messages as `Conseiller DivinExpress`, and show a non-blocking e-mail field after the first sent message. Do not store the thread itself as the source of truth.

- [ ] **Step 4: Run widget and chat tests**

Run: `npm.cmd test -- src/components/layout/ChatbotBubble.test.tsx src/app/api/chat/route.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: PASS with fake timers fully drained.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/layout/ChatbotBubble.tsx src/components/layout/ChatbotBubble.test.tsx
git commit -m "feat: synchronize chatbot with admin messages"
```

### Task 4: Dashboard web-channel experience

**Files:**
- Modify: `src/app/[locale]/(dashboard)/messages/page.tsx`
- Modify: `src/components/admin/AdminExperience.test.tsx`
- Modify only if response mapping requires it: `src/app/api/admin/messages/route.ts`

**Interfaces:**
- Consumes: existing admin message API and persisted `channel: 'web'` conversations.
- Produces: « Chat du site »/“Website chat” badge and visible AI-versus-advisor authorship.

- [ ] **Step 1: Write failing dashboard tests**

Render a web conversation with customer, AI, and admin messages. Assert the channel label is localized, messages remain ordered, unread state clears on selection, an admin reply invokes the existing endpoint, and the AI toggle remains operable.

- [ ] **Step 2: Run the focused dashboard test and confirm RED**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: FAIL because web conversations are not presented with the required label/authorship.

- [ ] **Step 3: Implement the smallest dashboard mapping/UI change**

Map `web` to « Chat du site » or “Website chat”, preserve the existing reply and takeover calls, and display assistant/advisor identity from each message’s `author`. Do not add a second conversation store.

- [ ] **Step 4: Run all focused messaging tests**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx src/app/api/admin/messages/route.test.ts src/app/api/chat/route.test.ts src/server/messaging/repository.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- 'src/app/[locale]/(dashboard)/messages/page.tsx' src/components/admin/AdminExperience.test.tsx src/app/api/admin/messages/route.ts
git commit -m "feat: surface website chat in dashboard"
```

