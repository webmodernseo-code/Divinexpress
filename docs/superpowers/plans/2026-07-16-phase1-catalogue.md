# DivinExpress — Phase 1 (Catalogue) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 0 placeholder home page with a real, navigable catalogue: header with a functional FR/EN language toggle, home page with hero + category tiles, category listing (PLP) with URL-driven filters, product detail (PDP), and simple search — all backed by real (fictional) seed data.

**Architecture:** Next.js 14 App Router, Server Components by default. Two small Client Components handle the only genuinely interactive bits (language toggle needs the current pathname, search needs form state) — everything else, including PLP filters, is server-rendered and driven entirely by URL query parameters (no client-side filter state), so filtered views are shareable links and work without JavaScript. Data access goes through a small `lib/` layer (`lib/prisma.ts`, `lib/catalog.ts`, `lib/filters.ts`, `lib/pricing.ts`, `lib/currency.ts`) so pages stay thin and the pure logic (filter parsing, price formatting, sale detection) is unit-tested in isolation.

**Tech Stack:** Next.js 14.2.35, next-intl 3.26.5, Prisma 5.22.0, TypeScript 5.9.3 (all from Phase 0, unchanged). Adds Vitest 2.x for unit-testing the pure `lib/` modules — no other new dependencies.

## Global Constraints

- No Tailwind — CSS Modules using the existing design-system tokens (`app/styles/tokens.css`), same as Phase 0. (spec: source of vérité design)
- Filters (taille, couleur, prix) are driven by URL query params, not client state — links must be shareable/bookmarkable. (spec: Liste produits / PLP)
- Language toggle (`FR €` / `EN £`) must be a real locale switch (navigates to `/fr` or `/en`, preserving the current path) — not decorative. (spec: Header)
- Currency display is a fixed symbol per locale (`€` for `fr`, `£` for `en`) with **no real amount conversion** — the numeric price is unchanged between locales. (spec: Hors scope)
- "Sale" is not a `Category` row — it is a cross-category filter on `ProductVariant.compareAtPriceCents`. (spec: Modèle de données)
- "Suivi de commande" link stays out of the header entirely this phase (spec: Header — masqué).
- Cart icon is visible in the header with a static "(0)" count and is not clickable; "Add to Bag" on the PDP is visually present but wired to no action. (spec: Header, Fiche produit)
- Seed data: 3 real categories (Homme, Femme, Running) + at least 2-3 products with `compareAtPriceCents` set so the "Sale" filter has data. (spec: Données de seed)

---

### Task 1: Prisma schema — add `compareAtPriceCents`

**Context:** Foundation for promo pricing everywhere else in this plan (seed data, `ProductCard`, `lib/pricing.ts`). Must land first since Task 2's seed data depends on the field existing.

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `ProductVariant.compareAtPriceCents` (`number | null` in the generated Prisma Client) — consumed by Task 2 (seed), Task 3 (`lib/pricing.ts`), Task 5 (`lib/catalog.ts`).

- [ ] **Step 1: Add the field to `ProductVariant`**

In `prisma/schema.prisma`, change:

```prisma
model ProductVariant {
  id         String      @id @default(cuid())
  sku        String      @unique
  size       String
  color      String
  priceCents Int
  stock      Int         @default(0)
  product    Product     @relation(fields: [productId], references: [id])
  productId  String
  orderItems OrderItem[]
}
```

to:

```prisma
model ProductVariant {
  id                  String      @id @default(cuid())
  sku                 String      @unique
  size                String
  color               String
  priceCents          Int
  compareAtPriceCents Int?
  stock               Int         @default(0)
  product             Product     @relation(fields: [productId], references: [id])
  productId           String
  orderItems          OrderItem[]
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_compare_at_price_cents
```

Expected: creates `prisma/migrations/<timestamp>_add_compare_at_price_cents/migration.sql`, applies it to the Neon database, regenerates the Prisma Client.

