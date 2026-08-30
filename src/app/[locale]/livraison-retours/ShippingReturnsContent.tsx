import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export function ShippingReturnsContent({ locale, thresholdMinor, returnPeriodDays }: { locale: string; thresholdMinor: number; returnPeriodDays: number }) {
  const fr = locale !== 'en';
  const threshold = new Intl.NumberFormat(fr ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(thresholdMinor / 100);
  const sections = fr ? [
    { title: 'Livraison', body: `La livraison standard coûte 9,90 €. Elle est offerte dès ${threshold} d’achats.` },
    { title: 'Retours', body: `Vous disposez de ${returnPeriodDays} jours après réception pour demander un retour.` },
    { title: 'Échanges', body: 'Contactez notre équipe avant tout renvoi afin de recevoir les instructions adaptées.' },
  ] : [
    { title: 'Shipping', body: `Standard shipping costs €9.90. It is free from ${threshold}.` },
    { title: 'Returns', body: `You have ${returnPeriodDays} days after delivery to request a return.` },
    { title: 'Exchanges', body: 'Contact our team before returning an item to receive the appropriate instructions.' },
  ];

  return <Container className="max-w-2xl py-12"><Heading level={1}>{fr ? 'Livraison et retours' : 'Shipping and returns'}</Heading><div className="mt-8 space-y-8">{sections.map((section) => <section key={section.title}><Heading level={2} className="text-xl">{section.title}</Heading><p className="mt-2 text-sm text-mist-700">{section.body}</p></section>)}</div></Container>;
}
