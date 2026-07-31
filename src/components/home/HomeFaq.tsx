'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';

export function HomeFaq() {
  const t = useTranslations('home');
  const tFaq = useTranslations('faq');
  const items = tFaq.raw('items') as AccordionItem[];

  return (
    <Container className="py-14 md:py-18">
      <Heading level={2} className="text-center">
        {t('faqTitle')}
      </Heading>
      <div className="mx-auto mt-8 max-w-[760px] md:mt-10">
        <Accordion items={items} defaultOpenIndex={0} />
      </div>
    </Container>
  );
}
