# Premium Nike-Style UI Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Topbar, Footer, PLP Product Cards, and PDP Image Gallery to reproduce the modern, premium aesthetic (inspired by Nike) shown in the design specification document.

**Architecture:** Create an interactive client-side `<MessageCarousel>` for the Topbar, a fully responsive 4-column `<Footer>` with inline SVG payment icons, a dynamic variant color-selector on the `<ProductCard>`, and an interactive multi-view gallery component on the PDP.

**Tech Stack:** Next.js 14, React 18, next-intl, CSS Modules, TypeScript.

## Global Constraints

- No Tailwind — CSS Modules only, using design system tokens (`app/styles/tokens.css`).
- Fully typed TypeScript (all check steps must pass `npx tsc --noEmit`).
- Keep code clean, modular, and performant (using inline SVGs instead of external asset loading).

---

### Task 1: Topbar with Message Carousel & Selectors

**Files:**
- Create: `components/Header/MessageCarousel.tsx`
- Create: `components/Header/MessageCarousel.module.css`
- Modify: `components/Header/Header.tsx`
- Modify: `components/Header/Header.module.css`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `<MessageCarousel locale={Locale} />` client component.

- [ ] **Step 1: Add i18n strings for Topbar**

In `messages/fr.json`, under `"header"`, add:
```json
    "topbarMsg1": "Une question? Visitez notre page 'contact'",
    "topbarMsg2": "Livraison à l'internationale et retours gratuits",
    "countrySelect": "France (EUR €)",
    "langSelect": "Français"
```

In `messages/en.json`, under `"header"`, add:
```json
    "topbarMsg1": "Any questions? Visit our 'contact' page",
    "topbarMsg2": "International shipping and free returns",
    "countrySelect": "France (EUR €)",
    "langSelect": "English"
```

- [ ] **Step 2: Create MessageCarousel CSS module**

Create `components/Header/MessageCarousel.module.css` :
```css
.carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3, 0.75rem);
  font-family: var(--font-inter, 'Inter', sans-serif);
  font-size: 0.75rem;
  color: var(--text-primary-inverse, #ffffff);
  height: 100%;
}

.button {
  background: none;
  border: none;
  color: var(--text-primary-inverse, #ffffff);
  cursor: pointer;
  padding: 0 var(--space-1, 0.25rem);
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.button:hover {
  opacity: 1;
}

.icon {
  width: 0.8rem;
  height: 0.8rem;
}

.content {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  min-width: 250px;
  justify-content: center;
  transition: opacity 0.3s ease;
}
```

- [ ] **Step 3: Implement MessageCarousel component**

Create `components/Header/MessageCarousel.tsx` :
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './MessageCarousel.module.css';

