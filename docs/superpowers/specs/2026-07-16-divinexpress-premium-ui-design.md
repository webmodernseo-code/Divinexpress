# DivinExpress — Refonte Visuelle Premium (Nike-Inspired UI) : Design Spec

Ce document spécifie le design et la structure technique pour intégrer les codes esthétiques premium fournis dans les captures d'écran (Topbar avec carrousel, grille PLP épurée avec sélecteur de variantes colorées, PDP avec galerie à vignettes et footer complet à 4 colonnes).

## But

Transformer l'interface de DivinExpress pour lui donner une esthétique moderne et épurée de classe mondiale.

## Portée (In Scope)

### 1. Module A : Topbar & Footer

#### A. La Topbar (`components/Header/Header.tsx`)
* **Layout** : Fond noir, texte blanc, hauteur fixe de 36px.
* **Gauche** : Icônes des réseaux sociaux (Facebook, Instagram, YouTube, TikTok) en SVG blanc (opacity 0.8, devenant opaque au survol).
* **Centre** : Un carrousel de messages défilants (ex: "Livraison internationale", "Une question ? Visitez notre page contact") avec deux flèches de navigation circulaires de chaque côté. Un script JS léger anime le défilement toutes les 4 secondes avec un effet de fade-in/fade-out CSS.
* **Droite** :
  * Sélecteur de langue (Globe SVG + "Français/English" + chevron).
  * Sélecteur de devise (Localisation SVG + "France (EUR €) / UK (GBP £)" + chevron).

#### B. Le Footer (`components/Footer/Footer.tsx`)
* **Layout** : Remplace le footer actuel minimaliste par une section complète sur fond noir (`#111111`) avec texte gris clair (`#cccccc`).
* **Grille principale** : 4 colonnes.
  * **Col 1** : Logo DivinExpress "DX" en blanc de grande taille.
  * **Col 2** : "Liens rapides" (Accueil, Nos produits, Contact, Recherche).
  * **Col 3** : "Contact" (BOUTIQUE DIVINEXPRESS, adresse de Lyon, email de support).
  * **Col 4** : Icônes réseaux sociaux.
* **Section basse** :
  * Une ligne de logos de paiement au format SVG inline pour conserver des performances parfaites (Visa, Mastercard, Paypal, Apple Pay, etc.).
  * Liste des liens de mentions légales et CGV séparés par des puces.
  * Ligne de copyright : `© 2026, DivinExpress — Tous droits réservés.`

### 2. Module B : PLP et Cartes Produits (`components/ProductCard`)

#### A. Les Cartes Produits (`components/ProductCard/ProductCard.tsx`)
* **Mise en page** :
  * Image sur fond blanc avec un ratio 1:1, bordure fine invisible sauf au survol.
  * Sous l'image : des pastilles colorées interactives représentant les couleurs uniques disponibles pour le produit.
  * Cliquer sur une pastille sélectionne cette couleur et filtre les variantes du produit en temps réel pour adapter le prix affiché (et le prix barré si applicable).
  * Affichage d'un tag rouge/orange au-dessus du titre si le produit est en promotion ou s'il s'agit d'une nouveauté.
  * Titre en gras, description courte du produit en gris clair dessous.
  * Prix affiché en bas de la carte.

#### B. Rendu de promotion (`components/PriceDisplay`)
* Si le produit est en promotion, afficher le prix promo en vert success (`#2e7d32`), le prix d'origine barré à gauche, et le badge vert clair (ex: `30% de réduction`) à côté pour correspondre exactement à l'image fournie.

### 3. Module C : Galerie PDP (`app/[locale]/produit/[slug]/page.tsx`)

* **Structure de la Galerie** :
  * **Colonne de vignettes (Gauche)** : Liste verticale d'images miniatures miniatures représentant les différentes vues du produit. Cliquer sur une vignette met à jour l'image principale. La vignette sélectionnée a une bordure noire active de 2px.
  * **Image principale (Droite)** : Grande photo affichée sur fond gris très clair (`#f6f6f6`).
  * **Badge flottant** : Un badge blanc arrondi "★ Bien noté" ou "Nouveau" flottant en haut à gauche de l'image principale.
  * **Navigation** : Deux boutons circulaires blancs avec des flèches gauche/droite flottant en bas à droite de l'image principale pour faire défiler la galerie d'images.

---

## Critères d'acceptation

1. Le carrousel de la Topbar défile automatiquement et manuellement à l'aide des flèches.
2. Le Footer affiche les 4 colonnes, les logos de paiement en SVG et s'adapte parfaitement sur mobile (layout responsive).
3. Les cartes produits en PLP affichent des pastilles de couleur cliquables qui filtrent les variantes en direct.
4. Les prix barrés en promotion affichent le pourcentage de réduction de manière identique à l'exemple Nike.
5. La galerie PDP permet de changer d'image principale au clic sur les vignettes ou à l'aide des flèches de navigation de l'image principale.
6. Le build de production Next.js et le typecheck passent avec succès.
