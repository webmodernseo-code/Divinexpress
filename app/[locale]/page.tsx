import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getFeaturedProducts, getNewArrivals } from '@/lib/catalog';
import { Hero } from '@/components/Hero/Hero';
import { TrustBar } from '@/components/TrustBar/TrustBar';
import { PromoBanner } from '@/components/PromoBanner/PromoBanner';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { CategoryStrip } from '@/components/CategoryStrip/CategoryStrip';
import { Testimonials } from '@/components/Testimonials/Testimonials';
import { BlogPreview } from '@/components/BlogPreview/BlogPreview';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');

  const [featured, newArrivals] = await Promise.all([getFeaturedProducts(), getNewArrivals()]);

  return (
    <>
      <Hero locale={locale} />
      <TrustBar />
      <div className={styles.promoPair}>
        <PromoBanner
          title={t('promoHommeTitle')}
          ctaLabel={t('promoHommeCta')}
          href="/homme"
          locale={locale}
          imageSeed="divinexpress-promo-homme"
        />
        <PromoBanner
          title={t('promoSaleTitle')}
          ctaLabel={t('promoSaleCta')}
          href="/sale"
          locale={locale}
          imageSeed="divinexpress-promo-sale"
          badge={t('promoSaleBadge')}
        />
      </div>
      <ProductGrid title={t('bestSellersTitle')} products={featured} locale={locale} />
      <CategoryStrip locale={locale} />
      <PromoBanner
        title={t('discountTitle')}
        ctaLabel={t('discountCta')}
        href="/sale"
        locale={locale}
        imageSeed="divinexpress-discount"
        size="full"
      />
      <ProductGrid title={t('newArrivalsTitle')} products={newArrivals} locale={locale} />
      <Testimonials />
      <BlogPreview locale={locale} />
    </>
  );
}
