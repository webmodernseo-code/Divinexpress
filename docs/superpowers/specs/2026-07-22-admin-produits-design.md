# DivinExpress — Dashboard Admin : Gestion des Produits — Design Spec

## Contexte

Le socle du dashboard admin (auth, sidebar, layout, page "Vue d'ensemble" avec vraies statistiques) est déjà construit et fonctionnel (`docs/superpowers/specs/2026-07-21-admin-dashboard-foundation-design.md`, `docs/superpowers/specs/2026-07-21-dashboard-overview-redesign-design.md`). Les 9 autres sections de la sidebar (Produits, Commandes, Retours, Clients, Réductions, Blog, Analytique, Messages, Paramètres) sont pour l'instant des pages stub "Bientôt disponible" (`components/Admin/ComingSoon.tsx`).

Ce document couvre le premier de ces sous-projets : **Produits**, choisi en priorité car c'est le levier fondamental — sans gestion réelle des produits, aucune autre section (commandes, réductions) n'a de catalogue à piloter. Aujourd'hui, les produits n'existent que via `prisma/seed.ts`.

Point important déjà vérifié : le storefront public (`lib/catalog.ts`, pages `app/[locale]/[category]`, `app/[locale]/produit/[slug]`) lit **déjà** ses données en direct depuis Prisma/Postgres à chaque requête, sans cache ni ISR (`revalidate`) configuré. Toute modification faite depuis le dashboard sera donc visible immédiatement côté boutique, sans travail d'invalidation de cache à prévoir.

## Buts

1. Permettre à l'admin de créer, modifier, publier/archiver et (sous conditions) supprimer un produit avec ses variantes (taille, couleur, prix, prix barré, stock, SKU) et ses photos.
2. Permettre l'upload de photos produit vers un stockage cloud (Cloudinary), avec réorganisation par glisser-déposer.
3. Permettre la gestion des catégories (créer/renommer/supprimer) depuis le dashboard, sans passer par la base de données.
4. Fournir une liste de produits avec recherche, filtres (catégorie, statut) et pagination, dans l'habillage visuel déjà établi par "Vue d'ensemble".
5. Garantir l'intégrité de l'historique des commandes : un produit/variante déjà commandé ne peut jamais être supprimé définitivement, seulement archivé.

## Hors périmètre

* SKU auto-généré — saisi manuellement par l'admin.
* Alerte stock bas dédiée à cette section — déjà couverte par le panneau "Stock faible" de "Vue d'ensemble".
* Duplication de produit.
* Gestion des rôles/permissions admin (le champ `Admin.role` existe mais reste inexploité, comme pour le reste du dashboard — un seul compte).
* Import/export en masse (CSV, etc.).
* Les 8 autres sections stub (Commandes, Retours, Clients, Réductions, Blog, Analytique, Messages, Paramètres) — chacune fera l'objet de son propre brainstorming.

## Spécifications Techniques

### 1. Schéma Prisma (`prisma/schema.prisma`, nouvelle migration)

Un seul modèle est modifié :

```prisma
model ProductImage {
  id                 String  @id @default(cuid())
  url                String
  alt                String
  position           Int     @default(0)
  cloudinaryPublicId String?
  product            Product @relation(fields: [productId], references: [id])
  productId          String
}
```

* `position` : ordre d'affichage, modifié par le glisser-déposer côté admin ; la boutique publique affiche déjà `images` — il faudra trier par `position` dans `CATALOG_INCLUDE`/l'usage côté storefront (petit ajustement de `orderBy: { position: 'asc' }` sur la relation `images` dans `lib/catalog.ts`).
* `cloudinaryPublicId` : nullable pour rester compatible avec les images de seed existantes (URLs Unsplash, jamais uploadées via Cloudinary) — sans cet identifiant, une image ne peut pas être supprimée du cloud, seulement de la base (comportement acceptable pour les données de seed).

`Category` et `Product`/`ProductVariant` restent inchangés : leurs champs actuels (`name`/`slug`, `status`, `featured`, `priceCents`, `compareAtPriceCents`, `stock`, `sku`) couvrent déjà tout le périmètre.

### 2. Nouvelle dépendance : `cloudinary`

