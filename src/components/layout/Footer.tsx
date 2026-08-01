'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

const INSTITUTIONAL_LINKS: { href: string; key: string }[] = [
  { href: '/a-propos', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/aide', key: 'faq' },
  { href: '/livraison-retours', key: 'shippingReturns' },
  { href: '/guide-tailles', key: 'sizeGuide' },
  { href: '/mentions-legales', key: 'legalNotice' },
  { href: '/cgv', key: 'terms' },
  { href: '/confidentialite', key: 'privacy' }
];

const PAYMENT_LOGOS = [
  { src: '/payment/visa-mastercard.png', width: 1231, height: 496 },
  { src: '/payment/paypal.png', width: 600, height: 400 },
  { src: '/payment/orange-money.png', width: 3840, height: 1025 },
  { src: '/payment/wave.png', width: 701, height: 437 }
];

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function Footer() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) {
      setHasSubscribed(true);
      setEmail('');
    }
  }

  return (
    <footer className="border-t border-mist-100 bg-paper text-ink">
      <Container className="py-16">
        <div className="flex flex-col items-start gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-mist-600">{t('tagline')}</p>
        </div>

        <div className="mt-12 grid gap-12 md:grid-cols-3">
          <div>
            <h2 className="font-serif text-xl">{t('newsletterTitle')}</h2>
            {hasSubscribed ? (
              <p className="mt-4 text-sm text-mist-600">{t('newsletterSuccess')}</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('newsletterPlaceholder')}
                  className="w-full rounded-full border border-mist-100 bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
                <Button type="submit" variant="secondary" className="flex-shrink-0 rounded-full">
                  {t('newsletterButton')}
                </Button>
              </form>
            )}
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3.5 text-sm">
            {INSTITUTIONAL_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between text-mist-700 transition-colors hover:text-accent"
              >
                {t(`links.${key}`)}
                <ChevronRightIcon />
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-6 md:items-end">
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-mist-100 bg-paper text-ink shadow-sm transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>

            <div className="w-full rounded-2xl border border-mist-100 px-5 py-4 md:max-w-[240px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-mist-500">{t('securePayments')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {PAYMENT_LOGOS.map((logo) => (
                  <Image
                    key={logo.src}
                    src={logo.src}
                    alt=""
                    width={logo.width}
                    height={logo.height}
                    className="h-5 w-auto rounded-sm object-contain"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div className="flex justify-center gap-5 bg-ink px-4 py-4">
        <LanguageSwitcher variant="footer" />
        <CurrencySwitcher variant="footer" />
      </div>

      <div className="border-t border-mist-100 py-6 text-center text-xs text-mist-500">
        © {new Date().getFullYear()} Reign — {t('rights')}
      </div>
    </footer>
  );
}
