'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';

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
      <Container className="grid gap-12 py-16 md:grid-cols-3">
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
                className="w-full border-b border-mist-300 bg-transparent px-1 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <Button type="submit" variant="secondary">
                {t('newsletterButton')}
              </Button>
            </form>
          )}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          {INSTITUTIONAL_LINKS.map(({ href, key }) => (
            <Link key={href} href={href} className="text-mist-700 hover:text-accent">
              {t(`links.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4 md:justify-end">
          {SOCIAL_LINKS.map(({ label, Icon }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mist-300 text-ink hover:border-accent hover:text-accent"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </Container>

      <div className="border-t border-mist-100 py-6 text-center text-xs text-mist-500">
        © {new Date().getFullYear()} Reign — {t('rights')}
      </div>
    </footer>
  );
}
