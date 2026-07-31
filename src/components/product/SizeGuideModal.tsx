'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SizeGuideTable } from './SizeGuideTable';

/**
 * Reusable trigger + modal wrapping `SizeGuideTable` (Tâche 26). Used on the PDP next to the
 * size pills; `sizes` scopes the table to the current product (adults/kids/one-size), same as
 * the inline PDP tab in `ProductTabs.tsx`.
 */
export function SizeGuideModal({ sizes, oneSizeLabel }: { sizes: string[]; oneSizeLabel?: string }) {
  const t = useTranslations('sizeGuide');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-mist-600 underline underline-offset-2 hover:text-accent"
      >
        {t('modalTrigger')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{t('title')}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t('close')}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mt-6">
              <SizeGuideTable sizes={sizes} oneSizeLabel={oneSizeLabel} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
