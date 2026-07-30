# Reign — Site vitrine e-commerce — Spec de conception

**Date** : 2026-07-30
**Statut** : Validé par l'utilisateur (en attente de relecture finale de ce document)

## 1. Contexte & objectif

Reign est une marque de vêtements et accessoires. L'objectif de ce projet est de construire
une **vitrine e-commerce front-end complète**, bilingue (FR/EN) et multi-devises (EUR/GBP),
avec un design premium noir/blanc. Cette phase 1 livre l'intégralité de l'expérience visuelle
et des interactions côté client, sans backend réel (pas de base de données, pas de paiement,
pas d'authentification). La phase 2 (hors périmètre de cette spec) branchera le vrai backend.

Catégories produits : **Homme / Femme / Enfant / Accessoires**.

## 2. Marque & identité visuelle

### 2.1 Palette de couleurs

| Rôle | Valeur | Usage |
|---|---|---|
| Noir profond | `#0D0D0D` | Fond principal, texte sur blanc |
| Blanc | `#FFFFFF` | Fond secondaire, texte sur noir |
| Accent — Bleu acier glacé | `#3B4A5A` | CTA, liens actifs, survols, prix, liserés fins — usage parcimonieux |
| Échelle de gris | `#1A1A1A` → `#F2F2F2` | Blocs placeholder (remplacent les photos produits), séparateurs, fonds secondaires |

### 2.2 Typographie

- **Logo** : asset graphique fourni par l'utilisateur (wordmark "Reign", sans-serif bold, découpe
  diagonale sur le R, texture grunge légère, blanc sur noir). Utilisé tel quel comme mark isolé
  (header, favicon) — jamais recomposé en CSS.
- **Titres / éditorial** : **Fraunces** (serif éditorial) — utilisé pour les titres de section,
  accroches, noms de collection.
- **Corps de texte / UI** : **Inter** (sans-serif neutre) — utilisé pour le texte courant, les
  boutons, les formulaires, la navigation.
- Principe retenu : **contraste maîtrisé** — le logo reste un mark graphique fort et isolé, le
  reste de la typographie du site reste sobre (serif éditorial + sans-serif), créant une tension
  premium plutôt qu'une homogénéité totale avec le style graphique du logo.

### 2.3 Placeholders visuels

Aucune vraie photo produit en phase 1. Les emplacements images (galerie produit, vignettes
listing, bannières) sont des **blocs placeholder soignés** : ratio fixe, aplat gris foncé ou noir
(pas de couleurs vives), éventuellement un léger dégradé ou une bordure fine — l'objectif est que
le site ait l'air fini et intentionnel même sans photographie réelle. Remplacement par de vraies
images prévu ultérieurement (hors périmètre de cette phase).

## 3. Langues & devises

- **Langues** : FR et EN, routing par préfixe d'URL (`/fr/...`, `/en/...`), contenu traduit page
  par page (pas de traduction automatique).
- **Devises** : EUR et GBP, **sélecteur indépendant du sélecteur de langue**. La devise par défaut
  est suggérée selon la langue (FR→EUR, EN→GBP) mais l'utilisateur peut choisir n'importe quelle
  combinaison. Le choix de devise est mémorisé côté client (`localStorage`).
