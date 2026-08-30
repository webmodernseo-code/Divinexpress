'use client';

import { Link } from '@/i18n/navigation';

const ALLOWED_SEGMENTS = [
  '/connexion', '/dashboard', '/produits', '/commandes', '/retours', '/messages', '/clients', '/parametres',
  '/mentions-legales', '/cgv', '/confidentialite', '/contact',
];

export function isPublicPathAllowedWhileClosed(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(fr|en)(?=\/|$)/, '') || '/';
  return ALLOWED_SEGMENTS.some((segment) => withoutLocale === segment || withoutLocale.startsWith(`${segment}/`));
}

export function StoreClosed({ locale, shopName }: { locale: 'fr' | 'en'; shopName: string }) {
  const fr = locale === 'fr';
  return <main className="grid min-h-dvh place-items-center bg-stone-50 px-6 py-16"><section className="max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600">{shopName}</p><h1 className="mt-4 font-serif text-3xl font-bold text-slate-900">{fr ? 'Boutique momentanément fermée' : 'Store temporarily closed'}</h1><p className="mt-4 text-sm leading-6 text-slate-600">{fr ? 'Nous préparons actuellement la boutique. Revenez bientôt ou contactez-nous si vous avez une question.' : 'We are currently preparing the store. Please come back soon or contact us if you have a question.'}</p><Link href="/contact" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-black px-6 text-sm font-bold text-white">{fr ? 'Nous contacter' : 'Contact us'}</Link></section></main>;
}
