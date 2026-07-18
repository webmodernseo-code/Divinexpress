import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

const POLICIES_DATA: Record<
  string,
  {
    titleFr: string;
    titleEn: string;
    bodyFr: string[];
    bodyEn: string[];
  }
> = {
  privacy: {
    titleFr: 'Politique de confidentialité',
    titleEn: 'Privacy Policy',
    bodyFr: [
      'La présente politique de confidentialité explique comment DivinExpress collecte, utilise et protège les données personnelles de ses clients et visiteurs, conformément au Règlement Général sur la Protection des Données (RGPD).',
      "1. Données collectées — Lors d'une commande ou d'une prise de contact, nous collectons votre nom, prénom, adresse postale, adresse e-mail, numéro de téléphone et informations de paiement (traitées par un prestataire sécurisé, jamais stockées sur nos serveurs).",
      '2. Finalité du traitement — Ces données sont utilisées exclusivement pour traiter vos commandes, assurer le service après-vente, vous informer de l'état de votre livraison et, si vous y avez consenti, vous adresser notre newsletter.',
      '3. Conservation — Vos données sont conservées pendant la durée de la relation commerciale, puis archivées pour la durée légale imposée par la réglementation comptable et fiscale (jusqu'à 10 ans pour les données de facturation).',
      '4. Partage des données — DivinExpress ne vend ni ne loue vos données à des tiers. Elles peuvent être transmises à nos prestataires de livraison et de paiement, uniquement dans la mesure nécessaire à l'exécution de votre commande.',
      "5. Vos droits — Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et de portabilité de vos données, ainsi que d'un droit d'opposition. Pour exercer ces droits, contactez-nous à privacy@divinexpress.com.",
      "6. Cookies — Notre site utilise des cookies strictement nécessaires à son fonctionnement ainsi que des cookies de mesure d'audience, que vous pouvez paramétrer à tout moment depuis les préférences de votre navigateur."
    ],
    bodyEn: [
      'This privacy policy explains how DivinExpress collects, uses, and protects personal data from its clients and visitors, in compliance with the General Data Protection Regulation (GDPR).',
      '1. Collected Data — When you place an order or contact us, we collect your first name, last name, mailing address, email address, phone number, and payment information (processed by a secure provider, never stored on our servers).',
      '2. Purpose of Processing — This data is used exclusively to process your orders, provide customer support, inform you about delivery status, and, if you consented, send you our newsletter.',
      '3. Retention — Your data is stored for the duration of the commercial relationship, then archived for the legal period required by tax and accounting regulations (up to 10 years for invoicing data).',
      '4. Data Sharing — DivinExpress does not sell or rent your data to third parties. It may be transmitted to our delivery and payment providers, solely as needed to fulfill your order.',
      '5. Your Rights — In compliance with GDPR, you have the right to access, rectify, delete, restrict, and port your data, as well as the right to object. To exercise these rights, contact us at privacy@divinexpress.com.',
      '6. Cookies — Our site uses cookies strictly necessary for its operation as well as analytics cookies, which you can configure at any time in your browser settings.'
    ]
  },
  refund: {
    titleFr: 'Politique de remboursement',
    titleEn: 'Refund Policy',
    bodyFr: [
      'Chez DivinExpress, votre satisfaction est notre priorité. Cette politique détaille les conditions dans lesquelles un article peut être retourné et remboursé.',
      "1. Délai de rétractation — Vous disposez d'un délai de 14 jours calendaires à compter de la réception de votre commande pour nous notifier votre souhait de retourner un ou plusieurs articles, sans avoir à justifier de motif.",
      "2. Conditions de retour — L'article doit être retourné non porté, non lavé, avec toutes ses étiquettes d'origine et dans son emballage d'origine. Tout article endommagé ou personnalisé ne pourra être ni repris ni remboursé.",
      '3. Procédure — Contactez notre service client via la page Contact en indiquant votre numéro de commande. Une étiquette de retour prépayée vous sera transmise si l'article est éligible.',
      '4. Délai de remboursement — Le remboursement est effectué sur le moyen de paiement initial sous 5 à 10 jours ouvrés à compter de la réception et de la vérification de l'article retourné par notre entrepôt.',
      "5. Frais de retour — Les frais de retour restent à la charge du client, sauf en cas d'erreur de notre part (article défectueux ou non conforme à la commande), auquel cas ils sont intégralement pris en charge."
    ],
    bodyEn: [
      'At DivinExpress, your satisfaction is our priority. This policy details the conditions under which an item can be returned and refunded.',
      '1. Right of Withdrawal — You have 14 calendar days from receipt of your order to notify us of your wish to return one or more items, without having to provide any reason.',
      '2. Return Conditions — The item must be returned unworn, unwashed, with all original tags attached and in its original packaging. Any damaged or customized item cannot be returned or refunded.',
      '3. Procedure — Contact our customer support team via the Contact page with your order number. A prepaid return shipping label will be provided if the item is eligible.',
      '4. Refund Timing — The refund is processed to the original payment method within 5 to 10 business days from the receipt and verification of the returned item at our warehouse.',
      '5. Return Fees — Return shipping fees are the responsibility of the customer, except in cases of our error (defective item or incorrect item sent), where they are fully covered.'
    ]
  },
  terms: {
    titleFr: "Conditions d'utilisation",
    titleEn: 'Terms of Use',
    bodyFr: [
      'Bienvenue sur DivinExpress. En naviguant sur ce site web, vous acceptez de respecter et d'être lié par les présentes conditions d'utilisation.',
      "1. Utilisation du site — Ce site est destiné à un usage personnel et non commercial. Vous acceptez de ne pas perturber, pirater ou compromettre la sécurité du site.",
      "2. Propriété intellectuelle — Tous les textes, images, logos, designs et marques présents sur ce site sont la propriété exclusive de DivinExpress ou de leurs auteurs respectifs. Toute reproduction est interdite sans accord écrit.",
      "3. Limitation de responsabilité — DivinExpress s'efforce de maintenir les informations à jour, mais ne peut garantir l'exactitude absolue des descriptions de produits ou des stocks."
    ],
    bodyEn: [
      'Welcome to DivinExpress. By browsing this website, you agree to comply with and be bound by these terms of use.',
      '1. Website Use — This site is intended for personal, non-commercial use. You agree not to disrupt, hack, or compromise the security of the website.',
      '2. Intellectual Property — All text, images, logos, designs, and trademarks on this site are the exclusive property of DivinExpress or their respective owners. Any reproduction is prohibited without written consent.',
      '3. Limitation of Liability — DivinExpress strives to keep all information up to date, but cannot guarantee the absolute accuracy of product descriptions or inventory levels.'
    ]
  },
  shipping: {
    titleFr: "Politique d'expédition",
    titleEn: 'Shipping Policy',
    bodyFr: [
      'Nous livrons nos articles dans le monde entier avec des partenaires d'expédition de confiance pour assurer un service rapide et sécurisé.',
      "1. Délais de traitement — Toutes les commandes d'articles en stock sont préparées et expédiées sous 1 à 2 jours ouvrés.",
      '2. Délais de livraison — Pour la France et l'Europe, comptez 3 à 5 jours ouvrés. Pour le reste du monde, les délais varient entre 5 et 10 jours ouvrés selon la destination.',
      "3. Suivi de commande — Un e-mail contenant un lien de suivi en temps réel vous est envoyé automatiquement dès que votre colis quitte notre entrepôt.",
      "4. Frais de port — Les frais de livraison sont calculés lors du passage à la caisse en fonction du pays de destination et du poids total."
    ],
    bodyEn: [
      'We ship our items worldwide with trusted delivery partners to ensure a fast and secure service.',
      '1. Processing Times — All orders for in-stock items are prepared and dispatched within 1 to 2 business days.',
      '2. Delivery Times — For France and Europe, count 3 to 5 business days. For the rest of the world, times vary between 5 and 10 business days depending on the destination.',
      '3. Order Tracking — An email containing a real-time tracking link is automatically sent to you as soon as your package leaves our warehouse.',
      '4. Shipping Fees — Shipping fees are calculated at checkout based on the destination country and total weight.'
    ]
  },
  cgv: {
    titleFr: 'Conditions générales de vente',
    titleEn: 'Terms & Conditions of Sale',
    bodyFr: [
      "Les présentes conditions générales de vente (CGV) régissent l'ensemble des ventes conclues sur le site divinexpress.com entre DivinExpress et ses clients.",
      "1. Prix — Les prix des produits sont indiqués en euros, toutes taxes comprises (TTC). Ils peuvent être affichés dans d'autres devises à titre indicatif, la devise de référence pour la facturation restant l'euro sauf mention contraire.",
      "2. Commande — Toute commande passée sur le site vaut acceptation des présentes CGV. Un e-mail de confirmation récapitulant les articles, prix et modalités de livraison est envoyé après validation du paiement.",
      "3. Paiement — Le règlement est exigible immédiatement à la commande, par carte bancaire ou tout autre moyen proposé sur le site. La commande n'est considérée comme ferme qu'après confirmation du paiement par notre prestataire.",
      "4. Disponibilité — Nos offres de produits et prix sont valables tant qu'ils sont visibles sur le site, dans la limite des stocks disponibles. En cas d'indisponibilité après commande, vous serez informé et intégralement remboursé.",
      "5. Garanties — Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés, conformément aux articles L217-4 et suivants du Code de la consommation.",
      "6. Litiges — En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. Le tribunal compétent est celui du siège social de DivinExpress."
    ],
    bodyEn: [
      'These general terms and conditions of sale (GTC) govern all sales concluded on the divinexpress.com website between DivinExpress and its customers.',
      '1. Price — Product prices are indicated in euros, all taxes included (TTC). They may be displayed in other currencies for reference only, the invoicing currency remaining the euro unless stated otherwise.',
      '2. Order — Any order placed on the site implies acceptance of these GTC. A confirmation email summarizing the items, price, and delivery details is sent after payment validation.',
      '3. Payment — Payment is due immediately upon order placement, by credit card or any other method offered on the site. The order is only considered firm once payment confirmation is received from our provider.',
      '4. Availability — Our product offers and prices are valid as long as they are visible on the site, within stock limits. In case of unavailability after ordering, you will be notified and fully refunded.',
      '5. Warranties — All our products benefit from the legal warranty of conformity and the warranty against hidden defects, in accordance with applicable consumer laws.',
      '6. Disputes — In case of a dispute, an amicable solution will be sought before any legal action. The competent court is that of the registered head office of DivinExpress.'
    ]
  },
  legal: {
    titleFr: 'Mentions légales',
    titleEn: 'Legal Notice',
    bodyFr: [
      "Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site divinexpress.com l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.",
      "Éditeur du site — DivinExpress, Société par Actions Simplifiée (SAS) au capital de 10 000 €, immatriculée au Registre du Commerce et des Sociétés de Lyon.",
      "Siège social — 349 Avenue Jean Jaurès, 69007 Lyon, France.",
      'Directeur de la publication — La direction de DivinExpress.',
      'Contact — contact@divinexpress.com — +33 4 72 00 56 78.',
      "Hébergement — Le site est hébergé par un prestataire tiers conforme aux exigences du RGPD, garantissant la sécurité et la confidentialité des données hébergées.",
      "Propriété intellectuelle — L'ensemble du contenu du site (marques, logos, textes, visuels) est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de DivinExpress."
    ],
    bodyEn: [
      'In compliance with legal provisions, this notice specifies the identity of the stakeholders involved in the creation and monitoring of the divinexpress.com website.',
      'Publisher — DivinExpress, a Simplified Joint-Stock Company (SAS) with a capital of €10,000, registered with the Lyon Trade and Companies Register.',
      'Head Office — 349 Avenue Jean Jaurès, 69007 Lyon, France.',
      'Director of Publication — The management of DivinExpress.',
      'Contact — contact@divinexpress.com — +33 4 72 00 56 78.',
      'Hosting — The site is hosted by a compliant third-party provider, ensuring security and confidentiality of hosted data.',
      'Intellectual Property — All website contents (trademarks, logos, text, visuals) are protected by intellectual property laws and remain the exclusive property of DivinExpress.'
    ]
  }
};

export default async function PolicyPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;

  const policy = POLICIES_DATA[params.slug];
  if (!policy) notFound();

  const title = locale === 'fr' ? policy.titleFr : policy.titleEn;
  const body = locale === 'fr' ? policy.bodyFr : policy.bodyEn;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.content}>
        {body.map((p, idx) => (
          <p key={idx} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </div>
    </main>
  );
}
