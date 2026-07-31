'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Local accordion for the Home page. The shared `Accordion` primitive arrives
 * with the FAQ page (Tâche 24); this reads the same `faq` namespace.
 */
export function HomeFaq() {
  const t = useTranslations('home');
  const tFaq = useTranslations('faq');
  const items = tFaq.raw('items') as FaqItem[];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Container className="py-14 md:py-18">
      <Heading level={2} className="text-center">
        {t('faqTitle')}
      </Heading>
      <div className="mx-auto mt-8 max-w-[760px] md:mt-10">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="border-b border-mist-100 first:border-t first:border-mist-100">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-ink md:py-5 md:text-base"
                >
                  {item.question}
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 flex-shrink-0 text-mist-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </h3>
              {isOpen && (
                <p id={`faq-answer-${index}`} className="max-w-[60ch] pb-4 text-sm leading-relaxed text-mist-600 md:pb-5">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
