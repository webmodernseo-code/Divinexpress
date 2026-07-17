# DivinExpress — Refonte Homepage (Design Spec)

## Contexte

Le design précédent (système "Handoff Divinexpress" + refonte "premium Nike-style" de Gemini) a été entièrement supprimé à la demande de l'utilisateur (voir commit `64347eb`). Toute la logique métier (Prisma, `lib/catalog.ts`, `lib/filters.ts`, `lib/pricing.ts`, `lib/i18n-utils.ts`, routage i18n) reste intacte et sert de socle à cette refonte.

L'utilisateur a fourni une capture d'écran de référence : la homepage du site de démo "SNIKEI" (boutique de chaussures, template Webflow). Ce document spécifie comment adapter cette structure et cette esthétique à DivinExpress (boutique de vêtements, France + Afrique de l'Ouest).

Ce spec couvre **uniquement la homepage**, ainsi que les composants partagés qu'elle met en place (Header, Footer, TrustBar, ProductCard/ProductGrid, CategoryStrip). Les autres pages du site (Shop/PLP, PDP, Catégories, About, Contact, Blog) ont été vues dans des captures ultérieures mais sont explicitement **hors périmètre** de ce spec — elles feront chacune l'objet d'un brainstorm dédié une fois cette base commune posée.

## But

Donner à la homepage DivinExpress l'esthétique et la structure de la référence SNIKEI (bandeau promo, hero, réassurance, bannières promo, grilles produits, catégories, témoignages, aperçu blog, footer 4 colonnes), avec le contenu réel de DivinExpress partout où il existe, et du contenu provisoire clairement identifié partout où il n'existe pas encore.

## Palette et tokens visuels

Reprise telle quelle de l'image de référence (pas d'identité DivinExpress préexistante à respecter) :

