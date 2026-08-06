/* eslint-disable @next/next/no-img-element */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from './Footer';

const replace = vi.fn();
const setCurrency = vi.fn();

vi.mock('next/image', () => ({
  default: ({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: (namespace: string) => {
    const messages: Record<string, string> = {
      'footer.newsletterKicker': 'ACCÈS PRIVÉ',
      'footer.newsletterTitle': 'Gardez une longueur d’avance sur la prochaine sortie.',
      'footer.newsletterBody': 'Soyez parmi les premiers à découvrir les nouveautés, les offres exclusives et plus encore.',
      'footer.newsletterLabel': 'Adresse email',
      'footer.newsletterPlaceholder': 'Adresse email',
      'footer.newsletterButton': 'REJOINDRE LA LISTE',
      'footer.newsletterSuccess': 'Merci, vous êtes inscrit·e à la liste privée.',
      'footer.tagline': 'Vêtements et accessoires premium, façonnés pour durer.',
      'footer.groups.shop': 'SHOP',
      'footer.groups.help': 'AIDE',
      'footer.groups.legal': 'LÉGAL',
      'footer.links.newArrivals': 'Nouveautés',
      'footer.links.clothing': 'Vêtements',
      'footer.links.accessories': 'Accessoires',
      'footer.links.bestSellers': 'Meilleures ventes',
      'footer.links.contact': 'Contact',
      'footer.links.faq': 'FAQ',
      'footer.links.shippingReturns': 'Livraison & Retours',
      'footer.links.sizeGuide': 'Guide des tailles',
      'footer.links.legalNotice': 'Mentions légales',
      'footer.links.terms': 'CGV',
      'footer.links.privacy': 'Confidentialité',
      'footer.securePayments': 'Paiements sécurisés',
      'footer.rights': 'Tous droits réservés.',
      'currency.eur': 'Euro (EUR)',
      'currency.gbp': 'Livre (GBP)'
    };
    return (key: string) => messages[`${namespace}.${key}`] ?? key;
  }
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | object }) => (
    <a href={typeof href === 'string' ? href : '/'} {...props}>{children}</a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ replace })
}));

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({ currency: 'EUR', setCurrency })
}));

describe('Footer', () => {
  beforeEach(() => {
    replace.mockReset();
    setCurrency.mockReset();
  });

  it('renders footer locale and currency controls', () => {
    render(<Footer />);
    expect(screen.getByRole('button', { name: /fr/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eur/i })).toBeInTheDocument();
  });



  it('renders the three desktop navigation groups and their localized links', () => {
    render(<Footer />);
    expect(screen.getAllByText('SHOP').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AIDE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('LÉGAL').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Accessoires' })[0]).toHaveAttribute('href');
    expect(screen.getAllByRole('link', { name: 'Contact' })[0]).toHaveAttribute('href', '/contact');
    expect(screen.getAllByRole('link', { name: 'Confidentialité' })[0]).toHaveAttribute('href', '/confidentialite');
  });

  it('opens and closes a mobile navigation accordion accessibly', async () => {
    const user = userEvent.setup();
    render(<Footer />);
    const trigger = screen.getByRole('button', { name: 'SHOP' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toHaveAttribute('hidden');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses the supplied white logo and labels the secure payment area', () => {
    render(<Footer />);
    expect(screen.getByAltText('Reign')).toHaveAttribute('src', '/branding/logo-reign.png');
    expect(screen.getByText('Paiements sécurisés')).toBeInTheDocument();
  });
});
