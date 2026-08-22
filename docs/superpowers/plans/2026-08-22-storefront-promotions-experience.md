# Storefront Promotions Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver direct category browsing, unified branding, realistic testimonials, and a product-linked promotional carousel managed from the dashboard.

**Architecture:** Store promotion slides in a dedicated relational table linked to products, expose validated admin/public repositories, and render locale-aware product links. Keep home sections focused in separate components and reuse the existing upload and catalogue patterns.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Tailwind CSS 4, next-intl, SQLite/PostgreSQL adapter, Zod, Vitest, Testing Library, Swiper

**Spec:** `docs/superpowers/specs/2026-08-22-storefront-dashboard-experience-design.md`

## Global Constraints

- Empty-category copy must be exactly `Aucun produit n’est disponible dans cette catégorie pour le moment — revenez très bientôt.`
- Every promotion image has four rounded corners.
- Public promotion destinations are derived from active product slugs; arbitrary URLs are forbidden.
- Use all ten supplied carousel images as initial slides.
- Respect reduced-motion preferences and preserve keyboard access.
- Preserve unrelated user changes.

---

### Task 1: Add promotion-slide persistence

**Files:**
- Create: `src/server/db/migrations/0005_promotion_slides.sql`
- Create: `src/server/db/migration-0005.test.ts`
- Create: `src/server/promotions/repository.ts`
- Create: `src/server/promotions/repository.test.ts`
- Modify: `src/server/db/seed.ts`

**Interfaces:**
- Produces: `PromotionSlide`, `PromotionSlideInput`, and `PromotionRepository`
- Produces: `listPublished(): Promise<PromotionSlide[]>`, `listAdmin(): Promise<PromotionSlide[]>`, `create(input)`, `update(id, input)`, `delete(id)`, `reorder(ids)`

- [ ] **Step 1: Write the failing migration test**

Migrate an in-memory database and assert `promotion_slides` contains `id`, `image_url`, `product_id`, `position`, `active`, `created_at`, and `updated_at`; inserting a missing `product_id` must reject.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/server/db/migration-0005.test.ts`

Expected: FAIL because migration 0005 is absent.

- [ ] **Step 3: Add the idempotent migration**

Create the strict table with `product_id REFERENCES products(id) ON DELETE CASCADE`, `position INTEGER NOT NULL`, and `active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))`; add an index on `(active, position)`.

- [ ] **Step 4: Verify migration GREEN**

Run: `npm test -- src/server/db/migration-0005.test.ts src/server/db/schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing repository tests**

Use a real in-memory database. Assert `listPublished()` returns only active slides joined to active products in ascending position and includes the product slug. Assert reorder writes literal positions `0, 1, 2` in the submitted order.

- [ ] **Step 6: Verify repository RED**

Run: `npm test -- src/server/promotions/repository.test.ts`

Expected: FAIL because the repository is absent.

- [ ] **Step 7: Implement the repository and seed mapping**

Define `PromotionSlide` as `{ id: string; imageUrl: string; productId: string; productSlug: string; productNameFr: string; productNameEn: string; position: number; active: boolean }`. Seed local image paths `/image/promotions/carroussel1.png` through `/image/promotions/carroussel10.png`, mapping them to existing active products by category relevance.

- [ ] **Step 8: Verify GREEN**

Run: `npm test -- src/server/promotions/repository.test.ts src/server/db/migration-0005.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add -- src/server/db/migrations/0005_promotion_slides.sql src/server/db/migration-0005.test.ts src/server/promotions/repository.ts src/server/promotions/repository.test.ts src/server/db/seed.ts
git commit -m "feat: persist promotional carousel slides"
```

### Task 2: Add promotion administration APIs

**Files:**
- Create: `src/app/api/admin/promotions/route.ts`
- Create: `src/app/api/admin/promotions/[id]/route.ts`
- Create: `src/app/api/admin/promotions/route.test.ts`
- Modify: `src/app/api/admin/upload-signature/route.ts`

**Interfaces:**
- Consumes: `PromotionRepository`
- Produces: authenticated `GET`, `POST`, `PATCH`, and `DELETE` JSON contracts

- [ ] **Step 1: Write failing route tests**

