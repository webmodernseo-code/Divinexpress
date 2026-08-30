# Functional MVP Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every visible MVP setting persist and produce a real effect in the dashboard, storefront, or checkout.

**Architecture:** Add one typed server-side settings repository over `store_settings`, then make the admin API, public layout, public information pages, and checkout consume that shared contract. Keep credentials in the existing security route, and gate storefront rendering plus checkout server-side when the shop is closed.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, PostgreSQL/SQLite database adapter, Zod 4, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-30-functional-mvp-settings-design.md`

## Global Constraints

- The table `store_settings` remains the source of truth.
- The visible sections are General, Shipping, Payments, and Security only.
- No logo upload, favicon upload, automated notifications, WhatsApp Business API, or payment-provider onboarding is implemented in this lot.
- Public responses never expose administrator credentials or provider secrets.
- Shop closure blocks checkout on the server while preserving login, dashboard, and legal-page access.
- Existing unrelated local files and modifications must remain untouched.

---

### Task 1: Typed store settings repository

**Files:**
- Create: `src/server/settings/store-settings.ts`
- Create: `src/server/settings/store-settings.test.ts`
- Modify: `src/app/api/admin/settings/route.ts`
- Modify: `src/app/api/admin/settings/route.test.ts`

**Interfaces:**
- Produces: `StoreSettings`, `PublicStoreSettings`, `DEFAULT_STORE_SETTINGS`, `readStoreSettings(database)`, `readPublicStoreSettings(database)`, and `writeStoreSettings(database, adminId, input)`.
- Consumes: existing `Database` and `store_settings(key, value_json, updated_by, updated_at)`.

- [ ] **Step 1: Write failing repository tests**

```ts
it('merges persisted values over safe defaults', async () => {
  const database = createDatabase(':memory:');
  await migrateDatabase(database);
  await database.prepare(`INSERT INTO store_settings (key, value_json)
    VALUES ('shop_name', '"Maison Divine"'), ('shop_enabled', 'false')`).run();
  await expect(readStoreSettings(database)).resolves.toMatchObject({
    shop_name: 'Maison Divine',
    shop_enabled: false,
    currency: 'EUR',
  });
});

it('exposes only public settings', async () => {
  const settings = await readPublicStoreSettings(database);
  expect(settings).toEqual(expect.objectContaining({ shop_name: 'DivinExpress' }));
  expect(settings).not.toHaveProperty('currentPassword');
});
```

- [ ] **Step 2: Run the repository test and verify RED**

Run: `npm.cmd test -- src/server/settings/store-settings.test.ts --pool=forks`

Expected: FAIL because `store-settings.ts` and its exports do not exist.

- [ ] **Step 3: Implement the typed repository and schema**

```ts
export const storeSettingsSchema = z.object({
  shop_name: z.string().trim().min(1).max(120),
  email: z.email(),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  country: z.string().trim().min(2).max(80),
  currency: z.enum(['EUR', 'GBP']),
  timezone: z.enum(['Europe/Paris', 'Europe/London']),
  free_shipping_threshold_minor: z.number().int().nonnegative(),
  return_period_days: z.union([z.literal(14), z.literal(30), z.literal(60)]),
  payment_europe_enabled: z.boolean(),
  payment_africa_enabled: z.boolean(),
  shop_enabled: z.boolean(),
});

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shop_name: 'DivinExpress', email: 'contact@divinexpress.fr',
  phone: '+33 7 53 74 10 30', address: '', country: 'France',
  currency: 'EUR', timezone: 'Europe/Paris',
  free_shipping_threshold_minor: 15000, return_period_days: 14,
  payment_europe_enabled: true, payment_africa_enabled: true,
  shop_enabled: true,
};
```

Read all known keys, JSON-parse each value, validate the merged object, and upsert only schema keys inside the existing transaction pattern.

- [ ] **Step 4: Refactor the admin settings route to use the repository**

`GET` returns `readStoreSettings(database)`. `POST` parses the complete typed object and calls `writeStoreSettings(database, admin.id, input)`. Return `INVALID_SETTINGS` for Zod failures and `SETTINGS_SAVE_FAILED` for storage failures.

- [ ] **Step 5: Run repository and route tests and verify GREEN**

Run: `npm.cmd test -- src/server/settings/store-settings.test.ts src/app/api/admin/settings/route.test.ts --pool=forks`

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 1**

```powershell
git add -- src/server/settings/store-settings.ts src/server/settings/store-settings.test.ts src/app/api/admin/settings/route.ts src/app/api/admin/settings/route.test.ts
git commit -m "feat: centralize functional store settings"
```

### Task 2: Honest and recoverable Settings interface

**Files:**
- Create: `src/components/admin/StoreSettingsForm.tsx`
- Create: `src/components/admin/StoreSettingsForm.test.tsx`
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`
- Modify: `src/lib/admin/mvp-config.ts`

