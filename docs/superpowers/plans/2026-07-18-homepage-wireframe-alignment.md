# Homepage Wireframe Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the already-shipped homepage (commits `adec183..b035586`) with the precise wireframe/design-system handoff (`Handoff Projet DivinExpress/`), per spec v2 (`docs/superpowers/specs/2026-07-17-divinexpress-homepage-redesign-design.md`).

**Architecture:** Update `app/styles/tokens.css` values in place (same variable names, exact new values — minimizes ripple across already-working components). Modify Header/Hero/Footer in place. Add three new components (`ProductMarquee`, `TestimonialCarousel`, `Faq`) following the existing one-component-per-folder convention. Rename the `running` category to `enfant` via a one-off data script (not a schema migration — no schema change needed). Re-wire `page.tsx` for the new section order.

**Tech Stack:** Next.js 14 App Router, TypeScript, next-intl (fr/en), Prisma + Neon Postgres, CSS Modules, `next/font/google` (Inter).

## Global Constraints

- No Tailwind — CSS Modules only.
- `@/` resolves to the repo root.
- Locale-aware links use `Link` from `@/i18n/navigation`.
- Only pure functions in `lib/*.ts` get Vitest unit tests; components and Prisma-backed code are verified via `npx tsc --noEmit`, `npm run lint`, and a manual dev-server check.
- Real contact info only: `contact@divinexpress.fr`. Never add the fabricated address/phone/legal-entity content from the wireframe.
- The currency selector is visual only — it does not convert displayed prices (no real multi-currency backend exists). The language selector IS real — it navigates to the other locale.
- Testimonials and articles remain clearly-fictional placeholder content (already-accepted pattern from the v1 build) — do not source these from a real system that doesn't exist.
- `TrustBar.tsx`'s internal item keys (`payment`, `delivery`, `returns`, `materials`) are intentionally NOT renamed even though Task 9's new message copy under those keys is now "Matières durables" / "Garantie incluse" / "Livraison rapide" / "Tissus écologiques" (the wireframe's actual 4 trust items — none of which are literally "payment" or "returns"). This is a deliberate scope trim: the key names are internal identifiers never shown to users, and renaming them would require touching `TrustBar.tsx` for a purely cosmetic code-readability win. Do not flag the key/content mismatch as a bug — it is a known, accepted simplification.
- Prisma runs against the real Neon database — there is no separate test database.

---

### Task 1: Design tokens (exact values)

**Files:**
- Modify: `app/styles/tokens.css`

**Interfaces:**
- Produces: same variable names as before, corrected/expanded values, plus new tokens (`--color-cream`, `--color-cream-soft`, `--color-brand-blue`, `--color-brand-blue-hover`, `--radius-lg`, `--radius-xl`, `--radius-circle`, `--shadow-card`, `--shadow-card-hover`, `--shadow-popover`, `--ease-standard`, `--duration-fast/base/slow`, `--container-max`, additional `--space-*` steps). Consumed by every later task in this plan.

- [ ] **Step 1: Replace the tokens file**

```css
/* app/styles/tokens.css */
:root {
  --color-black: #0c0407;
  --color-white: #ffffff;
  --color-cream: #f6f1e9;
  --color-cream-soft: #fbf8f3;
  --color-grey-light: #e5e5e5;
  --color-grey-mid: #666666;
  --color-grey-dark: #333333;
  --color-price-sale: #b3271e;
  --color-brand-blue: #3469f9;
  --color-brand-blue-hover: #1a3ab3;

  --font-sans: var(--font-inter), -apple-system, sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  --container-max: 1280px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 999px;
  --radius-circle: 50%;

  --shadow-card: 0 4px 24px rgba(12, 4, 7, 0.06);
  --shadow-card-hover: 0 12px 32px rgba(12, 4, 7, 0.1);
  --shadow-popover: 0 8px 40px rgba(12, 4, 7, 0.14);

  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;

  --heading-1-size: 56px;
  --heading-1-weight: 800;
  --heading-2-size: 32px;
  --heading-2-weight: 700;
  --heading-3-size: 24px;
  --heading-3-weight: 700;
  --body-md-size: 16px;
  --body-sm-size: 14px;
  --label-size: 12px;
  --label-tracking: 0.04em;

  --border-hairline: 1px solid rgba(12, 4, 7, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-black);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/styles/tokens.css
git commit -m "feat: update design tokens to exact handoff values"
```

---

### Task 2: Rename category `running` to `enfant`

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `Category` row with `slug: 'enfant'`, `name: 'Enfant'` (same row, same `id`, so the 4 already-attached products keep their `categoryId` unchanged). `header.enfant` message key replacing `header.running`.

- [ ] **Step 1: Rename the existing category row in place (one-off, run once against the live DB)**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.category.update({ where: { slug: 'running' }, data: { slug: 'enfant', name: 'Enfant' } })
  .then((c) => { console.log('renamed:', c.slug, c.name); return p.\$disconnect(); })
  .catch((e) => { console.error(e.message); process.exit(1); });
"
```

Expected: `renamed: enfant Enfant`

- [ ] **Step 2: Update the seed script to match (for future idempotent re-seeds)**

In `prisma/seed.ts`, change the categories array entry:

```ts
const categories = [
  { name: 'Homme', slug: 'homme' },
  { name: 'Femme', slug: 'femme' },
  { name: 'Enfant', slug: 'enfant' }
];
```

And change `categorySlug: 'running'` to `categorySlug: 'enfant'` on these 4 product entries: `coupe-vent-running-bleu`, `chaussettes-running-techniques`, `casquette-running-noire`, `sac-banane-running-noir` (only the `categorySlug` field on each — leave every other field, including the product's own slug/name/description, unchanged; these 4 stay running-branded products temporarily filed under "Enfant" as placeholder content until real kids' products exist).

- [ ] **Step 3: Re-run the seed to confirm idempotency**

```bash
npm run db:seed
```

Expected: completes with no error (the rename in Step 1 already happened, so this seed run should be a no-op update, not a duplicate-category error).

- [ ] **Step 4: Update messages**

In `messages/fr.json`, in the `header` object, replace:
```json
"running": "Running",
```
with:
```json
"enfant": "Enfant",
```

In `messages/en.json`, in the `header` object, replace:
```json
"running": "Running",
```
with:
```json
"enfant": "Kids",
```

- [ ] **Step 5: Verify against the live database**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.category.findMany().then((cats) => {
  console.log(cats.map((c) => c.slug).sort().join(','));
  return p.\$disconnect();
});
"
```

Expected: `enfant,femme,homme`

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts messages/fr.json messages/en.json
git commit -m "feat: rename running category to enfant"
```

Note: `components/Header/Header.tsx`'s `NAV_CATEGORIES` array and the `Footer`/`CategoryStrip` type casts (`'homme' | 'femme' | 'running'`) still say `running` after this task — Task 5 (Header) and Task 8 (Footer) update those alongside their other changes, so the app will not type-check cleanly until those tasks land. That's expected and fine within this plan's sequencing (this is a single-session, non-deployed branch).

---

### Task 3: ProductMarquee component (new)

**Files:**
- Create: `components/ProductMarquee/ProductMarquee.tsx`
- Create: `components/ProductMarquee/ProductMarquee.module.css`

**Interfaces:**
- Consumes: `ProductCard`, `ProductCardData` from `@/components/ProductCard/ProductCard` (existing); tokens from Task 1.
- Produces: `ProductMarquee` component with props `{ title: string; products: ProductCardData[]; locale: Locale }`, consumed by Task 9's `page.tsx` for "Nouveautés" (replacing the current static `ProductGrid` usage there — `ProductGrid` itself is untouched and stays in use for "Catalogue"/Best Sellers).

- [ ] **Step 1: Create ProductMarquee**

The product list is duplicated once so the CSS animation can loop seamlessly (translateX(-50%) with the duplicated content filling the second half).

```tsx
// components/ProductMarquee/ProductMarquee.tsx
import type { Locale } from '@/i18n';
import { ProductCard, type ProductCardData } from '../ProductCard/ProductCard';
import styles from './ProductMarquee.module.css';

export function ProductMarquee({
  title,
  products,
  locale
}: {
  title: string;
  products: ProductCardData[];
  locale: Locale;
}) {
  const looped = [...products, ...products];

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {looped.map((product, index) => (
            <div key={`${product.slug}-${index}`} className={styles.item}>
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style ProductMarquee**

```css
/* components/ProductMarquee/ProductMarquee.module.css */
.section {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-24) var(--space-8);
  overflow: hidden;
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-10);
}

.viewport {
  width: 100%;
  overflow: hidden;
}

.track {
  display: flex;
  gap: var(--space-6);
  width: max-content;
  animation: marqueeScroll 30s linear infinite;
}

.track:hover {
  animation-play-state: paused;
}

.item {
  width: 260px;
  flex: none;
}

@keyframes marqueeScroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .section {
    padding: var(--space-12) var(--space-4);
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ProductMarquee
git commit -m "feat: add ProductMarquee component"
```

---

### Task 4: TestimonialCarousel component (replaces Testimonials)

**Files:**
- Delete: `components/Testimonials/Testimonials.tsx`
- Delete: `components/Testimonials/Testimonials.module.css`
- Create: `components/TestimonialCarousel/TestimonialCarousel.tsx`
- Create: `components/TestimonialCarousel/TestimonialCarousel.module.css`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: `TestimonialCarousel` Client Component (needs `useState` for the current index — no server data dependency), consumed by Task 9's `page.tsx` in place of the old `Testimonials` import. Uses message keys `testimonials.title`, `quote1..6`/`name1..6` — the 6-item set replacing the old 3-item set is added in Task 9's message update (this task's component code references keys that exist only after Task 9 — consistent with how components 3-11 were built in the previous plan).

- [ ] **Step 1: Remove the old Testimonials component**

```bash
git rm components/Testimonials/Testimonials.tsx components/Testimonials/Testimonials.module.css
```

- [ ] **Step 2: Create TestimonialCarousel**

Shows 3 cards at a time (indices `current`, `current+1`, `current+2`, wrapping), matching the wireframe's 3-visible-of-6 carousel.

```tsx
// components/TestimonialCarousel/TestimonialCarousel.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './TestimonialCarousel.module.css';

const ITEMS = [1, 2, 3, 4, 5, 6] as const;

export function TestimonialCarousel() {
  const t = useTranslations('testimonials');
  const [index, setIndex] = useState(0);

  const visible = [0, 1, 2].map((offset) => ITEMS[(index + offset) % ITEMS.length]);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('title')}</h2>
      <div className={styles.carousel}>
        <button
          type="button"
          onClick={() => setIndex((current) => (current - 1 + ITEMS.length) % ITEMS.length)}
          className={styles.arrow}
          aria-label="Previous"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.grid}>
          {visible.map((n) => (
            <div key={n} className={styles.card}>
              <p className={styles.quote}>&ldquo;{t(`quote${n}`)}&rdquo;</p>
              <p className={styles.name}>{t(`name${n}`)}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % ITEMS.length)}
          className={styles.arrow}
          aria-label="Next"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className={styles.dots}>
        {ITEMS.map((n, i) => (
          <span
            key={n}
            onClick={() => setIndex(i)}
            className={i === index ? styles.dotActive : styles.dot}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Style TestimonialCarousel**

```css
/* components/TestimonialCarousel/TestimonialCarousel.module.css */
.section {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-24) var(--space-8);
  background: var(--color-grey-light);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-10);
}

.carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.quote {
  font-size: var(--body-md-size);
  margin: 0 0 var(--space-4);
}

.name {
  font-weight: var(--heading-3-weight);
  margin: 0;
}

.arrow {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-circle);
  background: var(--color-white);
  border: var(--border-hairline);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-black);
}

.arrow:hover {
  background: var(--color-cream);
}

.dots {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  margin-top: var(--space-6);
}

.dot,
.dotActive {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-circle);
  cursor: pointer;
  background: rgba(12, 4, 7, 0.2);
}

.dotActive {
  background: var(--color-black);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A components/Testimonials components/TestimonialCarousel
git commit -m "feat: replace Testimonials with TestimonialCarousel"
```

---

### Task 5: Faq component (new)

**Files:**
- Create: `components/Faq/Faq.tsx`
- Create: `components/Faq/Faq.module.css`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: `Faq` Client Component (accordion open/close state), consumed by Task 9's `page.tsx`. Uses message keys `faq.title`, `faq.q1..5`/`faq.a1..5` — added in Task 9.

- [ ] **Step 1: Create Faq**

```tsx
// components/Faq/Faq.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './Faq.module.css';

const ITEMS = [1, 2, 3, 4, 5] as const;

export function Faq() {
  const t = useTranslations('faq');
  const [openKey, setOpenKey] = useState<number | null>(null);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('title')}</h2>
      <div className={styles.list}>
        {ITEMS.map((n) => {
          const isOpen = openKey === n;
          return (
            <div key={n} className={styles.item}>
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : n)}
                className={styles.question}
              >
                <span className={styles.questionText}>{t(`q${n}`)}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isOpen ? styles.chevronOpen : styles.chevron}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && <p className={styles.answer}>{t(`a${n}`)}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style Faq**

```css
/* components/Faq/Faq.module.css */
.section {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-24) var(--space-8);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-10);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.question {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-grey-light);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  font-family: var(--font-sans);
  text-align: left;
}

.questionText {
  flex: 1;
  font-size: var(--body-md-size);
  color: var(--color-black);
}

.chevron,
.chevronOpen {
  flex: none;
  transition: transform var(--duration-fast) var(--ease-standard);
}

.chevronOpen {
  transform: rotate(180deg);
}

.answer {
  margin: var(--space-3) var(--space-2) 0;
  color: var(--color-grey-mid);
  font-size: var(--body-sm-size);
  line-height: 1.6;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Faq
git commit -m "feat: add Faq component"
```

---

### Task 6: Header — language/currency selectors, search toggle

**Files:**
- Modify: `components/Header/Header.tsx`
- Modify: `components/Header/Header.module.css`
- Modify: `components/Header/MessageCarousel.tsx`
- Modify: `components/Header/MessageCarousel.module.css`
- Create: `components/Header/HeaderActions.tsx`
- Create: `components/Header/HeaderActions.module.css`

**Interfaces:**
- Consumes: `usePathname`, `useRouter` from `@/i18n/navigation` (existing, not yet used by this file); `locales` from `@/i18n` (existing).
- Produces: updated `Header` (still `{ locale: Locale }` prop, unchanged signature), updated `MessageCarousel` (now takes `messages: string[]`, unchanged prop shape — only its internal markup gains arrows), and new `HeaderActions` (Client Component, rendered only by `Header`, not consumed elsewhere). All consumed by Task 9 unchanged in how `Header` itself is called.

- [ ] **Step 1: Add prev/next arrows to MessageCarousel**

```tsx
// components/Header/MessageCarousel.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './MessageCarousel.module.css';

export function MessageCarousel({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className={styles.carousel} role="status" aria-live="polite">
      <button
        type="button"
        onClick={() => setIndex((current) => (current - 1 + messages.length) % messages.length)}
        className={styles.arrow}
        aria-label="Previous"
      >
        &lsaquo;
      </button>
      <span className={styles.message}>{messages[index]}</span>
      <button
        type="button"
        onClick={() => setIndex((current) => (current + 1) % messages.length)}
        className={styles.arrow}
        aria-label="Next"
      >
        &rsaquo;
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Style MessageCarousel**

```css
/* components/Header/MessageCarousel.module.css */
.carousel {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
}

.message {
  white-space: nowrap;
}

.arrow {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.arrow:hover {
  color: #fff;
}
```

- [ ] **Step 3: Rewrite Header**

```tsx
// components/Header/Header.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { MessageCarousel } from './MessageCarousel';
import { HeaderActions } from './HeaderActions';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'enfant', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <header>
      <div className={styles.topbar}>
        <MessageCarousel messages={[t('topbarMsg1'), t('topbarMsg2'), t('topbarMsg3')]} />
      </div>
      <div className={styles.mainBar}>
        <Link href="/" locale={locale} className={styles.brand}>
          <span className={styles.logo}>DX</span>
          <span>{t('brand')}</span>
        </Link>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          {NAV_CATEGORIES.map((slug) => (
            <Link key={slug} href={`/${slug}`} locale={locale} className={styles.navLink}>
              {t(slug)}
            </Link>
          ))}
        </nav>
        <HeaderActions locale={locale} cartLabel={t('cart')} searchLabel={t('searchLabel')} accountLabel={t('accountLabel')} />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create HeaderActions (client sub-component for the search toggle + selectors)**

Splitting this out keeps `Header` itself a Server Component while isolating the interactive pieces (search toggle needs `useState`; the language select needs `usePathname`/`useRouter`).

```tsx
// components/Header/HeaderActions.tsx
'use client';

import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n';
import styles from './HeaderActions.module.css';

const CURRENCIES = ['EUR', 'GBP', 'XOF'] as const;

export function HeaderActions({
  locale,
  cartLabel,
  searchLabel,
  accountLabel
}: {
  locale: Locale;
  cartLabel: string;
  searchLabel: string;
  accountLabel: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('EUR');
  const pathname = usePathname();
  const router = useRouter();

  function submitSearch() {
    if (query.trim() === '') return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className={styles.actions}>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className={styles.select}
        aria-label="Language"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
        className={styles.select}
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {searchOpen && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder={searchLabel}
          autoFocus
          className={styles.searchInput}
        />
      )}
      <button
        type="button"
        onClick={() => setSearchOpen((open) => !open)}
        className={styles.iconLink}
        aria-label={searchLabel}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <span className={styles.iconLink} aria-label={cartLabel}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className={styles.badge}>0</span>
      </span>
      <span className={styles.iconLink} aria-label={accountLabel}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Style HeaderActions**

```css
/* components/Header/HeaderActions.module.css */
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.select {
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--label-size);
  color: var(--color-black);
}

.searchInput {
  border: none;
  border-bottom: 1px solid rgba(12, 4, 7, 0.3);
  padding: var(--space-2) var(--space-1);
  font-size: var(--body-sm-size);
  color: var(--color-black);
  width: 200px;
  font-family: var(--font-sans);
}

.searchInput:focus {
  outline: none;
}

.iconLink {
  position: relative;
  display: inline-flex;
  color: var(--color-black);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: var(--color-black);
  color: var(--color-white);
  font-size: 10px;
  line-height: 1;
  border-radius: var(--radius-full);
  padding: 3px 5px;
}
```

- [ ] **Step 6: Update Header.module.css (remove the styles that moved to HeaderActions.module.css, add container max-width)**

```css
/* components/Header/Header.module.css */
.topbar {
  background: var(--color-black);
  color: var(--color-white);
  text-align: center;
  padding: var(--space-2) var(--space-4);
}

.mainBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-4) var(--space-8);
  border-bottom: var(--border-hairline);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--heading-3-weight);
  color: var(--color-black);
  text-decoration: none;
  letter-spacing: var(--label-tracking);
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-black);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--body-sm-size);
  font-weight: var(--heading-3-weight);
}

