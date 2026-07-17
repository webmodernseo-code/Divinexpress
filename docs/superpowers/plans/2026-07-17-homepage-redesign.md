# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the DivinExpress homepage (`/fr`, `/en`) to match the approved SNIKEI-inspired design spec, with a shared Header/Footer/ProductCard foundation reusable by later pages.

**Architecture:** One React component per homepage section under `components/`, each with its own `.module.css`, composed by `app/[locale]/page.tsx` inside `app/[locale]/layout.tsx` (which owns Header/Footer). Server Components fetch data directly (Prisma via `lib/catalog.ts`); only `MessageCarousel` is a Client Component (rotating timer). No Tailwind — CSS Modules with shared tokens in `app/styles/tokens.css`, matching project convention.

**Tech Stack:** Next.js 14 App Router, TypeScript, next-intl (fr/en), Prisma + Neon Postgres, Vitest, CSS Modules.

## Global Constraints

- No Tailwind — CSS Modules only, per existing project convention.
- `@/` resolves to the repo root (`tsconfig.json` / `vitest.config.ts` path alias) — use it for all cross-folder imports.
- Locale-aware links use `Link` from `@/i18n/navigation`, not `next/link`.
- Server Components call `getTranslations(namespace)` from `next-intl/server`; it uses the request-scoped locale already set by `setRequestLocale` — do not pass `locale` as a prop just to read translations. Only pass `locale` where it's needed for `<Link locale={locale}>`.
- Prisma runs against the real Neon database (`DATABASE_URL` in `.env`) — there is no separate test database in this project. `prisma/seed.ts` uses `upsert`, so re-running `npm run db:seed` is always safe.
- Only pure functions in `lib/*.ts` get Vitest unit tests, matching existing convention (`lib/filters.test.ts`, `lib/pricing.test.ts`, `lib/i18n-utils.test.ts`, `lib/currency.test.ts`). Prisma-backed functions in `lib/catalog.ts` and all React components are verified via `npx tsc --noEmit`, `npm run lint`, and a manual dev-server check — they are not unit tested, matching the existing `getCategories`/`getProductsByCategory`/`searchProducts` precedent.
- Placeholder photography: `https://picsum.photos/seed/<stable-seed>/<w>/<h>` (deterministic per seed, no API key, safe to hotlink) — every usage is a placeholder to be swapped for real product photography later.
- Real contact info only: footer email is `contact@divinexpress.fr` (confirmed working). Never invent a phone number or a physical store address.
- Tasks 3–11 (component tasks) only depend on Task 1 (tokens) and existing `lib/` files — they don't depend on each other and can be built in any order or in parallel.

---

### Task 1: Design tokens

**Files:**
- Create: `app/styles/tokens.css`

