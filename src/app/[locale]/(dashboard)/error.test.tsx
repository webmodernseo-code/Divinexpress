import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DashboardError from './error';

let currentLocale: 'fr' | 'en' = 'fr';

vi.mock('next-intl', () => ({
  useLocale: () => currentLocale,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={`/${currentLocale}${href}`} {...props}>{children}</a>
  ),
}));

describe('DashboardError', () => {
  it('retries the dashboard segment from the recovery action', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(<DashboardError error={new Error('temporary failure')} reset={reset} />);
    await user.click(screen.getByRole('button', { name: /r[eé]essayer/i }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it('returns an English dashboard visitor to the localized dashboard', () => {
    currentLocale = 'en';

    render(<DashboardError error={new Error('temporary failure')} reset={vi.fn()} />);

    expect(screen.getByRole('link', { name: /return to dashboard/i })).toHaveAttribute('href', '/en/dashboard');
    currentLocale = 'fr';
  });
});