.nav {
  display: flex;
  gap: var(--space-6);
}

.navLink {
  color: var(--color-black);
  text-decoration: none;
  font-size: var(--body-md-size);
}
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (`t('topbarMsg3')` and `t('enfant')` resolve fine even before Task 9 adds the keys — not statically checked in this project.)

- [ ] **Step 8: Commit**

```bash
git add components/Header
git commit -m "feat: add language/currency selectors and search toggle to Header"
```

---

### Task 7: Hero — new copy, pulse CTA

**Files:**
- Modify: `components/Hero/Hero.tsx`
- Modify: `components/Hero/Hero.module.css`

**Interfaces:**
- Unchanged signature: `{ locale: Locale }`. Uses `home.heroTitle`/`heroSubtitle`/`heroCtaShop`/`heroCtaCategories` (values updated in Task 9, key names unchanged from v1).

- [ ] **Step 1: Update Hero markup (container max-width, pulse wrapper on primary CTA)**

```tsx
// components/Hero/Hero.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './Hero.module.css';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');

  return (
    <section className={styles.hero}>
      <img src="https://picsum.photos/seed/divinexpress-hero/1600/900" alt="" className={styles.image} />
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>{t('heroTitle')}</h1>
        <p className={styles.subtitle}>{t('heroSubtitle')}</p>
        <div className={styles.actions}>
          <div className={styles.pulse}>
            <Link href="/homme" locale={locale} className={styles.ctaPrimary}>
              {t('heroCtaShop')} →
            </Link>
          </div>
          <a href="#categories" className={styles.ctaSecondary}>
            {t('heroCtaCategories')} →
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Restyle Hero (cream primary button, pulse animation, exact sizing)**

```css
/* components/Hero/Hero.module.css */
.hero {
  position: relative;
  min-height: 560px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--color-black);
}

