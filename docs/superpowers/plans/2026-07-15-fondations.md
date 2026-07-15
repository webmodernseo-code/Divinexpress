# DivinExpress — Phase 0 (Fondations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployable Next.js 14 + TypeScript foundation for DivinExpress — locale routing, design-system tokens applied to a base layout, a Postgres/Prisma data layer matching the validated data model, CI, and a live deployment on Vercel under `divinexpress.fr` — with no product/checkout/dashboard functionality yet.

**Architecture:** Next.js 14 App Router with all routes under `app/[locale]/...`, locale switching handled by `next-intl` middleware (`fr`/`en`, always-prefixed, `fr` default). Styling uses the existing DivinExpress design-system CSS token files directly (no Tailwind). Data layer is PostgreSQL (Neon) via Prisma, modeled per the approved spec. Deployment target is Vercel, connected to the existing GitHub repo, with GitHub Actions running lint+build on every PR.

**Tech Stack:** Next.js 14.2.35, React 18.3.1, TypeScript 5.9.3, next-intl 3.26.5, Prisma 5.22.0 / @prisma/client 5.22.0, ESLint 8.57.1 + eslint-config-next 14.2.35, tsx 4.23.1, Neon (PostgreSQL), Vercel, GitHub Actions.

## Global Constraints

- Framework: Next.js 14 (App Router) + TypeScript, deployed on Vercel. (spec: Architecture technique)
- No Tailwind — use the design system's CSS tokens directly (CSS Modules / plain CSS). (spec: Architecture technique)
- Database: PostgreSQL via Prisma ORM. Host: Neon (user decision, 2026-07-15).
- i18n: route segments `/fr` and `/en`, always-prefixed, `fr` is the default locale (decision made in this plan — resolves the open point left in the design spec).
- Auth.js (admin auth) and Resend (transactional email) are **out of scope for Phase 0** — deferred to Phases 4 and 3 respectively. Only the `Admin` Prisma model is created now, with no auth wiring.
- No product/category/cart/checkout/dashboard UI in Phase 0 — only a minimal placeholder home page per locale. (spec: Phase 0 — Hors scope)
- Domain `divinexpress.fr` is already purchased; user has DNS access (user decision, 2026-07-15).
- GitHub repo already exists at `https://github.com/webmodernseo-code/Divinexpress.git` (user decision, 2026-07-15) — do not create a new repo.
- Design system source of truth: `Design système ecommerce Divinexpress/_ds/divinexpress-design-system-3f204eed-c521-45a5-a73b-62cb1b0a0a70/`.

---

### Task 1: Clean up stale scaffold and initialize the Next.js project

**Context:** The initial commit checked out in this worktree is a `create-next-app` scaffold using Tailwind, which the approved spec explicitly excludes (`.eslintrc.json`, `.gitignore`, `README.md`, `app/*`, `next.config.mjs`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `tailwind.config.ts`, `tsconfig.json`). This task removes it and replaces it with a clean, hand-authored Next.js 14 setup (no Tailwind, no `create-next-app` interactive prompts).

**Files:**
- Delete: `app/favicon.ico`, `app/fonts/GeistMonoVF.woff`, `app/fonts/GeistVF.woff`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `postcss.config.mjs`, `tailwind.config.ts`
- Replace: `.eslintrc.json`, `.gitignore`, `README.md`, `next.config.mjs`, `package.json`, `package-lock.json`, `tsconfig.json`

**Interfaces:**
- Produces: a working `npm install` / `npm run build` / `npm run lint` toolchain that Task 2 onward extends.

- [ ] **Step 1: Remove the stale Tailwind-based scaffold**

```bash
git rm -r app postcss.config.mjs tailwind.config.ts .eslintrc.json .gitignore README.md next.config.mjs package.json package-lock.json tsconfig.json
git status --porcelain
```

Expected: every path listed shows as `D` (staged deletion), no other changes. (`README.md` and `.gitignore` are deleted here and recreated with new content in Steps 3-7 / Task 5 — this is a full replacement, not an edit.)

