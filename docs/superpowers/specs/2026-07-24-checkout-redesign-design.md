# DivinExpress — Checkout Redesign (Wizard) — Design Spec

## Contexte

Le checkout actuel (`components/Checkout/CheckoutForm.tsx`) est une seule page à deux colonnes : formulaire (email/adresse/pays) à gauche, récapitulatif à droite, avec un champ code promo déjà fonctionnel (chantier précédent). Le client a fourni une maquette de référence montrant un parcours en 3 étapes (Informations → Paiement → Confirmée) avec un indicateur d'étapes en haut, une colonne "Product Review" persistante avec miniatures produit, et — dans la maquette — un vrai formulaire de carte bancaire.

Ce chantier reprend la mise en page et le parcours en étapes de la maquette, **sans** collecter de carte bancaire nous-mêmes : le paiement continue de rediriger vers la page hébergée GeniusPay, exactement comme aujourd'hui. L'intégration Stripe (carte → Stripe, mobile money → GeniusPay) évoquée par le client est un chantier séparé et **postérieur** à celui-ci — le sélecteur de moyen de paiement de la maquette est masqué dans cette version.

## Buts

1. Transformer le checkout en un vrai parcours à 3 étapes visuel (Informations → Paiement → Confirmée), avec indicateur d'étapes.
2. Réorganiser la mise en page : colonne gauche = récapitulatif produit persistant (miniatures, code promo, totaux) ; colonne droite = contenu de l'étape active.
3. Ajouter un bouton "Acheter maintenant" sur la fiche produit, qui ajoute l'article au panier et va directement à `/checkout` (sans passer par le tiroir latéral).
4. Découper `CheckoutForm.tsx` (déjà volumineux) en sous-composants clairs.

## Hors périmètre

* Intégration Stripe et sélecteur de moyen de paiement réel (Carte vs Mobile Money) — chantier séparé, ultérieur.
* Collecte de numéro de carte bancaire par DivinExpress — le paiement redirige toujours vers la page hébergée GeniusPay.
* Badges de réduction pré-remplis (5%/10%/15%) de la maquette — pas de notion de "codes disponibles pour ce client" dans ce projet, seul le champ de saisie libre déjà construit reste.
* Ligne "Credit" et ligne de taxe (GST/TVA) de la maquette — n'existent pas chez DivinExpress, ne sont pas ajoutées. Le récapitulatif reste Sous-total / Réduction / Livraison / Total.
* Toute nouvelle route/URL pour les étapes — tout reste sur `/[locale]/checkout`, les étapes sont un état client, pas des pages distinctes.
* Un "panier rapide" séparé pour "Acheter maintenant" — le bouton ajoute au panier existant comme "Ajouter au panier", il n'y a qu'un seul panier.

## Spécifications Techniques

### 1. État des étapes et disposition

