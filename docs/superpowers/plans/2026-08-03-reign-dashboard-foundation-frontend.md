# Reign Dashboard Foundation Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la fondation visuelle pixel-perfect et responsive du back-office Reign, puis livrer les écrans Connexion et Vue d'ensemble avec interactions frontend persistantes.

**Architecture:** Le shell administratif et les primitives visuelles restent indépendants des pages métier. Un repository frontend typé, sauvegardé dans `localStorage`, expose les préférences et données de démonstration ; les pages consomment ce contrat sans connaître le mécanisme de persistance, afin de permettre un remplacement ultérieur par une API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, next-intl 4, Lucide React, Recharts 3, Vitest 4, Testing Library.

## Global Constraints

- Les maquettes fournies sont la source de vérité visuelle desktop.
- Le rendu doit être responsive sur desktop, tablette et mobile sans perte de fonctionnalité.
- L'interface utilise exclusivement des icônes SVG ; aucun emoji n'est admis.
- La palette reste noir profond, ivoire chaud, blanc cassé et gris neutres, avec couleurs fonctionnelles sobres.
- Les interactions de cette phase persistent dans `localStorage` et utilisent des contrats TypeScript remplaçables par une API.
- Les composants interactifs doivent être utilisables au clavier, exposer un focus visible et des libellés accessibles.
- Aucun changement hors du dashboard, de la connexion ou de leurs fondations partagées.

---

## File Map

- `src/app/globals.css` : tokens Tailwind, styles globaux et primitives d'animation.
- `src/lib/admin/types.ts` : contrats des préférences, métriques, commandes récentes et alertes.
- `src/lib/admin/demoData.ts` : jeu de données initial déterministe.
- `src/lib/admin/repository.ts` : lecture, écriture, réinitialisation et latence simulée.
- `src/context/AdminDemoContext.tsx` : état React et opérations consommées par les pages.
- `src/components/admin/ui/*` : primitives du dashboard.
- `src/components/admin/AdminSidebar.tsx` : navigation desktop.
- `src/components/admin/AdminTopbar.tsx` : recherche, notifications et profil.
- `src/components/admin/AdminShell.tsx` : composition responsive du back-office.
- `src/app/[locale]/(dashboard)/layout.tsx` : branchement du shell et du provider.
- `src/app/[locale]/(auth)/connexion/page.tsx` : page de connexion fidèle aux maquettes.
- `src/app/[locale]/(dashboard)/dashboard/page.tsx` : vue d'ensemble premium.
- `public/image/reign-admin-hoodie.webp` : visuel éditorial original de connexion.

---

### Task 1: Restore the verification baseline

**Files:**
- Modify: `src/app/[locale]/(dashboard)/parametres/page.tsx`
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Test: existing test suite

**Interfaces:**
- Consumes: scripts npm existants.
- Produces: commandes `npm run typecheck`, `npm run lint`, `npm test` et `npm run build` exploitables.

- [ ] **Step 1: Add a typecheck script and make Vitest load predictably**

Ajouter à `package.json` :

```json
"typecheck": "tsc --noEmit"
```

Passer la configuration Vitest à un chargement ESM compatible, soit en renommant `vitest.config.ts` en `vitest.config.mts`, soit en ajoutant la configuration de chargeur explicitement supportée par la version installée.

- [ ] **Step 2: Reproduce the current TypeScript failure**

Run: `npm.cmd run build`

Expected: FAIL sur `RotateCcw` non défini dans `parametres/page.tsx`.

- [ ] **Step 3: Fix the root cause minimally**

Ajouter `RotateCcw` à l'import `lucide-react` déjà présent dans `parametres/page.tsx`, sans refactorisation annexe.

- [ ] **Step 4: Run the complete baseline**

Run: `npm.cmd run typecheck`

Expected: PASS.

Run: `npm.cmd run lint`

Expected: PASS sans erreur.

Run: `npm.cmd test`

Expected: tous les tests terminent et passent.

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.* src/app/[locale]/(dashboard)/parametres/page.tsx
git commit -m "fix: restore dashboard verification baseline"
```

### Task 2: Define premium admin tokens and UI primitives

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/admin/ui/AdminButton.tsx`
- Create: `src/components/admin/ui/StatusBadge.tsx`
- Create: `src/components/admin/ui/MetricCard.tsx`
- Create: `src/components/admin/ui/AdminCard.tsx`
- Create: `src/components/admin/ui/Skeleton.tsx`
- Create: `src/components/admin/ui/EmptyState.tsx`
- Test: `src/components/admin/ui/AdminPrimitives.test.tsx`