**Interfaces:**
- Consumes: the complete `StoreSettings` JSON returned by `/api/admin/settings` and existing `/api/admin/security`.
- Produces: four functional tabs with explicit loading, load error, save error, save success, dirty, saving, and cancel states.

- [ ] **Step 1: Write failing form-state tests**

```tsx
it('restores the last server values when Cancel is clicked', async () => {
  render(<StoreSettingsForm initialSettings={settings} locale="fr" save={save} />);
  await userEvent.type(screen.getByLabelText(/nom de la boutique/i), ' Test');
  await userEvent.click(screen.getByRole('button', { name: /annuler/i }));
  expect(screen.getByLabelText(/nom de la boutique/i)).toHaveValue(settings.shop_name);
});

it('keeps edits and displays an error when saving fails', async () => {
  const save = vi.fn().mockRejectedValue(new Error('SETTINGS_SAVE_FAILED'));
  render(<StoreSettingsForm initialSettings={settings} locale="fr" save={save} />);
  await userEvent.clear(screen.getByLabelText(/nom de la boutique/i));
  await userEvent.type(screen.getByLabelText(/nom de la boutique/i), 'Maison Divine');
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/impossible/i);
  expect(screen.getByLabelText(/nom de la boutique/i)).toHaveValue('Maison Divine');
});
```

- [ ] **Step 2: Run the form test and verify RED**

Run: `npm.cmd test -- src/components/admin/StoreSettingsForm.test.tsx --pool=forks`

Expected: FAIL because `StoreSettingsForm` does not exist.

- [ ] **Step 3: Implement the focused form component**

Render only:

- General: shop name, public email, public phone, address, country, currency (`EUR`, `GBP`), timezone, and shop-enabled switch.
- Shipping: decimal-euro input mapped to `free_shipping_threshold_minor`, and 14/30/60-day return select.
- Payments: Europe and Africa switches with provider status fetched from `/api/checkout?region=...`.
- Security: retain the existing credential form and current-password confirmation.

Store both `serverSettings` and `draftSettings`; Cancel clones `serverSettings`; successful save replaces both with the response payload. Remove every inactive logo, favicon, notification, WhatsApp, provider-connect, and danger-zone control.

- [ ] **Step 4: Add page-level loading and retry states**

The page fetches `/api/admin/settings`. Before resolution it renders `Chargement des paramètres…`; on failure it renders `Impossible de charger les paramètres` and a `Réessayer` button. It renders `StoreSettingsForm` only after a valid response.

- [ ] **Step 5: Run the component tests and verify GREEN**

Run: `npm.cmd test -- src/components/admin/StoreSettingsForm.test.tsx --pool=forks`

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 2**

```powershell
git add -- "src/app/[locale]/(dashboard)/parametres/page.tsx" src/components/admin/StoreSettingsForm.tsx src/components/admin/StoreSettingsForm.test.tsx src/lib/admin/mvp-config.ts
git commit -m "feat: make MVP settings interface truthful"
```

### Task 3: Public settings in layout, footer, and contact page