If this fails with `P1001: Can't reach database server`: disconnect any active VPN before retrying — this exact project hit that failure mode in Phase 0 (Prisma's native engine resolves the Neon hostname to an IPv6 address that some VPN tunnels break, with no automatic fallback to IPv4) and a VPN disconnect resolved it immediately.

- [ ] **Step 3: Verify TypeScript picks up the new field**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Add compareAtPriceCents to ProductVariant for promo pricing"
```

---

### Task 2: Expand seed data (categories + 10 products)

**Context:** Replaces Phase 0's single-category, single-product seed with real Homme/Femme/Running categories and enough products (some on sale) to make the PLP, filters, and "Sale" view meaningful to build against.

**Files:**
- Create: `public/placeholder-product.svg`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: seeded rows consumed by every later task's manual verification (Tasks 5, 9, 10, 11 all query this data).

- [ ] **Step 1: Create a real placeholder image asset**

No product photography exists yet (per the spec, all imagery stays placeholder). `ProductCard` and `Gallery` (Tasks 7, 10) render whatever URL is on `ProductImage.url` as a real `<img>` — pointing seed data at a file that doesn't exist would show a broken-image icon instead of a placeholder. Create `public/placeholder-product.svg`, reproducing the same diagonal-hatch placeholder convention already used in the wireframe:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#ffffff" />
  <path d="M0 0 L600 600 M600 0 L0 600" stroke="#cccccc" stroke-width="2" />
  <rect x="0" y="0" width="600" height="600" fill="none" stroke="#0a0a0a" stroke-width="4" />
  <text x="300" y="308" font-family="ui-monospace, Menlo, monospace" font-size="20" fill="#777777" text-anchor="middle">Photo</text>
</svg>
```

- [ ] **Step 2: Replace `prisma/seed.ts` in full**

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedVariant = {
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  compareAtPriceCents?: number;
  stock: number;
};

type SeedProduct = {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  categorySlug: string;
  variants: SeedVariant[];
};

const categories = [
  { name: 'Homme', slug: 'homme' },
  { name: 'Femme', slug: 'femme' },
  { name: 'Running', slug: 'running' }
];

const products: SeedProduct[] = [
  {
    slug: 'veste-wax-noire',
    nameFr: 'Veste wax noire',
    nameEn: 'Black wax jacket',
    descriptionFr: 'Veste en wax premium, coupe ajustée.',
    descriptionEn: 'Premium wax jacket, fitted cut.',
    categorySlug: 'homme',
    variants: [
      { sku: 'VWN-M-BLK', size: 'M', color: 'Noir', priceCents: 8900, stock: 12 },
      { sku: 'VWN-L-BLK', size: 'L', color: 'Noir', priceCents: 8900, stock: 8 }
    ]
  },
  {
    slug: 'tshirt-technique-blanc-homme',
    nameFr: 'T-shirt technique blanc',
    nameEn: 'White technical t-shirt',
    descriptionFr: 'T-shirt respirant, coupe droite.',
    descriptionEn: 'Breathable t-shirt, straight cut.',
    categorySlug: 'homme',
    variants: [
      { sku: 'TTB-S-WHT', size: 'S', color: 'Blanc', priceCents: 2900, stock: 20 },
      { sku: 'TTB-M-WHT', size: 'M', color: 'Blanc', priceCents: 2900, stock: 18 },
      { sku: 'TTB-L-WHT', size: 'L', color: 'Blanc', priceCents: 2900, stock: 10 }
    ]
  },
  {
    slug: 'short-running-gris-homme',
    nameFr: 'Short running gris',
    nameEn: 'Grey running shorts',
    descriptionFr: 'Short léger, doublure intérieure.',
    descriptionEn: 'Lightweight shorts, inner lining.',
    categorySlug: 'homme',
    variants: [
      { sku: 'SRG-S-GRY', size: 'S', color: 'Gris', priceCents: 3200, compareAtPriceCents: 4500, stock: 15 },
      { sku: 'SRG-M-GRY', size: 'M', color: 'Gris', priceCents: 3200, compareAtPriceCents: 4500, stock: 9 },
      { sku: 'SRG-L-GRY', size: 'L', color: 'Gris', priceCents: 3200, compareAtPriceCents: 4500, stock: 3 }
    ]
  },
  {
    slug: 'legging-performance-noir-femme',
    nameFr: 'Legging performance noir',
    nameEn: 'Black performance leggings',
    descriptionFr: 'Legging taille haute, maintien fort.',
    descriptionEn: 'High-waist leggings, strong support.',
    categorySlug: 'femme',
    variants: [
      { sku: 'LPN-S-BLK', size: 'S', color: 'Noir', priceCents: 5500, stock: 14 },
      { sku: 'LPN-M-BLK', size: 'M', color: 'Noir', priceCents: 5500, stock: 11 },
      { sku: 'LPN-L-BLK', size: 'L', color: 'Noir', priceCents: 5500, stock: 6 }
    ]
  },
  {
    slug: 'brassiere-sport-blanche-femme',
    nameFr: 'Brassière sport blanche',
    nameEn: 'White sports bra',
    descriptionFr: 'Maintien moyen, bretelles ajustables.',
    descriptionEn: 'Medium support, adjustable straps.',
    categorySlug: 'femme',
    variants: [
      { sku: 'BSB-S-WHT', size: 'S', color: 'Blanc', priceCents: 2500, compareAtPriceCents: 3500, stock: 17 },
      { sku: 'BSB-M-WHT', size: 'M', color: 'Blanc', priceCents: 2500, compareAtPriceCents: 3500, stock: 13 },
      { sku: 'BSB-L-WHT', size: 'L', color: 'Blanc', priceCents: 2500, compareAtPriceCents: 3500, stock: 4 }
    ]
  },
  {
    slug: 'veste-coupe-vent-bleue-femme',
    nameFr: 'Veste coupe-vent bleue',
    nameEn: 'Blue windbreaker jacket',
    descriptionFr: 'Coupe-vent léger, capuche amovible.',
    descriptionEn: 'Lightweight windbreaker, removable hood.',
    categorySlug: 'femme',
    variants: [
      { sku: 'VCB-S-BLU', size: 'S', color: 'Bleu', priceCents: 7500, stock: 10 },
      { sku: 'VCB-M-BLU', size: 'M', color: 'Bleu', priceCents: 7500, stock: 7 }
    ]
  },
  {
    slug: 'coupe-vent-running-bleu',
    nameFr: 'Coupe-vent running bleu',
    nameEn: 'Blue running windbreaker',
    descriptionFr: 'Ultra-léger, poche zippée dos.',
    descriptionEn: 'Ultra-lightweight, zipped back pocket.',
    categorySlug: 'running',
    variants: [
      { sku: 'CVR-M-BLU', size: 'M', color: 'Bleu', priceCents: 7900, stock: 9 },
      { sku: 'CVR-L-BLU', size: 'L', color: 'Bleu', priceCents: 7900, stock: 5 }
    ]
  },
  {
    slug: 'chaussettes-running-techniques',
    nameFr: 'Chaussettes running techniques',
    nameEn: 'Technical running socks',
    descriptionFr: 'Anti-ampoules, taille unique.',
    descriptionEn: 'Blister-resistant, one size.',
    categorySlug: 'running',
    variants: [
      { sku: 'CRT-U-BLK', size: 'Unique', color: 'Noir', priceCents: 1500, stock: 40 }
    ]
  },
  {
    slug: 'casquette-running-noire',
    nameFr: 'Casquette running noire',
    nameEn: 'Black running cap',
    descriptionFr: 'Légère, réglable, tissu respirant.',
    descriptionEn: 'Lightweight, adjustable, breathable fabric.',
    categorySlug: 'running',
    variants: [
      { sku: 'CRN-U-BLK', size: 'Unique', color: 'Noir', priceCents: 1600, compareAtPriceCents: 2200, stock: 22 }
    ]
  },
  {
    slug: 'sac-banane-running-noir',
    nameFr: 'Sac banane running noir',
    nameEn: 'Black running belt bag',
    descriptionFr: 'Compartiment étanche pour téléphone.',
    descriptionEn: 'Water-resistant phone compartment.',
    categorySlug: 'running',
    variants: [
      { sku: 'SBR-U-BLK', size: 'Unique', color: 'Noir', priceCents: 2800, stock: 16 }
    ]
  }
];

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
    categoryIds.set(category.slug, row.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${product.categorySlug}`);

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        slug: product.slug,
        nameFr: product.nameFr,
        nameEn: product.nameEn,
        descriptionFr: product.descriptionFr,
        descriptionEn: product.descriptionEn,
        status: 'PUBLISHED',
        categoryId,
        variants: { create: product.variants },
        images: {
          create: [{ url: '/placeholder-product.svg', alt: product.nameFr }]
        }
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Note: the old `Vestes`/`vestes` category from Phase 0 is superseded by `Homme`/`Femme`/`Running` — this seed does not delete it, but nothing in this plan references it, and re-running the seed is idempotent (upserts by slug) so it's safe to run repeatedly.

- [ ] **Step 3: Run the seed**

```bash
npm run db:seed
```

Expected: no errors. (Same VPN caveat as Task 1 applies if you see `P1001`.)

- [ ] **Step 4: Verify row counts**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  console.log('categories', await prisma.category.count());
  console.log('products', await prisma.product.count());
  console.log('on sale', await prisma.productVariant.count({ where: { compareAtPriceCents: { not: null } } }));
  await prisma.\$disconnect();
})();
"
```

Expected: `categories` >= 3, `products` >= 10, `on sale` >= 3 (products 3, 5, and 9 from the list above each contribute their variants).

- [ ] **Step 5: Commit**

```bash
git add public/placeholder-product.svg prisma/seed.ts
git commit -m "Expand seed data: Homme/Femme/Running categories, 10 products, 3 on sale"
```

---

### Task 3: Testing setup + pricing/currency utilities (TDD)

**Context:** First task that needs unit tests, so it also installs Vitest. `lib/currency.ts` and `lib/pricing.ts` are pure functions with no Prisma/React dependency — the cheapest, highest-value place to apply real TDD in this plan. Every later task that displays a price (`ProductCard`, PDP, `LocaleToggle`) imports from here.

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/currency.ts`
- Create: `lib/currency.test.ts`
- Create: `lib/pricing.ts`
- Create: `lib/pricing.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `currencyForLocale(locale: Locale): { symbol: string; code: string }`, `formatPrice(cents: number, locale: Locale): string`, `isOnSale(variant: { priceCents: number; compareAtPriceCents: number | null }): boolean` — consumed by Task 6 (`LocaleToggle`), Task 7 (`ProductCard`), Task 10 (PDP).
- Consumes: `Locale` type from `i18n.ts` (Task 2 of Phase 0, already exists).

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest@^2
```

- [ ] **Step 2: Add the test script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});
```

- [ ] **Step 4: Write the failing tests for `lib/currency.ts`**

`lib/currency.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { currencyForLocale } from './currency';

describe('currencyForLocale', () => {
  it('returns euros for fr', () => {
    expect(currencyForLocale('fr')).toEqual({ symbol: '€', code: 'EUR' });
  });

  it('returns pounds for en', () => {
    expect(currencyForLocale('en')).toEqual({ symbol: '£', code: 'GBP' });
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

```bash
npx vitest run lib/currency.test.ts
```

Expected: FAIL — `Cannot find module './currency'`.

- [ ] **Step 6: Implement `lib/currency.ts`**

```ts
import type { Locale } from '@/i18n';

const CURRENCY_BY_LOCALE: Record<Locale, { symbol: string; code: string }> = {
  fr: { symbol: '€', code: 'EUR' },
  en: { symbol: '£', code: 'GBP' }
};

export function currencyForLocale(locale: Locale): { symbol: string; code: string } {
  return CURRENCY_BY_LOCALE[locale];
}
```

- [ ] **Step 7: Run it to verify it passes**

```bash
npx vitest run lib/currency.test.ts
```

Expected: PASS, 2/2.

- [ ] **Step 8: Write the failing tests for `lib/pricing.ts`**

`lib/pricing.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isOnSale, formatPrice } from './pricing';

describe('isOnSale', () => {
  it('is false when compareAtPriceCents is null', () => {
    expect(isOnSale({ priceCents: 8900, compareAtPriceCents: null })).toBe(false);
  });

  it('is false when compareAtPriceCents equals priceCents', () => {
    expect(isOnSale({ priceCents: 8900, compareAtPriceCents: 8900 })).toBe(false);
  });

  it('is true when compareAtPriceCents is greater than priceCents', () => {
    expect(isOnSale({ priceCents: 3200, compareAtPriceCents: 4500 })).toBe(true);
  });

  it('is false when compareAtPriceCents is less than priceCents', () => {
    expect(isOnSale({ priceCents: 4500, compareAtPriceCents: 3200 })).toBe(false);
  });
});

describe('formatPrice', () => {
  it('formats euros for fr', () => {
    expect(formatPrice(8900, 'fr')).toBe('89,00 €');
  });

  it('formats pounds for en with the same numeric amount', () => {
    expect(formatPrice(8900, 'en')).toBe('89,00 £');
  });

  it('pads single-digit cents', () => {
    expect(formatPrice(100, 'fr')).toBe('1,00 €');
  });
});
```

- [ ] **Step 9: Run it to verify it fails**

```bash
npx vitest run lib/pricing.test.ts
```

Expected: FAIL — `Cannot find module './pricing'`.

- [ ] **Step 10: Implement `lib/pricing.ts`**

```ts
import type { Locale } from '@/i18n';
import { currencyForLocale } from './currency';

export type PriceInfo = {
  priceCents: number;
  compareAtPriceCents: number | null;
};

export function isOnSale({ priceCents, compareAtPriceCents }: PriceInfo): boolean {
  return compareAtPriceCents !== null && compareAtPriceCents > priceCents;
}

export function formatPrice(cents: number, locale: Locale): string {
  const { symbol } = currencyForLocale(locale);
  const amount = (cents / 100).toFixed(2).replace('.', ',');
  return `${amount} ${symbol}`;
}
```

- [ ] **Step 11: Run it to verify it passes**

```bash
npx vitest run lib/pricing.test.ts
```

Expected: PASS, 7/7.

- [ ] **Step 12: Run the full suite and `tsc`**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: both exit 0.

- [ ] **Step 13: Commit**

```bash
git add vitest.config.ts lib/currency.ts lib/currency.test.ts lib/pricing.ts lib/pricing.test.ts package.json package-lock.json
git commit -m "Add Vitest and pricing/currency utilities (TDD)"
```

---

### Task 4: Filter utilities (TDD)

**Context:** Pure URL-query-param logic for the PLP filter panel — parsing filters from a request's `searchParams`, building toggle links for individual filter values, and toggling the whole filter panel's visibility. No Prisma, no React — everything here is a plain function so the PLP page (Task 9) and `FilterPanel` component stay thin.

**Files:**
- Create: `lib/filters.ts`
- Create: `lib/filters.test.ts`

**Interfaces:**
- Produces: `PRICE_BUCKETS`, `type PriceBucketId`, `type ProductFilters`, `parseFilters(searchParams: URLSearchParams): ProductFilters`, `hasActiveFilters(filters: ProductFilters): boolean`, `priceRangesForBuckets(bucketIds: PriceBucketId[]): { minCents: number; maxCents: number | null }[]`, `isFiltersPanelVisible(searchParams: URLSearchParams): boolean`, `toggleFiltersPanelHref(searchParams: URLSearchParams): string`, `toggleFilterValueHref(searchParams: URLSearchParams, key: 'taille' | 'couleur' | 'prix', value: string): string`, `type SortId`, `SORT_OPTIONS`, `parseSort(searchParams: URLSearchParams): SortId`, `sortHref(searchParams: URLSearchParams, sortId: SortId): string` — consumed by Task 5 (`lib/catalog.ts`), Task 9 (PLP page), and the `FilterPanel` component (also Task 9).

- [ ] **Step 1: Write the failing tests**

`lib/filters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  parseFilters,
  hasActiveFilters,
  priceRangesForBuckets,
  isFiltersPanelVisible,
  toggleFiltersPanelHref,
  toggleFilterValueHref
} from './filters';

