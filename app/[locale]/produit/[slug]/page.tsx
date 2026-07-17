import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProductBySlug } from '@/lib/catalog';
import { cheapestVariant, formatPrice } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n';

export default async function ProductPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('pdp');
  const tHeader = await getTranslations('header');

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const name = getLocalizedField(product, 'name', locale);
  const description = getLocalizedField(product, 'description', locale);
  const cheapest = cheapestVariant(product.variants);
  const sizes = [...new Set(product.variants.map((variant) => variant.size))];
  const colors = [...new Set(product.variants.map((variant) => variant.color))];

  return (
    <div>
      <p>{tHeader(product.category.slug as any)}</p>
      <h1>{name}</h1>
      <p>{description}</p>
      {cheapest && <p>{formatPrice(cheapest.priceCents, locale)}</p>}
      <p>
        {t('size')}: {sizes.join(', ')}
      </p>
      <p>
        {t('color')}: {colors.join(', ')}
      </p>
      <button type="button">{t('addToBag')}</button>
    </div>
  );
}