.image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(12, 4, 7, 0.5), rgba(12, 4, 7, 0.1));
}

.content {
  position: relative;
  max-width: var(--container-max);
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--space-10);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.title {
  font-size: var(--heading-1-size);
  font-weight: var(--heading-1-weight);
  line-height: 1.08;
  color: var(--color-white);
  margin: 0;
  max-width: 560px;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: var(--body-md-size);
  color: var(--color-white);
  margin: 0;
  max-width: 480px;
}

.actions {
  display: flex;
  gap: var(--space-3);
}

.pulse {
  display: inline-block;
  animation: ctaPulse 2.4s ease-in-out infinite;
}

.ctaPrimary,
.ctaSecondary {
  display: inline-block;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  text-decoration: none;
  font-size: var(--body-sm-size);
  font-weight: var(--heading-3-weight);
}

.ctaPrimary {
  background: var(--color-cream);
  color: var(--color-black);
}

.ctaSecondary {
  border: 1px solid var(--color-white);
  color: var(--color-white);
}

@keyframes ctaPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Hero
git commit -m "feat: restyle Hero with pulse CTA and exact tokens"
```

---

### Task 8: Footer rearrange, category type fix, and container max-width sweep

**Files:**
- Modify: `components/Footer/Footer.tsx`
- Modify: `components/Footer/Footer.module.css`
- Modify: `components/CategoryStrip/CategoryStrip.tsx`
- Modify: `components/CategoryStrip/CategoryStrip.module.css`
- Modify: `components/TrustBar/TrustBar.module.css`
- Modify: `components/PromoBanner/PromoBanner.module.css`
- Modify: `components/ProductGrid/ProductGrid.module.css`
- Modify: `components/BlogPreview/BlogPreview.module.css`

**Interfaces:**
- `Footer`, `CategoryStrip`: unchanged props (`{ locale: Locale }`). Category type cast updated from `'homme' | 'femme' | 'running'` to `'homme' | 'femme' | 'enfant'`.

- [ ] **Step 1: Rearrange Footer to logo + nav + contact + socials**

```tsx
// components/Footer/Footer.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/catalog';
import type { Locale } from '@/i18n';
import styles from './Footer.module.css';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer');
  const tHeader = await getTranslations('header');
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <svg width="64" height="64" viewBox="0 0 100 100" className={styles.logo}>
          <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="none" stroke="#fff" strokeWidth="4" />
          <text x="50" y="60" fontSize="24" fontWeight="800" fill="#fff" textAnchor="middle">
            DX
          </text>
        </svg>
        <div className={styles.column}>
          <div className={styles.heading}>{t('navHeading')}</div>
          <Link href="/" locale={locale} className={styles.link}>
            {t('navHome')}
          </Link>
          <a href="#" className={styles.link}>
            {t('navShop')}
          </a>
          <a href="#" className={styles.link}>
            {t('navAbout')}
          </a>
          <a href="#" className={styles.link}>
            {t('navContact')}
          </a>
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('categoriesHeading')}</div>
          {categories.map((category) => (
            <Link key={category.slug} href={`/${category.slug}`} locale={locale} className={styles.link}>
              {tHeader(category.slug as 'homme' | 'femme' | 'enfant')}
            </Link>
          ))}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('contactHeading')}</div>
          <a href="mailto:contact@divinexpress.fr" className={styles.link}>
            contact@divinexpress.fr
          </a>
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.bottom}>
        <div className={styles.payments}>
          <span className={styles.paymentBadge}>Visa</span>
          <span className={styles.paymentBadge}>Mastercard</span>
          <span className={styles.paymentBadge}>PayPal</span>
        </div>
        <div className={styles.policyLinks}>
          <a href="#" className={styles.policyLink}>
            {t('utilitySizeGuide')}
          </a>
          <a href="#" className={styles.policyLink}>
            {t('utilityLegal')}
          </a>
          <a href="#" className={styles.policyLink}>
            {t('utilityTerms')}
          </a>
          <a href="#" className={styles.policyLink}>
            {t('utilityPrivacy')}
          </a>
        </div>
        <p className={styles.copyright}>{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Restyle Footer**

```css
/* components/Footer/Footer.module.css */
.footer {
  background: var(--color-black);
  color: #cccccc;
  padding: var(--space-16) var(--space-8) 0;
}

.top {
  max-width: var(--container-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr 1fr 1fr;
  gap: var(--space-10);
  align-items: start;
}

.logo {
  flex: none;
}

.heading {
  color: var(--color-white);
  font-weight: var(--heading-3-weight);
  margin-bottom: var(--space-4);
}

.link {
  display: block;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  padding: var(--space-1) 0;
  font-size: var(--body-sm-size);
}

.link:hover {
  color: var(--color-white);
}

.divider {
  max-width: var(--container-max);
  margin: var(--space-10) auto 0;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.bottom {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-6) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.payments {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}

.paymentBadge {
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-size: var(--label-size);
}

.policyLinks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  justify-content: center;
}

.policyLink {
  font-size: var(--label-size);
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
}

.policyLink:hover {
  color: var(--color-white);
}

.copyright {
  font-size: var(--label-size);
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

@media (max-width: 768px) {
  .top {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 3: Fix CategoryStrip's category type cast**

In `components/CategoryStrip/CategoryStrip.tsx`, change:
```tsx
<span className={styles.label}>{t(category.slug as 'homme' | 'femme' | 'running')}</span>
```
to:
```tsx
<span className={styles.label}>{t(category.slug as 'homme' | 'femme' | 'enfant')}</span>
```

- [ ] **Step 4: Add container max-width to TrustBar, ProductGrid, CategoryStrip, BlogPreview module CSS**

In `components/TrustBar/TrustBar.module.css`, `.bar` gains `max-width: var(--container-max); margin: 0 auto;` alongside its existing `padding`. In `components/ProductGrid/ProductGrid.module.css`, `components/CategoryStrip/CategoryStrip.module.css`, and `components/BlogPreview/BlogPreview.module.css`, `.section` gains the same two properties. Example for `ProductGrid.module.css`:

```css
.section {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-24) var(--space-8);
}
```

Apply the identical `max-width: var(--container-max); margin: 0 auto;` addition to `TrustBar.module.css`'s `.bar`, `CategoryStrip.module.css`'s `.section`, and `BlogPreview.module.css`'s `.section`, keeping every other declaration in those rules unchanged.

- [ ] **Step 5: Constrain the full-width PromoBanner to the container too**

`PromoBanner`'s `.bannerHalf` variant is always used inside a parent that already has `max-width` (the homme/sale pair's `.promoPair` wrapper in `page.module.css`, added in Task 9), but `.bannerFull` (the weekend-offer banner) is rendered directly by `page.tsx` with no wrapping container, so it would otherwise stretch full viewport width instead of the site's 1280px container. In `components/PromoBanner/PromoBanner.module.css`, add `max-width` and centering to the existing `.bannerFull` rule:

```css
.bannerFull {
  min-height: 220px;
  max-width: var(--container-max);
  margin: 0 auto var(--space-12);
}
```

(This adds to the existing `.bannerFull { min-height: 220px; }` rule — keep `min-height: 220px` and add the two new declarations alongside it; don't touch `.bannerHalf` or any other rule in this file.)

- [ ] **Step 6: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/Footer components/CategoryStrip components/TrustBar components/ProductGrid components/PromoBanner components/BlogPreview
git commit -m "feat: rearrange Footer, fix category types, add container max-width"
```

