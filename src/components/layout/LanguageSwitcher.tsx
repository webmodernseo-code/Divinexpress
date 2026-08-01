'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

type Locale = 'fr' | 'en';

const LANGUAGES: { code: Locale; label: string; name: string }[] = [
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'en', label: 'EN', name: 'English' }
];

function FlagFr({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#002395" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  );
}

function FlagGb({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#00247d" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth={4} />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" strokeWidth={2} />
      <path d="M15,0 V20 M0,10 H30" stroke="#fff" strokeWidth={6} />
      <path d="M15,0 V20 M0,10 H30" stroke="#cf142b" strokeWidth={3} />
    </svg>
  );
}

const FLAGS: Record<Locale, typeof FlagFr> = { fr: FlagFr, en: FlagGb };

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

type SwitcherVariant = 'utility' | 'footer';

export function LanguageSwitcher({ variant = 'utility' }: { variant?: SwitcherVariant }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFooter = variant === 'footer';
  const triggerClassName = isFooter
    ? 'inline-flex min-h-11 items-center gap-2 bg-transparent text-sm font-medium text-paper transition-colors hover:text-paper/70'
    : 'inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-paper hover:bg-paper/20';
  const menuPositionClassName = isFooter
    ? 'absolute bottom-[calc(100%+8px)] right-0 z-20'
    : 'absolute right-0 top-[calc(100%+8px)] z-20';

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function switchTo(nextLocale: Locale) {
    setIsOpen(false);
    router.replace(pathname, { locale: nextLocale });
  }

  const ActiveFlag = FLAGS[locale];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={triggerClassName}
      >
        <ActiveFlag className="h-[11px] w-4 rounded-[2px]" />
        <span>{isFooter ? LANGUAGES.find((item) => item.code === locale)?.name : locale.toUpperCase()}</span>
        <ChevronIcon className={`h-[9px] w-[9px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={`${menuPositionClassName} flex min-w-[150px] flex-col gap-0.5 rounded-2xl border border-mist-100 bg-paper p-1.5 shadow-lg`}>
          {LANGUAGES.map(({ code, name }) => {
            const Flag = FLAGS[code];
            const isActive = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => switchTo(code)}
                aria-pressed={isActive}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold hover:bg-mist-100 ${
                  isActive ? 'text-accent' : 'text-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flag className="h-[11px] w-4 rounded-[2px]" />
                  <span>{name}</span>
                </span>
                <CheckIcon className={`h-[13px] w-[13px] flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
