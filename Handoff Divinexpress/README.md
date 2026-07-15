# Handoff: DivinExpress — Site Ecommerce & Dashboard Marchand

## Overview
Wireframes bas-fidélité couvrant le parcours client complet du site ecommerce DivinExpress (running/sportswear) et le back-office marchand (dashboard). Objectif: poser la structure, la hiérarchie de contenu et les flows avant l'implémentation en code de production.

## About the Design Files
Les fichiers de ce bundle sont des **références de conception réalisées en HTML** — des maquettes montrant la structure et le comportement voulus, pas du code à copier tel quel. La tâche consiste à **recréer ces wireframes dans l'environnement de code cible** (React, Vue, Next.js, etc. — ou le framework le plus adapté si aucun n'existe encore), en appliquant le design system DivinExpress (tokens de couleur, typographie Inter, composants) pour le rendu visuel final.

## Fidelity
**Basse-fidélité (lofi)** — Les écrans utilisent des blocs de remplissage (hachures = placeholders image), des lignes en pointillés (= champs de formulaire), des bordures épaisses noires génériques. Ils indiquent structure, hiérarchie et flow, PAS le rendu visuel final. Le développeur doit implémenter le layout/la fonctionnalité décrits ici en appliquant le design system DivinExpress existant (voir "Design Tokens" ci-dessous) pour les couleurs, la typographie, les rayons, les ombres et les états interactifs réels.

## Structure du site

### Ecommerce (public)
1. **Accueil** (3 variantes: 1a hero plein cadre, 1b split catégories, 1c mobile)
2. **Liste produits / PLP** (1d) — filtres latéraux + grille produits
3. **Fiche produit / PDP** (3 variantes: 1e galerie empilée, 1f galerie grille + panneau sticky, 1g mobile)
4. **Panier** (1h desktop, inclus dans 1k mobile)
5. **Checkout** (1i desktop, 1k mobile) — étapes livraison/paiement/confirmation sur une page
6. **Compte client** (1j) — historique de commandes, adresses, favoris
7. **Suivi de colis** (1l) — recherche par n° commande + email, timeline de statut
8. **Pages légales**: À propos (1m), Mentions légales (1n), Confidentialité/RGPD (1o), Gestion des cookies (1p, bandeau + préférences)

### Dashboard marchand (back-office)
1. **Commandes** — liste dense (2a), liste + panneau détail split (2b), page détail dédiée (2c)
2. **Catalogue produits** (2d) — liste avec stock/statut
3. **Ajout de produit** (2e) — formulaire
4. **Analytics** (2f) — KPIs, graphique ventes, top produits

## Layout & Components (par écran)

### Header (toutes pages ecommerce, desktop)
- Bande noire pleine largeur (44px) : icônes réseaux sociaux à gauche, sélecteur de devise à droite (EUR €, GBP £, USD $, FCFA — EUR par défaut, sélection selon pays/continent détecté)
- Barre principale : logo DX (cercle noir 34px, texte blanc "DX") + wordmark "DIVINEXPRESS" à gauche · nav catégories centrée (Homme/Femme/Running/Sale) · à droite : icône recherche (loupe seule, pas de champ visible par défaut), lien "Suivi de commande" (souligné), icône panier avec compteur
- Mobile : bande devise seule en haut, puis barre ☰ menu / logo / recherche+panier, lien suivi de commande sous le header

### Hero + Slider promo (Accueil)
- Bloc hero pleine largeur avec titre + CTA overlay bas-gauche
- Juste sous le hero : slider promo horizontal (flèches gauche/droite + dots de pagination), bandeau code promo

### Footer (Accueil, pleine largeur)
- Fond noir. Rangée d'icônes/logos de moyens de paiement : Visa, Mastercard, PayPal, Orange Money, MTN Money, Wave
- Liens légaux : À propos, Mentions légales, Confidentialité, Cookies
- Copyright

### Dashboard sidebar (toutes pages back-office)
- Colonne fixe ~170px, fond blanc, bordure droite noire 2px
- Wordmark en haut, puis nav verticale : Commandes / Catalogue / Analytics / Paramètres (item actif en gras)