describe('parseFilters', () => {
  it('reads repeated taille and couleur params', () => {
    const params = new URLSearchParams('taille=M&taille=L&couleur=Noir');
    expect(parseFilters(params)).toEqual({
      sizes: ['M', 'L'],
      colors: ['Noir'],
      priceBuckets: []
    });
  });

  it('keeps only known price bucket ids', () => {
    const params = new URLSearchParams('prix=50-100&prix=n-importe-quoi');
    expect(parseFilters(params).priceBuckets).toEqual(['50-100']);
  });

  it('returns empty arrays when no filters are present', () => {
    const params = new URLSearchParams('filtres=masques');
    expect(parseFilters(params)).toEqual({ sizes: [], colors: [], priceBuckets: [] });
  });
});

describe('hasActiveFilters', () => {
  it('is false with no filters', () => {
    expect(hasActiveFilters({ sizes: [], colors: [], priceBuckets: [] })).toBe(false);
  });

  it('is true with at least one filter', () => {
    expect(hasActiveFilters({ sizes: ['M'], colors: [], priceBuckets: [] })).toBe(true);
  });
});

describe('priceRangesForBuckets', () => {
  it('maps bucket ids to their cents ranges', () => {
    expect(priceRangesForBuckets(['moins-50'])).toEqual([{ minCents: 0, maxCents: 4999 }]);
  });

  it('the top bucket has no max', () => {
    expect(priceRangesForBuckets(['plus-100'])).toEqual([{ minCents: 10000, maxCents: null }]);
  });

  it('returns one range per requested bucket, in bucket order', () => {
    expect(priceRangesForBuckets(['plus-100', 'moins-50'])).toEqual([
      { minCents: 0, maxCents: 4999 },
      { minCents: 10000, maxCents: null }
    ]);
  });
});

describe('isFiltersPanelVisible', () => {
  it('is true by default', () => {
    expect(isFiltersPanelVisible(new URLSearchParams())).toBe(true);
  });

  it('is false when filtres=masques', () => {
    expect(isFiltersPanelVisible(new URLSearchParams('filtres=masques'))).toBe(false);
  });
});

describe('toggleFiltersPanelHref', () => {
  it('adds filtres=masques when currently visible', () => {
    expect(toggleFiltersPanelHref(new URLSearchParams('taille=M'))).toBe('?taille=M&filtres=masques');
  });

  it('removes filtres when currently hidden', () => {
    expect(toggleFiltersPanelHref(new URLSearchParams('taille=M&filtres=masques'))).toBe('?taille=M');
  });

  it('returns bare ? when there is nothing else in the query', () => {
    expect(toggleFiltersPanelHref(new URLSearchParams())).toBe('?filtres=masques');
  });
});

describe('toggleFilterValueHref', () => {
  it('adds a value that is not yet selected', () => {
    expect(toggleFilterValueHref(new URLSearchParams(), 'taille', 'M')).toBe('?taille=M');
  });

  it('removes a value that is already selected', () => {
    expect(toggleFilterValueHref(new URLSearchParams('taille=M&taille=L'), 'taille', 'M')).toBe('?taille=L');
  });

  it('preserves other filter keys untouched', () => {
    expect(toggleFilterValueHref(new URLSearchParams('couleur=Noir'), 'taille', 'M')).toBe('?couleur=Noir&taille=M');
  });
});

describe('parseSort', () => {
  it('reads a known sort id', () => {
    expect(parseSort(new URLSearchParams('tri=prix-asc'))).toBe('prix-asc');
  });

  it('defaults to nouveautes when missing or unknown', () => {
    expect(parseSort(new URLSearchParams())).toBe('nouveautes');
    expect(parseSort(new URLSearchParams('tri=n-importe-quoi'))).toBe('nouveautes');
  });
});

