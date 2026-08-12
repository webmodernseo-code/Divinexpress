import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductGridState } from '@/components/product/ProductGridState';
import { getCommerceDatabase } from '@/server/db/runtime';
import { StorefrontCatalog } from '@/server/catalog/storefront';

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
  const results = await new StorefrontCatalog(await getCommerceDatabase()).search(
    query,
    locale as 'fr' | 'en',
  );

  return (
    <Container className="py-10 md:py-14">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{query ? t('resultsFor', { query }) : t('noQuery')}</p>

      {query && (
        <ProductGridState
          products={results}
          emptyTitle={t('empty')}
          emptyBody={t('emptyBody')}
        />
      )}
    </Container>
  );
}
