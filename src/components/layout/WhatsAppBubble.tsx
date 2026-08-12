'use client';

import { useLocale } from 'next-intl';
import { whatsappLink } from '@/lib/contactInfo';

/** Floating WhatsApp button shown on storefront pages; opens a WhatsApp chat. */
export function WhatsAppBubble() {
  const locale = (useLocale() as 'fr' | 'en') ?? 'fr';
  const label = locale === 'fr' ? 'Discuter sur WhatsApp' : 'Chat on WhatsApp';

  return (
    <a
      href={whatsappLink(locale)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group fixed bottom-6 right-4 z-50 flex items-center gap-0 rounded-full bg-ink text-paper shadow-lg shadow-black/25 ring-1 ring-white/10 transition-all duration-300 hover:gap-2 hover:bg-accent hover:pr-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:right-6"
    >
      <span className="relative flex size-14 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 32 32" className="size-7 fill-current" aria-hidden="true">
          <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.257.59 4.46 1.712 6.4L3.2 28.8l6.57-1.72a12.74 12.74 0 0 0 6.233 1.61h.005c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.332-6.635-3.75-9.052A12.72 12.72 0 0 0 16.003 3.2zm0 23.29h-.004a10.6 10.6 0 0 1-5.4-1.48l-.387-.23-4.01 1.05 1.07-3.91-.253-.4a10.57 10.57 0 0 1-1.62-5.63c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.86-4.77 10.63-10.64 10.63zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.58-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.62 0 1.55 1.13 3.04 1.29 3.25.16.21 2.22 3.39 5.38 4.76.75.32 1.34.51 1.8.66.76.24 1.44.21 1.98.13.6-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37z" />
        </svg>
        {/* Green "available 24/7" status dot */}
        <span className="absolute right-1.5 top-1.5 flex size-3.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-80" />
          <span className="relative inline-flex size-3.5 rounded-full bg-green-500 ring-2 ring-ink" />
        </span>
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[220px]">
        {label}
      </span>
    </a>
  );
}
