# Reign — Dashboard premium frontend

**Date :** 3 août 2026  
**Statut :** design approuvé  
**Portée :** frontend du back-office Reign, données simulées persistantes, responsive

## 1. Objectif

Reproduire avec une fidélité presque pixel-perfect les maquettes de référence fournies pour le back-office Reign, puis décliner cette interface sur tablette et mobile. Le résultat doit donner la sensation d'un produit SaaS premium complet, même avant la connexion au futur backend.

Les maquettes fournies constituent la source de vérité pour la hiérarchie, les proportions, les composants, la densité d'information et l'identité visuelle. Les adaptations responsive conservent toutes les fonctions et la même identité.

## 2. Principes visuels

- Palette principale : noir profond, ivoire chaud, blanc cassé et gris neutres.
- Couleurs fonctionnelles : vert pour le succès, ambre pour l'attente, rouge pour l'erreur et bleu pour l'expédition ou l'information.
- Titres éditoriaux et marque en serif élégante ; interface et données en sans-serif nette.
- Bordures fines, rayons modérés, ombres très discrètes et espacement régulier.
- Iconographie exclusivement SVG, principalement Lucide React, avec tailles et épaisseurs uniformes.
- Aucun emoji dans l'interface finale.
- Animations courtes et sobres : tiroirs, panneaux, menus, toasts, changements d'état et skeletons.
- Contrastes, focus visibles et libellés accessibles conformes aux usages d'un produit professionnel.

## 3. Image de connexion

L'image `public/image/hero_3.png` actuelle ne correspond pas à la maquette. Une photographie originale sera recréée : hoodie noir texturé suspendu à un cintre Reign, portant sombre, éclairage éditorial monochrome, contraste profond et espace négatif prévu pour les textes.

Cette image sera générée sans texte ni éléments d'interface incrustés. Le logo, les titres, la langue et les mentions seront rendus en HTML/CSS afin de rester nets, traduisibles, accessibles et responsive.

## 4. Architecture de l'interface

### 4.1 Shell administratif

- Sidebar fixe sur desktop avec marque, navigation, compte et déconnexion.
- Sidebar compacte optionnelle sur écrans intermédiaires.
- Tiroir de navigation avec backdrop et piège de focus sur mobile.
- Topbar avec fil d'Ariane, recherche globale, notifications et profil.
- Zone de contenu fluide avec largeur et espacements adaptés à chaque écran.
- Panneaux de détail latéraux sur desktop et plein écran sur mobile.

### 4.2 Connexion

- Composition en deux colonnes sur desktop et empilement éditorial sur mobile.
- Logo Reign Administration, accroche et message d'accès réservé.
- Identifiant, mot de passe, affichage/masquage, mémorisation et récupération.
- Bouton avec chargement, messages d'erreur et validation accessible.
- Aide administrateur, indication de connexion sécurisée et information 2FA.
- Changement de langue français/anglais.

### 4.3 Vue d'ensemble

- Indicateurs : chiffre d'affaires, commandes, panier moyen et retours.
- Graphique des ventes avec période jour/semaine/mois.
- Répartition des ventes par catégorie.
- Commandes récentes, alertes de stock et actions rapides.
- Sélecteur de période et export simulé.

### 4.4 Produits

- Tableau ou cartes responsive avec recherche, filtres, tri et pagination.
- Sélection multiple et actions groupées.
- Statuts de publication, stock, prix, variantes et canaux.
- Création, édition, duplication, archivage et suppression confirmée.

### 4.5 Ajout et édition d'un produit

- Informations générales et éditeur de description.
- Import d'images par dépôt ou sélection, aperçu, suppression et réorganisation.
- Variantes par taille et couleur, génération des combinaisons et édition en masse.
- SKU, prix, prix comparé, stock, poids et activation par variante.
- Statut, disponibilité, organisation, tags et fournisseur.
- TVA, règle de taxe, expédition, origine et code douanier.
- Aperçu et métadonnées SEO.
- Canaux de vente et publication/brouillon.
- Indicateur de modifications non enregistrées et sauvegarde persistante.

### 4.6 Commandes et retours

- Indicateurs de statut, onglets, recherche et filtres combinables.
- Tableau paginé, sélection multiple et actions groupées.
- Panneau détaillé avec client, timeline, articles, livraison et suivi.
- Création d'expédition, remboursement et ouverture d'un retour.
- Validation/refus du retour, état de l'article, montant et remise en stock.
- Toutes les opérations sensibles nécessitent une confirmation explicite.

### 4.7 Messagerie

- Liste des conversations avec recherche, filtres, assignation et statuts.
- Conversation avec messages entrants/sortants, événements de commande et réponses rapides.
- Composition, pièces jointes simulées, modèles et indicateurs d'envoi.
- Fiche client, commande liée, historique, note privée et tags.
- Présentation à trois colonnes sur grand écran ; navigation progressive sur mobile.

### 4.8 Clients

- Recherche, segments, tri, pagination et fiche détaillée.
- Coordonnées, commandes, dépenses, retours, tags et chronologie.
- Accès rapide aux commandes et à la conversation associée.

### 4.9 Paramètres

- Navigation secondaire : général, paiements, livraison, retours, notifications, WhatsApp, équipe, sécurité et facturation.
- Informations de boutique, identité visuelle, devise, fuseau et adresse.
- Connexions simulées Stripe, PayPal, GeniusPay et WhatsApp Business.
- Préférences de livraison, retours et notifications.
- Gestion simulée des membres et permissions.
- Zone sensible avec confirmation renforcée.
- Indicateur de modifications et sauvegarde persistante.