**Interfaces:**
- Produces: CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--heading-*`, `--body-*`, `--label-*`, `--border-hairline`) consumed by every component task's `.module.css`.

- [ ] **Step 1: Create the tokens file**

```css
:root {
  --color-black: #111111;
  --color-white: #ffffff;
  --color-beige: #d9c7ae;
  --color-grey-light: #f2f2f2;
  --color-grey-mid: #888888;
  --color-price-sale: #c0392b;

  --font-sans: 'Helvetica Neue', Arial, sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-full: 999px;

  --heading-1-size: 48px;
  --heading-1-weight: 800;
  --heading-2-size: 32px;
  --heading-2-weight: 700;
  --heading-3-size: 22px;
  --heading-3-weight: 700;
  --body-md-size: 16px;
  --body-sm-size: 14px;
  --label-size: 12px;
  --label-tracking: 0.04em;

  --border-hairline: 1px solid #e5e5e5;
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
git commit -m "feat: add design tokens for homepage redesign"
```

---

### Task 2: `featured` field, migration, and homepage catalog queries

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Modify: `lib/catalog.ts`

**Interfaces:**
- Produces: `Product.featured: boolean` column; `getFeaturedProducts(limit?: number)` and `getNewArrivals(limit?: number)` in `lib/catalog.ts`, both returning `Prisma.Product[]` shaped exactly like the existing `getProductsByCategory` return value (includes `variants`, `images`, `category` per `CATALOG_INCLUDE`) — structurally compatible with `ProductCardData` from Task 3.

- [ ] **Step 1: Add the `featured` field to the schema**

In `prisma/schema.prisma`, in the `Product` model, add the field right after `status`:

```prisma
model Product {
  id            String           @id @default(cuid())
  slug          String           @unique
  nameFr        String
  nameEn        String
  descriptionFr String
  descriptionEn String
  status        ProductStatus    @default(DRAFT)
  featured      Boolean          @default(false)
  category      Category         @relation(fields: [categoryId], references: [id])
  categoryId    String
  variants      ProductVariant[]
  images        ProductImage[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_product_featured
```

Expected: prints `Your database is now in sync with your schema` and creates a new folder under `prisma/migrations/`.

- [ ] **Step 3: Mark seed products as featured and fix the upsert to apply it on re-seed**

In `prisma/seed.ts`, add `featured?: boolean;` to the `SeedProduct` type:

```ts
type SeedProduct = {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  categorySlug: string;
  featured?: boolean;
  variants: SeedVariant[];
};
```

Add `featured: true` to these 6 entries in the `products` array (leave every other field as-is): `veste-wax-noire`, `tshirt-technique-blanc-homme`, `legging-performance-noir-femme`, `brassiere-sport-blanche-femme`, `coupe-vent-running-bleu`, `casquette-running-noire`. Example for the first one:

```ts
  {
    slug: 'veste-wax-noire',
    nameFr: 'Veste wax noire',
    nameEn: 'Black wax jacket',
    descriptionFr: 'Veste en wax premium, coupe ajustée.',
    descriptionEn: 'Premium wax jacket, fitted cut.',
    categorySlug: 'homme',
    featured: true,
    variants: [
      { sku: 'VWN-M-BLK', size: 'M', color: 'Noir', priceCents: 8900, stock: 12 },
      { sku: 'VWN-L-BLK', size: 'L', color: 'Noir', priceCents: 8900, stock: 8 }
    ]
  },
```

Repeat for the other 5 slugs listed above (add `featured: true,` on its own line after `categorySlug: '...',`).

Then fix the upsert so re-running the seed actually applies `featured` to rows that already exist (currently `update: {}` is a no-op):

```ts
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { featured: product.featured ?? false },
      create: {
        slug: product.slug,
        nameFr: product.nameFr,
        nameEn: product.nameEn,
        descriptionFr: product.descriptionFr,
        descriptionEn: product.descriptionEn,
        status: 'PUBLISHED',
        featured: product.featured ?? false,
        categoryId,
        variants: { create: product.variants },
        images: {
          create: [{ url: '/placeholder-product.svg', alt: product.nameFr }]
        }
      }
    });
```

- [ ] **Step 4: Re-run the seed**

```bash
npm run db:seed
```

Expected: completes with no error output.

- [ ] **Step 5: Add the two query functions**

In `lib/catalog.ts`, add after `getProductBySlug` and before `searchProducts`:

```ts
export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: 'PUBLISHED', featured: true },
    include: CATALOG_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getNewArrivals(limit = 8) {
  return prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    include: CATALOG_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
```

- [ ] **Step 6: Verify against the real database**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.product.count({ where: { featured: true } }).then((n) => {
  console.log('featured products:', n);
  return p.\$disconnect();
});
"
```

Expected: `featured products: 6`

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts prisma/migrations lib/catalog.ts
git commit -m "feat: add featured flag and homepage catalog queries"
```

---

### Task 3: ProductCard and ProductGrid

**Files:**
- Create: `components/ProductCard/ProductCard.tsx`
- Create: `components/ProductCard/ProductCard.module.css`
- Create: `components/ProductGrid/ProductGrid.tsx`
- Create: `components/ProductGrid/ProductGrid.module.css`

**Interfaces:**
- Consumes: `cheapestVariant`, `formatPrice`, `isOnSale` from `@/lib/pricing` (existing); `getLocalizedField` from `@/lib/i18n-utils` (existing); `Link` from `@/i18n/navigation` (existing); tokens from Task 1.
- Produces: `ProductCard` component and exported `ProductCardData` type; `ProductGrid` component. Both consumed by Task 12.

- [ ] **Step 1: Create ProductCard**

```tsx
// components/ProductCard/ProductCard.tsx
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { cheapestVariant, formatPrice, isOnSale } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { priceCents: number; compareAtPriceCents: number | null }[];
};

