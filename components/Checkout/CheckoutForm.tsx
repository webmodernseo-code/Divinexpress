'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart/CartContext';
import { resolveShippingZone } from '@/lib/shippingZone';
import { createOrder, validateDiscountCode } from '@/app/[locale]/checkout/actions';
import type { Locale } from '@/i18n';
import { formatPrice } from '@/lib/pricing';
import styles from './CheckoutForm.module.css';

type ShippingZone = { id: string; countries: string[]; costCents: number };

const COUNTRY_NAMES: Record<string, { fr: string; en: string }> = {
  FR: { fr: 'France', en: 'France' },
  GB: { fr: 'Royaume-Uni', en: 'United Kingdom' },
  BJ: { fr: 'Bénin', en: 'Benin' },
  BF: { fr: 'Burkina Faso', en: 'Burkina Faso' },
  CI: { fr: "Côte d'Ivoire", en: 'Ivory Coast' },
  GW: { fr: 'Guinée-Bissau', en: 'Guinea-Bissau' },
  ML: { fr: 'Mali', en: 'Mali' },
  NE: { fr: 'Niger', en: 'Niger' },
  SN: { fr: 'Sénégal', en: 'Senegal' },
  TG: { fr: 'Togo', en: 'Togo' }
};

export function CheckoutForm({ zones, locale }: { zones: ShippingZone[]; locale: Locale }) {
  const { cart, subtotalCents, clearCart } = useCart();
  const countryCodes = zones.flatMap((zone) => zone.countries);

  const [email, setEmail] = useState('');
  const [shippingAddr, setShippingAddr] = useState('');
  const [country, setCountry] = useState(countryCodes[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponPending, setCouponPending] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);

  const zoneIndex = resolveShippingZone(country, zones);
  const shippingCostCents = zoneIndex === -1 ? 0 : zones[zoneIndex].costCents;
  const discountCents = appliedDiscount?.discountCents ?? 0;
  const totalCents = subtotalCents - discountCents + shippingCostCents;

  if (cart.length === 0) {
    return (
      <main className={styles.container}>
        <p className={styles.emptyMessage}>
          {locale === 'fr' ? 'Votre panier est vide.' : 'Your cart is empty.'}
        </p>
        <Link href="/" className={styles.backLink}>
          {locale === 'fr' ? "Retour à la boutique" : 'Back to the shop'}
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createOrder({
      locale,
      email,
      shippingAddr,
      country,
      cart: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      discountCode: appliedDiscount?.code
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clearCart();
    window.location.href = result.checkoutUrl;
  }

  async function handleApplyCoupon() {
    setCouponPending(true);
    setCouponError(null);

    try {
      const result = await validateDiscountCode(couponInput, subtotalCents);

      if ('error' in result) {
        setCouponError(result.error);
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({ code: result.code, discountCents: result.discountCents });
      }
    } catch {
      setCouponError(locale === 'fr' ? 'Une erreur est survenue, réessayez.' : 'Something went wrong, try again.');
      setAppliedDiscount(null);
    } finally {
      setCouponPending(false);
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{locale === 'fr' ? 'Commander' : 'Checkout'}</h1>

      <div className={styles.layout}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.label}>
            {locale === 'fr' ? 'Email' : 'Email'}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </label>

          <label className={styles.label}>
            {locale === 'fr' ? 'Adresse de livraison complète' : 'Full shipping address'}
            <textarea
              value={shippingAddr}
              onChange={(e) => setShippingAddr(e.target.value)}
              required
              rows={4}
              className={styles.textarea}
            />
          </label>

          <label className={styles.label}>
            {locale === 'fr' ? 'Code promo' : 'Discount code'}
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className={styles.input}
            />
          </label>
          {couponError && <p className={styles.error}>{couponError}</p>}
          {appliedDiscount && (
            <p className={styles.error} style={{ color: '#0d6630', background: 'rgba(13, 102, 48, 0.08)' }}>
              {locale === 'fr' ? 'Code appliqué : ' : 'Code applied: '}
              {appliedDiscount.code}
            </p>
          )}
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={couponPending || !couponInput.trim()}
            className={styles.submitButton}
          >
            {locale === 'fr' ? 'Appliquer' : 'Apply'}
          </button>

          <label className={styles.label}>
            {locale === 'fr' ? 'Pays' : 'Country'}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={styles.input}>
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_NAMES[code]?.[locale] ?? code}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting || couponPending} className={styles.submitButton}>
            {submitting
              ? locale === 'fr'
                ? 'Traitement en cours…'
                : 'Processing…'
              : locale === 'fr'
                ? 'Payer'
                : 'Pay'}
          </button>
        </form>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>{locale === 'fr' ? 'Récapitulatif' : 'Summary'}</h2>
          {cart.map((item) => (
            <div key={`${item.variantId}-${item.size}-${item.color}`} className={styles.summaryLine}>
              <span>
                {item.name} ({item.size}, {item.color}) × {item.quantity}
              </span>
              <span>{formatPrice(item.priceCents * item.quantity, locale)}</span>
            </div>
          ))}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
            <span>{formatPrice(subtotalCents, locale)}</span>
          </div>
          {appliedDiscount && (
            <div className={styles.summaryLine}>
              <span>{locale === 'fr' ? 'Réduction' : 'Discount'}</span>
              <span>-{formatPrice(discountCents, locale)}</span>
            </div>
          )}
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
            <span>{formatPrice(shippingCostCents, locale)}</span>
          </div>
          <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
            <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
            <span>{formatPrice(totalCents, locale)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
