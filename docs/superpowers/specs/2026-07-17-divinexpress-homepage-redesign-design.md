# DivinExpress — Refonte Homepage (Design Spec v2)

## Contexte

**Cette version remplace la v1** (déjà implémentée et approuvée — commits `adec183..b035586`, actuellement en place sur `master`). La v1 était basée sur une seule capture d'écran de référence (SNIKEI) et des tokens visuels approximés à l'œil. L'utilisateur a depuis fourni un package de handoff complet (`Handoff Projet DivinExpress.zip`, extrait dans `Handoff Projet DivinExpress/`) contenant :

- Un **design system précis**, construit en analysant le vrai site SNIKEI (snikei.webflow.io) en direct, y compris sa page style-guide officielle — valeurs exactes de couleurs, échelle typographique, espacements, rayons, ombres (`_ds/snikei-design-system-.../tokens/*.css`).
- Un **prototype interactif complet** (`Site DivinExpress.dc.html`) couvrant Accueil, Catégories, Boutique (filtres/tri/recherche), Fiche produit, Blog, Article, Contact, À propos, pages légales, 404, et un tiroir panier — avec la logique d'interaction (state, filtres, carrousels) déjà écrite en JS.
- Un wireframe **Dashboard** (`Dashboard Snikei.dc.html`) — hors périmètre de ce spec, traité séparément.

Ce spec ne couvre que la **homepage** (section `isHome` du prototype). Les autres pages du prototype (Catégories, Boutique, Fiche produit, Blog, Article, Contact, À propos, pages légales, 404) sont hors périmètre et feront chacune l'objet d'un cycle spec → plan dédié, en s'appuyant sur ce même prototype comme référence.

**Décisions actées avec l'utilisateur avant ce spec :**
1. Les informations d'entreprise du prototype (adresse "349 Avenue Jean Jaurès, Lyon", téléphone, email `@divinexpress.com`, mentions légales avec une SAS fictive, les deux "magasins" Paris/Lyon) sont **du contenu placeholder du wireframe, à ignorer**. Seul le vrai contact confirmé (`contact@divinexpress.fr`) est utilisé. Aucune adresse ni téléphone inventés.
2. Le catalogue produits du prototype (chaussures : "Eclipse Sneakers", etc.) est **la structure de démonstration uniquement**. Les vraies données (vêtements) déjà en base continuent d'alimenter toutes les grilles produits.
3. La catégorie "Running" est **remplacée par "Enfant"** en base pour matcher le prototype (Homme/Femme/Enfant). Les 4 produits actuellement sous "Running" restent temporairement sous la catégorie renommée en tant que contenu placeholder (ce sont des articles de running, pas des vêtements enfant — à remplacer par de vrais produits enfant plus tard), clairement signalé comme tel.
4. Le panier fonctionnel (ajout, tiroir panier, checkout) est **hors périmètre** — c'est une fonctionnalité e-commerce à part entière, pas une question de design. L'icône panier reste visuelle uniquement, comme en v1.

## But

Faire correspondre la homepage DivinExpress **littéralement** à la section Accueil du prototype `Site DivinExpress.dc.html` : mêmes sections, même ordre, mêmes valeurs de design system, copy traduite/adaptée vêtements plutôt que chaussures, alimentée par les vraies données DivinExpress.

## Design system (valeurs exactes, remplace les approximations v1)

