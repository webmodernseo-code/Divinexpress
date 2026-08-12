import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCommerceDatabase } from '@/server/db/runtime';
import { findOrderConfirmation } from '@/server/orders/confirmation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ locale }, { order: orderNumber }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  if (!orderNumber) notFound();

  const order = await findOrderConfirmation(await getCommerceDatabase(), orderNumber);
  if (!order) notFound();
  const t = await getTranslations('checkout');
  const formattedTotal = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency', currency: order.currency,
  }).format(order.totalMinor / 100);

  return (
    <Container className="max-w-xl py-12 text-center">
      <CheckoutSteps current={3} />
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" className="h-8 w-8 text-paper">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <Heading level={1} className="mt-6">{t('confirmationTitle')}</Heading>
      <p className="mt-4 text-sm text-mist-600">{t('thankYou', { orderNumber: order.number })}</p>
      <dl className="mt-8 rounded-2xl border border-mist-200 p-6 text-left text-sm">
        <div className="flex justify-between gap-4"><dt>{locale === 'fr' ? 'Statut' : 'Status'}</dt><dd>{order.status}</dd></div>
        <div className="mt-3 flex justify-between gap-4 font-medium"><dt>Total</dt><dd>{formattedTotal}</dd></div>
      </dl>
      <Link href="/" className="mt-8 inline-block"><Button className="rounded-2xl">{t('backHome')}</Button></Link>
    </Container>
  );
}
