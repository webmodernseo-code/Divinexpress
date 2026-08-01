import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/fr.json';
import { getProductBySlug, getRelatedProducts, type Product } from '@/lib/products';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { CartDrawerProvider, useCartDrawer } from '@/context/CartDrawerContext';
import { ProductDetailView } from './ProductDetailView';

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: pushMock })
}));

/** Exposes cart + drawer state so the actions can be asserted without rendering the drawer. */
function Probe() {
  const { items } = useCart();
  const { isOpen } = useCartDrawer();
  return <span data-testid="probe">{JSON.stringify({ items, isOpen })}</span>;
}

function readProbe() {
  return JSON.parse(screen.getByTestId('probe').textContent ?? '{}');
}

function renderPdp(product: Product, relatedProducts: Product[] = []) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <CurrencyProvider initialLocale="fr">
        <CartProvider>
          <FavoritesProvider>
            <CartDrawerProvider>
              <ProductDetailView product={product} relatedProducts={relatedProducts} />
              <Probe />
            </CartDrawerProvider>
          </FavoritesProvider>
        </CartProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}

const jacket = getProductBySlug('homme-veste-oversize') as Product;
const kidsHoodie = getProductBySlug('enfant-sweat-capuche') as Product;
const ring = getProductBySlug('accessoires-bijou-anneau') as Product;

describe('ProductDetailView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it('swaps the main gallery image when a thumbnail is clicked', async () => {
    renderPdp(jacket);
    expect(screen.getByText(/— 1\/4$/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: `${jacket.name.fr} 3` }));
    expect(screen.getByText(/— 3\/4$/)).toBeInTheDocument();
  });

  it('selects size and color through pills and swatches', async () => {
    renderPdp(jacket);
    const large = screen.getByRole('button', { name: 'L' });
    expect(screen.getByRole('button', { name: 'XS' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(large);
    expect(large).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'XS' })).toHaveAttribute('aria-pressed', 'false');

    const steel = screen.getByRole('button', { name: 'Bleu acier' });
    await userEvent.click(steel);
    expect(steel).toHaveAttribute('aria-pressed', 'true');
  });

  it('steps the quantity up and never below one', async () => {
    renderPdp(jacket);
    const increase = screen.getByRole('button', { name: 'Augmenter la quantité' });
    const decrease = screen.getByRole('button', { name: 'Diminuer la quantité' });
    const stepper = within(increase.parentElement as HTMLElement);

    await userEvent.click(increase);
    await userEvent.click(increase);
    expect(stepper.getByText('3')).toBeInTheDocument();

    await userEvent.click(decrease);
    await userEvent.click(decrease);
    await userEvent.click(decrease);
    expect(stepper.getByText('1')).toBeInTheDocument();
  });

  it('adds the selected variant to the cart and opens the drawer', async () => {
    renderPdp(jacket);
    await userEvent.click(screen.getByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter au panier' }));

    const state = readProbe();
    expect(state.items).toEqual([{ productId: jacket.id, size: 'M', color: 'Noir', quantity: 2 }]);
    expect(state.isOpen).toBe(true);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('buy now adds to the cart and navigates to checkout without opening the drawer', async () => {
    renderPdp(jacket);
    await userEvent.click(screen.getByRole('button', { name: 'Acheter maintenant' }));

    const state = readProbe();
    expect(state.items).toEqual([{ productId: jacket.id, size: 'XS', color: 'Noir', quantity: 1 }]);
    expect(state.isOpen).toBe(false);
    expect(pushMock).toHaveBeenCalledWith('/commande/livraison');
  });

  it('toggles the favorite state', async () => {
    renderPdp(jacket);
    const favorite = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    expect(favorite).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(favorite);
    expect(favorite).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows one tab panel at a time', async () => {
    renderPdp(jacket);
    expect(screen.getByText(jacket.description.fr)).toBeVisible();
    expect(screen.getByText(messages.product.detailsBody)).not.toBeVisible();

    await userEvent.click(screen.getByRole('tab', { name: 'Détails' }));
    expect(screen.getByText(messages.product.detailsBody)).toBeVisible();
    expect(screen.getByText(jacket.description.fr)).not.toBeVisible();

    await userEvent.click(screen.getByRole('tab', { name: 'Entretien' }));
    expect(screen.getByText(messages.product.careBody)).toBeVisible();
  });

  it('moves between tabs with the arrow keys', async () => {
    renderPdp(jacket);
    screen.getByRole('tab', { name: 'Description' }).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Détails' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(messages.product.detailsBody)).toBeVisible();
  });

  it('shows the adult measurements table for clothing sizes', async () => {
    renderPdp(jacket);
    await userEvent.click(screen.getByRole('tab', { name: 'Guide des tailles' }));
    expect(screen.getByRole('columnheader', { name: 'Tour de poitrine' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '107-112' })).toBeVisible();
    expect(screen.queryByRole('columnheader', { name: 'Taille (hauteur)' })).toBeNull();
  });

  it('shows the kids height table for kids sizes', async () => {
    renderPdp(kidsHoodie);
    await userEvent.click(screen.getByRole('tab', { name: 'Guide des tailles' }));
    expect(screen.getByRole('columnheader', { name: 'Âge (ans)' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Taille (hauteur)' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '152-158' })).toBeVisible();
    expect(screen.queryByRole('columnheader', { name: 'Tour de poitrine' })).toBeNull();
  });

  it('shows a one-size note instead of a table for accessories', async () => {
    renderPdp(ring);
    await userEvent.click(screen.getByRole('tab', { name: 'Guide des tailles' }));
    expect(screen.getByText('Taille unique')).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('links to the contact page and renders related products', () => {
    renderPdp(jacket, getRelatedProducts(jacket));
    expect(screen.getByRole('link', { name: /Contactez-nous/ })).toHaveAttribute('href', '/contact');
    expect(screen.getByText('Vous aimerez aussi')).toBeInTheDocument();
    expect(screen.getByText('Pantalon droit taille haute')).toBeInTheDocument();
    expect(screen.getByText('Chemise col mao')).toBeInTheDocument();
  });
});
