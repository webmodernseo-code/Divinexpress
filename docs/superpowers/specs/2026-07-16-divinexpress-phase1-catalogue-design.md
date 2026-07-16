# DivinExpress — Phase 1 (Catalogue) : Design

> Suite de la feuille de route validée dans `2026-07-15-divinexpress-fondations-design.md`. Phase 0 (Fondations) est terminée : toolchain Next.js 14 + TypeScript, routing i18n (`/fr`, `/en`), tokens du design system appliqués, base Neon migrée (`Category`, `Product`, `ProductVariant`, `ProductImage`, etc.), CI, déploiement Vercel sur `divinexpress.fr`.

## But

Construire les pages publiques de navigation catalogue — accueil, liste produits, fiche produit, recherche — avec des données réelles (seed fictif) et une navigation entièrement fonctionnelle, sur la base posée en Phase 0.

## Source de vérité design

`Handoff Divinexpress/` — `README.md` (structure, interactions, states) + `Wireframes DivinExpress.dc.html` (wireframes basse-fidélité) + `design_system/` (tokens CSS, déjà intégrés en Phase 0). Les décisions ci-dessous adaptent le wireframe basse-fidélité aux contraintes de cette phase (pas de vraies photos, pas de panier/paiement fonctionnels).

## Portée (in scope)

### 1. Header (toutes les pages)

- **Bandeau du haut** (fond noir) :
  - Icônes réseaux sociaux à gauche — affichées mais sans liens réels pour l'instant (à câbler dès que les comptes existent).
  - À droite, remplace le sélecteur de devise du wireframe original par un **toggle langue fonctionnel** : `FR €` / `EN £`. Cliquer navigue réellement vers `/fr` ou `/en` (réutilise le routing next-intl de Phase 0). Chaque langue affiche un symbole de devise fixe associé — **pas de conversion réelle des montants** (voir "Hors scope").
- **Barre principale** :
  - Logo (cercle noir "DX") + wordmark "DIVINEXPRESS" à gauche.
  - Navigation catégories centrée : Homme / Femme / Running / Sale.
  - À droite : recherche fonctionnelle (icône + champ), lien "Suivi de commande" **masqué** (aucune commande ne peut exister avant la Phase 3 — le réafficher à ce moment-là), icône panier visible avec compteur figé à 0 (non cliquable — le panier réel arrive en Phase 2).

### 2. Accueil (`app/[locale]/page.tsx`, remplace le placeholder "coming soon")

