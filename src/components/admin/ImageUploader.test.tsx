import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImageUploader } from './ImageUploader';

const labels = { add: 'Ajouter', uploading: 'Envoi…', remove: 'Supprimer' };

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cloudName: 'c', apiKey: 'k', timestamp: '1', folder: 'divinexpress/products', signature: 's' })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/c/up.jpg' }) })
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('ImageUploader', () => {
  it('uploads a file (signed) and reports the returned URL', async () => {
    const onChange = vi.fn();
    render(<ImageUploader value={[]} onChange={onChange} labels={labels} />);

    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('image-uploader-input'), { target: { files: [file] } });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['https://res.cloudinary.com/c/up.jpg'])
    );
  });

  it('requests a promotion-specific signature when used for a promotion image', async () => {
    const onChange = vi.fn();
    render(<ImageUploader value={[]} onChange={onChange} purpose="promotions" labels={labels} />);

    const file = new File(['x'], 'banner.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('image-uploader-input'), { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/admin/upload-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose: 'promotions' }),
    });
  });

  it('removes an image when its remove button is clicked', () => {
    const onChange = vi.fn();
    render(<ImageUploader value={['https://a.jpg', 'https://b.jpg']} onChange={onChange} labels={labels} />);
    fireEvent.click(screen.getAllByLabelText('Supprimer')[0]);
    expect(onChange).toHaveBeenCalledWith(['https://b.jpg']);
  });
});