**Files:**
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/components/layout/SiteChrome.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/Footer.test.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`
- Create: `src/app/[locale]/contact/page.test.tsx`
- Modify: `src/context/CurrencyContext.tsx`
- Modify: `src/context/CurrencyContext.test.tsx`

**Interfaces:**
- Consumes: `readPublicStoreSettings(await getCommerceDatabase())`.
- Produces: `SiteChrome({ children, settings })`, `Footer({ settings })`, and `CurrencyProvider({ initialLocale, initialCurrency })`.

- [ ] **Step 1: Write failing public-consumer tests**

```tsx
it('renders configured public contact details in the footer', () => {
  render(<Footer settings={{ ...publicSettings, shop_name: 'Maison Divine', email: 'bonjour@example.com', phone: '+33 1 02 03 04 05' }} />);
  expect(screen.getByText('Maison Divine')).toBeVisible();
  expect(screen.getByRole('link', { name: 'bonjour@example.com' })).toHaveAttribute('href', 'mailto:bonjour@example.com');
});

it('uses the configured currency as the first preference', () => {
  const { result } = renderHook(() => useCurrency(), {
    wrapper: ({ children }) => <CurrencyProvider initialLocale="fr" initialCurrency="GBP">{children}</CurrencyProvider>,
  });
  expect(result.current.currency).toBe('GBP');
});
```

- [ ] **Step 2: Run public-consumer tests and verify RED**

Run: `npm.cmd test -- src/components/layout/Footer.test.tsx src/context/CurrencyContext.test.tsx src/app/[locale]/contact/page.test.tsx --pool=forks`

Expected: FAIL because the components do not accept public settings.

- [ ] **Step 3: Load settings once in the locale layout**

After locale validation, load public settings from the database and pass them to `CurrencyProvider` and `SiteChrome`. Use `export const dynamic = 'force-dynamic'` on the locale layout so a saved value appears without redeployment.

- [ ] **Step 4: Apply name and contact details**

Pass settings to `Footer`; render configured shop name, email, and telephone as accessible `mailto:` and `tel:` links. Convert Contact to a server page that loads settings, then pass them to a small client content component for locale-dependent rendering. Replace hard-coded email, telephone, and 14-day return copy.

- [ ] **Step 5: Apply the configured default currency**

Extend `CurrencyProvider` with `initialCurrency: CurrencyCode`. Use it unless valid local storage already contains an explicit user preference. Keep `EUR` and `GBP` as the only supported storefront currencies.

- [ ] **Step 6: Run public-consumer tests and verify GREEN**

Run: `npm.cmd test -- src/components/layout/Footer.test.tsx src/context/CurrencyContext.test.tsx src/app/[locale]/contact/page.test.tsx --pool=forks`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 3**

```powershell
git add -- "src/app/[locale]/layout.tsx" "src/app/[locale]/contact/page.tsx" "src/app/[locale]/contact/page.test.tsx" src/components/layout/SiteChrome.tsx src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx src/context/CurrencyContext.tsx src/context/CurrencyContext.test.tsx
git commit -m "feat: apply public store settings"
```

### Task 4: Shipping and return settings in public flows

**Files:**
- Create: `src/server/settings/shipping.ts`
- Create: `src/server/settings/shipping.test.ts`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/checkout/route.test.ts`
- Modify: `src/app/[locale]/livraison-retours/page.tsx`
- Create: `src/app/[locale]/livraison-retours/page.test.tsx`
- Modify: `src/app/[locale]/panier/page.tsx`

**Interfaces:**
- Consumes: `free_shipping_threshold_minor`, `return_period_days`, cart subtotal in minor units.
- Produces: `shippingMinorFor(subtotalMinor, settings): number` and dynamic public copy.

- [ ] **Step 1: Write failing shipping calculation tests**

