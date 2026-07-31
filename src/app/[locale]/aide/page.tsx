import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');
  const items = t.raw('items') as AccordionItem[];

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8">
        <Accordion items={items} />
      </div>
    </Container>
  );
}
