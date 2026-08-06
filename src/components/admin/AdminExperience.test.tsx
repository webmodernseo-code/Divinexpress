import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminDemoProvider } from '@/context/AdminDemoContext';
import { AdminShell } from './AdminShell';
import { LoginPanel } from './LoginPanel';
import { DashboardOverview } from './DashboardOverview';

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string) => key,
}));

describe('premium admin experience', () => {
  it('opens and closes the responsive navigation', async () => {
    const user = userEvent.setup();
    render(<AdminDemoProvider><AdminShell><p>Contenu</p></AdminShell></AdminDemoProvider>);
    await user.click(screen.getByRole('button', { name: /ouvrir la navigation/i }));
    expect(screen.getByRole('dialog', { name: /navigation/i })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /navigation/i })).not.toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPanel locale="fr" action={async () => ({ error: '' })} />);
    const password = screen.getByLabelText(/^mot de passe$/i);
    await user.click(screen.getByRole('button', { name: /afficher le mot de passe/i }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('renders every dashboard region', () => {
    render(<AdminDemoProvider><DashboardOverview /></AdminDemoProvider>);
    expect(screen.getByText(/chiffre d'affaires/i)).toBeVisible();
    expect(screen.getByRole('heading', { name: /^ventes$/i })).toBeVisible();
    expect(screen.getByText(/commandes récentes/i)).toBeVisible();
    expect(screen.getByText(/alertes stock/i)).toBeVisible();
    expect(screen.getByText(/actions rapides/i)).toBeVisible();
  });
});