export function ProductCard({ product, locale }: { product: ProductCardData; locale: Locale }) {
  const name = getLocalizedField(product, 'name', locale);
  const cheapest = cheapestVariant(product.variants);
  const image = product.images[0];

  return (
    <Link href={`/produit/${product.slug}`} locale={locale} className={styles.card}>
      <div className={styles.imageWrap}>
        {image ? (
          <img src={image.url} alt={image.alt} className={styles.image} />
        ) : (
          <div className={styles.placeholder} />
        )}
      </div>
      <div className={styles.name}>{name}</div>
      {cheapest && (
        <div className={styles.price}>
          {isOnSale(cheapest) && cheapest.compareAtPriceCents !== null ? (
            <>
              <span className={styles.priceStrike}>{formatPrice(cheapest.compareAtPriceCents, locale)}</span>
              <span className={styles.priceSale}>{formatPrice(cheapest.priceCents, locale)}</span>
            </>
          ) : (
            <span>{formatPrice(cheapest.priceCents, locale)}</span>
          )}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Style ProductCard**

```css
/* components/ProductCard/ProductCard.module.css */
.card {
  display: block;
  text-decoration: none;
  color: var(--color-black);
}

.imageWrap {
  aspect-ratio: 1;
  background: var(--color-grey-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
}

.name {
  margin-top: var(--space-3);
  font-size: var(--body-md-size);
  font-weight: var(--heading-3-weight);
}

.price {
  margin-top: var(--space-1);
  font-size: var(--body-sm-size);
}

.priceStrike {
  text-decoration: line-through;
  color: var(--color-grey-mid);
  margin-right: var(--space-2);
}

.priceSale {
  color: var(--color-price-sale);
  font-weight: var(--heading-3-weight);
}
```

- [ ] **Step 3: Create ProductGrid**

```tsx
// components/ProductGrid/ProductGrid.tsx
import type { Locale } from '@/i18n';
import { ProductCard, type ProductCardData } from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

export function ProductGrid({
  title,
  products,
  locale
}: {
  title: string;
  products: ProductCardData[];
  locale: Locale;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Style ProductGrid**

```css
/* components/ProductGrid/ProductGrid.module.css */
.section {
  padding: var(--space-12) var(--space-8);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-8);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-6);
}
```

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors (the existing `<img>` warning from Gallery-style components is acceptable — it's a pre-existing lint warning, not an error, elsewhere in this project).

- [ ] **Step 6: Commit**

```bash
git add components/ProductCard components/ProductGrid
git commit -m "feat: add ProductCard and ProductGrid components"
```

---

### Task 4: Header and MessageCarousel

**Files:**
- Create: `components/Header/Header.tsx`
- Create: `components/Header/Header.module.css`
- Create: `components/Header/MessageCarousel.tsx`
- Create: `components/Header/MessageCarousel.module.css`

**Interfaces:**
- Consumes: `getTranslations` from `next-intl/server`; `Link` from `@/i18n/navigation`; tokens from Task 1. Uses message keys `header.brand`, `header.navLabel`, `header.homme/femme/running/sale`, `header.searchLabel`, `header.cart`, `header.accountLabel`, `header.topbarMsg1/topbarMsg2` — `searchLabel` and `accountLabel` are new and added in Task 12.
- Produces: `Header` component, consumed by Task 12's `layout.tsx`.

- [ ] **Step 1: Create MessageCarousel**

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
      {messages[index]}
    </div>
  );
}
```

- [ ] **Step 2: Style MessageCarousel**

```css
/* components/Header/MessageCarousel.module.css */
.carousel {
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
}
```

- [ ] **Step 3: Create Header**

```tsx
// components/Header/Header.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { MessageCarousel } from './MessageCarousel';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <header>
      <div className={styles.topbar}>
        <MessageCarousel messages={[t('topbarMsg1'), t('topbarMsg2')]} />
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
        <div className={styles.actions}>
          <Link href="/recherche" locale={locale} className={styles.iconLink} aria-label={t('searchLabel')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <span className={styles.iconLink} aria-label={t('cart')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className={styles.badge}>0</span>
          </span>
          <span className={styles.iconLink} aria-label={t('accountLabel')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </span>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Style Header**

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

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.iconLink {
  position: relative;
  display: inline-flex;
  color: var(--color-black);
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

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (`t('searchLabel')` and `t('accountLabel')` type-check fine even though the keys don't exist in the JSON yet — `next-intl`'s `t()` here is not statically typed to the message file contents in this project.)

- [ ] **Step 6: Commit**

```bash
git add components/Header
git commit -m "feat: add Header and MessageCarousel components"
```

---

### Task 5: Footer

**Files:**
- Create: `components/Footer/Footer.tsx`
- Create: `components/Footer/Footer.module.css`

**Interfaces:**
- Consumes: `getCategories` from `@/lib/catalog` (existing); `getTranslations` (namespaces `footer` and `header`); `Link` from `@/i18n/navigation`; tokens from Task 1. Uses new `footer.*` keys added in Task 12.
- Produces: `Footer` component, consumed by Task 12's `layout.tsx`.

- [ ] **Step 1: Create Footer**

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
      <div className={styles.columns}>
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
              {tHeader(category.slug as 'homme' | 'femme' | 'running')}
            </Link>
          ))}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('utilityHeading')}</div>
          <a href="#" className={styles.link}>
            {t('utilitySizeGuide')}
          </a>
          <a href="#" className={styles.link}>
            {t('utilityLegal')}
          </a>
          <a href="#" className={styles.link}>
            {t('utilityTerms')}
          </a>
          <a href="#" className={styles.link}>
            {t('utilityPrivacy')}
          </a>
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('contactHeading')}</div>
          <a href="mailto:contact@divinexpress.fr" className={styles.link}>
            contact@divinexpress.fr
          </a>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.payments}>
          <span className={styles.paymentBadge}>Visa</span>
          <span className={styles.paymentBadge}>Mastercard</span>
          <span className={styles.paymentBadge}>PayPal</span>
        </div>
        <p className={styles.copyright}>{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Style Footer**

```css
/* components/Footer/Footer.module.css */
.footer {
  background: var(--color-black);
  color: #cccccc;
  padding: var(--space-16) var(--space-8) var(--space-8);
}

.columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
}

.heading {
  color: var(--color-white);
  font-weight: var(--heading-3-weight);
  margin-bottom: var(--space-4);
}

.link {
  display: block;
  color: #cccccc;
  text-decoration: none;
  padding: var(--space-1) 0;
  font-size: var(--body-sm-size);
}

.bottom {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 1px solid #333333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.payments {
  display: flex;
  gap: var(--space-2);
}

.paymentBadge {
  border: 1px solid #444444;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-size: var(--label-size);
}

.copyright {
  font-size: var(--label-size);
  margin: 0;
}

@media (max-width: 768px) {
  .columns {
    grid-template-columns: repeat(2, 1fr);
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
git add components/Footer
git commit -m "feat: add Footer component"
```

---

### Task 6: Hero

**Files:**
- Create: `components/Hero/Hero.tsx`
- Create: `components/Hero/Hero.module.css`

**Interfaces:**
- Consumes: `getTranslations('home')`; `Link` from `@/i18n/navigation`; tokens from Task 1. Uses `home.heroTitle`, `home.heroSubtitle`, `home.heroCtaShop`, `home.heroCtaCategories` — all rewritten in Task 12.
- Produces: `Hero` component, consumed by Task 12's `page.tsx`.

- [ ] **Step 1: Create Hero**

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
          <Link href="/homme" locale={locale} className={styles.ctaPrimary}>
            {t('heroCtaShop')}
          </Link>
          <a href="#categories" className={styles.ctaSecondary}>
            {t('heroCtaCategories')}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style Hero**

```css
/* components/Hero/Hero.module.css */
.hero {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: var(--color-beige);
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
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.05));
}

.content {
  position: relative;
  padding: var(--space-12) var(--space-8);
  color: var(--color-white);
  max-width: 600px;
}

.title {
  font-size: var(--heading-1-size);
  font-weight: var(--heading-1-weight);
  line-height: 1.1;
  margin: 0 0 var(--space-4);
}

.subtitle {
  font-size: var(--body-md-size);
  margin: 0 0 var(--space-6);
}

.actions {
  display: flex;
  gap: var(--space-4);
}

.ctaPrimary,
.ctaSecondary {
  display: inline-block;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: var(--body-sm-size);
  font-weight: var(--heading-3-weight);
}

.ctaPrimary {
  background: var(--color-white);
  color: var(--color-black);
}

.ctaSecondary {
  border: 1px solid var(--color-white);
  color: var(--color-white);
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
git commit -m "feat: add Hero component"
```

---

### Task 7: TrustBar

**Files:**
- Create: `components/TrustBar/TrustBar.tsx`
- Create: `components/TrustBar/TrustBar.module.css`

**Interfaces:**
- Consumes: `getTranslations('trustbar')`; tokens from Task 1. Uses `trustbar.paymentTitle/paymentDesc`, `deliveryTitle/deliveryDesc`, `returnsTitle/returnsDesc`, `materialsTitle/materialsDesc` — added in Task 12.
- Produces: `TrustBar` component, consumed by Task 12's `page.tsx`.

- [ ] **Step 1: Create TrustBar**

```tsx
// components/TrustBar/TrustBar.tsx
import { getTranslations } from 'next-intl/server';
import styles from './TrustBar.module.css';

const ITEMS = ['payment', 'delivery', 'returns', 'materials'] as const;

const ICON_PATHS: Record<(typeof ITEMS)[number], string> = {
  payment: 'M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  delivery:
    'M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  returns: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  materials: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
};

export async function TrustBar() {
  const t = await getTranslations('trustbar');

  return (
    <section className={styles.bar}>
      {ITEMS.map((item) => (
        <div key={item} className={styles.item}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={ICON_PATHS[item]} />
          </svg>
          <div className={styles.title}>{t(`${item}Title`)}</div>
          <div className={styles.desc}>{t(`${item}Desc`)}</div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Style TrustBar**

```css
/* components/TrustBar/TrustBar.module.css */
.bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
  padding: var(--space-12) var(--space-8);
  text-align: center;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.title {
  font-weight: var(--heading-3-weight);
  font-size: var(--body-sm-size);
}

.desc {
  font-size: var(--label-size);
  color: var(--color-grey-mid);
}

@media (max-width: 768px) {
  .bar {
    grid-template-columns: repeat(2, 1fr);
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
git add components/TrustBar
git commit -m "feat: add TrustBar component"
```

---

### Task 8: PromoBanner

**Files:**
- Create: `components/PromoBanner/PromoBanner.tsx`
- Create: `components/PromoBanner/PromoBanner.module.css`

**Interfaces:**
- Consumes: `Link` from `@/i18n/navigation`; tokens from Task 1.
- Produces: `PromoBanner` component with props `{ title: string; ctaLabel: string; href: string; locale: Locale; imageSeed: string; badge?: string; size?: 'half' | 'full' }`, consumed 3 times by Task 12's `page.tsx`.

- [ ] **Step 1: Create PromoBanner**

```tsx
// components/PromoBanner/PromoBanner.tsx
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './PromoBanner.module.css';

export function PromoBanner({
  title,
  ctaLabel,
  href,
  locale,
  imageSeed,
  badge,
  size = 'half'
}: {
  title: string;
  ctaLabel: string;
  href: string;
  locale: Locale;
  imageSeed: string;
  badge?: string;
  size?: 'half' | 'full';
}) {
  return (
    <Link href={href} locale={locale} className={size === 'full' ? styles.bannerFull : styles.bannerHalf}>
      <img src={`https://picsum.photos/seed/${imageSeed}/1200/700`} alt="" className={styles.image} />
      <div className={styles.overlay} />
      {badge && <span className={styles.badge}>{badge}</span>}
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <span className={styles.cta}>{ctaLabel} →</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Style PromoBanner**

```css
/* components/PromoBanner/PromoBanner.module.css */
.bannerHalf,
.bannerFull {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--radius-md);
  min-height: 320px;
  color: var(--color-white);
  text-decoration: none;
}

.bannerFull {
  min-height: 220px;
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
  background: rgba(0, 0, 0, 0.35);
}

.badge {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  background: var(--color-white);
  color: var(--color-black);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--label-size);
  font-weight: var(--heading-3-weight);
}

.content {
  position: absolute;
  left: var(--space-6);
  bottom: var(--space-6);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  margin-bottom: var(--space-2);
}

.cta {
  font-size: var(--body-sm-size);
  font-weight: var(--heading-3-weight);
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/PromoBanner
git commit -m "feat: add PromoBanner component"
```

---

### Task 9: CategoryStrip

**Files:**
- Create: `components/CategoryStrip/CategoryStrip.tsx`
- Create: `components/CategoryStrip/CategoryStrip.module.css`

**Interfaces:**
- Consumes: `getCategories` from `@/lib/catalog` (existing); `getTranslations` (namespaces `header` and `home`); `Link` from `@/i18n/navigation`; tokens from Task 1. Uses `home.categoriesTitle`, added in Task 12.
- Produces: `CategoryStrip` component (renders a `<section id="categories">`, the anchor target for Hero's secondary CTA), consumed by Task 12's `page.tsx`.

- [ ] **Step 1: Create CategoryStrip**

```tsx
// components/CategoryStrip/CategoryStrip.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/catalog';
import type { Locale } from '@/i18n';
import styles from './CategoryStrip.module.css';

export async function CategoryStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');
  const tHome = await getTranslations('home');
  const categories = await getCategories();

  return (
    <section id="categories" className={styles.section}>
      <h2 className={styles.title}>{tHome('categoriesTitle')}</h2>
      <div className={styles.strip}>
        {categories.map((category) => (
          <Link key={category.slug} href={`/${category.slug}`} locale={locale} className={styles.tile}>
            <img
              src={`https://picsum.photos/seed/divinexpress-${category.slug}/400/400`}
              alt=""
              className={styles.image}
            />
            <span className={styles.label}>{t(category.slug as 'homme' | 'femme' | 'running')}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style CategoryStrip**

```css
/* components/CategoryStrip/CategoryStrip.module.css */
.section {
  padding: var(--space-12) var(--space-8);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-8);
}

.strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
}

.tile {
  text-decoration: none;
  color: var(--color-black);
  text-align: center;
}

.image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-grey-light);
}

.label {
  display: block;
  margin-top: var(--space-2);
  font-weight: var(--heading-3-weight);
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/CategoryStrip
git commit -m "feat: add CategoryStrip component"
```

---

### Task 10: Testimonials

**Files:**
- Create: `components/Testimonials/Testimonials.tsx`
- Create: `components/Testimonials/Testimonials.module.css`

**Interfaces:**
- Consumes: `getTranslations('testimonials')`; tokens from Task 1. Uses `testimonials.title`, `quote1/name1`, `quote2/name2`, `quote3/name3` — added in Task 12. These are clearly-fictional sample quotes (no real review system exists yet — see spec).
- Produces: `Testimonials` component, consumed by Task 12's `page.tsx`.

- [ ] **Step 1: Create Testimonials**

```tsx
// components/Testimonials/Testimonials.tsx
import { getTranslations } from 'next-intl/server';
import styles from './Testimonials.module.css';

const ITEMS = [1, 2, 3] as const;

export async function Testimonials() {
  const t = await getTranslations('testimonials');

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('title')}</h2>
      <div className={styles.grid}>
        {ITEMS.map((n) => (
          <div key={n} className={styles.card}>
            <p className={styles.quote}>&ldquo;{t(`quote${n}`)}&rdquo;</p>
            <p className={styles.name}>{t(`name${n}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style Testimonials**

```css
/* components/Testimonials/Testimonials.module.css */
.section {
  padding: var(--space-12) var(--space-8);
  background: var(--color-grey-light);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-8);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
}

.card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--space-6);
}

.quote {
  font-size: var(--body-md-size);
  margin: 0 0 var(--space-4);
}

.name {
  font-weight: var(--heading-3-weight);
  margin: 0;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Testimonials
git commit -m "feat: add Testimonials component"
```

---

### Task 11: BlogPreview

**Files:**
- Create: `components/BlogPreview/BlogPreview.tsx`
- Create: `components/BlogPreview/BlogPreview.module.css`

**Interfaces:**
- Consumes: `getTranslations('home')`; tokens from Task 1. Uses `home.blogTitle`, added in Task 12. Post content is hardcoded bilingual sample data in the component itself (no blog/CMS system exists — see spec), not stored in the messages files.
- Produces: `BlogPreview` component, consumed by Task 12's `page.tsx`.

- [ ] **Step 1: Create BlogPreview**

```tsx
// components/BlogPreview/BlogPreview.tsx
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import styles from './BlogPreview.module.css';

const POSTS: {
  seed: string;
  titleFr: string;
  titleEn: string;
  categoryFr: string;
  categoryEn: string;
  date: string;
}[] = [
  {
    seed: 'divinexpress-blog-1',
    titleFr: 'Comment associer les couleurs cette saison',
    titleEn: 'How to pair colors this season',
    categoryFr: 'Style',
    categoryEn: 'Style',
    date: '2026-06-12'
  },
  {
    seed: 'divinexpress-blog-2',
    titleFr: 'Entretenir ses vêtements en wax',
    titleEn: 'Caring for your wax garments',
    categoryFr: 'Guide',
    categoryEn: 'Guide',
    date: '2026-06-20'
  },
  {
    seed: 'divinexpress-blog-3',
    titleFr: 'Les indispensables de la garde-robe',
    titleEn: 'Wardrobe essentials',
    categoryFr: 'Style',
    categoryEn: 'Style',
    date: '2026-07-02'
  }
];

export async function BlogPreview({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('blogTitle')}</h2>
      <div className={styles.grid}>
        {POSTS.map((post) => (
          <article key={post.seed} className={styles.card}>
            <img src={`https://picsum.photos/seed/${post.seed}/600/400`} alt="" className={styles.image} />
            <div className={styles.meta}>
              {locale === 'fr' ? post.categoryFr : post.categoryEn} · {formatter.format(new Date(post.date))}
            </div>
            <h3 className={styles.postTitle}>{locale === 'fr' ? post.titleFr : post.titleEn}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style BlogPreview**

```css
/* components/BlogPreview/BlogPreview.module.css */
.section {
  padding: var(--space-12) var(--space-8);
}

.title {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  text-align: center;
  margin: 0 0 var(--space-8);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
}

.image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-grey-light);
}

.meta {
  font-size: var(--label-size);
  color: var(--color-grey-mid);
  margin: var(--space-3) 0 var(--space-1);
}

.postTitle {
  font-size: var(--body-md-size);
  font-weight: var(--heading-3-weight);
  margin: 0;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/BlogPreview
git commit -m "feat: add BlogPreview component"
```

---

### Task 12: Wire up the homepage

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/[locale]/page.tsx`
- Create: `app/[locale]/page.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `Header` (Task 4), `Footer` (Task 5), `Hero` (Task 6), `TrustBar` (Task 7), `PromoBanner` (Task 8), `CategoryStrip` (Task 9), `ProductGrid` (Task 3), `Testimonials` (Task 10), `BlogPreview` (Task 11); `getFeaturedProducts`, `getNewArrivals` (Task 2).
- Produces: the complete rendered homepage at `/fr` and `/en`.

- [ ] **Step 1: Wire the layout**

Replace `app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import '@/app/styles/tokens.css';

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
    <html lang={params.locale}>
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

- [ ] **Step 2: Wire the homepage**

Replace `app/[locale]/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getFeaturedProducts, getNewArrivals } from '@/lib/catalog';
import { Hero } from '@/components/Hero/Hero';
import { TrustBar } from '@/components/TrustBar/TrustBar';
import { PromoBanner } from '@/components/PromoBanner/PromoBanner';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { CategoryStrip } from '@/components/CategoryStrip/CategoryStrip';
import { Testimonials } from '@/components/Testimonials/Testimonials';
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
        imageSeed="divinexpress-discount"
        size="full"
      />
      <ProductGrid title={t('newArrivalsTitle')} products={newArrivals} locale={locale} />
      <Testimonials />
      <BlogPreview locale={locale} />
    </>
  );
}
```

- [ ] **Step 3: Add the homepage stylesheet**

```css
/* app/[locale]/page.module.css */
.promoPair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
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
    "running": "Running",
    "sale": "Sale",
    "searchPlaceholder": "Rechercher",
    "searchLabel": "Rechercher",
    "cart": "Panier",
    "accountLabel": "Compte",
    "topbarMsg1": "Une question? Visitez notre page 'contact'",
    "topbarMsg2": "Livraison à l'internationale et retours gratuits",
    "countrySelect": "France (EUR €)",
    "langSelect": "Français"
  },
  "home": {
    "heroTitle": "LE STYLE, SANS COMPROMIS",
    "heroSubtitle": "Vêtements premium, livrés en France et en Afrique de l'Ouest.",
    "heroCtaShop": "Voir la boutique",
    "heroCtaCategories": "Nos catégories",
    "promoHommeTitle": "Collection Homme",
    "promoHommeCta": "Découvrir",
    "promoSaleTitle": "Soldes en cours",
    "promoSaleCta": "Voir les offres",
    "promoSaleBadge": "Promo",
    "bestSellersTitle": "Meilleures ventes",
    "categoriesTitle": "Nos catégories",
    "discountTitle": "-15% sur toute la collection",
    "discountCta": "En profiter",
    "newArrivalsTitle": "Nouveautés",
    "blogTitle": "Le magazine DivinExpress"
  },
  "trustbar": {
    "paymentTitle": "Paiement sécurisé",
    "paymentDesc": "Toutes les transactions sont chiffrées et protégées.",
    "deliveryTitle": "Livraison France & Afrique de l'Ouest",
    "deliveryDesc": "Expédition rapide où que vous soyez.",
    "returnsTitle": "Retours faciles",
    "returnsDesc": "30 jours pour changer d'avis.",
    "materialsTitle": "Matières de qualité",
    "materialsDesc": "Sélectionnées pour leur durabilité et leur confort."
  },
  "testimonials": {
    "title": "Ce que nos clients disent",
    "quote1": "Des matières incroyables et une coupe parfaite, je recommande à 100%.",
    "name1": "Amina K.",
    "quote2": "Livraison rapide même jusqu'en Côte d'Ivoire, service impeccable.",
    "name2": "Julien M.",
    "quote3": "Mon nouveau site préféré pour m'habiller, qualité au rendez-vous.",
    "name3": "Sophie D."
  },
  "footer": {
    "navHeading": "Navigation",
    "navHome": "Accueil",
    "navShop": "Boutique",
    "navAbout": "À propos",
    "navContact": "Contact",
    "categoriesHeading": "Catégories",
    "utilityHeading": "Pages utiles",
    "utilitySizeGuide": "Guide des tailles",
    "utilityLegal": "Mentions légales",
    "utilityTerms": "CGV",
    "utilityPrivacy": "Politique de confidentialité",
    "contactHeading": "Contact",
    "copyright": "© {year} DivinExpress — Tous droits réservés."
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
    "running": "Running",
    "sale": "Sale",
    "searchPlaceholder": "Search",
    "searchLabel": "Search",
    "cart": "Bag",
    "accountLabel": "Account",
    "topbarMsg1": "Any questions? Visit our 'contact' page",
    "topbarMsg2": "International shipping and free returns",
    "countrySelect": "France (EUR €)",
    "langSelect": "English"
  },
  "home": {
    "heroTitle": "STYLE, UNCOMPROMISED",
    "heroSubtitle": "Premium clothing, delivered across France and West Africa.",
    "heroCtaShop": "Shop Now",
    "heroCtaCategories": "Categories",
    "promoHommeTitle": "Men's Collection",
    "promoHommeCta": "Shop Now",
    "promoSaleTitle": "Sale Now On",
    "promoSaleCta": "Shop the Sale",
    "promoSaleBadge": "Sale",
    "bestSellersTitle": "Best Sellers",
    "categoriesTitle": "Our Categories",
    "discountTitle": "-15% Off Everything",
    "discountCta": "Shop Now",
    "newArrivalsTitle": "New Arrivals",
    "blogTitle": "The DivinExpress Journal"
  },
  "trustbar": {
    "paymentTitle": "Secure Payment",
    "paymentDesc": "All transactions are encrypted and protected.",
    "deliveryTitle": "Delivery to France & West Africa",
    "deliveryDesc": "Fast shipping wherever you are.",
    "returnsTitle": "Easy Returns",
    "returnsDesc": "30 days to change your mind.",
    "materialsTitle": "Quality Materials",
    "materialsDesc": "Selected for durability and comfort."
  },
  "testimonials": {
    "title": "What People Say",
    "quote1": "Amazing fabrics and a perfect fit, I highly recommend.",
    "name1": "Amina K.",
    "quote2": "Fast delivery even to Côte d'Ivoire, impeccable service.",
    "name2": "Julien M.",
    "quote3": "My new favorite place to shop, quality every time.",
    "name3": "Sophie D."
  },
  "footer": {
    "navHeading": "Navigation",
    "navHome": "Home",
    "navShop": "Shop",
    "navAbout": "About",
    "navContact": "Contact",
    "categoriesHeading": "Categories",
    "utilityHeading": "Useful Pages",
    "utilitySizeGuide": "Size Guide",
    "utilityLegal": "Legal Notice",
    "utilityTerms": "Terms & Conditions",
    "utilityPrivacy": "Privacy Policy",
    "contactHeading": "Contact",
    "copyright": "© {year} DivinExpress — All rights reserved."
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
git commit -m "feat: compose the new homepage"
```

---

### Task 13: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass (no new unit tests were added — Task 2 through Task 12 only touch Prisma-backed queries and React components, which this project verifies via type-check/lint/manual check, not Vitest, per Global Constraints).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors (pre-existing `<img>` warnings are acceptable).

- [ ] **Step 3: Production build**

```bash
npx prisma generate
npm run build
```

Expected: build completes successfully, `/fr` and `/en` both listed in the route output.

- [ ] **Step 4: Manual dev-server check**

```bash
npm run dev
```

Open `http://localhost:3000/fr` (or whichever port Next.js picks if 3000 is busy) and confirm, in order top to bottom: black scrolling message bar, header with logo/nav/search/cart/account icons, hero with photo + 2 CTAs, 4-icon trust bar, 2 promo banners side by side, "Meilleures ventes" grid with 6 real products, "Nos catégories" strip with the 3 real categories, a single wide "-15%" banner, "Nouveautés" grid, testimonials, blog preview cards, and the 4-column black footer with the real `contact@divinexpress.fr` email. Repeat the check on `/en` and confirm every section is in English. Stop the dev server when done.

- [ ] **Step 5: Commit any final fixes**

If manual verification surfaces an issue, fix it in the relevant component file and commit:

```bash
git add -A
git commit -m "fix: address homepage manual verification findings"
```
