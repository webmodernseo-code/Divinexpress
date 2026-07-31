'use client';

import { useId, useState } from 'react';

export interface AccordionItem {
  question: string;
  answer: string;
}

/**
 * Generic Q&A accordion. Only one item is open at a time. Not specific to
 * any page — the FAQ page (`/aide`) and the Home page's FAQ section both
 * consume this.
 *
 * Answer panels stay mounted in the DOM at all times and are toggled via the
 * `hidden` attribute rather than conditional rendering, so `aria-controls`
 * always resolves to a real element (open or closed).
 */
export function Accordion({
  items,
  defaultOpenIndex = null
}: {
  items: AccordionItem[];
  /** Index of the item open on first render. `null` (default) means all collapsed. */
  defaultOpenIndex?: number | null;
}) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.question} className="border-b border-mist-100 first:border-t">
            <h3>
              <button
                type="button"
                id={buttonId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-ink md:py-5 md:text-base"
              >
                <span>{item.question}</span>
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
            <p
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="max-w-[60ch] pb-4 text-sm leading-relaxed text-mist-600 md:pb-5"
            >
              {item.answer}
            </p>
          </div>
        );
      })}
    </div>
  );
}
