/* eslint-disable @next/next/no-img-element */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderSummary } from './OrderSummary';

vi.mock('next/image', () => ({
  default: ({ alt = '', fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <img alt={alt} {...props} />;
  }
}));

vi.mock('next-intl', () => ({ useLocale: () => 'fr' }));
vi.mock('@/context/CurrencyContext', () => ({ useCurrency: () => ({ currency: 'EUR' }) }));

describe('OrderSummary', () => {
  it('shows localized product details, image, line total and subtotal', () => {
    render(
      <OrderSummary
        items={[{
          productId: 'robe-1',
          slug: 'robe-lune',
          name: { fr: 'Robe Lune', en: 'Moon Dress' },
          imageUrl: '/products/robe-lune.jpg',
          category: 'femme',
          size: 'M',
          color: 'Noir',
          quantity: 2,
          unitPriceEur: 29.9
        }]}
        subtotalEur={59.8}
      />
    );

    const summary = screen.getByRole('region', { name: 'Récapitulatif de la commande' });
    expect(within(summary).getByRole('img', { name: 'Robe Lune' })).toHaveAttribute('src', '/products/robe-lune.jpg');
    expect(within(summary).getByText('Taille : M')).toBeInTheDocument();
    expect(within(summary).getByText('Couleur : Noir')).toBeInTheDocument();
    expect(within(summary).getByText('Quantité : 2')).toBeInTheDocument();
    expect(within(summary).getAllByText(/59,80\s*€/)).toHaveLength(2);
  });
});
