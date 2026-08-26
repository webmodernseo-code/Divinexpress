import { Children, isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './page';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CustomerTestimonials } from '@/components/home/CustomerTestimonials';
import { PromotionCarousel } from '@/components/home/PromotionCarousel';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
  setRequestLocale: vi.fn()
}));

vi.mock('@/server/db/runtime', () => ({
  getCommerceDatabase: vi.fn(async () => ({}))
}));

vi.mock('@/server/catalog/storefront', () => ({
  StorefrontCatalog: class {
    async list() {
      return [];
    }
  }
}));

vi.mock('@/server/promotions/repository', () => ({
  PromotionRepository: class {
    async listPublished() {
      return [{ id: 'promo-1', imageUrl: '/image/promotions/carroussel1.png', productId: 'p-1', productSlug: 'robe-satine', productNameFr: 'Robe satinÃ©e', productNameEn: 'Satin dress', position: 0, active: true }];
    }
  }
}));

describe('HomePage composition', () => {
  it('does not render the coupon promotion section', async () => {
    const page = await HomePage({
      params: Promise.resolve({ locale: 'fr' }),
      searchParams: Promise.resolve({})
    });
    const children = Children.toArray(page.props.children).filter(isValidElement);
    expect(children.some((child) => child.type === HeroCarousel)).toBe(true);
    expect(children.some((child) => typeof child.type === 'function' && child.type.name === 'PromoBanner')).toBe(false);
  });

  it('finishes with testimonials followed by the published promotion carousel', async () => {
    const page = await HomePage({
      params: Promise.resolve({ locale: 'fr' }),
      searchParams: Promise.resolve({})
    });
    const children = Children.toArray(page.props.children).filter(isValidElement);
    const testimonialIndex = children.findIndex((child) => child.type === CustomerTestimonials);
    const promotionIndex = children.findIndex((child) => child.type === PromotionCarousel);

    expect(testimonialIndex).toBeGreaterThanOrEqual(0);
    expect(promotionIndex).toBe(testimonialIndex + 1);
    expect((children[promotionIndex].props as { slides: unknown[] }).slides).toHaveLength(1);
  });
});