- [ ] **Step 2: Commit the removal**

```bash
git commit -m "Remove create-next-app/Tailwind scaffold ahead of Phase 0 rebuild"
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "divinexpress",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "14.2.35",
    "next-intl": "3.26.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@prisma/client": "5.22.0"
  },
  "devDependencies": {
    "@types/node": "20.19.43",
    "@types/react": "18.3.31",
    "@types/react-dom": "18.3.7",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.35",
    "prisma": "5.22.0",
    "tsx": "4.23.1",
    "typescript": "5.9.3"
  }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

(Task 2 will wrap this with the next-intl plugin.)

- [ ] **Step 6: Create `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 7: Create `.gitignore`**

```
# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env files — never commit real credentials
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
```

Expected: install completes with no `ERESOLVE` or peer-dependency errors, and creates `package-lock.json`.

- [ ] **Step 9: Verify the toolchain builds an empty app**

Create a placeholder `app/layout.tsx` and `app/page.tsx` temporarily is not needed — skip straight to Task 2, which creates the real locale-aware routes. Instead, verify TypeScript itself resolves:

```bash
npx tsc --noEmit
```

Expected: exits 0 (no source files yet besides config, so nothing to check — this confirms the compiler and config parse correctly).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs .eslintrc.json .gitignore
git commit -m "Initialize Next.js 14 + TypeScript toolchain (no Tailwind)"
```

---

### Task 2: Locale routing with next-intl (`/fr`, `/en`)

**Files:**
- Create: `i18n.ts`
- Create: `middleware.ts`
- Create: `messages/fr.json`
- Create: `messages/en.json`
- Modify: `next.config.mjs`

**Interfaces:**
- Consumes: `next-intl` package installed in Task 1.
- Produces: `locales` (`readonly ['fr', 'en']`), `defaultLocale` (`'fr'`), `Locale` type — exported from `i18n.ts`, imported by Task 3's layout and middleware.

- [ ] **Step 1: Create the message catalogs**

`messages/fr.json`:
```json
{
  "layout": {
    "brand": "DIVINEXPRESS",
    "footer": "Tous droits réservés."
  }
}
```

`messages/en.json`:
```json
{
  "layout": {
    "brand": "DIVINEXPRESS",
    "footer": "All rights reserved."
  }
}
```

- [ ] **Step 2: Create `i18n.ts`**

```ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

- [ ] **Step 3: Create `middleware.ts`**

```ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/', '/(fr|en)/:path*']
};
```

- [ ] **Step 4: Wrap `next.config.mjs` with the next-intl plugin**

```js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add i18n.ts middleware.ts messages next.config.mjs
git commit -m "Add next-intl locale routing (fr default, en, always-prefixed)"
```

---

### Task 3: Design-system tokens and base layout

**Files:**
- Create: `app/styles/tokens/base.css`, `app/styles/tokens/colors.css`, `app/styles/tokens/typography.css`, `app/styles/tokens/spacing.css`, `app/styles/tokens/radius.css`, `app/styles/tokens/shadows.css`, `app/styles/tokens/motion.css`
- Create: `app/styles/tokens.css`
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/layout.module.css`
- Create: `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `locales`, `Locale` from `i18n.ts` (Task 2); CSS custom properties defined in the copied token files (e.g. `--space-4`, `--surface-border`, `--font-sans`, `--heading-2-size`).
- Produces: the root layout (`app/[locale]/layout.tsx`) that every future page (Phase 1+) renders inside.

- [ ] **Step 1: Copy the design-system token files verbatim**

