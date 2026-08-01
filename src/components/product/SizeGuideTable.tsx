'use client';

import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/products';

/**
 * Shared measurement data (Tâche 26) — the single source of truth consumed by both the
 * inline PDP tab (`ProductTabs.tsx`) and the reusable table/modal on `/guide-tailles`.
 *
 * Homme/Femme/Enfant all use the same letter-size pills (see `products.ts`), so the two
 * tables below share the same `size` labels — only the measurements differ. `getSizeGuideVariant`
 * therefore can't tell adults and kids apart from the size labels anymore; it switches on the
 * product's category instead.
 */
export const ADULT_ROWS = [
  { size: 'XS', chest: '86-90', waist: '68-72' },
  { size: 'S', chest: '91-95', waist: '73-77' },
  { size: 'M', chest: '96-100', waist: '78-82' },
  { size: 'L', chest: '101-106', waist: '83-88' },
  { size: 'XL', chest: '107-112', waist: '89-94' },
  { size: 'XXL', chest: '113-118', waist: '95-100' }
];

export const KIDS_ROWS = [
  { size: 'XS', age: '2-3', height: '92-98' },
  { size: 'S', age: '4-5', height: '104-110' },
  { size: 'M', age: '6-7', height: '116-122' },
  { size: 'L', age: '8-9', height: '128-134' },
  { size: 'XL', age: '10-11', height: '140-146' },
  { size: 'XXL', age: '12-13', height: '152-158' }
];

/** Accessories (`UNIQUE`, `S/M`, `L/XL`) have no measurement table — just a one-size note. */
export function getSizeGuideVariant(category: Category): 'adults' | 'kids' | 'oneSize' {
  if (category === 'enfant') return 'kids';
  if (category === 'accessoires') return 'oneSize';
  return 'adults';
}

const CELL_CLASS = 'border-b border-mist-100 px-3 py-2.5 text-left tabular-nums';
const HEAD_CELL_CLASS = `${CELL_CLASS} text-[11px] font-bold uppercase tracking-[0.05em] text-mist-500`;

function SizeTable({ variant }: { variant: 'adults' | 'kids' }) {
  const t = useTranslations('sizeGuide');

  return (
    <table className="w-full min-w-[340px] border-collapse text-[13px]">
      <caption className="sr-only">{variant === 'adults' ? t('adultsTitle') : t('kidsTitle')}</caption>
      <thead>
        <tr>
          <th scope="col" className={HEAD_CELL_CLASS}>
            {t('size')}
          </th>
          {variant === 'adults' ? (
            <>
              <th scope="col" className={HEAD_CELL_CLASS}>
                {t('chest')}
              </th>
              <th scope="col" className={HEAD_CELL_CLASS}>
                {t('waist')}
              </th>
            </>
          ) : (
            <>
              <th scope="col" className={HEAD_CELL_CLASS}>
                {t('age')}
              </th>
              <th scope="col" className={HEAD_CELL_CLASS}>
                {t('height')}
              </th>
            </>
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
                <td className={CELL_CLASS}>{row.age}</td>
                <td className={CELL_CLASS}>{row.height}</td>
              </tr>
            ))}
      </tbody>
    </table>
  );
}

/**
 * Dual-mode measurements table (Tâche 26):
 * - `category` provided (PDP usage, via `ProductTabs`/`SizeGuideModal`) → shows only the ONE
 *   table relevant to the current product (adults, kids, or a one-size note via `oneSizeLabel`).
 * - `category` omitted ("show all" mode, dedicated `/guide-tailles` page) → shows BOTH tables,
 *   since that page isn't scoped to a single product.
 */
export function SizeGuideTable({ category, oneSizeLabel }: { category?: Category; oneSizeLabel?: string }) {
  const t = useTranslations('sizeGuide');

  if (category) {
    const variant = getSizeGuideVariant(category);

    if (variant === 'oneSize') {
      return oneSizeLabel ? <p>{oneSizeLabel}</p> : null;
    }

    return (
      <>
        <p className="text-xs text-mist-500">{t('unitsNote')}</p>
        <div className="mt-3 overflow-x-auto">
          <SizeTable variant={variant} />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-10">
      <p className="text-xs text-mist-500">{t('unitsNote')}</p>

      <div>
        <h3 className="font-serif text-lg">{t('adultsTitle')}</h3>
        <div className="mt-3 overflow-x-auto">
          <SizeTable variant="adults" />
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg">{t('kidsTitle')}</h3>
        <div className="mt-3 overflow-x-auto">
          <SizeTable variant="kids" />
        </div>
      </div>
    </div>
  );
}
