import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getFeaturedProducts, getNewArrivals } from '@/lib/catalog';
import { Hero } from '@/components/Hero/Hero';
import { TrustBar } from '@/components/TrustBar/TrustBar';
import { PromoBanner } from '@/components/PromoBanner/PromoBanner';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { ProductMarquee } from '@/components/ProductMarquee/ProductMarquee';
import { CategoryStrip } from '@/components/CategoryStrip/CategoryStrip';
import { TestimonialCarousel } from '@/components/TestimonialCarousel/TestimonialCarousel';
import { Faq } from '@/components/Faq/Faq';
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
      <ProductGrid title={t('bestSellersTitle')} products={featured} locale={locale} />
      <CategoryStrip locale={locale} />
      <ProductMarquee title={t('newArrivalsTitle')} products={newArrivals} locale={locale} />
      <TestimonialCarousel locale={locale} />
      <Faq />
    </>
  );

}

