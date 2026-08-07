'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Mail, Clock, ShieldCheck, RotateCcw, Truck, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { CONTACT, PAYMENT_METHODS, whatsappLink } from '@/lib/contactInfo';

export default function ContactPage() {
  const locale = (useLocale() as 'fr' | 'en') ?? 'fr';
  const fr = locale === 'fr';

  return (
    <Container className="max-w-5xl py-12 sm:py-16">
      {/* Hero */}
      <div className="max-w-2xl">
        <Heading level={1}>{fr ? 'Nous contacter' : 'Contact us'}</Heading>
        <p className="mt-3 text-[15px] leading-7 text-mist-600">
          {fr
            ? "Une question sur une commande, une taille ou un produit ? Notre équipe et notre assistant vous répondent rapidement, en français comme en anglais."
            : 'A question about an order, a size or a product? Our team and our assistant reply quickly, in French and English.'}
        </p>
      </div>

      {/* Primary WhatsApp card */}
      <a
        href={whatsappLink(locale)}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-10 flex flex-col gap-5 rounded-3xl border border-[#25D366]/30 bg-[#25D366]/5 p-6 transition-colors hover:bg-[#25D366]/10 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white">
            <MessageCircle className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">{fr ? 'WhatsApp — le plus rapide' : 'WhatsApp — the fastest way'}</h2>
            <p className="mt-1 text-sm text-mist-600">
              {fr
                ? 'Discutez avec nous : suivi de commande, conseils tailles, disponibilités.'
                : 'Chat with us: order tracking, size advice, availability.'}
            </p>
            <p className="mt-2 font-semibold tracking-wide text-ink">{CONTACT.whatsappDisplay}</p>
          </div>
        </div>
        <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-transform group-hover:scale-[1.02]">
          <MessageCircle className="size-4" />
          {fr ? 'Ouvrir la conversation' : 'Open the chat'}
        </span>
      </a>

      {/* Secondary channels */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${CONTACT.email}`}
          className="flex items-start gap-4 rounded-2xl border border-mist-100 bg-paper p-6 transition-colors hover:border-ink/30"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-mist-200 text-ink">
            <Mail className="size-5" />
          </span>
          <div>
            <h3 className="font-bold text-ink">{fr ? 'E-mail' : 'Email'}</h3>
            <p className="mt-1 text-sm text-mist-600">{fr ? 'Réponse sous 24 h ouvrées.' : 'Reply within 24 business hours.'}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{CONTACT.email}</p>
          </div>
        </a>

        <div className="flex items-start gap-4 rounded-2xl border border-mist-100 bg-paper p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-mist-200 text-ink">
            <Clock className="size-5" />
          </span>
          <div>
            <h3 className="font-bold text-ink">{fr ? 'Horaires' : 'Hours'}</h3>
            <p className="mt-1 text-sm text-mist-600">{fr ? 'Du lundi au samedi' : 'Monday to Saturday'}</p>
            <p className="mt-2 text-sm font-semibold text-ink">9 h – 19 h (CET)</p>
          </div>
        </div>
      </div>

      {/* Reassurance strip */}
      <div className="mt-10 grid gap-4 rounded-2xl border border-mist-100 bg-white p-6 sm:grid-cols-3">
        {[
          { icon: Truck, title: fr ? 'Livraison soignée' : 'Careful delivery', desc: fr ? 'Expédition suivie' : 'Tracked shipping' },
          { icon: RotateCcw, title: fr ? 'Retours 14 jours' : '14-day returns', desc: fr ? 'Simples et rapides' : 'Simple and fast' },
          { icon: ShieldCheck, title: fr ? 'Paiement sécurisé' : 'Secure payment', desc: fr ? 'Transactions chiffrées' : 'Encrypted transactions' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="size-5 shrink-0 text-ink" />
            <div>
              <p className="text-sm font-bold text-ink">{title}</p>
              <p className="text-xs text-mist-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <section className="mt-10">
        <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-mist-500">
          {fr ? 'Moyens de paiement acceptés' : 'Accepted payment methods'}
        </h3>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.src}
              className="flex h-14 w-24 items-center justify-center rounded-xl border border-mist-200 bg-white p-2.5 shadow-sm"
              title={method.label}
            >
              <Image
                src={method.src}
                alt={method.label}
                width={method.width}
                height={method.height}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
