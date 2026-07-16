# DivinExpress — Nettoyages et correctifs Phase 1 : Spécifications de Design

Ce document définit les spécifications pour résoudre les bugs résiduels de la Phase 1 (prix filtré erroné, catégorie non traduite sur la PDP) et structurer le code afin d'éliminer la duplication logique de prix et de locales.

## But

Rendre le catalogue robuste, cohérent et exempt de duplication avant d'aborder la Phase 2 (Panier).

## Portée (In Scope)

### 1. Filtrage précis des variantes dans les cartes produits
* **Problème** : La carte produit ([ProductCard](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/components/ProductCard/ProductCard.tsx)) affiche le prix de la variante la moins chère globale, même si l'utilisateur a filtré sur une taille, couleur ou tranche de prix spécifique.
* **Solution** :
  * Dans [lib/filters.ts](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/lib/filters.ts), ajouter et exporter la fonction suivante :
    ```typescript
    export function matchVariant(
      variant: { size: string; color: string; priceCents: number },
      filters: ProductFilters
    ): boolean {
      if (filters.sizes.length > 0 && !filters.sizes.includes(variant.size)) return false;
      if (filters.colors.length > 0 && !filters.colors.includes(variant.color)) return false;
      if (filters.priceBuckets.length > 0) {
        const ranges = priceRangesForBuckets(filters.priceBuckets);
        const matchesPrice = ranges.some(({ minCents, maxCents }) =>
          maxCents === null
            ? variant.priceCents >= minCents
            : variant.priceCents >= minCents && variant.priceCents <= maxCents
        );
        if (!matchesPrice) return false;
      }
      return true;
    }
    ```
  * Mettre à jour [ProductCard](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/components/ProductCard/ProductCard.tsx) pour accepter un prop `filters?: ProductFilters`.
  * Si `filters` est fourni, filtrer `product.variants` via `matchVariant` avant d'identifier le prix le plus bas (`cheapestVariant`). S'il ne reste aucune variante après filtrage (fallback de sécurité), conserver toutes les variantes.
  * Transmettre les filtres depuis la PLP ([app/[locale]/[category]/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/app/%5Blocale%5D/%5Bcategory%5D/page.tsx)) à chaque `<ProductCard>`.

### 2. Traduction de la catégorie sur la PDP
* **Problème** : Le nom de la catégorie s'affiche en brut ("Homme" ou "Femme") sur la PDP en anglais.
* **Solution** :
  * Puisque le schéma Prisma `Category` n'a pas de champ de traduction et que les catégories sont de taille fixe, utiliser les dictionnaires i18n existants (`messages/fr.json` et `messages/en.json`) sous la clé `header`.
  * Charger `tHeader = await getTranslations('header')` dans la PDP ([app/[locale]/produit/[slug]/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/app/%5Blocale%5D/produit/%5Bslug%5D/page.tsx)).
  * Afficher `{tHeader(product.category.slug)}` au lieu de `{product.category.name}`.

### 3. Élimination de la duplication de code

#### A. Centralisation de la traduction des champs de base de données (i18n DB)
* Créer un utilitaire [lib/i18n-utils.ts](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/lib/i18n-utils.ts) :
  ```typescript
  import type { Locale } from '@/i18n';

  export function getLocalizedField<T extends Record<string, any>>(
    obj: T,
    baseField: string,
    locale: Locale
  ): any {
    const suffix = locale === 'fr' ? 'Fr' : 'En';
    const key = `${baseField}${suffix}`;
    return obj[key] ?? obj[baseField] ?? '';
  }
  ```
* Remplacer toutes les occurrences de `locale === 'fr' ? product.nameFr : product.nameEn` et similaires dans les fichiers :
  * [ProductCard.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/components/ProductCard/ProductCard.tsx)
  * [app/[locale]/produit/[slug]/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/app/%5Blocale%5D/produit/%5Bslug%5D/page.tsx)
  * [app/[locale]/[category]/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/app/%5Blocale%5D/%5Bcategory%5D/page.tsx) (pour le tri)

#### B. Centralisation du rendu de prix (`<PriceDisplay>`)
* Créer le composant `<PriceDisplay>` dans [components/PriceDisplay/PriceDisplay.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/components/PriceDisplay/PriceDisplay.tsx) :
  ```typescript
  import type { Locale } from '@/i18n';
  import { formatPrice } from '@/lib/pricing';
  import styles from './PriceDisplay.module.css';

  type PriceDisplayProps = {
    priceCents: number;
    compareAtPriceCents: number | null;
    locale: Locale;
    className?: string;
  };

  export function PriceDisplay({ priceCents, compareAtPriceCents, locale, className }: PriceDisplayProps) {
    const onSale = compareAtPriceCents !== null && compareAtPriceCents > priceCents;

    return (
      <div className={`${styles.container} ${className ?? ''}`}>
        {onSale && compareAtPriceCents !== null ? (
          <>
            <span className={styles.strike}>{formatPrice(compareAtPriceCents, locale)}</span>{' '}
            <span className={styles.sale}>{formatPrice(priceCents, locale)}</span>
          </>
        ) : (
          <span>{formatPrice(priceCents, locale)}</span>
        )}
      </div>
    );
  }
  ```
* Déplacer les styles CSS correspondants depuis `ProductCard.module.css` et `app/[locale]/produit/[slug]/page.module.css` vers `PriceDisplay.module.css`.
* Utiliser `<PriceDisplay>` dans `ProductCard` et la PDP.

## Critères d'acceptation

1. En PLP, le prix affiché sur les cartes produits correspond aux critères de filtres actifs de l'utilisateur (ex: si filtres de taille excluent la variante à bas prix, le prix de la variante disponible s'affiche).
2. Sur la PDP, le nom de la catégorie ("Homme" / "Femme") se traduit correctement selon la locale sélectionnée ("Men" / "Women" en anglais).
3. Le helper de traduction `getLocalizedField` est utilisé partout où on sélectionnait le champ linguistique manuellement.
4. Aucun composant ne duplique de logique de prix brut ; tout passe par `<PriceDisplay>`.
5. La compilation TypeScript (`npx tsc --noEmit`) passe avec succès.
6. Les tests existants et nouveaux passent avec succès.
