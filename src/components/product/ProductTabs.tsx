'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/products';
import { SizeGuideTable } from './SizeGuideTable';

type TabId = 'description' | 'details' | 'care' | 'sizeGuide';

const TAB_BUTTON_CLASS =
  'flex-shrink-0 whitespace-nowrap border-b-2 pb-3 text-[11px] font-bold uppercase tracking-[0.03em] transition-colors md:pb-3.5 md:text-[13px] md:tracking-[0.05em]';

export function ProductTabs({ description, category }: { description: string; category: Category }) {
  const t = useTranslations('product');
  const tSizeGuide = useTranslations('sizeGuide');
  const [activeTab, setActiveTab] = useState<TabId>('description');
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement | null>());

  const tabs: { id: TabId; label: string }[] = [
    { id: 'description', label: t('tabDescription') },
    { id: 'details', label: t('tabDetails') },
    { id: 'care', label: t('tabCare') },
    { id: 'sizeGuide', label: tSizeGuide('title') }
  ];

  /** Arrow/Home/End navigation, as expected from the ARIA tabs pattern. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex((tab) => tab.id === activeTab);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextId = tabs[next].id;
    setActiveTab(nextId);
    tabRefs.current.get(nextId)?.focus();
  }

  function panelProps(id: TabId) {
    return {
      id: `product-tab-panel-${id}`,
      role: 'tabpanel',
      'aria-labelledby': `product-tab-${id}`,
      hidden: activeTab !== id,
      className: 'pt-5 text-sm leading-relaxed text-mist-600'
    };
  }

  return (
    <div className="mt-10">
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className="flex gap-3.5 overflow-x-auto border-b border-mist-100 md:gap-6"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`product-tab-${tab.id}`}
              ref={(node) => {
                tabRefs.current.set(tab.id, node);
              }}
              aria-selected={isActive}
              aria-controls={`product-tab-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`${TAB_BUTTON_CLASS} ${
                isActive ? 'border-ink text-ink' : 'border-transparent text-mist-400 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div {...panelProps('description')}>
        <p>{description}</p>
      </div>

      <div {...panelProps('details')}>
        <p>{t('detailsBody')}</p>
      </div>

      <div {...panelProps('care')}>
        <p>{t('careBody')}</p>
      </div>

      <div {...panelProps('sizeGuide')}>
        <SizeGuideTable category={category} oneSizeLabel={t('oneSize')} />
      </div>
    </div>
  );
}
