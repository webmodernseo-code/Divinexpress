# DivinExpress — Système de Panier & Tiroir (Design Spec Phase 1)

## Contexte
Cette spécification définit l'implémentation du système de panier global et du tiroir panier (`CartDrawer`) pour le site DivinExpress. Il s'appuie sur le prototype interactif [Site DivinExpress.dc.html](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/Handoff%20Projet%20DivinExpress/Site%20DivinExpress.dc.html) comme référence de design et d'interaction.

Le panier doit persister côté client, se synchroniser en temps réel avec l'en-tête (badge du panier) et être accessible depuis n'importe quelle page.

## Buts
1. Créer un contexte d'état global (`CartContext`) persistant dans le `localStorage`.
2. Créer un tiroir de panier coulissant (`CartDrawer`) 100% fidèle au prototype original en termes de styles, d'animations et d'interactions, et entièrement responsive (mobile, tablette, PC).
3. Intégrer un système de notification global (`ToastContext`) pour afficher des messages de succès de commande/panier sous forme de badge pilule au bas de l'écran.
4. Relier le Header existant pour ouvrir le tiroir et afficher le nombre d'articles réel.

## Spécifications Techniques

### 1. Contexte du Panier (`CartContext`)
* **Emplacement** : `components/Cart/CartContext.tsx`
* **Interface TypeScript** :
  ```typescript
  export interface CartItem {
    productId: string;
    slug: string;
    name: string;
    image: string;
    priceCents: number;
    size: string;
    color: string;
    quantity: number;
  }
  ```
* **Fonctionnalités** :
  * Synchronisation automatique avec le `localStorage` après montage pour éviter les écarts d'hydratation (SSR / CSR).
  * Calcul automatique de `totalItems` (quantité cumulée) et `subtotalCents` (somme des `quantity * priceCents`).
  * `addToCart` : Regroupe par clé unique (`productId` + `size` + `color`).
  * `updateQuantity` : Ajuste la quantité (supprime si <= 0).
  * `removeFromCart` : Supprime l'élément.
  * `clearCart` : Réinitialise le panier.

### 2. Le Tiroir Panier (`CartDrawer`)
* **Emplacement** : `components/Cart/CartDrawer.tsx` et `components/Cart/CartDrawer.module.css`
* **Design & Layout** :
  * Position : `fixed` à droite, hauteur `100vh`, largeur `420px` (s'adapte à `100%` sur mobile/tablette).
  * Transition : glissement latéral (`transform: translateX(0)` / `translateX(100%)`).
  * Arrière-plan : fond semi-transparent noir avec floutage (`backdrop-filter: blur(4px)`).
  * Header : Titre "Votre panier" avec bouton de fermeture "X".
  * Liste d'articles : défilement vertical si nécessaire (`overflow-y: auto`), visuel carré du vêtement, nom, taille, couleur, stepper de quantité (+ / -), prix unitaire.
  * Footer : Affichage du total formaté en fonction de la devise (EUR par défaut) et bouton "Commander".
  * Le bouton "Commander" déclenche la fermeture, vide le panier et émet un Toast de succès : *"Commande confirmée — merci pour votre achat !"*.

### 3. Système de Toast global (`ToastContext`)
* **Emplacement** : `components/Toast/ToastContext.tsx` et `components/Toast/Toast.module.css`
* **Fonctionnalités** :
  * Fournit une fonction `showToast(message: string)`.
  * Affiche un message d'information temporaire (durée : 2,4 secondes).
  * Style : badge pilule noir (`#0C0407`), texte blanc, centré en bas (`bottom: 26px`), rayon pilule (`999px`), police **Inter sans-serif**.

### 4. Layout principal
* **Fichier** : `app/[locale]/layout.tsx`
* **Changements** :
  * Envelopper les `children` avec `CartProvider` et `ToastProvider`.
  * Placer le composant `<CartDrawer />` à la racine pour être invoqué globalement.

### 5. Header Actions
* **Fichier** : `components/Header/HeaderActions.tsx`
* **Changements** :
  * Récupérer `totalItems` et `openCart` depuis `useCart()`.
  * Connecter le clic de l'icône du panier pour déclencher `openCart()`.
  * Afficher dynamiquement le badge avec le nombre d'articles réels.

## Critères d'acceptation
1. Cliquer sur l'icône du sac dans le Header ouvre le tiroir panier depuis la droite avec une animation fluide.
2. Le tiroir panier affiche correctement la liste des produits ajoutés, leurs détails (taille, couleur, quantité) et le total calculé.
3. Les boutons "+" et "-" permettent d'ajuster la quantité ou de retirer le produit. Le bouton de suppression (poubelle ou X) retire le produit immédiatement.
4. Cliquer en dehors du tiroir (sur l'overlay flouté) ou sur le bouton "X" ferme le tiroir.
5. Cliquer sur "Commander" vide le panier, ferme le tiroir et affiche la notification Toast *"Commande confirmée — merci pour votre achat !"* au bas de l'écran pendant 2,4 secondes.
6. Le panier est persistant d'une page à l'autre et après rafraîchissement (via `localStorage`), sans erreur d'hydratation Next.js en console.
7. Le composant est responsive et s'ajuste parfaitement sur mobile et tablette.
8. La compilation TypeScript (`npx tsc --noEmit`) et le linter (`npm run lint`) passent avec succès.
