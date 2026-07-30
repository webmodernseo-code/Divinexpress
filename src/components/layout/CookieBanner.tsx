'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'reign-cookie-consent';

export function CookieBanner() {
  const t = useTranslations('cookies');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(STORAGE_KEY);
    if (!consent) setIsVisible(true);
  }, []);

  function accept() {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-between gap-4 bg-ink px-4 py-4 text-sm text-paper sm:flex-row sm:px-8">
      <p className="max-w-2xl">{t('message')}</p>
      <Button
        variant="secondary"
        onClick={accept}
        className="border-paper text-paper hover:border-accent hover:text-accent"
      >
        {t('accept')}
      </Button>
    </div>
  );
}