```ts
it.each([
  [14999, 15000, 990],
  [15000, 15000, 0],
  [20000, 15000, 0],
])('calculates shipping for subtotal %s', (subtotalMinor, threshold, expected) => {
  expect(shippingMinorFor(subtotalMinor, { free_shipping_threshold_minor: threshold })).toBe(expected);
});
```

- [ ] **Step 2: Run shipping tests and verify RED**

Run: `npm.cmd test -- src/server/settings/shipping.test.ts --pool=forks`

Expected: FAIL because `shippingMinorFor` does not exist.

- [ ] **Step 3: Implement and apply shipping calculation server-side**

Use a single base shipping fee of `990` minor units below the configured threshold. In checkout, calculate `subtotalMinor` from validated product variants before calling `CheckoutService.start`, then pass `shippingMinor: shippingMinorFor(subtotalMinor, settings)` instead of `0`.

- [ ] **Step 4: Render dynamic shipping and return information**

The shipping/returns page loads public settings and interpolates the formatted free-shipping threshold and return period. The cart page receives the threshold from a server wrapper or public-settings prop and replaces its hard-coded progress target.

- [ ] **Step 5: Run checkout and page tests and verify GREEN**

Run: `npm.cmd test -- src/server/settings/shipping.test.ts src/app/api/checkout/route.test.ts src/app/[locale]/livraison-retours/page.test.tsx --pool=forks`

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 4**

```powershell
git add -- src/server/settings/shipping.ts src/server/settings/shipping.test.ts src/app/api/checkout/route.ts src/app/api/checkout/route.test.ts "src/app/[locale]/livraison-retours/page.tsx" "src/app/[locale]/livraison-retours/page.test.tsx" "src/app/[locale]/panier/page.tsx"
git commit -m "feat: apply configurable shipping and returns"
```

### Task 5: Shop open/closed enforcement

**Files:**
- Create: `src/components/layout/StoreClosed.tsx`
- Create: `src/components/layout/StoreClosed.test.tsx`
- Modify: `src/components/layout/SiteChrome.tsx`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/checkout/route.test.ts`

**Interfaces:**
- Consumes: public `shop_enabled` and current localized pathname.
- Produces: `isPublicPathAllowedWhileClosed(pathname): boolean` and server error `SHOP_CLOSED` with HTTP 503.

- [ ] **Step 1: Write failing closure tests**

```ts
it.each(['/fr/connexion', '/fr/dashboard', '/fr/mentions-legales', '/fr/cgv', '/fr/confidentialite'])(
  'keeps %s accessible while closed',
  (pathname) => expect(isPublicPathAllowedWhileClosed(pathname)).toBe(true),
);

it('blocks checkout while the shop is closed', async () => {
  await saveSetting(database, 'shop_enabled', false);
  const response = await POST(validCheckoutRequest);
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({ error: 'SHOP_CLOSED' });
});
```

- [ ] **Step 2: Run closure tests and verify RED**

Run: `npm.cmd test -- src/components/layout/StoreClosed.test.tsx src/app/api/checkout/route.test.ts --pool=forks`

Expected: FAIL because storefront gating and `SHOP_CLOSED` do not exist.

- [ ] **Step 3: Implement the localized closed-store screen**

`SiteChrome` renders `StoreClosed` instead of commercial children when `settings.shop_enabled` is false and the pathname is not allowed. The screen explains temporary closure in French or English and provides a Contact link. Legal pages, login, and every dashboard segment remain accessible.

- [ ] **Step 4: Enforce closure in checkout**

At the beginning of both checkout `GET` and `POST`, load store settings. `POST` returns `{ error: 'SHOP_CLOSED' }` with 503 before product or provider work; `GET` returns both methods unavailable with `shopClosed: true`.

- [ ] **Step 5: Run closure tests and verify GREEN**

Run: `npm.cmd test -- src/components/layout/StoreClosed.test.tsx src/app/api/checkout/route.test.ts --pool=forks`

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 5**

```powershell
git add -- src/components/layout/StoreClosed.tsx src/components/layout/StoreClosed.test.tsx src/components/layout/SiteChrome.tsx src/app/api/checkout/route.ts src/app/api/checkout/route.test.ts
git commit -m "feat: enforce shop closure safely"
```

### Task 6: Payment state truthfulness

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/checkout/route.test.ts`
- Modify: `src/components/admin/StoreSettingsForm.tsx`
- Modify: `src/components/admin/StoreSettingsForm.test.tsx`

