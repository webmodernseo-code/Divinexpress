import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PromotionSlide } from '@/server/promotions/repository';
import { PromotionCarousel } from './PromotionCarousel';

vi.mock('next-intl', () => ({
  useLocale: () => 'fr'
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={`/fr${href}`} {...props}>{children}</a>
  )
}));

const slides: PromotionSlide[] = [
  { id: 'promo-1', imageUrl: '/image/promotions/carroussel1.png', productId: 'p-1', productSlug: 'robe-satine', productNameFr: 'Robe satinÃ©e', productNameEn: 'Satin dress', position: 0, active: true },
  { id: 'promo-2', imageUrl: '/image/promotions/carroussel2.png', productId: 'p-2', productSlug: 'veste-premium', productNameFr: 'Veste premium', productNameEn: 'Premium jacket', position: 1, active: true }
];

describe('PromotionCarousel', () => {
  it('renders product-derived locale-aware links in four-corner-rounded cards', () => {
    render(<PromotionCarousel slides={slides} />);

    expect(screen.getByRole('link', { name: /Robe satinÃ©e/ })).toHaveAttribute('href', '/fr/produit/robe-satine');
    expect(screen.getByRole('link', { name: /Veste premium/ })).toHaveAttribute('href', '/fr/produit/veste-premium');
    for (const image of screen.getAllByRole('img')) {
      expect(image.closest('article')).toHaveClass('rounded-3xl', 'overflow-hidden');
    }
  });

  it('offers keyboard and named button navigation', async () => {
    const user = userEvent.setup();
    render(<PromotionCarousel slides={slides} />);

    const carousel = screen.getByRole('region', { name: 'Promotions du moment' });
    expect(screen.getByRole('button', { name: 'Promotion prÃ©cÃ©dente' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Promotion suivante' }));
    expect(screen.getByRole('link', { name: /Veste premium/ })).toHaveAttribute('aria-current', 'true');

    carousel.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('link', { name: /Robe satinÃ©e/ })).toHaveAttribute('aria-current', 'true');
  });
});