describe('sortHref', () => {
  it('sets tri for a non-default sort', () => {
    expect(sortHref(new URLSearchParams('taille=M'), 'prix-asc')).toBe('?taille=M&tri=prix-asc');
  });

  it('removes tri when switching back to nouveautes', () => {
    expect(sortHref(new URLSearchParams('taille=M&tri=prix-desc'), 'nouveautes')).toBe('?taille=M');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run lib/filters.test.ts
```

Expected: FAIL — `Cannot find module './filters'`.

- [ ] **Step 3: Implement `lib/filters.ts`**

```ts
export type PriceBucketId = 'moins-50' | '50-100' | 'plus-100';

export const PRICE_BUCKETS: {
  id: PriceBucketId;
  labelFr: string;
  labelEn: string;
  minCents: number;
  maxCents: number | null;
}[] = [
  { id: 'moins-50', labelFr: 'Moins de 50€', labelEn: 'Under £50', minCents: 0, maxCents: 4999 },
  { id: '50-100', labelFr: '50-100€', labelEn: '£50-£100', minCents: 5000, maxCents: 9999 },
  { id: 'plus-100', labelFr: 'Plus de 100€', labelEn: 'Over £100', minCents: 10000, maxCents: null }
];

export type ProductFilters = {
  sizes: string[];
  colors: string[];
  priceBuckets: PriceBucketId[];
};

function isPriceBucketId(value: string): value is PriceBucketId {
  return PRICE_BUCKETS.some((bucket) => bucket.id === value);
}

export function parseFilters(searchParams: URLSearchParams): ProductFilters {
  return {
    sizes: searchParams.getAll('taille'),
    colors: searchParams.getAll('couleur'),
    priceBuckets: searchParams.getAll('prix').filter(isPriceBucketId)
  };
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return filters.sizes.length > 0 || filters.colors.length > 0 || filters.priceBuckets.length > 0;
}

export function priceRangesForBuckets(
  bucketIds: PriceBucketId[]
): { minCents: number; maxCents: number | null }[] {
  return bucketIds.map((id) => {
    const bucket = PRICE_BUCKETS.find((b) => b.id === id)!;
    return { minCents: bucket.minCents, maxCents: bucket.maxCents };
  });
}

export function isFiltersPanelVisible(searchParams: URLSearchParams): boolean {
  return searchParams.get('filtres') !== 'masques';
}

export function toggleFiltersPanelHref(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  if (isFiltersPanelVisible(searchParams)) {
    next.set('filtres', 'masques');
  } else {
    next.delete('filtres');
  }
  const query = next.toString();
  return `?${query}`;
}

export function toggleFilterValueHref(
  searchParams: URLSearchParams,
  key: 'taille' | 'couleur' | 'prix',
  value: string
): string {
  const next = new URLSearchParams(searchParams);
  const current = next.getAll(key);
  next.delete(key);
  const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  updated.forEach((v) => next.append(key, v));
  const query = next.toString();
  return `?${query}`;
}

export type SortId = 'nouveautes' | 'prix-asc' | 'prix-desc';

export const SORT_OPTIONS: { id: SortId; labelFr: string; labelEn: string }[] = [
  { id: 'nouveautes', labelFr: 'Nouveautés', labelEn: 'Newest' },
  { id: 'prix-asc', labelFr: 'Prix croissant', labelEn: 'Price: low to high' },
  { id: 'prix-desc', labelFr: 'Prix décroissant', labelEn: 'Price: high to low' }
];

function isSortId(value: string): value is SortId {
  return SORT_OPTIONS.some((option) => option.id === value);
}

export function parseSort(searchParams: URLSearchParams): SortId {
  const value = searchParams.get('tri');
  return value !== null && isSortId(value) ? value : 'nouveautes';
}

export function sortHref(searchParams: URLSearchParams, sortId: SortId): string {
  const next = new URLSearchParams(searchParams);
  if (sortId === 'nouveautes') {
    next.delete('tri');
  } else {
    next.set('tri', sortId);
  }
  const query = next.toString();
  return `?${query}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run lib/filters.test.ts
```

Expected: PASS, 18/18.

- [ ] **Step 5: Run the full suite and `tsc`**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/filters.ts lib/filters.test.ts
git commit -m "Add URL-driven filter utilities (TDD)"
```

---

### Task 5: Catalog data-access layer

**Context:** The only place that talks to Prisma for catalogue reads. Pages (Tasks 9, 10, 11) call these functions instead of querying Prisma directly. Verified against the real seeded Neon database (like Phase 0's Task 4) rather than with mocks — Prisma query correctness against real data matters more here than isolating from the database.

**Files:**
- Create: `lib/prisma.ts`
- Create: `lib/catalog.ts`

**Interfaces:**
- Consumes: `ProductFilters`, `priceRangesForBuckets`, `SortId` from `lib/filters.ts` (Task 4).
- Produces: `prisma` (singleton `PrismaClient`), `SALE_SLUG`, `getCategories()`, `getProductsByCategory(categorySlug: string, filters: ProductFilters, sort?: SortId)`, `getProductBySlug(slug: string)`, `searchProducts(query: string)` — consumed by Task 9 (PLP), Task 10 (PDP), Task 11 (search).

- [ ] **Step 1: Create the Prisma client singleton**

`lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Create `lib/catalog.ts`**

```ts
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { priceRangesForBuckets, type ProductFilters, type SortId } from './filters';

export const SALE_SLUG = 'sale';

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

function variantWhere(filters: ProductFilters): Prisma.ProductVariantWhereInput {
  const where: Prisma.ProductVariantWhereInput = {};
  if (filters.sizes.length > 0) where.size = { in: filters.sizes };
  if (filters.colors.length > 0) where.color = { in: filters.colors };
  if (filters.priceBuckets.length > 0) {
    const ranges = priceRangesForBuckets(filters.priceBuckets);
    where.OR = ranges.map(({ minCents, maxCents }) =>
      maxCents === null ? { priceCents: { gte: minCents } } : { priceCents: { gte: minCents, lte: maxCents } }
    );
  }
  return where;
}

const CATALOG_INCLUDE = {
  variants: true,
  images: true,
  category: true
} as const;

type ProductWithVariants = { variants: { priceCents: number }[] };

function cheapestPriceCents(product: ProductWithVariants): number {
  return product.variants.reduce((min, variant) => Math.min(min, variant.priceCents), Infinity);
}

// Prisma can't order a Product query by an aggregate (min/max) of a related
// list — only by _count. The catalog is small enough (seed: ~10 products,
// filtered subsets smaller still) that sorting the already-fetched page in
// memory is simpler and cheaper than a raw SQL workaround.
function sortProducts<T extends ProductWithVariants>(products: T[], sort: SortId): T[] {
  if (sort === 'nouveautes') return products;
  const sorted = [...products].sort((a, b) => cheapestPriceCents(a) - cheapestPriceCents(b));
  return sort === 'prix-asc' ? sorted : sorted.reverse();
}

export async function getProductsByCategory(categorySlug: string, filters: ProductFilters, sort: SortId = 'nouveautes') {
  const variants = variantWhere(filters);
  const hasVariantFilter = Object.keys(variants).length > 0;

  if (categorySlug === SALE_SLUG) {
    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        variants: { some: { ...variants, compareAtPriceCents: { not: null } } }
      },
      include: CATALOG_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    return sortProducts(products, sort);
  }

  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      category: { slug: categorySlug },
      ...(hasVariantFilter ? { variants: { some: variants } } : {})
    },
    include: CATALOG_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });
  return sortProducts(products, sort);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: CATALOG_INCLUDE
  });
}

export async function searchProducts(query: string) {
  const trimmed = query.trim();
  if (trimmed === '') return [];

  return prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { nameFr: { contains: trimmed, mode: 'insensitive' } },
        { nameEn: { contains: trimmed, mode: 'insensitive' } },
        { descriptionFr: { contains: trimmed, mode: 'insensitive' } },
        { descriptionEn: { contains: trimmed, mode: 'insensitive' } }
      ]
    },
    include: CATALOG_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });
}
```

- [ ] **Step 3: Verify against the real seeded database**

```bash
npx tsx -e "
import { getCategories, getProductsByCategory, getProductBySlug, searchProducts, SALE_SLUG } from './lib/catalog';
(async () => {
  console.log('categories:', (await getCategories()).map((c) => c.slug));
  console.log('running count:', (await getProductsByCategory('running', { sizes: [], colors: [], priceBuckets: [] })).length);
  console.log('sale count:', (await getProductsByCategory(SALE_SLUG, { sizes: [], colors: [], priceBuckets: [] })).length);
  console.log('filtered by size M:', (await getProductsByCategory('homme', { sizes: ['M'], colors: [], priceBuckets: [] })).length);
  console.log('by slug:', (await getProductBySlug('veste-wax-noire'))?.nameFr);
  console.log('search wax:', (await searchProducts('wax')).map((p) => p.slug));
  console.log('search empty:', await searchProducts(''));
  const ascending = await getProductsByCategory('running', { sizes: [], colors: [], priceBuckets: [] }, 'prix-asc');
  console.log('running prix-asc:', ascending.map((p) => p.slug));
})();
"
```

Expected: `categories` includes `homme`, `femme`, `running`; `running count` is 4; `sale count` is 3; `filtered by size M` matches the Homme products that have an `M` variant (veste-wax-noire, tshirt-technique-blanc-homme, short-running-gris-homme → 3); `by slug` prints `Veste wax noire`; `search wax` is `['veste-wax-noire']`; `search empty` is `[]`; `running prix-asc` starts with `chaussettes-running-techniques` (1500) and ends with `coupe-vent-running-bleu` (7900).

- [ ] **Step 4: Run `tsc` and the unit suite (unaffected, just confirming nothing broke)**

```bash
npx tsc --noEmit
npx vitest run
```

Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/prisma.ts lib/catalog.ts
git commit -m "Add catalog data-access layer (categories, PLP query, PDP lookup, search)"
```

---

### Task 6: next-intl navigation helpers + Header

**Context:** Phase 0 only set up `next-intl`'s middleware/routing — it never needed locale-aware `Link`/`usePathname` since the placeholder page had no navigation. This task adds those helpers and builds the real header (top bar with language toggle, main bar with nav/search/cart), replacing the inline `<header>` markup in `app/[locale]/layout.tsx`.

**Files:**
- Create: `i18n/navigation.ts`
- Create: `components/Header/Header.tsx`
- Create: `components/Header/Header.module.css`
- Create: `components/Header/LocaleToggle.tsx`
- Create: `components/Header/LocaleToggle.module.css`
- Create: `components/Header/SearchForm.tsx`
- Create: `components/Header/SearchForm.module.css`
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/[locale]/layout.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `locales`, `Locale` from `i18n.ts`; `currencyForLocale` from `lib/currency.ts` (Task 3).
- Produces: `Link`, `usePathname`, `useRouter` from `i18n/navigation.ts` — consumed by every later page/component task (7 through 11) for all internal links.

- [ ] **Step 1: Create the locale-aware navigation helpers**

`i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation';
import { locales } from '@/i18n';

export const { Link, usePathname, useRouter } = createNavigation({ locales });
```

- [ ] **Step 2: Add the new message keys**

`messages/fr.json` — replace in full:

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
    "cart": "Panier"
  }
}
```

`messages/en.json` — replace in full:

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
    "cart": "Bag"
  }
}
```

- [ ] **Step 3: Create `LocaleToggle`**

`components/Header/LocaleToggle.tsx`:

```tsx
'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n';
import { currencyForLocale } from '@/lib/currency';
import styles from './LocaleToggle.module.css';

export function LocaleToggle({ current }: { current: Locale }) {
  const pathname = usePathname();

  return (
    <div className={styles.toggle}>
      {locales.map((locale) => {
        const { symbol } = currencyForLocale(locale);
        const isActive = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            className={isActive ? styles.active : styles.inactive}
          >
            {locale.toUpperCase()} {symbol}
          </Link>
        );
      })}
    </div>
  );
}
```

`components/Header/LocaleToggle.module.css`:

```css
.toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--body-sm-size);
}

