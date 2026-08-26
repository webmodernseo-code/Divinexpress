import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'> & { href: string }) => <a href={href} {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/context/CartContext', () => ({ useCart: () => ({ itemCount: 0 }) }));
vi.mock('@/context/CartDrawerContext', () => ({ useCartDrawer: () => ({ open: vi.fn() }) }));
vi.mock('@/context/FavoritesContext', () => ({ useFavorites: () => ({ favoriteIds: [] }) }));
vi.mock('./LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
vi.mock('./CurrencySwitcher', () => ({ CurrencySwitcher: () => null }));
vi.mock('@/components/ui/Logo', () => ({ Logo: () => <span>DivinExpress</span> }));

describe('Header', () => {
  it('does not expose a favorites heart shortcut', () => {
    render(<Header />);
    expect(screen.queryByRole('link', { name: 'favorites' })).not.toBeInTheDocument();
  });
});
