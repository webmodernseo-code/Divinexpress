'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const locale = (useLocale() as 'fr' | 'en') ?? 'fr';
  const isEnglish = locale === 'en';

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">DivinExpress</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {isEnglish ? 'The dashboard is temporarily unavailable.' : 'Le tableau de bord est momentanément indisponible.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isEnglish ? 'Please try again, or return to your dashboard.' : 'Veuillez réessayer ou revenir à votre tableau de bord.'}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            {isEnglish ? 'Try again' : 'Réessayer'}
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
          >
            {isEnglish ? 'Return to dashboard' : 'Retour au tableau de bord'}
          </Link>
        </div>
      </section>
    </main>
  );
}