.active {
  border: var(--border-width-hairline) solid var(--color-white);
  border-radius: 999px;
  padding: 2px var(--space-2);
  color: var(--color-white);
  font-weight: var(--weight-semibold);
}

.inactive {
  color: var(--color-white);
  opacity: 0.6;
}

.inactive:hover {
  opacity: 1;
  text-decoration: none;
}
```

- [ ] **Step 4: Create `SearchForm`**

`components/Header/SearchForm.tsx`:

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from '@/i18n/navigation';
import styles from './SearchForm.module.css';

export function SearchForm({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed === '') return;
    router.push(`/recherche?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={styles.form}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </form>
  );
}
```

`components/Header/SearchForm.module.css`:

```css
.form {
  display: flex;
}

.input {
  font-family: var(--font-sans);
  font-size: var(--body-sm-size);
  border: var(--border-width-hairline) solid var(--surface-border);
  border-radius: 999px;
  padding: var(--space-1) var(--space-3);
  min-width: 140px;
}

.input:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}
```

- [ ] **Step 5: Create `Header`**

`components/Header/Header.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { LocaleToggle } from './LocaleToggle';
import { SearchForm } from './SearchForm';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <div>
      <div className={styles.topBar}>
        <div className={styles.social} aria-hidden="true">
          <span className={styles.socialIcon}>f</span>
          <span className={styles.socialIcon}>ig</span>
          <span className={styles.socialIcon}>tt</span>
        </div>
        <LocaleToggle current={locale} />
      </div>
      <div className={styles.mainBar}>
        <Link href="/" locale={locale} className={styles.brandLink}>
          <span className={styles.logo}>DX</span>
          <span className={styles.brand}>{t('brand')}</span>
        </Link>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          {NAV_CATEGORIES.map((slug) => (
            <Link
              key={slug}
              href={`/${slug}`}
              locale={locale}
              className={slug === 'sale' ? styles.navSale : styles.navLink}
            >
              {t(slug)}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <SearchForm placeholder={t('searchPlaceholder')} />
          <span className={styles.cart}>{t('cart')} (0)</span>
        </div>
      </div>
    </div>
  );
}
```

`components/Header/Header.module.css`:

```css
.topBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-8);
  background: var(--surface-page-inverse);
  color: var(--text-inverse);
  font-size: var(--body-sm-size);
}

.social {
  display: flex;
  gap: var(--space-2);
}

.socialIcon {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-white);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
}

.mainBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-8);
  border-bottom: var(--border-width-hairline) solid var(--surface-border);
}

.brandLink {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--surface-page-inverse);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--weight-bold);
  font-size: var(--body-sm-size);
}

.brand {
  font-family: var(--font-sans);
  font-weight: var(--weight-black);
  font-size: var(--heading-2-size);
  line-height: var(--heading-2-line);
  letter-spacing: var(--display-1-tracking);
  text-transform: uppercase;
  color: var(--text-primary);
}

.nav {
  display: flex;
  gap: var(--space-6);
  font-size: var(--body-md-size);
}

.navLink {
  color: var(--text-primary);
}

.navSale {
  color: var(--price-sale);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--body-md-size);
}

.cart {
  color: var(--text-primary);
}
```

- [ ] **Step 6: Wire `Header` into the layout**

In `app/[locale]/layout.tsx`, replace:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import '@/app/styles/tokens.css';
import styles from './layout.module.css';

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
  const t = await getTranslations('layout');

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <header className={styles.header}>
            <span className={styles.brand}>{t('brand')}</span>
          </header>
          <main>{children}</main>
          <footer className={styles.footer}>
            © {new Date().getFullYear()} DivinExpress — {t('footer')}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

with:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { Header } from '@/components/Header/Header';
import '@/app/styles/tokens.css';
import styles from './layout.module.css';

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
  const t = await getTranslations('layout');
  const locale = params.locale as Locale;

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <Header locale={locale} />
          <main>{children}</main>
          <footer className={styles.footer}>
            © {new Date().getFullYear()} DivinExpress — {t('footer')}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Trim `layout.module.css` down to just the footer**

Replace `app/[locale]/layout.module.css` in full with:

```css
.footer {
  padding: var(--space-4) var(--space-8);
  border-top: var(--border-width-hairline) solid var(--surface-border);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--body-sm-size);
}
```

- [ ] **Step 8: Build and smoke-test**

```bash
npm run build
npm run dev
```

In another terminal:

```bash
curl -s http://localhost:3000/fr | grep -o "DIVINEXPRESS"
curl -s http://localhost:3000/fr | grep -o "Running"
curl -s http://localhost:3000/en | grep -o "Running"
```

Expected: build succeeds with no type errors; both curls find matches (`Running` is spelled identically in both locales' `header.running` key). Stop the dev server after (Ctrl+C).

- [ ] **Step 9: Run `tsc`, lint, and the unit suite**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

Expected: all exit 0.

- [ ] **Step 10: Commit**

```bash
git add i18n components/Header app/[locale]/layout.tsx app/[locale]/layout.module.css messages
git commit -m "Add functional Header with FR/EN language toggle, nav, and search"
```

---

### Task 7: Shared display components (`ProductCard`, `CategoryTile`)

**Context:** Small presentational components reused across the home page (Task 8), PLP (Task 9), and search (Task 11). Both are Server Components — no interactivity, so no client state to test; correctness is checked visually via the pages that use them in Tasks 8/9/11.

**Files:**
- Create: `components/ProductCard/ProductCard.tsx`
- Create: `components/ProductCard/ProductCard.module.css`
- Create: `components/CategoryTile/CategoryTile.tsx`
- Create: `components/CategoryTile/CategoryTile.module.css`

**Interfaces:**
- Consumes: `formatPrice`, `isOnSale` from `lib/pricing.ts` (Task 3); `Link` from `i18n/navigation.ts` (Task 6).
- Produces: `ProductCard`, `type ProductCardData`, `CategoryTile` — consumed by Task 8 (home), Task 9 (PLP), Task 11 (search).

- [ ] **Step 1: Create `ProductCard`**

`components/ProductCard/ProductCard.tsx`:

```tsx
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { formatPrice, isOnSale } from '@/lib/pricing';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { priceCents: number; compareAtPriceCents: number | null }[];
};