**Interfaces:**
- Consumes: checkout status payload for `europe` and `africa`.
- Produces: status labels `configured`, `provider_missing`, and `disabled` for each region.

- [ ] **Step 1: Write failing provider-state tests**

```ts
it('reports an enabled region with missing secrets separately', async () => {
  const response = await GET(new Request('https://example.com/api/checkout?region=europe'));
  await expect(response.json()).resolves.toMatchObject({
    region: { enabled: true, providerConfigured: false, status: 'provider_missing' },
  });
});
```

- [ ] **Step 2: Run checkout status tests and verify RED**

Run: `npm.cmd test -- src/app/api/checkout/route.test.ts src/components/admin/StoreSettingsForm.test.tsx --pool=forks`

Expected: FAIL because the status contract does not distinguish region state from provider configuration.

- [ ] **Step 3: Implement the explicit status contract and labels**

Return `{ region: { enabled, providerConfigured, status } }` from checkout `GET`. Render the three states in the Payment tab without exposing keys or secrets. The region switch changes only `enabled`; it never claims to configure a provider.

- [ ] **Step 4: Run provider-state tests and verify GREEN**

Run: `npm.cmd test -- src/app/api/checkout/route.test.ts src/components/admin/StoreSettingsForm.test.tsx --pool=forks`

Expected: all tests PASS.

- [ ] **Step 5: Commit Task 6**

```powershell
git add -- src/app/api/checkout/route.ts src/app/api/checkout/route.test.ts src/components/admin/StoreSettingsForm.tsx src/components/admin/StoreSettingsForm.test.tsx
git commit -m "feat: report payment availability accurately"
```

### Task 7: Final verification and production readiness

**Files:**
- Verify all files changed by Tasks 1–6.

**Interfaces:**
- Consumes: completed functional settings implementation.
- Produces: fresh evidence for focused behavior, TypeScript, lint, build, and production smoke tests.

- [ ] **Step 1: Run all focused settings tests**

Run:

```powershell
npm.cmd test -- src/server/settings/store-settings.test.ts src/app/api/admin/settings/route.test.ts src/components/admin/StoreSettingsForm.test.tsx src/components/layout/Footer.test.tsx src/context/CurrencyContext.test.tsx src/app/[locale]/contact/page.test.tsx src/server/settings/shipping.test.ts src/app/api/checkout/route.test.ts src/app/[locale]/livraison-retours/page.test.tsx src/components/layout/StoreClosed.test.tsx --pool=forks
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run static verification**

Run: `npm.cmd run typecheck`

Run focused lint over every changed `.ts` and `.tsx` file with `npx.cmd eslint <files>`.

Expected: exit code 0 for both commands.

- [ ] **Step 3: Run production build**

Run: `npm.cmd run build -- --webpack`

Expected: compilation, TypeScript, page generation, and build traces complete with exit code 0.

- [ ] **Step 4: Review repository scope**

Run: `git status --short --branch` and `git diff origin/feature/frontend-storefront...HEAD --stat`.

Expected: implementation commits contain only Task 1–6 files and the approved plan/spec; pre-existing logo deletions and unrelated documentation remain unstaged.

- [ ] **Step 5: Deploy and smoke-test after user-authorized push**

Push the feature branch, deploy production with Vercel, then verify:

```powershell
curl.exe -I -L --max-redirs 5 https://divinexpress.fr/fr/contact
curl.exe -I -L --max-redirs 5 https://divinexpress.fr/fr/parametres
```

Expected: both endpoints return HTTP 200, and Vercel reports the production deployment `READY` and aliased to `https://divinexpress.fr`.
