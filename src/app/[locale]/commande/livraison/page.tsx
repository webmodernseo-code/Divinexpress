'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getProductById } from '@/lib/products';
import {
  FiExternalLink,
  FiLock,
  FiPackage,
  FiArrowLeft
} from 'react-icons/fi';

type PaymentProvider = 'stripe' | 'paypal' | 'geniuspay';

type PaymentMark = {
  name: string;
  src: string;
  width: number;
  height: number;
};

type ProviderConfig = {
  id: PaymentProvider;
  name: string;
  description: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  badge?: string;
  marks: PaymentMark[];
};

const CATEGORY_IMAGES: Record<string, string> = {
  homme: '/image/category_homme.png',
  femme: '/image/category_femme.png',
  enfant: '/image/category_enfant.png',
  accessoires: '/image/category_accessoires.png'
};

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'stripe' as const,
    name: 'Stripe',
    description: 'Cards and digital wallets',
    logo: '/payment/visa-mastercard.png',
    logoWidth: 60,
    logoHeight: 24,
    marks: [
      { name: 'Visa & Mastercard', src: '/payment/visa-mastercard.png', width: 42, height: 22 }
    ]
  },
  {
    id: 'paypal' as const,
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    logo: '/payment/paypal.png',
    logoWidth: 60,
    logoHeight: 24,
    marks: []
  },
  {
    id: 'geniuspay' as const,
    name: 'GeniusPay',
    description: 'Mobile Money and cards across Africa',
    logo: '/payment/orange-money.png',
    logoWidth: 65,
    logoHeight: 24,
    badge: '24 countries',
    marks: [
      { name: 'Wave', src: '/payment/wave.png', width: 40, height: 22 },
      { name: 'Orange Money', src: '/payment/orange-money.png', width: 45, height: 22 }
    ]
  }
];

const FREE_SHIPPING_THRESHOLD = 150;

const INPUT_CLASS =
  'h-14 w-full rounded-lg border border-neutral-300 bg-transparent px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black';

