'use client';

import { useState } from 'react';
import { useCart } from '../Cart/CartContext';
import { useToast } from '../Toast/ToastContext';
import { Rating } from '../Rating/Rating';
import { ProductCard } from '../ProductCard/ProductCard';
import { formatPrice } from '@/lib/pricing';
import type { Locale } from '@/i18n';
import styles from './ProductDetailClient.module.css';

type ProductVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
};

type ProductImage = {
  id: string;
  url: string;
  alt: string;
};

type ProductData = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  category: { name: string; slug: string };
  variants: ProductVariant[];
  images: ProductImage[];
};

export function ProductDetailClient({
  product,
  similarProducts = [],
  locale
}: {
  product: ProductData;
  similarProducts?: ProductData[];
  locale: Locale;
}) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const name = locale === 'fr' ? product.nameFr : product.nameEn;
  const description = locale === 'fr' ? product.descriptionFr : product.descriptionEn;

  // Extract unique colors and sizes
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));

  const [selectedColor, setSelectedColor] = useState(colors[0] || '');
  const [selectedSize, setSelectedSize] = useState(sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('info');

  // Multi-image gallery logic
  const baseImages = product.images.length > 0
    ? product.images
    : [{ id: 'placeholder', url: '/placeholder-product.svg', alt: name }];

  // Mock additional thumbnail angles for premium PDP layout
  const galleryItems = baseImages.length === 1
    ? [
        { id: '1', url: baseImages[0].url, alt: baseImages[0].alt },
        { id: '2', url: baseImages[0].url + '&fit=crop&w=600&h=600&q=80', alt: name + ' Detail 1' },
        { id: '3', url: baseImages[0].url + '&fit=crop&w=600&h=600&crop=center&q=80', alt: name + ' Detail 2' }
      ]
    : baseImages;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Find active variant matching selected color & size
  const activeVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  ) || product.variants[0];

  const handleQuantityChange = (val: number) => {
    if (val < 1) return;
    setQuantity(val);
  };

  const handleAddToBag = () => {
    if (!activeVariant) return;

    addToCart({
      productId: activeVariant.id,
      slug: product.slug,
      name: locale === 'fr' ? product.nameFr : product.nameEn,
      image: baseImages[0]?.url || '/placeholder-product.svg',
      priceCents: activeVariant.priceCents,
      size: activeVariant.size,
      color: activeVariant.color,
      quantity
    });

    showToast(
      locale === 'fr'
        ? `${name} ajouté au panier !`
        : `${name} added to bag!`
    );
  };

  // Mock product rating based on slug
  const getProductRating = (slug: string) => {
    const ratings: Record<string, number> = {
      'veste-wax-noire': 4.5,
      'tshirt-technique-blanc-homme': 4.3,
      'short-running-gris-homme': 4.1,
      'casquette-running-noire': 4.2,
      'legging-performance-noir-femme': 4.8,
      'brassiere-sport-blanche-femme': 4.6
    };
    return ratings[slug] || 4.5;
  };

  const ratingValue = getProductRating(product.slug);

  const accordions = [
    {
      key: 'info',
      title: locale === 'fr' ? 'Informations produit' : 'Product Information',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C0407" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      items: locale === 'fr' 
        ? ["Tissu satiné haut de gamme au fini lisse", "Coupe ajustée pour un confort optimal toute la journée", "Semelle légère offrant flexibilité et absorption des chocs", "Matériaux résistants pour un usage quotidien", "Coutures renforcées pour une durabilité accrue"]
        : ["Premium fabric with smooth satin finish", "Tailored fit for optimal all-day comfort", "Lightweight sole offering flexibility and shock absorption", "Durable materials for everyday wear", "Reinforced stitching for increased durability"]
    },
    {
      key: 'size',
      title: locale === 'fr' ? 'Conseils de taille' : 'Size Guide',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C0407" strokeWidth="1.6">
          <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
          <line x1="6" y1="7" x2="6" y2="12" />
          <line x1="10" y1="7" x2="10" y2="12" />
          <line x1="14" y1="7" x2="14" y2="12" />
          <line x1="18" y1="7" x2="18" y2="12" />
        </svg>
      ),
      items: locale === 'fr'
        ? ["Mesurez votre pied ou votre tour de taille en fin de journée pour plus de précision", "Comparez avec notre guide des tailles avant l'achat", "Entre deux tailles ? Choisissez la taille supérieure pour plus de confort"]
        : ["Measure your foot or waist at the end of the day for accuracy", "Compare with our size chart before purchasing", "Between sizes? Choose the larger size for more comfort"]
    },
    {
      key: 'shipping',
      title: locale === 'fr' ? 'Livraison & retours' : 'Shipping & Returns',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C0407" strokeWidth="1.6">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      items: locale === 'fr'
        ? ["Commandes traitées sous 1 à 2 jours ouvrés", "Livraison en 3 à 7 jours ouvrés selon la destination", "Suivi de commande envoyé par e-mail dès l'expédition", "Retours acceptés sous 14 jours, article non porté et dans son emballage d'origine"]
        : ["Orders processed within 1 to 2 business days", "Delivery in 3 to 7 business days depending on destination", "Tracking details sent by email upon dispatch", "Returns accepted within 14 days, unworn and in original packaging"]
    }
  ];

  const inStock = activeVariant && activeVariant.stock > 0;
  const stockColor = inStock ? '#0D6630' : '#B3271E';
  const stockLabel = inStock
    ? (locale === 'fr' ? 'En stock - Expédié sous 24h' : 'In Stock - Shipped within 24h')
    : (locale === 'fr' ? 'Rupture de stock' : 'Out of Stock');

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a href="/" className={styles.crumb}>
          {locale === 'fr' ? 'Accueil' : 'Home'}
        </a>
        <span className={styles.crumbSep}>/</span>
        <a href={`/${product.category.slug}`} className={styles.crumb}>
          {product.category.name}
        </a>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbActive}>{name}</span>
      </nav>

      {/* Main product presentation */}
      <div className={styles.layout}>
        {/* Left Column: Image Gallery */}
        <div className={styles.galleryCol}>
          <div className={styles.thumbnails}>
            {galleryItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={activeImageIndex === idx ? styles.thumbBtnActive : styles.thumbBtn}
              >
                <img src={item.url} alt="" className={styles.thumbImage} />
              </button>
            ))}
          </div>
          <div className={styles.imageWrapper}>
            <img
              src={galleryItems[activeImageIndex]?.url || '/placeholder-product.svg'}
              alt={galleryItems[activeImageIndex]?.alt || name}
              className={styles.mainImage}
            />
          </div>
        </div>

        {/* Right Column: Info & Selectors */}
        <div className={styles.infoCol}>
          {/* Rating */}
          <div className={styles.ratingRow}>
            <Rating value={ratingValue} id={product.slug} />
            <span className={styles.reviewsCount}>(140 {locale === 'fr' ? 'avis' : 'reviews'})</span>
          </div>

          <h1 className={styles.title}>{name}</h1>

          {/* Price */}
          {activeVariant && (
            <div className={styles.priceRow}>
              {activeVariant.compareAtPriceCents ? (
                <>
                  <span className={styles.priceSale}>
                    {formatPrice(activeVariant.priceCents, locale)}
                  </span>
                  <span className={styles.comparePrice}>
                    {formatPrice(activeVariant.compareAtPriceCents, locale)}
                  </span>
                </>
              ) : (
                <span className={styles.price}>
                  {formatPrice(activeVariant.priceCents, locale)}
                </span>
              )}
            </div>
          )}

          {/* Stock Status */}
          <div className={styles.stockRow}>
            <span className={styles.stockDot} style={{ background: stockColor }} />
            <span className={styles.stockText} style={{ color: stockColor }}>
              {stockLabel}
            </span>
          </div>

          {/* Description Short */}
          <p className={styles.descriptionShort}>
            {locale === 'fr'
              ? 'Conçu à partir de matières haut de gamme et écoresponsables. Allie flexibilité technique et style contemporain unique.'
              : 'Designed with premium eco-responsible materials. Combines technical flexibility and unique contemporary style.'}
          </p>

          {/* Selectors */}
          <div className={styles.selectors}>
            {/* Color selector */}
            {colors.length > 0 && (
              <div className={styles.selectorGroup}>
                <span className={styles.selectorLabel}>
                  {locale === 'fr' ? 'Couleur' : 'Color'}
                </span>
                <div className={styles.colorOptions}>
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={selectedColor === color ? styles.colorBtnActive : styles.colorBtn}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className={styles.selectorGroup}>
                <span className={styles.selectorLabel}>
                  {locale === 'fr' ? 'Taille' : 'Size'}
                </span>
                <div className={styles.sizeOptions}>
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={selectedSize === size ? styles.sizeBtnActive : styles.sizeBtn}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Dark Pulse Button */}
            <div className={styles.actionsRow}>
              <div className={styles.stepper}>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className={styles.stepBtn}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className={styles.quantityVal}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className={styles.stepBtn}
                >
                  +
                </button>
              </div>

              <div className={styles.ctaPulseWrap}>
                {inStock ? (
                  <button
                    type="button"
                    onClick={handleAddToBag}
                    className={styles.addToBagBtn}
                  >
                    {locale === 'fr' ? 'Ajouter au panier' : 'Add to Bag'}
                  </button>
                ) : (
                  <button type="button" className={styles.outOfStockBtn} disabled>
                    {locale === 'fr' ? 'Rupture de stock' : 'Out of Stock'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Accordions */}
          <div className={styles.accordions}>
            {accordions.map((acc) => (
              <div key={acc.key} className={styles.accordion}>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === acc.key ? null : acc.key)}
                  className={styles.accordionHeader}
                >
                  <span className={styles.accordionHeaderLeft}>
                    {acc.icon}
                    <span>{acc.title}</span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0C0407"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: openAccordion === acc.key ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {openAccordion === acc.key && (
                  <div className={styles.accordionBody}>
                    <ul className={styles.accordionList}>
                      {acc.items.map((item, idx) => (
                        <li key={idx} className={styles.accordionItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: Full Presentation Section */}
      <section className={styles.presentationSection}>
        <h2 className={styles.sectionHeading}>
          {locale === 'fr' ? 'Présentation du produit' : 'Product Presentation'}
        </h2>
        <p className={styles.presentationText}>{description}</p>
      </section>

      {/* Bottom: Similar Products Section */}
      {similarProducts.length > 0 && (
        <section className={styles.similarSection}>
          <h2 className={styles.sectionHeading}>
            {locale === 'fr' ? 'Produits similaires' : 'Similar Products'}
          </h2>
          <div className={styles.similarGrid}>
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
