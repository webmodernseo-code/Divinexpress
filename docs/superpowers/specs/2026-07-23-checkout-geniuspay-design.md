# DivinExpress — Checkout & Paiement GeniusPay — Design Spec

## Contexte

Le site n'a aujourd'hui **aucun flux de commande réel** : le bouton "Commander" du tiroir panier (`CartDrawer.tsx`) vide simplement le panier côté client et affiche un toast de succès — rien n'est jamais écrit en base. La table `Order` est vide et le restera tant qu'aucun vrai checkout n'existe.

Ce chantier construit ce checkout réel : panier → formulaire de commande → paiement via [GeniusPay](https://geniuspay.ci/docs/api) (agrégateur ouest-africain : carte bancaire + mobile money Wave/Orange/MTN/Moov) → création effective de `Order`/`OrderItem`/`Payment` en base, décrémentation du stock, et confirmation.

C'est un prérequis direct au futur sous-projet **Commandes** du dashboard admin (actuellement un stub "Bientôt disponible") : sans commandes réelles, une UI de gestion des commandes n'aurait rien à gérer. Ce spec ne couvre pas cette UI admin — seulement la création du côté vitrine publique — plus une petite page admin dédiée aux frais de livraison (voir §5), qui ne dépend de rien d'autre.

Le modèle Prisma `Order`/`OrderItem`/`Payment`/`ShippingZone` existe déjà dans le schéma (voir `prisma/schema.prisma:63-122`) mais n'est utilisé nulle part — aucune migration de schéma n'est nécessaire pour ce chantier.

## Buts

1. Remplacer le faux bouton "Commander" par un vrai parcours : page `/[locale]/checkout` (email, adresse, pays) → création de la commande → redirection vers la page de paiement hébergée GeniusPay → confirmation.
2. Intégrer GeniusPay en mode "Checkout" (le client choisit lui-même son moyen de paiement sur leur page hébergée) et traiter la confirmation asynchrone via webhook.
3. Calculer les frais de livraison selon la zone du pays du client (Europe / Afrique), avec un coût par zone modifiable par l'admin.
4. Décrémenter le stock des variantes commandées à la création de la commande.

## Hors périmètre

* Comptes clients (checkout invité uniquement — cohérent avec `Order.customerEmail: String`, aucun modèle `Customer`).
* Remboursements (le statut `REFUNDED` existe dans les enums mais aucun flux de remboursement n'est construit ici).
* Libération automatique du stock sur paiement échoué/expiré/abandonné (voir §4, limite assumée).
* Emails de confirmation de commande (aucun service d'envoi d'email n'existe dans le projet — ajouter un fournisseur email est un chantier à part).
* Gestion admin des commandes (liste, détail, changement de statut manuel) — sous-projet suivant, une fois ce chantier-ci en place.
* Gestion par l'admin de la liste des pays par zone de livraison — seul le **coût** par zone est éditable dans cette version ; l'association pays → zone est codée en dur (voir §5).
* Mode "paiement direct" GeniusPay (carte ou mobile money choisi à l'avance côté formulaire) — on utilise uniquement le mode "Checkout" (le plus simple, recommandé par leur doc).

## Spécifications Techniques

### 1. Petit correctif préalable : `CartItem.productId` est en réalité un `variantId`

`components/ProductDetail/ProductDetailClient.tsx:94` passe `activeVariant.id` (l'id de la **variante**) dans le champ nommé `productId` de `CartItem`. Ce nom trompeur est sans conséquence pour le panier/tiroir actuels (il ne sert qu'à identifier une ligne), mais deviendrait dangereux ici : la création de `OrderItem.variantId` a besoin de la vraie valeur, et un nom qui ment sur son contenu est un piège pour la suite.

Renommage mécanique, aucun changement de comportement :
* `components/Cart/CartContext.tsx` — `CartItem.productId` → `CartItem.variantId` ; signatures de `removeFromCart`/`updateQuantity` mises à jour en conséquence.
* `components/Cart/CartDrawer.tsx` — usages de `item.productId` → `item.variantId`.
* `components/ProductDetail/ProductDetailClient.tsx` — `addToCart({ productId: activeVariant.id, ... })` → `addToCart({ variantId: activeVariant.id, ... })`.

### 2. Frais de livraison par zone (`ShippingZone`)

Modèle déjà existant, non modifié :
```prisma
model ShippingZone {
  id        String   @id @default(cuid())
  countries String[]
  carrier   String
  etaDays   Int
  costCents Int
}
```

Seed de deux zones (`prisma/seed.ts`), cohérent avec les devises déjà servies par le site (`LocaleCurrencySelector` : EUR/France, GBP/Royaume-Uni, XOF/UEMOA) :

* **Europe** — `countries: ['FR', 'GB']`, `carrier` et `etaDays` au choix de l'implémentation (ex. "Colissimo", 5 jours).
* **Afrique** — `countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']` (les 8 pays UEMOA), `carrier`/`etaDays` équivalents.

`costCents` est en **EUR cents**, comme partout ailleurs dans ce projet (`ProductVariant.priceCents`, etc.) — pas de nouvelle convention de devise introduite.

`lib/shippingZone.ts` (pur, testable) :
```typescript
export function resolveShippingZone(countryCode: string, zones: { countries: string[] }[]): number
// retourne l'index de la zone dont `countries` contient countryCode, -1 si aucune
```
Le checkout utilise ce helper pour retrouver le `costCents` de la zone correspondant au pays choisi par le client.

**Page admin d'édition** — `app/admin/(dashboard)/parametres/livraison/page.tsx` : table à 2 lignes (Europe / Afrique) avec un champ éditable pour `costCents` par ligne (Server Action `updateShippingZoneCost(id, costCents)`), dans le même style que les tables déjà existantes du dashboard (`page.module.css` du module Produits). C'est la seule page réelle sous `/admin/parametres` pour l'instant — le reste de la section reste le stub `ComingSoon` existant ; seul ce sous-chemin devient fonctionnel, à la manière dont `Catégories` avait été extrait de `Produits`.

### 3. Formulaire de checkout (`/[locale]/checkout`)

Page cliente (lit le panier via `useCart()`, qui doit contenir au moins un article — sinon redirection vers la boutique).

Champs du formulaire :
* Email (requis)
* Adresse complète (`shippingAddr`, un seul champ texte multi-lignes — reflète fidèlement le schéma `Order.shippingAddr: String`, pas de décomposition en rue/ville/code postal)
* Pays (menu déroulant limité aux pays des deux zones définies en §2 — la sélection détermine à la fois `Order.country` et les frais de livraison affichés)

Récapitulatif : lignes du panier (nom, taille, couleur, quantité, prix), sous-total, frais de livraison (mis à jour dynamiquement selon le pays choisi), total.

Bouton "Payer" → appelle la Server Action `createOrder` (voir §4) avec le contenu du panier + les champs du formulaire. Pas de `<form action={fn}>` classique ici (le panier vit dans le `CartContext`, pas dans des champs de formulaire natifs) : la Server Action est appelée directement (comme une fonction asynchrone) depuis le gestionnaire de soumission du composant client, un appel RPC standard en Next.js App Router.

`components/Cart/CartDrawer.tsx` : le bouton "Commander" perd son comportement actuel (vider le panier + toast) et devient un simple lien vers `/[locale]/checkout` (fermant le tiroir au passage).

### 4. Création de la commande et appel GeniusPay (`app/[locale]/checkout/actions.ts`)

**`createOrder(input: CheckoutInput): Promise<{ orderNumber: string; checkoutUrl: string } | { error: string }>`**

1. Valide les champs (email, adresse, pays non vides ; pays appartient à une zone connue).
2. Pour chaque ligne du panier, vérifie `ProductVariant.stock >= quantity` (via `variantId`, désormais correctement nommé — voir §1). Si une ligne échoue → retourne `{ error: "..." }` sans rien écrire.
3. Dans une transaction Prisma :
   * Décrémente le stock de chaque variante commandée.
   * Calcule `totalCents = sous-total (Σ quantity × priceCents au moment de la commande) + shippingZone.costCents`.
   * Crée `Order` (statut `PENDING`, `orderNumber` généré via `lib/orderNumber.ts`, `currency: 'EUR'`, `totalCents` en EUR — la devise canonique du catalogue, cohérente avec `ProductVariant.priceCents` partout ailleurs), ses `OrderItem[]` (chaque ligne fige son `unitPriceCents` en EUR — le prix ne bougera plus même si le produit change de prix ensuite), et un `Payment` associé (statut `PENDING`, `provider: 'geniuspay'`, `currency: 'XOF'`, `amountCents` = le montant XOF calculé via `eurCentsToXof` — un calcul local pur, disponible avant même d'appeler GeniusPay). `Payment.reference` (champ requis par le schéma) est initialisé au même texte que `orderNumber` en valeur temporaire — l'appel GeniusPay n'a pas encore eu lieu à ce stade — et sera écrasé par la vraie référence GeniusPay à l'étape 5.
4. Hors transaction (appel réseau externe) : appelle l'API GeniusPay pour initier le paiement avec ce même montant XOF déjà calculé, `metadata: { order_id: order.id }`, `success_url`/`error_url` pointant vers `/[locale]/checkout/confirmation/{orderNumber}` (le statut réel de la commande, pas le paramètre d'URL, fait foi sur cette page — voir plus bas).
5. Si l'appel GeniusPay réussit : remplace la référence temporaire du `Payment` par la vraie `reference` GeniusPay, retourne `checkoutUrl` au client qui redirige le navigateur dessus.
6. Si l'appel GeniusPay échoue : restaure le stock décrémenté, passe `Order` à `CANCELLED` et `Payment` à `FAILED`, retourne une erreur générique invitant à réessayer (une nouvelle commande sera créée si le client retente — pas de reprise de la commande ratée, plus simple à raisonner qu'un flux de reprise).

`lib/geniuspay.ts` (le client API, isolé pour être remplaçable/testable) :
* `eurCentsToXof(amountCents: number): number` — fonction pure, testée unitairement (taux fixe).
* `initiatePayment({ amountXof, description, customer, successUrl, errorUrl, metadata }): Promise<{ reference: string; checkoutUrl: string }>` — appelle `POST https://geniuspay.ci/api/v1/merchant/payments` avec les headers `X-API-Key`/`X-API-Secret` lus depuis `process.env.GENIUSPAY_PUBLIC_KEY`/`GENIUSPAY_SECRET_KEY` (jamais exposés côté client — cet appel n'a lieu que dans la Server Action).

**Limite assumée** : le stock est décrémenté à l'étape 3, avant confirmation réelle du paiement. Si le client abandonne la page GeniusPay ou que le paiement échoue *après* ce point mais que le webhook d'échec n'arrive jamais (cas rare), le stock reste décrémenté à tort. Aucune tâche de nettoyage automatique (les liens de paiement GeniusPay expirent après 24h côté eux, mais rien ne libère le stock chez nous à cette expiration) — l'admin pourra corriger le stock manuellement via `Produits` si besoin. Documenté comme limite connue de cette première version, pas un oubli.

### 5. Confirmation du paiement — webhook (`app/api/checkout/webhook/route.ts`)

Route Handler standard (et non une Server Action : doit être appelable directement en HTTP par GeniusPay, avec ses propres headers de signature).

* Lit les headers `X-Webhook-Signature`, `X-Webhook-Timestamp`, `X-Webhook-Event`.
* Vérifie la signature : `HMAC-SHA256(timestamp + "." + corps_json_brut, GENIUSPAY_WEBHOOK_SECRET)`, comparaison en temps constant. Rejette (401) si invalide.
* Rejette (400) si `|maintenant - timestamp| > 300s` (protection anti-rejeu, recommandation de la doc GeniusPay).
* Retrouve le `Payment` via `metadata.order_id` (ou la `reference` GeniusPay stockée sur le `Payment`).
* Selon l'événement (`X-Webhook-Event` / `data.status`) :
  * `payment.success` → `Payment.status = SUCCEEDED`, `Order.status = PAID`.
  * `payment.failed` / `payment.cancelled` / `payment.expired` → `Payment.status = FAILED`, `Order.status = CANCELLED`.
* Idempotent : si la commande n'est déjà plus `PENDING`, ne réapplique rien (répond simplement 200) — un webhook peut être renvoyé plusieurs fois par GeniusPay en cas de non-réponse.
* Tout événement autre que les quatre listés ci-dessus (`payment.initiated`, `payment.refunded`, `cashout.*`, `webhook.test`, etc.) est ignoré sans erreur — répond 200 sans modifier la commande. Ce n'est pas un oubli : seuls les quatre événements listés ont une action définie dans le périmètre de ce chantier (voir "Hors périmètre" pour les remboursements).

**Enregistrement du webhook** — one-shot après déploiement, via un script `scripts/register-genius-webhook.ts` qui appelle `POST /api/v1/merchant/webhooks` avec `url: "https://divinexpress.fr/api/checkout/webhook"` et les événements `payment.success`, `payment.failed`, `payment.cancelled`, `payment.expired` ; affiche le secret webhook (`whsec_...`) retourné une seule fois, à copier manuellement dans `.env` (`GENIUSPAY_WEBHOOK_SECRET`) — non automatisé plus loin, ce secret n'est récupérable qu'à la création.

### 6. Page de confirmation (`/[locale]/checkout/confirmation/[orderNumber]`)

Server Component : charge la commande par `orderNumber`, affiche son **statut actuel réel** (`PENDING` → "paiement en cours de confirmation", `PAID` → "commande confirmée", `CANCELLED` → "paiement non abouti, réessayez"). Ne fait jamais confiance à un paramètre d'URL pour afficher un succès — uniquement à ce qui est en base, puisque la redirection `success_url` de GeniusPay n'est qu'indicative (voir §4).

### 7. Nouvelles variables d'environnement

Ajoutées commentées à `.env.example`, valeurs réelles dans `.env` (déjà fait pour les clés GeniusPay pendant ce brainstorming) :
```
GENIUSPAY_PUBLIC_KEY=
GENIUSPAY_SECRET_KEY=
GENIUSPAY_WEBHOOK_SECRET=
```

### 8. Tests

Conforme à la convention déjà établie (Vitest, Node, pas de jsdom) — fonctions pures uniquement :
* `lib/geniuspay.test.ts` — `eurCentsToXof` (valeurs connues, arrondi).
* `lib/shippingZone.test.ts` — `resolveShippingZone` (pays trouvé dans la bonne zone, pays inconnu → -1).
* `lib/orderNumber.test.ts` — format généré (regex de forme), unicité raisonnable sur plusieurs appels.
* La vérification de signature webhook (`lib/geniuspayWebhook.ts` ou équivalent) est également une fonction pure testable : signature valide acceptée, signature invalide rejetée, timestamp trop vieux rejeté — testée avec des valeurs HMAC calculées à la main plutôt qu'un vrai appel réseau.
* Le flux complet (checkout → GeniusPay → webhook) n'est pas testable automatiquement (dépend d'un service externe) : vérification manuelle décrite dans le plan, contre le mode sandbox GeniusPay une fois déployé sur `divinexpress.fr`.

## Critères d'acceptation

1. Ajouter des articles au panier puis cliquer "Commander" mène à `/[locale]/checkout` avec le récapitulatif du panier.
2. Choisir un pays met à jour les frais de livraison affichés selon la bonne zone (Europe ou Afrique).
3. Soumettre le formulaire avec un stock suffisant crée réellement `Order`/`OrderItem[]`/`Payment` en base (statut `PENDING`), décrémente le stock des variantes concernées, et redirige vers la page de paiement hébergée par GeniusPay.
4. Soumettre avec une quantité supérieure au stock disponible affiche une erreur et ne modifie rien en base.
5. Un paiement réussi en sandbox GeniusPay déclenche le webhook, qui passe la commande à `PAID` — visible en rechargeant la page de confirmation.
6. Un paiement échoué/annulé en sandbox passe la commande à `CANCELLED` via le même mécanisme de webhook.
7. La page admin `/admin/parametres/livraison` permet de modifier le coût de chaque zone, et ce nouveau coût est immédiatement reflété au prochain calcul de frais de port au checkout.
8. `npx tsc --noEmit`, `npm run lint` et `npm test` passent sans erreur ; aucune clé secrète (`GENIUSPAY_SECRET_KEY`, `GENIUSPAY_WEBHOOK_SECRET`) n'apparaît dans le code source, uniquement lues depuis `process.env`.