export function ProductCard({ product, locale }: { product: ProductCardData; locale: Locale }) {
  const name = locale === 'fr' ? product.nameFr : product.nameEn;
  const cheapest = product.variants.reduce(
    (min, variant) => (variant.priceCents < min.priceCents ? variant : min),
    product.variants[0]
  );
  const onSale = isOnSale(cheapest);
  const image = product.images[0];

  return (
    <Link href={`/produit/${product.slug}`} locale={locale} className={styles.card}>
      <div className={styles.imageWrap}>
        {image ? (
          <img src={image.url} alt={image.alt} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>Photo</div>
        )}
      </div>
      <div className={styles.name}>{name}</div>
      <div className={styles.price}>
        {onSale && cheapest.compareAtPriceCents !== null ? (
          <>
            <span className={styles.priceStrike}>{formatPrice(cheapest.compareAtPriceCents, locale)}</span>{' '}
            <span className={styles.priceSale}>{formatPrice(cheapest.priceCents, locale)}</span>
          </>
        ) : (
          <span>{formatPrice(cheapest.priceCents, locale)}</span>
        )}
      </div>
    </Link>
  );
}
```

`components/ProductCard/ProductCard.module.css`:

```css
.card {
  display: block;
  color: var(--text-primary);
}

.card:hover {
  text-decoration: none;
}

.imageWrap {
  aspect-ratio: 1 / 1;
  background: var(--surface-sunken);
  border: var(--border-width-hairline) solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: var(--text-muted);
  font-size: var(--body-sm-size);
}

.name {
  margin-top: var(--space-2);
  font-size: var(--body-sm-size);
}

.price {
  font-size: var(--price-size);
  font-weight: var(--price-weight);
}

.priceStrike {
  color: var(--price-strike);
  text-decoration: line-through;
  font-weight: var(--weight-regular);
}

.priceSale {
  color: var(--price-sale);
}
```

- [ ] **Step 2: Create `CategoryTile`**

`components/CategoryTile/CategoryTile.tsx`:

```tsx
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './CategoryTile.module.css';

export function CategoryTile({ slug, label, locale }: { slug: string; label: string; locale: Locale }) {
  return (
    <Link href={`/${slug}`} locale={locale} className={styles.tile}>
      <div className={styles.placeholder}>Photo</div>
      <div className={styles.label}>{label}</div>
    </Link>
  );
}
```

`components/CategoryTile/CategoryTile.module.css`:

```css
.tile {
  display: block;
  color: var(--text-primary);
}

.tile:hover {
  text-decoration: none;
}

.placeholder {
  aspect-ratio: 4 / 5;
  background: var(--surface-sunken);
  border: var(--border-width-hairline) solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--body-sm-size);
}

.label {
  margin-top: var(--space-2);
  font-size: var(--heading-3-size);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
}
```

- [ ] **Step 3: Verify types**

```bash
npx tsc --noEmit
```

Expected: exits 0 (these components aren't wired into any page yet, but must still type-check standalone).

- [ ] **Step 4: Commit**

```bash
git add components/ProductCard components/CategoryTile
git commit -m "Add ProductCard and CategoryTile display components"
```

---

### Task 8: Home page (hero + category tiles)

**Context:** Replaces the Phase 0 "coming soon" placeholder. White background, bold typography-only hero (no campaign image — none exists yet), CTA into the catalogue, then a grid of category tiles.

**Files:**
- Modify: `app/[locale]/page.tsx`
- Create: `app/[locale]/page.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `CategoryTile` (Task 7), `Link` from `i18n/navigation.ts` (Task 6).

- [ ] **Step 1: Add home page message keys**

In `messages/fr.json`, add a `"home"` key alongside `"layout"` and `"header"`:

```json
"home": {
  "heroTitle": "RUN FURTHER",
  "heroSubtitle": "Engineered for Speed.",
  "heroCta": "Shop the Drop"
}
```

In `messages/en.json`, add:

```json
"home": {
  "heroTitle": "RUN FURTHER",
  "heroSubtitle": "Engineered for Speed.",
  "heroCta": "Shop the Drop"
}
```

- [ ] **Step 2: Replace `app/[locale]/page.tsx` in full**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CategoryTile } from '@/components/CategoryTile/CategoryTile';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

const CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export default async function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');
  const tHeader = await getTranslations('header');

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
        <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
        <Link href="/homme" locale={locale} className={styles.heroCta}>
          {t('heroCta')}
        </Link>
      </section>
      <section className={styles.categories}>
        {CATEGORIES.map((slug) => (
          <CategoryTile key={slug} slug={slug} label={tHeader(slug)} locale={locale} />
        ))}
      </section>
    </>
  );
}
```

- [ ] **Step 3: Create `app/[locale]/page.module.css`**

```css
.hero {
  padding: var(--space-24) var(--space-8);
  text-align: left;
}

.heroTitle {
  font-family: var(--font-sans);
  font-size: var(--display-1-size);
  line-height: var(--display-1-line);
  letter-spacing: var(--display-1-tracking);
  font-weight: var(--display-1-weight);
  text-transform: uppercase;
  margin: 0;
}

.heroSubtitle {
  font-size: var(--body-lg-size);
  color: var(--text-secondary);
  margin: var(--space-3) 0 var(--space-6);
}

.heroCta {
  display: inline-block;
  background: var(--action-primary-bg);
  color: var(--action-primary-fg);
  border-radius: 999px;
  padding: var(--control-padding-y) var(--control-padding-x);
  font-size: var(--body-md-size);
  font-weight: var(--weight-semibold);
}

.heroCta:hover {
  background: var(--action-primary-bg-hover);
  text-decoration: none;
}

.categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
  padding: 0 var(--space-8) var(--space-24);
}