## Interactions & Behavior
- Sélecteur de devise : dropdown, persiste le choix utilisateur (localStorage recommandé), pré-sélection auto par géolocalisation/pays avec fallback EUR
- Slider promo : auto-rotate + navigation manuelle (flèches, dots cliquables)
- Filtres PLP : cases à cocher, multi-sélection, mise à jour de la grille sans reload (client-side ou requête filtrée)
- Sélecteur de taille/couleur PDP : état sélectionné = bordure rouge (urgence/dernier stock) ou noire (sélection normale) selon design system ; taille indisponible = griséisée
- "Only X left" : texte rouge, affiché dynamiquement si stock ≤ seuil (ex: 3)
- Bandeau cookies (1p) : position fixe bas d'écran, 2 CTAs (Personnaliser / Tout accepter), doit respecter RGPD (refus aussi facile que acceptation — prévoir un 3e état "Tout refuser" si legal l'exige)
- Suivi de colis : formulaire (n° commande + email) → timeline de statut (Commandée/Confirmée/Expédiée/Livrée), étapes passées = point plein noir, étape future = point vide
- Dashboard commandes : filtres par statut (chips), clic sur une ligne → panneau détail (2b) ou navigation page détail (2c)
- Ajout produit (2e) : formulaire standard + upload images (multi), actions Publier / Enregistrer brouillon

## State Management
- Devise sélectionnée (contexte global, persisté)
- Panier (items, quantités, totaux) — contexte global ou store, persisté (session/localStorage ou backend selon auth)
- Filtres PLP (état d'URL/query params recommandé pour partage de lien)
- Statut de commande (dashboard) : Toutes / En attente / Expédiées / Remboursées
- Consentement cookies (persisté, avec date de consentement pour audit RGPD)

## Design Tokens
À reprendre depuis le design system DivinExpress (voir bundle `_ds/`) :
- **Couleurs**: noir `#0a0a0a` / blanc, vert (promo/succès), rouge (urgence, discret) — pas de palette grise de marque, gris = structurel uniquement
- **Typographie**: Inter uniquement. Display = weight 800, tracking négatif. Labels/eyebrows = tracking positif large, uppercase. Body = sentence case, line-height 1.45–1.5
- **Espacement**: base 4px, gaps de section généreux (96px), gouttières de page 32px
- **Rayons**: carré/4px par défaut (cards, tiles) ; pill (`radius-pill`) réservé aux boutons et badges prix/statut
- **Bordures**: hairline 1px gris clair (cards/dividers) ; 2px noir plein pour les éléments interactifs/sélectionnés
- **Ombres**: minimales, cards plates (pas d'ombre au repos), `shadow-lg` uniquement sur dialogs/toasts
- **Animation**: 160–220ms, ease-out, pas d'effet ressort — réservée aux changements d'état

## Assets
- **Logo**: aucun fichier fourni — utiliser un cercle noir plein avec "DX" en blanc (voir wireframe), à remplacer si un logo réel existe
- **Photos produits/campagne**: aucune photo fournie — tous les visuels sont des placeholders étiquetés, à remplacer par la photographie produit réelle
- **Icônes moyens de paiement** (Visa, Mastercard, PayPal, Orange Money, MTN Money, Wave): représentés en texte dans le wireframe — utiliser les logos officiels réels (respecter les chartes graphiques de chaque prestataire) en production
- **Icônes UI**: le design system recommande Lucide (1.5px stroke, outline) comme set neutre — swap si le client a un set de marque

## Files
- `Wireframes DivinExpress.dc.html` — toutes les pages listées ci-dessus, organisées en options cliquables (1a, 1b, 2a... = ancres dans le fichier)
- Design system source: `_ds/divinexpress-design-system-3f204eed-c521-45a5-a73b-62cb1b0a0a70/` (tokens CSS, composants, guide de style) — inclus séparément, à consulter pour les valeurs exactes de couleur/typo/espacement
