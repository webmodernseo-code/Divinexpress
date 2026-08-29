'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, X } from 'lucide-react';
import { useLocale } from 'next-intl';

type ChatMessage = {
  id: number;
  role: 'customer' | 'assistant';
  text: string;
};

const copy = {
  fr: {
    open: "Ouvrir l’assistant DivinExpress",
    close: "Fermer l’assistant",
    title: 'Assistant DivinExpress',
    online: 'Disponible maintenant',
    welcome: 'Bonjour ! Je suis l’assistant DivinExpress. Comment puis-je vous aider ?',
    placeholder: 'Écrivez votre message…',
    input: 'Votre message',
    send: 'Envoyer',
    sending: 'Réponse en cours…',
    error: 'Une erreur est survenue. Vérifiez votre connexion puis réessayez.',
    retry: 'Réessayer',
    whatsapp: 'Contacter un conseiller sur WhatsApp',
    quickQuestions: ['Suivre ma commande', 'Faire un retour', 'Choisir ma taille', 'Quels moyens de paiement ?'],
  },
  en: {
    open: 'Open the DivinExpress assistant',
    close: 'Close the assistant',
    title: 'DivinExpress assistant',
    online: 'Available now',
    welcome: 'Hello! I am the DivinExpress assistant. How can I help you?',
    placeholder: 'Write your message…',
    input: 'Your message',
    send: 'Send',
    sending: 'Replying…',
    error: 'Something went wrong. Check your connection and try again.',
    retry: 'Try again',
    whatsapp: 'Contact an advisor on WhatsApp',
    quickQuestions: ['Track my order', 'Make a return', 'Choose my size', 'Which payment methods?'],
  },
} as const;

export function ChatbotBubble() {
  const locale = useLocale().toLowerCase().startsWith('en') ? 'en' : 'fr';
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'assistant', text: t.welcome },
  ]);
  const [pending, setPending] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      trigger?.focus();
    };
  }, [open]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    if (typeof transcript.scrollTo === 'function') {
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
    } else {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }, [messages, pending]);

  async function requestReply(message: string) {
    setPending(true);
    setFailedMessage(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, locale }),
      });
      if (!response.ok) throw new Error('chat request failed');
      const payload = await response.json() as { reply?: unknown };
      if (typeof payload.reply !== 'string' || !payload.reply.trim()) throw new Error('invalid chat reply');
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', text: payload.reply as string },
      ]);
    } catch {
      setFailedMessage(message);
    } finally {
      setPending(false);
    }
  }

  function sendMessage(message: string) {
    const normalized = message.trim();
    if (!normalized || pending) return;
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: 'customer', text: normalized },
    ]);
    setInput('');
    void requestReply(normalized);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t.open}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 grid size-14 place-items-center rounded-full bg-ink text-paper shadow-lg shadow-black/25 ring-1 ring-white/10 transition hover:scale-105 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:right-6"
      >
        <Bot className="size-7" aria-hidden="true" />
        <span className="absolute right-1 top-1 size-3.5 rounded-full bg-emerald-400 ring-2 ring-ink" aria-hidden="true" />
      </button>

      {open && (
        <div className="pointer-events-auto fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label={locale === 'fr' ? "Fermer l’assistant en cliquant sur l’arrière-plan" : 'Close the assistant from the backdrop'}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
            onClick={(event) => event.stopPropagation()}
            className="absolute bottom-4 right-3 flex h-[min(620px,calc(100dvh-2rem))] w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-black/10 bg-white text-neutral-950 shadow-2xl sm:bottom-6 sm:right-6"
          >
            <header className="flex items-center justify-between bg-neutral-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 place-items-center rounded-full bg-white/10">
                  <Bot className="size-5" aria-hidden="true" />
                  <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-neutral-950" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="chatbot-title" className="font-semibold">{t.title}</h2>
                  <p className="text-xs text-emerald-300">{t.online}</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="grid size-10 place-items-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            <div ref={transcriptRef} aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-4 py-5">
              {messages.map((message) => (
                <p key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'customer' ? 'ml-auto rounded-br-md bg-neutral-950 text-white' : 'rounded-bl-md border border-neutral-200 bg-white'}`}>
                  {message.text}
                </p>
              ))}
              {pending && <p className="w-fit rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">{t.sending}</p>}
              {failedMessage && (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p>{t.error}</p>
                  <button type="button" onClick={() => void requestReply(failedMessage)} className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                    <RotateCcw className="size-4" aria-hidden="true" /> {t.retry}
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1" aria-label={locale === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}>
                {t.quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={pending}
                    onClick={() => sendMessage(question)}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 transition hover:border-neutral-950 disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <a
                href="https://wa.me/33753741030"
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4"
              >
                {t.whatsapp}
              </a>
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3">
              <label htmlFor="chatbot-message" className="sr-only">{t.input}</label>
              <input id="chatbot-message" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} disabled={pending} placeholder={t.placeholder} className="h-12 min-w-0 flex-1 rounded-full border border-neutral-300 px-4 text-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10" />
              <button type="submit" disabled={pending || !input.trim()} aria-label={t.send} className="grid size-12 shrink-0 place-items-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2">
                <Send className="size-5" aria-hidden="true" />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