---

### Task 9: Wire up the updated homepage

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/page.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes every component from Tasks 1-8 plus the existing `getFeaturedProducts`/`getNewArrivals`/`getCategories` from `lib/catalog.ts` (unchanged).

- [ ] **Step 1: Add the Inter font and update layout.tsx**

```tsx
// app/[locale]/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { locales, type Locale } from '@/i18n';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import '@/app/styles/tokens.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'DivinExpress',
  description: 'DivinExpress — vêtements premium.'
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(params.locale as Locale)) notFound();

  setRequestLocale(params.locale);

  const messages = await getMessages();
  const locale = params.locale as Locale;

  return (
    <html lang={params.locale} className={inter.variable}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <Header locale={locale} />
          <main>{children}</main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Recompose page.tsx in the wireframe's section order**

```tsx
// app/[locale]/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getFeaturedProducts, getNewArrivals } from '@/lib/catalog';
import { Hero } from '@/components/Hero/Hero';
import { TrustBar } from '@/components/TrustBar/TrustBar';
import { PromoBanner } from '@/components/PromoBanner/PromoBanner';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { ProductMarquee } from '@/components/ProductMarquee/ProductMarquee';
import { CategoryStrip } from '@/components/CategoryStrip/CategoryStrip';
import { TestimonialCarousel } from '@/components/TestimonialCarousel/TestimonialCarousel';
import { Faq } from '@/components/Faq/Faq';
import { BlogPreview } from '@/components/BlogPreview/BlogPreview';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');

  const [featured, newArrivals] = await Promise.all([getFeaturedProducts(), getNewArrivals()]);

  return (
    <>
      <Hero locale={locale} />
      <TrustBar />
      <div className={styles.promoPair}>
        <PromoBanner
          title={t('promoHommeTitle')}
          ctaLabel={t('promoHommeCta')}
          href="/homme"
          locale={locale}
          imageSeed="divinexpress-promo-homme"
          badge={t('promoHommeBadge')}
        />
        <PromoBanner
          title={t('promoSaleTitle')}
          ctaLabel={t('promoSaleCta')}
          href="/sale"
          locale={locale}
          imageSeed="divinexpress-promo-sale"
          badge={t('promoSaleBadge')}
        />
      </div>
      <ProductGrid title={t('bestSellersTitle')} products={featured} locale={locale} />
      <CategoryStrip locale={locale} />
      <PromoBanner
        title={t('discountTitle')}
        ctaLabel={t('discountCta')}
        href="/sale"
        locale={locale}
        imageSeed="divinexpress-weekend"
        badge={t('discountBadge')}
        size="full"
      />
      <ProductMarquee title={t('newArrivalsTitle')} products={newArrivals} locale={locale} />
      <TestimonialCarousel />
      <Faq />
      <BlogPreview locale={locale} />
    </>
  );
}
```

- [ ] **Step 3: Update page.module.css (container max-width on the promo pair)**

```css
/* app/[locale]/page.module.css */
.promoPair {
  max-width: var(--container-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  padding: 0 var(--space-8) var(--space-12);
}

@media (max-width: 768px) {
  .promoPair {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Replace messages/fr.json**

```json
{
  "layout": {
    "brand": "DIVINEXPRESS",
    "footer": "Tous droits réservés."
  },
  "header": {
    "brand": "DIVINEXPRESS",
    "navLabel": "Catégories",
    "homme": "Homme",
    "femme": "Femme",
    "enfant": "Enfant",
    "sale": "Sale",
    "searchPlaceholder": "Rechercher",
    "searchLabel": "Rechercher un produit…",
    "cart": "Panier",
    "accountLabel": "Compte",
    "topbarMsg1": "Une question ? Visitez notre page « Contact »",
    "topbarMsg2": "Livraison gratuite dès 100 € partout en France",
    "topbarMsg3": "Retours gratuits sous 30 jours",
    "countrySelect": "France (EUR €)",
    "langSelect": "Français"
  },
  "home": {
    "heroTitle": "Explorez notre collection premium",
    "heroSubtitle": "Vêtements premium, livrés en France et en Afrique de l'Ouest.",
    "heroCtaShop": "Acheter",
    "heroCtaCategories": "Catégories",
    "promoHommeTitle": "Toute la collection homme",
    "promoHommeCta": "Acheter",
    "promoHommeBadge": "-20 %",
    "promoSaleTitle": "Soldes en cours",
    "promoSaleCta": "Voir les offres",
    "promoSaleBadge": "-25 %",
    "bestSellersTitle": "Catalogue",
    "categoriesTitle": "Nos catégories",
    "discountTitle": "-20 % !",
    "discountCta": "En profiter",
    "discountBadge": "Offre du week-end",
    "newArrivalsTitle": "Nouveautés",
    "blogTitle": "Articles & ressources"
  },
  "trustbar": {
    "paymentTitle": "Matières durables",
    "paymentDesc": "Nous croyons qu'un beau style ne doit pas coûter cher à la planète.",
    "deliveryTitle": "Garantie incluse",
    "deliveryDesc": "Chaque article est couvert par une garantie de 6 mois sans tracas.",
    "returnsTitle": "Livraison rapide",
    "returnsDesc": "Vos commandes sont expédiées sous 1 à 2 jours ouvrés.",
    "materialsTitle": "Tissus écologiques",
    "materialsDesc": "Conçus dans un souci de durabilité avec des matières éco-responsables."
  },
  "testimonials": {
    "title": "Ce qu'en disent nos clients",
    "quote1": "Des matières incroyables et une coupe parfaite, je recommande à 100 %.",
    "name1": "Amina K.",
    "quote2": "Livraison rapide même jusqu'en Côte d'Ivoire, service impeccable.",
    "name2": "Julien M.",
    "quote3": "Mon nouveau site préféré pour m'habiller, qualité au rendez-vous.",
    "name3": "Sophie D.",
    "quote4": "Le service client a résolu mon échange de taille en un jour. Confiance totale.",
    "name4": "Noah Girard",
    "quote5": "Des tissus premium et un style qui sort du lot. Ma référence mode.",
    "name5": "Camille Roy",
    "quote6": "Finitions soignées, livraison rapide : cette veste est devenue mon indispensable.",
    "name6": "Léa Fontaine"
  },
  "faq": {
    "title": "Des questions ?",
    "q1": "Quels sont les délais de livraison ?",
    "a1": "Chaque commande est préparée avec soin dans notre entrepôt et expédiée sous 1 à 2 jours ouvrés après confirmation du paiement. En France métropolitaine, comptez ensuite 3 à 5 jours ouvrés en livraison standard, ou 1 à 2 jours ouvrés en livraison express (option payante disponible au moment du paiement). Pour l'Afrique de l'Ouest, les délais varient généralement entre 5 et 10 jours ouvrés selon le pays et le transporteur local. Dès l'expédition de votre colis, vous recevez automatiquement un e-mail avec un numéro de suivi pour suivre l'acheminement en temps réel. La livraison standard est offerte dès 100 € d'achat ; en dessous de ce montant, des frais fixes s'appliquent et sont indiqués clairement avant validation de la commande.",
    "q2": "Comment taillent les produits ?",
    "a2": "Nos vêtements sont conçus pour tailler normalement, mais chaque coupe (ajustée, droite, oversize) peut légèrement varier d'un modèle à l'autre. C'est pourquoi chaque fiche produit propose un guide des tailles détaillé avec les mesures précises (tour de poitrine, longueur, tour de taille selon le type d'article) pour vous aider à choisir en toute confiance. En cas de doute entre deux tailles, nous recommandons généralement de prendre la taille au-dessus pour plus de confort, sauf indication contraire sur la fiche produit. Si malgré tout la taille ne convient pas à réception, notre politique d'échange gratuit sous 14 jours vous permet de changer de taille sans frais supplémentaires.",
    "q3": "Combien de temps pour effectuer un retour ?",
    "a3": "Vous disposez de 14 jours calendaires à compter de la réception de votre commande pour nous notifier votre souhait de retourner un ou plusieurs articles, sans avoir à justifier de motif particulier. L'article doit être retourné non porté, non lavé, avec toutes ses étiquettes d'origine et dans son emballage d'origine pour être accepté. Une fois votre demande validée, une étiquette de retour vous est transmise par e-mail ; le remboursement est ensuite effectué sur votre moyen de paiement initial sous 5 à 10 jours ouvrés après réception et vérification de l'article par notre entrepôt. Les articles soldés à plus de 50 % ou personnalisés ne sont ni repris ni remboursés, sauf défaut avéré.",
    "q4": "Comment entretenir les textiles ?",
    "a4": "Chaque vêtement DivinExpress est livré avec une étiquette d'entretien détaillant les instructions spécifiques à sa matière (coton, wax, tissus techniques...). En règle générale, nous recommandons un lavage à froid (30°C maximum) à la main ou en machine sur cycle délicat, l'utilisation d'une lessive douce sans agents blanchissants, et un séchage à l'air libre à plat plutôt qu'au sèche-linge pour préserver la forme et les couleurs sur la durée. Repassez à basse température et évitez le contact direct du fer avec les impressions ou broderies. Un bon entretien régulier prolonge significativement la durée de vie de vos pièces et garde les couleurs éclatantes plus longtemps.",
    "q5": "Comment vous contacter ?",
    "a5": "Notre équipe est disponible du lundi au vendredi pour répondre à toutes vos questions, que ce soit avant un achat (conseils de taille, disponibilité d'un article) ou après (suivi de commande, retour, échange). Le moyen le plus rapide de nous joindre est notre page Contact, où vous pouvez décrire votre demande en détail ; vous pouvez aussi nous écrire directement à contact@divinexpress.fr. Nous nous efforçons de répondre à chaque message sous 24 à 48 heures ouvrées. N'hésitez pas à préciser votre numéro de commande si votre question concerne un achat déjà effectué, cela nous permet de vous répondre plus rapidement."
  },
  "footer": {
    "navHeading": "Liens rapides",
    "navHome": "Accueil",
    "navShop": "Boutique",
    "navAbout": "À propos",
    "navContact": "Contact",
    "categoriesHeading": "Catégories",
    "utilitySizeGuide": "Guide des tailles",
    "utilityLegal": "Mentions légales",
    "utilityTerms": "CGV",
    "utilityPrivacy": "Politique de confidentialité",
    "contactHeading": "Contact",
    "copyright": "© {year} DivinExpress"
  },
  "plp": {
    "products": "produits",
    "showFilters": "Afficher les filtres",
    "hideFilters": "Masquer les filtres",
    "size": "Taille",
    "color": "Couleur",
    "price": "Prix",
    "colorBlack": "Noir",
    "colorWhite": "Blanc",
    "colorGrey": "Gris",
    "colorBlue": "Bleu"
  },
  "pdp": {
    "size": "Taille",
    "color": "Couleur",
    "addToBag": "Ajouter au panier"
  },
  "search": {
    "resultsFor": "Résultats pour",
    "noResults": "Aucun produit trouvé."
  }
}
```

- [ ] **Step 5: Replace messages/en.json**

```json
{
  "layout": {
    "brand": "DIVINEXPRESS",
    "footer": "All rights reserved."
  },
  "header": {
    "brand": "DIVINEXPRESS",
    "navLabel": "Categories",
    "homme": "Men",
    "femme": "Women",
    "enfant": "Kids",
    "sale": "Sale",
    "searchPlaceholder": "Search",
    "searchLabel": "Search for a product…",
    "cart": "Bag",
    "accountLabel": "Account",
    "topbarMsg1": "Any questions? Visit our 'Contact' page",
    "topbarMsg2": "Free shipping over €100 across France",
    "topbarMsg3": "Free returns within 30 days",
    "countrySelect": "France (EUR €)",
    "langSelect": "English"
  },
  "home": {
    "heroTitle": "Explore Our Premium Collection",
    "heroSubtitle": "Premium clothing, delivered across France and West Africa.",
    "heroCtaShop": "Shop Now",
    "heroCtaCategories": "Categories",
    "promoHommeTitle": "The Full Men's Collection",
    "promoHommeCta": "Shop Now",
    "promoHommeBadge": "-20%",
    "promoSaleTitle": "Sale Now On",
    "promoSaleCta": "Shop the Sale",
    "promoSaleBadge": "-25%",
    "bestSellersTitle": "Catalogue",
    "categoriesTitle": "Our Categories",
    "discountTitle": "-20%!",
    "discountCta": "Shop Now",
    "discountBadge": "Weekend Offer",
    "newArrivalsTitle": "New Arrivals",
    "blogTitle": "Articles & Resources"
  },
  "trustbar": {
    "paymentTitle": "Sustainable Materials",
    "paymentDesc": "We believe great style shouldn't come at the planet's expense.",
    "deliveryTitle": "Warranty Included",
    "deliveryDesc": "Every item is covered by a hassle-free 6-month warranty.",
    "returnsTitle": "Fast Delivery",
    "returnsDesc": "Your orders are shipped within 1-2 business days.",
    "materialsTitle": "Eco-Friendly Fabrics",
    "materialsDesc": "Designed with sustainability in mind, using eco-responsible materials."
  },
  "testimonials": {
    "title": "What People Say",
    "quote1": "Amazing fabrics and a perfect fit, I highly recommend.",
    "name1": "Amina K.",
    "quote2": "Fast delivery even to Côte d'Ivoire, impeccable service.",
    "name2": "Julien M.",
    "quote3": "My new favorite place to shop, quality every time.",
    "name3": "Sophie D.",
    "quote4": "Customer service resolved my size exchange in a day. Total confidence.",
    "name4": "Noah Girard",
    "quote5": "Premium fabrics and a style that stands out. My go-to now.",
    "name5": "Camille Roy",
    "quote6": "Great finishing, fast delivery: this jacket became my everyday piece.",
    "name6": "Léa Fontaine"
  },
  "faq": {
    "title": "Got Questions?",
    "q1": "What are the delivery times?",
    "a1": "Every order is carefully prepared in our warehouse and shipped within 1-2 business days after payment is confirmed. Within mainland France, standard delivery then takes 3-5 business days, or 1-2 business days with express shipping (a paid option available at checkout). For West Africa, delivery times generally range from 5 to 10 business days depending on the country and local carrier. As soon as your parcel ships, you'll automatically receive an email with a tracking number so you can follow it in real time. Standard shipping is free from €100 of purchases; below that, a flat fee applies and is clearly shown before you confirm your order.",
    "q2": "How do the products fit?",
    "a2": "Our clothing is designed to fit true to size, though each cut (fitted, straight, oversized) can vary slightly from one style to another. That's why every product page includes a detailed size guide with precise measurements (chest, length, waist, depending on the item) to help you choose with confidence. If you're torn between two sizes, we generally recommend sizing up for extra comfort, unless the product page says otherwise. If the size still isn't right once your order arrives, our free 14-day exchange policy lets you switch sizes at no extra cost.",
    "q3": "How long do I have to make a return?",
    "a3": "You have 14 calendar days from the date you receive your order to let us know you'd like to return one or more items, with no need to give a reason. The item must be returned unworn, unwashed, with all original tags attached and in its original packaging to be accepted. Once your request is approved, we'll email you a return label; your refund is then issued to your original payment method within 5-10 business days after our warehouse receives and inspects the returned item. Items discounted by more than 50% or personalized items cannot be returned or refunded, except in the case of a genuine defect.",
    "q4": "How should I care for the fabrics?",
    "a4": "Every DivinExpress garment comes with a care label detailing instructions specific to its fabric (cotton, wax print, technical fabrics, and so on). As a general rule, we recommend cold washing (30°C max) by hand or on a delicate machine cycle, using a mild detergent free of bleaching agents, and air-drying flat rather than tumble-drying to preserve the shape and colors over time. Iron on a low setting and avoid direct contact between the iron and any prints or embroidery. Good, regular care meaningfully extends the life of your pieces and keeps colors vibrant for longer.",
    "q5": "How can I contact you?",
    "a5": "Our team is available Monday to Friday to answer any question, whether before a purchase (sizing advice, item availability) or after (order tracking, returns, exchanges). The fastest way to reach us is via our Contact page, where you can describe your request in detail; you can also email us directly at contact@divinexpress.fr. We aim to respond to every message within 24-48 business hours. If your question relates to an order you've already placed, please include your order number so we can help you faster."
  },
  "footer": {
    "navHeading": "Quick Links",
    "navHome": "Home",
    "navShop": "Shop",
    "navAbout": "About",
    "navContact": "Contact",
    "categoriesHeading": "Categories",
    "utilitySizeGuide": "Size Guide",
    "utilityLegal": "Legal Notice",
    "utilityTerms": "Terms & Conditions",
    "utilityPrivacy": "Privacy Policy",
    "contactHeading": "Contact",
    "copyright": "© {year} DivinExpress"
  },
  "plp": {
    "products": "products",
    "showFilters": "Show filters",
    "hideFilters": "Hide filters",
    "size": "Size",
    "color": "Color",
    "price": "Price",
    "colorBlack": "Black",
    "colorWhite": "White",
    "colorGrey": "Grey",
    "colorBlue": "Blue"
  },
  "pdp": {
    "size": "Size",
    "color": "Color",
    "addToBag": "Add to Bag"
  },
  "search": {
    "resultsFor": "Results for",
    "noResults": "No products found."
  }
}
```

- [ ] **Step 6: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/layout.tsx app/[locale]/page.tsx app/[locale]/page.module.css messages/fr.json messages/en.json
git commit -m "feat: recompose homepage with wireframe section order and new content"
```

---

### Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass unchanged (no `lib/*.ts` pure functions were touched by this plan).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Production build**

```bash
npx prisma generate
npm run build
```

Expected: build completes successfully.

- [ ] **Step 4: Manual dev-server check**

```bash
npm run dev
```

Open `/fr` and confirm, top to bottom: topbar with working ‹ › arrows cycling 3 messages plus language/currency selects, header with working search toggle (click the icon, an input appears), hero with new copy and a visibly pulsing "Acheter" button, trust bar, 2 promo banners with badges, "Catalogue" grid, "Nos catégories" showing Homme/Femme/Enfant, a single "Offre du week-end" banner, "Nouveautés" auto-scrolling horizontally (and pausing on hover), a testimonial carousel with working ‹ › arrows and dots, an FAQ accordion that expands/collapses on click, "Articles & ressources", and the rearranged footer with the real `contact@divinexpress.fr` email and no fabricated address/phone. Switch the header language select to EN and confirm it navigates to `/en` with the whole page translated. Repeat spot checks on `/en`. Stop the dev server when done.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "fix: address wireframe-alignment manual verification findings"
```
