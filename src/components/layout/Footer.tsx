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
  key: 'newArrivals' | 'clothing' | 'accessories' | 'bestSellers' | 'contact' | 'faq' | 'shippingReturns' | 'sizeGuide' | 'legalNotice' | 'terms' | 'privacy';
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
      { key: 'privacy', href: '/confidentialite' }
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
  const [email, setEmail] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [openGroup, setOpenGroup] = useState<FooterGroup['key'] | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!email.trim() || !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setHasSubscribed(true);
    setEmail('');
  }

  return (
    <footer className="bg-ink text-paper">
      <Container className="px-4 pb-8 pt-8 sm:px-6 md:pt-12 lg:px-8 lg:pb-7">
        <section className="rounded-[24px] bg-[#f4f1ec] px-6 py-9 text-ink sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-11">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mist-600">{t('newsletterKicker')}</p>
            <h2 className="mt-4 max-w-xl font-serif text-[32px] leading-[1.05] tracking-tight sm:text-4xl lg:text-[42px]">
              {t('newsletterTitle')}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-mist-600 sm:text-base">{t('newsletterBody')}</p>
          </div>

          {hasSubscribed ? (
            <p role="status" className="mt-7 text-sm font-medium text-mist-700 lg:mt-0">
              {t('newsletterSuccess')}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-0 lg:mt-0">
              <label htmlFor="footer-email" className="sr-only">
                {t('newsletterLabel')}
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('newsletterPlaceholder')}
                className="h-14 min-w-0 flex-1 rounded-full border border-ink/70 bg-transparent px-6 text-base text-ink outline-none placeholder:text-mist-500 focus:ring-2 focus:ring-ink/20 sm:rounded-r-none"
              />
              <button
                type="submit"
                className="h-14 flex-shrink-0 rounded-full bg-ink px-8 text-xs font-semibold tracking-[0.16em] text-paper transition-colors hover:bg-mist-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 sm:rounded-l-none"
              >
                {t('newsletterButton')}
              </button>
            </form>
          )}
        </section>

        <div className="py-12 lg:grid lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr] lg:gap-16 lg:py-16">
          <div className="mb-10 flex flex-col items-start gap-6 lg:mb-0">
            <Image
              src="/branding/logo-reign-white.png"
              alt="Reign"
              width={193}
              height={67}
              className="h-auto w-[170px] object-contain"
            />
            <p className="max-w-xs text-[15px] leading-7 text-paper/70">{t('tagline')}</p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-paper/70 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.key} aria-label={t(`groups.${group.key}`)} className="hidden lg:block">
              <h3 className="border-b border-paper/20 pb-5 text-xs font-semibold tracking-[0.22em] text-paper/70">
                {t(`groups.${group.key}`)}
              </h3>
              <ul className="mt-6 space-y-4">
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className="text-[15px] text-paper/70 transition-colors hover:text-paper">
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="border-t border-paper/20 lg:hidden">
            {FOOTER_GROUPS.map((group) => {
              const isOpen = openGroup === group.key;
              return (
                <div key={group.key} className="border-b border-paper/20">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`footer-${group.key}-panel`}
                    onClick={() => setOpenGroup((current) => (current === group.key ? null : group.key))}
                    className="flex w-full items-center justify-between py-5 text-xs font-semibold tracking-[0.22em] text-paper"
                  >
                    <span>{t(`groups.${group.key}`)}</span>
                    <span aria-hidden="true" className="text-base">{isOpen ? '−' : '+'}</span>
                  </button>
                  <div id={`footer-${group.key}-panel`} hidden={!isOpen}>
                    <ul className="space-y-4 pb-6">
                      {group.links.map((link) => (
                        <li key={link.key}>
                          <Link href={link.href} className="text-sm text-paper/70 transition-colors hover:text-paper">
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

        <div className="border-t border-paper/15 pt-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
          <p className="hidden text-sm text-paper/60 lg:block">
            © {new Date().getFullYear()} Reign — {t('rights')}
          </p>

          <div>
            <p className="mb-5 text-center text-[11px] font-semibold tracking-[0.2em] text-paper/60 lg:text-left">
              {t('securePayments')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start">
              {PAYMENT_LOGOS.map((logo) => (
                <Image
                  key={logo.src}
                  src={logo.src}
                  alt=""
                  width={logo.width}
                  height={logo.height}
                  className="h-6 w-auto object-contain"
                />
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-5 lg:mt-0 lg:justify-self-end">
            <LanguageSwitcher variant="footer" />
            <CurrencySwitcher variant="footer" />
          </div>

          <p className="pt-7 text-center text-sm text-paper/60 lg:hidden">
            © {new Date().getFullYear()} Reign — {t('rights')}
          </p>
        </div>
      </Container>
    </footer>
  );
}
