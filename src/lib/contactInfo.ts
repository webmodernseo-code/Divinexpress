// Central contact configuration, shared by the contact page and the floating
// WhatsApp bubble. Keep the number in sync with the dashboard Settings default.

export const CONTACT = {
  whatsappDisplay: '+33 7 53 74 10 30',
  whatsappDigits: '33753741030',
  email: 'contact@reign.webmodernseo.co',
} as const;

const DEFAULT_WA_MESSAGE: Record<'fr' | 'en', string> = {
  fr: 'Bonjour Reign, j’aimerais avoir des informations.',
  en: 'Hello Reign, I would like some information.',
};

/** Builds a wa.me deep link that opens a WhatsApp conversation with a prefilled message. */
export function whatsappLink(locale: 'fr' | 'en' = 'fr', message?: string): string {
  const text = message ?? DEFAULT_WA_MESSAGE[locale] ?? DEFAULT_WA_MESSAGE.fr;
  return `https://wa.me/${CONTACT.whatsappDigits}?text=${encodeURIComponent(text)}`;
}

export interface PaymentMethod {
  src: string;
  label: string;
  width: number;
  height: number;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { src: '/payment/visa-mastercard.png', label: 'Visa / Mastercard', width: 1231, height: 496 },
  { src: '/payment/paypal.png', label: 'PayPal', width: 600, height: 400 },
  { src: '/payment/orange-money.png', label: 'Orange Money', width: 3840, height: 1025 },
  { src: '/payment/wave.png', label: 'Wave', width: 701, height: 437 },
];