- Hero : fond blanc, grande typographie en gras (pas de bloc image/couleur, pas de photo de campagne — aucune photo n'a été fournie). Titre + sous-titre + CTA vers le catalogue.
- Section "shop by category" sous le hero : grille de tuiles (Homme / Femme / Running / Sale), chaque tuile renvoie vers la PLP correspondante.

### 3. Liste produits / PLP (`app/[locale]/[category]/page.tsx`)

- Filtres à gauche : taille, couleur, prix (cases à cocher, multi-sélection).
- **Filtres pilotés par l'URL** (query params, ex. `?taille=M&couleur=noir`) — liens partageables/copiables, rendu initial cohérent sans JS (utile pour le SEO en Phase 5).
- **Bouton pour masquer/réafficher le panneau de filtres** : quand masqué, la grille produits s'élargit pour occuper l'espace libéré.
- Tri (dropdown, ex. Nouveautés) à droite, au-dessus de la grille.
- Grille produits : image (placeholder tant qu'il n'y a pas de vraie photo), nom, prix — prix barré + prix promo (vert) si le produit a un `compareAtPriceCents`.
- `category` peut être un slug réel (`homme`, `femme`, `running`) ou la valeur spéciale `sale`, qui affiche tous les produits ayant au moins une variante en promo, toutes catégories confondues (voir modèle de données).

### 4. Fiche produit / PDP (`app/[locale]/produit/[slug]/page.tsx`)

- Galerie d'images en grille (mosaïque), pas de carrousel empilé.
- Panneau infos/achat **sticky** à droite (reste visible pendant le défilement de la galerie) : nom, prix (avec promo si applicable), sélecteurs taille/couleur, bouton "Add to Bag".
- Le bouton "Add to Bag" est présent visuellement mais **non fonctionnel** cette phase (pas de panier — Phase 2). Comportement au clic : aucun, ou message "Bientôt disponible" — à trancher en phase d'implémentation si besoin, pas structurant pour le design.

### 5. Recherche (`app/[locale]/recherche/page.tsx`)

- Réutilise la mise en page de la PLP (mêmes composants grille/tri, sans les filtres catégorie).
- Requête `?q=...`, filtre sur `nameFr`/`nameEn` et `descriptionFr`/`descriptionEn` du produit (recherche texte simple, pas de moteur de recherche dédié).

### 6. Modèle de données — migration Prisma

- Ajout d'un champ `compareAtPriceCents Int?` (nullable) sur `ProductVariant` : prix barré d'origine quand la variante est en promo. `priceCents` reste le prix affiché/actuel. Une variante est "en promo" si `compareAtPriceCents` est renseigné et supérieur à `priceCents`.
- "Sale" n'est **pas** une `Category` — c'est un filtre transversal basé sur ce champ, pour qu'un produit puisse être à la fois "Running" et "en promo".

### 7. Données de seed (remplace le seed minimal de Phase 0)

- Catégories réelles : Homme, Femme, Running (3 lignes `Category` — "Sale" n'en est pas une, voir ci-dessus).
- ~10 produits fictifs répartis sur ces catégories, avec variantes tailles/couleurs/prix réalistes ; une partie (au moins 2-3) avec `compareAtPriceCents` renseigné pour peupler le filtre "Sale" et tester l'affichage promo.

## Hors scope (explicitement exclu de cette phase)

- Panier fonctionnel (ajout, quantités, persistance) — Phase 2.
- Compte client, adresses — Phase 2.
- Paiement (Stripe, mobile money), tunnel de commande — Phase 3.
- Page de suivi de commande réelle — Phase 3 (le lien reste masqué jusque-là).
- Conversion réelle des devises (taux de change) — Phase 3 ; pour l'instant, chaque langue affiche un symbole de devise fixe (€ pour FR, £ pour EN) sans convertir le montant numérique.
- Vrais liens réseaux sociaux — à ajouter dès qu'ils existent, aucun changement structurel nécessaire.
- Vraies photos produit/campagne — tout reste en placeholder jusqu'à fourniture des visuels réels.
- Responsive mobile détaillé au pixel près : les pages doivent être utilisables sur mobile (empilement simple, grille à 1-2 colonnes) mais aucune maquette mobile dédiée n'a été validée séparément dans cette phase — comportement standard attendu, pas de variante mobile spécifique par écran.

## Critères de réussite

- Accueil, PLP (par catégorie et pour "sale"), PDP, recherche fonctionnent dans les deux locales avec les données de seed.
- Les filtres PLP sont pilotés par l'URL et le panneau de filtres peut être masqué/réaffiché.
- Le toggle FR/EN change réellement la locale et le symbole de devise affiché.
- `npm run lint` et `npm run build` passent en local et en CI.
- Déployé et vérifiable sur `divinexpress.fr`.

## Risques / points ouverts

- L'affichage "£" sans conversion réelle du montant pour la locale EN peut prêter à confusion pour un vrai visiteur anglophone (89,00 € affiché comme 89,00 £) — accepté comme simplification temporaire jusqu'à la Phase 3, mais à garder en tête si la Phase 1 reste en ligne longtemps avant la Phase 3.
- Comportement exact du clic sur "Add to Bag" (PDP) et du bouton panier (header) non tranché précisément — à décider en phase d'implémentation (probablement : rien, ou un message discret), sans impact sur la structure des pages.
