import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PRODUCTS } from '@/lib/products';
import { ProductCard } from './ProductCard';

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string) =>
    ({ addToCart: 'Ajouter au panier', toggleFavorite: 'Favori', new: 'Nouveau' })[key] ?? key
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

describe('ProductCard', () => {
  it('keeps the add-to-cart action outside the product link so it can flow below the image on mobile', () => {
    const product = PRODUCTS[0];
    render(<ProductCard product={product} />);

    const addToCart = screen.getByRole('button', { name: 'Ajouter au panier' });

    expect(addToCart.closest('a')).toBeNull();
  });

  it('makes the product image fill its rounded grey frame', () => {
    render(<ProductCard product={PRODUCTS[0]} />);

    const image = screen.getByRole('img', { name: PRODUCTS[0].name.fr });
    expect(image).toHaveClass('object-cover');
    expect(image.parentElement).toHaveClass('rounded-2xl', 'bg-mist-100');
    expect(image.parentElement).not.toHaveClass('p-4');
  });
});
