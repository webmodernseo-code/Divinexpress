# Reign — Finition premium et durcissement fonctionnel du dashboard

**Date :** 3 août 2026  
**Statut :** design validé  
**Portée :** dashboard frontend uniquement, données simulées persistantes, préparation des contrats full-stack

## 1. Objectif

Finaliser le dashboard Reign avant toute connexion à un backend réel. Cette phase corrige les incohérences visuelles, uniformise l’iconographie SVG, améliore la fluidité responsive et rend fonctionnelles toutes les actions exposées dans l’interface avec une couche de données simulée persistante.

La boutique publique n’est pas modifiée dans ce chantier, sauf si une dépendance partagée empêche le dashboard de fonctionner. Les connexions Vercel, GitHub, Neon, stockage, authentification et API seront traitées dans une phase ultérieure, après validation complète du frontend.

## 2. Ordre de livraison

Le travail progresse par fondations puis par domaines :

1. consolider le shell, la connexion, la vue d’ensemble et les composants partagés ;
2. finaliser les parcours produits et commandes ;
3. finaliser les retours, messages, clients et paramètres ;
4. valider la persistance, l’accessibilité, le responsive et les états d’erreur ;
5. documenter les contrats nécessaires au futur backend.

Chaque étape produit un dashboard utilisable et testable. Aucun écran ne doit afficher une action sans comportement réel ou retour explicite indiquant qu’elle est simulée.

## 3. Direction visuelle

Le dashboard adopte une esthétique SaaS éditoriale haut de gamme : noir profond, ivoire chaud, surfaces blanches, gris neutres et couleurs fonctionnelles sobres. Les titres de niveau page utilisent la serif de marque ; les contrôles, tableaux et données utilisent la sans-serif d’interface.

Les règles suivantes sont obligatoires :

- iconographie d’interface exclusivement en SVG React, avec Lucide comme source principale ;
- aucune icône emoji, caractère Unicode décoratif ou image bitmap dans un contrôle ;
- tailles d’icônes limitées à une échelle cohérente et épaisseur de trait uniforme par famille de composants ;
- bordures fines, ombres discrètes, rayons et espacements définis par des primitives partagées ;
- transitions courtes sur menus, tiroirs, modales, toasts et changements d’état ;
- désactivation ou réduction des mouvements non essentiels avec `prefers-reduced-motion` ;
- contrastes lisibles, focus visible et zones tactiles d’au moins 44 pixels sur mobile.

## 4. Architecture

### 4.1 Shell administratif

`AdminShell` constitue l’unique cadre des routes administratives. Il orchestre la sidebar, la topbar, la recherche, les notifications, le profil, les breadcrumbs et la navigation responsive. La navigation desktop peut être réduite ; sur mobile elle devient un tiroir accessible avec verrouillage du scroll, fermeture par `Escape`, piège de focus et restauration du focus au déclencheur.

Le shell ne contient aucune logique métier des produits, commandes ou autres domaines. Il expose seulement la structure et les points d’intégration nécessaires aux pages.

### 4.2 Bibliothèque de composants

Les composants partagés couvrent au minimum : boutons, champs, sélecteurs, recherche, cartes, indicateurs, badges, tableaux, filtres, pagination, onglets, menus, modales, tiroirs, dialogues de confirmation, toasts, skeletons, états vides et états d’erreur.

Chaque composant possède une responsabilité claire, des propriétés TypeScript explicites, des variantes limitées aux besoins validés et un comportement clavier testable. Les pages métier composent ces primitives sans dupliquer leurs styles ou leurs comportements asynchrones.

### 4.3 Domaines métier

Chaque domaine possède ses propres composants et règles isolées :

- produits et variantes ;
- commandes, expéditions et remboursements simulés ;
- retours et remise en stock ;
- conversations, messages et notes privées ;
- clients, tags et historique ;
- paramètres de boutique et connexions simulées.

Les composants de présentation consomment des contrats du repository et ne lisent ni n’écrivent directement dans `localStorage`.

### 4.4 Couche de données

Le repository frontend typé est l’unique accès aux données simulées. Il fournit des lectures et mutations asynchrones, persiste les données dans `localStorage`, simule une courte latence et permet de déclencher des erreurs contrôlées pour les tests.

Les interfaces du repository ne dépendent pas du stockage local. Une future implémentation serveur pourra utiliser Neon et des routes Next.js sans changer les interfaces consommées par les composants.

## 5. Parcours fonctionnels

### 5.1 Connexion

La connexion valide les champs, permet d’afficher ou masquer le mot de passe, empêche les doubles soumissions, montre un état occupé, affiche une erreur simulée précise et redirige vers le dashboard en cas de succès. La session reste simulée pendant cette phase, mais l’interface de session est conçue pour accueillir ensuite une authentification serveur.

### 5.2 Vue d’ensemble

