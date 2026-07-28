'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useStore } from './StoreContext';
import { validatePromoCode, createOrder } from '@/app/[locale]/actions';

// Type definitions
interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
}

interface Image {
  url: string;
  alt: string;
}

interface Product {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  featured: boolean;
  categoryId: string;
  variants: Variant[];
  images: Image[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BoutiqueClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export const BoutiqueClient: React.FC<BoutiqueClientProps> = ({
  initialProducts,
  categories
}) => {
  const t = useTranslations('Common');
  const locale = useLocale();
  const { cart, addToCart, removeFromCart, favorites, toggleFavorite } = useStore();

  // View States
  const [activeCategory, setActiveCategory] = useState<string>('femme');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');
  
  // UI Drawers & Modals
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [favoritesOpen, setFavoritesOpen] = useState<boolean>(false);
  const [trackingOpen, setTrackingOpen] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  
  // Quick View / Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number>(0);
  const [activeSize, setActiveSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [customAge, setCustomAge] = useState<string>('');

  // Checkout States
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [shippingFullname, setShippingFullname] = useState<string>('');
  const [shippingEmail, setShippingEmail] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<string>('free');
  const [paymentType, setPaymentType] = useState<string>('momo');
  const [momoOperator, setMomoOperator] = useState<string>('Orange');
  const [momoPhone, setMomoPhone] = useState<string>('');
  
  // Credit Card input states
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  // Promo Code
  const [promoCodeText, setPromoCodeText] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<{ type: string; value: number } | null>(null);

  // Tracking
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [trackingResult, setTrackingResult] = useState<boolean>(false);

  // Order Success
  const [orderNumber, setOrderNumber] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Filter products dynamically
  const filteredProducts = initialProducts
    .filter((p) => {
      // Find category slug
      const cat = categories.find((c) => c.id === p.categoryId);
      if (!cat) return false;
      return cat.slug === activeCategory;
    })
    .filter((p) => {
      const name = locale === 'fr' ? p.nameFr : p.nameEn;
      const desc = locale === 'fr' ? p.descriptionFr : p.descriptionEn;
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      const priceA = a.variants[0]?.priceCents || 0;
      const priceB = b.variants[0]?.priceCents || 0;
      if (sortBy === 'low-high') return priceA - priceB;
      if (sortBy === 'high-low') return priceB - priceA;
      return 0;
    });

  // Price formatting helper
  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: locale === 'fr' ? 'EUR' : 'USD'
    });
  };

  // Subtotals and totals
  const subtotalCents = cart.reduce((acc, item) => acc + item.price * item.quantity * 100, 0);
  const shippingCents = shippingMethod === 'express' ? 900 : 0;
  const taxCents = 500; // Fixed tax in original design
  
  let discountCents = 0;
  if (promoDiscount) {
    if (promoDiscount.type === 'percent') {
      discountCents = Math.round(subtotalCents * (promoDiscount.value / 100));
    } else {
      discountCents = promoDiscount.value * 100;
    }
  }

  const totalCents = Math.max(0, subtotalCents + shippingCents + taxCents - discountCents);

  // Apply promo code action
  const handleApplyPromo = async () => {
    if (!promoCodeText) return;
    const result = await validatePromoCode(promoCodeText);
    if (result.success && result.type && result.value) {
      setPromoDiscount({ type: result.type, value: result.value });
      triggerToast(locale === 'fr' ? 'Code promo appliqué !' : 'Promo code applied!');
    } else {
      triggerToast(locale === 'fr' ? 'Code invalide.' : 'Invalid code.');
    }
  };

  // Order submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 1) {
      if (!shippingFullname || !shippingEmail || !shippingAddress) {
        triggerToast(locale === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please fill all fields.');
        return;
      }
      setCheckoutStep(2);
      return;
    }

