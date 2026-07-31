import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export default async function ShippingReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('shippingReturns');

  const sections = [
    { title: t('shippingTitle'), body: t('shippingBody') },
    { title: t('returnsTitle'), body: t('returnsBody') },
    { title: t('exchangesTitle'), body: t('exchangesBody') }
  ];

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <Heading level={2} className="text-xl">
              {section.title}
            </Heading>
            <p className="mt-2 text-sm text-mist-700">{section.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