## 5. Responsive

### Desktop large

La composition suit les maquettes de référence : sidebar visible, tableaux denses, cartes en grille et panneaux latéraux.

### Tablette

La sidebar peut être compacte ou devenir un tiroir. Les cartes passent sur deux colonnes, les formulaires complexes réduisent leur grille et les panneaux de détail utilisent davantage la largeur.

### Mobile

- Navigation dans un tiroir.
- Topbar simplifiée sans perte d'accès fonctionnel.
- Cartes empilées et tableaux convertis en cartes lorsque cela améliore la lecture.
- Défilement horizontal uniquement pour les données réellement tabulaires.
- Panneaux, modales et vues de détail en plein écran.
- Actions principales ancrées en bas lorsque cela facilite les formulaires longs.
- Cibles tactiles d'au moins 44 pixels et aucun contrôle dépendant du survol.

## 6. Données simulées et contrats

La première phase reste frontend, mais les interactions utilisent une couche de données simulée centralisée et typée. Les contrats seront conçus comme ceux d'une future API afin de remplacer le stockage local sans réécrire les composants.

Entités principales :

- `Product`, `ProductVariant`, `ProductMedia` et `SalesChannel` ;
- `Order`, `OrderLine`, `Shipment`, `ReturnRequest` et `Refund` ;
- `Customer`, `CustomerAddress` et `CustomerTag` ;
- `Conversation`, `Message`, `PrivateNote` et `Assignee` ;
- `StoreSettings`, `PaymentConnection`, `NotificationPreference` et `TeamMember`.

Un repository frontend fournit les opérations de lecture et mutation. Il persiste les données dans `localStorage`, simule une courte latence et peut produire des erreurs contrôlées pour tester l'interface. Un jeu de données initial réinitialisable garantit une démonstration cohérente.

## 7. Interactions et états

- Recherche, tri, filtres, pagination et sélections multiples fonctionnels.
- Création, modification, duplication, publication, archivage et suppression persistantes.
- Expédition, retour, remboursement, réponse client et note privée persistants.
- Toasts pour les succès et erreurs non bloquantes.
- Alertes ou modales pour les opérations destructrices ou financières.
- Skeletons pour les chargements initiaux, boutons occupés pour les mutations.
- États vides contextualisés avec action principale.
- États d'erreur avec message précis et possibilité de réessayer.
- Détection hors ligne avec maintien des données locales et information claire.
- Navigation clavier complète, focus restauré après fermeture des overlays et annonces accessibles pour les changements importants.

## 8. Composants partagés

- `AdminShell`, `AdminSidebar`, `AdminTopbar`, `Breadcrumbs` ;
- `PageHeader`, `MetricCard`, `DataTable`, `FilterBar`, `Pagination` ;
- `StatusBadge`, `EmptyState`, `Skeleton`, `Toast`, `ConfirmDialog` ;
- `Drawer`, `Modal`, `DropdownMenu`, `Tabs`, `Toggle`, `Tooltip` ;
- `FormField`, `SelectField`, `SearchField`, `RichTextEditor`, `MediaUploader` ;
- composants métier pour produits, commandes, retours, messages, clients et paramètres.

Chaque composant possède une responsabilité claire, des propriétés typées et des variantes visuelles limitées aux besoins validés.

## 9. Gestion des erreurs

- Validation de formulaire avant mutation avec messages attachés aux champs.
- Rollback de l'état optimiste lorsqu'une mutation simulée échoue.
- Prévention des doubles soumissions.
- Confirmation des suppressions, remboursements, refus de retour et désactivation de boutique.
- Conservation des saisies lors d'une erreur récupérable.
- Boundary de page pour empêcher une erreur locale de casser tout le dashboard.

## 10. Tests et critères d'acceptation

### Tests

- Tests unitaires des repositories, filtres, tris, pagination et règles de transition d'état.
- Tests de composants pour les formulaires, overlays, tableaux et états asynchrones.
- Tests d'intégration des parcours produit, commande, retour, message et paramètres.
- Tests end-to-end des parcours critiques et de la persistance après rechargement.
- Contrôles visuels desktop, tablette et mobile contre les maquettes.
- Vérifications clavier, focus, contrastes et libellés accessibles.

### Acceptation

- Le build de production, TypeScript, ESLint et la suite de tests passent.
- Les écrans desktop correspondent visuellement aux maquettes validées.
- Les adaptations tablette et mobile conservent toutes les actions essentielles.
- Aucune icône emoji ou bitmap n'est utilisée pour les contrôles d'interface.
- Les données et mutations restent présentes après rechargement.
- Chaque action propose un retour visuel clair.
- Les opérations sensibles demandent une confirmation.
- La couche simulée peut être remplacée par des appels API sans modifier les composants de présentation.

## 11. Hors périmètre de cette phase

- Authentification et autorisation serveur réelles.
- Base de données, API et stockage distant des médias.
- Paiements, remboursements, expéditions et WhatsApp réels.
- Webhooks, emails transactionnels et notifications push réels.
- Déploiement de production et observabilité backend.

Ces éléments seront traités après validation complète du frontend et utiliseront les contrats définis dans cette phase.