export function MessageCarousel() {
  const t = useTranslations('header');
  const messages = [
    { text: t('topbarMsg1'), icon: '✉' },
    { text: t('topbarMsg2'), icon: '🚚' }
  ];

  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [index]);

  const changeSlide = (nextIndex: number) => {
    setOpacity(0);
    setTimeout(() => {
      setIndex(nextIndex);
      setOpacity(1);
    }, 300);
  };

  const handlePrev = () => {
    const nextIndex = index === 0 ? messages.length - 1 : index - 1;
    changeSlide(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = index === messages.length - 1 ? 0 : index + 1;
    changeSlide(nextIndex);
  };

  const current = messages[index];
  if (!current) return null;

  return (
    <div className={styles.carousel}>
      <button onClick={handlePrev} className={styles.button} aria-label="Previous message" type="button">
        <span className={styles.icon}>←</span>
      </button>
      <div className={styles.content} style={{ opacity }}>
        <span>{current.icon}</span>
        <span>{current.text}</span>
      </div>
      <button onClick={handleNext} className={styles.button} aria-label="Next message" type="button">
        <span className={styles.icon}>→</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Update Header.tsx styling and markup**

In `components/Header/Header.tsx`, import `MessageCarousel` and `getTranslations` to load selectors:
Replace the file contents to implement the complete Topbar with social networks and selectors:
```typescript
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { LocaleToggle } from './LocaleToggle';
import { SearchForm } from './SearchForm';
import { MessageCarousel } from './MessageCarousel';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <header>
      <div className={styles.topBar}>
        <div className={styles.social} aria-label="Social media links">
          <a href="#" className={styles.socialIcon} aria-label="Facebook">f</a>
          <a href="#" className={styles.socialIcon} aria-label="Instagram">ig</a>
          <a href="#" className={styles.socialIcon} aria-label="YouTube">yt</a>
          <a href="#" className={styles.socialIcon} aria-label="TikTok">tk</a>
        </div>
        
        <MessageCarousel />
        
        <div className={styles.selectors}>
          <div className={styles.selectorItem}>
            <span>🌐</span>
            <span>{t('langSelect')}</span>
            <span className={styles.chevron}>▾</span>
          </div>
          <div className={styles.selectorItem}>
            <span>📍</span>
            <span>{t('countrySelect')}</span>
            <span className={styles.chevron}>▾</span>
            <Suspense fallback={null}>
              <div className={styles.hiddenToggle}>
                <LocaleToggle current={locale} />
              </div>
            </Suspense>
          </div>
        </div>
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
    </header>
  );
}
```

- [ ] **Step 5: Style Header.module.css for Topbar**

In `components/Header/Header.module.css`, replace the `.topBar` styles and add classes for social and selectors:
```css
.topBar {
  background-color: var(--color-black, #111111);
  color: var(--text-primary-inverse, #ffffff);
  height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-8, 2rem);
  font-family: var(--font-inter, 'Inter', sans-serif);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.social {
  display: flex;
  gap: var(--space-4, 1rem);
  align-items: center;
}

.socialIcon {
  color: var(--text-primary-inverse, #ffffff);
  text-decoration: none;
  font-weight: bold;
  font-size: 0.8rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.socialIcon:hover {
  opacity: 1;
}

.selectors {
  display: flex;
  gap: var(--space-4, 1rem);
  align-items: center;
  font-size: 0.75rem;
}

.selectorItem {
  display: flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
  cursor: pointer;
  position: relative;
}

.chevron {
  font-size: 0.6rem;
  opacity: 0.7;
}

.hiddenToggle {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-black, #111111);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: none;
  z-index: 10;
}

.selectorItem:hover .hiddenToggle {
  display: block;
}

/* Rest of mainBar stays unchanged */
.mainBar {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-8, 2rem);
  border-bottom: var(--border-width-hairline) solid var(--surface-border);
}
...
```

- [ ] **Step 6: Run Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit Task 1**

```bash
git add components/Header messages/
git commit -m "feat: add animated topbar message carousel and localization selectors"
```

---

### Task 2: Nike-Style Footer Overhaul

**Files:**
- Create: `components/Footer/Footer.tsx`
- Create: `components/Footer/Footer.module.css`
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/[locale]/layout.module.css`

**Interfaces:**
- Produces: `<Footer locale={Locale} />` component.

- [ ] **Step 1: Create Footer CSS Module**

Create `components/Footer/Footer.module.css` :
```css
.footer {
  background-color: var(--color-black, #111111);
  color: #cccccc;
  padding: var(--space-12, 3rem) var(--space-8, 2rem) var(--space-6, 1.5rem);
  font-family: var(--font-inter, 'Inter', sans-serif);
  font-size: 0.8rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8, 2rem);
  margin-bottom: var(--space-10, 2.5rem);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.logoCol {
  display: flex;
  align-items: flex-start;
}

.logo {
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  border: 3px solid #ffffff;
  padding: var(--space-2) var(--space-4);
  line-height: 1;
}

.colTitle {
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: var(--space-4, 1rem);
  letter-spacing: 1px;
}

.linkList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 0.5rem);
}

.link {
  color: #cccccc;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link:hover {
  color: #ffffff;
}

.contactText {
  line-height: 1.6;
}

.social {
  display: flex;
  gap: var(--space-4, 1rem);
}

.socialIcon {
  color: #ffffff;
  opacity: 0.7;
  font-size: 1rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.socialIcon:hover {
  opacity: 1;
}

.bottomBar {
  border-top: 1px solid #333333;
  padding-top: var(--space-6, 1.5rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4, 1rem);
}

.payments {
  display: flex;
  gap: var(--space-3, 0.75rem);
  flex-wrap: wrap;
  justify-content: center;
}

.paymentIcon {
  height: 24px;
  opacity: 0.8;
}

.legalLinks {
  display: flex;
  gap: var(--space-4, 1rem);
  flex-wrap: wrap;
  justify-content: center;
  font-size: 0.7rem;
}

.legalLink {
  color: #777777;
  text-decoration: none;
  transition: color 0.2s ease;
}

.legalLink:hover {
  color: #ffffff;
}

.copyright {
  color: #777777;
  font-size: 0.7rem;
  margin-top: var(--space-2, 0.5rem);
}
```

- [ ] **Step 2: Implement Footer Component**

Create `components/Footer/Footer.tsx` :
```typescript
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './Footer.module.css';

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.logoCol}>
          <div className={styles.logo}>DX</div>
        </div>
        
        <div>
          <h3 className={styles.colTitle}>Liens rapides</h3>
          <ul className={styles.linkList}>
            <li><Link href="/" locale={locale} className={styles.link}>Accueil</Link></li>
            <li><Link href="/homme" locale={locale} className={styles.link}>Nos produits</Link></li>
            <li><Link href="#" locale={locale} className={styles.link}>Contact</Link></li>
            <li><Link href="#" locale={locale} className={styles.link}>Recherche</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className={styles.colTitle}>Contact</h3>
          <div className={styles.contactText}>
            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>BOUTIQUE DIVINEXPRESS</p>
            <p style={{ margin: '0 0 8px 0' }}>349 Avenue Jean Jaurès - 69007 Lyon</p>
            <p style={{ margin: '0' }}>support-dx@m-com.com</p>
          </div>
        </div>
        
        <div>
          <h3 className={styles.colTitle}>Réseaux sociaux</h3>
          <div className={styles.social}>
            <a href="#" className={styles.socialIcon}>f</a>
            <a href="#" className={styles.socialIcon}>ig</a>
            <a href="#" className={styles.socialIcon}>yt</a>
            <a href="#" className={styles.socialIcon}>tk</a>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <div className={styles.payments}>
          {/* Card Logos simulated with clean text Badges */}
          <span style={{ background: '#0070ba', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>Paypal</span>
          <span style={{ background: '#000', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}> Pay</span>
          <span style={{ background: '#1a1f3c', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>Visa</span>
          <span style={{ background: '#eb001b', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>Mastercard</span>
        </div>
        
        <div className={styles.legalLinks}>
          <a href="#" className={styles.legalLink}>Politique de confidentialité</a>
          <span>·</span>
          <a href="#" className={styles.legalLink}>Conditions d'utilisation</a>
          <span>·</span>
          <a href="#" className={styles.legalLink}>Mentions légales</a>
        </div>
        
        <div className={styles.copyright}>
          © {new Date().getFullYear()}, DivinExpress — Création Web Premium
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Integrate Footer in Layout**

In `app/[locale]/layout.tsx`, import `Footer` and replace the inline footer with `<Footer locale={locale} />` :
Modify `app/[locale]/layout.tsx` :
```typescript
import { Footer } from '@/components/Footer/Footer';
...
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
```

- [ ] **Step 4: Remove redundant layout styles**

In `app/[locale]/layout.module.css`, remove the `.footer` CSS class since the Footer styles are now handled by `Footer.module.css`.

- [ ] **Step 5: Run Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit Task 2**

```bash
git add components/Footer app/[locale]/layout.tsx app/[locale]/layout.module.css
git commit -m "feat: implement premium 4-column footer and clean up layout footer"
```

---

### Task 3: Interactive Variants Selector on ProductCard

**Files:**
- Modify: `components/ProductCard/ProductCard.tsx`
- Modify: `components/PriceDisplay/PriceDisplay.tsx`
- Modify: `components/PriceDisplay/PriceDisplay.module.css`

**Interfaces:**
- Updates ProductCard to be a `'use client'` component, tracking selected variant state.
- Updates PriceDisplay to show promo percent tag.

- [ ] **Step 1: Add promo percentage to PriceDisplay**

In `components/PriceDisplay/PriceDisplay.tsx`, update to calculate and show discount percentage:
```typescript
import type { Locale } from '@/i18n';
import { formatPrice } from '@/lib/pricing';
import styles from './PriceDisplay.module.css';

type PriceDisplayProps = {
  priceCents: number;
  compareAtPriceCents: number | null;
  locale: Locale;
  className?: string;
};

export function PriceDisplay({ priceCents, compareAtPriceCents, locale, className }: PriceDisplayProps) {
  const onSale = compareAtPriceCents !== null && compareAtPriceCents > priceCents;
  
  let discountPercent = 0;
  if (onSale && compareAtPriceCents) {
    discountPercent = Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {onSale && compareAtPriceCents !== null ? (
        <>
          <span className={styles.strike}>{formatPrice(compareAtPriceCents, locale)}</span>{' '}
          <span className={styles.sale}>{formatPrice(priceCents, locale)}</span>
          <span className={styles.discountBadge}>{discountPercent}% de réduction</span>
        </>
      ) : (
        <span>{formatPrice(priceCents, locale)}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add discount badge styling**

In `components/PriceDisplay/PriceDisplay.module.css`, add:
```css
.discountBadge {
  color: var(--color-success, #2e7d32);
  font-size: 0.8rem;
  font-weight: bold;
  margin-left: var(--space-2, 0.5rem);
}
```

- [ ] **Step 3: Refactor ProductCard as a client component with color circles selection**

In `components/ProductCard/ProductCard.tsx`, refactor to support color selection and responsive hover selector:
```typescript
'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { cheapestVariant } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import { matchVariant, type ProductFilters } from '@/lib/filters';
import { PriceDisplay } from '../PriceDisplay/PriceDisplay';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { size: string; color: string; priceCents: number; compareAtPriceCents: number | null }[];
};

const COLOR_MAP: Record<string, string> = {
  'Noir': '#000000',
  'Blanc': '#ffffff',
  'Gris': '#888888',
  'Bleu': '#0000ff'
};

export function ProductCard({
  product,
  locale,
  filters
}: {
  product: ProductCardData;
  locale: Locale;
  filters?: ProductFilters;
}) {
  const name = getLocalizedField(product, 'name', locale);
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0] || null
  );

  const matchedVariants = product.variants.filter((variant) => {
    // If user clicked on a color pastille, override active filters color
    const customFilters = {
      ...(filters ?? { sizes: [], colors: [], priceBuckets: [] }),
      colors: selectedColor ? [selectedColor] : []
    };
    return matchVariant(variant, customFilters);
  });

  const variantsToUse = matchedVariants.length > 0 ? matchedVariants : product.variants;
  const cheapest = cheapestVariant(variantsToUse);
  const image = product.images[0];
  
  const hasSale = product.variants.some(v => v.compareAtPriceCents !== null && v.compareAtPriceCents > v.priceCents);

  return (
    <div className={styles.cardContainer}>
      <Link href={`/produit/${product.slug}`} locale={locale} className={styles.card}>
        <div className={styles.imageWrap}>
          {image ? (
            <img src={image.url} alt={image.alt} className={styles.image} />
          ) : (
            <div className={styles.placeholder}>Photo</div>
          )}
        </div>
        
        {hasSale && <div className={styles.promoTag}>Offre spéciale</div>}
        
        <div className={styles.name}>{name}</div>
        {cheapest && (
          <PriceDisplay
            priceCents={cheapest.priceCents}
            compareAtPriceCents={cheapest.compareAtPriceCents}
            locale={locale}
            className={styles.price}
          />
        )}
      </Link>
      
      {colors.length > 1 && (
        <div className={styles.colorSelector}>
          {colors.map((color) => {
            const hex = COLOR_MAP[color] || '#cccccc';
            const isActive = color === selectedColor;
            return (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`${styles.colorCircle} ${isActive ? styles.colorCircleActive : ''}`}
                style={{ backgroundColor: hex }}
                title={color}
                aria-label={`Select color ${color}`}
                type="button"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update ProductCard.module.css**

Update styles in `components/ProductCard/ProductCard.module.css` to handle pastilles and tags:
```css
.cardContainer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 0.5rem);
}

.card {
  display: block;
  color: var(--text-primary);
  text-decoration: none;
  position: relative;
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
  transition: transform 0.2s ease;
}

.card:hover .imageWrap {
  transform: scale(1.02);
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

.promoTag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-success, #2e7d32);
  color: #fff;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
}

.name {
  margin-top: var(--space-2);
  font-size: var(--body-sm-size);
  font-weight: var(--weight-semibold, 600);
}

.price {
  font-size: var(--price-size);
  font-weight: var(--price-weight);
  margin-top: 2px;
}

.colorSelector {
  display: flex;
  gap: 6px;
  padding: 4px 0;
}

.colorCircle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.15);
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s ease;
}

.colorCircle:hover {
  transform: scale(1.2);
}

.colorCircleActive {
  outline: 2px solid var(--color-black, #111111);
  outline-offset: 1px;
}
```

- [ ] **Step 5: Run Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit Task 3**

```bash
git add components/ProductCard components/PriceDisplay
git commit -m "feat: add variant color selectors on PLP and promo badges"
```

---

### Task 4: PDP Multi-View Gallery with Vignettes

**Files:**
- Modify: `components/Gallery/Gallery.tsx`
- Modify: `components/Gallery/Gallery.module.css`

**Interfaces:**
- Overhauls Gallery to be a `'use client'` interactive component with thumbnails and navigation arrows.

- [ ] **Step 1: Replace Gallery CSS Module**

In `components/Gallery/Gallery.module.css`, replace with a multi-view layout:
```css
.container {
  display: flex;
  gap: var(--space-4, 1rem);
  width: 100%;
}

@media (max-width: 640px) {
  .container {
    flex-direction: column-reverse;
  }
}

.thumbnails {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 0.5rem);
  width: 70px;
}

@media (max-width: 640px) {
  .thumbnails {
    flex-direction: row;
    width: 100%;
  }
}

.thumbButton {
  border: 1px solid var(--surface-border, #e0e0e0);
  background: none;
  padding: 0;
  cursor: pointer;
  aspect-ratio: 1 / 1;
  width: 100%;
  overflow: hidden;
}

.thumbActive {
  border: 2px solid var(--color-black, #111111);
}

.thumbImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mainView {
  flex: 1;
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: #f6f6f6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--surface-border, #e0e0e0);
}

.mainImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: var(--body-sm-size);
  color: var(--text-muted);
}

.badge {
  position: absolute;
  top: var(--space-3, 0.75rem);
  left: var(--space-3, 0.75rem);
  background: #ffffff;
  color: var(--color-black, #111111);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.navControls {
  position: absolute;
  bottom: var(--space-3, 0.75rem);
  right: var(--space-3, 0.75rem);
  display: flex;
  gap: var(--space-2, 0.5rem);
}

.navButton {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  color: var(--color-black, #111111);
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: background-color 0.2s ease;
}

.navButton:hover {
  background-color: #f0f0f0;
}
```

- [ ] **Step 2: Implement Multi-View Gallery in Gallery.tsx**

In `components/Gallery/Gallery.tsx`, implement the interactive state:
```typescript
'use client';

import { useState } from 'react';
import styles from './Gallery.module.css';

type GalleryImage = {
  url: string;
  alt: string;
};

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={styles.mainView}>
        <div className={styles.placeholder}>Photo</div>
      </div>
    );
  }

  // Generate simulated thumbnail views if only 1 image exists for seeds
  const activeImages = images.length > 1 ? images : [
    images[0],
    { url: images[0].url, alt: `${images[0].alt} - View 2` },
    { url: images[0].url, alt: `${images[0].alt} - View 3` }
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? activeImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === activeImages.length - 1 ? 0 : prev + 1));
  };

  const currentImage = activeImages[activeIndex];

  return (
    <div className={styles.container}>
      <div className={styles.thumbnails}>
        {activeImages.map((image, idx) => (
          <button
            key={`${image.url}-${idx}`}
            onClick={() => setActiveIndex(idx)}
            className={`${styles.thumbButton} ${idx === activeIndex ? styles.thumbActive : ''}`}
            type="button"
          >
            <img src={image.url} alt={image.alt} className={styles.thumbImage} />
          </button>
        ))}
      </div>
      
      <div className={styles.mainView}>
        <div className={styles.badge}>★ Bien noté</div>
        
        <img src={currentImage.url} alt={currentImage.alt} className={styles.mainImage} />
        
        <div className={styles.navControls}>
          <button onClick={handlePrev} className={styles.navButton} aria-label="Previous image" type="button">
            ‹
          </button>
          <button onClick={handleNext} className={styles.navButton} aria-label="Next image" type="button">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run Typecheck & tests**

Run: `npx tsc --noEmit && npm run test`
Expected: PASS

- [ ] **Step 4: Commit Task 4**

```bash
git add components/Gallery/
git commit -m "feat: overhaul PDP product image gallery with vertical thumbnails and nav controls"
```

---

## Verification Plan

### Automated Tests
Run: `npm run test`
Expected: All unit tests pass.

Run: `npx tsc --noEmit && npm run build`
Expected: Production build succeeds without errors.

### Manual Verification
1. Start local dev server (`npm run dev`).
2. Go to homepage, observe Topbar scrolling automatically and manually via arrow controls.
3. Switch locale and verify language/currency indicator.
4. Verify Footer looks exactly like mockup (4 columns, clean card icons inline).
5. Open PLP (`/fr/homme`), verify product cards display color pastilles. Click pastilles and ensure price matches the selected variant.
6. Open PDP (`/fr/produit/veste-wax-noire`), verify vertical thumbnails list is interactive, and "★ Bien noté" badge overlays main image.
