import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_STORE_SETTINGS } from '@/server/settings/store-settings';
import { ContactContent } from './ContactContent';

vi.mock('next-intl', () => ({ useLocale: () => 'fr' }));
vi.mock('next/image', () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));

describe('ContactContent', () => {
  it('renders the configured email, phone and return period', () => {
    render(<ContactContent settings={{ ...DEFAULT_STORE_SETTINGS, email: 'bonjour@example.com', phone: '+33 1 02 03 04 05', return_period_days: 30 }} />);
    expect(screen.getByRole('link', { name: 'bonjour@example.com' })).toHaveAttribute('href', 'mailto:bonjour@example.com');
    expect(screen.getByRole('link', { name: '+33 1 02 03 04 05' })).toHaveAttribute('href', 'tel:+33102030405');
    expect(screen.getByText(/retours 30 jours/i)).toBeVisible();
  });
});
