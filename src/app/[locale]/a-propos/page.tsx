import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8 grid gap-12 md:grid-cols-[minmax(0,300px)_1fr] md:items-center">
        <PlaceholderBlock aspect="portrait" />
        <div className="space-y-4 text-sm text-mist-700">
          <p>{t('paragraph1')}</p>
          <p>{t('paragraph2')}</p>
          <p>{t('paragraph3')}</p>
        </div>
      </div>
    </Container>
  );
}