Cover 401 without an admin, 403 for support mutations, 400 for missing product/image, 201 for create, 200 for update/reorder, and 204 for delete. Use complete product/slide fixtures and a real repository boundary where practical.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/api/admin/promotions/route.test.ts`

Expected: FAIL because routes are absent.

- [ ] **Step 3: Implement validated routes**

Use Zod schemas: image URL/path string, non-empty product ID, boolean active, nonnegative integer position, and reorder array of unique IDs. Require owner/manager for mutations and confirm the selected product has status `active`.

- [ ] **Step 4: Scope promotion uploads**

Allow the signed-upload route to accept a validated `{ purpose: 'products' | 'promotions' }` body and select `divinexpress/products` or `divinexpress/promotions` server-side.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/app/api/admin/promotions/route.test.ts src/components/admin/ImageUploader.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/app/api/admin/promotions src/app/api/admin/upload-signature/route.ts src/components/admin/ImageUploader.test.tsx
git commit -m "feat: add promotion management API"
```

### Task 3: Build the dashboard carousel manager

**Files:**
- Create: `src/components/admin/PromotionCarouselManager.tsx`
- Create: `src/components/admin/PromotionCarouselManager.test.tsx`
- Modify: `src/components/admin/ImageUploader.tsx`
- Modify: `src/components/admin/DashboardOverview.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/promotions`, product list, and promotion mutation routes
- Produces: dashboard create/edit/activate/reorder/delete UI

- [ ] **Step 1: Write failing manager tests**

Assert the real component requires both image and product, displays four-corner-rounded previews, saves a valid slide, toggles publication, reorders slides, and confirms deletion. Mock only HTTP and Cloudinary boundaries.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/admin/PromotionCarouselManager.test.tsx`

Expected: FAIL because the component is absent.

- [ ] **Step 3: Add upload-purpose support**

Add `purpose?: 'products' | 'promotions'` to `ImageUploader`, default it to `products`, and send `{ purpose }` to the signature route.

- [ ] **Step 4: Implement the manager**

Keep editing state local, fetch slides and active products, use `ImageUploader max={1} purpose="promotions"`, render `rounded-2xl overflow-hidden` previews, and expose explicit French/English loading, empty, success, and failure states.

- [ ] **Step 5: Add manager to the overview**

Place it after performance cards so the campaign is visible without displacing primary store metrics.

- [ ] **Step 6: Verify GREEN**

Run: `npm test -- src/components/admin/PromotionCarouselManager.test.tsx src/components/admin/ImageUploader.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- src/components/admin/PromotionCarouselManager.tsx src/components/admin/PromotionCarouselManager.test.tsx src/components/admin/ImageUploader.tsx src/components/admin/DashboardOverview.tsx
git commit -m "feat: manage promotional slides in dashboard"
```

### Task 4: Simplify categories and publish supplied assets

**Files:**
- Modify: `src/components/home/HomeCollection.tsx`
- Create: `src/components/home/HomeCollection.test.tsx`
- Modify: `src/components/layout/Header.tsx`
- Copy: `icon-*.png` to `public/image/categories/`

**Interfaces:**
- Consumes: `Category`, `Product[]`
- Produces: direct category selection with no filter controls

- [ ] **Step 1: Write failing behavior tests**

Render with products from two categories. Click `Homme`, assert only homme products remain and no filter combobox exists. Render with no homme products and assert the exact approved empty sentence.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/home/HomeCollection.test.tsx`

Expected: FAIL because filters remain and copy differs.

- [ ] **Step 3: Publish assets and implement direct selection**

Copy the four supplied category images, update `CATEGORY_IMAGES`, remove filter state and controls, and make header category items direct locale-aware links to `/?categorie=<category>#collection`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/home/HomeCollection.test.tsx src/app/[locale]/page.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- public/image/categories src/components/home/HomeCollection.tsx src/components/home/HomeCollection.test.tsx src/components/layout/Header.tsx
git commit -m "feat: simplify category browsing"
```

### Task 5: Unify DivinExpress brand lockups

**Files:**
- Modify: `src/components/ui/Logo.tsx`
- Create: `src/components/ui/Logo.test.tsx`
- Modify: `src/components/admin/LoginPanel.tsx`

**Interfaces:**
- Produces: `Logo({ className, markClassName, wordmarkClassName })`

- [ ] **Step 1: Write failing logo tests**

Render `Logo` and assert it contains both mark and wordmark images in that order. Render `LoginPanel` and assert the form-side lockup uses both visual elements.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/ui/Logo.test.tsx`