**Interfaces:**
- Consumes: Lucide icons passed as `React.ComponentType<{ className?: string }>`.
- Produces: `AdminButton`, `StatusBadge`, `MetricCard`, `AdminCard`, `Skeleton`, `EmptyState`.

- [ ] **Step 1: Write failing primitive tests**

```tsx
it('renders a loading button accessibly', () => {
  render(<AdminButton loading>Enregistrer</AdminButton>);
  expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
  expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
});

it('renders a semantic status label', () => {
  render(<StatusBadge tone="success">Payée</StatusBadge>);
  expect(screen.getByText('Payée')).toHaveAttribute('data-tone', 'success');
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm.cmd test -- src/components/admin/ui/AdminPrimitives.test.tsx`

Expected: FAIL car les composants n'existent pas.

- [ ] **Step 3: Implement tokens and primitives**

Définir dans `@theme inline` les couleurs `admin-*`, les ombres, rayons et durées. Les composants exposent des variantes typées limitées :

```ts
type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
```

Chaque bouton accepte `loading`, `icon`, `iconPosition` et toutes les propriétés natives de `button`.

- [ ] **Step 4: Verify primitives**

Run: `npm.cmd test -- src/components/admin/ui/AdminPrimitives.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/admin/ui
git commit -m "feat: add premium admin design primitives"
```

### Task 3: Add the typed persistent demo repository

**Files:**
- Create: `src/lib/admin/types.ts`
- Create: `src/lib/admin/demoData.ts`
- Create: `src/lib/admin/repository.ts`
- Create: `src/lib/admin/repository.test.ts`
- Create: `src/context/AdminDemoContext.tsx`
- Create: `src/context/AdminDemoContext.test.tsx`

**Interfaces:**
- Consumes: browser `localStorage` when available.
- Produces: `AdminDemoState`, `AdminPreferences`, `DashboardMetric`, `RecentOrder`, `StockAlert`, `loadAdminDemoState()`, `saveAdminDemoState(state)`, `resetAdminDemoState()` and `useAdminDemo()`.

- [ ] **Step 1: Write repository persistence tests**

```ts
it('returns deterministic seed data when storage is empty', () => {
  expect(loadAdminDemoState().metrics).toHaveLength(4);
});

it('persists dashboard preferences', () => {
  const state = loadAdminDemoState();
  saveAdminDemoState({ ...state, preferences: { ...state.preferences, period: '7d' } });
  expect(loadAdminDemoState().preferences.period).toBe('7d');
});
```

- [ ] **Step 2: Verify repository tests fail**

Run: `npm.cmd test -- src/lib/admin/repository.test.ts`

Expected: FAIL car le repository n'existe pas.

- [ ] **Step 3: Implement contracts and repository**

```ts
export type DashboardPeriod = '7d' | '30d' | '90d';
export interface AdminPreferences { period: DashboardPeriod; sidebarCollapsed: boolean; }
export interface AdminDemoState {
  version: 1;
  preferences: AdminPreferences;
  metrics: DashboardMetric[];
  recentOrders: RecentOrder[];
  stockAlerts: StockAlert[];
}
```

Utiliser la clé `reign:admin-demo:v1`, valider la version lue et revenir au seed si le JSON est invalide.

- [ ] **Step 4: Add and test the provider**

Le provider expose :

```ts
interface AdminDemoContextValue {
  state: AdminDemoState;
  ready: boolean;
  setPeriod(period: DashboardPeriod): void;
  setSidebarCollapsed(collapsed: boolean): void;
  reset(): void;
}
```

Run: `npm.cmd test -- src/lib/admin/repository.test.ts src/context/AdminDemoContext.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin src/context/AdminDemoContext.tsx src/context/AdminDemoContext.test.tsx
git commit -m "feat: add persistent admin demo repository"
```

### Task 4: Rebuild the responsive admin shell

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminTopbar.tsx`
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/components/admin/AdminShell.test.tsx`
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `useAdminDemo()` preferences and next-intl locale navigation.
- Produces: `AdminShell({ children, title })`, responsive sidebar, topbar and mobile drawer.

