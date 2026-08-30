import { setRequestLocale } from 'next-intl/server';
import { getCommerceDatabase } from '@/server/db/runtime';
import { readPublicStoreSettings } from '@/server/settings/store-settings';
import { ShippingReturnsContent } from './ShippingReturnsContent';

export default async function ShippingReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await readPublicStoreSettings(await getCommerceDatabase());
  return <ShippingReturnsContent locale={locale} thresholdMinor={settings.free_shipping_threshold_minor} returnPeriodDays={settings.return_period_days} />;
}