export default function CheckoutPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const tCart = useTranslations('cart');
  const router = useRouter();
  const { items, subtotalEur, clearCart } = useCart();
  const { shipping, setShipping } = useCheckout();
  const { currency } = useCurrency();

  const amountRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotalEur, 0);
  const shippingProgress = Math.min((subtotalEur / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const [provider, setProvider] = useState<PaymentProvider>('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local state for form values to populate from session storage if available
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');
  const [phone, setPhone] = useState('');

  // Load from context when resolved
  useEffect(() => {
    if (shipping) {
      setEmail(shipping.email || '');
      setAddress(shipping.address || '');
      setCity(shipping.city || '');
      setPostalCode(shipping.postalCode || '');
      setCountry(shipping.country || 'France');
      
      if (shipping.fullName) {
        const parts = shipping.fullName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
    }
  }, [shipping]);

  const activeLocale = systemLocale === 'fr' ? 'fr-FR' : 'en-GB';

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(activeLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }),
    [activeLocale, currency]
  );

  const activeProvider = PROVIDERS.find((item) => item.id === provider)!;

  const redirectToProvider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      // Save shipping details to checkout context
      setShipping({
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        address: address + (addressComplement ? ` - ${addressComplement}` : ''),
        city,
        postalCode,
        country
      });

      // Simulate secure session redirection
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Successfully processed, clear cart and redirect to confirmation
      clearCart();
      router.push('/commande/confirmation');
    } catch {
      setError(
        systemLocale === 'fr'
          ? 'Le service de paiement est temporairement indisponible.'
          : 'The payment service is temporarily unavailable.'
      );
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white px-5 py-20 text-center text-black">
        <div className="max-w-md mx-auto py-12 px-6 bg-neutral-50 border border-neutral-200 rounded-2xl">
          <h1 className="font-serif text-2xl font-bold mb-4">
            {systemLocale === 'fr' ? 'Votre panier est vide' : 'Your basket is empty'}
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            {systemLocale === 'fr'
              ? 'Ajoutez des articles à votre panier pour passer commande.'
              : 'Add some items to your basket to proceed to checkout.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-bold text-accent underline hover:text-black transition-colors"
          >
            <FiArrowLeft className="size-4" aria-hidden="true" />
            {systemLocale === 'fr' ? 'Retour aux achats' : 'Continue shopping'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-black sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1220px]">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Checkout progress" className="mb-10">
          <ol className="flex flex-wrap items-center justify-center gap-3 text-xs sm:gap-5 sm:text-sm">
            <li>
              <Link href="/panier" className="text-neutral-500 hover:text-black">
                {systemLocale === 'fr' ? 'Panier' : 'Basket'}
              </Link>
            </li>
            <li className="h-px w-8 bg-neutral-200" aria-hidden="true" />
            <li className="text-neutral-500 font-semibold">
              {systemLocale === 'fr' ? 'Informations et Livraison' : 'Information & Delivery'}
            </li>
            <li className="h-px w-8 bg-neutral-200" aria-hidden="true" />
            <li className="text-neutral-500">
              {systemLocale === 'fr' ? 'Confirmation' : 'Confirmation'}
            </li>
          </ol>
        </nav>

        <div>
          <h1 className="font-serif text-[44px] leading-none tracking-[-0.04em] sm:text-6xl">
            {systemLocale === 'fr' ? 'Finaliser la commande' : 'Checkout'}
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            {systemLocale === 'fr' ? 'Complétez votre commande en toute sécurité.' : 'Complete your order securely.'}
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)] lg:items-start lg:gap-14">
          {/* Checkout Form */}
          <form onSubmit={redirectToProvider} className="order-2 lg:order-1">
            {/* Contact Section */}
            <section>
              <h2 className="font-serif text-2xl">{systemLocale === 'fr' ? 'Contact' : 'Contact'}</h2>
              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-medium">{systemLocale === 'fr' ? 'Adresse e-mail' : 'Email address'}</span>
                <input
                  className={INPUT_CLASS}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="mt-4 flex items-center gap-3 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="marketing"
                  className="size-4 rounded border-neutral-300 accent-black"
                />
                {systemLocale === 'fr' ? 'M\'envoyer des offres et des nouveautés par e-mail' : 'Email me with news and offers'}
              </label>
            </section>

            {/* Delivery Section */}
            <section className="mt-9">
              <h2 className="font-serif text-2xl">{systemLocale === 'fr' ? 'Adresse de livraison' : 'Delivery address'}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  className={INPUT_CLASS}
                  name="firstName"
                  autoComplete="given-name"
                  placeholder={systemLocale === 'fr' ? 'Prénom' : 'First name'}
                  aria-label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  name="lastName"
                  autoComplete="family-name"
                  placeholder={systemLocale === 'fr' ? 'Nom' : 'Last name'}
                  aria-label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4 space-y-4">
                <input
                  className={INPUT_CLASS}
                  name="address"
                  autoComplete="street-address"
                  placeholder={systemLocale === 'fr' ? 'Adresse' : 'Address'}
                  aria-label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  name="addressComplement"
                  placeholder={systemLocale === 'fr' ? 'Appartement, bureau, etc. (optionnel)' : 'Apartment, suite, etc. (optional)'}
                  aria-label="Address complement"
                  value={addressComplement}
                  onChange={(e) => setAddressComplement(e.target.value)}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <input
                  className={INPUT_CLASS}
                  name="city"
                  autoComplete="address-level2"
                  placeholder={systemLocale === 'fr' ? 'Ville' : 'City'}
                  aria-label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  name="postalCode"
                  autoComplete="postal-code"
                  placeholder={systemLocale === 'fr' ? 'Code postal' : 'Postal code'}
                  aria-label="Postal code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
                <select
                  className={INPUT_CLASS}
                  name="country"
                  autoComplete="country-name"
                  aria-label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="France">France</option>
                  <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Switzerland">Switzerland</option>
                </select>
              </div>
              <input
                className={`${INPUT_CLASS} mt-4`}
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={systemLocale === 'fr' ? 'Téléphone (optionnel)' : 'Phone (optional)'}
                aria-label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </section>

            {/* Payment Providers Section */}
            <section className="mt-10">
              <h2 className="font-serif text-2xl">{systemLocale === 'fr' ? 'Paiement' : 'Payment'}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {systemLocale === 'fr'
                  ? 'Sélectionnez un moyen de paiement. Vous serez redirigé vers sa page sécurisée.'
                  : 'Select a provider. You will complete payment on its secure page.'}
              </p>

              <fieldset className="mt-5 space-y-3">
                <legend className="sr-only">Select a payment provider</legend>

                {PROVIDERS.map((paymentProvider) => {
                  const selected = provider === paymentProvider.id;

                  return (
                    <label
                      key={paymentProvider.id}
                      className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition sm:p-5 ${
                        selected
                          ? 'border-black bg-neutral-50 ring-1 ring-black/20'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentProvider"
                        value={paymentProvider.id}
                        checked={selected}
                        onChange={() => setProvider(paymentProvider.id)}
                        className="mt-1 size-4 shrink-0 accent-black cursor-pointer"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{paymentProvider.name}</p>
                            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                              {paymentProvider.description}
                            </p>
                          </div>
                          <div className="relative h-8 w-16 flex-shrink-0">
                            <Image
                              src={paymentProvider.logo}
                              alt={paymentProvider.name}
                              fill
                              className="object-contain object-right"
                            />
                          </div>
                        </div>

                        {paymentProvider.marks.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {paymentProvider.marks.map((mark) => (
                              <span
                                key={mark.name}
                                className="grid h-8 min-w-11 place-items-center rounded border border-neutral-200 bg-white px-2"
                              >
                                <Image
                                  src={mark.src}
                                  alt={mark.name}
                                  width={mark.width}
                                  height={mark.height}
                                  className="max-h-5 w-auto object-contain"
                                />
                              </span>
                            ))}
                            {paymentProvider.badge && (
                              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] text-neutral-500 font-medium">
                                {paymentProvider.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <FiExternalLink
                        className="mt-1 size-4 shrink-0 text-neutral-500"
                        aria-hidden="true"
                      />
                    </label>
                  );
                })}
              </fieldset>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-neutral-500">
                <FiExternalLink className="size-4 shrink-0" aria-hidden="true" />
                {systemLocale === 'fr'
                  ? 'Vous allez être redirigé vers l\'interface de paiement sécurisée.'
                  : 'You will be redirected to the selected provider\'s secure payment page.'}
              </p>

              <label className="mt-6 flex items-center gap-3 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="sameBillingAddress"
                  defaultChecked
                  className="size-4 rounded border-neutral-300 accent-black"
                />
                {systemLocale === 'fr' ? 'L\'adresse de facturation est identique à celle de livraison' : 'Billing address is the same as delivery address'}
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-black px-5 text-sm font-semibold tracking-[0.1em] text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-70"
              >
                {loading
                  ? (systemLocale === 'fr' ? 'CRÉATION DE LA SESSION SÉCURISÉE...' : 'CREATING SECURE SESSION...')
                  : `${systemLocale === 'fr' ? 'PAYER AVEC' : 'CONTINUE TO'} ${activeProvider.name.toUpperCase()}`}
                {!loading && <FiExternalLink className="size-4" aria-hidden="true" />}
              </button>

              <p className="mt-3 text-center text-xs text-neutral-500">
                {systemLocale === 'fr' ? (
                  <>Vous allez régler {formatter.format(subtotalEur)} de manière entièrement sécurisée sur {activeProvider.name}.</>
                ) : (
                  <>You&apos;ll complete your {formatter.format(subtotalEur)} payment securely on {activeProvider.name}.</>
                )}
              </p>

              {error && (
                <p role="alert" className="mt-4 text-center text-sm text-red-700">
                  {error}
                </p>
              )}

              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <FiLock className="size-4" aria-hidden="true" />
                {systemLocale === 'fr'
                  ? 'Vos données bancaires sont cryptées et traitées uniquement par nos partenaires sécurisés.'
                  : 'Your payment information is handled securely by the selected provider.'}
              </p>

              <div className="mt-5 flex items-center justify-center gap-5 text-xs text-neutral-500">
                <Link href="/confidentialite" className="underline underline-offset-4">
                  {systemLocale === 'fr' ? 'Confidentialité' : 'Privacy'}
                </Link>
                <Link href="/cgv" className="underline underline-offset-4">
                  {systemLocale === 'fr' ? 'CGV' : 'Terms'}
                </Link>
                <Link href="/livraison-retours" className="underline underline-offset-4">
                  {systemLocale === 'fr' ? 'Retours & Remboursements' : 'Refund policy'}
                </Link>
              </div>
            </section>
          </form>

          {/* Sidebar Order Summary */}
          <aside className="order-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-7 lg:order-2 lg:sticky lg:top-8 shadow-xs">
            <h2 className="font-serif text-3xl tracking-[-0.025em]">{systemLocale === 'fr' ? 'Résumé de la commande' : 'Order summary'}</h2>

            <div className="mt-6 border-b border-neutral-200 pb-6 divide-y divide-neutral-200/50">
              {items.map((line) => {
                const product = getProductById(line.productId);
                if (!product) return null;
                const lineKey = `${line.productId}-${line.size}-${line.color}`;
                const productImage = CATEGORY_IMAGES[product.category] || '/image/category_homme.png';
                const itemPrice = product.priceEur * line.quantity;

                return (
                  <article key={lineKey} className="grid grid-cols-[92px_minmax(0,1fr)_auto] gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100 flex-shrink-0">
                      <Image
                        src={productImage}
                        alt={product.name[systemLocale]}
                        fill
                        sizes="92px"
                        className="object-cover"
                      />
                      <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black text-[10px] text-white font-semibold">
                        {line.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 self-center">
                      <h3 className="font-medium text-ink text-sm sm:text-base leading-tight">{product.name[systemLocale]}</h3>
                      <p className="mt-1 text-xs sm:text-sm text-neutral-500">{line.size} · {line.color}</p>
                    </div>
                    <p className="self-center text-sm font-medium text-ink">{formatter.format(itemPrice)}</p>
                  </article>
                );
              })}
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt>{tCart('subtotal')}</dt>
                <dd>{formatter.format(subtotalEur)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{systemLocale === 'fr' ? 'Livraison' : 'Delivery'}</dt>
                <dd className="text-right text-neutral-500">{systemLocale === 'fr' ? 'Calculée après adresse' : 'Calculated after address'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-neutral-200 pt-5 text-lg font-medium">
                <dt>Total</dt>
                <dd>
                  <span className="mr-2 text-xs font-normal text-neutral-500">EUR</span>
                  {formatter.format(subtotalEur)}
                </dd>
              </div>
            </dl>

            {/* Free Shipping Progress bar */}
            <div className={`mt-7 border-t border-neutral-200 pt-6 px-4 py-5 rounded-2xl transition-colors duration-500 ${amountRemaining <= 0 ? 'bg-amber-50/25' : 'bg-transparent'}`}>
              <p className={`flex items-center gap-3 text-sm font-semibold transition-colors ${amountRemaining <= 0 ? 'text-amber-800' : 'text-ink'}`}>
                <FiPackage className={`size-5 shrink-0 transition-all ${amountRemaining <= 0 ? 'text-amber-500 animate-bounce' : 'text-neutral-500'}`} aria-hidden="true" />
                {amountRemaining > 0 ? (
                  systemLocale === 'fr' ? (
                    <>Plus que <span className="font-bold text-black">{formatter.format(amountRemaining)}</span> pour la livraison offerte</>
                  ) : (
                    <>You&apos;re <span className="font-bold text-black">{formatter.format(amountRemaining)}</span> away from free delivery</>
                  )
                ) : (
                  systemLocale === 'fr' ? 'Félicitations ! Livraison offerte débloquée ! 🎉' : 'Congratulations! You unlocked free delivery! 🎉'
                )}
              </p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-neutral-200 shadow-inner">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${amountRemaining <= 0 ? 'shimmer-progress-unlocked' : 'shimmer-progress'}`}
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>

            <p className="mt-7 flex items-center justify-center gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
              <FiLock className="size-4" aria-hidden="true" />
              {systemLocale === 'fr' ? 'Paiements sécurisés' : 'Secure payments'}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
