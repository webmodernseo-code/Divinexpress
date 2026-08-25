import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotBubble } from './ChatbotBubble';

vi.mock('next-intl', () => ({ useLocale: () => 'fr' }));

describe('ChatbotBubble', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('opens an on-site dialog with a welcome message and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(<ChatbotBubble />);
    const trigger = screen.getByRole('button', { name: /ouvrir l.assistant divinexpress/i });
    expect(document.querySelector('a[href*="wa.me"]')).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: /assistant divinexpress/i })).toBeVisible();
    expect(screen.getByText(/bonjour.*comment puis-je vous aider/i)).toBeVisible();
    expect(screen.getByRole('textbox', { name: /votre message/i })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('blocks background clicks and closes only through its backdrop', async () => {
    const user = userEvent.setup();
    const behind = vi.fn();
    render(<><button type="button" onClick={behind}>Action arrière-plan</button><ChatbotBubble /></>);
    await user.click(screen.getByRole('button', { name: /ouvrir l.assistant/i }));
    await user.click(screen.getByRole('button', { name: /fermer l.assistant en cliquant/i }));
    expect(behind).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('wraps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<ChatbotBubble />);
    await user.click(screen.getByRole('button', { name: /ouvrir l.assistant/i }));
    const input = screen.getByRole('textbox', { name: /votre message/i });
    const close = screen.getByRole('button', { name: /^fermer l.assistant$/i });
    expect(input).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(input).toHaveFocus();
  });

  it('shows the customer question and the assistant reply', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ reply: 'Nos retours sont possibles sous 14 jours.' }), { status: 200 }));
    render(<ChatbotBubble />);
    await user.click(screen.getByRole('button', { name: /ouvrir l.assistant/i }));
    await user.type(screen.getByRole('textbox', { name: /votre message/i }), '  Comment faire un retour ?  ');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(screen.getByText('Comment faire un retour ?')).toBeVisible();
    expect(await screen.findByText('Nos retours sont possibles sous 14 jours.')).toBeVisible();
    expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'Comment faire un retour ?', locale: 'fr' }),
    }));
  });

  it('offers a retry after a network error', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ reply: 'Je suis de nouveau disponible.' }), { status: 200 }));
    render(<ChatbotBubble />);
    await user.click(screen.getByRole('button', { name: /ouvrir l.assistant/i }));
    await user.type(screen.getByRole('textbox', { name: /votre message/i }), 'Bonjour');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    const retry = await screen.findByRole('button', { name: /réessayer/i });
    await user.click(retry);
    expect(await screen.findByText('Je suis de nouveau disponible.')).toBeVisible();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
