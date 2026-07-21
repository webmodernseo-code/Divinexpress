# DivinExpress — Dashboard "Vue d'ensemble" & Topbar Redesign — Design Spec

## Contexte
Le socle du dashboard admin (auth, sidebar, layout, page "Vue d'ensemble" minimale) est en place et vérifié en production locale. L'utilisateur a fourni 5 captures d'un dashboard e-commerce premium SaaS de référence et constate que le rendu actuel de "Vue d'ensemble" est beaucoup plus sommaire (deux compteurs + un tableau simple) que ces captures. Il souhaite maintenant faire correspondre le rendu visuel à ces captures avant de continuer sur les sous-projets fonctionnels (Produits, Commandes, etc.).

Décisions validées pendant le brainstorming :
* La barre du haut (recherche, statut boutique, notifications, profil) des captures n'existe pas encore — elle est incluse dans ce chantier.
* Toutes les données affichées doivent être réelles (dérivées de la base), jamais fictives. Là où une fonctionnalité n'existe pas encore (Retours), l'élément correspondant est masqué plutôt que simulé.
* Palette : reprendre la palette colorée des captures (violet/orange/vert/bleu pour les icônes de stats), pas la palette noir/blanc/crème du reste du site public.

## Buts
1. Ajouter une barre du haut au-dessus du contenu du dashboard : recherche (visuelle, non fonctionnelle pour l'instant), pastille "Boutique en ligne" (statique), cloche de notifications (décorative), menu profil (prénom réel + bouton de déconnexion fonctionnel).
2. Ajouter un champ `name` au modèle `Admin`, alimenté via le script de seed existant (nouvelle variable d'environnement `ADMIN_SEED_NAME`), utilisé pour le message d'accueil.
3. Reconstruire "Vue d'ensemble" pour reprendre la structure des captures : message d'accueil personnalisé, 4 cartes d'actions rapides, 3 cartes de statistiques réelles, un graphique du chiffre d'affaires réel (14 derniers jours), un panneau "Stock faible" réel, un panneau "Activité récente" dérivé de données réelles, et le tableau "Commandes récentes" déjà existant.
4. Introduire une palette de couleurs d'accent (violet/orange/vert/bleu) dans les tokens de design, réutilisable par les futurs sous-projets (badges de statut sur Commandes/Retours, etc.).

## Hors périmètre
* Recherche fonctionnelle (le champ est visuel uniquement, pas de logique de recherche réelle).
* Système de notifications réel (la cloche est décorative, sans badge de compteur).
* Bascule fonctionnelle "3 mois" / "12 mois" sur le graphique — seule la vue "14 derniers jours" est branchée à de vraies données ; les deux autres boutons restent visibles mais inertes pour cette étape.
* Carte de statistique "Retours en cours" — masquée (pas de modèle de données `Return`).
* Toute nouvelle dépendance npm (pas de librairie de graphiques) — le graphique est un composant SVG fait main, cohérent avec le reste du code base (aucune lib UI utilisée nulle part ailleurs).
* Gestion précise des fuseaux horaires — les bornes "aujourd'hui"/"hier" utilisent l'heure locale du serveur (acceptable pour un outil interne à un seul utilisateur).
* Agrégation multi-devises — les statistiques de ventes ne totalisent que les commandes en EUR (devise principale du site) ; les commandes dans d'autres devises ne sont pas comptabilisées dans ces cartes pour cette étape (évite de sommer des montants dans des devises différentes comme s'ils étaient équivalents).

## Spécifications Techniques

### 1. Palette d'accent (`app/styles/tokens.css`, modifié)
Ajout de nouvelles variables (ne remplacent aucun token existant) :
```css
--dash-purple: #7c3aed;
--dash-purple-bg: #ede9fe;
--dash-orange: #f59e0b;
--dash-orange-bg: #fef3c7;
--dash-green: #10b981;
--dash-green-bg: #d1fae5;
--dash-blue: #3b82f6;
--dash-blue-bg: #dbeafe;
--dash-red: #ef4444;
--dash-red-bg: #fee2e2;
```

### 2. Champ `name` sur `Admin` (`prisma/schema.prisma`, migration)
```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String
  role         String   @default("admin")
  createdAt    DateTime @default(now())
}
```
* `name` est optionnel (`String?`) pour ne pas casser le compte déjà seedé sans données de migration destructive.
* `prisma/seed.ts` : ajout de `ADMIN_SEED_NAME` (optionnel) à l'upsert existant (`update: { name: adminName ?? undefined, ... }`).
* `.env.example` : documente `ADMIN_SEED_NAME=`.
* L'utilisateur ajoutera `ADMIN_SEED_NAME=Dorcas` à son `.env` local et relancera `npm run db:seed` pour mettre à jour son compte existant (upsert, non destructif).

### 3. Lecture de la session dans le layout protégé (`app/admin/(dashboard)/layout.tsx`, modifié)
* Le layout devient asynchrone : lit le cookie `admin_session` via `cookies()`, le vérifie avec `verifySessionToken` (`@/lib/adminSession`), récupère `admin.name`/`admin.email` via `prisma.admin.findUnique({ where: { id: adminId } })`.
* Le layout est déjà protégé par le middleware (toute requête sans session valide est déjà redirigée avant d'atteindre ce layout) — cette lecture ne fait donc que récupérer les infos d'affichage, elle ne réimplémente pas la vérification d'accès.
* Passe `name`/`email` en props à la nouvelle `<AdminTopbar />`.

### 4. Barre du haut (`components/Admin/AdminTopbar.tsx` + `.module.css`, nouveaux)
* Recherche : `<input>` stylé avec icône loupe + raccourci visuel "⌘K" à droite, `disabled` ou sans `onChange` fonctionnel (purement visuel pour cette étape).
* Pastille "Boutique en ligne" : point vert + texte, statique (le site public est toujours en ligne).
* Cloche de notifications : icône SVG, pas de badge de compteur (pas de système de notifications).
* Menu profil : avatar rond avec initiales, `name` affiché à côté, chevron. Initiales = deux premiers caractères (majuscules) de `name` s'il est renseigné (ex. "Dorcas" → "DO"), sinon deux premiers caractères de la partie locale de l'email (avant le `@`). Au clic, un petit menu déroulant avec un unique item "Déconnexion" qui soumet vers `/admin/logout` (réutilise la route existante).

### 5. Requêtes de données (`app/admin/(dashboard)/page.tsx`, réécrit)
Toutes les requêtes utilisent `prisma` (`@/lib/prisma`), exécutées en parallèle via `Promise.all`.
* **Ventes aujourd'hui** : somme de `totalCents` des commandes `currency: 'EUR'` avec `createdAt` dans la journée en cours. **vs hier** : même somme pour la journée précédente ; variation en % = `(aujourd'hui - hier) / hier * 100`, affichée seulement si `hier > 0`, sinon affiche "—" (pas de division par zéro / `Infinity`/`NaN`).
* **Commandes à traiter** : `prisma.order.count({ where: { status: 'PAID' } })` (payées mais pas encore expédiées/`FULFILLED`).
* **Panier moyen** : moyenne de `totalCents` sur les commandes `currency: 'EUR'` des 30 derniers jours ; affiche "—" si aucune commande sur la période (évite une division par zéro).
* **Graphique 14 jours** : `prisma.order.findMany` filtré sur `currency: 'EUR'` et `createdAt >= (aujourd'hui - 13 jours)`, regroupé par jour calendaire côté application (Prisma n'a pas de `groupBy` par date tronquée simple ici), sommé en `totalCents` par jour, 14 points (jours sans commande = 0).
* **Stock faible** : `prisma.productVariant.findMany({ where: { stock: { lt: 10 } }, orderBy: { stock: 'asc' }, take: 5, include: { product: true } })`.
* **Activité récente** : `prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })` + `prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })`, fusionnés et triés par `createdAt` décroissant côté application, les 5 plus récents affichés avec un horodatage relatif ("il y a X minutes/heures/jours").
* **Commandes récentes** : inchangé (déjà implémenté), `take: 5`.

### 6. Composant graphique (`components/Admin/RevenueChart.tsx` + `.module.css`, nouveaux)
* SVG fait main (pas de librairie) : un `<path>` de ligne + un `<path>` de remplissage en dégradé (`<linearGradient>`), axes X (dates format court "4 juil.") et Y (échelle automatique arrondie), point final mis en évidence — reproduit le style de la capture.
* Props : `{ data: { date: string; totalCents: number }[] }` — composant pur, testable indépendamment du data-fetching.

### 7. Réécriture de "Vue d'ensemble" (`app/admin/(dashboard)/page.tsx` + `page.module.css`)
Structure, de haut en bas :
1. En-tête : "Bonjour {name} 👋" + sous-titre, boutons "Voir les produits" (lien vers `/admin/produits`) et "Ajouter un produit" (lien vers `/admin/produits`, les deux vers la même page stub pour l'instant puisque la gestion produits n'est pas encore construite).
2. 4 cartes d'actions rapides (icônes colorées violet/orange/vert/bleu) : Ajouter des produits → `/admin/produits`, Créer une réduction → `/admin/reductions`, Traiter les commandes → `/admin/commandes`, Publier un article → `/admin/blog`.
3. 3 cartes de statistiques réelles (Ventes aujourd'hui, Commandes à traiter, Panier moyen), icônes colorées assorties.
4. `<RevenueChart>` dans une carte avec boutons de période (14 jours actif/fonctionnel, 3 mois/12 mois visuellement présents mais inertes) et le total de la période affiché au-dessus.
5. Deux panneaux côte à côte : "Stock faible" (miniatures produits + badge de stock) et "Activité récente" (icône + description + horodatage relatif).
6. Tableau "Commandes récentes" (inchangé).

## Critères d'acceptation
1. La barre du haut s'affiche sur toutes les pages du dashboard (elle vit dans le layout partagé), avec le prénom réel de l'admin connecté et un menu profil dont le bouton "Déconnexion" fonctionne réellement.
2. Après avoir renseigné `ADMIN_SEED_NAME` et relancé le seed, le message d'accueil affiche le bon prénom sans recréer le compte (upsert non destructif, mot de passe inchangé).
3. Les 3 cartes de statistiques affichent des valeurs réelles cohérentes avec le contenu de la base (vérifiable en comparant avec une requête directe) ; aucune ne plante ni n'affiche `NaN`/`Infinity` quand il n'y a pas encore de commandes.
4. Le graphique affiche 14 points réels (même à plat/zéro actuellement) sans erreur ; les boutons "3 mois"/"12 mois" sont visibles mais ne changent pas le graphique (pas de crash au clic).
5. "Stock faible" affiche les vraies variantes dont le stock est inférieur à 10, triées par stock croissant.
6. "Activité récente" affiche un mélange réel de commandes et produits récents, trié par date décroissante, avec horodatage relatif correct.
7. Aucune carte "Retours en cours" n'apparaît nulle part sur la page.
8. La palette violet/orange/vert/bleu des captures est utilisée pour les icônes de cartes (actions rapides + statistiques), cohérente avec les nouvelles variables `--dash-*` de `tokens.css`.
9. Aucune nouvelle dépendance npm (`package.json` `dependencies` inchangé). `npx tsc --noEmit` et `npm run lint` passent sans erreur, la suite de tests existante continue de passer.
10. Vérification visuelle manuelle sur `http://localhost:3000/admin` avec un vrai compte connecté, comparée côte à côte aux captures fournies par l'utilisateur.
