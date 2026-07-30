# Reign — Vitrine E-commerce Front-end (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Reign e-commerce storefront front-end — bilingual (FR/EN), dual-currency (EUR/GBP), premium black/white design — as specified in `docs/superpowers/specs/2026-07-30-reign-site-vitrine-design.md`, with no real backend, payment, or authentication.

**Architecture:** Next.js 16 (App Router, TypeScript, `src/` dir) with `next-intl` for URL-prefixed i18n routing (`/fr`, `/en`). All product, cart, favorites, and currency state lives client-side (React Context + `localStorage`); product/content data lives in local TypeScript files. Per spec section 8's "design before hard-coded logic" methodology: the shared design system, product data, and state contexts are built and unit-tested first as independent foundations (Tasks 1–12), each verified in isolation before any page depends on it. Every page task from Task 13 onward then assembles its visual layout, interactivity, and data-wiring together as one reviewable vertical slice — because the underlying logic it consumes was already built and tested as its own task, no page is ever built against unverified data or state plumbing.

**Tech Stack:** Next.js 16.x, React 19.x, TypeScript, Tailwind CSS v4, next-intl v4, Vitest + React Testing Library + jsdom.

## Global Constraints

- Framework/tooling versions: use whatever `create-next-app@latest` installs at scaffold time (verified at plan-writing time: Next.js 16.2.x, React 19.2.x, Tailwind CSS 4.3.x, TypeScript 7.0.x). Do not manually downgrade.
- i18n: `next-intl` v4, locale prefix always present in the URL (`/fr/...`, `/en/...`), locales are exactly `fr` (default) and `en`. No top-level `src/app/layout.tsx` — `src/app/[locale]/layout.tsx` is the root layout (contains `<html>`/`<body>`), per next-intl's documented App Router pattern.
- Category and product URL slugs are **never translated** between locales — only the displayed text changes. Example: `/fr/homme` and `/en/homme` both work; there is no `/en/men`.
- Colors: ink `#0D0D0D`, paper `#FFFFFF`, accent (steel blue) `#3B4A5A`, gray scale from `#1A1A1A` to `#F2F2F2`. Fonts: **Fraunces** (headings/editorial) + **Inter** (body/UI), loaded via `next/font/google`. The provided brand logo image is used as-is (never recreated in CSS/text).
- Currency: fixed rate constant, 1 EUR = 0.86 GBP, isolated in `src/lib/currency.ts`. No live rate API in phase 1.
- No backend, no database, no real payment processor, no real authentication. All state is client-side Context + `localStorage`. No account/login section exists (spec section 9) — checkout is guest-only. Favorites persist client-side without requiring an account.
- All user-facing copy lives in `messages/fr.json` and `messages/en.json` (via `next-intl`) — never hardcode user-facing strings directly in component JSX.
- Test strategy: logic-bearing units (`src/lib/**`, `src/context/**`) get real Vitest unit tests, written before the implementation (TDD). Presentational pages/components are verified by running `npm run build` (type/lint check) and manually checking `npm run dev` in the browser — they do not get brittle snapshot/DOM tests for static markup. Where a page includes real logic (a filter, a form validator, a search matcher), that logic is extracted into a testable `src/lib/*` function.
- Legal page copy (mentions légales, CGV, politique de confidentialité) is realistic **template** text for a fictitious brand, explicitly marked in this plan as requiring review by a qualified professional before real-world launch — it is not vetted legal advice.
- Package manager: npm.

---

## Task list overview

1. Scaffold Next.js project + testing setup
2. Design tokens (Tailwind theme: colors, fonts)
3. i18n setup (next-intl routing/middleware/messages skeleton + locale layout)
4. Product catalog data & queries (lib/products.ts)
5. Currency utils + CurrencyContext
6. CartContext + cart calculations (lib/cart.ts)
7. FavoritesContext
8. Shared UI primitives (Container, Heading, Button, PlaceholderBlock)
9. Brand logo asset + Logo component
10. Header (nav, logo, language/currency switchers, cart/favorites counts)
11. Footer + cookie consent banner
12. Cart drawer
13. Home page
14. Category listing page (PLP) + filters, 4 categories
15. Product detail page (PDP)
16. Search results page
17. Favorites page
18. Cart page
19. Checkout — Shipping page
20. Checkout — Payment page (mock)
21. Checkout — Confirmation page
22. About page
23. Contact page
24. FAQ / Help page
25. Shipping & Returns page
26. Size guide page + modal
27. Legal pages x3 (mentions legales, CGV, confidentialite)
28. 404 page
29. SEO foundations (metadata, hreflang, JSON-LD, sitemap, robots)
30. Final QA pass

---

### Task 1: Scaffold Next.js project + testing setup

**Files:**
- Create: whole project via CLI (`package.json`, `next.config.ts`, `tsconfig.json`, `src/app/globals.css`, eslint config, etc.)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (add `test` / `test:watch` scripts)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a runnable Next.js dev server (`npm run dev`), a working build (`npm run build`), and a working Vitest runner (`npm run test`) that all later tasks build on.

- [ ] **Step 1: Scaffold the project**

Run from the repository root (it already contains `.git`, `.gitignore`, `docs/`, `claude skills/` — none of these conflict with `create-next-app`):

