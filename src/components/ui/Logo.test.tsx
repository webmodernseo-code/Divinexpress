import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { LoginPanel } from '@/components/admin/LoginPanel';
import { Logo } from './Logo';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

function expectCompleteBrandLockup(lockup: HTMLElement) {
  const images = Array.from(lockup.querySelectorAll('img'));

  expect(images).toHaveLength(2);
  expect(decodeURIComponent(images[0].getAttribute('src') ?? '')).toContain('/branding/logo-divinexpress-mark.png');
  expect(decodeURIComponent(images[1].getAttribute('src') ?? '')).toContain('/branding/logo-divinexpress.png');
  expect(images[0]).toHaveAttribute('alt', '');
  expect(images[1]).toHaveAttribute('alt', '');
}

describe('Logo', () => {
  it('announces one home link while showing the mark before the wordmark', () => {
    render(<Logo markClassName="custom-mark" wordmarkClassName="custom-wordmark" />);

    const lockup = screen.getByRole('link', { name: 'DivinExpress — accueil' });
    expectCompleteBrandLockup(lockup);
    const images = lockup.querySelectorAll('img');
    expect(images[0]).toHaveClass('custom-mark');
    expect(images[1]).toHaveClass('custom-wordmark');
  });

  it('uses the complete shared lockup on the form side of the login page', () => {
    render(<LoginPanel locale="fr" action={async () => ({ error: '' })} />);

    expectCompleteBrandLockup(screen.getByRole('link', { name: 'DivinExpress — accueil' }));
  });
});