- **Taux de conversion** : taux fixe codé en dur en phase 1 (valeur d'exemple : 1 EUR ≈ 0,86 GBP),
  isolé dans une seule constante clairement commentée comme approximative (à remplacer par un
  taux réel/API en phase 2).

## 4. Architecture technique

- **Framework** : Next.js (App Router) + TypeScript + Tailwind CSS.
- **i18n** : routing par préfixe de locale via `next-intl` (structure `/fr/...` et `/en/...`),
  compatible avec les balises hreflang pour le SEO.
- **État client** : Context API + `localStorage` pour panier, favoris et devise choisie. Pas de
  librairie de state management supplémentaire (Zustand/Redux) — le besoin ne le justifie pas à
  cette échelle.
- **Données produits** : fichiers de données locaux (JSON/TS), bilingues, avec champs pour
  catégorie/sous-catégorie, tailles, variantes couleur, tags — voir section 6.
- **Pas de backend réel** : pas de base de données, pas d'API externe, pas de paiement, pas
  d'authentification en phase 1.
- **Responsive & accessibilité** : conception mobile-first, toutes les pages doivent être
  pleinement utilisables sur mobile/tablette/desktop. Standards d'accessibilité de base attendus
  (HTML sémantique, contraste suffisant, navigation clavier) — pas d'audit d'accessibilité formel
  en phase 1, mais pas d'obstacle non plus.

## 5. Liste des pages

Chaque route existe en `/fr/...` et `/en/...` (même structure, contenu traduit).

### Pages e-commerce principales

| Page | Route (ex. FR) | Notes |
|---|---|---|
| Accueil | `/fr` | Hero, mise en avant catégories, nouveautés, bannière éditoriale, newsletter |
| Listing catégorie | `/fr/homme`, `/fr/femme`, `/fr/enfant`, `/fr/accessoires` | Template commun, filtres (sous-catégorie, taille, couleur, prix, tri) |
| Fiche produit | `/fr/produit/[slug]` | Galerie (placeholders), variantes taille/couleur, ajout panier, description, produits associés |
| Recherche | `/fr/recherche` | Résultats + suggestions |
| Panier | `/fr/panier` | Page dédiée + drawer accessible depuis le header |
| Favoris | `/fr/favoris` | Client-side (`localStorage`), sans compte requis |
| 404 | — | Page non trouvée personnalisée |

### Tunnel de commande (100% invité, UI complète, sans paiement réel)

| Page | Route |
|---|---|
| Livraison | `/fr/commande/livraison` |
| Paiement | `/fr/commande/paiement` |
| Confirmation | `/fr/commande/confirmation` |

Pas de compte, pas d'authentification, pas de tableau de bord, pas d'historique de commandes en
phase 1 — décision explicite (voir section 9). Chaque achat se fait en saisissant les
informations de livraison directement dans le tunnel.

### Pages institutionnelles

| Page | Route |
|---|---|
| À propos | `/fr/a-propos` |
| Contact | `/fr/contact` |
| FAQ / Aide | `/fr/aide` |
| Livraison & Retours | `/fr/livraison-retours` |
| Guide des tailles | `/fr/guide-tailles` (+ modale réutilisable) |
| Mentions légales | `/fr/mentions-legales` |
| CGV | `/fr/cgv` |
| Politique de confidentialité | `/fr/confidentialite` |

### Composants transverses (pas des pages, présents partout)

- Header : logo, navigation catégories, recherche, sélecteur langue, sélecteur devise, panier,
  favoris.
- Footer : liens institutionnels, réseaux sociaux, newsletter, mentions.
- Bandeau cookies (RGPD).
- Drawer panier.
- Modale guide des tailles.

## 6. Modèle de données

### Produit

- `id` / `slug`
- `category` (homme/femme/enfant/accessoires) + `subcategory`
- `name` (fr/en)
- `description` (fr/en)
- `price` (EUR de base, conversion GBP calculée via le taux fixe de la section 3)
- `sizes` (tailles disponibles)
- `colors` (variantes couleur, représentées en placeholders visuels)
- `images` (plusieurs entrées placeholder pour la galerie)
- `tags` (ex : nouveauté)
- `relatedProducts` (références pour la section "produits associés" en fiche produit)

### Contenu bilingue

- Textes d'interface (nav, boutons, formulaires, messages) : fichiers de traduction `fr.json` /
  `en.json` via `next-intl`.
- Contenu des pages statiques (À propos, FAQ, mentions légales, CGV, confidentialité,
  livraison/retours) : écrit en dur par langue dans le code, pas de CMS en phase 1.

## 7. Périmètre Phase 1 / Phase 2

**Phase 1 (ce projet)**
- Toutes les pages listées en section 5, design premium complet.
- FR/EN + EUR/GBP fonctionnels côté client (taux fixe).
- Panier et favoris en `localStorage`.
- Tunnel de commande invité se terminant sur une confirmation factice (pas de paiement réel).
- Placeholders gris/noir à la place des photos produits.
- Bases SEO : métadonnées par page/locale, alternates hreflang fr/en, données structurées
  (JSON-LD : Product, BreadcrumbList, Organization), sitemap.

**Phase 2 (hors périmètre, à spécifier séparément plus tard)**
- Vrai backend + base de données (produits, commandes).
- Vrai système de compte (connexion, inscription, tableau de bord, historique de commandes,
  adresses enregistrées).
- Vrai paiement (Stripe ou équivalent).
- Vraies photos produits.
- Taux de change réels (API) ou tarification multi-devise gérée en admin.
- Éventuellement un CMS d'administration.
- Réexamen possible des sections explicitement exclues en phase 1 (voir section 9).

## 8. Méthodologie de construction

Le site est construit **page par page**, dans cet ordre de priorité pour chaque page :

1. **Design & mise en page visuelle** (structure, typographie, couleurs, placeholders) avec
   Tailwind/JSX, en s'appuyant sur le skill `frontend-design` pour des choix esthétiques
   distinctifs et non génériques.
2. **Fonctionnalité et interactions visuelles** (états hover/focus, filtres, ouverture du drawer
   panier, sélecteurs langue/devise, animations) une fois le design validé.
3. **Câblage des données** (contenu réel des fichiers produits/traductions, logique de panier,
   persistance `localStorage`) en dernier, une fois la page validée visuellement.

Le plan d'implémentation (écrit séparément via le skill `writing-plans`) suit cet ordre page par
page plutôt que de construire toutes les couches (design, interactions, données) en une seule
passe sur l'ensemble du site.

## 9. Hors périmètre (explicitement exclu de cette phase)

- **Section Compte** (connexion, inscription, tableau de bord, mes commandes, mes adresses) :
  exclue à la demande de l'utilisateur. Un compte n'aurait rien de réel à afficher sans backend,
  et l'achat invité évite la friction de création de compte au lancement. Sera réintroduite en
  phase 2 avec un vrai système d'authentification.
- **Journal/éditorial, boutiques physiques/store locator, programme de fidélité** : explicitement
  écartés par l'utilisateur pour cette phase — pas de pages associées.
- **Paiement réel, authentification réelle, base de données** : voir section 7 (phase 2).

## Décisions clés (récapitulatif)

- Marque : Reign, vêtements & accessoires, catégories Homme/Femme/Enfant/Accessoires.
- Stack : Next.js + TypeScript + Tailwind, `next-intl` pour le i18n.
- Design : noir/blanc premium, accent bleu acier glacé `#3B4A5A`, Fraunces + Inter, logo fourni
  utilisé tel quel en contraste maîtrisé avec le reste de la typographie.
- Langue/devise indépendantes, taux fixe en phase 1.
- Pas de compte, achat invité uniquement, favoris en local.
- Construction page par page : design visuel d'abord, interactions ensuite, données en dernier.
