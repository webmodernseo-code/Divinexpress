import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STORE_SETTINGS } from '@/server/settings/store-settings';
import { StoreSettingsForm } from './StoreSettingsForm';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe('StoreSettingsForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('restores the last server values when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsForm initialSettings={DEFAULT_STORE_SETTINGS} locale="fr" save={vi.fn()} />);

    const name = screen.getByLabelText(/nom de la boutique/i);
    await user.clear(name);
    await user.type(name, 'Maison Divine');
    await user.click(screen.getByRole('button', { name: /annuler/i }));

    expect(name).toHaveValue('DivinExpress');
  });

  it('keeps edits and displays an error when saving fails', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockRejectedValue(new Error('SETTINGS_SAVE_FAILED'));
    render(<StoreSettingsForm initialSettings={DEFAULT_STORE_SETTINGS} locale="fr" save={save} />);

    const name = screen.getByLabelText(/nom de la boutique/i);
    await user.clear(name);
    await user.type(name, 'Maison Divine');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible/i);
    expect(name).toHaveValue('Maison Divine');
  });

  it('explains when an enabled payment provider still needs configuration', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/api/admin/security')) {
        return new Response(JSON.stringify({ email: 'admin@example.com' }), { status: 200 });
      }
      return new Response(JSON.stringify({
        shopClosed: false,
        region: { enabled: true, providerConfigured: false, status: 'provider_missing' },
      }), { status: 200 });
    }));

    render(<StoreSettingsForm initialSettings={DEFAULT_STORE_SETTINGS} locale="fr" save={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /paiements/i }));

    expect(await screen.findAllByText(/prestataire à configurer/i)).toHaveLength(2);
  });
});
