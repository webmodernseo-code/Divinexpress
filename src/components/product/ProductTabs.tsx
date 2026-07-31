'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type TabId = 'description' | 'details' | 'care' | 'sizeGuide';

/**
 * Measurements are static and shared with the dedicated size guide (Tâche 26),
 * which owns the reusable table/modal. Only the inline PDP tab lives here.
 */
const ADULT_ROWS = [
  { size: 'XS', chest: '86-90', waist: '68-72' },
  { size: 'S', chest: '91-95', waist: '73-77' },
  { size: 'M', chest: '96-100', waist: '78-82' },
  { size: 'L', chest: '101-106', waist: '83-88' },
  { size: 'XL', chest: '107-112', waist: '89-94' }
];

const KIDS_ROWS = [
  { size: '4A', height: '98-104' },
  { size: '6A', height: '110-116' },
  { size: '8A', height: '122-128' },
  { size: '10A', height: '134-140' },
  { size: '12A', height: '146-152' }
];

/** Accessories (`UNIQUE`, `S/M`, `L/XL`) match neither table and get a one-size note. */
function getSizeGuideVariant(sizes: string[]): 'adults' | 'kids' | 'oneSize' {
  if (sizes.some((size) => ADULT_ROWS.some((row) => row.size === size))) return 'adults';
  if (sizes.some((size) => KIDS_ROWS.some((row) => row.size === size))) return 'kids';
  return 'oneSize';
}

const TAB_BUTTON_CLASS =
  'flex-shrink-0 whitespace-nowrap border-b-2 pb-3 text-[11px] font-bold uppercase tracking-[0.03em] transition-colors md:pb-3.5 md:text-[13px] md:tracking-[0.05em]';

const CELL_CLASS = 'border-b border-mist-100 px-3 py-2.5 text-left tabular-nums';
const HEAD_CELL_CLASS = `${CELL_CLASS} text-[11px] font-bold uppercase tracking-[0.05em] text-mist-500`;

export function ProductTabs({ description, sizes }: { description: string; sizes: string[] }) {
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

  const variant = getSizeGuideVariant(sizes);

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
        {variant === 'oneSize' ? (
          <p>{t('oneSize')}</p>
        ) : (
          <>
            <p className="text-xs text-mist-500">{tSizeGuide('unitsNote')}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[340px] border-collapse text-[13px]">
                <caption className="sr-only">
                  {variant === 'adults' ? tSizeGuide('adultsTitle') : tSizeGuide('kidsTitle')}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className={HEAD_CELL_CLASS}>
                      {tSizeGuide('size')}
                    </th>
                    {variant === 'adults' ? (
                      <>
                        <th scope="col" className={HEAD_CELL_CLASS}>
                          {tSizeGuide('chest')}
                        </th>
                        <th scope="col" className={HEAD_CELL_CLASS}>
                          {tSizeGuide('waist')}
                        </th>
                      </>
                    ) : (
                      <th scope="col" className={HEAD_CELL_CLASS}>
                        {tSizeGuide('height')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {variant === 'adults'
                    ? ADULT_ROWS.map((row) => (
                        <tr key={row.size}>
                          <th scope="row" className={`${CELL_CLASS} font-bold text-ink`}>
                            {row.size}
                          </th>
                          <td className={CELL_CLASS}>{row.chest}</td>
                          <td className={CELL_CLASS}>{row.waist}</td>
                        </tr>
                      ))
                    : KIDS_ROWS.map((row) => (
                        <tr key={row.size}>
                          <th scope="row" className={`${CELL_CLASS} font-bold text-ink`}>
                            {row.size}
                          </th>
                          <td className={CELL_CLASS}>{row.height}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