Expected: FAIL because the shared logo contains only the wordmark.

- [ ] **Step 3: Implement the reusable lockup**

Compose `/branding/logo-divinexpress-mark.png` and `/branding/logo-divinexpress.png` in an inline flex link, with independent responsive classes and meaningful combined accessibility labeling.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/ui/Logo.test.tsx src/components/admin/AdminExperience.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/ui/Logo.tsx src/components/ui/Logo.test.tsx src/components/admin/LoginPanel.tsx
git commit -m "feat: unify DivinExpress brand lockups"
```

### Task 6: Add testimonials and reassurance

**Files:**
- Create: `src/components/home/CustomerTestimonials.tsx`
- Create: `src/components/home/CustomerTestimonials.test.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`
- Modify: `package.json`

**Interfaces:**
- Produces: `CustomerTestimonials()` with localized testimonial and reassurance content

- [ ] **Step 1: Write failing testimonial tests**

Assert a testimonial can be selected by an accessible control, the section contains realistic DivinExpress purchase/delivery context, and the four reassurance items render without company logos.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/home/CustomerTestimonials.test.tsx`

Expected: FAIL because the section is absent.

- [ ] **Step 3: Install only the required animation dependency**

Run: `npm install framer-motion`

Expected: package and lockfile update successfully. Do not add Radix or shadcn primitives when semantic HTML and existing styles suffice.

- [ ] **Step 4: Implement localized testimonials**

Create three fictional but credible testimonials covering Paris, Abidjan, and Dakar orders. Use buttons for navigation, timer cleanup, reduced-motion detection, and Lucide icons for the four reassurance items.

- [ ] **Step 5: Compose the section on the home page**

Place testimonials before the final promotional carousel.

- [ ] **Step 6: Verify GREEN**

Run: `npm test -- src/components/home/CustomerTestimonials.test.tsx src/app/[locale]/page.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- package.json package-lock.json src/components/home/CustomerTestimonials.tsx src/components/home/CustomerTestimonials.test.tsx src/app/[locale]/page.tsx messages/fr.json messages/en.json
git commit -m "feat: add customer testimonials and reassurance"
```

### Task 7: Render the product-linked promotion carousel

**Files:**
- Create: `src/components/ui/card-carousel.tsx`
- Create: `src/components/home/PromotionCarousel.tsx`
- Create: `src/components/home/PromotionCarousel.test.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `package.json`
- Copy: `carrousel*.png` and `carroussel*.png` to `public/image/promotions/`

**Interfaces:**
- Consumes: `PromotionSlide[]`
- Produces: `PromotionCarousel({ slides })`

- [ ] **Step 1: Write failing carousel tests**

Render two slides and assert each image is inside a locale-aware product link, every card has `rounded-*` plus `overflow-hidden`, navigation controls have accessible names, and the old `NewArrivalsCarousel` is absent from home composition.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/home/PromotionCarousel.test.tsx src/app/[locale]/page.test.tsx`

Expected: FAIL because the carousel is absent.

- [ ] **Step 3: Install Swiper**

Run: `npm install swiper`

Expected: package and lockfile update successfully.

- [ ] **Step 4: Adapt the supplied component**

Use Swiper coverflow, autoplay, pagination, and navigation without duplicating slides in markup. Render responsive slide widths, four rounded corners, touch/grab behavior, interaction pause, and a reduced-motion-safe autoplay setting.

- [ ] **Step 5: Load published slides on the home page**

Query `PromotionRepository.listPublished()` alongside catalogue products, remove `NewArrivalsCarousel`, and render `PromotionCarousel` as the last home section.

- [ ] **Step 6: Verify GREEN**

Run: `npm test -- src/components/home/PromotionCarousel.test.tsx src/app/[locale]/page.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- package.json package-lock.json public/image/promotions src/components/ui/card-carousel.tsx src/components/home/PromotionCarousel.tsx src/components/home/PromotionCarousel.test.tsx src/app/[locale]/page.tsx src/app/[locale]/page.test.tsx
git commit -m "feat: publish product-linked promotion carousel"
```

