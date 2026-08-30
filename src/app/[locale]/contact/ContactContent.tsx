'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Clock, Mail, MessageCircle, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { CONTACT, PAYMENT_METHODS, whatsappLink } from '@/lib/contactInfo';
import type { PublicStoreSettings } from '@/server/settings/store-settings';

export function ContactContent({ settings }: { settings: PublicStoreSettings }) {
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const fr = locale === 'fr';
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;

  return (
    <Container className="max-w-5xl py-12 sm:py-16">
      <div className="max-w-2xl">
        <Heading level={1}>{fr ? 'Nous contacter' : 'Contact us'}</Heading>
        <p className="mt-3 text-[15px] leading-7 text-mist-600">
          {fr ? `Une question sur ${settings.shop_name} ? Notre équipe vous répond rapidement.` : `A question about ${settings.shop_name}? Our team replies quickly.`}
        </p>
      </div>

      <a href={whatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="group mt-10 flex flex-col gap-5 rounded-3xl border border-[#25D366]/30 bg-[#25D366]/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#25D366] text-white"><MessageCircle className="size-6" /></span><div><h2 className="text-lg font-bold">{fr ? 'WhatsApp — le plus rapide' : 'WhatsApp — the fastest way'}</h2><p className="mt-1 text-sm text-mist-600">{fr ? 'Suivi de commande, tailles et disponibilités.' : 'Order tracking, sizing and availability.'}</p><p className="mt-2 font-semibold">{CONTACT.whatsappDisplay}</p></div></div>
        <span className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white">{fr ? 'Ouvrir la conversation' : 'Open the chat'}</span>
      </a>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-4 rounded-2xl border border-mist-100 bg-paper p-6">
          <Mail className="size-5" />
          <div><h3 className="font-bold">{fr ? 'Coordonnées' : 'Contact details'}</h3><p className="mt-1 text-sm text-mist-600">{fr ? 'Réponse sous 24 h ouvrées.' : 'Reply within 24 business hours.'}</p><a href={`mailto:${settings.email}`} className="mt-2 block text-sm font-semibold">{settings.email}</a><a href={phoneHref} className="mt-1 block text-sm font-semibold">{settings.phone}</a></div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-mist-100 bg-paper p-6"><Clock className="size-5" /><div><h3 className="font-bold">{fr ? 'Horaires' : 'Hours'}</h3><p className="mt-1 text-sm text-mist-600">{fr ? 'Du lundi au samedi' : 'Monday to Saturday'}</p><p className="mt-2 text-sm font-semibold">9 h – 19 h ({settings.timezone})</p></div></div>
      </div>

      <div className="mt-10 grid gap-4 rounded-2xl border border-mist-100 bg-white p-6 sm:grid-cols-3">
        {[
          { icon: Truck, title: fr ? 'Livraison soignée' : 'Careful delivery', desc: fr ? 'Expédition suivie' : 'Tracked shipping' },
          { icon: RotateCcw, title: fr ? `Retours ${settings.return_period_days} jours` : `${settings.return_period_days}-day returns`, desc: fr ? 'Simples et rapides' : 'Simple and fast' },
          { icon: ShieldCheck, title: fr ? 'Paiement sécurisé' : 'Secure payment', desc: fr ? 'Transactions chiffrées' : 'Encrypted transactions' },
        ].map(({ icon: Icon, title, desc }) => <div key={title} className="flex items-center gap-3"><Icon className="size-5" /><div><p className="text-sm font-bold">{title}</p><p className="text-xs text-mist-500">{desc}</p></div></div>)}
      </div>

      <section className="mt-10"><h3 className="text-xs font-bold uppercase tracking-[0.22em] text-mist-500">{fr ? 'Moyens de paiement acceptés' : 'Accepted payment methods'}</h3><div className="mt-4 flex flex-wrap items-center gap-4">{PAYMENT_METHODS.map((method) => <div key={method.src} className="flex h-14 w-24 items-center justify-center rounded-xl border border-mist-200 bg-white p-2.5"><Image src={method.src} alt={method.label} width={method.width} height={method.height} className="max-h-full max-w-full object-contain" /></div>)}</div></section>
    </Container>
  );
}
