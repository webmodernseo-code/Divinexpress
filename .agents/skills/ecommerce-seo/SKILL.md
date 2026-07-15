---
name: ecommerce-seo
description: Use when building or auditing pages for an ecommerce clothing site (product pages, category pages, checkout, dashboard, homepage) — covers technical SEO, on-page SEO, Schema.org structured data, Core Web Vitals, and international/local SEO for a .fr domain targeting France, West Africa, and the UK.
---

# Ecommerce SEO (DivinExpress)

## Overview

Ecommerce SEO fails silently: pages render fine for users but stay invisible to Google because of missing metadata, duplicate/thin content, broken structured data, or slow Core Web Vitals. The core principle: **every page type (home, category, product, cart, checkout, account/dashboard) has a different SEO job** — treat them differently instead of applying one template everywhere.

## When to Use

- Creating or editing any page/route in the Next.js app (product, category, blog, landing pages)
- Writing `generateMetadata`, `sitemap.ts`, `robots.ts`, or `<head>` content
- Adding product data, images, or descriptions
- Before launch, or when organic traffic/rankings need diagnosis
- NOT for paid ads, social media strategy, or copywriting tone (different skill)

## Page-Type Checklist

| Page type | Priority SEO job | Must have |
|---|---|---|
| Homepage | Brand + top categories | Unique title/description, `Organization` schema, internal links to top categories |
| Category (e.g. "Robes femme") | Rank for category keywords | Keyword-rich H1, intro text (150+ words), `BreadcrumbList`, pagination via `rel=next/prev` or canonical to page 1, filters must not create duplicate indexable URLs |
| Product | Rank for product + long-tail queries | Unique title (`Produit – Marque – DivinExpress`), unique description (never copy supplier text), `Product` + `Offer` schema with price/currency/availability, ALT text on every image, size/stock info in visible text |
| Cart / Checkout | Should NOT be indexed | `noindex` — never spend crawl budget here, but keep fast (affects UX/CWV signals) |
| Dashboard (admin/client account) | Should NOT be indexed | `noindex, nofollow` on all routes under `/dashboard` or `/compte` |
| Blog / guides (optional) | Long-tail + trust content | Target buyer questions ("comment choisir sa taille", "mode de paiement Afrique de l'Ouest") |

## Technical SEO (Next.js specifics)

- Use the App Router **Metadata API** (`generateMetadata`) per page — never a single static `<title>` for all routes.
- Generate `sitemap.ts` and `robots.ts` dynamically from the product/category database, not hand-maintained.
- Canonical URLs on every page (`alternates.canonical`), especially for filtered/sorted category views.
- `next/image` for every product image — enforces lazy loading, responsive `srcset`, and WebP/AVIF, which directly drives Core Web Vitals (LCP).
- Use ISR (`revalidate`) or SSR for product/category pages — SEO needs server-rendered HTML, not client-only rendering, so product content must never depend on client-side fetch for first paint.
- Clean URL structure: `/produits/robe-longue-wax` not `/produits?id=1234`.
- HTTPS + single canonical host (`https://divinexpress.fr`, decide `www` vs non-`www` once and 301-redirect the other).

## Structured Data (Schema.org / JSON-LD)

Minimum for an ecommerce site:
- `Organization` (or `OnlineStore`) on the homepage — name, logo, `sameAs` social links.
- `Product` + nested `Offer` on every product page: `price`, `priceCurrency` (EUR, and note the accepted local payment methods in `acceptedPaymentMethod` if relevant), `availability`, `sku`.
- `BreadcrumbList` on category and product pages.
- `AggregateRating`/`Review` only if real reviews exist — never fake it (Google penalty risk).
- Validate every schema with Google's Rich Results Test before shipping.

## International / Local SEO (France + West Africa + UK)

DivinExpress targets three distinct markets on one `.fr` domain — each needs its own language/currency/hreflang signal, not one generic international page:

| Market | `hreflang` | Language | Currency | Notes |
|---|---|---|---|---|
| France (primary) | `fr-fr` | French | EUR | Domain default (`.fr` + `lang="fr"`) |
| West Africa (Sénégal, Côte d'Ivoire, Mali, ...) | `fr-sn`, `fr-ci`, `fr-ml`, ... (per country actually served) | French | EUR or local (state clearly) | Separate `hreflang` per country only if shipping/pricing genuinely differs — otherwise one shared `fr` variant with explicit shipping-zone text is enough |
| United Kingdom | `en-gb` | English (British spelling: "colour", "trousers", not "pants") | GBP | Needs a real translated `/en` (or `en.divinexpress.fr` / subpath) route, not machine-translated duplicate content — Google treats thin auto-translation as low quality |
| Fallback | `x-default` | — | — | Points to the French version for unmatched locales |

- Implement via Next.js `alternates.languages` in `generateMetadata`, generating full `<link rel="alternate" hreflang="...">` sets per page (self-referencing + all variants + `x-default`).
- UK-specific: separate `Product` schema instance with `priceCurrency: "GBP"`, UK sizing notes (UK vs EU size conversion is a common ecommerce SEO long-tail win — "UK size 10 conversion"), and UK delivery/returns terms in visible text (Royal Mail/courier, customs post-Brexit if shipping from FR/West Africa stock).
- Mention accepted local payment methods per market as visible page text, not just in checkout UI: Orange Money, Wave, Mobile Money, virement bancaire for West Africa/France; card/Apple Pay/PayPal for UK — this is both a trust/conversion signal and adds relevant long-tail keyword content ("paiement Mobile Money Afrique de l'Ouest", "UK delivery clothing store").
- Add a `FAQPage` schema block answering shipping/payment questions per region if content exists on the page.
- Local backlinks/directories matter more than generic global backlinks for regional ranking: annuaires locaux for France/West Africa, UK fashion/marketplace directories for the UK market.
- Never serve the same URL with different content by geo-IP redirect alone without hreflang — Google needs crawlable, distinct URLs per market to index each correctly.

## Core Web Vitals for Ecommerce

- LCP target < 2.5s: usually the hero/product image — preload it, serve via `next/image` with `priority`.
- CLS: reserve image/banner dimensions, avoid layout shift from lazy-loaded filters or cookie banners.
- INP: keep "Add to cart" and filter interactions light — avoid blocking JS on product/category pages.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Copying supplier/manufacturer product descriptions | Write unique descriptions — duplicate content ranks poorly |
| Indexable filter/sort URL combinations (`?color=red&size=m&sort=price`) | Canonical to the clean category URL, or `noindex` faceted variants |
| Dashboard/admin/cart pages indexed | `noindex, nofollow` via metadata or `robots.ts` disallow |
| Missing ALT text on product images | Always describe product + attribute ("Robe wax orange manches longues") |
| Client-only rendered product content | Ensure SSR/ISR so crawlers see full content without executing JS |
| One generic meta description for all products | Generate per-product from unique attributes (name, material, color) |

## Note on scope

This is a reference/checklist skill (not a discipline-enforcing one), so it wasn't built through the full adversarial pressure-testing cycle — it was written directly from established ecommerce SEO practice and Next.js App Router capabilities. Treat it as a checklist to apply and refine as the site's real content and analytics data come in.
