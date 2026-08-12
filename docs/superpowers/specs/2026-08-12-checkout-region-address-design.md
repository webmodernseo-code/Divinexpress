# Formulaire livraison Europe/Afrique — Design

Date : 2026-08-12
Statut : validé (design), en attente de relecture avant plan d'implémentation
Portée choisie : **Option B — front d'abord**, back inchangé (shim de compat)

## Objectif

Adapter le formulaire d'adresse du tunnel de commande ([src/app/[locale]/commande/livraison/page.tsx](../../../src/app/[locale]/commande/livraison/page.tsx))
au fait qu'une adresse « à l'européenne » (rue, ville, code postal) n'existe pas
partout. On introduit un sélecteur de région qui adapte les champs :

- **Europe** : adresse réelle avec autocomplétion (suggestions pendant la frappe).
- **Afrique** : adresse en texte libre + téléphone, sans ville ni code postal.

## UX

### Sélecteur de région
- Toggle segmenté en haut du formulaire : `Europe` | `Afrique`. Défaut : `Europe`.
- Le choix pilote les champs affichés et la validation.

### Branche Europe
- Champs : `Nom complet`, `Email`, `Adresse` (avec autocomplétion), `Ville`, `Code postal`, `Pays`.
- **Autocomplétion via Photon (OpenStreetMap)** — service gratuit, sans clé API, CORS activé.
  - Endpoint : `https://photon.komoot.io/api/?q=<texte>&lang=<fr|en>&limit=5` (+ `layer=house`/`street` si utile).
  - Déclenchement : ≥ 3 caractères, anti-rebond ~300 ms, annulation de la requête précédente (AbortController).
  - Affiche une liste de suggestions sous le champ ; à la sélection, remplit
    `address` (name + street + housenumber), `city`, `postalCode`, `country`
    depuis les `properties` du résultat GeoJSON.
  - Ville/CP/Pays restent visibles et **modifiables** (pré-remplis).
  - Repli : si aucune suggestion (ou service indisponible), l'utilisateur peut saisir manuellement.
  - Attribution OSM discrète sous le champ.

### Branche Afrique
- Champs : `Nom complet`, `Email`, `Téléphone` (obligatoire ici), `Pays` (liste des pays d'Afrique), `Adresse` en **texte libre** (placeholder : « quartier, repère, indications précises… »).
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
  country: string;
}
```

`validateShippingForm` devient conditionnelle :
- Commun : `fullName`, `email` (format), `address`, `country` requis.
- Europe : `city`, `postalCode` requis.
- Afrique : `phone` requis ; `city`/`postalCode` ignorés.

`CheckoutContext` : le type stocké suit `ShippingFormValues` (ajout `region`, `phone`, champs optionnels).

## Compat back (shim, car back inchangé en option B)

Contraintes de l'existant :
- L'API `checkout` ([src/app/api/checkout/route.ts](../../../src/app/api/checkout/route.ts)) exige `city`/`postalCode` **non vides** (zod `min(1)`), et son `countryCode()` ne reconnaît qu'une liste limitée de pays (FR, GB, BE, CH, DE, SN, CM, CI, ou code ISO à 2 lettres).
- Zod `.parse` **ignore** les clés inconnues → envoyer `region`/`phone` en plus ne casse rien (ils sont simplement droppés côté API).

Shim au moment de la soumission :
- Afrique : envoyer `city` et `postalCode` remplis avec un placeholder non vide (ex. `'-'`) pour passer le schéma actuel ; le vrai lieu reste dans `address`. `region`/`phone` sont envoyés mais ignorés par l'API.

## Limite connue (à traiter en phase 2 — back)

- Avec « tous les pays », la **soumission ne réussira que pour les pays reconnus** par `countryCode()` tant que le back n'est pas étendu. Les autres pays renverront `Unsupported shipping country`.
- `region`/`phone` ne sont pas encore persistés en commande (schéma `createOrderInput` et affichage dashboard inchangés).
- Phase 2 (hors de ce lot) : étendre `countryCode()` (ou passer par un code ISO fourni par le front), rendre `city`/`postalCode` optionnels côté schéma/commande, persister `region` + `phone`, et les afficher dans le dashboard commandes/clients.

## i18n

Nouvelles clés `checkout` (fr + en) : libellés région (Europe/Afrique), `phone`, placeholder adresse Afrique, texte d'aide autocomplétion, attribution OSM, messages d'erreur `phone`.

## Fichiers touchés (option B)

- [src/app/[locale]/commande/livraison/page.tsx](../../../src/app/[locale]/commande/livraison/page.tsx) — refonte du formulaire + sélecteur + branches.
- Nouveau : composant d'autocomplétion Photon (ex. `src/components/checkout/AddressAutocomplete.tsx`).
- Nouveau : données pays par continent (ex. `src/lib/countries.ts`).
- [src/lib/checkoutValidation.ts](../../../src/lib/checkoutValidation.ts) — type + validation conditionnelle (+ test).
- `src/context/CheckoutContext.tsx` — type élargi (rétrocompatible).
- Page paiement / soumission — appliquer le shim de compat.
- `messages/fr.json`, `messages/en.json` — nouvelles clés.

## Hors périmètre (ce lot)

- Modifs back (API checkout, schémas commande, service, dashboard) → phase 2.
- Persistance/affichage de `region` et `phone`.
- Support de paiement réel (dépend de la config provider, indépendant de ce lot).