Source : `Handoff Projet DivinExpress/_ds/snikei-design-system-.../tokens/*.css`. Copier ces valeurs telles quelles dans `app/styles/tokens.css` (noms de variables adaptés au préfixe déjà utilisé par le projet où c'est plus simple, valeurs identiques) :

**Couleurs** — rampe neutre (`#0C0407` quasi-noir → `#FFFFFF` blanc, 10 paliers), crème chaud pour boutons/badges primaires sur photo (`#F6F1E9` / `#FBF8F3`), bleu de marque réservé aux liens/focus (`#3469F9` défaut, rampe 100-900), succès (vert) et alerte (ambre) pour statut/notation.

**Typographie** — Inter (unique famille, poids 400/500/600/700), échelle 12 paliers de 72px (h1) à 12px (caption), line-heights 110-140% selon palier.

**Espacements** — échelle 4/8/12/16/20/24/32/40/48/64/80/96/128px, conteneur max `1280px`, gouttière `24px`, padding vertical de section `96px` desktop / `48px` mobile.

**Effets** — rayons `8/12/16/24px` + `999px` (pill) + `50%` (cercle), ombres douces teintées neutre-chaud (jamais noir/bleu pur), transitions `150/250/400ms` en `cubic-bezier(.4,0,.2,1)`.

**Boutons** — toujours en pilule (rayon `999px`). Trois formes : (1) fond crème + texte foncé, CTA primaire sur photo ; (2) fond quasi-noir + texte blanc, CTA primaire sur fond blanc ; (3) contour/ghost, bordure + texte assorti. Chaque bouton porte une flèche (→) dans son label.

**Cartes** — coins très arrondis (16-20px), pas de bordure visible, séparation par l'espace blanc + ombre douce.

## Architecture technique

Composants sous `components/`, un dossier par composant + `.module.css`, pas de Tailwind. Deltas par rapport à la v1 :

- `components/Header/Header.tsx` — **modifié** : ajoute des sélecteurs langue (FR/EN) et devise (EUR/GBP/XOF) fonctionnels (`<select>`), un bouton recherche qui bascule l'affichage d'un champ `<input>` inline (pas de lien direct vers `/recherche`).
- `components/Header/MessageCarousel.tsx` — **modifié** : ajoute des flèches précédent/suivant cliquables en plus de la rotation automatique.
- `components/Hero/Hero.tsx` — **modifié** : nouveau copy (vêtements, pas chaussures), bouton primaire avec micro-animation de pulsation.
- `components/TrustBar/TrustBar.tsx` — inchangé dans son principe, contenu aligné sur les 4 items du prototype (matières durables, garantie, livraison rapide, tissus écologiques).
- `components/PromoBanner/PromoBanner.tsx` — inchangé (déjà réutilisable via prop `size`).
- `components/ProductCard/ProductCard.tsx` + `ProductGrid/ProductGrid.tsx` — **modifié** : ajoute la notation (rating) si disponible, sinon omise proprement (pas de données de notation réelles en base).
- `components/ProductMarquee/ProductMarquee.tsx` — **nouveau** : variante de grille en défilement horizontal automatique (CSS animation, pause au survol), pour "Nouveautés".
- `components/CategoryStrip/CategoryStrip.tsx` — inchangé, alimenté par les 3 catégories réelles (dont la nouvelle "Enfant").
- `components/Testimonials/Testimonials.tsx` → **remplacé par** `components/TestimonialCarousel/TestimonialCarousel.tsx` — carrousel avec flèches précédent/suivant + points, 6 témoignages fictifs (au lieu de 3 statiques).
- `components/Faq/Faq.tsx` — **nouveau** : accordéon de 5 questions/réponses, contenu réel (livraison, tailles, retours, entretien, contact) adapté vêtements.
- `components/BlogPreview/BlogPreview.tsx` — inchangé dans son principe (contenu placeholder déjà accepté), renommé en tête de section "Articles & ressources" pour matcher le prototype.
- `components/Footer/Footer.tsx` — **modifié** : réarrangement en logo + nav + contact + réseaux sociaux (4 zones inégales, pas 4 colonnes égales), ligne de paiements + liens légaux + copyright inchangée dans son principe.

`app/[locale]/layout.tsx` et `app/[locale]/page.tsx` : mise à jour de la composition pour le nouvel ordre de sections et les nouveaux composants.

## Changement de données

1. `featured` sur `Product` — **déjà fait** (v1), inchangé.
2. **Renommage de catégorie** : `Category` où `slug: 'running'` devient `slug: 'enfant', name: 'Enfant'` (migration de données, pas de schéma). Les 4 produits actuellement rattachés (`coupe-vent-running-bleu`, `chaussettes-running-techniques`, `casquette-running-noire`, `sac-banane-running-noir`) restent rattachés à cette catégorie renommée — ce sont des articles de sport, pas des vêtements enfant, donc clairement du contenu placeholder à remplacer par de vrais produits enfant plus tard. Mettre à jour `header.running` → `header.enfant` dans les fichiers de messages (fr: "Enfant", en: "Kids").

## Sections de la homepage (ordre du prototype, `isHome`)

1. **Bandeau annonces** — noir, message centré avec flèches ‹ › pour naviguer manuellement entre 3 messages (au lieu de 2), rotation auto conservée. Sélecteurs langue/devise à droite (fonctionnels côté UI — changent l'affichage, pas de vraie logique de traduction dynamique au clic, le routage i18n reste piloté par l'URL comme aujourd'hui).
2. **Header** — logo losange "DX" + "DivinExpress", nav pilule (Accueil/Boutique/Blog/Contact — état actif en fond noir), icône recherche togglable, icône panier (visuelle, badge compteur à 0).
4. **Hero** — titre 1 ligne adapté vêtements (ex: "Explorez notre collection premium"), 2 CTA ("Acheter" primaire crème avec pulsation, "Catégories" contour), photo pleine largeur en fond, hauteur ~560px.
5. **Réassurance** — 4 blocs icône+titre+description, contenu du prototype adapté vêtements.
6. **2 bannières promo** — grille 2 colonnes, badge crème "-X%" en haut à gauche, titre + CTA "Acheter" en bas.
7. **Catalogue** (= Best Sellers) — titre centré, grille 3 colonnes, jusqu'à 12 produits `featured: true`.
8. **Nos catégories** — titre aligné à gauche, 3 tuiles carrées côte à côte (Homme/Femme/Enfant).
9. **Bannière offre du week-end** — bannière pleine largeur unique, badge "Offre du week-end", gros pourcentage en overlay.
10. **Nouveautés** — titre centré, défilement horizontal automatique (marquee) des produits les plus récents, pause au survol.
11. **Témoignages** — titre, carrousel 3 cartes visibles + flèches + points, 6 témoignages fictifs clairement identifiés comme tels (noms génériques, pas de vraies photos).
12. **FAQ** — titre centré, accordéon 5 questions (livraison, tailles, retours, entretien, contact), contenu réel adapté vêtements.
13. **Articles & ressources** — titre, grille 4 cartes, contenu placeholder (pas de CMS réel), comme en v1.
14. **Footer** — logo, colonne liens rapides, colonne contact (email réel uniquement), réseaux sociaux ; ligne du bas avec badges de paiement, liens légaux placeholder, copyright.

## Ce qui reste explicitement hors périmètre

- Les autres pages du prototype (Catégories, Boutique, Fiche produit, Blog, Article, Contact, À propos, pages légales, 404) — chacune son propre cycle spec → plan.
- Le Dashboard (`Dashboard Snikei.dc.html`) — cycle dédié séparé.
- Tout système de blog/CMS réel.
- Tout système d'avis clients réel.
- Le panier et le compte client fonctionnels (visuels seulement).
- Toute vraie logique de changement de devise (conversion de prix) — le sélecteur change l'affichage du sélecteur lui-même, pas les prix affichés, pour l'instant.

## Critères d'acceptation

1. Les 13 sections listées sont présentes dans cet ordre sur `/fr` et `/en`.
2. Toutes les valeurs de couleur/typo/espacement/rayon/ombre correspondent aux tokens exacts du design system fourni (pas d'approximation).
3. Catalogue et Nouveautés affichent de vrais produits issus de la base.
4. Nos catégories affiche Homme/Femme/Enfant (catégorie renommée), issues de la base.
5. Aucune fausse donnée d'entreprise (adresse, téléphone, raison sociale) n'est affichée ; l'email de contact est le vrai (`contact@divinexpress.fr`).
6. Le bandeau d'annonces navigue manuellement (flèches) et automatiquement entre 3 messages.
7. Le carrousel de témoignages et l'accordéon FAQ sont interactifs (état géré côté client).
8. Le défilement "Nouveautés" s'anime en continu et se met en pause au survol.
9. `npm run lint`, `npx vitest run` et `npm run build` passent tous les trois.
10. La page reste responsive (mobile/desktop) — à valider visuellement à l'implémentation.
