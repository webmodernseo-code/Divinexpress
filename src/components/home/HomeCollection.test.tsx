/* eslint-disable @next/next/no-img-element */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ALL_PRODUCTS } from '@/lib/products';
import { HomeCollection } from './HomeCollection';

vi.mock('next/image', () => ({
  default: ({ alt = '', fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    void fill;
    void priority;
    return <img alt={alt} {...props} />;
  }
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: (namespace: string) => {
    const messages: Record<string, string> = {
      'home.categoriesTitle': 'Catégories',
      'home.collectionTitle': 'La collection',
      'home.loadMore': 'Voir plus',
      'nav.homme': 'Homme',
      'nav.femme': 'Femme',
      'nav.enfant': 'Enfant',
      'nav.accessoires': 'Accessoires',
      'nav.allCategories': 'Toutes',
      'product.addToCart': 'Ajouter au panier',
      'product.toggleFavorite': 'Favori',
      'product.new': 'Nouveau'
    };
    return (key: string) => messages[`${namespace}.${key}`] ?? key;
  }
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

vi.mock('@/context/CartContext', () => ({ useCart: () => ({ addItem: vi.fn() }) }));
vi.mock('@/context/CartDrawerContext', () => ({ useCartDrawer: () => ({ open: vi.fn() }) }));
vi.mock('@/context/CurrencyContext', () => ({ useCurrency: () => ({ currency: 'EUR' }) }));
vi.mock('@/context/FavoritesContext', () => ({
  useFavorites: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() })
}));

const homme = ALL_PRODUCTS.find((product) => product.category === 'homme')!;
const femme = ALL_PRODUCTS.find((product) => product.category === 'femme')!;

describe('HomeCollection', () => {
  it('keeps every category in one horizontally scrollable row', () => {
    render(<HomeCollection initialCategory={null} initialSubcategory={null} products={[homme, femme]} />);

    const row = screen.getByTestId('category-scroll-row');
    expect(row).toHaveClass('flex-nowrap', 'overflow-x-auto');
    expect(row).not.toHaveClass('flex-wrap');
  });

  it('starts with an active All category and does not render the category heading', () => {
    render(<HomeCollection initialCategory={null} initialSubcategory={null} products={[homme, femme]} />);

    expect(screen.queryByRole('heading', { name: /catégories/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toutes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Homme' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows only products from the selected category without exposing filter controls', async () => {
    const user = userEvent.setup();
    render(<HomeCollection initialCategory={null} initialSubcategory={null} products={[homme, femme]} />);

    await user.click(screen.getByRole('button', { name: 'Homme' }));

    expect(screen.getByText(homme.name.fr)).toBeInTheDocument();
    expect(screen.queryByText(femme.name.fr)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows the approved sentence when a selected category has no product', async () => {
    const user = userEvent.setup();
    render(<HomeCollection initialCategory={null} initialSubcategory={null} products={[femme]} />);

    await user.click(screen.getByRole('button', { name: 'Homme' }));

    expect(screen.getByText('Aucun produit n’est disponible dans cette catégorie pour le moment — revenez très bientôt.')).toBeInTheDocument();
  });
});
