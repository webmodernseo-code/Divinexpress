# Reign Dashboard Premium Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a visually coherent, responsive and fully interactive Reign administration frontend whose simulated data persists behind backend-ready contracts.

**Architecture:** Keep one administrative shell and move all domain state behind an asynchronous `AdminRepository` interface. Pages consume focused domain hooks and shared accessible UI primitives; the initial repository remains browser-local but can later be replaced by a Neon-backed server implementation without changing presentation components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, next-intl, Tailwind CSS 4, Lucide React SVG icons, Recharts, Vitest 4, Testing Library.

## Global Constraints

- Scope is the administration dashboard only; do not redesign the public storefront.
- Preserve unrelated working-tree changes and stage only files owned by the current task.
- Use Lucide React SVG components for every interface icon; no emoji, Unicode symbol icon, bitmap control icon or new icon dependency.
- Use French and English copy through the existing locale routing conventions.
- Keep `localStorage` behind `AdminRepository`; pages and components must never access it directly.
- Respect `prefers-reduced-motion`, visible keyboard focus and 44-pixel mobile targets.
- Every visible action must perform a persistent behavior or explicitly report that the result is simulated.
- Follow strict red-green-refactor TDD for every behavior change.
- Do not connect Vercel, GitHub, Neon, authentication providers or production APIs in this plan.

---

## File Structure

- `src/lib/admin/types.ts`: canonical domain entities, filters, mutation inputs and result types.
- `src/lib/admin/demoData.ts`: complete, deterministic seed state for every admin domain.
- `src/lib/admin/repository.ts`: `AdminRepository` contract plus local asynchronous implementation and migration.
- `src/lib/admin/selectors.ts`: pure filtering, pagination, aggregation and transition rules.
- `src/context/AdminDemoContext.tsx`: repository injection, query/mutation state and domain actions.
- `src/components/admin/AdminShell.tsx`: the only shell composition.
- `src/components/admin/AdminSidebar.tsx`: navigation presentation used by desktop and mobile shell.
- `src/components/admin/AdminTopbar.tsx`: breadcrumbs, search, notifications and profile actions.
- `src/components/admin/ui/*`: shared visual and accessibility primitives.
- `src/components/admin/dashboard/*`: dashboard-only sections and export behavior.
- `src/components/admin/products/*`: product list, editor and confirmation flows.
- `src/components/admin/orders/*`: order list and detail flows.
- `src/components/admin/returns/*`: return list and decision flows.
- `src/components/admin/messages/*`: conversation list, thread and private notes.
- `src/components/admin/customers/*`: customer list and detail.
- `src/components/admin/settings/*`: settings navigation, forms and simulated connections.
- `src/app/[locale]/(dashboard)/*/page.tsx`: thin route composition only.
- `src/app/globals.css`: admin design tokens and reduced-motion rules.

---

