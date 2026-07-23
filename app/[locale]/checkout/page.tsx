import { prisma } from '@/lib/prisma';
import { CheckoutForm } from '@/components/Checkout/CheckoutForm';
import type { Locale } from '@/i18n';

export default async function CheckoutPage({ params }: { params: { locale: Locale } }) {
  const zones = await prisma.shippingZone.findMany({ select: { id: true, countries: true, costCents: true } });
  return <CheckoutForm zones={zones} locale={params.locale} />;
}
