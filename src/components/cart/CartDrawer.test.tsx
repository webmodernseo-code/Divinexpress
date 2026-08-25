/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartDrawer } from './CartDrawer';

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  items: [{
    productId: 'robe-1',
    slug: 'robe-soir',
    name: { fr: 'Robe de soir', en: 'Evening dress' },
    imageUrl: '/products/robe.jpg',
    category: 'femme' as const,
    size: 'M',
    color: 'Noir',
    quantity: 2,
    unitPriceEur: 29.9
  }]
}));

vi.mock('next/image', () => ({
  default: ({ alt = '', fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <img alt={alt} {...props} />;
  }
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string) => ({
    empty: 'Votre panier est vide.',
    subtotal: 'Sous-total',
    checkout: 'Passer commande',
    quantity: 'Quantité',
    remove: 'Retirer'
  })[key] ?? key
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: mocks.items,
    subtotalEur: 59.8,
    removeItem: mocks.removeItem,
    updateQuantity: mocks.updateQuantity
  })
}));
vi.mock('@/context/CartDrawerContext', () => ({
  useCartDrawer: () => ({ isOpen: true, close: mocks.close })
}));
vi.mock('@/context/CurrencyContext', () => ({ useCurrency: () => ({ currency: 'EUR' }) }));

describe('CartDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    mocks.items[0].quantity = 2;
  });

  it('presents the cart as a centered product-rich checkout dialog', () => {
    render(<CartDrawer open onClose={mocks.close} />);

    const dialog = screen.getByRole('dialog', { name: 'Votre panier' });
    expect(dialog).toHaveClass('left-1/2', 'top-1/2', 'rounded-3xl');
    expect(within(dialog).getByRole('img', { name: 'Robe de soir' })).toHaveAttribute('src', '/products/robe.jpg');
    expect(within(dialog).getByText('Taille M')).toBeInTheDocument();
    expect(within(dialog).getByText('Couleur Noir')).toBeInTheDocument();
    expect(within(dialog).getByText(/29,90\s*€\s*\/\s*unité/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/59,80\s*€/)).toHaveLength(2);
    expect(within(dialog).getByRole('link', { name: /passer commande/i })).toHaveAttribute('href', '/commande/livraison');
  });

  it('increments and decrements a line while enforcing a minimum quantity of one', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CartDrawer open onClose={mocks.close} />);

    await user.click(screen.getByRole('button', { name: 'Augmenter la quantité de Robe de soir' }));
    await user.click(screen.getByRole('button', { name: 'Diminuer la quantité de Robe de soir' }));
    expect(mocks.updateQuantity).toHaveBeenNthCalledWith(1, 'robe-1', 'M', 'Noir', 3);
    expect(mocks.updateQuantity).toHaveBeenNthCalledWith(2, 'robe-1', 'M', 'Noir', 1);

    mocks.items[0].quantity = 1;
    rerender(<CartDrawer open onClose={mocks.close} />);
    expect(screen.getByRole('button', { name: 'Diminuer la quantité de Robe de soir' })).toBeDisabled();
  });

  it('closes from the backdrop or Escape and restores body scrolling', async () => {
    const { unmount } = render(<CartDrawer open onClose={mocks.close} />);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mocks.close).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer le panier en cliquant sur l’arrière-plan' }));
    expect(mocks.close).toHaveBeenCalledTimes(2);

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps keyboard focus inside the dialog in both directions', async () => {
    const user = userEvent.setup();
    render(<CartDrawer open onClose={mocks.close} />);

    const dialog = screen.getByRole('dialog', { name: 'Votre panier' });
    const closeButton = within(dialog).getByRole('button', { name: 'Fermer le panier' });
    const checkoutLink = within(dialog).getByRole('link', { name: /passer commande/i });

    expect(closeButton).toHaveFocus();
    checkoutLink.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(checkoutLink).toHaveFocus();
  });
});