- [ ] **Step 1: Write failing shell interaction tests**

```tsx
it('opens and closes the mobile navigation', async () => {
  render(<AdminShell title="Vue d'ensemble"><div>Contenu</div></AdminShell>);
  await user.click(screen.getByRole('button', { name: /ouvrir la navigation/i }));
  expect(screen.getByRole('dialog', { name: /navigation/i })).toBeVisible();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: /navigation/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm.cmd test -- src/components/admin/AdminShell.test.tsx`

Expected: FAIL car `AdminShell` n'existe pas.

- [ ] **Step 3: Implement the shell**

La sidebar reprend exactement les entrées des maquettes avec icônes Lucide. Le drawer mobile utilise `role="dialog"`, `aria-modal="true"`, fermeture par Escape et restitution du focus. La topbar contient fil d'Ariane, recherche, cloche et profil.

- [ ] **Step 4: Connect the dashboard layout**

Envelopper la branche dashboard avec `AdminDemoProvider` puis `AdminShell`. Supprimer de `layout.tsx` la logique dupliquée de sidebar et de titre.

- [ ] **Step 5: Verify and commit**

Run: `npm.cmd test -- src/components/admin/AdminShell.test.tsx`

Expected: PASS.

```bash
git add src/components/admin src/app/[locale]/(dashboard)/layout.tsx
git commit -m "feat: rebuild responsive admin shell"
```

### Task 5: Create the original hoodie hero asset

**Files:**
- Create: `public/image/reign-admin-hoodie.webp`
- Test: visual inspection at desktop and mobile crops

**Interfaces:**
- Consumes: approved visual reference.
- Produces: a text-free 16:10 editorial image suitable for `next/image` with `object-cover`.

- [ ] **Step 1: Generate the original image**

Utiliser ImageGen avec ce brief : hoodie noir bouclé suspendu à un cintre bois sombre gravé subtilement REIGN, portant métallique noir, photographie éditoriale monochrome très sombre, lumière latérale douce, texture détaillée, fond noir, cadrage vertical compatible avec un recadrage desktop 50/50 et mobile hero, aucun texte ajouté à l'image, aucun mannequin, aucune autre marque.

- [ ] **Step 2: Inspect the asset**

Vérifier l'absence de texte parasite, de mains, de mannequin, de déformation du cintre et d'artefacts dans le vêtement.

- [ ] **Step 3: Verify responsive crops**

Tester `object-position` sur une zone desktop 50% de largeur et une zone mobile 360 × 300. Le cintre et le hoodie doivent rester lisibles ; l'espace négatif gauche doit accueillir la marque et l'accroche.

- [ ] **Step 4: Commit**

```bash
git add public/image/reign-admin-hoodie.webp
git commit -m "feat: add Reign administration hero artwork"
```

### Task 6: Rebuild the premium login page

**Files:**
- Modify: `src/app/[locale]/(auth)/connexion/page.tsx`
- Create: `src/app/[locale]/(auth)/connexion/page.test.tsx`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `/image/reign-admin-hoodie.webp`, locale navigation and SVG icons.
- Produces: responsive login UI with locally simulated state only.

- [ ] **Step 1: Write failing behavior tests**

```tsx
it('shows validation without starting a submission', async () => {
  render(<ConnexionPage />);
  await user.click(screen.getByRole('button', { name: /se connecter/i }));
  expect(screen.getByText(/renseigner/i)).toBeVisible();
});

it('toggles password visibility', async () => {
  render(<ConnexionPage />);
  const password = screen.getByLabelText(/mot de passe/i);
  await user.click(screen.getByRole('button', { name: /afficher le mot de passe/i }));
  expect(password).toHaveAttribute('type', 'text');
});
```

- [ ] **Step 2: Verify tests fail against missing accessibility contracts**

Run: `npm.cmd test -- src/app/[locale]/(auth)/connexion/page.test.tsx`

Expected: FAIL sur les libellés ou comportements attendus.

- [ ] **Step 3: Implement the pixel-faithful page**

Reproduire les compositions desktop et mobile approuvées. Tous les textes passent par `next-intl`. Le formulaire expose les états idle, validation, loading et erreur. Les liens confidentialité et sécurité ciblent les pages locales existantes.

