// Deterministic rule-based replies. Used as a graceful fallback when the Claude
// API is unavailable (no key, error, or refusal). Kept intentionally simple —
// the real conversational intelligence lives in the Claude agent.

export type Locale = 'fr' | 'en';

export interface RuleOrderContext {
  number: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
}

export interface RuleContext {
  locale: Locale;
  name: string;
  order?: RuleOrderContext | null;
  message: string;
}

const FRENCH_MARKERS =
  /\b(bonjour|salut|merci|commande|livraison|suivi|retour|rembours|taille|coucou|s'il|svp|vous|où|ça|oui|non)\b|[àâçéèêëîïôûù]/i;

/** Lightweight FR/EN detection for the fallback engine (Claude handles the rest). */
export function detectLocale(message: string): Locale {
  return FRENCH_MARKERS.test(message.toLowerCase()) ? 'fr' : 'en';
}

/** Bilingual prompt used when a voice note cannot be understood or transcribed. */
export function voiceUnclearMessage(): string {
  return (
    "🎙️ Je n'ai pas réussi à comprendre votre note vocale (bruit ou son peu clair). " +
    "Pourriez-vous réécrire votre message ou renvoyer une note vocale plus claire ?\n\n" +
    "🎙️ I couldn't understand your voice note (noise or unclear audio). " +
    'Could you write your message or send a clearer voice note?'
  );
}

export function ruleBasedReply(ctx: RuleContext): string {
  const { locale, name, order, message } = ctx;
  const fr = locale === 'fr';
  const msg = message.toLowerCase();

  const wantsTracking =
    /suivi|tracking|où est|ou est|livraison|shipping|status|statut|colis|expédi/.test(msg);
  const wantsReturn = /retour|refund|rembours|annul|return|cancel/.test(msg);
  const wantsSize = /taille|size|fit|coupe/.test(msg);
  const wantsPayment = /paiement|payment|payer|carte|paypal|orange money|wave/.test(msg);

  if (wantsTracking) {
    if (order) {
      if (order.status === 'shipped') {
        return fr
          ? `Bonjour ${name}, votre commande ${order.number} a été expédiée. Vous pouvez la suivre via ${order.carrier || 'Colissimo'} avec le numéro de suivi : ${order.trackingNumber || 'en attente'}.`
          : `Hello ${name}, your order ${order.number} has shipped. Track it via ${order.carrier || 'Colissimo'} with tracking number: ${order.trackingNumber || 'pending'}.`;
      }
      if (order.status === 'delivered') {
        return fr
          ? `Bonjour ${name}, votre commande ${order.number} est indiquée comme livrée. Dites-nous si vous ne l'avez pas reçue.`
          : `Hello ${name}, your order ${order.number} is marked as delivered. Let us know if you haven't received it.`;
      }
      if (order.status === 'preparing' || order.status === 'paid') {
        return fr
          ? `Bonjour ${name}, votre commande ${order.number} est en cours de préparation dans nos ateliers. Elle sera expédiée très bientôt.`
          : `Hello ${name}, your order ${order.number} is being prepared and will ship very soon.`;
      }
      return fr
        ? `Bonjour ${name}, votre commande ${order.number} est en cours de traitement (statut : ${order.status}).`
        : `Hello ${name}, your order ${order.number} is currently being processed (status: ${order.status}).`;
    }
    return fr
      ? `Bonjour ${name}, je n'ai pas trouvé de commande récente associée à votre numéro. Pouvez-vous me communiquer votre e-mail ou numéro de commande ?`
      : `Hello ${name}, I couldn't find a recent order for your number. Could you share your email or order number?`;
  }

  if (wantsReturn) {
    return fr
      ? `Bonjour ${name}, pour un retour ou un remboursement, vous pouvez en faire la demande sur notre site ou me donner les détails ici. Notre politique autorise les retours sous 14 jours.`
      : `Hello ${name}, for a return or refund you can request it on our site or give me the details here. Our policy allows returns within 14 days.`;
  }

  if (wantsSize) {
    return fr
      ? `Bonjour ${name}, nos pièces taillent normalement (coupe premium droite). Le guide des tailles est disponible sur chaque fiche produit.`
      : `Hello ${name}, our pieces fit true to size (premium straight cut). A size guide is available on each product page.`;
  }

  if (wantsPayment) {
    return fr
      ? `Bonjour ${name}, nous proposons les cartes bancaires et PayPal en Europe, ainsi qu’Orange Money et Wave pour l’Afrique lorsque ces services sont activés.`
      : `Hello ${name}, we support bank cards and PayPal in Europe, plus Orange Money and Wave for Africa when those services are enabled.`;
  }

  return fr
    ? `Bonjour ${name}, je suis limité sur cette question. Contactez-nous sur WhatsApp au +33 7 53 74 10 30 afin qu’un conseiller vous réponde.`
    : `Hello ${name}, I am limited on this question. Contact us on WhatsApp at +33 7 53 74 10 30 so an advisor can help you.`;
}
