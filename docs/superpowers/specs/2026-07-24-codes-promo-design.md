# DivinExpress — Codes Promo (Réductions) — Design Spec

## Contexte

La page admin `Réductions` (`app/admin/(dashboard)/reductions/page.tsx`) est aujourd'hui un stub `ComingSoon` — aucun système de code promo n'existe dans le projet. Ce chantier est né d'une demande de restyle visuel de la page checkout (mockup avec un champ "code promo" + bouton "Apply coupon") : plutôt que d'ajouter un champ qui ne fait rien, on construit le vrai système derrière, avant de retoucher le visuel du checkout dans un second chantier séparé qui viendra le consommer.

Ce chantier couvre : le modèle de données, la page admin de gestion des codes, et leur application au checkout (aperçu en direct + application réelle à la commande). Il ne touche pas au layout visuel du formulaire de checkout lui-même — seulement à sa logique/son contenu fonctionnel (nouveau champ code promo + ligne réduction dans le récapitulatif, avec le style déjà en place).

## Buts

1. Permettre à l'admin de créer/modifier/désactiver/supprimer des codes promo (pourcentage ou montant fixe, avec expiration optionnelle) depuis `/admin/reductions`.
2. Permettre à un client d'entrer un code au checkout, voir la réduction s'appliquer en direct au récapitulatif, et voir ce même montant réellement déduit du total de la commande créée.
3. Ne jamais faire confiance à un montant de réduction calculé côté client au moment de la création de la commande — toujours re-valider et recalculer côté serveur avec les données fraîches de la base.

## Hors périmètre

* Limite de nombre d'utilisations (globale ou par code) — décision explicite : seule une date d'expiration optionnelle borne un code, pas de compteur d'usage.
* Montant minimum de commande pour qu'un code soit valide.
* Restriction d'un code à des produits/catégories spécifiques — un code s'applique toujours à l'ensemble du sous-total du panier.
* Réduction sur les frais de livraison — un code ne réduit que le sous-total produits, jamais `shippingCostCents` (décision explicite).
* Cumul de plusieurs codes sur une même commande — un seul code par commande.
* Le restyle visuel de la page checkout (mockup deux colonnes avec miniatures produit) — chantier séparé, suivant celui-ci, qui consommera le champ construit ici.

## Spécifications Techniques

### 1. Modèle de données

Nouveau modèle et enum dans `prisma/schema.prisma`, migration requise :