Ajoutée à `dependencies` — nécessaire côté serveur pour générer une signature d'upload et pour supprimer un asset. Aucune librairie cliente supplémentaire : l'upload depuis le navigateur se fait par un simple `fetch` `multipart/form-data` vers l'API REST Cloudinary (`https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`), pas de widget JS Cloudinary embarqué.

Nouvelles variables d'environnement (ajoutées commentées à `.env.example`, valeurs réelles dans `.env`, déjà ignoré par git) :
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`lib/cloudinary.ts` :
* `getUploadSignature(): { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string }` — signe `{ timestamp, folder: 'divinexpress/products' }` avec `CLOUDINARY_API_SECRET` via le SDK (`cloudinary.utils.api_sign_request`).
* `deleteCloudinaryImage(publicId: string): Promise<void>` — appelle `cloudinary.uploader.destroy(publicId)` ; les erreurs sont capturées et journalisées (`console.error`), jamais propagées : un échec de suppression cloud ne doit pas empêcher la suppression de l'image côté admin (voir §4, `removeProductImage`).

### 3. Logique pure testable (`lib/*.ts` + `lib/*.test.ts`, convention déjà en place)

* `lib/slug.ts`
  * `slugify(input: string): string` — minuscule, suppression des accents/diacritiques, remplacement des caractères non alphanumériques par `-`, dé-duplication des tirets, trim.
  * `dedupeSlug(base: string, existingSlugs: string[]): string` — si `base` est déjà pris, essaie `base-2`, `base-3`, etc.
* `lib/productDisplay.ts`
  * `totalStock(variants: { stock: number }[]): number`
  * `priceRange(variants: { priceCents: number }[]): { minCents: number; maxCents: number } | null` (`null` si aucune variante)
* `lib/productDeletion.ts`
  * `canDelete(orderedItemCount: number): boolean` — `orderedItemCount === 0`. Centralise la règle "jamais commandé" ; réutilisée telle quelle à la fois pour une variante individuelle (§4 `updateProduct`) et pour un produit entier (§4 `deleteProduct`, en sommant les commandes de toutes ses variantes).

### 4. Server Actions (`app/admin/(dashboard)/produits/actions.ts`, `.../categories/actions.ts`)

Toutes protégées gratuitement par le middleware existant : une Server Action invoquée depuis un formulaire sur `/admin/produits/...` est une requête POST vers cette même URL, donc déjà interceptée par `middleware.ts` (`pathname.startsWith('/admin')`) exactement comme une navigation classique. Aucune re-vérification de session à dupliquer dans chaque action.

Forme de retour commune pour les actions liées à un formulaire (utilisées avec `useFormState` de `react-dom`) :
```typescript
type ActionState = { error: string | null };
```

* **`createProduct(prevState: ActionState, formData: FormData): Promise<ActionState>`**
  Valide : `nameFr`, `nameEn`, `descriptionFr`, `descriptionEn`, `categoryId` requis ; au moins une variante avec `size`, `color`, `priceCents > 0`, `stock >= 0`, `sku` non vide. Slug = `dedupeSlug(slugify(nameFr), <tous les slugs existants>)`. Crée le `Product` avec ses `variants` en écriture imbriquée (`variants: { create: [...] }`). Statut initial = valeur du champ `status` du formulaire (Brouillon par défaut). **Pas de photos à la création** — le formulaire l'indique ("Enregistrez le produit pour ajouter des photos") car `ProductImage` a besoin d'un `productId` existant. En cas de succès, `redirect('/admin/produits/' + product.id)` pour enchaîner sur l'ajout de photos.

* **`updateProduct(id: string, prevState: ActionState, formData: FormData): Promise<ActionState>`**
  Mêmes validations sur les champs scalaires. Pour les variantes, **jamais de suppression physique en masse** (delete-then-recreate casserait les `OrderItem` historiques qui référencent `variantId`) :
  * Lignes du formulaire portant un `id` caché → `update` du variant existant (taille, couleur, prix, prix barré, stock ; le SKU reste modifiable).
  * Lignes sans `id` → `create` d'un nouveau variant.
  * Un variant existant retiré du formulaire n'est supprimé en base **que si** `canDelete(orderItemCount)` est vrai pour ce variant précis (compté via `prisma.orderItem.count({ where: { variantId } })`) ; sinon l'action renvoie `{ error: "Cette variante a déjà été commandée et ne peut pas être supprimée — passez son stock à 0 à la place." }` et n'applique aucun changement (transaction annulée). Le formulaire empêche déjà ce cas côté client (voir §5, lignes verrouillées) — cette vérification serveur est le filet de sécurité faisant foi.
  Toute la mise à jour (scalaires + variantes) s'exécute dans une seule `prisma.$transaction(...)`.

