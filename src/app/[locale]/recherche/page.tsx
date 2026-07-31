import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/products';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';

export default async function SearchPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const t = await getTranslations('search');
  const query = q?.trim() ?? '';
  const results = query ? searchProducts(query, locale as 'fr' | 'en') : [];

  return (
    <Container className="py-10 md:py-14">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{query ? t('resultsFor', { query }) : t('noQuery')}</p>

      {query && results.length === 0 && <p className="mt-12 text-center text-sm text-mist-500">{t('empty')}</p>}

      {results.length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-5 md:mt-10 md:grid-cols-4 md:gap-7">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