@media (max-width: 720px) {
  .categories {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 4: Build and smoke-test**

```bash
npm run build
npm run dev
```

```bash
curl -s http://localhost:3000/fr | grep -o "RUN FURTHER"
curl -s http://localhost:3000/fr | grep -o "Shop the Drop"
```

Expected: build succeeds, both greps find matches. Stop the dev server after (Ctrl+C).

- [ ] **Step 5: Run `tsc`, lint, unit suite**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/page.tsx app/[locale]/page.module.css messages
git commit -m "Build real home page: hero + category tiles (replaces coming-soon placeholder)"
```

---

### Task 9: Category listing page (PLP) with filters

**Context:** The core of "Catalogue" — filterable, sortable product grid per category (or the virtual `sale` view), everything driven by the URL so filtered views are shareable links.

**Files:**
- Create: `app/[locale]/[category]/page.tsx`
- Create: `app/[locale]/[category]/page.module.css`
- Create: `components/FilterPanel/FilterPanel.tsx`
- Create: `components/FilterPanel/FilterPanel.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `getCategories`, `getProductsByCategory`, `SALE_SLUG` (Task 5); `parseFilters`, `PRICE_BUCKETS`, `toggleFiltersPanelHref`, `toggleFilterValueHref`, `isFiltersPanelVisible`, `SORT_OPTIONS`, `parseSort`, `sortHref` (Task 4); `ProductCard` (Task 7).

- [ ] **Step 1: Add PLP message keys**

In `messages/fr.json`, add:

```json
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
}
```

In `messages/en.json`, add:

```json
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
}
```

- [ ] **Step 2: Create `FilterPanel`**

`components/FilterPanel/FilterPanel.tsx`:

```tsx
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { PRICE_BUCKETS, toggleFilterValueHref, type ProductFilters } from '@/lib/filters';
import styles from './FilterPanel.module.css';

const SIZES = ['S', 'M', 'L', 'Unique'];
const COLORS = ['Noir', 'Blanc', 'Gris', 'Bleu'];

export function FilterPanel({
  filters,
  searchParams,
  locale,
  labels,
  colorLabels
}: {
  filters: ProductFilters;
  searchParams: URLSearchParams;
  locale: Locale;
  labels: { size: string; color: string; price: string };
  colorLabels: Record<string, string>;
}) {
  return (
    <aside className={styles.panel}>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{labels.size}</div>
        {SIZES.map((size) => (
          <Link
            key={size}
            href={toggleFilterValueHref(searchParams, 'taille', size)}
            locale={locale}
            className={filters.sizes.includes(size) ? styles.optionActive : styles.option}
          >
            {size}
          </Link>
        ))}
      </div>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{labels.color}</div>
        {COLORS.map((color) => (
          <Link
            key={color}
            href={toggleFilterValueHref(searchParams, 'couleur', color)}
            locale={locale}
            className={filters.colors.includes(color) ? styles.optionActive : styles.option}
          >
            {colorLabels[color] ?? color}
          </Link>
        ))}
      </div>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{labels.price}</div>
        {PRICE_BUCKETS.map((bucket) => (
          <Link
            key={bucket.id}
            href={toggleFilterValueHref(searchParams, 'prix', bucket.id)}
            locale={locale}
            className={filters.priceBuckets.includes(bucket.id) ? styles.optionActive : styles.option}
          >
            {locale === 'fr' ? bucket.labelFr : bucket.labelEn}
          </Link>
        ))}
      </div>
    </aside>
  );
}
```

Note: the internal filter *value* for color stays the canonical French string used in the database (`Noir`, `Blanc`, ...) regardless of locale — only the displayed *label* is translated via `colorLabels`. The link's `href` and `filters.colors` comparisons always use the canonical value, so a `?couleur=Noir` URL means the same thing in both locales.

`components/FilterPanel/FilterPanel.module.css`:

```css
.panel {
  width: 150px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.groupTitle {
  font-size: var(--label-size);
  font-weight: var(--label-weight);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.option,
.optionActive {
  display: block;
  font-size: var(--body-sm-size);
  color: var(--text-primary);
  padding: 2px 0;
}

.optionActive {
  font-weight: var(--weight-semibold);
}

.optionActive::before {
  content: '✓ ';
}
```

- [ ] **Step 3: Create the PLP page**

`app/[locale]/[category]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories, getProductsByCategory, SALE_SLUG } from '@/lib/catalog';
import { parseFilters, isFiltersPanelVisible, toggleFiltersPanelHref, parseSort, sortHref, SORT_OPTIONS } from '@/lib/filters';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { FilterPanel } from '@/components/FilterPanel/FilterPanel';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { locale: string; category: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('plp');

  const categories = await getCategories();
  const isKnownCategory =
    params.category === SALE_SLUG || categories.some((category) => category.slug === params.category);
  if (!isKnownCategory) notFound();

  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => urlSearchParams.append(key, v));
    else if (value !== undefined) urlSearchParams.append(key, value);
  }

  const filters = parseFilters(urlSearchParams);
  const sort = parseSort(urlSearchParams);
  const products = await getProductsByCategory(params.category, filters, sort);
  const showFilters = isFiltersPanelVisible(urlSearchParams);
  const colorLabels: Record<string, string> = {
    Noir: t('colorBlack'),
    Blanc: t('colorWhite'),
    Gris: t('colorGrey'),
    Bleu: t('colorBlue')
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span>
          {products.length} {t('products')}
        </span>
        <div className={styles.sort}>
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.id}
              href={sortHref(urlSearchParams, option.id)}
              locale={locale}
              className={sort === option.id ? styles.sortActive : styles.sortOption}
            >
              {locale === 'fr' ? option.labelFr : option.labelEn}
            </Link>
          ))}
        </div>
        <Link href={toggleFiltersPanelHref(urlSearchParams)} locale={locale} className={styles.filterToggle}>
          {showFilters ? t('hideFilters') : t('showFilters')}
        </Link>
      </div>
      <div className={styles.layout}>
        {showFilters && (
          <FilterPanel
            filters={filters}
            searchParams={urlSearchParams}
            locale={locale}
            labels={{ size: t('size'), color: t('color'), price: t('price') }}
            colorLabels={colorLabels}
          />
        )}
        <div className={showFilters ? styles.gridWithFilters : styles.gridFull}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/[locale]/[category]/page.module.css`**

```css
.page {
  padding: var(--space-6) var(--space-8);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--body-sm-size);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.filterToggle {
  color: var(--text-primary);
  text-decoration: underline;
}

.sort {
  display: flex;
  gap: var(--space-3);
}

.sortOption {
  color: var(--text-secondary);
}

.sortActive {
  color: var(--text-primary);
  font-weight: var(--weight-semibold);
  text-decoration: underline;
}

.layout {
  display: flex;
  gap: var(--space-6);
}

.gridWithFilters {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.gridFull {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

@media (max-width: 720px) {
  .layout {
    flex-direction: column;
  }

  .gridWithFilters,
  .gridFull {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 5: Build and smoke-test**

```bash
npm run build
npm run dev
```

```bash
curl -s "http://localhost:3000/fr/running" | grep -c "produits"
curl -s "http://localhost:3000/fr/sale" | grep -o "Casquette running noire"
curl -s "http://localhost:3000/fr/running?taille=M" | grep -o "Coupe-vent running bleu"
curl -s "http://localhost:3000/fr/running?tri=prix-asc" | grep -o "Chaussettes running techniques"
curl -s "http://localhost:3000/fr/pas-une-vraie-categorie" -o /dev/null -w "%{http_code}\n"
```

Expected: first curl finds at least 1 match; second finds the on-sale cap; third finds the M-size windbreaker; fourth finds the cheapest running product (confirms `prix-asc` sorting reached the page); fifth returns `404`. Stop the dev server after (Ctrl+C).

- [ ] **Step 6: Run `tsc`, lint, unit suite**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/[category]" components/FilterPanel messages
git commit -m "Add PLP with URL-driven filters and show/hide filter panel"
```

---

### Task 10: Product detail page (PDP)

**Context:** Grid image gallery + sticky info/purchase panel (validated over the terminal-only design review — the visual companion session covered the hero, header, and PDP layout choice). Size/color are displayed as read-only lists rather than interactive selectors: there is no cart to select a variant *for* yet (Phase 2), so building selection state here would be thrown away.

**Files:**
- Create: `app/[locale]/produit/[slug]/page.tsx`
- Create: `app/[locale]/produit/[slug]/page.module.css`
- Create: `components/Gallery/Gallery.tsx`
- Create: `components/Gallery/Gallery.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `getProductBySlug` (Task 5); `formatPrice`, `isOnSale` (Task 3).

- [ ] **Step 1: Add PDP message keys**

In `messages/fr.json`, add:

```json
"pdp": {
  "size": "Taille",
  "color": "Couleur",
  "addToBag": "Add to Bag"
}
```

In `messages/en.json`, add:

```json
"pdp": {
  "size": "Size",
  "color": "Color",
  "addToBag": "Add to Bag"
}
```

- [ ] **Step 2: Create `Gallery`**

`components/Gallery/Gallery.tsx`:

```tsx
import styles from './Gallery.module.css';

export function Gallery({ images }: { images: { url: string; alt: string }[] }) {
  if (images.length === 0) {
    return (
      <div className={styles.grid}>
        <div className={styles.placeholder}>Photo</div>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {images.map((image) => (
        <img key={image.url} src={image.url} alt={image.alt} className={styles.image} />
      ))}
    </div>
  );
}
```

`components/Gallery/Gallery.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.placeholder {
  aspect-ratio: 1 / 1;
  background: var(--surface-sunken);
  border: var(--border-width-hairline) solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--body-sm-size);
  grid-column: 1 / -1;
}
```

- [ ] **Step 3: Create the PDP page**

`app/[locale]/produit/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProductBySlug } from '@/lib/catalog';
import { formatPrice, isOnSale } from '@/lib/pricing';
import { Gallery } from '@/components/Gallery/Gallery';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function ProductPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('pdp');

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const name = locale === 'fr' ? product.nameFr : product.nameEn;
  const description = locale === 'fr' ? product.descriptionFr : product.descriptionEn;
  const cheapest = product.variants.reduce(
    (min, variant) => (variant.priceCents < min.priceCents ? variant : min),
    product.variants[0]
  );
  const onSale = isOnSale(cheapest);
  const sizes = [...new Set(product.variants.map((variant) => variant.size))];
  const colors = [...new Set(product.variants.map((variant) => variant.color))];

  return (
    <div className={styles.page}>
      <div className={styles.gallery}>
        <Gallery images={product.images} />
      </div>
      <div className={styles.info}>
        <div className={styles.category}>{product.category.name}</div>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.price}>
          {onSale && cheapest.compareAtPriceCents !== null ? (
            <>
              <span className={styles.priceStrike}>{formatPrice(cheapest.compareAtPriceCents, locale)}</span>{' '}
              <span className={styles.priceSale}>{formatPrice(cheapest.priceCents, locale)}</span>
            </>
          ) : (
            <span>{formatPrice(cheapest.priceCents, locale)}</span>
          )}
        </div>
        <div className={styles.variantGroup}>
          <div className={styles.variantLabel}>{t('size')}</div>
          <div className={styles.variantOptions}>
            {sizes.map((size) => (
              <span key={size} className={styles.variantOption}>
                {size}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.variantGroup}>
          <div className={styles.variantLabel}>{t('color')}</div>
          <div className={styles.variantOptions}>
            {colors.map((color) => (
              <span key={color} className={styles.variantOption}>
                {color}
              </span>
            ))}
          </div>
        </div>
        <button type="button" className={styles.addToBag}>
          {t('addToBag')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/[locale]/produit/[slug]/page.module.css`**

```css
.page {
  display: flex;
  gap: var(--space-8);
  padding: var(--space-6) var(--space-8);
}

.gallery {
  flex: 1.3;
}

.info {
  flex: 1;
  align-self: flex-start;
  position: sticky;
  top: var(--space-4);
  border: 1.5px solid var(--surface-border-strong);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.category {
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-muted);
}

.name {
  font-size: var(--heading-1-size);
  font-weight: var(--heading-1-weight);
  margin: 0;
}

.description {
  color: var(--text-secondary);
  font-size: var(--body-md-size);
  margin: 0;
}

.price {
  font-size: var(--price-lg-size);
  font-weight: var(--price-lg-weight);
}

.priceStrike {
  color: var(--price-strike);
  text-decoration: line-through;
  font-weight: var(--weight-regular);
}

.priceSale {
  color: var(--price-sale);
}

.variantGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.variantLabel {
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-muted);
}

.variantOptions {
  display: flex;
  gap: var(--space-2);
}

.variantOption {
  border: 1.5px solid var(--surface-border-strong);
  border-radius: 999px;
  padding: 2px var(--space-3);
  font-size: var(--body-sm-size);
}

.addToBag {
  margin-top: var(--space-2);
  background: var(--action-primary-bg);
  color: var(--action-primary-fg);
  border: none;
  border-radius: 999px;
  padding: var(--control-padding-y) var(--control-padding-x);
  font-size: var(--body-md-size);
  font-weight: var(--weight-semibold);
  cursor: pointer;
}

.addToBag:hover {
  background: var(--action-primary-bg-hover);
}

@media (max-width: 720px) {
  .page {
    flex-direction: column;
  }

  .info {
    position: static;
  }
}
```

- [ ] **Step 5: Build and smoke-test**

```bash
npm run build
npm run dev
```

```bash
curl -s http://localhost:3000/fr/produit/veste-wax-noire | grep -o "Veste wax noire"
curl -s http://localhost:3000/fr/produit/short-running-gris-homme | grep -o "45,00"
curl -s http://localhost:3000/fr/produit/short-running-gris-homme | grep -o "32,00"
curl -s http://localhost:3000/fr/produit/ce-produit-nexiste-pas -o /dev/null -w "%{http_code}\n"
```

Expected: first three greps find matches (name, struck original price, sale price); fourth returns `404`. Stop the dev server after (Ctrl+C).

- [ ] **Step 6: Run `tsc`, lint, unit suite**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/produit" components/Gallery messages
git commit -m "Add PDP with image gallery and sticky info panel"
```

---

### Task 11: Search page

**Context:** Reuses the PLP's product grid rendering (via `ProductCard`) without the filter panel — the last page in this plan, wiring together `SearchForm` (Task 6), `searchProducts` (Task 5), and `ProductCard` (Task 7).

**Files:**
- Create: `app/[locale]/recherche/page.tsx`
- Create: `app/[locale]/recherche/page.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `searchProducts` (Task 5); `ProductCard` (Task 7).

- [ ] **Step 1: Add search message keys**

In `messages/fr.json`, add:

```json
"search": {
  "resultsFor": "Résultats pour",
  "noResults": "Aucun produit trouvé."
}
```

In `messages/en.json`, add:

```json
"search": {
  "resultsFor": "Results for",
  "noResults": "No products found."
}
```

- [ ] **Step 2: Create the search page**

`app/[locale]/recherche/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function SearchPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { q?: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('search');
  const query = searchParams.q ?? '';
  const products = await searchProducts(query);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>
        {t('resultsFor')} « {query} »
      </h1>
      {products.length === 0 ? (
        <p className={styles.empty}>{t('noResults')}</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/[locale]/recherche/page.module.css`**

```css
.page {
  padding: var(--space-6) var(--space-8);
}

.heading {
  font-size: var(--heading-2-size);
  font-weight: var(--heading-2-weight);
  margin: 0 0 var(--space-6);
}

.empty {
  color: var(--text-secondary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 4: Build and smoke-test**

```bash
npm run build
npm run dev
```

```bash
curl -s "http://localhost:3000/fr/recherche?q=running" | grep -c "produit-"
curl -s "http://localhost:3000/fr/recherche?q=zzz-introuvable" | grep -o "Aucun produit trouvé"
```

Expected: first curl finds at least 1 match (several product slugs/names contain "running"); second finds the empty-state message. Stop the dev server after (Ctrl+C).

- [ ] **Step 5: Run `tsc`, lint, full unit suite one last time**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/recherche" messages
git commit -m "Add search page reusing the product grid"
```

---

## Definition of done for Phase 1

- [ ] `npm run lint`, `npm run build`, `npx tsc --noEmit`, and `npx vitest run` all pass locally and in CI.
- [ ] Home page shows the text-only hero and 4 category tiles in both locales (Task 8).
- [ ] `/[locale]/[category]` renders filtered, sorted, URL-shareable product grids for `homme`, `femme`, `running`, and `sale`, with a working show/hide filters toggle and Nouveautés/Prix croissant/Prix décroissant sort links (Task 9).
- [ ] `/[locale]/produit/[slug]` shows the grid gallery + sticky info panel, including correct strike-through/sale pricing (Task 10).
- [ ] `/[locale]/recherche?q=...` returns matching products or the empty state (Task 11).
- [ ] The header's `FR €` / `EN £` toggle actually switches locale while staying on the same page (Task 6).
- [ ] Deployed and verifiable on `divinexpress.fr`.
