# Formulaire livraison Europe/Afrique — Design

Date : 2026-08-12
Statut : validé (design), en attente de relecture avant plan d'implémentation
Portée choisie : **Option A — front + back ensemble** (aucune limite de pays)

## Objectif

Adapter le formulaire d'adresse du tunnel de commande ([src/app/[locale]/commande/livraison/page.tsx](../../../src/app/[locale]/commande/livraison/page.tsx))
au fait qu'une adresse « à l'européenne » (rue, ville, code postal) n'existe pas
partout. On introduit un sélecteur de région qui adapte les champs :

- **Europe** : adresse réelle avec autocomplétion (suggestions pendant la frappe).
- **Afrique** : adresse en texte libre + téléphone, sans ville ni code postal.

Le back est adapté pour accepter toutes ces situations et tous les pays.

## UX

### Sélecteur de région
- Toggle segmenté en haut du formulaire : `Europe` | `Afrique`. Défaut : `Europe`.
- Le choix pilote les champs affichés et la validation.

### Branche Europe
- Champs : `Nom complet`, `Email`, `Adresse` (avec autocomplétion), `Ville`, `Code postal`, `Pays`.
- **Autocomplétion via Photon (OpenStreetMap)** — service gratuit, sans clé API, CORS activé.
  - Endpoint : `https://photon.komoot.io/api/?q=<texte>&lang=<fr|en>&limit=5`.
  - Déclenchement : ≥ 3 caractères, anti-rebond ~300 ms, annulation de la requête précédente (AbortController).
  - Affiche une liste de suggestions sous le champ ; à la sélection, remplit
    `address` (name + street + housenumber), `city`, `postalCode`, `country`
    (nom lisible) et `countryCode` (`properties.countrycode`) depuis le GeoJSON.
  - Ville/CP/Pays restent visibles et **modifiables** (pré-remplis).
  - Repli : si aucune suggestion (ou service indisponible), saisie manuelle possible
    (avec un `<select>` pays qui fixe alors le `countryCode`).
  - Attribution OSM discrète sous le champ.

### Branche Afrique
- Champs : `Nom complet`, `Email`, `Téléphone` (obligatoire ici), `Pays` (liste des pays d'Afrique, chaque option porte son code ISO), `Adresse` en **texte libre** (placeholder : « quartier, repère, indications précises… »).
- **Ville et code postal masqués** (non demandés).

## Modèle de données (front)

`ShippingFormValues` ([src/lib/checkoutValidation.ts](../../../src/lib/checkoutValidation.ts)) évolue :

```ts
interface ShippingFormValues {
  region: 'europe' | 'africa';
  fullName: string;
  email: string;
  phone?: string;        // requis si region === 'africa'
  address: string;
  city?: string;         // requis si region === 'europe'
  postalCode?: string;   // requis si region === 'europe'
  country: string;       // nom lisible (affichage)
  countryCode: string;   // ISO alpha-2, source de vérité côté back
}
```

`validateShippingForm` devient conditionnelle :
- Commun : `fullName`, `email` (format), `address`, `country`/`countryCode` requis.
- Europe : `city`, `postalCode` requis.
- Afrique : `phone` requis ; `city`/`postalCode` ignorés.

`CheckoutContext` : le type stocké suit `ShippingFormValues`.

Liste des pays : nouveau `src/lib/countries.ts` exposant les pays par continent
(`europe`, `africa`) avec `{ code: ISO2, name_fr, name_en }`.

## Modèle de données (back)

- **API `checkout`** ([src/app/api/checkout/route.ts](../../../src/app/api/checkout/route.ts)) :
  - `requestSchema.shipping` : ajouter `countryCode` (`z.string().length(2)`),
    rendre `city`/`postalCode` **optionnels** (`.optional()` / vide → `null`),
    ajouter `phone` optionnel, `region` optionnel.
  - Supprimer la dépendance à `countryCode(name)` : utiliser directement le
    `countryCode` fourni (fallback sur l'ancien mapping si absent, pour robustesse).
  - Câbler `customer.phone` depuis `shipping.phone` (au lieu de `null` en dur).
  - `shippingAddress.city`/`postalCode` → `null` si absents.
- **Schéma commande** ([src/server/orders/schemas.ts](../../../src/server/orders/schemas.ts)) :
  `shippingAddress.postalCode` et `city` passent de requis à **nullable**.
- **Service commande** ([src/server/orders/service.ts](../../../src/server/orders/service.ts)) + **DB** :
  vérifier les colonnes `city`/`postal_code` (migration si `NOT NULL`) pour autoriser `NULL`.
- **Dashboard** ([commandes](../../../src/app/[locale]/(dashboard)/commandes/page.tsx), [clients](../../../src/app/[locale]/(dashboard)/clients/page.tsx)) :
  afficher le téléphone et gérer l'absence de ville/CP sans casser la mise en page.

## i18n

Nouvelles clés `checkout` (fr + en) : libellés région (Europe/Afrique), `phone`,
placeholder adresse Afrique, texte d'aide autocomplétion, attribution OSM,
message d'erreur `phone`. Noms de pays : via `countries.ts` (bilingue).

## Fichiers touchés

Front :
- [src/app/[locale]/commande/livraison/page.tsx](../../../src/app/[locale]/commande/livraison/page.tsx) — refonte formulaire + sélecteur + branches.
- Nouveau `src/components/checkout/AddressAutocomplete.tsx` — champ + suggestions Photon.
- Nouveau `src/lib/countries.ts` — pays par continent (code ISO + noms fr/en).
- [src/lib/checkoutValidation.ts](../../../src/lib/checkoutValidation.ts) (+ [test](../../../src/lib/checkoutValidation.test.ts)) — type + validation conditionnelle.
- `src/context/CheckoutContext.tsx` — type élargi.
- Page paiement / soumission — envoyer `countryCode`, `phone`, `region`.
- `messages/fr.json`, `messages/en.json`.

Back :
- [src/app/api/checkout/route.ts](../../../src/app/api/checkout/route.ts) — schéma + câblage phone/countryCode.
- [src/server/orders/schemas.ts](../../../src/server/orders/schemas.ts) — city/postalCode nullable.
- [src/server/orders/service.ts](../../../src/server/orders/service.ts) — persistance city/postal null.
- Migration DB si colonnes `NOT NULL`.
- Dashboard commandes/clients — affichage phone + ville/CP optionnels.
- Tests : `checkoutValidation.test.ts`, `orders/service.test.ts`, `checkout/checkout.test.ts` (+ tout test touché).

## Décisions

- Le **continent** (`region`) n'est pas forcément persisté en base (dérivable) ;
  il sert au branchement du formulaire. À confirmer pendant le plan si le dashboard
  doit l'afficher (sinon on ne migre pas pour ça).
- Source de vérité pays = **code ISO alpha-2** fourni par le front (fin du name-matching fragile).

## Hors périmètre

- Support de paiement réel (dépend de la config provider Genius/Stripe, indépendant de ce lot).
- Vérification postale « forte » (validation d'existence stricte) au-delà des suggestions Photon.
