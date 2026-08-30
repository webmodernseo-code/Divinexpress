# Dashboard MVP Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the dashboard to its essential MVP navigation and make the orders screen explain every loading outcome.

**Architecture:** Keep the existing dashboard shell and pages, but expose only approved MVP destinations. Model orders request progress as explicit client state so loading, empty, and recoverable error interfaces are deterministic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-30-dashboard-mvp-simplification.md`

## Global Constraints

- Preserve locale-aware dashboard links.
- Do not change database schemas or API contracts.
- Do not modify or delete unrelated user files.

---

### Task 1: MVP navigation

**Files:**
- Modify: `src/components/admin/AdminShell.tsx`
- Test: `src/components/admin/AdminExperience.test.tsx`

**Interfaces:**
- Consumes: locale-aware `AdminShell` navigation.
- Produces: four direct links: Dashboard, Products, Orders, Settings.

- [ ] Add a failing component test asserting the four links and absence of Messages, Returns, and Customers.
- [ ] Run the focused test and confirm the expected failure.
- [ ] Reduce the navigation configuration to the approved direct links.
- [ ] Run the focused test and confirm it passes.

### Task 2: Essential settings

**Files:**
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`
- Test: `src/app/[locale]/(dashboard)/parametres/page.test.tsx`

**Interfaces:**
- Consumes: existing General, Payments, Shipping, and Security settings panels.
- Produces: a compact settings navigation exposing only those panels.

- [ ] Add a failing component test for the four visible settings sections and the absence of advanced sections.
- [ ] Run the focused test and confirm the expected failure.
- [ ] Restrict the settings tab type and visible tabs to the four MVP sections.
- [ ] Run the focused test and confirm it passes.

### Task 3: Orders request states

**Files:**
- Modify: `src/app/[locale]/(dashboard)/commandes/page.tsx`
- Test: `src/app/[locale]/(dashboard)/commandes/page.test.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/orders` returning an order array or an HTTP error.
- Produces: visible loading, retryable error, and empty states.

- [ ] Add failing tests for loading, API failure and retry, and an empty successful response.
- [ ] Run the focused tests and confirm the expected failures.
- [ ] Add explicit request state and accessible status messages, retaining the existing populated orders view.
- [ ] Run the focused tests and confirm they pass.

### Task 4: Verification

**Files:**
- Verify all modified files and tests.

**Interfaces:**
- Consumes: completed MVP changes.
- Produces: evidence that tests, type checking, lint, and production build succeed.

- [ ] Run focused tests.
- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
- [ ] Review `git diff` to confirm unrelated user changes remain untouched.