### Task 1: Establish the visual and structural baseline

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/admin/AdminShell.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminTopbar.tsx`
- Delete after migration: `src/components/admin/DashboardOverview.tsx` duplicate shell-only markup where applicable
- Test: `src/components/admin/AdminShell.test.tsx`
- Test: `src/lib/admin/iconPolicy.test.ts`

**Interfaces:**
- Consumes: `AdminPreferences.sidebarCollapsed: boolean` from the current context.
- Produces: `AdminShell({ children }: { children: ReactNode }): JSX.Element`, one `AdminSidebar`, one `AdminTopbar`, and a static SVG icon policy test.

- [ ] **Step 1: Write a failing shell composition test**

```tsx
it('uses one navigation tree and marks the current route', () => {
  renderAdmin(<AdminShell><p>Content</p></AdminShell>, { pathname: '/dashboard' });
  expect(screen.getAllByRole('navigation', { name: /navigation principale/i })).toHaveLength(1);
  expect(screen.getByRole('link', { name: /vue d'ensemble/i })).toHaveAttribute('aria-current', 'page');
});

it('closes the mobile drawer and restores focus to its trigger', async () => {
  const user = userEvent.setup();
  renderAdmin(<AdminShell><p>Content</p></AdminShell>);
  const trigger = screen.getByRole('button', { name: /ouvrir la navigation/i });
  await user.click(trigger);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: /navigation/i })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
```

- [ ] **Step 2: Run the focused test and verify the duplicate shell fails it**

Run: `npm.cmd test -- src/components/admin/AdminShell.test.tsx`  
Expected: FAIL because active-route state, focus restoration or the single composed navigation contract is missing.

- [ ] **Step 3: Add a failing static icon-policy test**

```ts
it('keeps admin controls on the Lucide SVG icon system', () => {
  const sources = readAdminSourceFiles();
  expect(sources).not.toMatch(/from ['"]react-icons/);
  expect(sources).not.toMatch(/[⌄⌘✕✓⚠️]/u);
  expect(sources).not.toMatch(/<img[^>]+(?:icon|button)/i);
});
```

Keep `readAdminSourceFiles()` inside `src/lib/admin/iconPolicy.test.ts` and restrict it to `src/components/admin` plus dashboard route files.

- [ ] **Step 4: Consolidate the shell**

Make `AdminShell` compose the existing `AdminSidebar` and `AdminTopbar`; remove their parallel inline equivalents. Pass locale-aware navigation URLs through `@/i18n/navigation`, compute `aria-current` from `usePathname`, and render the same navigation data inside the mobile dialog. Replace the `⌘K` glyph and any chevron character with Lucide `Command` and `ChevronDown` components.

- [ ] **Step 5: Normalize dashboard tokens and motion**

Keep one declaration for each `--color-admin-*` token in `globals.css`. Add shared durations `--admin-motion-fast: 160ms` and `--admin-motion-panel: 260ms`, then include:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Run focused and regression checks**

Run: `npm.cmd test -- src/components/admin/AdminShell.test.tsx src/lib/admin/iconPolicy.test.ts`  
Expected: PASS with no duplicate navigation and no forbidden icon source.

- [ ] **Step 7: Commit the structural baseline**

```powershell
git add -- src/app/globals.css src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopbar.tsx src/components/admin/AdminShell.test.tsx src/lib/admin/iconPolicy.test.ts
git commit -m "refactor: unify premium admin shell"
```

---

### Task 2: Expand the backend-ready repository contract

**Files:**
- Modify: `src/lib/admin/types.ts`
- Modify: `src/lib/admin/demoData.ts`
- Modify: `src/lib/admin/repository.ts`
- Create: `src/lib/admin/selectors.ts`
- Modify: `src/lib/admin/repository.test.ts`
- Create: `src/lib/admin/selectors.test.ts`

**Interfaces:**
- Produces: `AdminRepository`, `AdminOperationError`, `AdminQuery<T>`, `PageResult<T>`, domain entities and transition selectors.
- Produces signatures:

```ts
export interface AdminRepository {
  getState(): Promise<AdminState>;
  reset(): Promise<AdminState>;
  saveProduct(input: ProductInput): Promise<Product>;
  duplicateProduct(id: string): Promise<Product>;
  setProductStatus(id: string, status: ProductStatus): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  createShipment(input: ShipmentInput): Promise<Order>;
  createRefund(input: RefundInput): Promise<Order>;
  updateReturn(id: string, decision: ReturnDecision): Promise<ReturnRequest>;
  sendMessage(input: MessageInput): Promise<Message>;
  addPrivateNote(input: PrivateNoteInput): Promise<PrivateNote>;
  updateCustomer(id: string, patch: CustomerPatch): Promise<Customer>;
  saveSettings(input: StoreSettingsInput): Promise<StoreSettings>;
}
```

- [ ] **Step 1: Write failing repository persistence and error tests**

```ts
it('persists a created product through a fresh repository instance', async () => {
  const first = createLocalAdminRepository({ latencyMs: 0 });
  const product = await first.saveProduct(validProductInput);
  const second = createLocalAdminRepository({ latencyMs: 0 });
  expect((await second.getState()).products).toContainEqual(product);
});

it('rejects an invalid paid-to-cancelled order transition', async () => {
  const repository = createLocalAdminRepository({ latencyMs: 0 });
  await expect(repository.updateOrderStatus('ord-paid', 'cancelled'))
    .rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
});
```

- [ ] **Step 2: Run repository tests and verify RED**

Run: `npm.cmd test -- src/lib/admin/repository.test.ts src/lib/admin/selectors.test.ts`  
Expected: FAIL because the asynchronous contract and domain entities do not exist.

- [ ] **Step 3: Define canonical types and version 2 state**

Define stable English machine values for statuses and localize labels in components. `AdminState` must contain `version: 2`, `preferences`, `products`, `orders`, `returns`, `conversations`, `customers`, `settings`, `notifications`, and dashboard source data. Use ISO timestamps and integer minor currency units.

- [ ] **Step 4: Implement pure selectors and transitions**

Export `filterProducts`, `paginate`, `calculateDashboardMetrics`, `canTransitionOrder`, `filterOrders`, `filterReturns`, `filterConversations`, and `filterCustomers`. Each selector accepts explicit inputs and performs no storage or React work.

- [ ] **Step 5: Implement the local repository and migration**

Expose `createLocalAdminRepository({ latencyMs = 180, failNext = false })`. Read and write only `reign:admin-demo:v2`. When v1 data is found, merge compatible dashboard preferences into a fresh v2 seed; malformed or future-version data falls back to a fresh seed. Clone returned values so consumers cannot mutate stored state by reference.

- [ ] **Step 6: Run repository and selector tests**

Run: `npm.cmd test -- src/lib/admin/repository.test.ts src/lib/admin/selectors.test.ts`  
Expected: PASS for persistence, migration, filtering, pagination, aggregates and invalid transitions.

- [ ] **Step 7: Commit the data contract**

```powershell
git add -- src/lib/admin/types.ts src/lib/admin/demoData.ts src/lib/admin/repository.ts src/lib/admin/repository.test.ts src/lib/admin/selectors.ts src/lib/admin/selectors.test.ts
git commit -m "feat: add backend-ready admin repository"
```

---

### Task 3: Add asynchronous context and accessible feedback primitives

**Files:**
- Modify: `src/context/AdminDemoContext.tsx`
- Create: `src/context/AdminDemoContext.test.tsx`
- Create: `src/components/admin/ui/ToastProvider.tsx`
- Create: `src/components/admin/ui/ConfirmDialog.tsx`
- Create: `src/components/admin/ui/Drawer.tsx`
- Create: `src/components/admin/ui/FormField.tsx`
- Create: `src/components/admin/ui/AsyncState.tsx`
- Modify: `src/components/admin/ui/AdminPrimitives.test.tsx`

**Interfaces:**
- Consumes: `AdminRepository` from Task 2.
- Produces: `AdminDemoProvider({ repository?, children })`, `useAdminDemo()`, `useToast()`, `ConfirmDialog`, `Drawer`, `FormField` and `AsyncState`.
- Context actions return `Promise<void>` and expose `status: 'loading' | 'ready' | 'error'`, `mutation: string | null`, and `error: AdminOperationError | null`.

- [ ] **Step 1: Write failing provider mutation tests**

```tsx
it('rolls back optimistic state and announces repository errors', async () => {
  const repository = createMemoryAdminRepository(seed, { reject: 'NETWORK' });
  render(<AdminDemoProvider repository={repository}><ProductHarness /></AdminDemoProvider>);
  await userEvent.click(await screen.findByRole('button', { name: /archiver/i }));
  expect(await screen.findByRole('status')).toHaveTextContent(/impossible/i);
  expect(screen.getByText(/publié/i)).toBeVisible();
});
```

- [ ] **Step 2: Write failing overlay accessibility tests**

Verify that `ConfirmDialog` has `role="alertdialog"`, focuses its title or first action, closes on `Escape`, restores trigger focus, and does not call `onConfirm` twice while `busy`.

- [ ] **Step 3: Run tests and verify RED**

Run: `npm.cmd test -- src/context/AdminDemoContext.test.tsx src/components/admin/ui/AdminPrimitives.test.tsx`  
Expected: FAIL because injection, rollback and overlay primitives are absent.

- [ ] **Step 4: Implement provider orchestration**

Load `repository.getState()` on mount, expose focused actions that delegate to the repository, and refresh or reconcile state after success. Keep optimistic changes limited to reversible status updates. Use one mutation key at a time to prevent duplicate submissions.

- [ ] **Step 5: Implement feedback and overlay primitives**

Use React portals only when required by stacking context. Apply `aria-live="polite"` to toasts, `aria-modal="true"` to overlays, body scroll locking with cleanup, focus trapping, and trigger restoration. All close and status icons come from Lucide.

- [ ] **Step 6: Run focused tests**

Run: `npm.cmd test -- src/context/AdminDemoContext.test.tsx src/components/admin/ui/AdminPrimitives.test.tsx`  
Expected: PASS with rollback, focus restoration and double-submit protection.

- [ ] **Step 7: Commit the interaction foundation**

```powershell
git add -- src/context/AdminDemoContext.tsx src/context/AdminDemoContext.test.tsx src/components/admin/ui
git commit -m "feat: add resilient admin interaction primitives"
```

---

### Task 4: Complete login, navigation search and dashboard overview

**Files:**
- Modify: `src/components/admin/LoginPanel.tsx`
- Modify: `src/components/admin/AdminTopbar.tsx`
- Modify: `src/components/admin/DashboardOverview.tsx`
- Create: `src/components/admin/dashboard/exportDashboard.ts`
- Create: `src/components/admin/dashboard/exportDashboard.test.ts`
- Modify: `src/components/admin/AdminExperience.test.tsx`
- Modify: `src/app/[locale]/(auth)/connexion/page.tsx`

**Interfaces:**
- Produces: `validateAdminCredentials(input): FieldErrors`, `exportDashboardCsv(state, period): Blob`, and functional search navigation.
- `LoginPanel` accepts `locale` and optional `authenticate(credentials): Promise<void>` for testability and future server auth.

- [ ] **Step 1: Write failing login and dashboard behavior tests**

```tsx
it('keeps credentials and exposes field errors after a rejected login', async () => {
  render(<LoginPanel locale="fr" authenticate={() => Promise.reject(new Error('INVALID'))} />);
  await userEvent.type(screen.getByLabelText(/identifiant/i), 'admin@reign.test');
  await userEvent.type(screen.getByLabelText(/^mot de passe$/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/identifiants/i);
  expect(screen.getByLabelText(/identifiant/i)).toHaveValue('admin@reign.test');
});

it('changes metrics when the dashboard period changes', async () => {
  renderAdmin(<DashboardOverview />);
  const before = screen.getByTestId('revenue-value').textContent;
  await userEvent.selectOptions(screen.getByLabelText(/période/i), '7d');
  expect(screen.getByTestId('revenue-value')).not.toHaveTextContent(before ?? '');
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx src/components/admin/dashboard/exportDashboard.test.ts`  
Expected: FAIL on form validation, dynamic aggregates or CSV export.

- [ ] **Step 3: Implement login states and route transition**

Validate non-empty identifier and an eight-character minimum password. Display field-linked errors, preserve values, set `aria-busy`, prevent repeat submission and navigate to `/${locale}/dashboard` only after the injected authentication promise resolves.

- [ ] **Step 4: Implement global search and notifications**

Submitting topbar search navigates to the matching product or order page with a query parameter. Notification items navigate to their referenced entity and can be marked read persistently. Use a Lucide `Command` icon for the keyboard hint and bind `Ctrl+K`/`Meta+K` to focus search.

- [ ] **Step 5: Implement repository-derived dashboard values and CSV export**

Use `calculateDashboardMetrics(state, period)` for cards and charts. Generate a UTF-8 CSV containing period, revenue, orders, average basket and returns. Create and revoke the object URL and announce download success through the toast provider.

- [ ] **Step 6: Run focused tests**

Run: `npm.cmd test -- src/components/admin/AdminExperience.test.tsx src/components/admin/dashboard/exportDashboard.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit the primary dashboard journey**

```powershell
git add -- src/components/admin/LoginPanel.tsx src/components/admin/AdminTopbar.tsx src/components/admin/DashboardOverview.tsx src/components/admin/dashboard src/components/admin/AdminExperience.test.tsx 'src/app/[locale]/(auth)/connexion/page.tsx'
git commit -m "feat: complete admin login and overview journeys"
```

---

### Task 5: Complete the product management journey

**Files:**
- Create: `src/components/admin/products/ProductFilters.tsx`
- Create: `src/components/admin/products/ProductTable.tsx`
- Create: `src/components/admin/products/ProductEditor.tsx`
- Create: `src/components/admin/products/ProductActions.tsx`
- Create: `src/components/admin/products/ProductJourney.test.tsx`
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`

**Interfaces:**
- Consumes: `Product`, `ProductInput`, `ProductStatus`, `PageResult<Product>` and context actions from Tasks 2–3.
- Produces: route search parameters `q`, `status`, `sort`, `page`; product create/edit/duplicate/archive/delete flows.

- [ ] **Step 1: Write a failing end-to-end component journey**

```tsx
it('creates, filters, duplicates, archives and deletes a persisted product', async () => {
  const repository = createMemoryAdminRepository(createAdminSeed());
  renderAdmin(<ProductsPage />, { repository });
  await userEvent.click(screen.getByRole('button', { name: /ajouter un produit/i }));
  await fillValidProductForm({ name: 'Veste Atelier', sku: 'REI-JKT-001', price: '129.00' });
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
  expect(await screen.findByText('Veste Atelier')).toBeVisible();
  expect((await repository.getState()).products).toEqual(expect.arrayContaining([expect.objectContaining({ sku: 'REI-JKT-001' })]));
});
```

- [ ] **Step 2: Run the product journey and verify RED**

Run: `npm.cmd test -- src/components/admin/products/ProductJourney.test.tsx`  
Expected: FAIL because product operations are page-local or incomplete.

- [ ] **Step 3: Extract filtering and table components**

Synchronize filters with locale-aware route query parameters. Provide mobile cards and a desktop table from the same result set. Show selection count, clear filters action, empty results action and accessible pagination labels.

- [ ] **Step 4: Implement the product editor**

Support name, description, SKU, price in major units converted to integer minor units, status, category, tags, stock and variants. Validate unique SKU, non-negative stock, price greater than zero and at least one active variant. Preserve values after repository errors and display unsaved-change state.

- [ ] **Step 5: Implement confirmed mutations**

Duplicate appends `-COPY` to a unique SKU and opens the duplicate in edit mode. Archive and delete require `ConfirmDialog`; delete removes the entity only after repository success. Bulk archive operates on selected IDs and reports the count.

- [ ] **Step 6: Run product and repository regression tests**

Run: `npm.cmd test -- src/components/admin/products/ProductJourney.test.tsx src/lib/admin/repository.test.ts src/lib/admin/selectors.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit product management**

```powershell
git add -- src/components/admin/products 'src/app/[locale]/(dashboard)/produits/page.tsx'
git commit -m "feat: complete persistent product management"
```

---

### Task 6: Complete orders and returns

**Files:**
- Create: `src/components/admin/orders/OrderList.tsx`
- Create: `src/components/admin/orders/OrderDetailDrawer.tsx`
- Create: `src/components/admin/orders/OrderJourney.test.tsx`
- Create: `src/components/admin/returns/ReturnList.tsx`
- Create: `src/components/admin/returns/ReturnDecisionDialog.tsx`
- Create: `src/components/admin/returns/ReturnJourney.test.tsx`
- Modify: `src/app/[locale]/(dashboard)/commandes/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/retours/page.tsx`

**Interfaces:**
- Consumes: repository methods `updateOrderStatus`, `createShipment`, `createRefund`, `updateReturn`.
- Produces: persisted order and return workflows with explicit transition errors.

- [ ] **Step 1: Write failing order and return journeys**

```tsx
it('creates a shipment and persists its tracking number', async () => {
  renderAdmin(<OrdersPage />, { repository });
  await openOrder('REI-1001');
  await userEvent.click(screen.getByRole('button', { name: /créer l'expédition/i }));
  await userEvent.type(screen.getByLabelText(/numéro de suivi/i), 'DHL-123');
  await userEvent.click(screen.getByRole('button', { name: /confirmer/i }));
  expect(await screen.findByText('DHL-123')).toBeVisible();
});

it('accepts a return and restocks its items once', async () => {
  const before = productStock(await repository.getState(), 'prod-hoodie');
  renderAdmin(<ReturnsPage />, { repository });
  await decideReturn('RET-1001', 'accepted', { restock: true });
  expect(productStock(await repository.getState(), 'prod-hoodie')).toBe(before + 1);
});
```

- [ ] **Step 2: Run both journeys and verify RED**

Run: `npm.cmd test -- src/components/admin/orders/OrderJourney.test.tsx src/components/admin/returns/ReturnJourney.test.tsx`  
Expected: FAIL because the existing page-local handlers do not persist through the repository.

- [ ] **Step 3: Build order list and detail drawer**

Apply combined search, status, date and pagination selectors. On desktop render a side drawer; on mobile render a full-screen drawer. Shipment requires carrier and tracking number. Refund requires an integer minor-unit amount not exceeding the refundable balance and a reason.

- [ ] **Step 4: Build return decisions**

Accept, refuse and refund use explicit allowed transitions. Acceptance optionally restocks each line exactly once. Refusal requires a reason. Refund requires confirmation and updates both the return and related order totals atomically in the repository.

- [ ] **Step 5: Add loading, error and empty states**

Disable mutation buttons while their operation key is active. Preserve dialog fields after recoverable failures. Announce successful shipment, refund and return decisions.

- [ ] **Step 6: Run focused and transition tests**

Run: `npm.cmd test -- src/components/admin/orders/OrderJourney.test.tsx src/components/admin/returns/ReturnJourney.test.tsx src/lib/admin/selectors.test.ts src/lib/admin/repository.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit order and return workflows**

```powershell
git add -- src/components/admin/orders src/components/admin/returns 'src/app/[locale]/(dashboard)/commandes/page.tsx' 'src/app/[locale]/(dashboard)/retours/page.tsx'
git commit -m "feat: complete order and return workflows"
```

---

### Task 7: Complete messages, customers and settings

**Files:**
- Create: `src/components/admin/messages/MessageWorkspace.tsx`
- Create: `src/components/admin/messages/MessageJourney.test.tsx`
- Create: `src/components/admin/customers/CustomerDirectory.tsx`
- Create: `src/components/admin/customers/CustomerJourney.test.tsx`
- Create: `src/components/admin/settings/SettingsWorkspace.tsx`
- Create: `src/components/admin/settings/SettingsJourney.test.tsx`
- Modify: `src/app/[locale]/(dashboard)/messages/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/clients/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`

**Interfaces:**
- Consumes: `sendMessage`, `addPrivateNote`, `updateCustomer`, `saveSettings` from the repository.
- Produces: persistent three-domain journeys and cross-links using entity IDs.

- [ ] **Step 1: Write failing persistent journey tests**

```tsx
it('sends a message and preserves it after remount', async () => {
  const view = renderAdmin(<MessagesPage />, { repository });
  await userEvent.type(screen.getByLabelText(/votre réponse/i), 'Votre commande est prête.');
  await userEvent.click(screen.getByRole('button', { name: /envoyer/i }));
  view.unmount();
  renderAdmin(<MessagesPage />, { repository });
  expect(await screen.findByText('Votre commande est prête.')).toBeVisible();
});

it('saves store settings and marks external connections as simulated', async () => {
  renderAdmin(<SettingsPage />, { repository });
  await userEvent.clear(screen.getByLabelText(/nom de la boutique/i));
  await userEvent.type(screen.getByLabelText(/nom de la boutique/i), 'Reign Dakar');
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
  expect(await screen.findByText(/paramètres enregistrés/i)).toBeVisible();
  expect(screen.getAllByText(/simulation/i).length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the domain journeys and verify RED**

Run: `npm.cmd test -- src/components/admin/messages/MessageJourney.test.tsx src/components/admin/customers/CustomerJourney.test.tsx src/components/admin/settings/SettingsJourney.test.tsx`  
Expected: FAIL because page-local state is not repository-backed.

- [ ] **Step 3: Implement the responsive messaging workspace**

Use three columns on large screens and progressive list/thread/customer views on mobile. Persist replies, quick replies, private notes, assignment and resolved status. Attachments remain simulated and must show a toast stating that no remote upload occurred.

- [ ] **Step 4: Implement the customer directory**

Add search, segment, sort and pagination. The detail surface edits tags and notes through `updateCustomer`; related orders and conversations are links built from IDs. Empty histories show a contextual action.

- [ ] **Step 5: Implement settings persistence**

Persist general, delivery, return and notification values. Validate required store name, email, currency and timezone. Payment, WhatsApp and team connection controls open a confirmation and then record only a simulated connection status. The dangerous reset action requires typing `REIGN` before calling `repository.reset()`.

- [ ] **Step 6: Run all three journey tests**

Run: `npm.cmd test -- src/components/admin/messages/MessageJourney.test.tsx src/components/admin/customers/CustomerJourney.test.tsx src/components/admin/settings/SettingsJourney.test.tsx`  
Expected: PASS with remount persistence and explicit simulation labels.

- [ ] **Step 7: Commit the remaining domains**

```powershell
git add -- src/components/admin/messages src/components/admin/customers src/components/admin/settings 'src/app/[locale]/(dashboard)/messages/page.tsx' 'src/app/[locale]/(dashboard)/clients/page.tsx' 'src/app/[locale]/(dashboard)/parametres/page.tsx'
git commit -m "feat: complete admin communication and settings"
```

---

### Task 8: Perform visual, accessibility and production verification

**Files:**
- Modify only when a verified defect requires it: `src/components/admin/**`
- Modify only when a verified defect requires it: `src/app/[locale]/(dashboard)/**`
- Modify only when a verified defect requires it: `src/app/globals.css`
- Create: `docs/admin-backend-readiness.md`
- Create: `docs/admin-verification.md`

**Interfaces:**
- Consumes: all routes and behaviors from Tasks 1–7.
- Produces: reproducible verification record and backend handoff contract; no external connection or secret.

- [ ] **Step 1: Run the complete automated gate**

Run each command separately and record its exit code:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Expected: all exit with code 0. If any fails, reproduce the defect with the smallest failing test before changing production code.

- [ ] **Step 2: Start the production server for browser verification**

Run: `npm.cmd run start` after the successful build. Inspect `/fr/connexion`, `/fr/dashboard`, `/fr/produits`, `/fr/commandes`, `/fr/retours`, `/fr/messages`, `/fr/clients` and `/fr/parametres`.

- [ ] **Step 3: Inspect the three viewport classes**

Use 1440×900 desktop, 768×1024 tablet and 390×844 mobile. For every route record: overflow, clipped text, sidebar/drawer behavior, table/card adaptation, fixed-action overlap, focus visibility, loading/empty/error presentation and icon consistency.

- [ ] **Step 4: Exercise critical keyboard and persistence paths**

Verify login validation, `Tab` order, `Escape` overlay closure, focus restoration, `Ctrl+K`/`Meta+K`, product creation, shipment, return decision, sent message, settings save and persistence after reload. Enable reduced motion and verify that panels remain usable without visible animation dependency.

- [ ] **Step 5: Fix each observed defect through red-green-refactor**

For each defect, add a focused regression test, run it to observe the expected failure, apply the smallest fix, rerun the focused test, then rerun the complete automated gate from Step 1.

- [ ] **Step 6: Write the verification record**

In `docs/admin-verification.md`, record the exact commit, command outputs summarized as pass counts and exit codes, routes/viewports checked, keyboard paths exercised, and any intentionally simulated behavior. Do not claim WCAG certification; report only the checks performed.

- [ ] **Step 7: Write the backend readiness handoff**

In `docs/admin-backend-readiness.md`, document the `AdminRepository` methods, domain entities, required server boundaries, suggested environment variable names without values, authentication/role requirements, Neon migration needs, media storage needs and webhook candidates. State explicitly that Vercel, GitHub, Neon and API secrets remain unconnected.

- [ ] **Step 8: Commit verified hardening and documentation**

```powershell
git add -- src/components/admin 'src/app/[locale]/(dashboard)' src/app/globals.css docs/admin-verification.md docs/admin-backend-readiness.md
git commit -m "test: verify premium admin experience"
```

- [ ] **Step 9: Re-run the final gate after the commit**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git status --short
```

Expected: all quality commands exit 0. `git status --short` may show the user’s pre-existing unrelated changes, but no uncommitted file owned by this plan.

---

## Plan Self-Review Checklist

- Every requirement in the approved hardening spec maps to Tasks 1–8.
- The repository contract is defined before any domain component consumes it.
- The shared overlays and feedback system exist before destructive domain actions.
- All functional tasks include an observed failing test before production changes.
- Icon policy, reduced motion, responsive layout, persistence and keyboard behavior have explicit verification steps.
- External services and secrets are documented only; they are not connected in this plan.
