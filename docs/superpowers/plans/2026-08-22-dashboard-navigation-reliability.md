# Dashboard Navigation Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the recurring post-login dashboard navigation crash and provide a recoverable branded failure state.

**Architecture:** Reproduce the failure across authenticated dashboard routes, trace it to its source, then replace locale-hardcoded full reloads with the existing locale-aware navigation layer. Add a route-segment error boundary only after the root cause is fixed.

**Tech Stack:** Next.js 16.3 App Router, React 19, next-intl 4.13, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-22-storefront-dashboard-experience-design.md`

## Global Constraints

- Read relevant Next.js 16.3 guides under `node_modules/next/dist/docs/` before code changes.
- Preserve server-side session checks and the `divinexpress_admin_session` cookie behavior.
- Diagnose the root cause before implementing the fix.
- Preserve unrelated user changes in the dirty worktree.

---

### Task 1: Reproduce and isolate the dashboard failure

**Files:**
- Modify: `src/components/admin/AdminExperience.test.tsx`
- Inspect: `src/components/admin/AdminShell.tsx`
- Inspect: `src/app/[locale]/(dashboard)/layout.tsx`
- Inspect: `src/server/auth/runtime.ts`

**Interfaces:**
- Consumes: authenticated dashboard route contract `/{locale}/{segment}`
- Produces: a failing regression test naming the observed navigation break

- [ ] **Step 1: Capture the current baseline**

Run: `npm test -- src/components/admin/AdminExperience.test.tsx`

Expected: existing tests pass or the current failure output identifies an existing regression before new tests are added.

- [ ] **Step 2: Run the application and reproduce authenticated navigation**

Run: `npm run dev`

Exercise `/fr/connexion -> /fr/dashboard -> /fr/produits -> /fr/commandes -> /fr/messages -> /fr/dashboard` and repeat in `/en`. Record the first failing request, console stack, response status, and whether it is a client navigation or document reload.

- [ ] **Step 3: State one root-cause hypothesis from the evidence**

Document the hypothesis in the test name or a short test comment, for example: `uses locale-aware client links so dashboard navigation does not reload the protected layout`.

- [ ] **Step 4: Write the failing regression test**

Render the real `AdminShell` with next-intl navigation test setup and assert that a dashboard link retains the active locale and uses client navigation. The test must fail against the observed faulty link behavior, not merely inspect source text.

- [ ] **Step 5: Verify RED**

Run: `npm test -- src/components/admin/AdminExperience.test.tsx`

Expected: FAIL for the reproduced navigation contract.

### Task 2: Replace fragile administration navigation

**Files:**
- Modify: `src/components/admin/AdminShell.tsx`
- Modify: `src/components/admin/DashboardOverview.tsx`
- Modify: `src/components/admin/AdminTopbar.tsx`
- Modify: `src/app/[locale]/(dashboard)/produits/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/produits/[id]/modifier/page.tsx`
- Modify: `src/components/admin/ProductForm.tsx`
- Test: `src/components/admin/AdminExperience.test.tsx`

**Interfaces:**
- Consumes: `Link` and `useRouter` from `@/i18n/navigation`
- Produces: locale-aware client-side navigation for every dashboard route

- [ ] **Step 1: Implement the smallest root-cause fix**

Replace raw administration anchors and `/fr/...` destinations with `Link` or `useRouter` from `@/i18n/navigation`, using locale-free hrefs such as `/dashboard`, `/produits`, and `/commandes`. Do not change external, mailto, or legal links.

- [ ] **Step 2: Verify GREEN**

Run: `npm test -- src/components/admin/AdminExperience.test.tsx`

Expected: PASS.

- [ ] **Step 3: Add an English-locale regression case**

Assert that the same navigation contract resolves under `en`, catching any reintroduction of hard-coded `/fr` paths.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/components/admin/AdminExperience.test.tsx src/server/auth/auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/admin/AdminShell.tsx src/components/admin/DashboardOverview.tsx src/components/admin/AdminTopbar.tsx src/app/[locale]/(dashboard)/produits/page.tsx src/app/[locale]/(dashboard)/produits/[id]/modifier/page.tsx src/components/admin/ProductForm.tsx src/components/admin/AdminExperience.test.tsx
git commit -m "fix: stabilize dashboard navigation"
```

### Task 3: Add a branded dashboard recovery boundary

**Files:**
- Create: `src/app/[locale]/(dashboard)/error.tsx`
- Create: `src/app/[locale]/(dashboard)/error.test.tsx`

**Interfaces:**
- Consumes: Next.js error boundary props `{ error, reset }`
- Produces: `DashboardError({ error, reset })` with retry and dashboard-return actions

- [ ] **Step 1: Write the failing boundary test**

Render the boundary with a real `Error`, click `Réessayer`, and assert that `reset` is invoked. Assert a locale-aware link returns to `/dashboard`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- 'src/app/[locale]/(dashboard)/error.test.tsx'`

Expected: FAIL because the boundary does not exist.

- [ ] **Step 3: Implement the minimal boundary**

Create a client component that logs the error in an effect, displays a concise branded French/English recovery message, calls `reset()` from its primary button, and provides a `Link href="/dashboard"` secondary action.

- [ ] **Step 4: Verify GREEN and dashboard checks**

Run: `npm test -- 'src/app/[locale]/(dashboard)/error.test.tsx' src/components/admin/AdminExperience.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run static verification**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 6: Commit**

```powershell
git add -- 'src/app/[locale]/(dashboard)/error.tsx' 'src/app/[locale]/(dashboard)/error.test.tsx'
git commit -m "feat: add dashboard recovery boundary"
```

