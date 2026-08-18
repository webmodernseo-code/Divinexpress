# DivinExpress Premium Storefront Foundation & Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Installer le langage visuel hybride premium sur les fondations publiques, le header, le footer et toute la page d’accueil, sans toucher au dashboard ni aux contrats métier.

**Architecture:** La vague crée des tokens et primitives réutilisables, puis modernise le cadre global et les sections d’accueil par composants indépendants. Données, traductions, contextes et routes restent inchangés ; les tests ciblent les contrats accessibles et les marqueurs structurels.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Tailwind CSS v4, next-intl, Vitest 4, Testing Library.

**Spec:** \`docs/superpowers/specs/2026-08-18-divinexpress-premium-storefront-design.md\`

## Global Constraints

- Boutique publique uniquement : aucun fichier sous \`src/app/[locale]/(dashboard)\` ou \`src/components/admin\`.
- Inspecter \`git diff -- <file>\` avant d’éditer un fichier déjà modifié et préserver les changements locaux.
- Conserver FR/EN, EUR/GBP, panier, favoris, checkout, catalogue, promotions et paramètres d’URL.
- Une seule couleur signature contrôlée ; surfaces et textes essentiels restent neutres.
- Aucune dépendance UI/animation supplémentaire.
- Respecter \`prefers-reduced-motion\` ; aucun contenu ne dépend d’une animation.
- Toute nouvelle copie visible reçoit la même clé dans \`messages/fr.json\` et \`messages/en.json\`.
- Ne pas inventer de liens sociaux, données légales, remise ou urgence commerciale.
- Consulter les guides locaux \`node_modules/next/dist/docs/\` avant toute modification d’API Next.js.
- Sous Windows, utiliser \`--no-file-parallelism\` si Vitest devient instable.

## File Map

- \`src/app/globals.css\` — tokens publics, surfaces, mouvement réduit.
- \`src/components/ui/{Button,Container,Heading,Accordion}.tsx\` — primitives publiques.
- \`src/components/layout/{Header,Footer}.tsx\` — cadre global.
- \`src/components/home/*.tsx\` — composition de l’accueil.
- \`src/components/product/ProductCard.tsx\` — carte produit partagée.
- Tests colocalisés et \`src/test/premium-homepage.test.ts\` — contrats et composition.

---

### Task 1: Premium Public Design Tokens and Primitives

**Files:**
- Modify: \`src/app/globals.css\`
- Modify: \`src/components/ui/Button.tsx\`
- Modify: \`src/components/ui/Container.tsx\`
- Modify: \`src/components/ui/Heading.tsx\`
- Modify: \`src/components/ui/Button.test.ts\`
- Create: \`src/components/ui/Heading.test.tsx\`
- Create: \`src/test/storefront-design-system.test.ts\`

**Interfaces:**
- Consumes: Tailwind v4 \`@theme inline\`, font variables existantes.
- Produces: \`buttonClassName(variant: 'primary' | 'secondary' | 'ghost'): string\`, \`Heading\` avec \`eyebrow?: string\`, utilitaires CSS \`.storefront-section\`, \`.storefront-section-soft\`, \`.storefront-section-dark\`, \`.storefront-reveal\`.

- [ ] **Step 1: Write failing tests**

Ajouter à \`Button.test.ts\` :

~~~ts
it('provides a restrained ghost action', () => {
  const classes = buttonClassName('ghost');
  expect(classes).toContain('text-ink');
  expect(classes).toContain('hover:bg-mist-50');
});
~~~

Créer \`Heading.test.tsx\` :

~~~tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Heading } from './Heading';

describe('Heading', () => {
  it('renders an eyebrow and requested semantic level', () => {
    render(<Heading level={2} eyebrow="La sélection">Nouveautés</Heading>);
    expect(screen.getByText('La sélection')).toHaveClass('uppercase');
    expect(screen.getByRole('heading', { level: 2, name: 'Nouveautés' })).toBeInTheDocument();
  });
});
~~~

Créer \`storefront-design-system.test.ts\` :

~~~ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('premium storefront design system', () => {
  it('defines neutral surfaces and one signature accent', () => {
    for (const token of ['--color-storefront-canvas:', '--color-storefront-soft:', '--color-storefront-charcoal:', '--color-storefront-signature:']) {
      expect(css).toContain(token);
    }
  });

  it('settles reveals under reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toMatch(/\.storefront-reveal[\s\S]*animation:\s*none/);
  });
});
~~~

- [ ] **Step 2: Verify RED**

Run:

~~~powershell
npm.cmd test -- src/components/ui/Button.test.ts src/components/ui/Heading.test.tsx src/test/storefront-design-system.test.ts --no-file-parallelism
~~~

Expected: FAIL because \`ghost\`, \`eyebrow\` and storefront tokens do not exist.

- [ ] **Step 3: Implement primitives**

Add exact tokens:

~~~css
--color-storefront-canvas: #fbfaf7;
--color-storefront-soft: #f3f0ea;
--color-storefront-charcoal: #151515;
--color-storefront-line: #ded9d0;
--color-storefront-signature: #7a6246;
~~~

Add section/reveal utilities and a reduced-motion media query that sets \`.storefront-reveal { animation: none; opacity: 1; transform: none; }\`. Extend buttons with a rounded 44px-minimum \`ghost\` variant. Change \`Container\` to \`max-w-[90rem] xl:px-12\`. Render an optional eyebrow before \`Heading\` using \`text-xs font-semibold uppercase tracking-[0.22em] text-storefront-signature\`.

- [ ] **Step 4: Verify GREEN and types**

~~~powershell
npm.cmd test -- src/components/ui/Button.test.ts src/components/ui/Heading.test.tsx src/test/storefront-design-system.test.ts --no-file-parallelism
npm.cmd run typecheck
~~~

Expected: focused tests PASS and no new TypeScript error.

- [ ] **Step 5: Commit**

~~~powershell
git add src/app/globals.css src/components/ui/Button.tsx src/components/ui/Container.tsx src/components/ui/Heading.tsx src/components/ui/Button.test.ts src/components/ui/Heading.test.tsx src/test/storefront-design-system.test.ts
git commit -m "feat(storefront): add premium public design system"
~~~

---

### Task 2: Premium Header and Navigation

**Files:**
- Modify: \`src/components/layout/Header.tsx\`
- Modify: \`src/components/ui/Logo.tsx\`
- Create: \`src/components/layout/Header.test.tsx\`
- Modify only if needed: \`messages/fr.json\`, \`messages/en.json\`

**Interfaces:**
- Consumes: categories, subcategories, cart/favorites contexts, localized navigation and switchers.
- Produces: unchanged \`Header()\` and \`Logo()\` exports.

- [ ] **Step 1: Write failing accessibility tests**

With existing context/navigation mocks:

~~~tsx
it('opens a labelled category menu', async () => {
  const user = userEvent.setup();
  render(<Header />);
  const homme = screen.getByRole('button', { name: /homme/i });
  expect(homme).toHaveAttribute('aria-expanded', 'false');
  await user.click(homme);
  expect(homme).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('menu', { name: /homme/i })).toBeInTheDocument();
});

it('labels mobile navigation as a dialog', async () => {
  const user = userEvent.setup();
  render(<Header />);
  await user.click(screen.getByRole('button', { name: /menu/i }));
  expect(screen.getByRole('dialog', { name: /navigation/i })).toBeInTheDocument();
});
~~~

- [ ] **Step 2: Verify RED**

~~~powershell
npm.cmd test -- src/components/layout/Header.test.tsx --no-file-parallelism
~~~

Expected: FAIL on absent menu/dialog semantics.

- [ ] **Step 3: Implement**

Keep handlers and URLs. Apply: charcoal utility bar; warm translucent main row with fine border; logo \`h-9 md:h-11\`; lighter navigation weight; category popup \`role="menu"\` and localized label; mobile panel \`role="dialog" aria-modal="true"\`; 44px icon targets; signature used only for badges/active state; warm search panel with retained submit behavior. Add a bilingual navigation label only if no existing key fits.

- [ ] **Step 4: Verify**

~~~powershell
npm.cmd test -- src/components/layout/Header.test.tsx src/context/CartDrawerContext.test.tsx src/context/CartContext.test.tsx src/context/FavoritesContext.test.tsx --no-file-parallelism
~~~

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add src/components/layout/Header.tsx src/components/layout/Header.test.tsx src/components/ui/Logo.tsx messages/fr.json messages/en.json
git commit -m "feat(storefront): refine premium navigation shell"
~~~

---

### Task 3: Premium Footer and Trust Layer

**Files:**
- Modify: \`src/components/layout/Footer.tsx\`
- Modify: \`src/components/layout/Footer.test.tsx\`
- Modify: \`messages/fr.json\`
- Modify: \`messages/en.json\`

**Interfaces:**
- Consumes: footer route groups, payment assets, social definitions and regional switchers.
- Produces: unchanged \`Footer()\` with accessible mobile accordions.

- [ ] **Step 1: Update stale test and add failing hierarchy test**

~~~tsx
it('uses the DivinExpress asset and labels secure payments', () => {
  render(<Footer />);
  expect(screen.getByAltText('DivinExpress')).toHaveAttribute('src', '/branding/logo-divinexpress.png');
  expect(screen.getByText('Paiements sécurisés')).toBeInTheDocument();
});

it('shows the brand promise before navigation', () => {
  render(<Footer />);
  expect(screen.getByText('Vêtements et accessoires choisis pour durer.')).toBeVisible();
});
~~~

- [ ] **Step 2: Verify RED**

~~~powershell
npm.cmd test -- src/components/layout/Footer.test.tsx --no-file-parallelism
~~~

Expected: FAIL until brand promise and layout are updated.

- [ ] **Step 3: Implement**

Use a charcoal main surface and quieter payment/legal strip. Desktop: wider brand column + three link columns + bottom trust row. Mobile: logo/promise, accordions, payments, locale/currency. Preserve all routes. Fake social \`href="#"\` entries become non-clickable labelled icons or disappear. Individual payment images retain \`alt=""\`. Add \`footer.brandPromise\`: FR \`Vêtements et accessoires choisis pour durer.\`; EN \`Clothing and accessories selected to last.\`.

- [ ] **Step 4: Verify**

~~~powershell
npm.cmd test -- src/components/layout/Footer.test.tsx --no-file-parallelism
~~~

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx messages/fr.json messages/en.json
git commit -m "feat(storefront): redesign premium footer"
~~~

---

### Task 4: Immersive Accessible Hero

**Files:**
- Modify: \`src/components/home/HeroCarousel.tsx\`
- Create: \`src/components/home/HeroCarousel.test.tsx\`

**Interfaces:**
- Consumes: existing slide, CTA and feature props from the locale home page.
- Produces: same props plus accessible region, controls and pause behavior.

- [ ] **Step 1: Write failing tests**

~~~tsx
it('exposes carousel semantics and named controls', () => {
  render(<HeroCarousel {...heroProps} />);
  const region = screen.getByRole('region', { name: /sélection divinexpress/i });
  expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  expect(screen.getByRole('button', { name: /précédent/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument();
  expect(screen.getByText('1 / 3')).toHaveAttribute('aria-live', 'polite');
});
~~~

Add a fake-timer test: focus the region, advance 8 seconds, and assert the counter remains \`1 / 3\`.

- [ ] **Step 2: Verify RED**

~~~powershell
npm.cmd test -- src/components/home/HeroCarousel.test.tsx --no-file-parallelism
~~~

Expected: FAIL on missing region/live counter/control contracts.

- [ ] **Step 3: Implement**

Keep slide assets/data. Use \`min-h-[70svh]\`, neutral image overlay, restrained watermark, capped copy width, one dominant/one secondary CTA and integrated trust strip. Add named previous/next controls, dots, live counter and pause on hover/focus. Detect reduced motion to disable autorotation and image transitions.

- [ ] **Step 4: Verify**

~~~powershell
npm.cmd test -- src/components/home/HeroCarousel.test.tsx src/lib/seo.test.ts --no-file-parallelism
~~~

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add src/components/home/HeroCarousel.tsx src/components/home/HeroCarousel.test.tsx
git commit -m "feat(storefront): build immersive premium hero"
~~~

---

### Task 5: Editorial Collections and Product Cards

**Files:**
- Modify: \`src/components/home/HomeCollection.tsx\`
- Modify: \`src/components/home/NewArrivalsCarousel.tsx\`
- Modify: \`src/components/product/ProductCard.tsx\`
- Create: \`src/components/home/HomeCollection.test.tsx\`
- Create: \`src/components/home/NewArrivalsCarousel.test.tsx\`
- Create or modify: \`src/components/product/ProductCard.test.tsx\`

**Interfaces:**
- Consumes: current product type, category filter props, currency/favorites/cart contexts.
- Produces: unchanged public props/actions.

- [ ] **Step 1: Write failing contracts**

~~~tsx
it('labels the collection and exposes active filter state', () => {
  render(<HomeCollection products={products} initialCategory={null} initialSubcategory={null} />);
  expect(screen.getByRole('region', { name: /collection/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /tout voir/i })).toHaveAttribute('aria-pressed', 'true');
});

it('labels the arrivals carousel and its scroll controls', () => {
  render(<NewArrivalsCarousel title="Nouveautés" subtitle="La sélection" products={products} />);
  expect(screen.getByRole('region', { name: 'Nouveautés' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /droite/i })).toBeInTheDocument();
});
~~~

In ProductCard test, assert one product-name link and a labelled 44px favorite action.

- [ ] **Step 2: Verify RED**

~~~powershell
npm.cmd test -- src/components/home/HomeCollection.test.tsx src/components/home/NewArrivalsCarousel.test.tsx src/components/product/ProductCard.test.tsx --no-file-parallelism
~~~

Expected: FAIL on missing region, pressed state or control names.

- [ ] **Step 3: Implement**

Collection uses \`.storefront-section\`, labelled region, editorial intro, compact filters with \`aria-pressed\` and stable grid. Product card becomes image-first on a warm surface, with one semantic destination link, restrained badges/price, always-accessible favorite action and hover effects limited to hover-capable devices. Arrivals use one contrasting editorial surface, labelled scroll-snap region, named controls and a partially visible next card on mobile. Preserve all filtering and commerce behavior.

- [ ] **Step 4: Verify**

~~~powershell
npm.cmd test -- src/components/home/HomeCollection.test.tsx src/components/home/NewArrivalsCarousel.test.tsx src/components/product/ProductCard.test.tsx src/context/CurrencyContext.test.tsx src/context/FavoritesContext.test.tsx --no-file-parallelism
~~~

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add src/components/home/HomeCollection.tsx src/components/home/HomeCollection.test.tsx src/components/home/NewArrivalsCarousel.tsx src/components/home/NewArrivalsCarousel.test.tsx src/components/product/ProductCard.tsx src/components/product/ProductCard.test.tsx
git commit -m "feat(storefront): elevate home merchandising"
~~~

---

### Task 6: Truthful Promotion and Premium FAQ

**Files:**
- Modify: \`src/components/home/PromoBanner.tsx\`
- Modify: \`src/components/home/HomeFaq.tsx\`
- Modify: \`src/components/ui/Accordion.tsx\`
- Create: corresponding \`*.test.tsx\` files.

**Interfaces:**
- Consumes: active promotion result and localized FAQ items.
- Produces: truthful promotional section and unchanged \`AccordionItem/defaultOpenIndex\` API.

- [ ] **Step 1: Write failing tests**

Promotion tests assert inactive result renders nothing, active result shows exact code \`DIVINEXPRESS10\`, and copy control has a localized accessible name. Accordion test asserts panels remain mounted with \`hidden\`, \`aria-controls\`, and toggle after click. HomeFaq test asserts a labelled FAQ region and one level-2 heading.

- [ ] **Step 2: Verify RED**

~~~powershell
npm.cmd test -- src/components/home/PromoBanner.test.tsx src/components/home/HomeFaq.test.tsx src/components/ui/Accordion.test.tsx --no-file-parallelism
~~~

Expected: at least one FAIL on new section/copy contracts.

- [ ] **Step 3: Implement**

Keep active-code server behavior and \`return null\` when inactive. Use one dark full-bleed editorial image, real percentage/code, and copy button with idle/success/failure labels; no countdown. Make FAQ a split editorial layout on desktop and stacked layout on mobile. Preserve mounted accordion panels and one-open behavior; style active state with one signature detail.

- [ ] **Step 4: Verify**

Locate the exact promotion repository test with \`rg --files src | rg "promotion.*test"\`, then run it with the three component tests. Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add src/components/home/PromoBanner.tsx src/components/home/PromoBanner.test.tsx src/components/home/HomeFaq.tsx src/components/home/HomeFaq.test.tsx src/components/ui/Accordion.tsx src/components/ui/Accordion.test.tsx
git commit -m "feat(storefront): polish promotion and faq"
~~~

---

### Task 7: Composition and Release Gate

**Files:**
- Modify only if required: \`src/app/[locale]/page.tsx\`
- Create: \`src/test/premium-homepage.test.ts\`
- Create: \`docs/audits/2026-08-18-premium-storefront-wave-1.md\`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: verified premium shell/home and audit record for later waves.

- [ ] **Step 1: Write composition test**

~~~ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/app/[locale]/page.tsx', 'utf8');

describe('premium homepage composition', () => {
  it('keeps the approved narrative order', () => {
    const tags = ['<HeroCarousel', '<HomeCollection', '<PromoBanner', '<HomeFaq', '<NewArrivalsCarousel'];
    const positions = tags.map((tag) => source.indexOf(tag));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
~~~

- [ ] **Step 2: Run all wave tests**

Run the composition test plus every test created/modified in Tasks 1–6 with \`--no-file-parallelism\`. Expected: PASS.

- [ ] **Step 3: Visual matrix**

Run \`npm.cmd run dev -- -p 3210\`. Check \`/fr\` and \`/en\` at 375×812, 768×1024, 1440×900 and 1920×1080. Verify header/menu/search, all hero slides, filters/product actions, carousel overflow, active/inactive promotion, FAQ keyboard behavior, footer accordions/payments/switchers, 200% zoom, keyboard-only navigation and reduced motion.

- [ ] **Step 4: Full release gate**

Stop dev before build, then:

~~~powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --no-file-parallelism
npm.cmd run build
~~~

Expected: build succeeds and no new regression. Record exact pre-existing failures instead of weakening checks.

- [ ] **Step 5: Write audit**

Create the audit with headings: Scope delivered, Automated verification, Visual matrix, Accessibility checks, Preserved local changes, Pre-existing issues, Remaining storefront waves. Remaining waves must list catalogue/search/favorites; product/cart; checkout; secondary/system pages; legal/SEO production prerequisites.

- [ ] **Step 6: Commit**

~~~powershell
git add src/app/[locale]/page.tsx src/test/premium-homepage.test.ts docs/audits/2026-08-18-premium-storefront-wave-1.md
git commit -m "test(storefront): verify premium home experience"
~~~

## Follow-up Plans

After this release gate, create separate plans from the approved spec for:

1. catalogue, search and favorites;
2. product detail, cart and cart drawer;
3. checkout delivery, payment and confirmation;
4. secondary pages, system states and final production audit.

Each plan must reuse the design system and accessibility contracts from this wave instead of redefining them.

