'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

type FooterLink = {
  key: 'newArrivals' | 'clothing' | 'accessories' | 'bestSellers' | 'contact' | 'faq' | 'shippingReturns' | 'sizeGuide' | 'legalNotice' | 'terms' | 'privacy' | 'login';
  href: string | { pathname: '/'; query: Record<string, string> };
};

type FooterGroup = {
  key: 'shop' | 'help' | 'legal';
  links: FooterLink[];
};

const FOOTER_GROUPS: FooterGroup[] = [
  {
    key: 'shop',
    links: [
      { key: 'newArrivals', href: '/' },
      { key: 'clothing', href: '/' },
      { key: 'accessories', href: { pathname: '/', query: { categorie: 'accessoires' } } },
      { key: 'bestSellers', href: '/' }
    ]
  },
  {
    key: 'help',
    links: [
      { key: 'contact', href: '/contact' },
      { key: 'faq', href: '/aide' },
      { key: 'shippingReturns', href: '/livraison-retours' },
      { key: 'sizeGuide', href: '/guide-tailles' }
    ]
  },
  {
    key: 'legal',
    links: [
      { key: 'legalNotice', href: '/mentions-legales' },
      { key: 'terms', href: '/cgv' },
      { key: 'privacy', href: '/confidentialite' },
      { key: 'login', href: '/connexion' }
    ]
  }
];

const PAYMENT_LOGOS = [
  { src: '/payment/visa-mastercard.png', width: 1231, height: 496 },
  { src: '/payment/paypal.png', width: 600, height: 400 },
  { src: '/payment/orange-money.png', width: 3840, height: 1025 },
  { src: '/payment/wave.png', width: 701, height: 437 }
];

export function Footer() {
  const t = useTranslations('footer');
  const [openGroup, setOpenGroup] = useState<FooterGroup['key'] | null>(null);

  return (
    <footer className="bg-white border-t border-mist-100 text-ink">
      <Container className="px-4 pb-4 pt-4 sm:px-6 md:pt-8 lg:px-8 lg:pb-5">

        <div className="py-2 lg:grid lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr] lg:gap-12 lg:py-8">
          <div className="mb-2 flex flex-row items-center justify-between gap-4 lg:mb-0 lg:flex-col lg:items-start">
            <Image
              src="/branding/logo-reign.png"
              alt="Reign"
              width={193}
              height={67}
              className="h-auto w-[92px] object-contain lg:w-[110px]"
            />
            <p className="hidden max-w-xs text-[14px] leading-6 text-mist-600 lg:block">{t('tagline')}</p>
            <div className="flex gap-4 items-center">
              {SOCIAL_LINKS.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="text-mist-500 transition-all hover:text-ink hover:scale-110 active:scale-95"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.key} aria-label={t(`groups.${group.key}`)} className="hidden lg:block">
              <h3 className="border-b border-mist-200 pb-5 text-xs font-bold tracking-[0.22em] text-black">
                {t(`groups.${group.key}`)}
              </h3>
              <ul className="mt-6 space-y-4">
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className="text-[15px] text-mist-600 transition-colors hover:text-ink">
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="mt-2 border-t border-mist-200 lg:hidden">
            {FOOTER_GROUPS.map((group) => {
              const isOpen = openGroup === group.key;
              return (
                <div key={group.key} className="border-b border-mist-200">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`footer-${group.key}-panel`}
                    onClick={() => setOpenGroup((current) => (current === group.key ? null : group.key))}
                    className="flex w-full items-center justify-between py-3 text-xs font-bold tracking-[0.22em] text-black"
                  >
                    <span>{t(`groups.${group.key}`)}</span>
                    <span aria-hidden="true" className="text-base">{isOpen ? '−' : '+'}</span>
                  </button>
                  <div id={`footer-${group.key}-panel`} hidden={!isOpen}>
                    <ul className="space-y-3 pb-4">
                      {group.links.map((link) => (
                        <li key={link.key}>
                          <Link href={link.href} className="text-sm text-mist-600 transition-colors hover:text-ink">
                            {t(`links.${link.key}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-mist-200 pt-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
          <p className="hidden text-sm text-mist-500 lg:block">
            © {new Date().getFullYear()} Reign — {t('rights')}
          </p>

          <div>
            <p className="mb-2 text-center text-[11px] font-semibold tracking-[0.2em] text-mist-500 lg:text-left">
              {t('securePayments')}
            </p>
            <div className="flex flex-nowrap items-center justify-center gap-x-2.5 gap-y-3 lg:flex-wrap lg:gap-x-4 lg:justify-start">
              {PAYMENT_LOGOS.map((logo) => (
                <div key={logo.src} className="flex h-9 w-14 items-center justify-center rounded-lg border border-mist-200 bg-white p-1.5 shadow-sm lg:h-12 lg:w-20 lg:rounded-xl lg:p-2">
                  <Image
                    src={logo.src}
                    alt=""
                    width={logo.width}
                    height={logo.height}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-5 lg:mt-0 lg:justify-self-end">
            <LanguageSwitcher variant="footer" />
            <CurrencySwitcher variant="footer" />
          </div>

          <p className="pt-4 text-center text-sm text-mist-500 lg:hidden">
            © {new Date().getFullYear()} Reign — {t('rights')}
          </p>
        </div>
      </Container>
    </footer>
  );
}
