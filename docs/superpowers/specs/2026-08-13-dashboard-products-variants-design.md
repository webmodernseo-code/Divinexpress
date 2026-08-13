# Dashboard Produits — Gestion multi-variantes (100%) — Design

Document de conception validé le 2026-08-13. Premier sous-projet du chantier
« Dashboard 100% fullstack ». Rend la gestion des produits complète et fiable :
créer/modifier/supprimer des produits avec **plusieurs tailles/couleurs (variantes)**,
chacune avec son stock, et reflet immédiat sur la vitrine.

## Contexte (état audité)

La chaîne « créer un produit → visible sur le site » fonctionne déjà :
`POST /api/admin/products` crée en `status='active'`, `StorefrontCatalog` liste les
produits `active`. Mais :

- Le formulaire dashboard fige **une seule variante** (taille `M`, couleur `Noir`).
- `createProduct` **n'insère aucun stock** ; le stock initial passe par un 2ᵉ appel
  PATCH agrégé.
- L'édition **ne gère ni les images ni le prix barré** (champs présents seulement à la
  création) et ne touche qu'« une variante principale » pour prix/stock.
- Le sélecteur de statut est **ignoré à la création** (toujours `active`).
- Échecs d'API **silencieux** (liste vide sans message).

## Décisions validées

- **Prix** : un **prix de base unique** par produit, appliqué à toutes les variantes,
  + un **prix barré** optionnel (compare-at) unique. Pas de prix par variante.
- **Stock** : **par variante** (chaque taille/couleur a son propre stock), via
  `inventory_movements` (append-only : `initial` à la création, `adjustment` ensuite).
- **Suppression d'une variante** : **désactivation** (`active=0`), jamais de suppression
  dure (préserve l'historique de commandes / mouvements d'inventaire).
- **Édition des variantes** : **granulaire** (ajouter / ajuster le stock / désactiver une
  variante à la fois) plutôt que « tout remplacer ».
- **Devise** : `EUR` pour les variantes créées au dashboard (le multi-devise d'affichage
  est géré ailleurs). GBP hors périmètre ici.

## Modèle de données (existant, non modifié)

- `products(id, category_id, slug, name_fr, name_en, description_fr, description_en, status)`
  — `status ∈ {draft, active, archived}`.
- `product_variants(id, product_id, sku UNIQUE, size, color, price_minor, currency,
  active DEFAULT 1, compare_at_price_minor)` (compare-at ajouté par migration 0003).
- `inventory_movements(id, variant_id, quantity_delta<>0, reason, actor_id, ...)` —
  stock d'une variante = `SUM(quantity_delta)`.
- `product_media(id, product_id, url, position)`.

Aucune migration nécessaire : le modèle supporte déjà le multi-variantes.

## Changements — couche serveur

### `catalog/schemas.ts`
- Ajouter `stock: z.number().int().nonnegative().default(0)` à `productVariantInputSchema`.

### `catalog/repository.ts` (`CatalogRepository`)
- **`createProduct`** : après l'insert de chaque variante, insérer un mouvement
  `inventory_movements` `reason='initial'` avec `quantity_delta = variant.stock`
  **uniquement si `stock > 0`** (contrainte `quantity_delta <> 0`). Le `compare_at_price_minor`
  reste appliqué à toutes les variantes (comportement actuel).
- **`addVariant(productId, { sku, size, color, priceMinor, currency, stock })`** :
  insère une variante (`active=1`) + mouvement `initial` si `stock > 0`. Réutilise le
  prix de base courant du produit si `priceMinor` non fourni.
- **`deactivateVariant(variantId)`** : `UPDATE product_variants SET active=0, updated_at=… WHERE id=?`.
  `NOT_FOUND` si 0 ligne.
- **`adjustVariantStock(variantId, targetStock, actorId)`** : calcule le delta vs
  `SUM(quantity_delta)` de la variante, insère un mouvement `adjustment` si delta ≠ 0
  (équivalent per-variant de `setAggregateStock`).
- **`replaceImages(productId, urls[])`** : `DELETE FROM product_media WHERE product_id=?`
  puis réinsère les URLs avec `position` croissante (transaction).
- **`setCompareAt(productId, compareAtMinor | null)`** :
  `UPDATE product_variants SET compare_at_price_minor=? WHERE product_id=? AND active=1`.

