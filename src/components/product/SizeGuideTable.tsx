'use client';

import { useTranslations } from 'next-intl';

/**
 * Shared measurement data (Tâche 26) — the single source of truth consumed by both the
 * inline PDP tab (`ProductTabs.tsx`) and the reusable table/modal on `/guide-tailles`.
 */
export const ADULT_ROWS = [
  { size: 'XS', chest: '86-90', waist: '68-72' },
  { size: 'S', chest: '91-95', waist: '73-77' },
  { size: 'M', chest: '96-100', waist: '78-82' },
  { size: 'L', chest: '101-106', waist: '83-88' },
  { size: 'XL', chest: '107-112', waist: '89-94' }
];

export const KIDS_ROWS = [
  { size: '4A', height: '98-104' },
  { size: '6A', height: '110-116' },
  { size: '8A', height: '122-128' },
  { size: '10A', height: '134-140' },
  { size: '12A', height: '146-152' }
];

/** Accessories (`UNIQUE`, `S/M`, `L/XL`) match neither table and get a one-size note. */
export function getSizeGuideVariant(sizes: string[]): 'adults' | 'kids' | 'oneSize' {
  if (sizes.some((size) => ADULT_ROWS.some((row) => row.size === size))) return 'adults';
  if (sizes.some((size) => KIDS_ROWS.some((row) => row.size === size))) return 'kids';
  return 'oneSize';
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
            <th scope="col" className={HEAD_CELL_CLASS}>
              {t('height')}
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
  );
}

/**
 * Dual-mode measurements table (Tâche 26):
 * - `sizes` provided (PDP usage, via `ProductTabs`/`SizeGuideModal`) → shows only the ONE
 *   table relevant to the current product (adults, kids, or a one-size note via `oneSizeLabel`).
 * - `sizes` omitted ("show all" mode, dedicated `/guide-tailles` page) → shows BOTH tables,
 *   since that page isn't scoped to a single product.
 */
export function SizeGuideTable({ sizes, oneSizeLabel }: { sizes?: string[]; oneSizeLabel?: string }) {
  const t = useTranslations('sizeGuide');

  if (sizes) {
    const variant = getSizeGuideVariant(sizes);

    if (variant === 'oneSize') {
      return oneSizeLabel ? <p className="text-sm text-mist-600">{oneSizeLabel}</p> : null;
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
