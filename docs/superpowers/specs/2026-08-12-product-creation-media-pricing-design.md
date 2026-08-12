# Création produit : images Cloudinary + prix barré — Design

Date : 2026-08-12
Statut : validé (design), en attente de relecture avant plan d'implémentation

## Objectif

Permettre, à la création/édition d'un produit dans le dashboard :
1. **d'uploader jusqu'à 6 images** (stockage Cloudinary), affichées sur la vitrine ET le dashboard depuis une **source unique** ;
2. de saisir un **prix barré optionnel** (prix initial / promo) affiché en barré à côté du prix courant.

## Contraintes (non négociables)

- **Ne rien casser de l'existant (design Codex).** Les produits déjà en ligne gardent exactement leurs images et prix actuels. Résolution d'image en cascade avec repli sur le comportement actuel (voir plus bas).
- **Migrations additives uniquement** (ADD COLUMN nullable), compatibles SQLite (dev) + Postgres/Neon (prod) via l'adaptateur. Aucune reconstruction de table, aucune contrainte NOT NULL retirée.
- **Secret Cloudinary jamais exposé au client** : signé côté serveur.
- Bilingue fr + en pour toute chaîne visible.
- TDD, commits fréquents, `rm -rf .next/dev && npm run typecheck` doit finir à 0.

## A. Upload d'images (Cloudinary)

### Mécanisme : upload direct navigateur → Cloudinary, signé par le serveur
- Route serveur `POST /api/admin/upload-signature` (auth owner/manager) : génère une **signature** (`timestamp` + params) avec `CLOUDINARY_API_SECRET`. Ne renvoie **jamais** le secret, seulement `{ signature, timestamp, apiKey, cloudName, folder }`.
- Le navigateur envoie le fichier **directement** à `https://api.cloudinary.com/v1_1/<cloud>/image/upload` avec la signature. → secret protégé + pas de limite 4,5 Mo des fonctions Vercel.
- Réponse Cloudinary → `secure_url`. On stocke cette URL.
- Dossier Cloudinary : `reign/products`.

### Stockage : table `product_media` (déjà existante, aucune migration)
Colonnes : `id, product_id, variant_id (nullable), url, alt_fr, alt_en, position`.
- Jusqu'à 6 lignes par produit, `position` 0→5 (0 = couverture).
- `variant_id` reste `NULL` en v1 (galerie simple, non liée à la couleur).

### Résolution d'image (garde-fou anti-casse)
Fonction serveur unique `productImages(product)` → `string[]` :
1. si `product_media` a des lignes → leurs `url` triées par `position` ;
2. sinon → repli sur l'actuel `getProductImageUrl(product, couleur)` (les produits existants gardent leurs photos) ;
3. sinon → `/image/category_<catégorie>.png`.
Le type vitrine `Product` gagne `images: string[]` (au moins 1). `ProductCard` prend `images[0]`, `ProductGallery` parcourt `images`.

### UI dashboard (création/édition)
- Zone d'upload (sélecteur de fichiers, jusqu'à 6), aperçu miniatures, suppression d'une image, ordre = ordre d'ajout (position). Barre de progression pendant l'upload.
- La **liste produits** affiche l'image réelle (position 0) si présente, sinon le placeholder actuel — remplace l'heuristique `getProductImage`.

## B. Prix barré (optionnel / promo, niveau produit)

- **Migration `0003`** : `ALTER TABLE product_variants ADD COLUMN compare_at_price_minor INTEGER` (nullable). Même SQL SQLite + Postgres.
- Création/édition : champ optionnel **« Prix initial (barré) »** (au niveau produit → appliqué à toutes les variantes créées).
- `CatalogRepository` persiste `compareAtPriceMinor` sur les variantes ; `StorefrontCatalog` expose `compareAtEur?` (depuis `variants[0]`).
- Affichage vitrine (`ProductCard` + page produit) : si `compareAtEur > priceEur` → ~~prix initial~~ **prix courant** (+ badge « -X% » optionnel). Sinon prix courant seul.

## Modèle de données (résumé)

- `product_media` : inchangé (déjà prêt).
- `product_variants` : + `compare_at_price_minor INTEGER NULL` (migration 0003).
- Type `Product` (`src/lib/products.ts`) : + `images: string[]`, + `compareAtEur?: number`.

## API / routes

- **Nouveau** `POST /api/admin/upload-signature` — signature Cloudinary (auth owner/manager).
- `POST /api/admin/products` + `PATCH /api/admin/products/[id]` : acceptent `images: string[]` (URLs déjà uploadées) et `compareAtPriceMinor?: number`. Schéma zod étendu.
- `CatalogRepository.createProduct/updateProduct` : insèrent les `product_media` + le `compare_at_price_minor`.

## i18n

Clés dashboard produits (fr + en) : « Images », « Ajouter une image », « Prix initial (barré) », erreurs upload. Vitrine : badge promo éventuel.

## Config / env

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` dans Vercel (prod) + `.env.local` (dev). Documentées dans `.env.example`.
- Dépendance : `cloudinary` (SDK Node) pour la signature côté serveur (ou signature manuelle via `crypto` pour éviter la dépendance — à trancher au plan).

## Fichiers touchés

Back : `src/server/media/cloudinary.ts` (nouveau, signature), `src/app/api/admin/upload-signature/route.ts` (nouveau), `src/app/api/admin/products/route.ts` + `[id]/route.ts`, `src/server/catalog/repository.ts` + `schemas.ts`, `src/server/catalog/storefront.ts`, migration `0003`, `src/server/db/migrate.ts` (enregistrer 0003).
Front/shared : `src/lib/products.ts` (type `Product` + fonction de résolution d'image + repli), `src/components/product/ProductCard.tsx`, `ProductGallery.tsx`, page produit, `src/app/[locale]/(dashboard)/produits/page.tsx` (upload UI + prix + image réelle), nouveau composant d'upload, `messages/fr.json`/`en.json`, `.env.example`.

## Hors périmètre (v1)

- Lier chaque image à une couleur précise (façon Yahweh) — le schéma le permet (`variant_id`) mais reporté.
- Réordonnancement drag & drop des images (ordre = ordre d'ajout en v1).
- Optimisation/transformation Cloudinary avancée (on stocke l'URL `secure_url` telle quelle ; les transformations pourront être ajoutées via l'URL plus tard).
- Prix barré par variante (v1 = par produit).