- **Noir** (`#111111` env.) — bandeau du haut, boutons primaires, footer.
- **Beige/brun** — fond du hero (photo lifestyle).
- **Blanc** — fond général du corps de page.
- **Gris clair** — fonds de cartes produit / image placeholder.
- Typographie : une sans-serif grasse pour les titres (proche de celle de l'image), texte courant en sans-serif standard.

Ces valeurs seront posées comme tokens CSS (`app/styles/tokens.css`, réintroduit) : couleurs, espacements, rayons, typographie — mêmes catégories que l'ancien design system, valeurs nouvelles.

## Architecture technique

Composants sous `components/`, un dossier par composant avec son `.module.css`, pas de Tailwind (convention du projet). Chaque section de la homepage devient un composant isolé et réutilisable :

- `components/Header/Header.tsx` — logo, nav, recherche, panier, compte
- `components/Header/MessageCarousel.tsx` — bandeau noir défilant
- `components/Footer/Footer.tsx` — footer 4 colonnes
- `components/Hero/Hero.tsx`
- `components/TrustBar/TrustBar.tsx` — 4 points de réassurance
- `components/PromoBanner/PromoBanner.tsx` — bannière image + texte + lien (réutilisée 2× pour les bannières promo, 1× pour la bannière -15%)
- `components/CategoryStrip/CategoryStrip.tsx`
- `components/ProductCard/ProductCard.tsx` + `components/ProductGrid/ProductGrid.tsx` — réutilisés pour Best Sellers et New Arrivals, et prévus pour être réutilisés sur Shop/PLP plus tard
- `components/Testimonials/Testimonials.tsx`
- `components/BlogPreview/BlogPreview.tsx`

`app/[locale]/layout.tsx` retrouve `Header` + `Footer`. `app/[locale]/page.tsx` compose les sections dans l'ordre de la référence.

## Changement de données

Ajout d'un champ `featured Boolean @default(false)` sur le modèle `Product` (migration Prisma). Quelques produits du seed sont marqués `featured: true` pour peupler "Best Sellers". "New Arrivals" n'a besoin d'aucun changement : tri existant par `createdAt desc` sur les produits publiés.

## Sections de la homepage

1. **Bandeau promo (topbar)** — noir, texte défilant. Contenu réel existant (`header.topbarMsg1`, `header.topbarMsg2`).
2. **Header** — logo "DX" / "DIVINEXPRESS", nav Homme/Femme/Running/Sale (réel), recherche, panier (icône + compteur, **le panier n'est pas encore fonctionnel — affichage visuel seulement**), icône compte (**visuelle uniquement, pas de compte client dans ce projet pour l'instant**), sélecteurs langue/devise (existants).
3. **Hero** — titre + sous-titre + 2 CTA ("Voir la boutique" → `/homme`, "Catégories" → ancre vers la section catégories). Le copy actuel (`RUN FURTHER` / `Engineered for Speed.`) vient de l'ancienne direction "running" et sera remplacé par un texte provisoire adapté à une boutique de vêtements premium (à affiner). Photo : image de stock libre de droits (mode/vêtements), clairement un placeholder à remplacer par une vraie photo DivinExpress.
4. **TrustBar** — 4 icônes + texte : paiement sécurisé, livraison France & Afrique de l'Ouest, retours faciles, qualité des matières. Contenu texte nouveau (i18n fr/en), pas de dépendance à des données réelles.
5. **2 bannières promo** — Collection Homme (lien `/homme`) et Sale (lien `/sale`). Photos stock placeholder.
6. **Best Sellers** — `ProductGrid` avec les produits `featured: true` (limite 8), via une nouvelle fonction `getFeaturedProducts()` dans `lib/catalog.ts`.
7. **Nos catégories** — `CategoryStrip`, catégories réelles de la base (`getCategories()`).
8. **Bannière -15%** — un seul `PromoBanner` statique vers `/sale`, sans carrousel multi-slides fonctionnel (une seule vraie promo existe actuellement).
9. **New Arrivals** — `ProductGrid`, produits publiés les plus récents (limite 8), via une nouvelle fonction `getNewArrivals()`.
10. **Témoignages** — 3 citations d'exemple, clairement fictives (noms génériques), sans photo réelle. **Pas de système d'avis client réel** ; section prévue pour être reconnectée à de vraies données plus tard.
11. **Aperçu blog** — 3 ou 4 cartes statiques codées en dur (image stock, titre, catégorie, date fictifs). **Aucun système de blog/CMS** derrière ; purement visuel pour l'instant.
12. **Footer** — 4 colonnes : Navigation (liens vers les pages qui existent réellement : Accueil, Catégories, Recherche ; les liens vers des pages pas encore construites pointent vers `#` avec un commentaire TODO plutôt que de créer de fausses pages), Catégories (réelles), Pages utilitaires (placeholders `#`), Contact (email réel confirmé : `contact@divinexpress.fr` — **pas d'adresse physique inventée**, contrairement à la référence qui affiche deux faux magasins US). Ligne du bas : logos de paiement génériques en SVG inline (Visa/Mastercard/PayPal — décoratif, ne présume pas de l'intégration de paiement réelle), liens légaux en placeholder, copyright DivinExpress.

## Ce qui reste explicitement hors périmètre

- Les 6 autres pages vues en capture (Shop/PLP, PDP, Catégories, About, Contact, Blog) — chacune aura son propre cycle brainstorm → spec → plan.
- Tout système de blog/CMS réel.
- Tout système d'avis clients réel.
- Le panier et le compte client fonctionnels (actuellement visuels seulement dans le header).

## Critères d'acceptation

1. Les 12 sections listées sont présentes dans cet ordre sur `/fr` et `/en`.
2. Best Sellers et New Arrivals affichent de vrais produits issus de la base (pas de données codées en dur pour ces deux grilles).
3. Nos catégories affiche les vraies catégories de la base.
4. Aucune fausse donnée d'entreprise (adresse, téléphone) n'est affichée ; l'email de contact est le vrai (`contact@divinexpress.fr`).
5. Le carrousel du bandeau défile automatiquement entre les deux messages existants.
6. `npm run lint`, `npx vitest run` et `npm run build` passent tous les trois.
7. La page reste responsive (mobile/desktop), même sans breakpoints détaillés dans ce spec — à valider visuellement à l'implémentation.
