'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';

const COPIED_FEEDBACK_MS = 1500;

/** Illustrative deadline: 23:59:59 on the last day of the current month. */
function endOfCurrentMonth(from: Date): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
}

function splitRemaining(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function PromoBanner() {
  const t = useTranslations('home');
  const code = t('promoCode');

  // Null until the first client tick, so the server-rendered markup and the
  // first client render match (same hydration-safe shape as CookieBanner).
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const target = endOfCurrentMonth(new Date()).getTime();
    const tick = () => setRemainingMs(Math.max(0, target - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    };
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setIsCopied(true);
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    copiedTimeout.current = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
  }

  const remaining = splitRemaining(remainingMs ?? 0);
  const units = [
    { key: 'days', value: remaining.days, label: t('promoDays') },
    { key: 'hours', value: remaining.hours, label: t('promoHours') },
    { key: 'minutes', value: remaining.minutes, label: t('promoMinutes') },
    { key: 'seconds', value: remaining.seconds, label: t('promoSeconds') }
  ];

  return (
    <Container className="py-14 md:py-18">
      <div className="mx-auto max-w-[760px] rounded-3xl bg-accent px-6 py-9 text-center text-paper md:px-12 md:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-paper/75">{t('promoKicker')}</p>
        <h2 className="mt-3.5 font-serif text-2xl md:text-3xl">{t('promoTitle')}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-paper/85">{t('promoBody')}</p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border-2 border-dashed border-paper/45 py-2.5 pl-5 pr-2.5">
          <span className="text-lg font-bold tracking-[0.08em]">{code}</span>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-full bg-paper px-4 py-2 text-xs font-bold tracking-wide text-ink transition-opacity hover:opacity-85"
          >
            {isCopied ? t('promoCopiedConfirmation') : t('promoCopyButton')}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 md:gap-5">
          {units.map((unit) => (
            <div key={unit.key} className="flex min-w-11 flex-col items-center md:min-w-13">
              <span className="text-[22px] font-bold tabular-nums md:text-[28px]">{pad(unit.value)}</span>
              <span className="mt-1 text-[10px] uppercase tracking-widest text-paper/70">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
