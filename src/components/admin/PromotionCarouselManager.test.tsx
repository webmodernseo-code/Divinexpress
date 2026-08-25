import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PromotionCarouselManager } from './PromotionCarouselManager';

vi.mock('next-intl', () => ({ useLocale: () => 'fr' }));
vi.mock('./ImageUploader', () => ({
  ImageUploader: ({ onChange }: { onChange: (urls: string[]) => void }) => (
    <button type="button" onClick={() => onChange(['https://cdn.example/banner.jpg'])}>Téléverser l’image</button>
  ),
}));

const products = [
  {
    id: 'product:active', categoryId: 'category:homme', slug: 'hoodie', nameFr: 'Hoodie', nameEn: 'Hoodie',
    descriptionFr: 'Description', descriptionEn: 'Description', status: 'active', brand: null,
    images: [], compareAtMinor: null, variants: [],
  },
  {
    id: 'product:draft', categoryId: 'category:homme', slug: 'draft', nameFr: 'Brouillon', nameEn: 'Draft',
    descriptionFr: 'Description', descriptionEn: 'Description', status: 'draft', brand: null,
    images: [], compareAtMinor: null, variants: [],
  },
];

const firstSlide = {
  id: 'slide:one', imageUrl: 'https://cdn.example/one.jpg', productId: 'product:active', productSlug: 'hoodie',
  productNameFr: 'Hoodie', productNameEn: 'Hoodie', position: 0, active: true,
};
const secondSlide = {
  ...firstSlide, id: 'slide:two', imageUrl: 'https://cdn.example/two.jpg', position: 1,
};

function response(data: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => data };
}

function mockInitialLoad(slides = [firstSlide]) {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(response(slides))
    .mockResolvedValueOnce(response(products)));
}

describe('PromotionCarouselManager', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('requires an image and an active product before saving', async () => {
    const user = userEvent.setup();
    mockInitialLoad([]);
    render(<PromotionCarouselManager />);
    await screen.findByText(/aucune promotion/i);

    await user.click(screen.getByRole('button', { name: /créer la promotion/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/image.*produit/i);

    await user.click(screen.getByRole('button', { name: /téléverser l’image/i }));
    await user.click(screen.getByRole('button', { name: /créer la promotion/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/produit actif/i);
  });

  it('shows a rounded four-corner preview of the uploaded promotion image', async () => {
    const user = userEvent.setup();
    mockInitialLoad([]);
    render(<PromotionCarouselManager />);
    await screen.findByText(/aucune promotion/i);
    await user.click(screen.getByRole('button', { name: /téléverser l’image/i }));

    expect(screen.getByRole('img', { name: /aperçu de la promotion/i })).toHaveClass('rounded-2xl');
  });

  it('creates a slide after a successful save and keeps only active products as choices', async () => {
    const user = userEvent.setup();
    mockInitialLoad([]);
    const created = { ...firstSlide, id: 'slide:new', imageUrl: 'https://cdn.example/banner.jpg' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response(created, true, 201));
    render(<PromotionCarouselManager />);
    await screen.findByText(/aucune promotion/i);

    await user.click(screen.getByRole('button', { name: /téléverser l’image/i }));
    await user.selectOptions(screen.getByLabelText(/produit associé/i), 'product:active');
    expect(screen.queryByRole('option', { name: /brouillon/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /créer la promotion/i }));

    await waitFor(() => expect(screen.getAllByText('Hoodie')).toHaveLength(2));
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/promotions', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ imageUrl: 'https://cdn.example/banner.jpg', productId: 'product:active', position: 0, active: true }),
    }));
  });

  it('uses the next highest position when creating after a deletion left a gap', async () => {
    const user = userEvent.setup();
    mockInitialLoad([{ ...firstSlide, position: 0 }, { ...secondSlide, position: 3 }]);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response({ ...firstSlide, id: 'slide:new', position: 4 }, true, 201));
    render(<PromotionCarouselManager />);
    await screen.findAllByText('Hoodie');

    await user.click(screen.getByRole('button', { name: /téléverser l’image/i }));
    await user.selectOptions(screen.getByLabelText(/produit associé/i), 'product:active');
    await user.click(screen.getByRole('button', { name: /créer la promotion/i }));

    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/admin/promotions', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ imageUrl: 'https://cdn.example/banner.jpg', productId: 'product:active', position: 4, active: true }),
    })));
  });

  it('toggles a slide without changing it until the update succeeds', async () => {
    const user = userEvent.setup();
    mockInitialLoad();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response({ ...firstSlide, active: false }));
    render(<PromotionCarouselManager />);
    await screen.findAllByText('Hoodie');
    await user.click(screen.getByRole('button', { name: /désactiver/i }));

    await waitFor(() => expect(screen.getByText(/inactive/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/promotions/slide:one', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ active: false }),
    }));
  });

  it('reorders slides only after the reorder request succeeds', async () => {
    const user = userEvent.setup();
    mockInitialLoad([firstSlide, secondSlide]);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response({ ok: true }));
    render(<PromotionCarouselManager />);
    await screen.findAllByText('Hoodie');
    await user.click(screen.getByRole('button', { name: /descendre hoodie 1/i }));

    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/admin/promotions', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ ids: ['slide:two', 'slide:one'] }),
    })));
  });

  it('deletes a slide only after the administrator confirms', async () => {
    const user = userEvent.setup();
    mockInitialLoad();
    vi.stubGlobal('confirm', vi.fn(() => true));
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 204 });
    render(<PromotionCarouselManager />);
    await screen.findAllByText('Hoodie');
    await user.click(screen.getByRole('button', { name: /supprimer hoodie/i }));

    await waitFor(() => expect(screen.getByText(/aucune promotion/i)).toBeInTheDocument());
    expect(confirm).toHaveBeenCalled();
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/promotions/slide:one', { method: 'DELETE' });
  });
});