Les indicateurs, graphiques et listes utilisent les données du repository. Les sélecteurs de période mettent réellement à jour les agrégats. L’export produit un fichier local simulé cohérent ou indique clairement son statut. Les actions rapides naviguent vers un parcours fonctionnel.

### 5.3 Produits

La liste prend en charge recherche, filtres, tri, pagination, sélection multiple et actions groupées. La création, l’édition, la duplication, la publication, l’archivage et la suppression confirmée sont persistantes. Les formulaires conservent les saisies après erreur récupérable et signalent les modifications non enregistrées.

### 5.4 Commandes et retours

Les listes proposent recherche, filtres, tri, pagination et détail. Les transitions de statut respectent des règles explicites. L’expédition, le suivi, le remboursement, l’ouverture d’un retour, sa validation ou son refus et la remise en stock sont simulés mais persistants. Toute opération financière ou destructive demande une confirmation explicite.

### 5.5 Messages et clients

Les conversations, réponses, notes privées, assignations et statuts sont persistants. La recherche et les filtres modifient réellement les résultats. Les fiches client permettent d’accéder aux commandes et conversations associées sans dupliquer les données.

### 5.6 Paramètres

Les formulaires de boutique, livraison, retours, notifications, équipe et sécurité persistent leurs valeurs. Les connexions externes sont clairement identifiées comme simulées. Les actions sensibles exigent une confirmation renforcée et les modifications non sauvegardées sont visibles.

## 6. États, erreurs et accessibilité

Chaque lecture asynchrone possède un état de chargement, vide, succès et erreur récupérable. Chaque mutation affiche un état occupé et un retour succès ou erreur. Les doubles soumissions sont bloquées et les mises à jour optimistes sont annulées après échec.

Les erreurs de formulaire sont liées aux champs concernés. Les saisies sont conservées lorsque la récupération est possible. Une erreur locale ne doit pas casser l’intégralité du dashboard.

Les overlays fonctionnent au clavier, maintiennent le focus dans leur surface, se ferment de façon prévisible et restaurent le focus au déclencheur. Les changements importants sont annoncés aux technologies d’assistance. Aucun comportement essentiel ne dépend du survol.

## 7. Responsive et fluidité

Sur desktop, la sidebar reste visible, les tableaux conservent leur densité et les détails utilisent des panneaux latéraux. Sur tablette, la navigation se compacte, les grilles passent à deux colonnes et les panneaux utilisent davantage de largeur. Sur mobile, la navigation devient un tiroir, les cartes s’empilent et les détails ou formulaires complexes occupent tout l’écran.

Les tableaux deviennent des cartes lorsque la comparaison entre colonnes n’est pas essentielle. Le défilement horizontal est réservé aux données réellement tabulaires. Les actions principales restent accessibles sans masquer le contenu ni provoquer de débordement.

## 8. Tests et validation

Les changements fonctionnels suivent un cycle TDD : test en échec observé, implémentation minimale, test passant, puis refactorisation.

La validation comprend :

- tests unitaires des repositories, agrégats, filtres, tris, pagination et transitions d’état ;
- tests de composants pour les formulaires, tableaux, overlays et états asynchrones ;
- tests d’intégration des parcours produit, commande, retour, message, client et paramètres ;
- vérification de la persistance après rechargement ;
- contrôle TypeScript, ESLint, suite Vitest et build de production ;
- inspection visuelle des routes principales en desktop, tablette et mobile ;
- audit des SVG, focus, contrastes, libellés accessibles et cibles tactiles ;
- vérification qu’aucun contrôle visible ne reste sans comportement ou retour explicite.

## 9. Critères d’acceptation

La phase frontend est validée lorsque :

- toutes les routes du dashboard s’affichent sans erreur aux formats desktop, tablette et mobile ;
- toutes les actions visibles déclenchent un comportement fonctionnel et persistant, ou un retour explicite pour une simulation volontaire ;
- l’iconographie des contrôles est exclusivement SVG et visuellement cohérente ;
- les parcours critiques restent utilisables au clavier et avec réduction des mouvements ;
- les chargements, erreurs, états vides et confirmations sont présents ;
- les tests, le typage, le lint et le build de production réussissent ;
- aucun secret, identifiant de production ou connexion externe réelle n’est requis pour démontrer le dashboard ;
- les contrats du repository permettent de préparer le remplacement par une implémentation serveur.

## 10. Phase full-stack ultérieure

Après validation du frontend, une spec indépendante définira :

- le déploiement Vercel et les environnements preview/production ;
- la synchronisation GitHub et la stratégie de branches ;
- le schéma Neon, les migrations et la stratégie de données initiales ;
- l’authentification, les rôles et la protection des routes ;
- le stockage des médias ;
- les routes serveur, webhooks et intégrations de paiement ou messagerie ;
- la gestion des variables d’environnement et la rotation des secrets ;
- les sauvegardes, journaux, alertes et tests de déploiement.

Cette phase ne commencera pas avant la validation des critères d’acceptation frontend.