* **`setProductStatus(id: string, status: ProductStatus): Promise<void>`** — action rapide utilisée depuis la liste (bouton Publier/Archiver/Repasser en brouillon), sans passer par le formulaire complet.

* **`deleteProduct(id: string): Promise<{ error: string | null }>`** — calcule le nombre total d'`OrderItem` sur l'ensemble des variantes du produit ; si `canDelete(...)` est faux, retourne une erreur ("Ce produit a déjà été commandé — archivez-le plutôt que de le supprimer.") sans rien supprimer ; sinon supprime en cascade (images, variantes, produit) dans une transaction.

* **`getCloudinarySignature(): Promise<ReturnType<typeof getUploadSignature>>`** — appelée directement (pas via `<form>`) depuis `ProductImageManager` avant l'upload.

* **`attachProductImage(productId: string, image: { url: string; publicId: string; alt: string }): Promise<void>`** — insère une `ProductImage` avec `position = (max position existante) + 1`.

* **`removeProductImage(imageId: string): Promise<void>`** — lit `cloudinaryPublicId` ; si présent, appelle `deleteCloudinaryImage` (best-effort, erreur journalisée seulement) ; supprime ensuite la ligne `ProductImage` en base dans tous les cas — un échec Cloudinary ne doit jamais bloquer l'admin.

* **`reorderProductImages(productId: string, orderedImageIds: string[]): Promise<void>`** — met à jour `position` de chaque image selon son index dans `orderedImageIds`, en une transaction.

* **`createCategory` / `updateCategory` / `deleteCategory`** (`app/admin/(dashboard)/produits/categories/actions.ts`) — mêmes principes : slug = `dedupeSlug(slugify(name), ...)` recalculé serveur (jamais fait confiance à un slug envoyé tel quel par le client) ; `deleteCategory` refusée avec message clair si `prisma.product.count({ where: { categoryId } }) > 0` ("Cette catégorie contient encore des produits — réassignez-les avant de la supprimer.").

### 5. Écrans et composants

