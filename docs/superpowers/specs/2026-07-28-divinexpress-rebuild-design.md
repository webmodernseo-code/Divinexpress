# Spécification Technique : Refonte de DivinExpress en Next.js

Ce document définit les spécifications pour porter à l'identique la boutique statique et son panneau d'administration dans une application **Next.js 14 (App Router)** avec **Supabase** (Base de données et Authentification) et **next-intl** (Multilingue Français/Anglais).

---

## 1. Objectifs & Contraintes de Non-Modification

> [!IMPORTANT]
> **Le dossier `/DivinExpress` est en lecture seule**. Il sert uniquement de référence statique d'origine (blueprint). Nous n'y modifierons rien et nous n'y ajouterons aucun fichier. Toute l'implémentation active se fera à la racine du projet (`/app`, `/components`, `/lib`, etc.).

> [!IMPORTANT]
> **Pas de collision d'agents** : Les fichiers d'agents locaux (comme `.git`, `.claude`, `.superpowers`) ont été nettoyés de `/DivinExpress`. Le seul agent actif est celui configuré à la racine du dépôt.

* **Fidélité visuelle 100%** : Le design, les couleurs (thème sombre/clair de l'administration, boutique claire haut de gamme), les animations, la structure et le comportement fonctionnel du panier, des favoris et des onglets d'administration seront reproduits au pixel près en important les fichiers CSS d'origine.
* **Support Bilingue (FR / EN)** : Les URL utiliseront des préfixes `/fr` et `/en`. Les textes statiques proviendront de fichiers JSON de dictionnaire (`/messages/fr.json` et `/messages/en.json`).

---

## 2. Architecture des Dossiers

L'application Next.js 14 utilisera la structure suivante :

```
/ (Racine - Projet Next.js)
├── app/
│   ├── [locale]/             <-- Regroupe la boutique bilingue public
│   │   ├── layout.tsx        <-- Layout boutique (charge storefront.css)
│   │   ├── page.tsx          <-- Accueil (boutique principale)
│   │   ├── legal/page.tsx    <-- Mentions Légales
│   │   ├── privacy/page.tsx  <-- Politique de Confidentialité
│   │   └── terms/page.tsx    <-- CGV (Conditions Générales de Vente)
│   ├── admin/                <-- Regroupe l'administration privée
│   │   ├── layout.tsx        <-- Layout admin (charge admin.css)
│   │   ├── login/page.tsx    <-- Page de connexion (Supabase Auth)
│   │   └── dashboard/page.tsx <-- Tableau de bord d'administration
│   ├── globals.css           <-- Variables CSS globales et Tailwind CSS
│   └── middleware.ts         <-- Routage des langues et protection de la zone admin
├── messages/
│   ├── fr.json               <-- Traducteur Français
│   └── en.json               <-- Traducteur Anglais
├── prisma/
│   └── schema.prisma         <-- Définition des tables PostgreSQL
└── DivinExpress/             <-- UNIQUE SOURCE DE RÉFÉRENCE STATIQUE (Intouchée)
```

---

## 3. Logique Applicative & Flux de Données

### A. Boutique Publique
1. **Rendu Dynamique** : Les produits et leurs variantes (taille, couleur, stock) seront lus depuis PostgreSQL via Prisma dans les Server Components de Next.js.
2. **Panier & Favoris** : L'état local du panier et des favoris sera géré en React et stocké dans le `localStorage` de l'utilisateur (`DivinExpress_cart` et `DivinExpress_favorites`).
3. **Traduction** : Les titres et descriptions des produits seront récupérés dans la langue active (`nameFr`/`nameEn` et `descriptionFr`/`descriptionEn` dans la base de données). Les textes statiques de l'interface utiliseront `next-intl`.
4. **Validation des Achats** : Lors du passage de la commande, une Server Action ou route API Next.js :
   * Validera le code promo dans la base de données (`DiscountCode`).
   * Enregistrera la commande dans les tables `Order` et `OrderItem`.
   * Diminuera les stocks des variantes sélectionnées.

### B. Panneau d'Administration
1. **Authentification** : Protégé par **Supabase Auth**. Une session active est requise pour accéder aux routes sous `/admin/dashboard`. Le `middleware.ts` bloquera et redirigera les utilisateurs non connectés vers `/admin/login`.
2. **Gestion en Temps Réel** :
   * Liste des commandes : Récupérée en temps réel depuis la table `Order`. Modification du statut ("En attente", "Payée", "Expédiée", "Annulée") directement enregistrée en base.
   * Liste des produits : Gestion (Ajout, modification, suppression) des produits, variantes et images synchronisée avec les tables Prisma correspondantes.
   * Codes de réduction : Ajout ou suppression de codes promos persistés en base.

---

## 4. Plan de Vérification

### Tests Manuels
* **Navigation & Langue** : Vérifier que le changement de langue bascule correctement entre `/fr` et `/en`, et que les dictionnaires JSON traduisent l'interface.
* **Processus d'Achat** : Ajouter un produit au panier, appliquer un code promo (`DIVINE10` ou `DIVINE15`), valider le checkout et s'assurer que la commande est bien créée dans la base de données PostgreSQL de Supabase.
* **Sécurité Admin** : Tenter d'accéder à `/admin/dashboard` sans session active et vérifier la redirection vers `/admin/login`.
* **Dashboard** : Modifier le statut d'une commande et s'assurer qu'il se met à jour instantanément.
