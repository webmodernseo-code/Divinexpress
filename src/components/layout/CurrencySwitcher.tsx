'use client';

import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import type { CurrencyCode } from '@/lib/currency';

const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'Livre (GBP)' }
];

function CurrencySymbol({ symbol, className = '' }: { symbol: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <text x="8" y="12.5" textAnchor="middle" fontSize="14" fontWeight={700} fill="currentColor" fontFamily="Arial, sans-serif">
        {symbol}
      </text>
    </svg>
  );
}

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

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const active = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-paper hover:bg-paper/20"
      >
        <CurrencySymbol symbol={active.symbol} className="h-3 w-3" />
        <span>{active.code}</span>
        <ChevronIcon className={`h-[9px] w-[9px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 flex min-w-[150px] flex-col gap-0.5 rounded-2xl border border-mist-100 bg-paper p-1.5 shadow-lg">
          {CURRENCIES.map(({ code, symbol, name }) => {
            const isActive = currency === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setCurrency(code);
                }}
                aria-pressed={isActive}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold hover:bg-mist-100 ${
                  isActive ? 'text-accent' : 'text-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CurrencySymbol symbol={symbol} className="h-3 w-3" />
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