```prisma
enum DiscountType {
  PERCENT
  FIXED
}

model DiscountCode {
  id        String       @id @default(cuid())
  code      String       @unique
  type      DiscountType
  value     Int          // PERCENT : 1-100 ; FIXED : montant en EUR cents
  isActive  Boolean      @default(true)
  expiresAt DateTime?    // null = pas d'expiration
  orders    Order[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

`Order` gagne trois champs pour figer ce qui a réellement été appliqué (comme `totalCents` fige déjà les prix au moment de la commande — jamais recalculé après coup) :

```prisma
model Order {
  // ... champs existants inchangés ...
  discountCode   DiscountCode? @relation(fields: [discountCodeId], references: [id])
  discountCodeId String?
  discountCents  Int           @default(0)
}
```

`totalCents = subtotalCents - discountCents + shippingZone.costCents` (inchangé sinon — `discountCents` vaut `0` par défaut, donc aucune commande existante n'est affectée).

`code` est stocké et comparé en majuscules (normalisation à l'écriture, aussi bien à la création admin qu'à la saisie client) — une seule casse canonique, pas de recherche insensible à la casse à chaque lecture.

`lib/discountCode.ts` (pur, testable) :
```typescript
export function computeDiscountCents(subtotalCents: number, type: 'PERCENT' | 'FIXED', value: number): number
// PERCENT: Math.round(subtotalCents * value / 100)
// FIXED: value, mais jamais plus que subtotalCents (clampé — pas de total négatif)
```

### 2. Page admin `/admin/reductions`

Remplace le stub `ComingSoon`, sur le même modèle que `Catégories`/`Livraison` déjà existants (Server Component + Server Actions, pas de librairie de formulaire) :

* **Liste** : table (code, type, valeur formatée — `20%` ou `10,00 €`, expiration ou "—", badge Actif/Inactif, date de création), lien de création, action rapide toggle actif/inactif par ligne.
* **Formulaire création/édition** : champ code (texte, uppercased à la saisie), radio Pourcentage/Montant fixe, champ valeur (validation serveur : 1-100 si Pourcentage entier, > 0 si Fixe), champ date d'expiration optionnel (`<input type="date">`).
* **Suppression** : possible à tout moment (`discountCodeId` nullable sur `Order` — supprimer un code ne casse aucune commande passée, qui garde `discountCents` figé).
* Server Actions : `createDiscountCode`, `updateDiscountCode`, `toggleDiscountCodeActive`, `deleteDiscountCode` — dans `app/admin/(dashboard)/reductions/actions.ts`, revalidation de la page après chaque mutation (`revalidatePath`), même pattern que `produits`/`categories`.

### 3. Application au checkout

**Aperçu en direct** — nouvelle Server Action dans `app/[locale]/checkout/actions.ts` :

```typescript
validateDiscountCode(code: string, subtotalCents: number): Promise<{ discountCents: number; code: string } | { error: string }>
```

Cherche le code (uppercased), vérifie `isActive` et (`expiresAt === null || expiresAt > now`), calcule via `computeDiscountCents`. Retourne `{ error: 'Code promo invalide' }` si introuvable/inactif, `{ error: 'Ce code a expiré' }` si expiré.

Le formulaire checkout (section formulaire, sous le champ Pays) ajoute : champ texte + bouton "Appliquer" appelant cette action ; en cas de succès, une ligne "Réduction" apparaît dans le récapitulatif (entre Sous-total et Livraison), négative, et le Total est recalculé côté client pour l'affichage.

**Application réelle à la commande** — `createOrder` (déjà existant) gagne un paramètre optionnel `discountCode?: string`. Si fourni :
1. Re-fait la même recherche + les mêmes vérifications `isActive`/`expiresAt` **au moment de la soumission**, indépendamment de ce qui a été prévisualisé (le code a pu expirer/être désactivé entre l'aperçu et le clic "Payer").
2. Si invalide à ce stade → retourne `{ error: '...' }`, aucune commande n'est créée.
3. Si valide → recalcule `discountCents` via `computeDiscountCents` avec le **vrai** sous-total serveur (prix DB au moment de la commande, pas une valeur envoyée par le client), l'inclut dans `totalCents`, et stocke `discountCodeId`/`discountCents` sur l'`Order` créé.

Le montant de réduction affiché côté client pendant l'aperçu n'est donc qu'indicatif — jamais transmis tel quel ni utilisé pour construire la commande.

### 4. Tests

Convention déjà établie (Vitest, Node, pas de jsdom) :
* `lib/discountCode.test.ts` — `computeDiscountCents` : calcul PERCENT (avec arrondi), calcul FIXED, clamp FIXED > subtotal, valeurs limites (0%, 100%, subtotal exact).
* Page admin, Server Actions et flux checkout complet vérifiés manuellement contre le serveur de dev (pas de test automatisé au-delà de la fonction pure — même limite que le reste du projet, absence de jsdom/React Testing Library).

## Critères d'acceptation

1. Créer un code `SOLDES20` (Pourcentage, 20) depuis `/admin/reductions` ; il apparaît dans la liste, actif.
2. Au checkout, entrer `soldes20` (minuscules) et cliquer "Appliquer" affiche une ligne "Réduction" correcte (20% du sous-total) et met à jour le Total.
3. Soumettre la commande avec ce code crée un `Order` dont `discountCents`/`discountCodeId` reflètent bien la réduction, et `totalCents` en tient compte.
4. Un code inexistant ou désactivé affiche "Code promo invalide" sans rien modifier.
5. Un code dont `expiresAt` est dans le passé affiche "Ce code a expiré", à l'aperçu comme à la soumission finale.
6. Un code `FIXED` dont la valeur dépasse le sous-total ne rend jamais `totalCents` négatif (clampé au sous-total, livraison ajoutée ensuite normalement).
7. Désactiver ou supprimer un code depuis l'admin après qu'il ait servi sur une commande passée ne modifie pas cette commande existante (`discountCents` déjà figé).
8. `npx tsc --noEmit`, `npm run lint` et `npm test` passent sans erreur.