    if (checkoutStep === 2) {
      // Simulate payment processing
      const items = cart.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price
      }));

      const result = await createOrder({
        email: shippingEmail,
        phone: momoPhone || '—',
        address: shippingAddress,
        paymentMethod: paymentType === 'momo' ? momoOperator : 'Carte Bancaire',
        total: totalCents / 100,
        items,
        promoCode: promoDiscount ? promoCodeText : undefined
      });

      if (result.success && result.orderNumber) {
        setOrderNumber(result.orderNumber);
        setCheckoutStep(3);
        // Clear cart
        cart.forEach((c) => removeFromCart(c.variantId));
      } else {
        triggerToast('Error during order creation.');
      }
    }
  };

  return (
    <div className="main-wrapper" id="main-container">
      {/* DESKTOP HEADER */}
      <header className="desktop-header">
        <div className="header-container">
          <a href="#" className="logo" id="desktop-logo">DivinExpress</a>
          <nav className="desktop-nav">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`nav-link ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <div className="search-box-desktop">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="action-icon-btn" onClick={() => setTrackingOpen(true)} title="Suivi de colis">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </button>
            <button className="action-icon-btn" onClick={() => setFavoritesOpen(true)} title="Favoris">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="action-icon-btn" onClick={() => setCartOpen(true)} title="Panier">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="cart-badge-dot">{cart.reduce((acc, c) => acc + c.quantity, 0)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* DESKTOP HERO SECTION */}
      <section className="desktop-hero">
        <div className="hero-container">
          <div className="hero-text-block">
            <span className="hero-subtitle">DivinExpress Atelier / Collection '26</span>
            <h1 className="hero-title">Discover Your<br />Unique Style</h1>
            <p className="hero-desc">Des silhouettes épurées conçues avec une exigence artisanale absolue. Une expression de confort et de minimalisme moderne pour votre garde-robe quotidienne.</p>
            <a href="#catalog-section" className="hero-cta-btn">Découvrir la Collection</a>
          </div>
          <div className="hero-image-block">
            <img src="/images/onboarding.png" alt="Modèle DivinExpress" />
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section id="catalog-section" className="screen">
        <div className="catalog-header-desktop">
          <h2>Notre Collection</h2>
          <p>Des designs exclusifs et minimalistes pour hommes et femmes.</p>
        </div>

        {/* Sorting options */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1.5px solid var(--accent-light)',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600
            }}
          >
            <option value="default">{locale === 'fr' ? 'Par défaut' : 'Default'}</option>
            <option value="low-high">{locale === 'fr' ? 'Prix croissant' : 'Price: Low to High'}</option>
            <option value="high-low">{locale === 'fr' ? 'Prix décroissant' : 'Price: High to Low'}</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="screen-content">
          <div className="products-wrapper">
            <div className="product-grid">
              {filteredProducts.map((p) => {
                const name = locale === 'fr' ? p.nameFr : p.nameEn;
                const price = p.variants[0]?.priceCents || 0;
                return (
                  <div key={p.id} className="product-card" onClick={() => {
                    setSelectedProduct(p);
                    setActiveVariantIdx(0);
                    setQuantity(1);
                    setActiveSize(p.variants[0]?.size || 'M');
                  }}>
                    <div className="product-image-container">
                      <img src={p.images[0]?.url || '/images/product_placeholder.png'} alt={name} />
                      <button
                        className="fav-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(p.id);
                        }}
                      >
                        <svg
                          fill={favorites.includes(p.id) ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="product-info">
                      <h4>{name}</h4>
                      <span className="price">{formatPrice(price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="detail-backdrop active" onClick={() => setSelectedProduct(null)}>
          <section className="detail-container" onClick={(e) => e.stopPropagation()}>
            <button className="desktop-close-detail-btn" onClick={() => setSelectedProduct(null)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="detail-image-gallery">
              <img
                src={selectedProduct.images[activeVariantIdx]?.url || selectedProduct.images[0]?.url}
                alt="Product detail"
              />
            </div>
            <div className="detail-spec-sheet">
              <div>
                <h2>{locale === 'fr' ? selectedProduct.nameFr : selectedProduct.nameEn}</h2>
                <p className="detail-description">
                  {locale === 'fr' ? selectedProduct.descriptionFr : selectedProduct.descriptionEn}
                </p>
                <div className="options-selectors">
                  <div className="option-group">
                    <h5 className="option-title">Size</h5>
                    <div className="option-pills">
                      {Array.from(new Set(selectedProduct.variants.map((v) => v.size))).map((sz) => (
                        <button
                          key={sz}
                          className={`size-pill ${activeSize === sz ? 'active' : ''}`}
                          onClick={() => setActiveSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="option-group">
                    <h5 className="option-title">Color</h5>
                    <div className="option-pills">
                      {selectedProduct.variants.map((v, i) => (
                        <span
                          key={v.id}
                          className={`color-dot ${activeVariantIdx === i ? 'active' : ''}`}
                          style={{ backgroundColor: v.color }}
                          onClick={() => setActiveVariantIdx(i)}
                        ></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="detail-actions-footer">
                <button
                  className="btn-add-cart"
                  onClick={() => {
                    const selectedVariant = selectedProduct.variants[activeVariantIdx];
                    addToCart(
                      {
                        id: selectedProduct.id,
                        variantId: selectedVariant.id,
                        size: activeSize,
                        color: selectedVariant.color,
                        title: locale === 'fr' ? selectedProduct.nameFr : selectedProduct.nameEn,
                        price: selectedVariant.priceCents / 100,
                        image: selectedProduct.images[0]?.url
                      },
                      quantity
                    );
                    setSelectedProduct(null);
                    triggerToast(t('addToCart'));
                  }}
                >
                  {t('addToCart')}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <>
          <div className="cart-drawer-backdrop active" onClick={() => setCartOpen(false)}></div>
          <div className="cart-drawer active">
            <div className="cart-drawer-header">
              <h3>{t('cart')}</h3>
              <button className="close-btn" onClick={() => setCartOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.variantId} className="cart-item-row" style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid var(--accent-light)' }}>
                  <img src={item.image} alt={item.title} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0, fontWeight: 700 }}>{item.title}</h5>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Size: {item.size} / Color: {item.color}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontWeight: 800 }}>{formatPrice(item.price * item.quantity * 100)}</span>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-summary-row">
                <span>{t('total')}</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <button
                className="checkout-btn"
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
              >
                {t('checkout')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* CHECKOUT SCREEN */}
      {checkoutOpen && (
        <div className="checkout-screen-container" style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#f8fafc', zIndex: 1000, overflowY: 'auto' }}>
          <div className="checkout-wrapper">
            <span className="checkout-logo">DivinExpress</span>
            <button className="btn-back-boutique" onClick={() => setCheckoutOpen(false)}>
              Retour à la boutique
            </button>
            <div className="checkout-columns">
              <div className="checkout-left-col">
                <form onSubmit={handleCheckoutSubmit}>
                  {checkoutStep === 1 && (
                    <div className="checkout-card">
                      <h3>Adresse de livraison</h3>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Nom complet*</label>
                        <input type="text" value={shippingFullname} onChange={(e) => setShippingFullname(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Email*</label>
                        <input type="email" value={shippingEmail} onChange={(e) => setShippingEmail(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Adresse de livraison*</label>
                        <input type="text" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />
                      </div>
                      <button className="btn-checkout-submit" type="submit">
                        Continuer vers le paiement
                      </button>
                    </div>
                  )}

                  {checkoutStep === 2 && (
                    <div className="checkout-card">
                      <h3>Mode de paiement</h3>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <label>
                          <input type="radio" checked={paymentType === 'momo'} onChange={() => setPaymentType('momo')} /> Mobile Money
                        </label>
                        <label>
                          <input type="radio" checked={paymentType === 'card'} onChange={() => setPaymentType('card')} /> Carte Bancaire
                        </label>
                      </div>

                      {paymentType === 'momo' ? (
                        <div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            {['Orange', 'MTN', 'Wave'].map((op) => (
                              <button
                                type="button"
                                key={op}
                                onClick={() => setMomoOperator(op)}
                                className={`momo-op-card ${momoOperator === op ? 'active' : ''}`}
                                style={{
                                  padding: '10px 16px',
                                  border: '1.5px solid var(--accent-light)',
                                  borderRadius: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: momoOperator === op ? 'var(--accent-light)' : 'transparent'
                                }}
                              >
                                {op}
                              </button>
                            ))}
                          </div>
                          <div className="form-group">
                            <label>Numéro Mobile Money*</label>
                            <input type="tel" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} required />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className="form-group">
                            <label>Numéro de carte*</label>
                            <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Titulaire de la carte*</label>
                            <input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} required />
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label>Expiration MM/AA*</label>
                              <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label>CVV*</label>
                              <input type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} required />
                            </div>
                          </div>
                        </div>
                      )}
                      <button className="btn-checkout-submit" type="submit" style={{ marginTop: 24 }}>
                        Confirmer le paiement
                      </button>
                    </div>
                  )}

                  {checkoutStep === 3 && (
                    <div className="checkout-card checkout-success-card">
                      <h3>Commande validée avec succès !</h3>
                      <p>Numéro de commande : <strong>{orderNumber}</strong></p>
                      <button className="btn-checkout-submit" type="button" onClick={() => setCheckoutOpen(false)}>
                        Fermer
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Order summary column */}
              <div className="checkout-right-col">
                <div className="checkout-card summary-card">
                  <h3>Résumé du panier</h3>
                  <div className="checkout-cart-items">
                    {cart.map((item) => (
                      <div key={item.variantId} style={{ display: 'flex', justifyBetween: 'space-between', padding: '8px 0', borderBottom: '1.5px solid var(--accent-light)' }}>
                        <div>{item.title} ({item.size}) x {item.quantity}</div>
                        <div>{formatPrice(item.price * item.quantity * 100)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="promo-code-box" style={{ marginTop: 20 }}>
                    <input
                      type="text"
                      placeholder="Code promo"
                      value={promoCodeText}
                      onChange={(e) => setPromoCodeText(e.target.value)}
                    />
                    <button onClick={handleApplyPromo}>Appliquer</button>
                  </div>

                  <div className="summary-breakdown" style={{ marginTop: 16 }}>
                    <div className="breakdown-row">
                      <span>Sous-total</span>
                      <span>{formatPrice(subtotalCents)}</span>
                    </div>
                    {discountCents > 0 && (
                      <div className="breakdown-row" style={{ color: 'green' }}>
                        <span>Réduction</span>
                        <span>-{formatPrice(discountCents)}</span>
                      </div>
                    )}
                    <div className="breakdown-row">
                      <span>TVA</span>
                      <span>{formatPrice(taxCents)}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="breakdown-row total-row">
                      <span>Total</span>
                      <span>{formatPrice(totalCents)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING DRAWER */}
      {trackingOpen && (
        <>
          <div className="cart-drawer-backdrop active" onClick={() => setTrackingOpen(false)}></div>
          <div className="cart-drawer active">
            <div className="cart-drawer-header">
              <h3>Suivi de Colis</h3>
              <button className="close-btn" onClick={() => setTrackingOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="tracking-content" style={{ padding: 20 }}>
              <input
                type="text"
                placeholder="Ex: DV-09312"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: '1.5px solid var(--accent-light)', marginBottom: 12, outline: 'none' }}
              />
              <button
                className="checkout-btn"
                onClick={() => {
                  if (trackingInput) setTrackingResult(true);
                }}
              >
                Suivre
              </button>

              {trackingResult && (
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: 'green' }}>✓</div>
                    <div>
                      <h5 style={{ margin: 0 }}>Commande Confirmée</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Atelier DivinExpress - Abidjan</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: 'blue' }}>•</div>
                    <div>
                      <h5 style={{ margin: 0 }}>En cours de livraison</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pris en charge par notre service premium</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="toast-msg active">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