### API routes
- **`POST /api/admin/products`** : le schéma d'entrée accepte désormais `stock` par
  variante et un `status` optionnel (`draft|active`, défaut `active`) → `createProduct`
  applique le statut. (Supprime le contournement « 2ᵉ PATCH » pour le stock.)
- **`PATCH /api/admin/products/[id]`** : étendre `patchSchema` pour accepter
  `images?: string[]` (URLs, **remplace** la galerie via `replaceImages`) et
  `compareAtPriceMinor?: number | null` (via `setCompareAt`). Conserve category/names/
  descriptions/status/priceMinor/stock existants.
- **`POST /api/admin/products/[id]/variants`** *(nouveau)* : body
  `{ size: string|null, color: string|null, stock: number, priceMinor?: number }` →
  `addVariant`. Auth + `requireRole(['owner','manager'])`. SKU généré serveur.
- **`PATCH /api/admin/products/[id]/variants/[variantId]`** *(nouveau)* : body
  `{ stock?: number, active?: boolean }` → `adjustVariantStock` et/ou
  `deactivateVariant`. Auth + rôle.

Toutes les routes : `401` si non admin, `403` rôle insuffisant, `400` validation zod,
`404`/`409` via `DomainError`, `500` sinon.

## Changements — UI (`produits/page.tsx`)

### Création
- Remplacer la variante figée par une **liste dynamique de variantes** : chaque ligne =
  taille (select `XS,S,M,L,XL,XXL,Unique`) + couleur (texte, défaut « Noir ») + stock
  (number). Bouton **« + Ajouter une variante »**, bouton retirer par ligne. Au moins une
  variante requise.
- Construire le tableau `variants[]` (id/sku générés client, `priceMinor` = prix de base,
  `currency: 'EUR'`, `stock`) et envoyer `status` (sélecteur honoré).
- Conserver prix de base, prix barré, images (déjà présents).

### Édition
- Charger les variantes existantes du produit (déjà renvoyées par `GET /products`).
- Afficher l'**uploader d'images** et le **prix barré** aussi en édition (aujourd'hui
  masqués). Sauvegarde via le PATCH étendu.
- Section variantes : liste des variantes actives avec **stock éditable** (→ PATCH
  variante) et bouton **désactiver** ; bouton **« + Ajouter une variante »** (→ POST
  variante). Taille/couleur d'une variante existante non éditables (on désactive + on
  recrée si besoin).
- Icône d'édition : **crayon** (au lieu de l'œil).

### Fiabilité
- Afficher les **erreurs** API (remplacer `.catch(() => undefined)` et les échecs muets
  par un message visible / toast).

## Reflet sur la vitrine

`toStorefrontProduct` dérive déjà `sizes`/`colors` des variantes et filtre `active`.
**Vérifications** (tests + revue) :
- Un produit multi-variantes créé au dashboard expose ses tailles/couleurs sur la fiche.
- L'ajout au panier résout la **variante sélectionnée** (taille/couleur) et respecte son
  stock. Si un écart est trouvé (résolution de variante côté checkout/fiche), il entre
  dans le périmètre de ce sous-projet.

## Tests

- **Repository** : `createProduct` avec plusieurs variantes + stock initial par variante ;
  `addVariant` ; `deactivateVariant` ; `adjustVariantStock` (delta +/–) ; `replaceImages` ;
  `setCompareAt`.
- **API** : POST (variantes+stock+status), PATCH (images/compareAt), POST/PATCH variantes —
  cas non-auth (401), rôle insuffisant (403), payload invalide (400).
- **Storefront** : mapping variantes → `sizes`/`colors`, exclusion des variantes inactives,
  `availableQuantity` = somme des stocks actifs.

## Hors périmètre (différé)

- Prix différent par variante.
- Gestion de la devise GBP au dashboard.
- Édition de la taille/couleur d'une variante existante (on désactive + recrée).
- Réorganisation des images par glisser-déposer (l'ordre suit l'upload).

## Vérification finale

`rm -rf .next/dev && npm run typecheck` → 0 nouvelle erreur (baseline 19 TS7016).
Suite de tests ciblée verte sur les fichiers touchés. Contrôle manuel : créer un produit
2 tailles / 2 stocks au dashboard → il apparaît sur le site avec ses tailles, achetable
selon le stock.