```bash
DS="Design système ecommerce Divinexpress/_ds/divinexpress-design-system-3f204eed-c521-45a5-a73b-62cb1b0a0a70"
mkdir -p app/styles/tokens
cp "$DS/tokens/base.css" app/styles/tokens/base.css
cp "$DS/tokens/colors.css" app/styles/tokens/colors.css
cp "$DS/tokens/typography.css" app/styles/tokens/typography.css
cp "$DS/tokens/spacing.css" app/styles/tokens/spacing.css
cp "$DS/tokens/radius.css" app/styles/tokens/radius.css
cp "$DS/tokens/shadows.css" app/styles/tokens/shadows.css
cp "$DS/tokens/motion.css" app/styles/tokens/motion.css
```

Expected: `ls app/styles/tokens` lists all 7 files.

- [ ] **Step 2: Create the token entry point `app/styles/tokens.css`**

```css
@import './tokens/colors.css';
@import './tokens/typography.css';
@import './tokens/spacing.css';
@import './tokens/radius.css';
@import './tokens/shadows.css';
@import './tokens/motion.css';
@import './tokens/base.css';
```

- [ ] **Step 3: Create `app/[locale]/layout.module.css`**

```css
.header {
  display: flex;
  align-items: center;
  padding: var(--space-4) var(--space-8);
  border-bottom: var(--border-width-hairline) solid var(--surface-border);
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

.footer {
  padding: var(--space-4) var(--space-8);
  border-top: var(--border-width-hairline) solid var(--surface-border);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--body-sm-size);
}
```

- [ ] **Step 4: Create `app/[locale]/layout.tsx`**

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

- [ ] **Step 5: Create the placeholder home page `app/[locale]/page.tsx`**

`generateStaticParams` in the layout (Step 4) means Next.js tries to statically render `/fr` and `/en`. next-intl v3 requires calling `setRequestLocale` before any translation call whenever static rendering is in play, in every server component that calls a next-intl API — the layout alone is not enough, so the page needs its own call too:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);

  const t = await getTranslations('layout');

  return (
    <section style={{ padding: 'var(--space-8)' }}>
      <p>{t('brand')} — coming soon.</p>
    </section>
  );
}
```

- [ ] **Step 6: Run the dev server and verify both locales render**

```bash
npm run dev
```

In another terminal:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/fr
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en
curl -s http://localhost:3000/fr | grep -o "DIVINEXPRESS"
```

Expected: `/` returns `307` (redirect to `/fr`), `/fr` and `/en` return `200`, and the grep finds `DIVINEXPRESS`. Stop the dev server after verifying (Ctrl+C).

- [ ] **Step 7: Run the production build**

```bash
npm run build
```

Expected: build succeeds, output lists `/fr` and `/en` as prerendered/static routes, no type errors.

- [ ] **Step 8: Commit**

```bash
git add app
git commit -m "Apply design-system tokens to base layout and locale placeholder pages"
```

---

### Task 4: Prisma schema, Neon database, migration and seed

**Context:** DB host decision: Neon (serverless Postgres, free tier, native Vercel integration).

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: `DATABASE_URL` environment variable (Neon connection string).
- Produces: Prisma Client (`@prisma/client`) generated types — `PrismaClient`, and models `Category`, `Product`, `ProductVariant`, `ProductImage`, `Order`, `OrderItem`, `Payment`, `ShippingZone`, `Admin` — consumed by all future phases.

- [ ] **Step 1 (MANUAL — run yourself, not the agent): Create the Neon project**

Go to https://neon.tech, sign in (or create an account), create a new project named `divinexpress`, and copy the pooled connection string it gives you (starts with `postgresql://`).

