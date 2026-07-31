import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { SizeGuideTable } from '@/components/product/SizeGuideTable';

export default async function SizeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('sizeGuide');

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8">
        <SizeGuideTable />
      </div>
    </Container>
  );
}