`CheckoutForm.tsx` devient l'orchestrateur : il détient l'état (`step: 'informations' | 'paiement'`, `email`, `shippingAddr`, `country`, l'état du coupon déjà existant, `submitting`/`error`) et assemble les sous-composants ci-dessous. Pas de nouvelle route — tout reste sur `/[locale]/checkout`, la 3ᵉ étape "Confirmée" correspond à la page déjà existante `/[locale]/checkout/confirmation/[orderNumber]` (habillée avec le même `CheckoutStepper` pour la continuité visuelle, `currentStep="confirmee"`).

Disposition en deux colonnes, inversée par rapport à l'actuelle : **gauche** = `CheckoutProductReview` (persistant, visible aux deux étapes) ; **droite** = contenu de l'étape active (`CheckoutStepInformation` ou `CheckoutStepPayment`).

Passage de l'étape "Informations" à "Paiement" : validation client des champs requis (email, adresse, pays — mêmes règles qu'aujourd'hui), puis `setStep('paiement')`. Aucun appel serveur à cette transition. Un lien "Modifier" sur l'étape Paiement repasse à `setStep('informations')` sans perdre les valeurs saisies (elles restent dans l'état de `CheckoutForm`).

### 2. Composants

* **`components/Checkout/CheckoutStepper.tsx`** — indicateur d'étapes (3 pastilles + labels : Informations / Paiement / Confirmée). Props : `currentStep: 'informations' | 'paiement' | 'confirmee'`. Étapes précédant `currentStep` affichées comme complétées (✓), l'étape courante mise en évidence, les suivantes en gris. Composant purement présentationnel, réutilisé par la page de confirmation.
* **`components/Checkout/CheckoutProductReview.tsx`** — colonne gauche persistante : items du panier (miniature + nom + taille/couleur + quantité + prix, même rendu que `CartDrawer.tsx`), champ code promo + bouton Appliquer (logique déjà existante, déplacée ici depuis `CheckoutForm.tsx`), lignes Sous-total/Réduction/Livraison/Total. Props : `cart`, `subtotalCents`, `shippingCostCents`, `locale`, plus les callbacks/état du coupon (levés dans `CheckoutForm` puisque le total dépend de la réduction appliquée, utilisé aussi par `CheckoutStepPayment` pour le bouton Payer).
* **`components/Checkout/CheckoutStepInformation.tsx`** — champs email/adresse/pays (repris tels quels de l'actuel `CheckoutForm`), plus un bouton "Suivant" qui valide et appelle `onNext`.
* **`components/Checkout/CheckoutStepPayment.tsx`** — un résumé compact des informations saisies (email/adresse/pays, avec un lien "Modifier" qui revient à l'étape Informations), le bouton "Payer" (appelle `createOrder` exactement comme aujourd'hui), l'affichage d'erreur.
* **`components/Checkout/CheckoutForm.tsx`** — orchestrateur : garde l'état, assemble `CheckoutStepper` + (`CheckoutProductReview` + `CheckoutStepInformation` ou `CheckoutStepPayment` selon `step`).

Chaque sous-composant a une responsabilité unique et des props explicites — `CheckoutForm` reste le seul point de vérité pour l'état partagé (panier via `useCart()`, formulaire, coupon, soumission).

### 3. Bouton "Acheter maintenant"

Dans `components/ProductDetail/ProductDetailClient.tsx`, à côté du bouton "Ajouter au panier" existant (`styles.addToBagBtn`) : un second bouton "Acheter maintenant" / "Buy now". Son gestionnaire appelle `addToCart(...)` avec les mêmes arguments que le bouton existant, puis navigue vers `/checkout` via le `Link` locale-aware (`@/i18n/navigation`) — pas d'ouverture du tiroir. Le panier contient donc potentiellement plusieurs articles si le client en avait déjà ajouté avant ; le récapitulatif du checkout les affiche tous (comportement voulu, pas un bug).

### 4. Page de confirmation

`app/[locale]/checkout/confirmation/[orderNumber]/page.tsx` (inchangée dans sa logique) affiche désormais `CheckoutStepper` avec `currentStep="confirmee"` en haut, pour la continuité visuelle avec les deux étapes précédentes. Aucun changement de logique métier (statut réel de la commande, pas de confiance dans un paramètre d'URL — inchangé).

### 5. Tests

Aucune nouvelle fonction pure à isoler (la validation de champs requis avant de passer à l'étape Paiement reste une vérification triviale, comme le reste du formulaire déjà non testé automatiquement). Conforme à la convention déjà établie : vérification manuelle contre le serveur de dev, pas de jsdom/React Testing Library dans ce projet.

## Critères d'acceptation

1. Sur une fiche produit, cliquer "Acheter maintenant" ajoute l'article au panier et navigue directement vers `/[locale]/checkout` (sans ouvrir le tiroir).
2. Le checkout affiche l'indicateur d'étapes (Informations → Paiement → Confirmée), avec "Informations" actif au chargement.
3. La colonne gauche (récapitulatif produit + code promo + totaux) reste visible et à jour aux deux étapes.
4. Remplir les champs et cliquer "Suivant" passe à l'étape Paiement sans rechargement ni appel serveur ; un lien "Modifier" repasse à Informations sans perdre les valeurs saisies.
5. Le code promo s'applique et met à jour le total exactement comme dans la version actuelle (aucune régression sur cette fonctionnalité déjà construite).
6. Cliquer "Payer" à l'étape Paiement crée réellement la commande et redirige vers la page hébergée GeniusPay, exactement comme aujourd'hui (aucune régression sur `createOrder`).
7. La page de confirmation affiche le même indicateur d'étapes avec "Confirmée" actif.
8. `npx tsc --noEmit`, `npm run lint` et `npm test` passent sans erreur.