* **`app/admin/(dashboard)/produits/page.tsx`** (Server Component) — lit `searchParams` (`q`, `categorie`, `statut`, `page`), interroge Prisma (`where` combiné, `include: { variants: true, images: { orderBy: { position: 'asc' }, take: 1 }, category: true }`, pagination 20/page). Table dans le même style que "Vue d'ensemble" (`.tableCard`/`.table`) : miniature, nom, catégorie, statut (badge), stock total (`totalStock`), fourchette de prix (`priceRange` + `formatPrice`), actions (Éditer, bascule statut, Supprimer). Barre de filtres (`components/Admin/ProductsFilterBar.tsx`, client, met à jour l'URL via `useRouter`/`usePathname`, cohérent avec le pattern déjà utilisé côté storefront pour les filtres catalogue).

* **`app/admin/(dashboard)/produits/nouveau/page.tsx`** — `<ProductForm mode="create" categories={categories} />`.

* **`app/admin/(dashboard)/produits/[id]/page.tsx`** — charge le produit (`notFound()` si absent), `<ProductForm mode="edit" product={product} categories={categories} />`.

* **`components/Admin/ProductForm.tsx`** (client) — `useFormState(action, { error: null })` avec `createProduct` ou `updateProduct.bind(null, product.id)` selon `mode`. Sections : Infos générales (nom FR/EN, description FR/EN, catégorie, statut, mis en avant), Variantes (lignes dynamiques en `useState` local ; une ligne existante dont le variant a un historique de commandes affiche un cadenas et son bouton "Retirer" est désactivé avec une infobulle ; les nouvelles lignes non enregistrées se retirent librement), Photos (`ProductImageManager`, rendu seulement en mode `edit`). Bouton de soumission utilisant `useFormStatus` pour l'état "en cours".

* **`components/Admin/ProductImageManager.tsx`** (client, mode edit uniquement) — bouton "Ajouter une photo" (`<input type="file">`) → `getCloudinarySignature()` → `fetch` direct vers Cloudinary → `attachProductImage`. Grille de photos existantes réordonnable par glisser-déposer natif HTML5 (`draggable`, `onDragStart/Over/Drop`, sans dépendance) → `reorderProductImages`. Bouton de suppression par photo → `removeProductImage`.

* **`app/admin/(dashboard)/produits/categories/page.tsx`** — liste des catégories avec compteur de produits (`_count`), formulaire d'ajout inline, édition et suppression par ligne (`components/Admin/CategoryRow.tsx`, client).

### 6. Validation et messages d'erreur (résumé)

| Cas | Message affiché (FR) |
|---|---|
| Champ requis manquant | "Merci de renseigner {champ}." |
| Aucune variante | "Ajoutez au moins une variante (taille, couleur, prix, stock)." |
| SKU dupliqué (contrainte unique Prisma) | "Ce SKU est déjà utilisé par une autre variante." |
| Suppression variante commandée | "Cette variante a déjà été commandée et ne peut pas être supprimée — passez son stock à 0 à la place." |
| Suppression produit commandé | "Ce produit a déjà été commandé — archivez-le plutôt que de le supprimer." |
| Suppression catégorie non vide | "Cette catégorie contient encore des produits — réassignez-les avant de la supprimer." |

### 7. Ajustement storefront (mineur)

`lib/catalog.ts` : `CATALOG_INCLUDE.images` passe de `true` à `{ orderBy: { position: 'asc' } }` pour que l'ordre choisi dans le dashboard (photo principale en premier) soit respecté côté boutique publique.

### 8. Tests

Conforme à la contrainte déjà établie (Vitest configuré uniquement pour `**/*.test.ts`, environnement Node, pas de jsdom) : uniquement des tests de fonctions pures, pas de test de composant/DOM.

* `lib/slug.test.ts` — accents, caractères spéciaux, collisions (`dedupeSlug`).
* `lib/productDisplay.test.ts` — `totalStock` (somme, liste vide), `priceRange` (min/max, liste vide → `null`).
* `lib/productDeletion.test.ts` — `canDelete` (0 → vrai, >0 → faux).

## Critères d'acceptation

1. Créer un produit avec au moins une variante depuis `/admin/produits/nouveau` l'enregistre en base et redirige vers sa page d'édition.
2. Depuis la page d'édition, ajouter une photo l'upload sur Cloudinary et l'affiche dans la grille ; la réordonner par glisser-déposer persiste le nouvel ordre après rechargement ; la supprimer la retire de la grille et du cloud.
3. Modifier les champs d'un produit existant (y compris stock/prix d'une variante déjà commandée) enregistre les changements sans supprimer/recréer la variante.
4. Tenter de retirer une ligne de variante déjà commandée est bloqué côté formulaire (bouton désactivé) et, si forcé côté serveur, renvoie le message d'erreur dédié sans rien modifier.
5. Publier/archiver un produit depuis la liste change immédiatement son statut visible ; un produit archivé n'apparaît plus dans la boutique publique (`status: 'PUBLISHED'` déjà filtré par `lib/catalog.ts`).
6. Supprimer un produit jamais commandé le retire définitivement ; supprimer un produit déjà commandé est refusé avec le message dédié.
7. La liste `/admin/produits` reflète recherche, filtre catégorie, filtre statut et pagination via l'URL (partageable/rechargeable).
8. Créer une catégorie la rend immédiatement sélectionnable dans le formulaire produit ; supprimer une catégorie contenant des produits est refusé avec le message dédié ; supprimer une catégorie vide fonctionne.
9. Toute modification (produit publié, statut changé, photo ajoutée) est visible côté boutique publique (`/fr`, `/en`) sans action de cache/revalidation supplémentaire.
10. `npx tsc --noEmit`, `npm run lint` et `npm test` passent sans erreur ; `git diff package.json` ne montre que l'ajout de `cloudinary`.