```bash
yes | npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

If the installed `create-next-app` rejects a flag (CLI flags occasionally change), run `npx create-next-app@latest --help` to see the current flag names and re-run with the equivalent options — the intent is: TypeScript, Tailwind CSS, ESLint, App Router, `src/` directory, `@/*` import alias.

- [ ] **Step 2: Verify the scaffold builds and runs**

Run: `npm run build`
Expected: build completes successfully (default Next.js starter page).

- [ ] **Step 3: Install testing dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 4: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

- [ ] **Step 5: Create the test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Add test scripts to package.json**

Modify `package.json` `scripts` section to add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify the test runner works**

Run: `npm run test`
Expected: Vitest starts, reports no test files found yet, and exits without a configuration error. This confirms the harness is wired correctly before any real tests are written in Task 4 onward.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, TypeScript, and Vitest"
```

---

### Task 2: Design tokens (Tailwind theme: colors, fonts)

**Files:**
- Create: `src/lib/fonts.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing beyond the scaffold from Task 1.
- Produces: Tailwind utility classes `bg-ink`, `text-ink`, `bg-paper`, `text-paper`, `bg-accent`, `text-accent`, `bg-mist-{50,100,...,900}`, plus CSS variables `--font-serif` / `--font-sans` and the `fraunces` / `inter` exports from `src/lib/fonts.ts` for use in `next/font` `className`/`variable` props.

- [ ] **Step 1: Define font loaders**

Create `src/lib/fonts.ts`:

```ts
import { Fraunces, Inter } from 'next/font/google';

// Note: these variable names are NOT `--font-serif`/`--font-sans` on purpose —
// they get mapped to those Tailwind theme tokens in globals.css, and reusing
// the same name on both sides would create an invalid circular CSS variable.
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--reign-font-serif',
  display: 'swap'
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--reign-font-sans',
  display: 'swap'
});
```

- [ ] **Step 2: Define the color/theme tokens in globals.css**

Modify `src/app/globals.css` — replace its contents with:

```css
@import "tailwindcss";

@theme inline {
  --color-ink: #0d0d0d;
  --color-paper: #ffffff;
  --color-accent: #3b4a5a;

  --color-mist-50: #f2f2f2;
  --color-mist-100: #e6e6e6;
  --color-mist-200: #cccccc;
  --color-mist-300: #b3b3b3;
  --color-mist-400: #999999;
  --color-mist-500: #808080;
  --color-mist-600: #666666;
  --color-mist-700: #4d4d4d;
  --color-mist-800: #333333;
  --color-mist-900: #1a1a1a;

  --font-sans: var(--reign-font-sans);
  --font-serif: var(--reign-font-serif);
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
}
```

This makes `bg-ink`, `text-ink`, `bg-paper`, `text-paper`, `bg-accent`, `text-accent`, `border-accent`, `bg-mist-50`...`bg-mist-900`, `font-sans`, and `font-serif` available as Tailwind utilities (Tailwind CSS v4 generates utilities directly from `@theme` tokens — no `tailwind.config.ts` entry needed for these).

- [ ] **Step 3: Verify the tokens compile**

Run: `npm run build`
Expected: build succeeds with no Tailwind/CSS errors. (There is no dedicated unit test for CSS tokens — this is a presentational/config concern verified by the build, per the Global Constraints test strategy.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/fonts.ts src/app/globals.css
git commit -m "feat: add Reign color and typography design tokens"
```

---

### Task 3: i18n setup (next-intl routing/middleware/messages + locale layout)

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Create: `messages/fr.json`
- Create: `messages/en.json`
- Create: `src/app/[locale]/layout.tsx`
- Modify: `next.config.ts`
- Delete: `src/app/page.tsx`, `src/app/layout.tsx` (the default scaffold ones — replaced by the locale-aware versions)

**Interfaces:**
- Consumes: `fraunces` / `inter` from `src/lib/fonts.ts` (Task 2).
- Produces: `routing` (locales `['fr','en']`, default `fr`) and `{ Link, redirect, usePathname, useRouter, getPathname }` from `src/i18n/navigation.ts` — every later page/component that needs locale-aware links or the current locale imports from here, not from `next/navigation` directly (except for reading `searchParams`, which is locale-agnostic). `src/app/[locale]/layout.tsx` renders `<html>`/`<body>` and will be extended by later tasks (5, 6, 7, 10, 11) to add providers, Header, and Footer.

- [ ] **Step 1: Install next-intl**

Run: `npm install next-intl`

- [ ] **Step 2: Define the routing config**

Create `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr'
});
```

- [ ] **Step 3: Define locale-aware navigation helpers**

Create `src/i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Step 4: Define the request config (loads messages per request)**

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

- [ ] **Step 5: Wire the middleware**

Create `src/middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

- [ ] **Step 6: Wire the Next.js config plugin**

Modify `next.config.ts`:

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Create the base bilingual message files**

Create `messages/fr.json`:

```json
{
  "nav": {
    "homme": "Homme",
    "femme": "Femme",
    "enfant": "Enfant",
    "accessoires": "Accessoires",
    "search": "Rechercher",
    "cart": "Panier",
    "favorites": "Favoris"
  },
  "common": {
    "brand": "Reign"
  }
}
```

Create `messages/en.json`:

```json
{
  "nav": {
    "homme": "Men",
    "femme": "Women",
    "enfant": "Kids",
    "accessoires": "Accessories",
    "search": "Search",
    "cart": "Cart",
    "favorites": "Favorites"
  },
  "common": {
    "brand": "Reign"
  }
}
```

(Later tasks add namespaces to both files as they build each page — always in both files together, in the same step, so the two never drift out of sync.)

- [ ] **Step 8: Remove the default scaffold root page/layout**

Run: `rm src/app/page.tsx src/app/layout.tsx`

- [ ] **Step 9: Create the locale layout**

Create `src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { fraunces, inter } from '@/lib/fonts';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Reign',
  description: 'Reign — vêtements et accessoires premium.'
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

This is intentionally minimal for now — Tasks 5, 6, and 7 will each wrap `{children}` with their own Context provider, and Tasks 10/11 will add `<Header />`/`<Footer />`/`<CookieBanner />` around `<main>`.

- [ ] **Step 10: Add a temporary home placeholder so the route resolves**

Create `src/app/[locale]/page.tsx`:

```tsx
export default function HomePage() {
  return <div className="p-12 text-center">Reign — home page coming in Task 13.</div>;
}
```

(This file's real content is written in Task 13 — its only purpose right now is to prove the `[locale]` routing works end-to-end.)

- [ ] **Step 11: Verify routing works**

Run: `npm run dev`, then visit `http://localhost:3000/` — expect a redirect to `http://localhost:3000/fr` showing the placeholder text. Visit `http://localhost:3000/en` directly — expect the same placeholder (content is locale-agnostic at this stage; translation wiring is exercised for real starting Task 10's Header). Visit `http://localhost:3000/de` — expect a 404.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add next-intl i18n routing and locale layout"
```

---

### Task 4: Product catalog data & queries (lib/products.ts)

**Files:**
- Create: `src/lib/products.ts`
- Test: `src/lib/products.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by nearly every later task): `Category` type, `CATEGORIES` array, `Product` interface, `COLOR_SWATCHES` map, `PRODUCTS` array, `getProductsByCategory(category)`, `getProductBySlug(slug)`, `getProductById(id)`, `searchProducts(query, locale)`, `getRelatedProducts(product)`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/products.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getProductsByCategory,
  getProductBySlug,
  getProductById,
  searchProducts,
  getRelatedProducts,
  PRODUCTS
} from './products';

describe('getProductsByCategory', () => {
  it('returns only products in the requested category', () => {
    const results = getProductsByCategory('femme');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === 'femme')).toBe(true);
  });
});

describe('getProductBySlug', () => {
  it('finds a known product by its slug', () => {
    const product = getProductBySlug(PRODUCTS[0].slug);
    expect(product?.id).toBe(PRODUCTS[0].id);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProductBySlug('does-not-exist')).toBeUndefined();
  });
});

describe('getProductById', () => {
  it('finds a known product by its id', () => {
    const product = getProductById(PRODUCTS[0].id);
    expect(product?.slug).toBe(PRODUCTS[0].slug);
  });
});

describe('searchProducts', () => {
  it('matches on the French name', () => {
    const target = PRODUCTS[0];
    const results = searchProducts(target.name.fr.slice(0, 4), 'fr');
    expect(results.some((p) => p.id === target.id)).toBe(true);
  });

  it('matches on the English name', () => {
    const target = PRODUCTS[0];
    const results = searchProducts(target.name.en.slice(0, 4), 'en');
    expect(results.some((p) => p.id === target.id)).toBe(true);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchProducts('zzzznomatch', 'fr')).toEqual([]);
  });
});

describe('getRelatedProducts', () => {
  it('returns products referenced by relatedProductIds', () => {
    const withRelated = PRODUCTS.find((p) => (p.relatedProductIds?.length ?? 0) > 0)!;
    const related = getRelatedProducts(withRelated);
    expect(related.length).toBe(withRelated.relatedProductIds!.length);
    expect(related.every((p) => p.id !== withRelated.id)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/products.test.ts`
Expected: FAIL — `products.ts` does not exist yet.

- [ ] **Step 3: Implement the product catalog**

Create `src/lib/products.ts`:

```ts
export type Category = 'homme' | 'femme' | 'enfant' | 'accessoires';
export type Locale = 'fr' | 'en';

export const CATEGORIES: Category[] = ['homme', 'femme', 'enfant', 'accessoires'];

export interface LocalizedText {
  fr: string;
  en: string;
}

export interface Product {
  id: string;
  slug: string;
  category: Category;
  subcategory: string;
  name: LocalizedText;
  description: LocalizedText;
  priceEur: number;
  sizes: string[];
  colors: string[];
  imageCount: number;
  isNew?: boolean;
  relatedProductIds?: string[];
}

export const COLOR_SWATCHES: Record<string, string> = {
  Noir: '#0d0d0d',
  Blanc: '#ffffff',
  'Bleu acier': '#3b4a5a',
  Gris: '#808080',
  Écru: '#e6e2d8',
  Camel: '#a9744f'
};

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const KIDS_SIZES = ['4A', '6A', '8A', '10A', '12A'];

export const PRODUCTS: Product[] = [
  {
    id: 'homme-veste-oversize',
    slug: 'homme-veste-oversize',
    category: 'homme',
    subcategory: 'vestes',
    name: { fr: 'Veste oversize structurée', en: 'Structured oversized jacket' },
    description: {
      fr: "Une veste à l'épaule marquée et à la coupe ample, pensée pour une silhouette affirmée.",
      en: 'A sharp-shouldered, generously cut jacket built for a strong silhouette.'
    },
    priceEur: 320,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 4,
    isNew: true,
    relatedProductIds: ['homme-pantalon-droit', 'homme-chemise-col-mao']
  },
  {
    id: 'homme-t-shirt-essentiel',
    slug: 'homme-t-shirt-essentiel',
    category: 'homme',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt essentiel côtelé', en: 'Essential ribbed t-shirt' },
    description: {
      fr: 'Coton côtelé épais, coupe droite, pour une base solide de vestiaire.',
      en: 'Heavyweight ribbed cotton, straight cut, a solid wardrobe staple.'
    },
    priceEur: 65,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Écru'],
    imageCount: 3
  },
  {
    id: 'homme-pantalon-droit',
    slug: 'homme-pantalon-droit',
    category: 'homme',
    subcategory: 'pantalons',
    name: { fr: 'Pantalon droit taille haute', en: 'High-rise straight trousers' },
    description: {
      fr: 'Coupe droite intemporelle en twill dense, taille haute structurée.',
      en: 'Timeless straight cut in dense twill, structured high-rise waist.'
    },
    priceEur: 145,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 3,
    relatedProductIds: ['homme-veste-oversize']
  },
  {
    id: 'homme-chemise-col-mao',
    slug: 'homme-chemise-col-mao',
    category: 'homme',
    subcategory: 'chemises',
    name: { fr: 'Chemise col mao', en: 'Mandarin collar shirt' },
    description: {
      fr: 'Popeline légère, col mao épuré, boutonnage invisible.',
      en: 'Lightweight poplin, clean mandarin collar, concealed placket.'
    },
    priceEur: 110,
    sizes: CLOTHING_SIZES,
    colors: ['Blanc', 'Noir'],
    imageCount: 3
  },
  {
    id: 'femme-robe-fluide',
    slug: 'femme-robe-fluide',
    category: 'femme',
    subcategory: 'robes',
    name: { fr: 'Robe fluide asymétrique', en: 'Asymmetric flowing dress' },
    description: {
      fr: 'Drapé fluide, ourlet asymétrique, coupe qui accompagne le mouvement.',
      en: 'Fluid drape, asymmetric hem, a cut that moves with you.'
    },
    priceEur: 235,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 4,
    isNew: true,
    relatedProductIds: ['femme-manteau-long', 'accessoires-ceinture-cuir']
  },
  {
    id: 'femme-t-shirt-essentiel',
    slug: 'femme-t-shirt-essentiel',
    category: 'femme',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt essentiel côtelé', en: 'Essential ribbed t-shirt' },
    description: {
      fr: 'Coton côtelé, coupe ajustée, encolure ronde épurée.',
      en: 'Ribbed cotton, fitted cut, clean crew neckline.'
    },
    priceEur: 62,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Écru'],
    imageCount: 3
  },
  {
    id: 'femme-manteau-long',
    slug: 'femme-manteau-long',
    category: 'femme',
    subcategory: 'manteaux',
    name: { fr: 'Manteau long en laine', en: 'Long wool coat' },
    description: {
      fr: 'Laine dense, coupe longue et épurée, doublure satinée.',
      en: 'Dense wool, long clean cut, satin lining.'
    },
    priceEur: 410,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Camel'],
    imageCount: 4,
    relatedProductIds: ['femme-robe-fluide']
  },
  {
    id: 'femme-pantalon-tailleur',
    slug: 'femme-pantalon-tailleur',
    category: 'femme',
    subcategory: 'pantalons',
    name: { fr: 'Pantalon tailleur fluide', en: 'Fluid tailored trousers' },
    description: {
      fr: 'Tombé fluide, pli marqué, taille haute ajustée.',
      en: 'Fluid drape, sharp crease, fitted high rise.'
    },
    priceEur: 155,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 3
  },
  {
    id: 'enfant-t-shirt-graphique',
    slug: 'enfant-t-shirt-graphique',
    category: 'enfant',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt graphique Reign', en: 'Reign graphic t-shirt' },
    description: {
      fr: 'Jersey doux, imprimé graphique discret, coupe confortable.',
      en: 'Soft jersey, subtle graphic print, comfortable fit.'
    },
    priceEur: 45,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Blanc'],
    imageCount: 2,
    isNew: true
  },
  {
    id: 'enfant-sweat-capuche',
    slug: 'enfant-sweat-capuche',
    category: 'enfant',
    subcategory: 'sweats',
    name: { fr: 'Sweat à capuche molleton', en: 'Fleece hoodie' },
    description: {
      fr: 'Molleton épais, capuche doublée, poche kangourou.',
      en: 'Heavyweight fleece, lined hood, kangaroo pocket.'
    },
    priceEur: 68,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 3
  },
  {
    id: 'enfant-pantalon-jogger',
    slug: 'enfant-pantalon-jogger',
    category: 'enfant',
    subcategory: 'pantalons',
    name: { fr: 'Jogger molleton', en: 'Fleece joggers' },
    description: {
      fr: 'Taille élastiquée, chevilles resserrées, confort au quotidien.',
      en: 'Elastic waist, tapered ankles, everyday comfort.'
    },
    priceEur: 52,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 2
  },
  {
    id: 'enfant-veste-legere',
    slug: 'enfant-veste-legere',
    category: 'enfant',
    subcategory: 'vestes',
    name: { fr: 'Veste légère coupe-vent', en: 'Lightweight windbreaker' },
    description: {
      fr: 'Tissu déperlant, capuche amovible, coupe droite.',
      en: 'Water-repellent fabric, removable hood, straight cut.'
    },
    priceEur: 78,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 2
  },
  {
    id: 'accessoires-sac-cabas',
    slug: 'accessoires-sac-cabas',
    category: 'accessoires',
    subcategory: 'sacs',
    name: { fr: 'Sac cabas cuir grainé', en: 'Grained leather tote' },
    description: {
      fr: 'Cuir grainé épais, anses courtes, intérieur compartimenté.',
      en: 'Thick grained leather, short handles, compartmented interior.'
    },
    priceEur: 290,
    sizes: ['UNIQUE'],
    colors: ['Noir', 'Camel'],
    imageCount: 3,
    isNew: true,
    relatedProductIds: ['accessoires-ceinture-cuir']
  },
  {
    id: 'accessoires-ceinture-cuir',
    slug: 'accessoires-ceinture-cuir',
    category: 'accessoires',
    subcategory: 'ceintures',
    name: { fr: 'Ceinture cuir boucle signature', en: 'Signature buckle leather belt' },
    description: {
      fr: 'Cuir pleine fleur, boucle métal brossé gravée Reign.',
      en: 'Full-grain leather, brushed metal buckle engraved Reign.'
    },
    priceEur: 95,
    sizes: ['S/M', 'L/XL'],
    colors: ['Noir', 'Camel'],
    imageCount: 2,
    relatedProductIds: ['accessoires-sac-cabas']
  },
  {
    id: 'accessoires-bijou-anneau',
    slug: 'accessoires-bijou-anneau',
    category: 'accessoires',
    subcategory: 'bijoux',
    name: { fr: 'Anneau signature acier', en: 'Signature steel ring' },
    description: {
      fr: 'Acier brossé massif, gravure minimaliste Reign.',
      en: 'Solid brushed steel, minimalist Reign engraving.'
    },
    priceEur: 85,
    sizes: ['UNIQUE'],
    colors: ['Bleu acier'],
    imageCount: 2
  },
  {
    id: 'accessoires-chapeau-laine',
    slug: 'accessoires-chapeau-laine',
    category: 'accessoires',
    subcategory: 'chapeaux',
    name: { fr: 'Bonnet laine mérinos', en: 'Merino wool beanie' },
    description: {
      fr: 'Laine mérinos douce, revers côtelé, patch Reign discret.',
      en: 'Soft merino wool, ribbed cuff, discreet Reign patch.'
    },
    priceEur: 55,
    sizes: ['UNIQUE'],
    colors: ['Noir', 'Gris'],
    imageCount: 2
  }
];

export function getProductsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string, locale: Locale): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return PRODUCTS.filter((p) => p.name[locale].toLowerCase().includes(normalized));
}

export function getRelatedProducts(product: Product): Product[] {
  if (!product.relatedProductIds) return [];
  return product.relatedProductIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/products.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/products.ts src/lib/products.test.ts
git commit -m "feat: add product catalog data and query helpers"
```

---

### Task 5: Currency utils + CurrencyContext

**Files:**
- Create: `src/lib/currency.ts`
- Test: `src/lib/currency.test.ts`
- Create: `src/context/CurrencyContext.tsx`
- Test: `src/context/CurrencyContext.test.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: nothing beyond the locale string already available in the layout.
- Produces: `CurrencyCode` (`'EUR' | 'GBP'`), `convertFromEur(amountEur, currency)`, `formatPrice(amountEur, currency, locale)`, `defaultCurrencyForLocale(locale)` from `src/lib/currency.ts`; `CurrencyProvider`, `useCurrency(): { currency, setCurrency }` from `src/context/CurrencyContext.tsx`. Every later task that displays a price uses `formatPrice` + `useCurrency()`.

- [ ] **Step 1: Write the failing tests for the currency utilities**

Create `src/lib/currency.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { convertFromEur, formatPrice, defaultCurrencyForLocale } from './currency';

describe('convertFromEur', () => {
  it('returns the same amount for EUR', () => {
    expect(convertFromEur(100, 'EUR')).toBe(100);
  });

  it('applies the fixed rate for GBP', () => {
    expect(convertFromEur(100, 'GBP')).toBeCloseTo(86, 5);
  });
});

describe('formatPrice', () => {
  it('formats EUR amounts with the French locale', () => {
    const formatted = formatPrice(100, 'EUR', 'fr');
    expect(formatted).toContain('100');
    expect(formatted).toMatch(/€/);
  });

  it('formats GBP amounts with the English locale', () => {
    const formatted = formatPrice(100, 'GBP', 'en');
    expect(formatted).toMatch(/£/);
  });
});

describe('defaultCurrencyForLocale', () => {
  it('defaults French to EUR', () => {
    expect(defaultCurrencyForLocale('fr')).toBe('EUR');
  });

  it('defaults English to GBP', () => {
    expect(defaultCurrencyForLocale('en')).toBe('GBP');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/currency.test.ts`
Expected: FAIL — `currency.ts` does not exist yet.

- [ ] **Step 3: Implement the currency utilities**

Create `src/lib/currency.ts`:

```ts
export type CurrencyCode = 'EUR' | 'GBP';

export const FIXED_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  GBP: 0.86
};

export function convertFromEur(amountEur: number, currency: CurrencyCode): number {
  return amountEur * FIXED_RATES[currency];
}

export function formatPrice(amountEur: number, currency: CurrencyCode, locale: string): string {
  const converted = convertFromEur(amountEur, currency);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(converted);
}

export function defaultCurrencyForLocale(locale: string): CurrencyCode {
  return locale === 'en' ? 'GBP' : 'EUR';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/currency.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for CurrencyContext**

Create `src/context/CurrencyContext.test.tsx`:

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from './CurrencyContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider initialLocale="fr">{children}</CurrencyProvider>;
}

describe('CurrencyContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to EUR for the fr locale', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currency).toBe('EUR');
  });

  it('updates the currency and persists it to localStorage', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    act(() => {
      result.current.setCurrency('GBP');
    });
    expect(result.current.currency).toBe('GBP');
    await waitFor(() => {
      expect(window.localStorage.getItem('reign-currency')).toBe('GBP');
    });
  });

  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useCurrency())).toThrow();
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm run test -- src/context/CurrencyContext.test.tsx`
Expected: FAIL — `CurrencyContext.tsx` does not exist yet.

- [ ] **Step 7: Implement CurrencyContext**

Create `src/context/CurrencyContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CurrencyCode, defaultCurrencyForLocale } from '@/lib/currency';

const STORAGE_KEY = 'reign-currency';

export interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialLocale
}: {
  children: React.ReactNode;
  initialLocale: string;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>(() => defaultCurrencyForLocale(initialLocale));
  const hasHydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'EUR' || stored === 'GBP') {
        setCurrency(stored);
      }
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test -- src/context/CurrencyContext.test.tsx`
Expected: PASS.

- [ ] **Step 9: Wire the provider into the locale layout**

Modify `src/app/[locale]/layout.tsx` — import `CurrencyProvider` from `@/context/CurrencyContext` and wrap `<main>{children}</main>` with it, passing the resolved `locale`:

```tsx
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider initialLocale={locale}>
            <main>{children}</main>
          </CurrencyProvider>
        </NextIntlClientProvider>
```

- [ ] **Step 10: Verify the full test suite and build still pass**

Run: `npm run test`
Expected: PASS (all suites).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/lib/currency.ts src/lib/currency.test.ts src/context/CurrencyContext.tsx src/context/CurrencyContext.test.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add fixed-rate currency conversion and CurrencyContext"
```

---

### Task 6: CartContext + cart calculations (lib/cart.ts)

**Files:**
- Create: `src/lib/cart.ts`
- Test: `src/lib/cart.test.ts`
- Create: `src/context/CartContext.tsx`
- Test: `src/context/CartContext.test.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `getProductById` from `src/lib/products.ts` (Task 4).
- Produces: `CartItem { productId, size, color, quantity }`, `addLine`, `removeLine`, `updateLineQuantity`, `getCartItemCount`, `getCartSubtotalEur` from `src/lib/cart.ts`; `CartProvider`, `useCart(): { items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotalEur }` from `src/context/CartContext.tsx`. The Header (Task 10) and Cart drawer (Task 12) both depend on `useCart()`.

- [ ] **Step 1: Write the failing tests for the pure cart logic**

Create `src/lib/cart.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur,
  CartItem
} from './cart';
import { PRODUCTS } from './products';

const productA = PRODUCTS[0];
const productB = PRODUCTS[1];

describe('addLine', () => {
  it('adds a new line for a product/size/color not already in the cart', () => {
    const items: CartItem[] = [];
    const result = addLine(items, { productId: productA.id, size: 'M', color: 'Noir', quantity: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it('merges quantity when the same product/size/color is added again', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = addLine(items, { productId: productA.id, size: 'M', color: 'Noir', quantity: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it('keeps separate lines for the same product in a different size', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = addLine(items, { productId: productA.id, size: 'L', color: 'Noir', quantity: 1 });
    expect(result).toHaveLength(2);
  });
});

describe('removeLine', () => {
  it('removes the matching line only', () => {
    const items: CartItem[] = [
      { productId: productA.id, size: 'M', color: 'Noir', quantity: 1 },
      { productId: productB.id, size: 'S', color: 'Blanc', quantity: 1 }
    ];
    const result = removeLine(items, productA.id, 'M', 'Noir');
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe(productB.id);
  });
});

describe('updateLineQuantity', () => {
  it('updates the quantity of the matching line', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = updateLineQuantity(items, productA.id, 'M', 'Noir', 5);
    expect(result[0].quantity).toBe(5);
  });
});

describe('getCartItemCount', () => {
  it('sums quantities across all lines', () => {
    const items: CartItem[] = [
      { productId: productA.id, size: 'M', color: 'Noir', quantity: 2 },
      { productId: productB.id, size: 'S', color: 'Blanc', quantity: 3 }
    ];
    expect(getCartItemCount(items)).toBe(5);
  });
});

describe('getCartSubtotalEur', () => {
  it('sums price × quantity using catalog prices', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 2 }];
    expect(getCartSubtotalEur(items)).toBe(productA.priceEur * 2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/cart.test.ts`
Expected: FAIL — `cart.ts` does not exist yet.

- [ ] **Step 3: Implement the pure cart logic**

Create `src/lib/cart.ts`:

```ts
import { getProductById } from '@/lib/products';

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export function isSameLine(line: CartItem, productId: string, size: string, color: string): boolean {
  return line.productId === productId && line.size === size && line.color === color;
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSubtotalEur(items: CartItem[]): number {
  return items.reduce((sum, line) => {
    const product = getProductById(line.productId);
    return sum + (product ? product.priceEur * line.quantity : 0);
  }, 0);
}

export function addLine(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((line) => isSameLine(line, item.productId, item.size, item.color));
  if (existing) {
    return items.map((line) =>
      isSameLine(line, item.productId, item.size, item.color)
        ? { ...line, quantity: line.quantity + item.quantity }
        : line
    );
  }
  return [...items, item];
}

export function removeLine(items: CartItem[], productId: string, size: string, color: string): CartItem[] {
  return items.filter((line) => !isSameLine(line, productId, size, color));
}

export function updateLineQuantity(
  items: CartItem[],
  productId: string,
  size: string,
  color: string,
  quantity: number
): CartItem[] {
  return items.map((line) => (isSameLine(line, productId, size, color) ? { ...line, quantity } : line));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/cart.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for CartContext**

Create `src/context/CartContext.test.tsx`:

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { PRODUCTS } from '@/lib/products';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
  });

  it('adds an item and persists it to localStorage', async () => {
    const product = PRODUCTS[0];
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ productId: product.id, size: 'M', color: 'Noir', quantity: 1 });
    });
    expect(result.current.itemCount).toBe(1);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('reign-cart') ?? '[]');
      expect(stored).toHaveLength(1);
    });
  });

  it('computes the subtotal from catalog prices', () => {
    const product = PRODUCTS[0];
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ productId: product.id, size: 'M', color: 'Noir', quantity: 2 });
    });
    expect(result.current.subtotalEur).toBe(product.priceEur * 2);
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm run test -- src/context/CartContext.test.tsx`
Expected: FAIL — `CartContext.tsx` does not exist yet.

- [ ] **Step 7: Implement CartContext**

Create `src/context/CartContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  CartItem,
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur
} from '@/lib/cart';

const STORAGE_KEY = 'reign-cart';

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalEur: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hasHydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value: CartContextValue = {
    items,
    addItem: (item) => setItems((prev) => addLine(prev, item)),
    removeItem: (productId, size, color) => setItems((prev) => removeLine(prev, productId, size, color)),
    updateQuantity: (productId, size, color, quantity) =>
      setItems((prev) => updateLineQuantity(prev, productId, size, color, quantity)),
    clearCart: () => setItems([]),
    itemCount: getCartItemCount(items),
    subtotalEur: getCartSubtotalEur(items)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test -- src/context/CartContext.test.tsx`
Expected: PASS.

- [ ] **Step 9: Wire the provider into the locale layout**

Modify `src/app/[locale]/layout.tsx` — import `CartProvider` from `@/context/CartContext` and nest it inside `CurrencyProvider`:

```tsx
          <CurrencyProvider initialLocale={locale}>
            <CartProvider>
              <main>{children}</main>
            </CartProvider>
          </CurrencyProvider>
```

- [ ] **Step 10: Verify the full test suite and build still pass**

Run: `npm run test`
Expected: PASS.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/lib/cart.ts src/lib/cart.test.ts src/context/CartContext.tsx src/context/CartContext.test.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add cart line-item logic and CartContext"
```

---

### Task 7: FavoritesContext

**Files:**
- Create: `src/lib/favorites.ts`
- Test: `src/lib/favorites.test.ts`
- Create: `src/context/FavoritesContext.tsx`
- Test: `src/context/FavoritesContext.test.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `toggleFavoriteId(ids, id)` from `src/lib/favorites.ts`; `FavoritesProvider`, `useFavorites(): { favoriteIds, toggleFavorite, isFavorite }` from `src/context/FavoritesContext.tsx`. Used by the Header (favorites count), the product card/PDP heart toggle, and the Favorites page (Task 17).

- [ ] **Step 1: Write the failing test for the pure toggle logic**

Create `src/lib/favorites.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toggleFavoriteId } from './favorites';

describe('toggleFavoriteId', () => {
  it('adds an id that is not yet present', () => {
    expect(toggleFavoriteId([], 'p1')).toEqual(['p1']);
  });

  it('removes an id that is already present', () => {
    expect(toggleFavoriteId(['p1', 'p2'], 'p1')).toEqual(['p2']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/favorites.test.ts`
Expected: FAIL — `favorites.ts` does not exist yet.

- [ ] **Step 3: Implement the pure toggle logic**

Create `src/lib/favorites.ts`:

```ts
export function toggleFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/favorites.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for FavoritesContext**

Create `src/context/FavoritesContext.test.tsx`:

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe('FavoritesContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.isFavorite('p1')).toBe(false);
  });

  it('toggles a product in and persists it to localStorage', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(true);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('reign-favorites') ?? '[]');
      expect(stored).toEqual(['p1']);
    });
  });

  it('toggles a product back out', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(false);
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm run test -- src/context/FavoritesContext.test.tsx`
Expected: FAIL — `FavoritesContext.tsx` does not exist yet.

- [ ] **Step 7: Implement FavoritesContext**

Create `src/context/FavoritesContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toggleFavoriteId } from '@/lib/favorites';

const STORAGE_KEY = 'reign-favorites';

export interface FavoritesContextValue {
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const hasHydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const value: FavoritesContextValue = {
    favoriteIds,
    toggleFavorite: (productId) => setFavoriteIds((prev) => toggleFavoriteId(prev, productId)),
    isFavorite: (productId) => favoriteIds.includes(productId)
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test -- src/context/FavoritesContext.test.tsx`
Expected: PASS.

- [ ] **Step 9: Wire the provider into the locale layout**

Modify `src/app/[locale]/layout.tsx` — nest `FavoritesProvider` inside `CartProvider`:

```tsx
            <CartProvider>
              <FavoritesProvider>
                <main>{children}</main>
              </FavoritesProvider>
            </CartProvider>
```

- [ ] **Step 10: Verify the full test suite and build still pass**

Run: `npm run test`
Expected: PASS.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/lib/favorites.ts src/lib/favorites.test.ts src/context/FavoritesContext.tsx src/context/FavoritesContext.test.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add favorites toggle logic and FavoritesContext"
```

---

### Task 8: Shared UI primitives (Container, Heading, Button, PlaceholderBlock)

**Files:**
- Create: `src/components/ui/Container.tsx`
- Create: `src/components/ui/Heading.tsx`
- Create: `src/components/ui/Button.tsx`
- Test: `src/components/ui/Button.test.ts`
- Create: `src/components/ui/PlaceholderBlock.tsx`

**Interfaces:**
- Consumes: Tailwind tokens from Task 2.
- Produces: `<Container>`, `<Heading level={1|2|3}>`, `<Button variant="primary"|"secondary">`, `buttonClassName(variant)`, `<PlaceholderBlock aspect="portrait"|"square"|"wide" label="...">`. Every page from Task 10 onward is built with these instead of ad-hoc markup.

- [ ] **Step 1: Write the failing test for the one piece of real logic (button variant classes)**

Create `src/components/ui/Button.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buttonClassName } from './Button';

describe('buttonClassName', () => {
  it('returns a dark-filled style for the primary variant', () => {
    expect(buttonClassName('primary')).toContain('bg-ink');
  });

  it('returns an outlined style for the secondary variant', () => {
    expect(buttonClassName('secondary')).toContain('border-ink');
  });

  it('defaults to the primary variant', () => {
    expect(buttonClassName()).toBe(buttonClassName('primary'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/ui/Button.test.ts`
Expected: FAIL — `Button.tsx` does not exist yet.

- [ ] **Step 3: Implement Container**

Create `src/components/ui/Container.tsx`:

```tsx
export function Container({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
```

- [ ] **Step 4: Implement Heading**

Create `src/components/ui/Heading.tsx`:

```tsx
type HeadingLevel = 1 | 2 | 3;

const SIZES: Record<HeadingLevel, string> = {
  1: 'text-4xl md:text-5xl',
  2: 'text-3xl md:text-4xl',
  3: 'text-2xl'
};

export function Heading({
  level = 2,
  children,
  className = ''
}: {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return <Tag className={`font-serif ${SIZES[level]} ${className}`}>{children}</Tag>;
}
```

- [ ] **Step 5: Implement Button (and the tested buttonClassName helper)**

Create `src/components/ui/Button.tsx`:

```tsx
type ButtonVariant = 'primary' | 'secondary';

const BASE = 'inline-flex items-center justify-center px-6 py-3 text-sm tracking-wide transition-colors';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `${BASE} bg-ink text-paper hover:bg-accent`,
  secondary: `${BASE} border border-ink text-ink hover:border-accent hover:text-accent`
};

export function buttonClassName(variant: ButtonVariant = 'primary'): string {
  return VARIANTS[variant];
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${buttonClassName(variant)} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

Note the explicit `className = ''` destructured out of `props`: this means a caller-supplied `className` is *appended* to the variant's base classes instead of silently replacing them (which is what would happen if `{...props}` were spread after a fixed `className` attribute).

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- src/components/ui/Button.test.ts`
Expected: PASS.

- [ ] **Step 7: Implement PlaceholderBlock**

Create `src/components/ui/PlaceholderBlock.tsx`:

```tsx
type Aspect = 'portrait' | 'square' | 'wide';

const ASPECT_CLASSES: Record<Aspect, string> = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]'
};

export function PlaceholderBlock({
  aspect = 'portrait',
  label,
  className = ''
}: {
  aspect?: Aspect;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`${ASPECT_CLASSES[aspect]} flex items-center justify-center bg-mist-900 ${className}`}
      role="img"
      aria-label={label ?? 'Visuel à venir'}
    >
      {label && (
        <span className="px-4 text-center text-xs uppercase tracking-widest text-mist-400">{label}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Verify the full test suite and build still pass**

Run: `npm run test`
Expected: PASS.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/Container.tsx src/components/ui/Heading.tsx src/components/ui/Button.tsx src/components/ui/Button.test.ts src/components/ui/PlaceholderBlock.tsx
git commit -m "feat: add shared UI primitives (Container, Heading, Button, PlaceholderBlock)"
```

---

### Task 9: Brand logo asset + Logo component

**Files:**
- Create: `public/branding/logo-reign.png` (the brand asset the user provided in chat)
- Create: `src/components/ui/Logo.tsx`

**Interfaces:**
- Consumes: `Link` from `@/i18n/navigation` (Task 3).
- Produces: `<Logo />` — used by the Header (Task 10) and the Footer (Task 11).

**Design note:** the provided logo is a white wordmark on a black background. Rather than fight that, the Header (Task 10) uses a black (`bg-ink`) background so the logo always sits on the surface it was designed for, with the rest of each page staying white/black per the "contraste maîtrisé" identity from the spec.

- [ ] **Step 1: Obtain the logo asset**

Save the Reign wordmark image shared earlier in this conversation to `public/branding/logo-reign.png` (create the `public/branding/` folder if it doesn't exist). If this file is not present in the repository when this task starts, stop and ask the user for it before continuing — do not fabricate a placeholder logo; the spec requires this exact provided asset.

- [ ] **Step 2: Implement the Logo component**

Create `src/components/ui/Logo.tsx`:

```tsx
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="Reign — accueil" className={`inline-flex items-center ${className}`}>
      <Image
        src="/branding/logo-reign.png"
        alt="Reign"
        width={160}
        height={52}
        priority
        className="h-8 w-auto md:h-10"
      />
    </Link>
  );
}
```

- [ ] **Step 3: Verify the logo renders**

Run: `npm run dev`, visit `http://localhost:3000/fr`, and confirm the logo image loads without a broken-image icon (it will float alone on the placeholder page for now — Header wiring happens in Task 10).

- [ ] **Step 4: Commit**

```bash
git add public/branding/logo-reign.png src/components/ui/Logo.tsx
git commit -m "feat: add brand logo asset and Logo component"
```

---

### Task 10: Header (nav, logo, language/currency switchers, cart/favorites counts)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/LanguageSwitcher.tsx`
- Create: `src/components/layout/CurrencySwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `Logo` (Task 9), `CATEGORIES` (Task 4), `useCart` (Task 6), `useFavorites` (Task 7), `useCurrency`/`CurrencyCode` (Task 5), `Link`/`useRouter` from `@/i18n/navigation` (Task 3), `nav.*` messages (Task 3).
- Produces: `<Header />`, rendered globally by the locale layout, on every page from here on.

- [ ] **Step 1: Implement the language switcher**

Create `src/components/layout/LanguageSwitcher.tsx`:

```tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  function switchTo(nextLocale: 'fr' | 'en') {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1 text-xs tracking-widest">
      <button
        type="button"
        onClick={() => switchTo('fr')}
        aria-pressed={locale === 'fr'}
        className={locale === 'fr' ? 'text-paper' : 'text-mist-400 hover:text-paper'}
      >
        FR
      </button>
      <span className="text-mist-600">/</span>
      <button
        type="button"
        onClick={() => switchTo('en')}
        aria-pressed={locale === 'en'}
        className={locale === 'en' ? 'text-paper' : 'text-mist-400 hover:text-paper'}
      >
        EN
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Implement the currency switcher**

Create `src/components/layout/CurrencySwitcher.tsx`:

```tsx
'use client';

import { useCurrency } from '@/context/CurrencyContext';
import type { CurrencyCode } from '@/lib/currency';

const CURRENCIES: CurrencyCode[] = ['EUR', 'GBP'];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-1 text-xs tracking-widest">
      {CURRENCIES.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 && <span className="text-mist-600">/</span>}
          <button
            type="button"
            onClick={() => setCurrency(code)}
            aria-pressed={currency === code}
            className={currency === code ? 'text-paper' : 'text-mist-400 hover:text-paper'}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement the Header**

Create `src/components/layout/Header.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { CATEGORIES } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const { itemCount } = useCart();
  const { favoriteIds } = useFavorites();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsMenuOpen(false);
      router.push(`/recherche?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm tracking-wide md:flex">
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/${category}`} className="hover:text-accent">
              {t(category)}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 items-center md:flex">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="w-full border-b border-mist-700 bg-transparent px-1 py-1 text-sm text-paper placeholder:text-mist-500 focus:border-accent focus:outline-none"
          />
        </form>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <Link href="/favoris" aria-label={t('favorites')} className="relative hover:text-accent">
            <HeartIcon />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px]">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <Link href="/panier" aria-label={t('cart')} className="relative hover:text-accent">
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px]">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Menu"
          aria-expanded={isMenuOpen}
        >
          <MenuIcon />
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-mist-800 px-4 pb-6 md:hidden">
          <nav className="flex flex-col gap-4 pt-4 text-sm tracking-wide">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/${category}`}
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-accent"
              >
                {t(category)}
              </Link>
            ))}
          </nav>
          <form onSubmit={handleSearchSubmit} className="mt-4">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="w-full border-b border-mist-700 bg-transparent px-1 py-2 text-sm text-paper placeholder:text-mist-500 focus:border-accent focus:outline-none"
            />
          </form>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <Link href="/favoris" onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
              {t('favorites')} {favoriteIds.length > 0 && `(${favoriteIds.length})`}
            </Link>
            <Link href="/panier" onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
              {t('cart')} {itemCount > 0 && `(${itemCount})`}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Wire the Header into the locale layout**

Modify `src/app/[locale]/layout.tsx` — import `Header` from `@/components/layout/Header` and render it just before `<main>`, still inside `FavoritesProvider`:

```tsx
              <FavoritesProvider>
                <Header />
                <main>{children}</main>
              </FavoritesProvider>
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev` and check on `http://localhost:3000/fr`:
- The header shows the logo, the four category links (Homme/Femme/Enfant/Accessoires), a search field, FR/EN, EUR/GBP, and the favorites/cart icons.
- Clicking "EN" navigates to `/en` with the same path and swaps every label (Men/Women/Kids/Accessories).
- Resizing the viewport below the `md` breakpoint hides the desktop nav and shows the hamburger button; opening it reveals the same links stacked vertically.
- Category links currently 404 (category pages arrive in Task 14) — that is expected at this point.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/LanguageSwitcher.tsx src/components/layout/CurrencySwitcher.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add Header with navigation, search, language/currency switchers"
```

---

### Task 11: Footer + cookie consent banner

**Files:**
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/CookieBanner.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `footer` and `cookies` namespaces)
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `Container` (Task 8), `Button` (Task 8), `Link` from `@/i18n/navigation` (Task 3).
- Produces: `<Footer />`, `<CookieBanner />`, rendered globally by the locale layout on every page. The institutional links in the Footer point at routes built in Tasks 22–27; they 404 until those tasks land, which is expected until then.

- [ ] **Step 1: Add the footer and cookie message namespaces**

Replace the full contents of `messages/fr.json`:

```json
{
  "nav": {
    "homme": "Homme",
    "femme": "Femme",
    "enfant": "Enfant",
    "accessoires": "Accessoires",
    "search": "Rechercher",
    "cart": "Panier",
    "favorites": "Favoris"
  },
  "common": {
    "brand": "Reign"
  },
  "footer": {
    "newsletterTitle": "Restez informé·e",
    "newsletterPlaceholder": "Votre email",
    "newsletterButton": "S'inscrire",
    "newsletterSuccess": "Merci, vous êtes inscrit·e.",
    "links": {
      "about": "À propos",
      "contact": "Contact",
      "faq": "FAQ",
      "shippingReturns": "Livraison & Retours",
      "sizeGuide": "Guide des tailles",
      "legalNotice": "Mentions légales",
      "terms": "CGV",
      "privacy": "Confidentialité"
    },
    "rights": "Tous droits réservés."
  },
  "cookies": {
    "message": "Nous utilisons des cookies pour améliorer votre expérience sur ce site.",
    "accept": "Accepter"
  }
}
```

Replace the full contents of `messages/en.json`:

```json
{
  "nav": {
    "homme": "Men",
    "femme": "Women",
    "enfant": "Kids",
    "accessoires": "Accessories",
    "search": "Search",
    "cart": "Cart",
    "favorites": "Favorites"
  },
  "common": {
    "brand": "Reign"
  },
  "footer": {
    "newsletterTitle": "Stay in the loop",
    "newsletterPlaceholder": "Your email",
    "newsletterButton": "Subscribe",
    "newsletterSuccess": "Thank you, you're subscribed.",
    "links": {
      "about": "About",
      "contact": "Contact",
      "faq": "FAQ",
      "shippingReturns": "Shipping & Returns",
      "sizeGuide": "Size Guide",
      "legalNotice": "Legal Notice",
      "terms": "Terms of Sale",
      "privacy": "Privacy"
    },
    "rights": "All rights reserved."
  },
  "cookies": {
    "message": "We use cookies to improve your experience on this site.",
    "accept": "Accept"
  }
}
```

- [ ] **Step 2: Implement the Footer**

Create `src/components/layout/Footer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

const INSTITUTIONAL_LINKS: { href: string; key: string }[] = [
  { href: '/a-propos', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/aide', key: 'faq' },
  { href: '/livraison-retours', key: 'shippingReturns' },
  { href: '/guide-tailles', key: 'sizeGuide' },
  { href: '/mentions-legales', key: 'legalNotice' },
  { href: '/cgv', key: 'terms' },
  { href: '/confidentialite', key: 'privacy' }
];

export function Footer() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) {
      setHasSubscribed(true);
      setEmail('');
    }
  }

  return (
    <footer className="border-t border-mist-100 bg-paper text-ink">
      <Container className="grid gap-12 py-16 md:grid-cols-3">
        <div>
          <h2 className="font-serif text-xl">{t('newsletterTitle')}</h2>
          {hasSubscribed ? (
            <p className="mt-4 text-sm text-mist-600">{t('newsletterSuccess')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('newsletterPlaceholder')}
                className="w-full border-b border-mist-300 bg-transparent px-1 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <Button type="submit" variant="secondary">
                {t('newsletterButton')}
              </Button>
            </form>
          )}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          {INSTITUTIONAL_LINKS.map(({ href, key }) => (
            <Link key={href} href={href} className="text-mist-700 hover:text-accent">
              {t(`links.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4 md:justify-end">
          {(['Instagram', 'TikTok', 'Pinterest'] as const).map((social) => (
            <a
              key={social}
              href="#"
              aria-label={social}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mist-300 text-xs hover:border-accent hover:text-accent"
            >
              {social.slice(0, 2)}
            </a>
          ))}
        </div>
      </Container>

      <div className="border-t border-mist-100 py-6 text-center text-xs text-mist-500">
        © {new Date().getFullYear()} Reign — {t('rights')}
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Implement the cookie banner**

Create `src/components/layout/CookieBanner.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'reign-cookie-consent';

export function CookieBanner() {
  const t = useTranslations('cookies');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(STORAGE_KEY);
    if (!consent) setIsVisible(true);
  }, []);

  function accept() {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-between gap-4 bg-ink px-4 py-4 text-sm text-paper sm:flex-row sm:px-8">
      <p className="max-w-2xl">{t('message')}</p>
      <Button
        variant="secondary"
        onClick={accept}
        className="border-paper text-paper hover:border-accent hover:text-accent"
      >
        {t('accept')}
      </Button>
    </div>
  );
}
```

This renders `null` on both the server render and the client's first hydration pass (state starts `false`), then flips to visible after the `useEffect` check — the same hydration-safe pattern used by the Context providers in Tasks 5–7.

- [ ] **Step 4: Wire Footer and CookieBanner into the locale layout**

Modify `src/app/[locale]/layout.tsx` — import `Footer` and `CookieBanner`, and render them after `<main>`:

```tsx
              <FavoritesProvider>
                <Header />
                <main>{children}</main>
                <Footer />
                <CookieBanner />
              </FavoritesProvider>
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr`:
- The footer shows the newsletter form, the 8 institutional links (they 404 for now — expected until Tasks 22–27), and the 3 social placeholders.
- Submitting the newsletter form with a non-empty email swaps it for the thank-you message.
- The cookie banner appears at the bottom on first visit; clicking "Accepter" dismisses it and it stays dismissed after a page reload (check `localStorage` in devtools for `reign-cookie-consent`).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Footer.tsx src/components/layout/CookieBanner.tsx messages/fr.json messages/en.json src/app/[locale]/layout.tsx
git commit -m "feat: add Footer with newsletter/links and cookie consent banner"
```

---

### Task 12: Cart drawer

**Files:**
- Create: `src/context/CartDrawerContext.tsx`
- Create: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/layout/Header.tsx` (cart icon opens the drawer instead of navigating)
- Modify: `messages/fr.json`, `messages/en.json` (add `cart` namespace)
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 6), `useCurrency`/`formatPrice` (Task 5), `getProductById` (Task 4), `Button`/`PlaceholderBlock` (Task 8), `Link` (Task 3).
- Produces: `CartDrawerProvider`, `useCartDrawer(): { isOpen, open, close }` from `src/context/CartDrawerContext.tsx`; `<CartDrawer />` rendered globally. The Cart page (Task 18) reuses the same `useCart()`/`formatPrice` pattern shown here for its own full-page layout.

- [ ] **Step 1: Add the cart message namespace**

Add to both `messages/fr.json` and `messages/en.json`, alongside the existing `nav`/`common`/`footer`/`cookies` keys (do not remove those — add this as a new top-level key in each file):

`messages/fr.json` addition:

```json
  "cart": {
    "title": "Panier",
    "empty": "Votre panier est vide.",
    "quantity": "Quantité",
    "remove": "Retirer",
    "subtotal": "Sous-total",
    "viewCart": "Voir le panier",
    "close": "Fermer"
  }
```

`messages/en.json` addition:

```json
  "cart": {
    "title": "Cart",
    "empty": "Your cart is empty.",
    "quantity": "Quantity",
    "remove": "Remove",
    "subtotal": "Subtotal",
    "viewCart": "View cart",
    "close": "Close"
  }
```

- [ ] **Step 2: Implement the drawer's open/close state**

Create `src/context/CartDrawerContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useState } from 'react';

export interface CartDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CartDrawerContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  return ctx;
}
```

- [ ] **Step 3: Implement the CartDrawer**

Create `src/components/cart/CartDrawer.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { getProductById } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { isOpen, close } = useCartDrawer();
  const { items, removeItem, updateQuantity, subtotalEur } = useCart();
  const { currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t('close')} onClick={close} className="absolute inset-0 bg-ink/50" />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">{t('title')}</h2>
          <button type="button" onClick={close} aria-label={t('close')} className="text-2xl leading-none">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-6">
              {items.map((line) => {
                const product = getProductById(line.productId);
                if (!product) return null;
                const lineKey = `${line.productId}-${line.size}-${line.color}`;
                return (
                  <li key={lineKey} className="flex gap-4">
                    <PlaceholderBlock aspect="square" className="w-20 flex-shrink-0" />
                    <div className="flex flex-1 flex-col text-sm">
                      <span className="font-medium">{product.name[locale]}</span>
                      <span className="text-mist-500">
                        {line.size} · {line.color}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <label htmlFor={`qty-${lineKey}`} className="sr-only">
                          {t('quantity')}
                        </label>
                        <input
                          id={`qty-${lineKey}`}
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) =>
                            updateQuantity(line.productId, line.size, line.color, Math.max(1, Number(event.target.value)))
                          }
                          className="w-14 border border-mist-300 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(line.productId, line.size, line.color)}
                          className="text-xs text-mist-500 underline hover:text-accent"
                        >
                          {t('remove')}
                        </button>
                      </div>
                      <span className="mt-2 text-sm">{formatPrice(product.priceEur * line.quantity, currency, locale)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t border-mist-100 pt-4">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotalEur, currency, locale)}</span>
              </div>
              <Link href="/panier" onClick={close} className="mt-4 block">
                <Button className="w-full">{t('viewCart')}</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Make the Header's cart icon open the drawer instead of navigating**

Modify `src/components/layout/Header.tsx` — replace the whole file content with this updated version (adds the `useCartDrawer` import/usage and swaps both cart `Link`s for buttons that open the drawer):

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { CATEGORIES } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const { itemCount } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { favoriteIds } = useFavorites();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsMenuOpen(false);
      router.push(`/recherche?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleOpenCart() {
    setIsMenuOpen(false);
    openCartDrawer();
  }

  return (
    <header className="sticky top-0 z-50 bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm tracking-wide md:flex">
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/${category}`} className="hover:text-accent">
              {t(category)}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 items-center md:flex">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="w-full border-b border-mist-700 bg-transparent px-1 py-1 text-sm text-paper placeholder:text-mist-500 focus:border-accent focus:outline-none"
          />
        </form>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <Link href="/favoris" aria-label={t('favorites')} className="relative hover:text-accent">
            <HeartIcon />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px]">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <button type="button" onClick={handleOpenCart} aria-label={t('cart')} className="relative hover:text-accent">
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px]">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Menu"
          aria-expanded={isMenuOpen}
        >
          <MenuIcon />
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-mist-800 px-4 pb-6 md:hidden">
          <nav className="flex flex-col gap-4 pt-4 text-sm tracking-wide">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/${category}`}
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-accent"
              >
                {t(category)}
              </Link>
            ))}
          </nav>
          <form onSubmit={handleSearchSubmit} className="mt-4">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="w-full border-b border-mist-700 bg-transparent px-1 py-2 text-sm text-paper placeholder:text-mist-500 focus:border-accent focus:outline-none"
            />
          </form>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <Link href="/favoris" onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
              {t('favorites')} {favoriteIds.length > 0 && `(${favoriteIds.length})`}
            </Link>
            <button type="button" onClick={handleOpenCart} className="hover:text-accent">
              {t('cart')} {itemCount > 0 && `(${itemCount})`}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 5: Wire CartDrawerProvider and CartDrawer into the locale layout**

Modify `src/app/[locale]/layout.tsx` so the providers/body section reads:

```tsx
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider initialLocale={locale}>
            <CartProvider>
              <FavoritesProvider>
                <CartDrawerProvider>
                  <Header />
                  <main>{children}</main>
                  <Footer />
                  <CookieBanner />
                  <CartDrawer />
                </CartDrawerProvider>
              </FavoritesProvider>
            </CartProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
```

Add the two new imports at the top of the file: `import { CartDrawerProvider } from '@/context/CartDrawerContext';` and `import { CartDrawer } from '@/components/cart/CartDrawer';`.

- [ ] **Step 6: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr`:
- Clicking the bag icon opens the drawer with "Votre panier est vide." (no add-to-cart UI exists yet — that lands in Task 15 — so verify the empty state and that the overlay/close button work).
- Clicking the overlay or the × closes the drawer.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/context/CartDrawerContext.tsx src/components/cart/CartDrawer.tsx src/components/layout/Header.tsx messages/fr.json messages/en.json src/app/[locale]/layout.tsx
git commit -m "feat: add cart drawer opened from the header bag icon"
```

---

### Task 13: Home page

**Files:**
- Create: `src/components/product/ProductCard.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `home` and `product` namespaces)
- Modify: `src/app/[locale]/page.tsx` (replace the Task 3 placeholder with the real Home page)

**Interfaces:**
- Consumes: `Container`/`Heading`/`PlaceholderBlock` (Task 8), `useCurrency`/`formatPrice` (Task 5), `useFavorites` (Task 7), `CATEGORIES`/`PRODUCTS` (Task 4), `Link` (Task 3).
- Produces: `<ProductCard product={Product} />` — reused as-is by Tasks 14, 15, and 17.

- [ ] **Step 1: Add the home and product message namespaces**

Add to `messages/fr.json` (alongside the existing keys):

```json
  "home": {
    "heroKicker": "Collection Automne 2026",
    "heroTitle": "Une silhouette qui s'impose",
    "heroSubtitle": "Vêtements et accessoires pensés pour durer, façonnés pour marquer.",
    "categoriesTitle": "Explorer par catégorie",
    "newArrivalsTitle": "Nouveautés",
    "editorialTitle": "L'exigence comme signature",
    "editorialBody": "Chaque pièce Reign naît d'un choix : celui de la matière, de la coupe, du détail qui ne se voit pas mais se ressent."
  },
  "product": {
    "toggleFavorite": "Ajouter aux favoris",
    "new": "Nouveau"
  }
```

Add to `messages/en.json` (alongside the existing keys):

```json
  "home": {
    "heroKicker": "Fall 2026 Collection",
    "heroTitle": "A silhouette that commands",
    "heroSubtitle": "Clothing and accessories built to last, shaped to leave a mark.",
    "categoriesTitle": "Shop by category",
    "newArrivalsTitle": "New Arrivals",
    "editorialTitle": "Precision as a signature",
    "editorialBody": "Every Reign piece starts with a choice: the fabric, the cut, the detail you don't see but always feel."
  },
  "product": {
    "toggleFavorite": "Add to favorites",
    "new": "New"
  }
```

- [ ] **Step 2: Implement ProductCard**

Create `src/components/product/ProductCard.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/lib/products';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/currency';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const { currency } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  return (
    <div className="group relative">
      <Link href={`/produit/${product.slug}`} className="block">
        <PlaceholderBlock aspect="portrait" />
        <div className="mt-3">
          <h3 className="text-sm">{product.name[locale]}</h3>
          <p className="mt-1 text-sm text-mist-600">{formatPrice(product.priceEur, currency, locale)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(product.id)}
        aria-label={t('toggleFavorite')}
        aria-pressed={favorite}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/80 text-ink hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={favorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
        </svg>
      </button>
      {product.isNew && (
        <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] uppercase tracking-widest text-paper">
          {t('new')}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement the Home page**

Replace the contents of `src/app/[locale]/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES, PRODUCTS } from '@/lib/products';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const newArrivals = PRODUCTS.filter((product) => product.isNew).slice(0, 4);

  return (
    <>
      <section className="relative">
        <PlaceholderBlock aspect="wide" className="w-full" />
        <div className="absolute inset-0 flex flex-col items-start justify-end bg-ink/20 p-8 text-paper md:p-16">
          <p className="text-xs uppercase tracking-[0.3em]">{t('heroKicker')}</p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl md:text-6xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-md text-sm md:text-base">{t('heroSubtitle')}</p>
        </div>
      </section>

      <Container className="py-16">
        <Heading level={2}>{t('categoriesTitle')}</Heading>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/${category}`} className="group">
              <PlaceholderBlock aspect="portrait" />
              <p className="mt-3 text-center text-sm tracking-wide">{tNav(category)}</p>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="py-16">
        <Heading level={2}>{t('newArrivalsTitle')}</Heading>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>

      <section className="relative">
        <PlaceholderBlock aspect="wide" className="w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-paper">
          <h2 className="max-w-2xl font-serif text-3xl md:text-4xl">{t('editorialTitle')}</h2>
          <p className="mt-4 max-w-xl text-sm md:text-base">{t('editorialBody')}</p>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr`:
- Hero, the 4-category grid, a "Nouveautés" grid of 4 products, and the editorial banner all render.
- Clicking the heart icon on a product card toggles it and updates the Header's favorites count (Task 10).
- Category grid links still 404 for now (expected until Task 14).
- Switch to `/en` and confirm every string above is in English.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/product/ProductCard.tsx messages/fr.json messages/en.json src/app/[locale]/page.tsx
git commit -m "feat: build the Home page with hero, categories, new arrivals, editorial banner"
```

---

### Task 14: Category listing page (PLP) + filters, 4 categories

**Files:**
- Create: `src/lib/productFilters.ts`
- Test: `src/lib/productFilters.test.ts`
- Create: `src/components/product/CategoryFilters.tsx`
- Create: `src/app/[locale]/[category]/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `category` namespace)

**Interfaces:**
- Consumes: `getProductsByCategory`/`CATEGORIES`/`Category` (Task 4), `ProductCard` (Task 13), `Container`/`Heading` (Task 8).
- Produces: `filterAndSortProducts(products, params)`, `getAvailableSubcategories/Sizes/Colors(products)` from `src/lib/productFilters.ts` — this is the one dynamic route serving all four categories (`/homme`, `/femme`, `/enfant`, `/accessoires`); it lives at the same tree level as the static route folders built in later tasks (`contact/`, `favoris/`, etc.), and Next.js always resolves a matching static folder before falling back to a dynamic `[category]` segment, so there is no routing conflict.

- [ ] **Step 1: Write the failing tests for the filter/sort logic**

Create `src/lib/productFilters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  filterAndSortProducts,
  getAvailableSubcategories,
  getAvailableSizes,
  getAvailableColors
} from './productFilters';
import { getProductsByCategory } from './products';

const homme = getProductsByCategory('homme');

describe('filterAndSortProducts', () => {
  it('returns all products when no filters are given', () => {
    expect(filterAndSortProducts(homme, {})).toHaveLength(homme.length);
  });

  it('filters by subcategory', () => {
    const result = filterAndSortProducts(homme, { subcategory: 'vestes' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.subcategory === 'vestes')).toBe(true);
  });

  it('filters by size', () => {
    const result = filterAndSortProducts(homme, { size: 'XS' });
    expect(result.every((p) => p.sizes.includes('XS'))).toBe(true);
  });

  it('filters by color', () => {
    const result = filterAndSortProducts(homme, { color: 'Noir' });
    expect(result.every((p) => p.colors.includes('Noir'))).toBe(true);
  });

  it('sorts by ascending price', () => {
    const result = filterAndSortProducts(homme, { sort: 'price-asc' });
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].priceEur).toBeGreaterThanOrEqual(result[i - 1].priceEur);
    }
  });

  it('sorts by descending price', () => {
    const result = filterAndSortProducts(homme, { sort: 'price-desc' });
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].priceEur).toBeLessThanOrEqual(result[i - 1].priceEur);
    }
  });

  it('combines a subcategory filter with a sort', () => {
    const result = filterAndSortProducts(homme, { subcategory: 't-shirts', sort: 'price-asc' });
    expect(result.every((p) => p.subcategory === 't-shirts')).toBe(true);
  });
});

describe('getAvailableSubcategories/Sizes/Colors', () => {
  it('returns unique subcategories present in the given products', () => {
    const subcats = getAvailableSubcategories(homme);
    expect(new Set(subcats).size).toBe(subcats.length);
  });

  it('returns unique sizes present in the given products', () => {
    const sizes = getAvailableSizes(homme);
    expect(new Set(sizes).size).toBe(sizes.length);
  });

  it('returns unique colors present in the given products', () => {
    const colors = getAvailableColors(homme);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/productFilters.test.ts`
Expected: FAIL — `productFilters.ts` does not exist yet.

- [ ] **Step 3: Implement the filter/sort logic**

Create `src/lib/productFilters.ts`:

```ts
import type { Product } from './products';

export interface ProductFilterParams {
  subcategory?: string;
  size?: string;
  color?: string;
  sort?: 'price-asc' | 'price-desc' | 'newest';
}

export function filterAndSortProducts(products: Product[], params: ProductFilterParams): Product[] {
  let result = products;

  if (params.subcategory) {
    result = result.filter((p) => p.subcategory === params.subcategory);
  }
  if (params.size) {
    result = result.filter((p) => p.sizes.includes(params.size as string));
  }
  if (params.color) {
    result = result.filter((p) => p.colors.includes(params.color as string));
  }

  const sorted = [...result];
  if (params.sort === 'price-asc') {
    sorted.sort((a, b) => a.priceEur - b.priceEur);
  } else if (params.sort === 'price-desc') {
    sorted.sort((a, b) => b.priceEur - a.priceEur);
  } else if (params.sort === 'newest') {
    sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  }

  return sorted;
}

export function getAvailableSubcategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.subcategory)));
}

export function getAvailableSizes(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.sizes)));
}

export function getAvailableColors(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.colors)));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/productFilters.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the category message namespace**

Add to `messages/fr.json`:

```json
  "category": {
    "title": {
      "homme": "Homme",
      "femme": "Femme",
      "enfant": "Enfant",
      "accessoires": "Accessoires"
    },
    "filterSubcategory": "Sous-catégorie",
    "allSubcategories": "Toutes les sous-catégories",
    "filterSize": "Taille",
    "allSizes": "Toutes les tailles",
    "filterColor": "Couleur",
    "allColors": "Toutes les couleurs",
    "sortBy": "Trier par",
    "sortDefault": "Par défaut",
    "sortPriceAsc": "Prix croissant",
    "sortPriceDesc": "Prix décroissant",
    "sortNewest": "Nouveautés",
    "empty": "Aucun article ne correspond à ces filtres."
  }
```

Add to `messages/en.json`:

```json
  "category": {
    "title": {
      "homme": "Men",
      "femme": "Women",
      "enfant": "Kids",
      "accessoires": "Accessories"
    },
    "filterSubcategory": "Subcategory",
    "allSubcategories": "All subcategories",
    "filterSize": "Size",
    "allSizes": "All sizes",
    "filterColor": "Color",
    "allColors": "All colors",
    "sortBy": "Sort by",
    "sortDefault": "Default",
    "sortPriceAsc": "Price: low to high",
    "sortPriceDesc": "Price: high to low",
    "sortNewest": "Newest",
    "empty": "No items match these filters."
  }
```

- [ ] **Step 6: Implement the filter controls**

Create `src/components/product/CategoryFilters.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Product } from '@/lib/products';
import { getAvailableColors, getAvailableSizes, getAvailableSubcategories } from '@/lib/productFilters';

export function CategoryFilters({ products }: { products: Product[] }) {
  const t = useTranslations('category');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const subcategories = getAvailableSubcategories(products);
  const sizes = getAvailableSizes(products);
  const colors = getAvailableColors(products);

  function updateParam(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  return (
    <div className="mt-8 flex flex-wrap gap-4 text-sm">
      <select
        aria-label={t('filterSubcategory')}
        value={searchParams.get('subcategory') ?? ''}
        onChange={(event) => updateParam('subcategory', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('allSubcategories')}</option>
        {subcategories.map((subcategory) => (
          <option key={subcategory} value={subcategory}>
            {subcategory}
          </option>
        ))}
      </select>

      <select
        aria-label={t('filterSize')}
        value={searchParams.get('size') ?? ''}
        onChange={(event) => updateParam('size', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('allSizes')}</option>
        {sizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <select
        aria-label={t('filterColor')}
        value={searchParams.get('color') ?? ''}
        onChange={(event) => updateParam('color', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('allColors')}</option>
        {colors.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      <select
        aria-label={t('sortBy')}
        value={searchParams.get('sort') ?? ''}
        onChange={(event) => updateParam('sort', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('sortDefault')}</option>
        <option value="price-asc">{t('sortPriceAsc')}</option>
        <option value="price-desc">{t('sortPriceDesc')}</option>
        <option value="newest">{t('sortNewest')}</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 7: Implement the category page**

Create `src/app/[locale]/[category]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { CATEGORIES, type Category, getProductsByCategory } from '@/lib/products';
import { filterAndSortProducts, type ProductFilterParams } from '@/lib/productFilters';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryFilters } from '@/components/product/CategoryFilters';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => CATEGORIES.map((category) => ({ locale, category })));
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!CATEGORIES.includes(category as Category)) {
    notFound();
  }

  const sp = await searchParams;
  const t = await getTranslations('category');
  const allProducts = getProductsByCategory(category as Category);

  const filterParams: ProductFilterParams = {
    subcategory: typeof sp.subcategory === 'string' ? sp.subcategory : undefined,
    size: typeof sp.size === 'string' ? sp.size : undefined,
    color: typeof sp.color === 'string' ? sp.color : undefined,
    sort: typeof sp.sort === 'string' ? (sp.sort as ProductFilterParams['sort']) : undefined
  };
  const products = filterAndSortProducts(allProducts, filterParams);

  return (
    <Container className="py-12">
      <Heading level={1}>{t(`title.${category}`)}</Heading>
      <CategoryFilters products={allProducts} />
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && <p className="mt-12 text-center text-mist-500">{t('empty')}</p>}
    </Container>
  );
}
```

- [ ] **Step 8: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/homme`:
- The 4 seeded homme products render as cards.
- Changing each filter/sort `<select>` updates the URL query string and the visible product grid.
- Visit `/fr/femme`, `/fr/enfant`, `/fr/accessoires` — same template, correct products for each.
- Visit `/fr/does-not-exist` — expect a 404.

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add src/lib/productFilters.ts src/lib/productFilters.test.ts src/components/product/CategoryFilters.tsx src/app/[locale]/[category]/page.tsx messages/fr.json messages/en.json
git commit -m "feat: add category listing page with subcategory/size/color/sort filters"
```

---

### Task 15: Product detail page (PDP)

**Files:**
- Create: `src/components/product/ProductGallery.tsx`
- Create: `src/components/product/ProductDetailView.tsx`
- Create: `src/app/[locale]/produit/[slug]/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add to the existing `product` namespace)

**Interfaces:**
- Consumes: `getProductBySlug`/`getRelatedProducts`/`PRODUCTS` (Task 4), `useCart` (Task 6), `useCartDrawer` (Task 12), `useCurrency`/`formatPrice` (Task 5), `useFavorites` (Task 7), `ProductCard` (Task 13), `Button`/`Heading`/`Container` (Task 8).
- Produces: the `/produit/[slug]` route used by every `ProductCard` link built so far.

- [ ] **Step 1: Add the remaining product message keys**

Add these keys inside the existing `product` object in `messages/fr.json` (alongside `toggleFavorite` and `new` from Task 13):

```json
    "size": "Taille",
    "color": "Couleur",
    "quantity": "Quantité",
    "addToCart": "Ajouter au panier",
    "relatedProducts": "Vous aimerez aussi"
```

Add these keys inside the existing `product` object in `messages/en.json`:

```json
    "size": "Size",
    "color": "Color",
    "quantity": "Quantity",
    "addToCart": "Add to cart",
    "relatedProducts": "You may also like"
```

- [ ] **Step 2: Implement the gallery**

Create `src/components/product/ProductGallery.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function ProductGallery({ imageCount, productName }: { imageCount: number; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = Array.from({ length: imageCount }, (_, index) => index);

  return (
    <div>
      <PlaceholderBlock aspect="portrait" label={`${productName} — ${activeIndex + 1}/${imageCount}`} />
      <div className="mt-4 flex gap-2">
        {images.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${productName} ${index + 1}`}
            aria-pressed={activeIndex === index}
            className={`h-16 w-12 flex-shrink-0 ${index === activeIndex ? 'ring-2 ring-accent' : ''}`}
          >
            <PlaceholderBlock aspect="portrait" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement the interactive detail view**

Create `src/components/product/ProductDetailView.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';

export function ProductDetailView({
  product,
  relatedProducts
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);

  function handleAddToCart() {
    addItem({ productId: product.id, size, color, quantity });
    openCartDrawer();
  }

  return (
    <div>
      <div className="grid gap-12 md:grid-cols-2">
        <ProductGallery imageCount={product.imageCount} productName={product.name[locale]} />

        <div>
          <Heading level={1}>{product.name[locale]}</Heading>
          <p className="mt-2 text-lg">{formatPrice(product.priceEur, currency, locale)}</p>
          <p className="mt-6 text-sm text-mist-700">{product.description[locale]}</p>

          <div className="mt-8">
            <label htmlFor="size" className="text-sm font-medium">
              {t('size')}
            </label>
            <select
              id="size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            >
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="color" className="text-sm font-medium">
              {t('color')}
            </label>
            <select
              id="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            >
              {product.colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="quantity" className="text-sm font-medium">
              {t('quantity')}
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              className="mt-2 block w-24 border border-mist-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-8 flex gap-3">
            <Button onClick={handleAddToCart} className="flex-1">
              {t('addToCart')}
            </Button>
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              aria-pressed={isFavorite(product.id)}
              aria-label={t('toggleFavorite')}
              className="flex h-12 w-12 items-center justify-center border border-mist-300 hover:border-accent hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={isFavorite(product.id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <Heading level={2}>{t('relatedProducts')}</Heading>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement the page**

Create `src/app/[locale]/produit/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PRODUCTS, getProductBySlug, getRelatedProducts } from '@/lib/products';
import { routing } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { ProductDetailView } from '@/components/product/ProductDetailView';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PRODUCTS.map((product) => ({ locale, slug: product.slug })));
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

  return (
    <Container className="py-12">
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </Container>
  );
}
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/produit/homme-veste-oversize`:
- Gallery thumbnails switch the main placeholder's label.
- Changing size/color updates the selects; changing quantity accepts only positive integers.
- "Ajouter au panier" adds the line to the cart and opens the drawer (Task 12) with the correct product, size, color, quantity, and price.
- The heart button toggles favorites and is reflected on the Header's badge (Task 10).
- The related-products grid shows the two products referenced by `relatedProductIds` (`homme-pantalon-droit`, `homme-chemise-col-mao`).
- Visit `/fr/produit/does-not-exist` — expect a 404.

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/components/product/ProductGallery.tsx src/components/product/ProductDetailView.tsx src/app/[locale]/produit messages/fr.json messages/en.json
git commit -m "feat: add product detail page with variant selection and add-to-cart"
```

---

### Task 16: Search results page

**Files:**
- Create: `src/app/[locale]/recherche/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `search` namespace)

**Interfaces:**
- Consumes: `searchProducts` (Task 4, already tested), `ProductCard` (Task 13), `Container`/`Heading` (Task 8). Reached from the Header's search form (Task 10), which submits to `/recherche?q=...`.
- Produces: the `/recherche` route.

- [ ] **Step 1: Add the search message namespace**

Add to `messages/fr.json`:

```json
  "search": {
    "title": "Recherche",
    "resultsFor": "Résultats pour « {query} »",
    "noQuery": "Entrez un mot-clé pour rechercher un article.",
    "empty": "Aucun résultat pour cette recherche."
  }
```

Add to `messages/en.json`:

```json
  "search": {
    "title": "Search",
    "resultsFor": "Results for \"{query}\"",
    "noQuery": "Enter a keyword to search for an item.",
    "empty": "No results for this search."
  }
```

- [ ] **Step 2: Implement the search page**

Create `src/app/[locale]/recherche/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/products';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';

export default async function SearchPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const t = await getTranslations('search');
  const query = q?.trim() ?? '';
  const results = query ? searchProducts(query, locale as 'fr' | 'en') : [];

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{query ? t('resultsFor', { query }) : t('noQuery')}</p>

      {query && results.length === 0 && <p className="mt-12 text-center text-mist-500">{t('empty')}</p>}

      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`:
- Visit `http://localhost:3000/fr/recherche` (no query) — expect the "entrez un mot-clé" prompt and no results grid.
- Visit `http://localhost:3000/fr/recherche?q=veste` — expect at least the oversized jacket to appear.
- Use the Header's search field (Task 10) and confirm it navigates here with the typed query.
- Visit `http://localhost:3000/fr/recherche?q=zzznomatch` — expect the "aucun résultat" message.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/recherche messages/fr.json messages/en.json
git commit -m "feat: add search results page"
```

---

### Task 17: Favorites page

**Files:**
- Create: `src/app/[locale]/favoris/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `favorites` namespace)

**Interfaces:**
- Consumes: `useFavorites` (Task 7), `getProductById` (Task 4), `ProductCard` (Task 13), `Container`/`Heading` (Task 8).
- Produces: the `/favoris` route linked from the Header (Task 10).

- [ ] **Step 1: Add the favorites message namespace**

Add to `messages/fr.json`:

```json
  "favorites": {
    "title": "Favoris",
    "empty": "Vous n'avez pas encore ajouté de favoris."
  }
```

Add to `messages/en.json`:

```json
  "favorites": {
    "title": "Favorites",
    "empty": "You haven't added any favorites yet."
  }
```

- [ ] **Step 2: Implement the Favorites page**

Create `src/app/[locale]/favoris/page.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFavorites } from '@/context/FavoritesContext';
import { getProductById } from '@/lib/products';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { favoriteIds } = useFavorites();
  const products = favoriteIds
    .map((id) => getProductById(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      {products.length === 0 ? (
        <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
```

This is a Client Component page (no `params`/server data needed) since favorites live entirely in `localStorage` via `useFavorites()`.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/favoris` with no favorites — expect the empty-state message. Favorite a couple of products from the Home page or a category page (Task 13/14), then revisit `/fr/favoris` — expect those exact products to appear as cards, with working heart-toggle (unfavoriting from this page removes the card immediately since it re-reads `favoriteIds`).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/favoris messages/fr.json messages/en.json
git commit -m "feat: add favorites page"
```

---

### Task 18: Cart page

**Files:**
- Create: `src/components/cart/CartLineItem.tsx`
- Modify: `src/components/cart/CartDrawer.tsx` (reuse `CartLineItem` instead of its inline line-item markup)
- Create: `src/app/[locale]/panier/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `checkout` key to the existing `cart` namespace)

**Interfaces:**
- Consumes: `useCart` (Task 6), `useCurrency`/`formatPrice` (Task 5), `getProductById` (Task 4), `CartItem` (Task 6), `Container`/`Heading`/`Button` (Task 8).
- Produces: `<CartLineItem line={CartItem} />` (shared by the drawer and this page), the `/panier` route (linked from the Header cart icon's drawer "view cart" action and from the Cart drawer itself).

- [ ] **Step 1: Extract the shared cart line-item row**

Create `src/components/cart/CartLineItem.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { getProductById } from '@/lib/products';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import type { CartItem } from '@/lib/cart';

export function CartLineItem({ line }: { line: CartItem }) {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { currency } = useCurrency();
  const { removeItem, updateQuantity } = useCart();
  const product = getProductById(line.productId);
  if (!product) return null;

  const lineKey = `${line.productId}-${line.size}-${line.color}`;

  return (
    <li className="flex gap-4">
      <PlaceholderBlock aspect="square" className="w-20 flex-shrink-0" />
      <div className="flex flex-1 flex-col text-sm">
        <span className="font-medium">{product.name[locale]}</span>
        <span className="text-mist-500">
          {line.size} · {line.color}
        </span>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={`qty-${lineKey}`} className="sr-only">
            {t('quantity')}
          </label>
          <input
            id={`qty-${lineKey}`}
            type="number"
            min={1}
            value={line.quantity}
            onChange={(event) =>
              updateQuantity(line.productId, line.size, line.color, Math.max(1, Number(event.target.value)))
            }
            className="w-14 border border-mist-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(line.productId, line.size, line.color)}
            className="text-xs text-mist-500 underline hover:text-accent"
          >
            {t('remove')}
          </button>
        </div>
        <span className="mt-2 text-sm">{formatPrice(product.priceEur * line.quantity, currency, locale)}</span>
      </div>
    </li>
  );
}
```

- [ ] **Step 2: Simplify CartDrawer to reuse CartLineItem**

Modify `src/components/cart/CartDrawer.tsx` — replace the whole file with this version (drops the inline per-line JSX and the now-unused `getProductById` import in favor of `<CartLineItem />`):

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { CartLineItem } from './CartLineItem';

export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { isOpen, close } = useCartDrawer();
  const { items, subtotalEur } = useCart();
  const { currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t('close')} onClick={close} className="absolute inset-0 bg-ink/50" />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">{t('title')}</h2>
          <button type="button" onClick={close} aria-label={t('close')} className="text-2xl leading-none">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-6">
              {items.map((line) => (
                <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
              ))}
            </ul>

            <div className="mt-6 border-t border-mist-100 pt-4">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotalEur, currency, locale)}</span>
              </div>
              <Link href="/panier" onClick={close} className="mt-4 block">
                <Button className="w-full">{t('viewCart')}</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the checkout CTA label**

Add `"checkout": "Passer commande"` inside the existing `cart` object in `messages/fr.json`, and `"checkout": "Checkout"` inside the existing `cart` object in `messages/en.json`.

- [ ] **Step 4: Implement the Cart page**

Create `src/app/[locale]/panier/page.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CartLineItem } from '@/components/cart/CartLineItem';

export default function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { items, subtotalEur } = useCart();
  const { currency } = useCurrency();

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
      ) : (
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <ul className="space-y-8 md:col-span-2">
            {items.map((line) => (
              <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
            ))}
          </ul>

          <div className="border-t border-mist-100 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div className="flex justify-between text-sm">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(subtotalEur, currency, locale)}</span>
            </div>
            <Link href="/commande/livraison" className="mt-6 block">
              <Button className="w-full">{t('checkout')}</Button>
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`:
- Add a couple of products to the cart from a PDP (Task 15).
- Open the drawer (bag icon) — it should look and behave exactly as before (now backed by `CartLineItem`).
- Visit `http://localhost:3000/fr/panier` directly — same line items, quantities, and subtotal; changing a quantity or removing a line here updates the Header's badge too (shared `CartContext`).
- Click "Passer commande" — expect a 404 for now (the checkout route lands in Task 19).
- Empty the cart (remove all lines) and confirm the empty-state message shows.

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/components/cart/CartLineItem.tsx src/components/cart/CartDrawer.tsx src/app/[locale]/panier messages/fr.json messages/en.json
git commit -m "feat: add dedicated cart page, extract shared CartLineItem"
```

---

### Task 19: Checkout — Shipping page

**Files:**
- Create: `src/lib/checkoutValidation.ts`
- Test: `src/lib/checkoutValidation.test.ts`
- Create: `src/context/CheckoutContext.tsx`
- Create: `src/app/[locale]/commande/livraison/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `checkout` namespace)
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `Container`/`Heading`/`Button` (Task 8).
- Produces: `ShippingFormValues`, `ShippingFormErrors`, `validateShippingForm(values)` from `src/lib/checkoutValidation.ts` (Task 20 adds `PaymentFormValues`/`validatePaymentForm` to the same file); `CheckoutProvider`, `useCheckout(): { shipping, setShipping, clearShipping }` from `src/context/CheckoutContext.tsx` — consumed by the Payment page (Task 20) and Confirmation page (Task 21). Checkout is guest-only: nothing here touches an account or auth system (spec section 9).

- [ ] **Step 1: Write the failing tests for shipping validation**

Create `src/lib/checkoutValidation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateShippingForm, type ShippingFormValues } from './checkoutValidation';

const validValues: ShippingFormValues = {
  fullName: 'Alex Martin',
  email: 'alex@example.com',
  address: '12 rue de la Paix',
  city: 'Paris',
  postalCode: '75002',
  country: 'France'
};

describe('validateShippingForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validateShippingForm(validValues)).toEqual({});
  });

  it('flags a missing full name', () => {
    expect(validateShippingForm({ ...validValues, fullName: '' }).fullName).toBe('required');
  });

  it('flags a missing email', () => {
    expect(validateShippingForm({ ...validValues, email: '' }).email).toBe('required');
  });

  it('flags an invalid email format', () => {
    expect(validateShippingForm({ ...validValues, email: 'not-an-email' }).email).toBe('invalid');
  });

  it('flags each other missing field independently', () => {
    expect(validateShippingForm({ ...validValues, address: '' }).address).toBe('required');
    expect(validateShippingForm({ ...validValues, city: '' }).city).toBe('required');
    expect(validateShippingForm({ ...validValues, postalCode: '' }).postalCode).toBe('required');
    expect(validateShippingForm({ ...validValues, country: '' }).country).toBe('required');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/checkoutValidation.test.ts`
Expected: FAIL — `checkoutValidation.ts` does not exist yet.

- [ ] **Step 3: Implement shipping validation**

Create `src/lib/checkoutValidation.ts`:

```ts
export interface ShippingFormValues {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type ShippingFormErrors = Partial<Record<keyof ShippingFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateShippingForm(values: ShippingFormValues): ShippingFormErrors {
  const errors: ShippingFormErrors = {};

  if (!values.fullName.trim()) errors.fullName = 'required';

  if (!values.email.trim()) {
    errors.email = 'required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'invalid';
  }

  if (!values.address.trim()) errors.address = 'required';
  if (!values.city.trim()) errors.city = 'required';
  if (!values.postalCode.trim()) errors.postalCode = 'required';
  if (!values.country.trim()) errors.country = 'required';

  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/checkoutValidation.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the checkout message namespace**

Add to `messages/fr.json`:

```json
  "checkout": {
    "shippingTitle": "Livraison",
    "guestNotice": "Commande en tant qu'invité·e — aucune création de compte n'est nécessaire.",
    "fields": {
      "fullName": "Nom complet",
      "email": "Email",
      "address": "Adresse",
      "city": "Ville",
      "postalCode": "Code postal",
      "country": "Pays"
    },
    "errors": {
      "required": "Ce champ est requis.",
      "invalid": "Format invalide."
    },
    "continueToPayment": "Continuer vers le paiement"
  }
```

Add to `messages/en.json`:

```json
  "checkout": {
    "shippingTitle": "Shipping",
    "guestNotice": "Checking out as a guest — no account required.",
    "fields": {
      "fullName": "Full name",
      "email": "Email",
      "address": "Address",
      "city": "City",
      "postalCode": "Postal code",
      "country": "Country"
    },
    "errors": {
      "required": "This field is required.",
      "invalid": "Invalid format."
    },
    "continueToPayment": "Continue to payment"
  }
```

(Task 20 adds payment-related keys and Task 21 adds confirmation-related keys into this same `checkout` object.)

- [ ] **Step 6: Implement the checkout state context**

Create `src/context/CheckoutContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ShippingFormValues } from '@/lib/checkoutValidation';

const STORAGE_KEY = 'reign-checkout-shipping';

export interface CheckoutContextValue {
  shipping: ShippingFormValues | null;
  setShipping: (values: ShippingFormValues) => void;
  clearShipping: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [shipping, setShippingState] = useState<ShippingFormValues | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setShippingState(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    if (shipping) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [shipping]);

  return (
    <CheckoutContext.Provider
      value={{ shipping, setShipping: setShippingState, clearShipping: () => setShippingState(null) }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider');
  return ctx;
}
```

This uses `sessionStorage` (not `localStorage`) deliberately — an in-progress checkout is transient and should not survive across browser sessions the way the cart or favorites do.

- [ ] **Step 7: Wire CheckoutProvider into the locale layout**

Modify `src/app/[locale]/layout.tsx` — add the import and nest `CheckoutProvider` around the same children as `CartDrawerProvider` (order relative to the other providers does not matter, since none of them read each other's context):

```tsx
                <CartDrawerProvider>
                  <CheckoutProvider>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                    <CookieBanner />
                    <CartDrawer />
                  </CheckoutProvider>
                </CartDrawerProvider>
```

Add `import { CheckoutProvider } from '@/context/CheckoutContext';` alongside the other context imports.

- [ ] **Step 8: Implement the Shipping page**

Create `src/app/[locale]/commande/livraison/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useCheckout } from '@/context/CheckoutContext';
import { validateShippingForm, type ShippingFormValues, type ShippingFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: ShippingFormValues = {
  fullName: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  country: ''
};

export default function ShippingPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { shipping, setShipping } = useCheckout();
  const [values, setValues] = useState<ShippingFormValues>(shipping ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  function handleChange(field: keyof ShippingFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateShippingForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setShipping(values);
      router.push('/commande/paiement');
    }
  }

  const fields: (keyof ShippingFormValues)[] = ['fullName', 'email', 'address', 'city', 'postalCode', 'country'];

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('shippingTitle')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('guestNotice')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        {fields.map((name) => (
          <div key={name}>
            <label htmlFor={name} className="text-sm font-medium">
              {t(`fields.${name}`)}
            </label>
            <input
              id={name}
              type={name === 'email' ? 'email' : 'text'}
              value={values[name]}
              onChange={(event) => handleChange(name, event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
              <p id={`${name}-error`} className="mt-1 text-xs text-accent">
                {t(`errors.${errors[name]}`)}
              </p>
            )}
          </div>
        ))}

        <Button type="submit" className="w-full">
          {t('continueToPayment')}
        </Button>
      </form>
    </Container>
  );
}
```

- [ ] **Step 9: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/commande/livraison`:
- Submitting the empty form shows a "requis" error under every field.
- Typing an invalid email (e.g. `abc`) and submitting shows the "format invalide" error under email only.
- Filling every field with valid values and submitting navigates to `/fr/commande/paiement` (404 for now — Task 20).
- Reopen `/fr/commande/livraison` after a successful submit — the fields are pre-filled from `sessionStorage` (via `useCheckout()`).

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 10: Commit**

```bash
git add src/lib/checkoutValidation.ts src/lib/checkoutValidation.test.ts src/context/CheckoutContext.tsx src/app/[locale]/commande/livraison messages/fr.json messages/en.json src/app/[locale]/layout.tsx
git commit -m "feat: add guest checkout shipping step with validation"
```

---

### Task 20: Checkout — Payment page (mock)

**Files:**
- Modify: `src/lib/checkoutValidation.ts` (add payment validation alongside shipping validation)
- Modify: `src/lib/checkoutValidation.test.ts` (add payment validation tests)
- Create: `src/app/[locale]/commande/paiement/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add payment keys to the existing `checkout` namespace)

**Interfaces:**
- Consumes: `useCheckout` (Task 19), `useCart` (Task 6), `Container`/`Heading`/`Button` (Task 8).
- Produces: `PaymentFormValues`, `PaymentFormErrors`, `validatePaymentForm(values)` added to `src/lib/checkoutValidation.ts`; the `/commande/paiement` route. No real payment processor is called — submitting clears the cart and proceeds to Confirmation (Task 21), per the spec's explicit phase-1 scope.

- [ ] **Step 1: Write the failing tests for payment validation**

Add to `src/lib/checkoutValidation.test.ts` (below the existing `validateShippingForm` describe block):

```ts
import { validatePaymentForm, type PaymentFormValues } from './checkoutValidation';

const validPayment: PaymentFormValues = {
  cardName: 'Alex Martin',
  cardNumber: '4242424242424242',
  expiry: '12/28',
  cvc: '123'
};

describe('validatePaymentForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validatePaymentForm(validPayment)).toEqual({});
  });

  it('flags a missing card name', () => {
    expect(validatePaymentForm({ ...validPayment, cardName: '' }).cardName).toBe('required');
  });

  it('flags a card number that is not 16 digits', () => {
    expect(validatePaymentForm({ ...validPayment, cardNumber: '4242' }).cardNumber).toBe('invalid');
  });

  it('accepts a card number with spaces', () => {
    expect(validatePaymentForm({ ...validPayment, cardNumber: '4242 4242 4242 4242' })).toEqual({});
  });

  it('flags an expiry not in MM/YY format', () => {
    expect(validatePaymentForm({ ...validPayment, expiry: '2028-12' }).expiry).toBe('invalid');
  });

  it('flags a CVC that is not 3 or 4 digits', () => {
    expect(validatePaymentForm({ ...validPayment, cvc: '12' }).cvc).toBe('invalid');
  });
});
```

Update the top of `src/lib/checkoutValidation.test.ts` so both imports are present:

```ts
import { describe, expect, it } from 'vitest';
import {
  validateShippingForm,
  validatePaymentForm,
  type ShippingFormValues,
  type PaymentFormValues
} from './checkoutValidation';
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm run test -- src/lib/checkoutValidation.test.ts`
Expected: FAIL — `validatePaymentForm` does not exist yet.

- [ ] **Step 3: Implement payment validation**

Add to `src/lib/checkoutValidation.ts` (below the existing shipping code):

```ts
export interface PaymentFormValues {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;

const CARD_NUMBER_PATTERN = /^\d{16}$/;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVC_PATTERN = /^\d{3,4}$/;

export function validatePaymentForm(values: PaymentFormValues): PaymentFormErrors {
  const errors: PaymentFormErrors = {};

  if (!values.cardName.trim()) errors.cardName = 'required';

  const digitsOnlyCardNumber = values.cardNumber.replace(/\s/g, '');
  if (!digitsOnlyCardNumber) {
    errors.cardNumber = 'required';
  } else if (!CARD_NUMBER_PATTERN.test(digitsOnlyCardNumber)) {
    errors.cardNumber = 'invalid';
  }

  if (!values.expiry.trim()) {
    errors.expiry = 'required';
  } else if (!EXPIRY_PATTERN.test(values.expiry.trim())) {
    errors.expiry = 'invalid';
  }

  if (!values.cvc.trim()) {
    errors.cvc = 'required';
  } else if (!CVC_PATTERN.test(values.cvc.trim())) {
    errors.cvc = 'invalid';
  }

  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/checkoutValidation.test.ts`
Expected: PASS (both shipping and payment describe blocks).

- [ ] **Step 5: Add the payment message keys**

Add these keys inside the existing `checkout` object in `messages/fr.json` (alongside `shippingTitle`, `guestNotice`, `errors`, etc. from Task 19), and add `cardName`/`cardNumber`/`expiry`/`cvc` inside the existing `checkout.fields` object:

```json
    "paymentTitle": "Paiement",
    "mockNotice": "Aucun paiement réel n'est traité — ceci est une démonstration.",
    "missingShipping": "Merci de renseigner d'abord vos informations de livraison.",
    "backToShipping": "Retour à la livraison",
    "confirmPayment": "Confirmer le paiement"
```

and inside `checkout.fields`:

```json
      "cardName": "Nom sur la carte",
      "cardNumber": "Numéro de carte",
      "expiry": "Expiration",
      "cvc": "CVC"
```

Add the equivalent keys inside the existing `checkout` object in `messages/en.json`:

```json
    "paymentTitle": "Payment",
    "mockNotice": "No real payment is processed — this is a demonstration.",
    "missingShipping": "Please fill in your shipping details first.",
    "backToShipping": "Back to shipping",
    "confirmPayment": "Confirm payment"
```

and inside `checkout.fields`:

```json
      "cardName": "Name on card",
      "cardNumber": "Card number",
      "expiry": "Expiry",
      "cvc": "CVC"
```

- [ ] **Step 6: Implement the Payment page**

Create `src/app/[locale]/commande/paiement/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { validatePaymentForm, type PaymentFormValues, type PaymentFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: PaymentFormValues = { cardName: '', cardNumber: '', expiry: '', cvc: '' };

export default function PaymentPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { shipping } = useCheckout();
  const { clearCart } = useCart();
  const [values, setValues] = useState<PaymentFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<PaymentFormErrors>({});

  function handleChange(field: keyof PaymentFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validatePaymentForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      clearCart();
      router.push('/commande/confirmation');
    }
  }

  if (!shipping) {
    return (
      <Container className="max-w-xl py-12">
        <Heading level={1}>{t('paymentTitle')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('missingShipping')}</p>
        <Link href="/commande/livraison" className="mt-6 inline-block">
          <Button>{t('backToShipping')}</Button>
        </Link>
      </Container>
    );
  }

  const fields: { name: keyof PaymentFormValues; placeholder: string }[] = [
    { name: 'cardName', placeholder: '' },
    { name: 'cardNumber', placeholder: '4242 4242 4242 4242' },
    { name: 'expiry', placeholder: 'MM/AA' },
    { name: 'cvc', placeholder: '123' }
  ];

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('paymentTitle')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('mockNotice')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        {fields.map(({ name, placeholder }) => (
          <div key={name}>
            <label htmlFor={name} className="text-sm font-medium">
              {t(`fields.${name}`)}
            </label>
            <input
              id={name}
              type="text"
              placeholder={placeholder}
              value={values[name]}
              onChange={(event) => handleChange(name, event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
              <p id={`${name}-error`} className="mt-1 text-xs text-accent">
                {t(`errors.${errors[name]}`)}
              </p>
            )}
          </div>
        ))}

        <Button type="submit" className="w-full">
          {t('confirmPayment')}
        </Button>
      </form>
    </Container>
  );
}
```

- [ ] **Step 7: Verify manually**

Run: `npm run dev`:
- Visit `http://localhost:3000/fr/commande/paiement` directly without having submitted shipping first — expect the "missingShipping" fallback with a link back to `/commande/livraison`.
- Complete shipping (Task 19), land on `/fr/commande/paiement`, submit an invalid card number (e.g. `1234`) — expect the "invalide" error under card number only.
- Submit fully valid mock card values — expect navigation to `/fr/commande/confirmation` (404 for now — Task 21) and the cart to be empty afterward (check the Header badge).

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add src/lib/checkoutValidation.ts src/lib/checkoutValidation.test.ts src/app/[locale]/commande/paiement messages/fr.json messages/en.json
git commit -m "feat: add mock payment step for guest checkout"
```

---

### Task 21: Checkout — Confirmation page

**Files:**
- Create: `src/app/[locale]/commande/confirmation/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add confirmation keys to the existing `checkout` namespace)

**Interfaces:**
- Consumes: `useCheckout` (Task 19), `Container`/`Heading`/`Button` (Task 8).
- Produces: the `/commande/confirmation` route, the final step of the guest checkout flow.

- [ ] **Step 1: Add the confirmation message keys**

Add these keys inside the existing `checkout` object in `messages/fr.json`:

```json
    "confirmationTitle": "Merci pour votre commande",
    "thankYou": "Votre commande {orderNumber} est confirmée. Un email de confirmation vous sera envoyé.",
    "noOrder": "Aucune commande à afficher.",
    "backHome": "Retour à l'accueil"
```

Add these keys inside the existing `checkout` object in `messages/en.json`:

```json
    "confirmationTitle": "Thank you for your order",
    "thankYou": "Your order {orderNumber} is confirmed. A confirmation email will be sent to you.",
    "noOrder": "No order to display.",
    "backHome": "Back to home"
```

- [ ] **Step 2: Implement the Confirmation page**

Create `src/app/[locale]/commande/confirmation/page.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCheckout } from '@/context/CheckoutContext';
import type { ShippingFormValues } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

export default function ConfirmationPage() {
  const t = useTranslations('checkout');
  const { shipping, clearShipping } = useCheckout();
  const [orderNumber] = useState(() => `RG-${Date.now().toString(36).toUpperCase()}`);
  const [confirmedShipping, setConfirmedShipping] = useState<ShippingFormValues | null>(null);
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (shipping && !hasCaptured.current) {
      hasCaptured.current = true;
      setConfirmedShipping(shipping);
      clearShipping();
    }
  }, [shipping, clearShipping]);

  if (!confirmedShipping) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <Heading level={1}>{t('confirmationTitle')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('noOrder')}</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>{t('backHome')}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12 text-center">
      <Heading level={1}>{t('confirmationTitle')}</Heading>
      <p className="mt-4 text-sm text-mist-600">{t('thankYou', { orderNumber })}</p>
      <div className="mt-8 border border-mist-200 p-6 text-left text-sm">
        <p className="font-medium">{confirmedShipping.fullName}</p>
        <p>{confirmedShipping.address}</p>
        <p>
          {confirmedShipping.postalCode} {confirmedShipping.city}
        </p>
        <p>{confirmedShipping.country}</p>
      </div>
      <Link href="/" className="mt-8 inline-block">
        <Button>{t('backHome')}</Button>
      </Link>
    </Container>
  );
}
```

The `hasCaptured` ref guards against re-capturing: `CheckoutContext`'s own hydration effect (Task 19) populates `shipping` from `sessionStorage` asynchronously after this page's first render, so `confirmedShipping` is deliberately captured via an effect (once `shipping` becomes available) rather than a `useState` initializer — a `useState(shipping)` initializer would freeze on the pre-hydration `null` value and never show the real confirmation.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`:
- Visit `http://localhost:3000/fr/commande/confirmation` directly (no prior checkout) — expect the "noOrder" fallback.
- Complete the full flow: add a product to the cart → `/commande/livraison` (fill and submit) → `/commande/paiement` (fill and submit) → land on `/commande/confirmation` with a generated order number and the shipping address shown.
- Reload the confirmation page — expect it to fall back to "noOrder" (the shipping data was intentionally cleared after being displayed once).
- Confirm the cart is empty (Header badge) after this flow.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/commande/confirmation messages/fr.json messages/en.json
git commit -m "feat: add checkout confirmation page, completing the guest checkout flow"
```

---

### Task 22: About page

**Files:**
- Create: `src/app/[locale]/a-propos/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `about` namespace)

**Interfaces:**
- Consumes: `Container`/`Heading`/`PlaceholderBlock` (Task 8).
- Produces: the `/a-propos` route linked from the Footer (Task 11).

- [ ] **Step 1: Add the about message namespace**

Add to `messages/fr.json`:

```json
  "about": {
    "title": "À propos de Reign",
    "paragraph1": "Reign est née d'une conviction simple : le vêtement doit avoir de la tenue, littéralement et au figuré. Chaque collection part d'une silhouette, pas d'une tendance.",
    "paragraph2": "Nous travaillons avec un nombre volontairement restreint de matières et de fournisseurs, pour garder un contrôle total sur la coupe, la construction et la finition de chaque pièce.",
    "paragraph3": "Homme, femme, enfant, accessoires : une seule exigence traverse toutes nos catégories — que chaque pièce dure, et qu'elle s'impose."
  }
```

Add to `messages/en.json`:

```json
  "about": {
    "title": "About Reign",
    "paragraph1": "Reign was built on a simple conviction: clothing should hold its shape, literally and figuratively. Every collection starts from a silhouette, not a trend.",
    "paragraph2": "We work with a deliberately small number of materials and suppliers, to keep full control over the cut, construction, and finish of every piece.",
    "paragraph3": "Men, women, kids, accessories: one standard runs through every category — every piece is built to last, and built to command attention."
  }
```

- [ ] **Step 2: Implement the About page**

Create `src/app/[locale]/a-propos/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8 grid gap-12 md:grid-cols-2 md:items-center">
        <PlaceholderBlock aspect="portrait" />
        <div className="space-y-4 text-sm text-mist-700">
          <p>{t('paragraph1')}</p>
          <p>{t('paragraph2')}</p>
          <p>{t('paragraph3')}</p>
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/a-propos` and `http://localhost:3000/en/a-propos` — confirm the heading, placeholder image, and three paragraphs render correctly translated in each locale, and that the Footer's "À propos"/"About" link now resolves instead of 404ing.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/a-propos messages/fr.json messages/en.json
git commit -m "feat: add About page"
```

---

### Task 23: Contact page

**Files:**
- Create: `src/lib/contactValidation.ts`
- Test: `src/lib/contactValidation.test.ts`
- Create: `src/app/[locale]/contact/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `contact` namespace)

**Interfaces:**
- Consumes: `Container`/`Heading`/`Button` (Task 8).
- Produces: `ContactFormValues`, `ContactFormErrors`, `validateContactForm(values)` from `src/lib/contactValidation.ts`; the `/contact` route linked from the Footer.

- [ ] **Step 1: Write the failing tests for contact validation**

Create `src/lib/contactValidation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateContactForm, type ContactFormValues } from './contactValidation';

const validValues: ContactFormValues = {
  name: 'Alex Martin',
  email: 'alex@example.com',
  message: "Bonjour, j'aimerais des informations sur une commande."
};

describe('validateContactForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validateContactForm(validValues)).toEqual({});
  });

  it('flags a missing name', () => {
    expect(validateContactForm({ ...validValues, name: '' }).name).toBe('required');
  });

  it('flags a missing email', () => {
    expect(validateContactForm({ ...validValues, email: '' }).email).toBe('required');
  });

  it('flags an invalid email format', () => {
    expect(validateContactForm({ ...validValues, email: 'nope' }).email).toBe('invalid');
  });

  it('flags a missing message', () => {
    expect(validateContactForm({ ...validValues, message: '' }).message).toBe('required');
  });

  it('flags a message that is too short', () => {
    expect(validateContactForm({ ...validValues, message: 'hi' }).message).toBe('tooShort');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/contactValidation.test.ts`
Expected: FAIL — `contactValidation.ts` does not exist yet.

- [ ] **Step 3: Implement contact validation**

Create `src/lib/contactValidation.ts`:

```ts
export interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!values.name.trim()) errors.name = 'required';

  if (!values.email.trim()) {
    errors.email = 'required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'invalid';
  }

  if (!values.message.trim()) {
    errors.message = 'required';
  } else if (values.message.trim().length < 10) {
    errors.message = 'tooShort';
  }

  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/contactValidation.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the contact message namespace**

Add to `messages/fr.json`:

```json
  "contact": {
    "title": "Contact",
    "intro": "Une question sur une commande, une collection ou un partenariat ? Écrivez-nous.",
    "fields": {
      "name": "Nom",
      "email": "Email",
      "message": "Message"
    },
    "errors": {
      "required": "Ce champ est requis.",
      "invalid": "Format invalide.",
      "tooShort": "Votre message est trop court (10 caractères minimum)."
    },
    "submit": "Envoyer",
    "success": "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement."
  }
```

Add to `messages/en.json`:

```json
  "contact": {
    "title": "Contact",
    "intro": "A question about an order, a collection, or a partnership? Write to us.",
    "fields": {
      "name": "Name",
      "email": "Email",
      "message": "Message"
    },
    "errors": {
      "required": "This field is required.",
      "invalid": "Invalid format.",
      "tooShort": "Your message is too short (minimum 10 characters)."
    },
    "submit": "Send",
    "success": "Thank you, your message has been sent. We'll get back to you shortly."
  }
```

- [ ] **Step 6: Implement the Contact page**

Create `src/app/[locale]/contact/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateContactForm, type ContactFormValues, type ContactFormErrors } from '@/lib/contactValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: ContactFormValues = { name: '', email: '', message: '' };

export default function ContactPage() {
  const t = useTranslations('contact');
  const [values, setValues] = useState<ContactFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(field: keyof ContactFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateContactForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitted(true);
    }
  }

  if (isSubmitted) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <Heading level={1}>{t('title')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('success')}</p>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('intro')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            {t('fields.name')}
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(event) => handleChange('name', event.target.value)}
            className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-accent">{t(`errors.${errors.name}`)}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-accent">{t(`errors.${errors.email}`)}</p>}
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-medium">
            {t('fields.message')}
          </label>
          <textarea
            id="message"
            rows={5}
            value={values.message}
            onChange={(event) => handleChange('message', event.target.value)}
            className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message && <p className="mt-1 text-xs text-accent">{t(`errors.${errors.message}`)}</p>}
        </div>

        <Button type="submit" className="w-full">
          {t('submit')}
        </Button>
      </form>
    </Container>
  );
}
```

- [ ] **Step 7: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/contact`:
- Submitting empty shows "requis" under all three fields.
- An invalid email shows "format invalide" under email only.
- A message under 10 characters shows the "trop court" error.
- Valid input shows the success message in place of the form.

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add src/lib/contactValidation.ts src/lib/contactValidation.test.ts src/app/[locale]/contact messages/fr.json messages/en.json
git commit -m "feat: add Contact page with validated form"
```

---

### Task 24: FAQ / Help page

**Files:**
- Create: `src/components/ui/Accordion.tsx`
- Create: `src/app/[locale]/aide/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `faq` namespace)

**Interfaces:**
- Consumes: `Container`/`Heading` (Task 8).
- Produces: `<Accordion items={AccordionItem[]} />` (a generic reusable primitive, not FAQ-specific — usable for any future Q&A-shaped content); the `/aide` route linked from the Footer.

- [ ] **Step 1: Implement the Accordion primitive**

Create `src/components/ui/Accordion.tsx`:

```tsx
'use client';

import { useState } from 'react';

export interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-mist-100 border-y border-mist-100">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"
            >
              <span>{item.question}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <p className="pb-4 text-sm text-mist-600">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add the FAQ message namespace**

Add to `messages/fr.json`:

```json
  "faq": {
    "title": "FAQ",
    "items": [
      { "question": "Quels sont les délais de livraison ?", "answer": "Comptez 2 à 4 jours ouvrés en France, 4 à 7 jours ouvrés pour le Royaume-Uni." },
      { "question": "Puis-je retourner un article ?", "answer": "Oui, sous 30 jours à compter de la réception, dans son état d'origine. Voir notre page Livraison & Retours pour le détail." },
      { "question": "Comment connaître ma taille ?", "answer": "Consultez notre guide des tailles, accessible depuis chaque fiche produit et depuis le pied de page." },
      { "question": "Proposez-vous la livraison internationale ?", "answer": "Nous livrons actuellement en France et au Royaume-Uni. D'autres pays suivront." },
      { "question": "Comment suivre ma commande ?", "answer": "Un email de confirmation vous est envoyé après votre commande, avec le numéro de commande." }
    ]
  }
```

Add to `messages/en.json`:

```json
  "faq": {
    "title": "FAQ",
    "items": [
      { "question": "What are the delivery times?", "answer": "Allow 2 to 4 business days in France, 4 to 7 business days for the UK." },
      { "question": "Can I return an item?", "answer": "Yes, within 30 days of receipt, unworn and in its original packaging. See our Shipping & Returns page for details." },
      { "question": "How do I know my size?", "answer": "Check our size guide, accessible from every product page and from the footer." },
      { "question": "Do you ship internationally?", "answer": "We currently ship to France and the UK. More countries will follow." },
      { "question": "How do I track my order?", "answer": "A confirmation email is sent after your order, including your order number." }
    ]
  }
```

- [ ] **Step 3: Implement the FAQ page**

Create `src/app/[locale]/aide/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');
  const items = t.raw('items') as AccordionItem[];

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8">
        <Accordion items={items} />
      </div>
    </Container>
  );
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/aide`:
- All 5 questions render collapsed.
- Clicking a question expands its answer and collapses whichever other one was open; clicking it again collapses it.
- Switch to `/en/aide` and confirm the English translations.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Accordion.tsx src/app/[locale]/aide messages/fr.json messages/en.json
git commit -m "feat: add FAQ page with reusable Accordion primitive"
```

---

### Task 25: Shipping & Returns page

**Files:**
- Create: `src/app/[locale]/livraison-retours/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `shippingReturns` namespace)

**Interfaces:**
- Consumes: `Container`/`Heading` (Task 8).
- Produces: the `/livraison-retours` route linked from the Footer and referenced by the FAQ (Task 24).

- [ ] **Step 1: Add the shippingReturns message namespace**

Add to `messages/fr.json`:

```json
  "shippingReturns": {
    "title": "Livraison & Retours",
    "shippingTitle": "Livraison",
    "shippingBody": "Commandes expédiées sous 24 à 48h ouvrées. Livraison estimée : 2 à 4 jours ouvrés en France, 4 à 7 jours ouvrés au Royaume-Uni.",
    "returnsTitle": "Retours",
    "returnsBody": "Retour possible sous 30 jours à compter de la réception, article non porté et dans son emballage d'origine.",
    "exchangesTitle": "Échanges",
    "exchangesBody": "Pour un échange de taille ou de couleur, retournez l'article puis passez une nouvelle commande — le remboursement est déclenché dès réception du retour."
  }
```

Add to `messages/en.json`:

```json
  "shippingReturns": {
    "title": "Shipping & Returns",
    "shippingTitle": "Shipping",
    "shippingBody": "Orders ship within 24 to 48 business hours. Estimated delivery: 2 to 4 business days in France, 4 to 7 business days for the UK.",
    "returnsTitle": "Returns",
    "returnsBody": "Returns are accepted within 30 days of receipt, unworn and in original packaging.",
    "exchangesTitle": "Exchanges",
    "exchangesBody": "For a size or color exchange, return the item and place a new order — your refund is triggered as soon as the return is received."
  }
```

- [ ] **Step 2: Implement the Shipping & Returns page**

Create `src/app/[locale]/livraison-retours/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export default async function ShippingReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('shippingReturns');

  const sections = [
    { title: t('shippingTitle'), body: t('shippingBody') },
    { title: t('returnsTitle'), body: t('returnsBody') },
    { title: t('exchangesTitle'), body: t('exchangesBody') }
  ];

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <Heading level={2} className="text-xl">
              {section.title}
            </Heading>
            <p className="mt-2 text-sm text-mist-700">{section.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, visit `http://localhost:3000/fr/livraison-retours` and `/en/livraison-retours` — confirm the three sections (Shipping, Returns, Exchanges) render translated correctly, and that the Footer link now resolves.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/livraison-retours messages/fr.json messages/en.json
git commit -m "feat: add Shipping & Returns page"
```

---

### Task 26: Size guide page + modal

**Files:**
- Create: `src/components/product/SizeGuideTable.tsx`
- Create: `src/components/product/SizeGuideModal.tsx`
- Create: `src/app/[locale]/guide-tailles/page.tsx`
- Modify: `src/components/product/ProductDetailView.tsx` (add a size-guide trigger next to the size selector)
- Modify: `messages/fr.json`, `messages/en.json` (add `sizeGuide` namespace)

**Interfaces:**
- Consumes: `Container`/`Heading` (Task 8).
- Produces: `<SizeGuideTable />` (the measurements, presentational) and `<SizeGuideModal />` (a self-contained trigger button + modal wrapping the table) — the dedicated page renders the table directly; the PDP (Task 15) renders the modal next to its size selector, fulfilling the spec's "dedicated page + reusable modal" requirement for this content.

- [ ] **Step 1: Add the size guide message namespace**

Add to `messages/fr.json`:

```json
  "sizeGuide": {
    "title": "Guide des tailles",
    "modalTrigger": "Guide des tailles",
    "unitsNote": "Mesures en centimètres.",
    "adultsTitle": "Homme & Femme",
    "kidsTitle": "Enfant",
    "size": "Taille",
    "chest": "Tour de poitrine",
    "waist": "Tour de taille",
    "height": "Taille (hauteur)",
    "close": "Fermer"
  }
```

Add to `messages/en.json`:

```json
  "sizeGuide": {
    "title": "Size Guide",
    "modalTrigger": "Size guide",
    "unitsNote": "Measurements in centimeters.",
    "adultsTitle": "Men & Women",
    "kidsTitle": "Kids",
    "size": "Size",
    "chest": "Chest",
    "waist": "Waist",
    "height": "Height",
    "close": "Close"
  }
```

- [ ] **Step 2: Implement the measurements table**

Create `src/components/product/SizeGuideTable.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

const CLOTHING_ROWS = [
  { size: 'XS', chest: '86-90', waist: '68-72' },
  { size: 'S', chest: '91-95', waist: '73-77' },
  { size: 'M', chest: '96-100', waist: '78-82' },
  { size: 'L', chest: '101-106', waist: '83-88' },
  { size: 'XL', chest: '107-112', waist: '89-94' }
];

const KIDS_ROWS = [
  { size: '4A', height: '98-104' },
  { size: '6A', height: '110-116' },
  { size: '8A', height: '122-128' },
  { size: '10A', height: '134-140' },
  { size: '12A', height: '146-152' }
];

export function SizeGuideTable() {
  const t = useTranslations('sizeGuide');

  return (
    <div className="space-y-10">
      <div>
        <h3 className="font-serif text-lg">{t('adultsTitle')}</h3>
        <p className="mt-1 text-xs text-mist-500">{t('unitsNote')}</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-mist-200 text-left">
              <th className="py-2">{t('size')}</th>
              <th className="py-2">{t('chest')}</th>
              <th className="py-2">{t('waist')}</th>
            </tr>
          </thead>
          <tbody>
            {CLOTHING_ROWS.map((row) => (
              <tr key={row.size} className="border-b border-mist-100">
                <td className="py-2">{row.size}</td>
                <td className="py-2">{row.chest}</td>
                <td className="py-2">{row.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-serif text-lg">{t('kidsTitle')}</h3>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-mist-200 text-left">
              <th className="py-2">{t('size')}</th>
              <th className="py-2">{t('height')}</th>
            </tr>
          </thead>
          <tbody>
            {KIDS_ROWS.map((row) => (
              <tr key={row.size} className="border-b border-mist-100">
                <td className="py-2">{row.size}</td>
                <td className="py-2">{row.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement the modal wrapper**

Create `src/components/product/SizeGuideModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SizeGuideTable } from './SizeGuideTable';

export function SizeGuideModal() {
  const t = useTranslations('sizeGuide');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-mist-600 underline hover:text-accent"
      >
        {t('modalTrigger')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto bg-paper p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{t('title')}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t('close')}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mt-6">
              <SizeGuideTable />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Implement the dedicated page**

Create `src/app/[locale]/guide-tailles/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { SizeGuideTable } from '@/components/product/SizeGuideTable';

export default async function SizeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('sizeGuide');

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8">
        <SizeGuideTable />
      </div>
    </Container>
  );
}
```

- [ ] **Step 5: Wire the modal into the PDP's size selector**

Modify `src/components/product/ProductDetailView.tsx` — add the import `import { SizeGuideModal } from './SizeGuideModal';`. The file has two similarly-shaped blocks ending in `</select>\n          </div>` (size, then color, in that order) — this change targets only the **first** one, the size block. Replace this exact sequence (note the `id="size"` select and `{t('quantity')}` label that follow it, included here so the right occurrence is unambiguous):

```tsx
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="color" className="text-sm font-medium">
```

with:

```tsx
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <SizeGuideModal />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="color" className="text-sm font-medium">
```

(Only the size block's closing `</div>` gains the new `<div className="mt-2"><SizeGuideModal /></div>` — the color block right after it is unchanged.)

- [ ] **Step 6: Verify manually**

Run: `npm run dev`:
- Visit `http://localhost:3000/fr/guide-tailles` — both measurement tables render.
- Visit a PDP (e.g. `/fr/produit/homme-veste-oversize`) — a "Guide des tailles" link appears under the size selector; clicking it opens the same table in a modal, closable via the × or the overlay.
- Switch to `/en` and confirm the English labels in both the page and the modal.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/product/SizeGuideTable.tsx src/components/product/SizeGuideModal.tsx src/app/[locale]/guide-tailles src/components/product/ProductDetailView.tsx messages/fr.json messages/en.json
git commit -m "feat: add size guide page and reusable modal, wired into the PDP"
```

---

### Task 27: Legal pages x3 (mentions légales, CGV, confidentialité)

**Files:**
- Create: `src/components/legal/LegalPageLayout.tsx`
- Create: `src/app/[locale]/mentions-legales/page.tsx`
- Create: `src/app/[locale]/cgv/page.tsx`
- Create: `src/app/[locale]/confidentialite/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (add `legalNotice`, `terms`, `privacy` namespaces)

**Interfaces:**
- Consumes: `Container`/`Heading` (Task 8).
- Produces: `<LegalPageLayout title={string} paragraphs={string[]} />`, and the `/mentions-legales`, `/cgv`, `/confidentialite` routes linked from the Footer.

**Important:** the legal copy below is realistic **template** text for a fictitious brand, written for a working demo — it is not vetted legal advice. It must be reviewed and adapted by a qualified professional before any real-world launch, per the Global Constraints.

- [ ] **Step 1: Add the three legal message namespaces**

Add to `messages/fr.json`:

```json
  "legalNotice": {
    "title": "Mentions légales",
    "paragraphs": [
      "Le site Reign est édité par Reign SAS, société fictive à des fins de démonstration, au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 000 000 000.",
      "Directeur de la publication : à compléter. Contact : contact@reign.example.",
      "Hébergement : à compléter par l'hébergeur réel du site.",
      "Ce texte est un modèle générique fourni à titre indicatif. Il doit être relu et validé par un professionnel du droit avant toute mise en ligne réelle."
    ]
  },
  "terms": {
    "title": "Conditions Générales de Vente",
    "paragraphs": [
      "Les présentes conditions générales de vente régissent les commandes passées sur le site Reign entre le client et Reign SAS.",
      "Les prix sont indiqués en euros ou en livres sterling, toutes taxes comprises, hors frais de livraison précisés avant validation de la commande.",
      "Le client dispose d'un délai de rétractation de 14 jours à compter de la réception de sa commande, conformément à la réglementation applicable.",
      "Ce texte est un modèle générique fourni à titre indicatif. Il doit être relu et validé par un professionnel du droit avant toute mise en ligne réelle."
    ]
  },
  "privacy": {
    "title": "Politique de confidentialité",
    "paragraphs": [
      "Reign SAS collecte les données nécessaires au traitement des commandes (identité, adresse, email) ainsi que les préférences de langue et de devise, stockées localement dans votre navigateur.",
      "Aucune donnée de paiement n'est traitée ni conservée par ce site en phase actuelle de démonstration.",
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en nous contactant à contact@reign.example.",
      "Ce texte est un modèle générique fourni à titre indicatif. Il doit être relu et validé par un professionnel du droit avant toute mise en ligne réelle."
    ]
  }
```

Add to `messages/en.json`:

```json
  "legalNotice": {
    "title": "Legal Notice",
    "paragraphs": [
      "The Reign website is published by Reign SAS, a fictitious company for demonstration purposes, with capital of €10,000, registered with the Paris Trade Register under number 000 000 000.",
      "Publication director: to be completed. Contact: contact@reign.example.",
      "Hosting: to be completed by the site's actual host.",
      "This text is a generic template provided for illustrative purposes. It must be reviewed and approved by a qualified legal professional before any real-world launch."
    ]
  },
  "terms": {
    "title": "Terms of Sale",
    "paragraphs": [
      "These terms of sale govern orders placed on the Reign website between the customer and Reign SAS.",
      "Prices are shown in euros or pounds sterling, all taxes included, excluding delivery fees which are specified before the order is confirmed.",
      "The customer has a 14-day withdrawal period from receipt of their order, in accordance with applicable regulations.",
      "This text is a generic template provided for illustrative purposes. It must be reviewed and approved by a qualified legal professional before any real-world launch."
    ]
  },
  "privacy": {
    "title": "Privacy Policy",
    "paragraphs": [
      "Reign SAS collects the data necessary to process orders (identity, address, email) as well as language and currency preferences, stored locally in your browser.",
      "No payment data is processed or retained by this site in its current demonstration phase.",
      "In accordance with GDPR, you have the right to access, rectify, and delete your data by contacting us at contact@reign.example.",
      "This text is a generic template provided for illustrative purposes. It must be reviewed and approved by a qualified legal professional before any real-world launch."
    ]
  }
```

- [ ] **Step 2: Implement the shared legal layout**

Create `src/components/legal/LegalPageLayout.tsx`:

```tsx
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export function LegalPageLayout({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{title}</Heading>
      <div className="mt-8 space-y-4 text-sm text-mist-700">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Implement the three pages**

Create `src/app/[locale]/mentions-legales/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legalNotice');

  return <LegalPageLayout title={t('title')} paragraphs={t.raw('paragraphs') as string[]} />;
}
```

Create `src/app/[locale]/cgv/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('terms');

  return <LegalPageLayout title={t('title')} paragraphs={t.raw('paragraphs') as string[]} />;
}
```

Create `src/app/[locale]/confidentialite/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');

  return <LegalPageLayout title={t('title')} paragraphs={t.raw('paragraphs') as string[]} />;
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, visit `/fr/mentions-legales`, `/fr/cgv`, `/fr/confidentialite` and their `/en/...` equivalents — confirm each renders its title and four paragraphs, correctly translated, and that all three Footer links now resolve (every Footer link built since Task 11 now points at a real page).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/legal/LegalPageLayout.tsx src/app/[locale]/mentions-legales src/app/[locale]/cgv src/app/[locale]/confidentialite messages/fr.json messages/en.json
git commit -m "feat: add legal notice, terms of sale, and privacy policy template pages"
```

---

### Task 28: 404 page

**Files:**
- Create: `src/app/not-found.tsx` (root-level fallback, outside any locale)
- Create: `src/app/[locale]/not-found.tsx` (styled, locale-aware — used by every `notFound()` call from Tasks 14, 15, 21)
- Modify: `messages/fr.json`, `messages/en.json` (add `notFound` namespace)

**Interfaces:**
- Consumes: `Container`/`Heading`/`Button` (Task 8), `Link` (Task 3).
- Produces: the boundary rendered for any unmatched route or explicit `notFound()` call.

- [ ] **Step 1: Add the notFound message namespace**

Add to `messages/fr.json`:

```json
  "notFound": {
    "title": "Page introuvable",
    "body": "La page que vous cherchez n'existe pas ou a été déplacée.",
    "backHome": "Retour à l'accueil"
  }
```

Add to `messages/en.json`:

```json
  "notFound": {
    "title": "Page not found",
    "body": "The page you're looking for doesn't exist or has been moved.",
    "backHome": "Back to home"
  }
```

- [ ] **Step 2: Implement the locale-aware 404**

Create `src/app/[locale]/not-found.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');

  return (
    <Container className="max-w-xl py-24 text-center">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-4 text-sm text-mist-600">{t('body')}</p>
      <Link href="/" className="mt-8 inline-block">
        <Button>{t('backHome')}</Button>
      </Link>
    </Container>
  );
}
```

This renders inside `src/app/[locale]/layout.tsx` (Header/Footer included) for every `notFound()` call already used by the category page (Task 14), product page (Task 15), and the locale guard itself (Task 3).

- [ ] **Step 3: Implement the root-level fallback**

Create `src/app/not-found.tsx` (a plain, self-contained page — this only renders for requests that fail before a locale is even resolved, so it cannot rely on `next-intl` or the design tokens the way every other page does):

```tsx
export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem' }}>
        <h1>404</h1>
        <p>Page not found.</p>
        <a href="/fr">Home</a>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`:
- Visit `http://localhost:3000/fr/this-does-not-exist` — expect the styled 404 (Header/Footer present, "Page introuvable", a working "Retour à l'accueil" button).
- Visit `http://localhost:3000/en/this-does-not-exist` — same, in English.
- Visit `http://localhost:3000/de/anything` (an unconfigured locale) — expect the same locale-aware 404 (the `[locale]/layout.tsx` guard from Task 3 calls `notFound()` for unknown locales).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/not-found.tsx src/app/[locale]/not-found.tsx messages/fr.json messages/en.json
git commit -m "feat: add localized 404 page"
```

---

### Task 29: SEO foundations (metadata, hreflang, JSON-LD, sitemap, robots)

**Files:**
- Create: `src/lib/seo.ts`
- Test: `src/lib/seo.test.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `src/app/[locale]/layout.tsx` (inject site-wide Organization JSON-LD)
- Modify: `src/app/[locale]/page.tsx` (add `generateMetadata`)
- Modify: `src/app/[locale]/[category]/page.tsx` (add `generateMetadata` + BreadcrumbList JSON-LD)
- Modify: `src/app/[locale]/produit/[slug]/page.tsx` (add `generateMetadata` + Product and BreadcrumbList JSON-LD)

**Interfaces:**
- Consumes: `routing` (Task 3), `CATEGORIES`/`PRODUCTS` (Task 4).
- Produces: `buildMetadata`, `buildAlternateLanguages`, `organizationJsonLd`, `breadcrumbJsonLd`, `productJsonLd` from `src/lib/seo.ts`. Institutional pages (Tasks 22–27) keep the layout's default `<title>`/description from Task 3 — only the highest-traffic, most SEO-relevant pages (Home, category, product) get dedicated metadata and structured data in this pass; extending it to every institutional page is a small, separately-scoped follow-up if needed later.

**Note:** `SITE_URL` below is a placeholder domain (`https://www.reign-example.com`) since Reign has no real production domain yet — update this one constant once a real domain is chosen; every other function in this file derives from it.

- [ ] **Step 1: Write the failing tests for the SEO helpers**

Create `src/lib/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildAlternateLanguages, breadcrumbJsonLd, productJsonLd } from './seo';

describe('buildAlternateLanguages', () => {
  it('returns an entry for each locale plus x-default', () => {
    const result = buildAlternateLanguages('/homme');
    expect(result.fr).toContain('/fr/homme');
    expect(result.en).toContain('/en/homme');
    expect(result['x-default']).toContain('/fr/homme');
  });
});

describe('breadcrumbJsonLd', () => {
  it('builds a positioned ListItem for each entry', () => {
    const result = breadcrumbJsonLd([
      { name: 'Accueil', url: 'https://example.com/fr' },
      { name: 'Homme', url: 'https://example.com/fr/homme' }
    ]);
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
  });
});

describe('productJsonLd', () => {
  it('formats the price as a fixed 2-decimal string', () => {
    const result = productJsonLd({
      name: 'Veste',
      description: 'Une veste',
      url: 'https://example.com/fr/produit/veste',
      priceEur: 320,
      imageUrl: 'https://example.com/placeholder.png'
    });
    expect(result.offers.price).toBe('320.00');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/seo.test.ts`
Expected: FAIL — `seo.ts` does not exist yet.

- [ ] **Step 3: Implement the SEO helpers**

Create `src/lib/seo.ts`:

```ts
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export const SITE_URL = 'https://www.reign-example.com';

export function buildAlternateLanguages(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${SITE_URL}/${locale}${pathname}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${pathname}`;
  return languages;
}

export function buildMetadata({
  locale,
  pathname,
  title,
  description
}: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}${pathname}`,
      languages: buildAlternateLanguages(pathname)
    }
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Reign',
    url: SITE_URL,
    logo: `${SITE_URL}/branding/logo-reign.png`
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function productJsonLd({
  name,
  description,
  url,
  priceEur,
  imageUrl
}: {
  name: string;
  description: string;
  url: string;
  priceEur: number;
  imageUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [imageUrl],
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: priceEur.toFixed(2),
      availability: 'https://schema.org/InStock'
    }
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/seo.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the sitemap and robots routes**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CATEGORIES, PRODUCTS } from '@/lib/products';
import { SITE_URL } from '@/lib/seo';

const STATIC_PATHS = [
  '',
  '/a-propos',
  '/contact',
  '/aide',
  '/livraison-retours',
  '/guide-tailles',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
  '/favoris',
  '/panier'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${SITE_URL}/${locale}${path}` });
    }
    for (const category of CATEGORIES) {
      entries.push({ url: `${SITE_URL}/${locale}/${category}` });
    }
    for (const product of PRODUCTS) {
      entries.push({ url: `${SITE_URL}/${locale}/produit/${product.slug}` });
    }
  }

  return entries;
}
```

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
```

- [ ] **Step 6: Inject site-wide Organization JSON-LD**

Modify `src/app/[locale]/layout.tsx` — import `organizationJsonLd` from `@/lib/seo`, and add the script tag as the first child inside `<body>`, before `<NextIntlClientProvider>`:

```tsx
      <body className="bg-paper text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <NextIntlClientProvider messages={messages}>
```

- [ ] **Step 7: Add metadata to the Home page**

Modify `src/app/[locale]/page.tsx` — add this export above `HomePage` (alongside the existing `getTranslations`/`setRequestLocale` import, which already covers what's needed):

```tsx
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return buildMetadata({
    locale,
    pathname: '',
    title: `Reign — ${t('heroTitle')}`,
    description: t('heroSubtitle')
  });
}
```

- [ ] **Step 8: Add metadata and breadcrumbs to the category page**

Modify `src/app/[locale]/[category]/page.tsx` — add imports `import type { Metadata } from 'next';` and `import { buildMetadata, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';`, then add this export above `CategoryPage`:

```tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: 'category' });
  return buildMetadata({
    locale,
    pathname: `/${category}`,
    title: `${t(`title.${category}`)} — Reign`,
    description: t(`title.${category}`)
  });
}
```

Inside `CategoryPage`'s returned JSX, add the breadcrumb script as the first child of the `<Container>`:

```tsx
    <Container className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Reign', url: `${SITE_URL}/${locale}` },
              { name: t(`title.${category}`), url: `${SITE_URL}/${locale}/${category}` }
            ])
          )
        }}
      />
      <Heading level={1}>{t(`title.${category}`)}</Heading>
```

- [ ] **Step 9: Add metadata and structured data to the product page**

Modify `src/app/[locale]/produit/[slug]/page.tsx` — add imports `import type { Metadata } from 'next';` and `import { buildMetadata, breadcrumbJsonLd, productJsonLd, SITE_URL } from '@/lib/seo';`, then add this export above `ProductPage`:

```tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const localizedLocale = locale as 'fr' | 'en';
  return buildMetadata({
    locale,
    pathname: `/produit/${slug}`,
    title: `${product.name[localizedLocale]} — Reign`,
    description: product.description[localizedLocale]
  });
}
```

Modify the body of `ProductPage` to inject both JSON-LD blocks before `<ProductDetailView />`:

```tsx
  const localizedLocale = locale as 'fr' | 'en';
  const productUrl = `${SITE_URL}/${locale}/produit/${product.slug}`;

  return (
    <Container className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Reign', url: `${SITE_URL}/${locale}` },
              { name: product.category, url: `${SITE_URL}/${locale}/${product.category}` },
              { name: product.name[localizedLocale], url: productUrl }
            ])
          )
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd({
              name: product.name[localizedLocale],
              description: product.description[localizedLocale],
              url: productUrl,
              priceEur: product.priceEur,
              imageUrl: `${SITE_URL}/branding/logo-reign.png`
            })
          )
        }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </Container>
  );
```

(The `imageUrl` falls back to the brand logo since there are no real product photos in phase 1 — swap it for the real product image URL once photography is added in phase 2.)

- [ ] **Step 10: Verify manually**

Run: `npm run dev`:
- Visit `http://localhost:3000/fr` and view page source — confirm the Organization JSON-LD script is present and valid JSON.
- Visit a category and a product page, view source, and confirm their `<title>`, canonical/hreflang `<link>` tags, and JSON-LD scripts are present and well-formed (paste into a JSON validator if unsure).
- Visit `http://localhost:3000/sitemap.xml` — expect entries for every static path, category, and product, in both locales.
- Visit `http://localhost:3000/robots.txt` — expect the allow-all rule and a sitemap reference.

Run: `npm run test && npm run build`
Expected: both succeed.

- [ ] **Step 11: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts src/app/sitemap.ts src/app/robots.ts src/app/[locale]/layout.tsx src/app/[locale]/page.tsx src/app/[locale]/[category]/page.tsx src/app/[locale]/produit/[slug]/page.tsx
git commit -m "feat: add metadata, hreflang, JSON-LD, sitemap, and robots.txt"
```

---

### Task 30: Final QA pass

**Files:** none created — this task verifies the whole site built across Tasks 1–29 and fixes anything it finds. If fixes are needed, they land in whichever existing file needs the change; if nothing is found, no commit is made.

**Interfaces:**
- Consumes: the entire site built so far.
- Produces: confidence that every route, every locale, both currencies, and the full cart/checkout flow work end to end — the exit criterion for this plan.

- [ ] **Step 1: Run the automated checks**

Run, in order, and confirm each succeeds before moving to the next:

```bash
npm run test
npm run lint
npm run build
```

If any fail, fix the underlying issue in the relevant file (not by weakening a test or disabling a lint rule) and re-run until all three pass.

- [ ] **Step 2: Audit every link for 404s**

Run: `npm run dev`. Starting from `http://localhost:3000/fr`, click through: every Header nav category, the search field, the favorites and cart icons, every Footer link (À propos, Contact, FAQ, Livraison & Retours, Guide des tailles, Mentions légales, CGV, Confidentialité), the full guest checkout flow (Panier → Livraison → Paiement → Confirmation), and the "Guide des tailles" link on a PDP. None should 404 — every route referenced anywhere in the site now exists (Tasks 13–28 built all of them).

- [ ] **Step 3: Verify bilingual parity**

For at least Home, one category, one PDP, the Cart, and the Shipping step, switch between `/fr` and `/en` with the Header's language switcher and confirm every visible string is translated (no French leaking into the English version or vice versa) and the current path is preserved across the switch. Open the browser devtools console while doing this — `next-intl` logs a warning for any missing message key, so confirm the console stays clean.

- [ ] **Step 4: Verify currency behavior**

On a category page and a PDP, switch between EUR and GBP with the Header's currency switcher and confirm every displayed price recalculates using the fixed rate from `src/lib/currency.ts` (1 EUR = 0.86 GBP) and formats with the correct currency symbol for the selected currency regardless of the active language.

- [ ] **Step 5: Responsive spot-check**

Using the browser devtools device toolbar, check Home, a category listing, a PDP, the Cart, and the Shipping form at three widths: 375px (mobile), 768px (tablet), 1280px (desktop). Confirm: no horizontal scrollbar appears anywhere, the Header collapses to the hamburger menu below `md` and expands correctly, the category filter `<select>` elements and checkout forms remain fully usable (labels visible, inputs full-width) on mobile.

- [ ] **Step 6: Commit (only if Step 1 required fixes)**

```bash
git add -A
git commit -m "fix: address issues found in final QA pass"
```

If no fixes were needed, skip this step — there is nothing to commit.

---