- [ ] **Step 4: Verify login behavior**

Run: `npm.cmd test -- src/app/[locale]/(auth)/connexion/page.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(auth)/connexion messages/fr.json messages/en.json
git commit -m "feat: rebuild premium administration login"
```

### Task 7: Rebuild the premium dashboard overview

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/page.tsx`
- Modify: `src/components/admin/SalesChart.tsx`
- Modify: `src/components/admin/CategoryDistributionChart.tsx`
- Create: `src/components/admin/DashboardOverview.test.tsx`

**Interfaces:**
- Consumes: `useAdminDemo()`, admin primitives and chart components.
- Produces: pixel-faithful overview with period switching and responsive layout.

- [ ] **Step 1: Write failing dashboard tests**

```tsx
it('renders every premium dashboard region', () => {
  render(<DashboardPage />);
  expect(screen.getByText(/chiffre d'affaires/i)).toBeVisible();
  expect(screen.getByText(/ventes/i)).toBeVisible();
  expect(screen.getByText(/commandes récentes/i)).toBeVisible();
  expect(screen.getByText(/alertes stock/i)).toBeVisible();
  expect(screen.getByText(/actions rapides/i)).toBeVisible();
});

it('persists the selected period', async () => {
  render(<DashboardPage />);
  await user.selectOptions(screen.getByLabelText(/période/i), '7d');
  expect(loadAdminDemoState().preferences.period).toBe('7d');
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm.cmd test -- src/components/admin/DashboardOverview.test.tsx`

Expected: FAIL sur la structure ou la persistance manquante.

- [ ] **Step 3: Implement the desktop reference**

Créer les quatre métriques, le graphique, le donut, les commandes récentes, les alertes et les actions rapides avec les dimensions, densités et statuts des maquettes. Employer uniquement des icônes SVG Lucide.

- [ ] **Step 4: Implement responsive behavior**

Passer les métriques en grille 2 × 2 sur tablette et en pile sur petit mobile. Les tableaux deviennent des cartes compactes sous 640 px. Les graphiques gardent une hauteur minimale de 280 px et des légendes lisibles.

- [ ] **Step 5: Verify and commit**

Run: `npm.cmd test -- src/components/admin/DashboardOverview.test.tsx`

Expected: PASS.

```bash
git add src/app/[locale]/(dashboard)/dashboard/page.tsx src/components/admin
git commit -m "feat: rebuild premium dashboard overview"
```

### Task 8: Visual, responsive and production verification

**Files:**
- Modify only defects proven by the checks below.
- Test: full suite and manual/browser visual matrix.

**Interfaces:**
- Consumes: completed login and overview.
- Produces: verified frontend demonstration at `/fr/connexion` and `/fr/dashboard`.

- [ ] **Step 1: Run automated verification**

Run: `npm.cmd run typecheck`

Expected: PASS.

Run: `npm.cmd run lint`

Expected: PASS.

Run: `npm.cmd test`

Expected: all tests PASS.

Run: `npm.cmd run build`

Expected: production build PASS.

- [ ] **Step 2: Compare the desktop pages**

Capturer `/fr/connexion` et `/fr/dashboard` à 1600 × 1000. Comparer la composition, les proportions, la typographie, les bordures, les espacements, les couleurs, les icônes et les états aux maquettes fournies.

- [ ] **Step 3: Verify tablet and mobile**

Tester 1024 × 768, 768 × 1024, 390 × 844 et 360 × 800. Vérifier absence de débordement involontaire, navigation au clavier, drawer, cartes, graphiques, formulaire et cibles tactiles.

- [ ] **Step 4: Verify interactions and persistence**

Changer la période, réduire la sidebar, actualiser la page et confirmer que les préférences sont conservées. Tester le formulaire de connexion avec champs vides, mot de passe visible et soumission simulée.

- [ ] **Step 5: Commit verified corrections**

```bash
git add src public messages package.json vitest.config.*
git commit -m "test: verify premium dashboard foundation"
```

---

## Follow-up Plans

Après cette livraison visible et testable, rédiger puis exécuter séparément :

1. `reign-dashboard-products-frontend` : catalogue administratif et éditeur produit complet.
2. `reign-dashboard-commerce-frontend` : commandes, retours et clients.
3. `reign-dashboard-communications-settings-frontend` : messagerie, paramètres et intégration finale.
