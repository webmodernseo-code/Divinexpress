'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const STORAGE_KEY = 'divinexpress-cookie-consent';

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

  function reject() {
    window.localStorage.setItem(STORAGE_KEY, 'rejected');
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-mist-100 bg-paper p-6 text-ink shadow-2xl shadow-black/10 sm:right-6">
      <h2 className="font-serif text-xl font-semibold">{t('title')}</h2>
      <p className="mt-3 text-sm text-mist-600">
        {t('message')}{' '}
        <Link href="/confidentialite" className="underline underline-offset-2 hover:text-accent">
          {t('manage')}
        </Link>
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={accept}
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent"
        >
          {t('accept')}
        </button>
        <button
          type="button"
          onClick={reject}
          className="w-full rounded-full border border-mist-200 bg-mist-50 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
        >
          {t('reject')}
        </button>
      </div>
    </div>
  );
}