- [ ] **Step 2: Create `.env.example`**

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"
```

- [ ] **Step 3 (MANUAL — run yourself, not the agent): Create your local `.env`**

```bash
cp .env.example .env
```

Then paste the real Neon connection string from Step 1 into `.env`. This file is gitignored and must never be committed.

- [ ] **Step 4: Write the Prisma schema `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Product {
  id            String           @id @default(cuid())
  slug          String           @unique
  nameFr        String
  nameEn        String
  descriptionFr String
  descriptionEn String
  status        ProductStatus    @default(DRAFT)
  category      Category         @relation(fields: [categoryId], references: [id])
  categoryId    String
  variants      ProductVariant[]
  images        ProductImage[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}

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

model ProductImage {
  id        String  @id @default(cuid())
  url       String
  alt       String
  product   Product @relation(fields: [productId], references: [id])
  productId String
}

enum OrderStatus {
  PENDING
  PAID
  FULFILLED
  CANCELLED
}

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  customerEmail String
  shippingAddr  String
  country       String
  currency      String
  status        OrderStatus @default(PENDING)
  totalCents    Int
  items         OrderItem[]
  payment       Payment?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id             String         @id @default(cuid())
  order          Order          @relation(fields: [orderId], references: [id])
  orderId        String
  variant        ProductVariant @relation(fields: [variantId], references: [id])
  variantId      String
  quantity       Int
  unitPriceCents Int
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

model Payment {
  id          String        @id @default(cuid())
  order       Order         @relation(fields: [orderId], references: [id])
  orderId     String        @unique
  provider    String
  reference   String
  status      PaymentStatus @default(PENDING)
  amountCents Int
  currency    String
  createdAt   DateTime      @default(now())
}

model ShippingZone {
  id        String   @id @default(cuid())
  countries String[]
  carrier   String
  etaDays   Int
  costCents Int
}

model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         String   @default("admin")
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 5: Write the seed script `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: 'vestes' },
    update: {},
    create: { name: 'Vestes', slug: 'vestes' }
  });

  await prisma.product.upsert({
    where: { slug: 'veste-wax-noire' },
    update: {},
    create: {
      slug: 'veste-wax-noire',
      nameFr: 'Veste wax noire',
      nameEn: 'Black wax jacket',
      descriptionFr: 'Veste en wax premium, coupe ajustée.',
      descriptionEn: 'Premium wax jacket, fitted cut.',
      status: 'PUBLISHED',
      categoryId: category.id,
      variants: {
        create: [
          { sku: 'VWN-M-BLK', size: 'M', color: 'Noir', priceCents: 8900, stock: 12 },
          { sku: 'VWN-L-BLK', size: 'L', color: 'Noir', priceCents: 8900, stock: 8 }
        ]
      },
      images: {
        create: [{ url: '/placeholder-product.jpg', alt: 'Veste wax noire' }]
      }
    }
  });
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

- [ ] **Step 6: Run the initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: creates `prisma/migrations/<timestamp>_init/migration.sql`, applies it to the Neon database, generates the Prisma Client, and prompts to run the seed — accept, or run it explicitly next.

- [ ] **Step 7: Run the seed and verify**

```bash
npm run db:seed
npx prisma studio
```

Expected: seed script logs no errors; `prisma studio` (opens at `http://localhost:5555`) shows one `Category` row (`Vestes`) and one `Product` row (`Veste wax noire`) with two variants. Close Prisma Studio after verifying (Ctrl+C).

- [ ] **Step 8: Commit**

```bash
git add prisma .env.example
git commit -m "Add Prisma schema, Neon migration, and seed data"
```

---

### Task 5: Environment documentation and README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (documentation only).

- [ ] **Step 1: Write `README.md`**

```markdown
# DivinExpress

E-commerce de vêtements — paiement carte bancaire + Afrique de l'Ouest, dashboard admin.
Domaine cible : divinexpress.fr.

## Stack

- Next.js 14 (App Router) + TypeScript, déployé sur Vercel
- Tokens CSS du design system DivinExpress (pas de Tailwind)
- PostgreSQL (Neon) + Prisma
- i18n : `next-intl`, locales `fr` (défaut) et `en`, toujours préfixées

## Démarrage local

1. Copier `.env.example` en `.env` et renseigner `DATABASE_URL` (connexion Neon).
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Appliquer les migrations et le seed :
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```
4. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
   Le site est disponible sur http://localhost:3000/fr et http://localhost:3000/en.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` / `npm run start` — build et exécution en production
- `npm run lint` — ESLint
- `npm run db:migrate` — migrations Prisma
- `npm run db:seed` — seed de la base

## Design system

Source : `Design système ecommerce Divinexpress/_ds/`. Les tokens sont copiés dans `app/styles/tokens/`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add project README with setup instructions"
```

---

### Task 6: GitHub remote, push, and CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: nothing new.
- Produces: a `main` branch on `https://github.com/webmodernseo-code/Divinexpress.git` that CI runs against.

- [ ] **Step 1: Inspect the existing remote repo before touching branches**

```bash
git remote add origin https://github.com/webmodernseo-code/Divinexpress.git
git fetch origin
git ls-remote --heads origin
```

- [ ] **Step 2: Branch decision (do not skip this check)**

If `git ls-remote --heads origin` printed **no lines** (empty remote, no commits yet): proceed to Step 3.

If it printed **any line** (the remote already has commits, e.g. an auto-created README): **stop and ask the user** how to reconcile histories before pushing — do not force-push and do not silently merge. This is a judgment call for a human, not something to resolve automatically.

- [ ] **Step 3 (only if remote was empty — confirm with the user before pushing): Rename local branch and push**

```bash
git branch -m master main
git push -u origin main
```

- [ ] **Step 4: Create the CI workflow `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 5: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "Add GitHub Actions CI (lint + build)"
git push
```

- [ ] **Step 6: Verify CI passes**

```bash
gh run watch
```

Expected: the latest workflow run for the pushed commit completes with conclusion `success`. If `gh` CLI isn't authenticated locally, check the Actions tab on the GitHub repo instead.

---

### Task 7: Vercel deployment and domain

**Context:** User already has a Vercel account. All steps in this task that require interactive login or DNS changes are manual — they cannot be run by an unattended agent.

**Files:** none (infrastructure configuration only).

- [ ] **Step 1 (MANUAL — run yourself): Log in to Vercel CLI**

```bash
npx vercel login
```

Follow the browser prompt to authenticate.

- [ ] **Step 2 (MANUAL — run yourself): Link the project**

```bash
npx vercel link
```

When prompted, link to the GitHub repo `webmodernseo-code/Divinexpress`, project name `divinexpress`.

- [ ] **Step 3 (MANUAL — run yourself): Add the production database secret**

```bash
npx vercel env add DATABASE_URL production
```

Paste the same Neon connection string used in `.env` when prompted.

- [ ] **Step 4 (MANUAL — run yourself): Deploy to production**

```bash
npx vercel --prod
```

Expected: command prints a `https://*.vercel.app` production URL. Visit `<url>/fr` and confirm it renders the DIVINEXPRESS header/footer built in Task 3.

- [ ] **Step 5 (MANUAL — run yourself): Attach the domain**

```bash
npx vercel domains add divinexpress.fr
npx vercel domains inspect divinexpress.fr
```

The `inspect` output lists the exact A/CNAME records to create. Add those records at your domain registrar's DNS panel (wherever `divinexpress.fr` is currently managed).

- [ ] **Step 6 (MANUAL — run yourself): Verify DNS propagation and HTTPS**

```bash
npx vercel domains inspect divinexpress.fr
```

Expected: status shows the domain as verified. This can take from minutes to a few hours depending on DNS TTL — re-run the inspect command later if it's not verified immediately. Once verified, visit `https://divinexpress.fr/fr` in a browser and confirm it renders correctly with a valid HTTPS certificate.

---

## Definition of done for Phase 0

- [ ] `npm run lint` and `npm run build` pass locally and in CI.
- [ ] `http://localhost:3000/fr` and `/en` render the DivinExpress header/footer using design-system tokens (verified in Task 3).
- [ ] Neon database is migrated and seeded; `prisma studio` shows the seed data (verified in Task 4).
- [ ] `main` branch is pushed to `https://github.com/webmodernseo-code/Divinexpress.git` and the CI workflow is green (Task 6).
- [ ] Production deployment is live on Vercel and reachable at `https://divinexpress.fr/fr` over HTTPS (Task 7).
