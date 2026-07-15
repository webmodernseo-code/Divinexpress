# DivinExpress — E-commerce vêtements : Feuille de route & Phase 0 (Fondations)

## Contexte et objectifs

DivinExpress.fr est un site e-commerce de vente de vêtements, avec :
- des moyens de paiement bancaires classiques (carte bancaire, international) ;
- des moyens de paiement adaptés à l'Afrique de l'Ouest (mobile money : Orange Money, MTN Money, Wave, etc.) ;
- un dashboard d'administration pour gérer catalogue, commandes et clients ;
- un travail de visibilité SEO dès la conception (voir le skill `ecommerce-seo` déjà créé dans `.agents/skills/ecommerce-seo/`).

Un design system (wireframes + tokens) existe déjà dans `Design système ecommerce Divinexpress/` et sert de référence visuelle pour toute l'intégration front.

Le projet est trop large pour un seul plan d'implémentation ; il est découpé en sous-projets (phases), chacun avec son propre cycle spec → plan → implémentation. Ce document couvre :
1. La feuille de route complète (vue d'ensemble, non détaillée phase par phase).
2. Les décisions d'architecture et de modèle de données, valables pour tout le projet.
3. Le détail complet de la **Phase 0 — Fondations**, le sous-projet à implémenter en premier.

## Feuille de route (vue d'ensemble)

| Phase | Nom | Contenu |
|---|---|---|
| 0 | Fondations | Scaffold Next.js, intégration design system (tokens/CSS), base de données + Prisma, i18n, déploiement |
| 1 | Catalogue | Modèles produits/catégories/variantes, pages catégorie et produit, recherche/filtres |
| 2 | Panier & Compte client | Panier persistant, création de compte client, adresses |
| 3 | Checkout & Paiements | Tunnel de commande, intégration Stripe (carte bancaire), intégration moyen de paiement Afrique de l'Ouest (mobile money), emails transactionnels |
| 4 | Dashboard admin | Gestion catalogue, commandes, stock, zones de livraison, authentification admin |
| 5 | SEO & Lancement | Application du skill `ecommerce-seo` (métadonnées, schema.org, sitemap, Core Web Vitals), tests finaux, mise en production |

Chaque phase fera l'objet de son propre design détaillé au moment voulu. La suite de ce document détaille uniquement l'architecture globale (valable pour toutes les phases) et la Phase 0.

## Architecture technique (validée)

- **Framework** : Next.js 14 (App Router) + TypeScript, déployé sur Vercel.
- **Style** : les tokens CSS du design system existant sont utilisés directement (CSS Modules / CSS natif). Pas de Tailwind — le design system fournit déjà un système de tokens complet ; ajouter Tailwind créerait deux sources de vérité pour couleurs/espacements.
- **Base de données** : PostgreSQL (hébergement type Neon ou Supabase) + Prisma ORM.
- **Authentification admin** : Auth.js (NextAuth), stratégie credentials, un seul rôle admin dans un premier temps.
- **Emails transactionnels** : Resend.
- **Internationalisation** : segments de route `/fr/...` et `/en/...`. Le choix entre `fr` par défaut sans préfixe ou avec préfixe explicite sera tranché dans la Phase 0 (voir tâches ci-dessous).
- **Paiements** : Stripe pour carte bancaire internationale ; un prestataire mobile money (à confirmer en Phase 3) pour l'Afrique de l'Ouest — le modèle de données prévoit déjà un champ `provider` générique sur `Payment` pour ne pas coupler le schéma à un prestataire précis.

## Modèle de données (validé)

- `Product` — nom, description (par langue), slug, catégorie, statut.
- `ProductVariant` — taille, couleur, SKU, stock, prix.
- `ProductImage` — url, alt.
- `Category`
- `Order` — n° commande, email client, adresse, pays, devise, statut, total.
- `OrderItem` — variante, quantité, prix unitaire.
- `Payment` — provider (`stripe` | `genius_pay` ou équivalent), référence, statut, montant, devise.
- `ShippingZone` — pays couverts, transporteur, délai, coût.
- `Admin` — email, mot de passe hashé, rôle.

Ce schéma sera traduit en modèles Prisma dès la Phase 0, sans les logiques métier des phases suivantes (pas de champs spéculatifs pour des fonctionnalités non encore spécifiées).

## Phase 0 — Fondations (détail)

### But

Poser une base technique saine et déployable, sur laquelle les phases suivantes (catalogue, checkout, dashboard) viendront s'ajouter sans reprise de fondations.

### Portée (in scope)

1. **Scaffold du projet**
   - Initialisation Next.js 14 (App Router, TypeScript strict).
   - Structure de dossiers : `app/[locale]/...` pour supporter `/fr` et `/en`.
   - Configuration ESLint/Prettier alignée sur les conventions du repo existant.

2. **Intégration du design system**
   - Extraction des tokens (couleurs, typographie, espacements) depuis `Design système ecommerce Divinexpress/_ds` vers un fichier de tokens CSS central (ex. `app/styles/tokens.css`).
   - Mise en place d'un layout de base (`app/[locale]/layout.tsx`) qui applique ces tokens.
   - Pas d'implémentation de pages produit/catégorie ici — uniquement le layout, la navigation de base et le pied de page, tels que montrés dans les wireframes.

3. **Base de données**
   - Mise en place de PostgreSQL (Neon ou Supabase, à choisir selon coût/simplicité de mise en route).
   - Schéma Prisma initial reprenant le modèle de données validé ci-dessus.
   - Migration initiale + script de seed minimal (quelques produits/catégories fictifs pour développement).

4. **i18n**
   - Décision et mise en œuvre de la stratégie de routage (`fr` par défaut sans préfixe vs préfixe explicite pour toutes les langues).
   - Fichiers de traduction de base (structure, pas le contenu complet).

5. **Déploiement**
   - Configuration du projet Vercel, variables d'environnement (base de données, futurs secrets Stripe/Resend en placeholders non fonctionnels).
   - Pipeline de déploiement automatique sur push vers la branche principale.
   - Domaine `divinexpress.fr` pointé vers le déploiement (si accès DNS disponible ; sinon, préparer la configuration et documenter les étapes manuelles restantes).

6. **Qualité**
   - Mise en place d'un check CI minimal (lint + build) sur les pull requests.

### Hors scope (explicitement exclu de la Phase 0)

- Toute page produit/catégorie réelle avec données dynamiques (Phase 1).
- Panier, compte client (Phase 2).
- Paiement Stripe/mobile money fonctionnel (Phase 3) — les champs existent dans le schéma mais aucune intégration API n'est câblée.
- Dashboard admin fonctionnel (Phase 4) — seul le modèle `Admin` et l'auth de base sont prévus si nécessaires à la Phase 0 pour protéger un futur `/admin`, sans UI de gestion.
- Application du skill SEO (Phase 5), au-delà des bases techniques qui la rendent possible plus tard (URLs propres, App Router avec Metadata API disponible).

### Critères de réussite

- Le site est accessible en ligne (URL Vercel ou `divinexpress.fr`) avec un layout minimal aux couleurs du design system, dans les deux locales `/fr` et `/en`.
- La base de données est provisionnée, migrée, et interrogeable depuis l'application (une requête de test affiche les produits de seed).
- Un push sur la branche principale déclenche un déploiement automatique réussi.
- Le lint et le build passent en CI.

### Risques / points ouverts

- Accès DNS au domaine `divinexpress.fr` : à confirmer avec l'utilisateur avant la tâche de configuration du domaine.
- Choix définitif Neon vs Supabase : décision à prendre en tâche 3, sur critère de coût et de simplicité (pas de dépendance forte, Prisma abstrait le fournisseur).
- Nom exact du prestataire mobile money Afrique de l'Ouest : non requis pour la Phase 0 (le champ `provider` reste une chaîne libre), à trancher en Phase 3.
