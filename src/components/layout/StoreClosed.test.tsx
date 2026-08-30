import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoreClosed, isPublicPathAllowedWhileClosed } from './StoreClosed';

vi.mock('@/i18n/navigation', () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe('closed storefront', () => {
  it.each(['/fr/connexion', '/fr/dashboard', '/fr/mentions-legales', '/fr/cgv', '/fr/confidentialite'])(
    'keeps %s accessible while closed',
    (pathname) => expect(isPublicPathAllowedWhileClosed(pathname)).toBe(true),
  );

  it('blocks commercial paths while closed', () => {
    expect(isPublicPathAllowedWhileClosed('/fr/')).toBe(false);
    expect(isPublicPathAllowedWhileClosed('/fr/produit/robe')).toBe(false);
    expect(isPublicPathAllowedWhileClosed('/fr/commande/paiement')).toBe(false);
  });

  it('renders a localized explanation and contact link', () => {
    render(<StoreClosed locale="fr" shopName="Maison Divine" />);
    expect(screen.getByRole('heading', { name: /momentanément fermée/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /contacter/i })).toHaveAttribute('href', '/contact');
  });
});
