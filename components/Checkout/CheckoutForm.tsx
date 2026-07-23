'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart/CartContext';
import { resolveShippingZone } from '@/lib/shippingZone';
import { createOrder } from '@/app/[locale]/checkout/actions';
import type { Locale } from '@/i18n';
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

function formatEUR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function CheckoutForm({ zones, locale }: { zones: ShippingZone[]; locale: Locale }) {
  const { cart, subtotalCents, clearCart } = useCart();
  const countryCodes = zones.flatMap((zone) => zone.countries);

  const [email, setEmail] = useState('');
  const [shippingAddr, setShippingAddr] = useState('');
  const [country, setCountry] = useState(countryCodes[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zoneIndex = resolveShippingZone(country, zones);
  const shippingCostCents = zoneIndex === -1 ? 0 : zones[zoneIndex].costCents;
  const totalCents = subtotalCents + shippingCostCents;

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
      cart: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clearCart();
    window.location.href = result.checkoutUrl;
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
            {locale === 'fr' ? 'Pays' : 'Country'}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={styles.input}>
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_NAMES[code]?.[locale] ?? code}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting} className={styles.submitButton}>
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
              <span>{formatEUR(item.priceCents * item.quantity)}</span>
            </div>
          ))}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
            <span>{formatEUR(subtotalCents)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
            <span>{formatEUR(shippingCostCents)}</span>
          </div>
          <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
            <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
            <span>{formatEUR(totalCents)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
