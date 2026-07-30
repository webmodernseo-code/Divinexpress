# Reign — Vitrine E-commerce Front-end (Phase 1) — Plan d'implémentation

> **Pour les travailleurs agentiques :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe de case à cocher (`- [ ]`) pour le suivi.

**Objectif :** Construire l'intégralité de la vitrine e-commerce front-end de Reign — bilingue (FR/EN), double devise (EUR/GBP), design premium noir/blanc — telle que spécifiée dans `docs/superpowers/specs/2026-07-30-reign-site-vitrine-design.md`, sans vrai backend, paiement ni authentification.

**Architecture :** Next.js 16 (App Router, TypeScript, dossier `src/`) avec `next-intl` pour un routage i18n préfixé par l'URL (`/fr`, `/en`). Tout l'état produit, panier, favoris et devise vit côté client (React Context + `localStorage`) ; les données produits/contenu vivent dans des fichiers TypeScript locaux. Conformément à la méthodologie "design avant logique codée en dur" de la section 8 de la spec : le design system partagé, les données produits et les contextes d'état sont construits et testés en premier comme des fondations indépendantes (Tâches 1–12), chacune vérifiée isolément avant qu'une page n'en dépende. Chaque tâche de page à partir de la Tâche 13 assemble ensuite sa mise en page visuelle, son interactivité et son câblage de données en une seule tranche verticale revue d'un bloc — puisque la logique sous-jacente qu'elle consomme a déjà été construite et testée dans sa propre tâche, aucune page n'est jamais construite contre une donnée ou une plomberie d'état non vérifiée.

**Stack technique :** Next.js 16.x, React 19.x, TypeScript, Tailwind CSS v4, next-intl v4, Vitest + React Testing Library + jsdom.

## Contraintes globales

- Versions des outils/frameworks : utiliser ce que `create-next-app@latest` installe au moment du scaffold (vérifié au moment de la rédaction du plan : Next.js 16.2.x, React 19.2.x, Tailwind CSS 4.3.x, TypeScript 7.0.x). Ne pas rétrograder manuellement.
- i18n : `next-intl` v4, préfixe de langue toujours présent dans l'URL (`/fr/...`, `/en/...`), les langues sont exactement `fr` (par défaut) et `en`. Pas de `src/app/layout.tsx` au niveau racine — `src/app/[locale]/layout.tsx` est le layout racine (contient `<html>`/`<body>`), conformément au pattern App Router documenté de next-intl.
- Les slugs d'URL de catégorie et de produit ne sont **jamais traduits** entre les langues — seul le texte affiché change. Exemple : `/fr/homme` et `/en/homme` fonctionnent tous les deux ; il n'existe pas de `/en/men`.
- Couleurs : noir profond `#0D0D0D`, blanc `#FFFFFF`, accent (bleu acier) `#3B4A5A`, échelle de gris de `#1A1A1A` à `#F2F2F2`. Polices : **Fraunces** (titres/éditorial) + **Inter** (texte courant/UI), chargées via `next/font/google`. Le logo de marque fourni est utilisé tel quel (jamais recréé en CSS/texte).
- Devise : taux fixe constant, 1 EUR = 0,86 GBP, isolé dans `src/lib/currency.ts`. Pas d'API de taux en temps réel en phase 1.
- Pas de backend, pas de base de données, pas de vrai processeur de paiement, pas de vraie authentification. Tout l'état est côté client (Context + `localStorage`). Aucune section compte/connexion n'existe (section 9 de la spec) — le tunnel de commande est en mode invité uniquement. Les favoris sont persistés côté client sans nécessiter de compte.
- Tout le texte visible par l'utilisateur vit dans `messages/fr.json` et `messages/en.json` (via `next-intl`) — ne jamais coder en dur une chaîne visible par l'utilisateur directement dans le JSX d'un composant.
- Stratégie de test : les unités porteuses de logique (`src/lib/**`, `src/context/**`) reçoivent de vrais tests unitaires Vitest, écrits avant l'implémentation (TDD). Les pages/composants de présentation sont vérifiés en exécutant `npm run build` (vérification des types/lint) et en vérifiant manuellement `npm run dev` dans le navigateur — ils ne reçoivent pas de tests de snapshot/DOM fragiles pour du balisage statique. Quand une page contient une vraie logique (un filtre, un validateur de formulaire, un moteur de recherche), cette logique est extraite dans une fonction testable de `src/lib/*`.
- Le texte des pages légales (mentions légales, CGV, politique de confidentialité) est un texte de **modèle** réaliste pour une marque fictive, explicitement signalé dans ce plan comme nécessitant une relecture par un professionnel qualifié avant tout lancement réel — ce n'est pas un conseil juridique vérifié.
- Gestionnaire de paquets : npm.

---

## Vue d'ensemble des tâches

1. Scaffold du projet Next.js + configuration des tests
2. Tokens de design (thème Tailwind : couleurs, polices)
3. Configuration i18n (routing/middleware/squelette de messages next-intl + layout de langue)
4. Données du catalogue produits & requêtes (lib/products.ts)
5. Utilitaires de devise + CurrencyContext
6. CartContext + calculs de panier (lib/cart.ts)
7. FavoritesContext
8. Primitives UI partagées (Container, Heading, Button, PlaceholderBlock)
9. Asset du logo de marque + composant Logo
10. Header (nav, logo, sélecteurs langue/devise, compteurs panier/favoris)
11. Footer + bandeau de consentement cookies
12. Drawer panier
13. Page d'accueil
14. Page de listing catégorie (PLP) + filtres, 4 catégories
15. Fiche produit (PDP)
16. Page de résultats de recherche
17. Page favoris
18. Page panier
19. Tunnel de commande — Page livraison
20. Tunnel de commande — Page paiement (factice)
21. Tunnel de commande — Page confirmation
22. Page à propos
23. Page contact
24. Page FAQ / Aide
25. Page livraison & retours
26. Page guide des tailles + modale
27. Pages légales x3 (mentions légales, CGV, confidentialité)
28. Page 404
29. Fondations SEO (metadata, hreflang, JSON-LD, sitemap, robots)
30. Passe de QA finale

---

### Tâche 1 : Scaffold du projet Next.js + configuration des tests

**Fichiers :**
- Créer : l'ensemble du projet via la CLI (`package.json`, `next.config.ts`, `tsconfig.json`, `src/app/globals.css`, config eslint, etc.)
- Créer : `vitest.config.ts`
- Créer : `src/test/setup.ts`
- Modifier : `package.json` (ajouter les scripts `test` / `test:watch`)

**Interfaces :**
- Consomme : rien (première tâche).
- Produit : un serveur de dev Next.js fonctionnel (`npm run dev`), un build qui fonctionne (`npm run build`), et un lanceur Vitest qui fonctionne (`npm run test`), sur lesquels toutes les tâches suivantes s'appuient.

- [ ] **Étape 1 : Scaffolder le projet**

À exécuter depuis la racine du dépôt (elle contient déjà `.git`, `.gitignore`, `docs/`, `claude skills/` — rien de tout ça n'entre en conflit avec `create-next-app`) :

```bash
yes | npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Si le `create-next-app` installé rejette un flag (les flags de la CLI changent parfois), exécuter `npx create-next-app@latest --help` pour voir les noms de flags actuels et relancer avec les options équivalentes — l'intention est : TypeScript, Tailwind CSS, ESLint, App Router, dossier `src/`, alias d'import `@/*`.

- [ ] **Étape 2 : Vérifier que le scaffold build et démarre**

Exécuter : `npm run build`
Résultat attendu : le build se termine avec succès (page de démarrage par défaut de Next.js).

- [ ] **Étape 3 : Installer les dépendances de test**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Étape 4 : Créer la config Vitest**

Créer `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

- [ ] **Étape 5 : Créer le fichier de setup des tests**

Créer `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Étape 6 : Ajouter les scripts de test à package.json**

Modifier la section `scripts` de `package.json` pour ajouter :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Étape 7 : Vérifier que le lanceur de tests fonctionne**

Exécuter : `npm run test`
Résultat attendu : Vitest démarre, indique qu'aucun fichier de test n'a encore été trouvé, et se termine sans erreur de configuration. Cela confirme que l'environnement de test est correctement branché avant l'écriture des premiers vrais tests à la Tâche 4.

- [ ] **Étape 8 : Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, TypeScript, and Vitest"
```

---

### Tâche 2 : Tokens de design (thème Tailwind : couleurs, polices)

**Fichiers :**
- Créer : `src/lib/fonts.ts`
- Modifier : `src/app/globals.css`

**Interfaces :**
- Consomme : rien au-delà du scaffold de la Tâche 1.
- Produit : les classes utilitaires Tailwind `bg-ink`, `text-ink`, `bg-paper`, `text-paper`, `bg-accent`, `text-accent`, `bg-mist-{50,100,...,900}`, plus les variables CSS `--font-serif` / `--font-sans` et les exports `fraunces` / `inter` de `src/lib/fonts.ts` à utiliser dans les props `className`/`variable` de `next/font`.

- [ ] **Étape 1 : Définir les chargeurs de polices**

Créer `src/lib/fonts.ts`:

```ts
import { Fraunces, Inter } from 'next/font/google';

// Note: these variable names are NOT `--font-serif`/`--font-sans` on purpose —
// they get mapped to those Tailwind theme tokens in globals.css, and reusing
// the same name on both sides would create an invalid circular CSS variable.
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--reign-font-serif',
  display: 'swap'
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--reign-font-sans',
  display: 'swap'
});
```

- [ ] **Étape 2 : Définir les tokens couleur/thème dans globals.css**

Modifier `src/app/globals.css` — remplacer son contenu par :

```css
@import "tailwindcss";

@theme inline {
  --color-ink: #0d0d0d;
  --color-paper: #ffffff;
  --color-accent: #3b4a5a;

  --color-mist-50: #f2f2f2;
  --color-mist-100: #e6e6e6;
  --color-mist-200: #cccccc;
  --color-mist-300: #b3b3b3;
  --color-mist-400: #999999;
  --color-mist-500: #808080;
  --color-mist-600: #666666;
  --color-mist-700: #4d4d4d;
  --color-mist-800: #333333;
  --color-mist-900: #1a1a1a;

  --font-sans: var(--reign-font-sans);
  --font-serif: var(--reign-font-serif);
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
}
```

Cela rend `bg-ink`, `text-ink`, `bg-paper`, `text-paper`, `bg-accent`, `text-accent`, `border-accent`, `bg-mist-50`...`bg-mist-900`, `font-sans` et `font-serif` disponibles comme utilitaires Tailwind (Tailwind CSS v4 génère les utilitaires directement à partir des tokens `@theme` — pas besoin d'entrée dans `tailwind.config.ts` pour ceux-ci).

- [ ] **Étape 3 : Vérifier que les tokens compilent**

Exécuter : `npm run build`
Résultat attendu : le build réussit sans erreur Tailwind/CSS. (Il n'y a pas de test unitaire dédié pour les tokens CSS — c'est un aspect présentation/configuration vérifié par le build, conformément à la stratégie de test des Contraintes globales.)

- [ ] **Étape 4 : Commit**

```bash
git add src/lib/fonts.ts src/app/globals.css
git commit -m "feat: add Reign color and typography design tokens"
```

---

### Tâche 3 : Configuration i18n (routing/middleware/messages next-intl + layout de langue)

**Fichiers :**
- Créer : `src/i18n/routing.ts`
- Créer : `src/i18n/navigation.ts`
- Créer : `src/i18n/request.ts`
- Créer : `src/middleware.ts`
- Créer : `messages/fr.json`
- Créer : `messages/en.json`
- Créer : `src/app/[locale]/layout.tsx`
- Modifier : `next.config.ts`
- Supprimer : `src/app/page.tsx`, `src/app/layout.tsx` (les fichiers par défaut du scaffold — remplacés par les versions conscientes de la langue)

**Interfaces :**
- Consomme : `fraunces` / `inter` de `src/lib/fonts.ts` (Tâche 2).
- Produit : `routing` (langues `['fr','en']`, défaut `fr`) et `{ Link, redirect, usePathname, useRouter, getPathname }` de `src/i18n/navigation.ts` — toute page/composant ultérieur qui a besoin de liens conscients de la langue ou de la langue courante importe depuis ici, pas directement depuis `next/navigation` (sauf pour lire `searchParams`, qui est indépendant de la langue). `src/app/[locale]/layout.tsx` rend `<html>`/`<body>` et sera étendu par les tâches suivantes (5, 6, 7, 10, 11) pour ajouter les providers, le Header et le Footer.

- [ ] **Étape 1 : Installer next-intl**

Exécuter : `npm install next-intl`

- [ ] **Étape 2 : Définir la config de routing**

Créer `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr'
});
```

- [ ] **Étape 3 : Définir les helpers de navigation conscients de la langue**

Créer `src/i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Étape 4 : Définir la config de requête (charge les messages par requête)**

Créer `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

- [ ] **Étape 5 : Brancher le middleware**

Créer `src/middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

- [ ] **Étape 6 : Brancher le plugin de config Next.js**

Modifier `next.config.ts`:

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Étape 7 : Créer les fichiers de messages bilingues de base**

Créer `messages/fr.json`:

```json
{
  "nav": {
    "homme": "Homme",
    "femme": "Femme",
    "enfant": "Enfant",
    "accessoires": "Accessoires",
    "search": "Rechercher",
    "cart": "Panier",
    "favorites": "Favoris"
  },
  "common": {
    "brand": "Reign"
  }
}
```

Créer `messages/en.json`:

```json
{
  "nav": {
    "homme": "Men",
    "femme": "Women",
    "enfant": "Kids",
    "accessoires": "Accessories",
    "search": "Search",
    "cart": "Cart",
    "favorites": "Favorites"
  },
  "common": {
    "brand": "Reign"
  }
}
```

(Les tâches suivantes ajoutent des namespaces aux deux fichiers au fur et à mesure qu'elles construisent chaque page — toujours dans les deux fichiers ensemble, à la même étape, pour que les deux ne divergent jamais.)

- [ ] **Étape 8 : Supprimer la page/layout racine par défaut du scaffold**

Exécuter : `rm src/app/page.tsx src/app/layout.tsx`

- [ ] **Étape 9 : Créer le layout de langue**

Créer `src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { fraunces, inter } from '@/lib/fonts';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Reign',
  description: 'Reign — vêtements et accessoires premium.'
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

C'est volontairement minimal pour l'instant — les Tâches 5, 6 et 7 vont chacune envelopper `{children}` avec leur propre Context provider, et les Tâches 10/11 ajouteront `<Header />`/`<Footer />`/`<CookieBanner />` autour de `<main>`.

- [ ] **Étape 10 : Ajouter un placeholder d'accueil temporaire pour que la route se résolve**

Créer `src/app/[locale]/page.tsx`:

```tsx
export default function HomePage() {
  return <div className="p-12 text-center">Reign — home page coming in Tâche 13.</div>;
}
```

(Le vrai contenu de ce fichier est écrit à la Tâche 13 — son seul but pour l'instant est de prouver que le routage `[locale]` fonctionne de bout en bout.)

- [ ] **Étape 11 : Vérifier que le routage fonctionne**

Exécuter : `npm run dev`, puis visiter `http://localhost:3000/` — on s'attend à une redirection vers `http://localhost:3000/fr` affichant le texte placeholder. Visiter `http://localhost:3000/en` directement — on s'attend au même placeholder (le contenu est indépendant de la langue à ce stade ; le câblage de traduction sera vraiment exercé à partir du Header de la Tâche 10). Visiter `http://localhost:3000/de` — on s'attend à un 404.

- [ ] **Étape 12 : Commit**

```bash
git add -A
git commit -m "feat: add next-intl i18n routing and locale layout"
```

---

### Tâche 4 : Données du catalogue produits & requêtes (lib/products.ts)

**Fichiers :**
- Créer : `src/lib/products.ts`
- Test : `src/lib/products.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit (utilisé par presque toutes les tâches suivantes) : le type `Category`, le tableau `CATEGORIES`, l'interface `Product`, la map `COLOR_SWATCHES`, le tableau `PRODUCTS`, `getProductsByCategory(category)`, `getProductBySlug(slug)`, `getProductById(id)`, `searchProducts(query, locale)`, `getRelatedProducts(product)`.

- [ ] **Étape 1 : Écrire les tests en échec**

Créer `src/lib/products.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getProductsByCategory,
  getProductBySlug,
  getProductById,
  searchProducts,
  getRelatedProducts,
  PRODUCTS
} from './products';

describe('getProductsByCategory', () => {
  it('returns only products in the requested category', () => {
    const results = getProductsByCategory('femme');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === 'femme')).toBe(true);
  });
});

describe('getProductBySlug', () => {
  it('finds a known product by its slug', () => {
    const product = getProductBySlug(PRODUCTS[0].slug);
    expect(product?.id).toBe(PRODUCTS[0].id);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProductBySlug('does-not-exist')).toBeUndefined();
  });
});

describe('getProductById', () => {
  it('finds a known product by its id', () => {
    const product = getProductById(PRODUCTS[0].id);
    expect(product?.slug).toBe(PRODUCTS[0].slug);
  });
});

describe('searchProducts', () => {
  it('matches on the French name', () => {
    const target = PRODUCTS[0];
    const results = searchProducts(target.name.fr.slice(0, 4), 'fr');
    expect(results.some((p) => p.id === target.id)).toBe(true);
  });

  it('matches on the English name', () => {
    const target = PRODUCTS[0];
    const results = searchProducts(target.name.en.slice(0, 4), 'en');
    expect(results.some((p) => p.id === target.id)).toBe(true);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchProducts('zzzznomatch', 'fr')).toEqual([]);
  });
});

describe('getRelatedProducts', () => {
  it('returns products referenced by relatedProductIds', () => {
    const withRelated = PRODUCTS.find((p) => (p.relatedProductIds?.length ?? 0) > 0)!;
    const related = getRelatedProducts(withRelated);
    expect(related.length).toBe(withRelated.relatedProductIds!.length);
    expect(related.every((p) => p.id !== withRelated.id)).toBe(true);
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/products.test.ts`
Résultat attendu : ÉCHEC — `products.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter le catalogue produits**

Créer `src/lib/products.ts`:

```ts
export type Category = 'homme' | 'femme' | 'enfant' | 'accessoires';
export type Locale = 'fr' | 'en';

export const CATEGORIES: Category[] = ['homme', 'femme', 'enfant', 'accessoires'];

export interface LocalizedText {
  fr: string;
  en: string;
}

export interface Product {
  id: string;
  slug: string;
  category: Category;
  subcategory: string;
  name: LocalizedText;
  description: LocalizedText;
  priceEur: number;
  sizes: string[];
  colors: string[];
  imageCount: number;
  isNew?: boolean;
  relatedProductIds?: string[];
}

export const COLOR_SWATCHES: Record<string, string> = {
  Noir: '#0d0d0d',
  Blanc: '#ffffff',
  'Bleu acier': '#3b4a5a',
  Gris: '#808080',
  Écru: '#e6e2d8',
  Camel: '#a9744f'
};

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const KIDS_SIZES = ['4A', '6A', '8A', '10A', '12A'];

export const PRODUCTS: Product[] = [
  {
    id: 'homme-veste-oversize',
    slug: 'homme-veste-oversize',
    category: 'homme',
    subcategory: 'vestes',
    name: { fr: 'Veste oversize structurée', en: 'Structured oversized jacket' },
    description: {
      fr: "Une veste à l'épaule marquée et à la coupe ample, pensée pour une silhouette affirmée.",
      en: 'A sharp-shouldered, generously cut jacket built for a strong silhouette.'
    },
    priceEur: 320,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 4,
    isNew: true,
    relatedProductIds: ['homme-pantalon-droit', 'homme-chemise-col-mao']
  },
  {
    id: 'homme-t-shirt-essentiel',
    slug: 'homme-t-shirt-essentiel',
    category: 'homme',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt essentiel côtelé', en: 'Essential ribbed t-shirt' },
    description: {
      fr: 'Coton côtelé épais, coupe droite, pour une base solide de vestiaire.',
      en: 'Heavyweight ribbed cotton, straight cut, a solid wardrobe staple.'
    },
    priceEur: 65,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Écru'],
    imageCount: 3
  },
  {
    id: 'homme-pantalon-droit',
    slug: 'homme-pantalon-droit',
    category: 'homme',
    subcategory: 'pantalons',
    name: { fr: 'Pantalon droit taille haute', en: 'High-rise straight trousers' },
    description: {
      fr: 'Coupe droite intemporelle en twill dense, taille haute structurée.',
      en: 'Timeless straight cut in dense twill, structured high-rise waist.'
    },
    priceEur: 145,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 3,
    relatedProductIds: ['homme-veste-oversize']
  },
  {
    id: 'homme-chemise-col-mao',
    slug: 'homme-chemise-col-mao',
    category: 'homme',
    subcategory: 'chemises',
    name: { fr: 'Chemise col mao', en: 'Mandarin collar shirt' },
    description: {
      fr: 'Popeline légère, col mao épuré, boutonnage invisible.',
      en: 'Lightweight poplin, clean mandarin collar, concealed placket.'
    },
    priceEur: 110,
    sizes: CLOTHING_SIZES,
    colors: ['Blanc', 'Noir'],
    imageCount: 3
  },
  {
    id: 'femme-robe-fluide',
    slug: 'femme-robe-fluide',
    category: 'femme',
    subcategory: 'robes',
    name: { fr: 'Robe fluide asymétrique', en: 'Asymmetric flowing dress' },
    description: {
      fr: 'Drapé fluide, ourlet asymétrique, coupe qui accompagne le mouvement.',
      en: 'Fluid drape, asymmetric hem, a cut that moves with you.'
    },
    priceEur: 235,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 4,
    isNew: true,
    relatedProductIds: ['femme-manteau-long', 'accessoires-ceinture-cuir']
  },
  {
    id: 'femme-t-shirt-essentiel',
    slug: 'femme-t-shirt-essentiel',
    category: 'femme',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt essentiel côtelé', en: 'Essential ribbed t-shirt' },
    description: {
      fr: 'Coton côtelé, coupe ajustée, encolure ronde épurée.',
      en: 'Ribbed cotton, fitted cut, clean crew neckline.'
    },
    priceEur: 62,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Écru'],
    imageCount: 3
  },
  {
    id: 'femme-manteau-long',
    slug: 'femme-manteau-long',
    category: 'femme',
    subcategory: 'manteaux',
    name: { fr: 'Manteau long en laine', en: 'Long wool coat' },
    description: {
      fr: 'Laine dense, coupe longue et épurée, doublure satinée.',
      en: 'Dense wool, long clean cut, satin lining.'
    },
    priceEur: 410,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Camel'],
    imageCount: 4,
    relatedProductIds: ['femme-robe-fluide']
  },
  {
    id: 'femme-pantalon-tailleur',
    slug: 'femme-pantalon-tailleur',
    category: 'femme',
    subcategory: 'pantalons',
    name: { fr: 'Pantalon tailleur fluide', en: 'Fluid tailored trousers' },
    description: {
      fr: 'Tombé fluide, pli marqué, taille haute ajustée.',
      en: 'Fluid drape, sharp crease, fitted high rise.'
    },
    priceEur: 155,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 3
  },
  {
    id: 'enfant-t-shirt-graphique',
    slug: 'enfant-t-shirt-graphique',
    category: 'enfant',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt graphique Reign', en: 'Reign graphic t-shirt' },
    description: {
      fr: 'Jersey doux, imprimé graphique discret, coupe confortable.',
      en: 'Soft jersey, subtle graphic print, comfortable fit.'
    },
    priceEur: 45,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Blanc'],
    imageCount: 2,
    isNew: true
  },
  {
    id: 'enfant-sweat-capuche',
    slug: 'enfant-sweat-capuche',
    category: 'enfant',
    subcategory: 'sweats',
    name: { fr: 'Sweat à capuche molleton', en: 'Fleece hoodie' },
    description: {
      fr: 'Molleton épais, capuche doublée, poche kangourou.',
      en: 'Heavyweight fleece, lined hood, kangaroo pocket.'
    },
    priceEur: 68,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 3
  },
  {
    id: 'enfant-pantalon-jogger',
    slug: 'enfant-pantalon-jogger',
    category: 'enfant',
    subcategory: 'pantalons',
    name: { fr: 'Jogger molleton', en: 'Fleece joggers' },
    description: {
      fr: 'Taille élastiquée, chevilles resserrées, confort au quotidien.',
      en: 'Elastic waist, tapered ankles, everyday comfort.'
    },
    priceEur: 52,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 2
  },
  {
    id: 'enfant-veste-legere',
    slug: 'enfant-veste-legere',
    category: 'enfant',
    subcategory: 'vestes',
    name: { fr: 'Veste légère coupe-vent', en: 'Lightweight windbreaker' },
    description: {
      fr: 'Tissu déperlant, capuche amovible, coupe droite.',
      en: 'Water-repellent fabric, removable hood, straight cut.'
    },
    priceEur: 78,
    sizes: KIDS_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 2
  },
  {
    id: 'accessoires-sac-cabas',
    slug: 'accessoires-sac-cabas',
    category: 'accessoires',
    subcategory: 'sacs',
    name: { fr: 'Sac cabas cuir grainé', en: 'Grained leather tote' },
    description: {
      fr: 'Cuir grainé épais, anses courtes, intérieur compartimenté.',
      en: 'Thick grained leather, short handles, compartmented interior.'
    },
    priceEur: 290,
    sizes: ['UNIQUE'],
    colors: ['Noir', 'Camel'],
    imageCount: 3,
    isNew: true,
    relatedProductIds: ['accessoires-ceinture-cuir']
  },
  {
    id: 'accessoires-ceinture-cuir',
    slug: 'accessoires-ceinture-cuir',
    category: 'accessoires',
    subcategory: 'ceintures',
    name: { fr: 'Ceinture cuir boucle signature', en: 'Signature buckle leather belt' },
    description: {
      fr: 'Cuir pleine fleur, boucle métal brossé gravée Reign.',
      en: 'Full-grain leather, brushed metal buckle engraved Reign.'
    },
    priceEur: 95,
    sizes: ['S/M', 'L/XL'],
    colors: ['Noir', 'Camel'],
    imageCount: 2,
    relatedProductIds: ['accessoires-sac-cabas']
  },
  {
    id: 'accessoires-bijou-anneau',
    slug: 'accessoires-bijou-anneau',
    category: 'accessoires',
    subcategory: 'bijoux',
    name: { fr: 'Anneau signature acier', en: 'Signature steel ring' },
    description: {
      fr: 'Acier brossé massif, gravure minimaliste Reign.',
      en: 'Solid brushed steel, minimalist Reign engraving.'
    },
    priceEur: 85,
    sizes: ['UNIQUE'],
    colors: ['Bleu acier'],
    imageCount: 2
  },
  {
    id: 'accessoires-chapeau-laine',
    slug: 'accessoires-chapeau-laine',
    category: 'accessoires',
    subcategory: 'chapeaux',
    name: { fr: 'Bonnet laine mérinos', en: 'Merino wool beanie' },
    description: {
      fr: 'Laine mérinos douce, revers côtelé, patch Reign discret.',
      en: 'Soft merino wool, ribbed cuff, discreet Reign patch.'
    },
    priceEur: 55,
    sizes: ['UNIQUE'],
    colors: ['Noir', 'Gris'],
    imageCount: 2
  }
];

export function getProductsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string, locale: Locale): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return PRODUCTS.filter((p) => p.name[locale].toLowerCase().includes(normalized));
}

export function getRelatedProducts(product: Product): Product[] {
  if (!product.relatedProductIds) return [];
  return product.relatedProductIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/products.test.ts`
Résultat attendu : succès (tous les cas).

- [ ] **Étape 5 : Commit**

```bash
git add src/lib/products.ts src/lib/products.test.ts
git commit -m "feat: add product catalog data and query helpers"
```

---

### Tâche 5 : Utilitaires de devise + CurrencyContext

**Fichiers :**
- Créer : `src/lib/currency.ts`
- Test : `src/lib/currency.test.ts`
- Créer : `src/context/CurrencyContext.tsx`
- Test : `src/context/CurrencyContext.test.tsx`
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : rien au-delà de la chaîne de langue déjà disponible dans le layout.
- Produit : `CurrencyCode` (`'EUR' | 'GBP'`), `convertFromEur(amountEur, currency)`, `formatPrice(amountEur, currency, locale)`, `defaultCurrencyForLocale(locale)` depuis `src/lib/currency.ts`; `CurrencyProvider`, `useCurrency(): { currency, setCurrency }` depuis `src/context/CurrencyContext.tsx`. Chaque tâche suivante qui affiche un prix utilise `formatPrice` + `useCurrency()`.

- [ ] **Étape 1 : Écrire les tests en échec pour les utilitaires de devise**

Créer `src/lib/currency.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { convertFromEur, formatPrice, defaultCurrencyForLocale } from './currency';

describe('convertFromEur', () => {
  it('returns the same amount for EUR', () => {
    expect(convertFromEur(100, 'EUR')).toBe(100);
  });

  it('applies the fixed rate for GBP', () => {
    expect(convertFromEur(100, 'GBP')).toBeCloseTo(86, 5);
  });
});

describe('formatPrice', () => {
  it('formats EUR amounts with the French locale', () => {
    const formatted = formatPrice(100, 'EUR', 'fr');
    expect(formatted).toContain('100');
    expect(formatted).toMatch(/€/);
  });

  it('formats GBP amounts with the English locale', () => {
    const formatted = formatPrice(100, 'GBP', 'en');
    expect(formatted).toMatch(/£/);
  });
});

describe('defaultCurrencyForLocale', () => {
  it('defaults French to EUR', () => {
    expect(defaultCurrencyForLocale('fr')).toBe('EUR');
  });

  it('defaults English to GBP', () => {
    expect(defaultCurrencyForLocale('en')).toBe('GBP');
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/currency.test.ts`
Résultat attendu : ÉCHEC — `currency.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter les utilitaires de devise**

Créer `src/lib/currency.ts`:

```ts
export type CurrencyCode = 'EUR' | 'GBP';

export const FIXED_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  GBP: 0.86
};

export function convertFromEur(amountEur: number, currency: CurrencyCode): number {
  return amountEur * FIXED_RATES[currency];
}

export function formatPrice(amountEur: number, currency: CurrencyCode, locale: string): string {
  const converted = convertFromEur(amountEur, currency);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(converted);
}

export function defaultCurrencyForLocale(locale: string): CurrencyCode {
  return locale === 'en' ? 'GBP' : 'EUR';
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/currency.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Écrire les tests en échec pour CurrencyContext**

Créer `src/context/CurrencyContext.test.tsx`:

```tsx
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from './CurrencyContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider initialLocale="fr">{children}</CurrencyProvider>;
}

describe('CurrencyContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to EUR for the fr locale', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currency).toBe('EUR');
  });

  it('updates the currency and persists it to localStorage', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    act(() => {
      result.current.setCurrency('GBP');
    });
    expect(result.current.currency).toBe('GBP');
    await waitFor(() => {
      expect(window.localStorage.getItem('reign-currency')).toBe('GBP');
    });
  });

  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useCurrency())).toThrow();
  });

  it('does not clobber existing localStorage data during the initial hydration effects', () => {
    window.localStorage.setItem('reign-currency', 'GBP');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderHook(() => useCurrency(), { wrapper });
    const clobberedWithDefault = setItemSpy.mock.calls.some(
      ([key, value]) => key === 'reign-currency' && value === 'EUR'
    );
    expect(clobberedWithDefault).toBe(false);
    setItemSpy.mockRestore();
  });
});
```

- [ ] **Étape 6 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/context/CurrencyContext.test.tsx`
Résultat attendu : ÉCHEC — `CurrencyContext.tsx` n'existe pas encore.

- [ ] **Étape 7 : Implémenter CurrencyContext**

Créer `src/context/CurrencyContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CurrencyCode, defaultCurrencyForLocale } from '@/lib/currency';

const STORAGE_KEY = 'reign-currency';

export interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialLocale
}: {
  children: React.ReactNode;
  initialLocale: string;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>(() => defaultCurrencyForLocale(initialLocale));
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'EUR' || stored === 'GBP') {
        setCurrency(stored);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
```

- [ ] **Étape 8 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/context/CurrencyContext.test.tsx`
Résultat attendu : succès.

- [ ] **Étape 9 : Brancher le provider dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` — importer `CurrencyProvider` depuis `@/context/CurrencyContext` et envelopper `<main>{children}</main>` avec, en passant la `locale` résolue :

```tsx
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider initialLocale={locale}>
            <main>{children}</main>
          </CurrencyProvider>
        </NextIntlClientProvider>
```

- [ ] **Étape 10 : Vérifier que toute la suite de tests et le build passent toujours**

Exécuter : `npm run test`
Résultat attendu : succès (toutes les suites).

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 11 : Commit**

```bash
git add src/lib/currency.ts src/lib/currency.test.ts src/context/CurrencyContext.tsx src/context/CurrencyContext.test.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add fixed-rate currency conversion and CurrencyContext"
```

---

### Tâche 6 : CartContext + calculs de panier (lib/cart.ts)

**Fichiers :**
- Créer : `src/lib/cart.ts`
- Test : `src/lib/cart.test.ts`
- Créer : `src/context/CartContext.tsx`
- Test : `src/context/CartContext.test.tsx`
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : `getProductById` depuis `src/lib/products.ts` (Tâche 4).
- Produit : `CartItem { productId, size, color, quantity }`, `addLine`, `removeLine`, `updateLineQuantity`, `getCartItemCount`, `getCartSubtotalEur` depuis `src/lib/cart.ts`; `CartProvider`, `useCart(): { items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotalEur }` depuis `src/context/CartContext.tsx`. Le Header (Tâche 10) et le drawer panier (Tâche 12) dépendent tous deux de `useCart()`.

- [ ] **Étape 1 : Écrire les tests en échec pour la logique pure du panier**

Créer `src/lib/cart.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur,
  CartItem
} from './cart';
import { PRODUCTS } from './products';

const productA = PRODUCTS[0];
const productB = PRODUCTS[1];

describe('addLine', () => {
  it('adds a new line for a product/size/color not already in the cart', () => {
    const items: CartItem[] = [];
    const result = addLine(items, { productId: productA.id, size: 'M', color: 'Noir', quantity: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it('merges quantity when the same product/size/color is added again', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = addLine(items, { productId: productA.id, size: 'M', color: 'Noir', quantity: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it('keeps separate lines for the same product in a different size', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = addLine(items, { productId: productA.id, size: 'L', color: 'Noir', quantity: 1 });
    expect(result).toHaveLength(2);
  });
});

describe('removeLine', () => {
  it('removes the matching line only', () => {
    const items: CartItem[] = [
      { productId: productA.id, size: 'M', color: 'Noir', quantity: 1 },
      { productId: productB.id, size: 'S', color: 'Blanc', quantity: 1 }
    ];
    const result = removeLine(items, productA.id, 'M', 'Noir');
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe(productB.id);
  });
});

describe('updateLineQuantity', () => {
  it('updates the quantity of the matching line', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = updateLineQuantity(items, productA.id, 'M', 'Noir', 5);
    expect(result[0].quantity).toBe(5);
  });
});

describe('getCartItemCount', () => {
  it('sums quantities across all lines', () => {
    const items: CartItem[] = [
      { productId: productA.id, size: 'M', color: 'Noir', quantity: 2 },
      { productId: productB.id, size: 'S', color: 'Blanc', quantity: 3 }
    ];
    expect(getCartItemCount(items)).toBe(5);
  });
});

describe('getCartSubtotalEur', () => {
  it('sums price × quantity using catalog prices', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 2 }];
    expect(getCartSubtotalEur(items)).toBe(productA.priceEur * 2);
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/cart.test.ts`
Résultat attendu : ÉCHEC — `cart.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter la logique pure du panier**

Créer `src/lib/cart.ts`:

```ts
import { getProductById } from '@/lib/products';

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export function isSameLine(line: CartItem, productId: string, size: string, color: string): boolean {
  return line.productId === productId && line.size === size && line.color === color;
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSubtotalEur(items: CartItem[]): number {
  return items.reduce((sum, line) => {
    const product = getProductById(line.productId);
    return sum + (product ? product.priceEur * line.quantity : 0);
  }, 0);
}

export function addLine(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((line) => isSameLine(line, item.productId, item.size, item.color));
  if (existing) {
    return items.map((line) =>
      isSameLine(line, item.productId, item.size, item.color)
        ? { ...line, quantity: line.quantity + item.quantity }
        : line
    );
  }
  return [...items, item];
}

export function removeLine(items: CartItem[], productId: string, size: string, color: string): CartItem[] {
  return items.filter((line) => !isSameLine(line, productId, size, color));
}

export function updateLineQuantity(
  items: CartItem[],
  productId: string,
  size: string,
  color: string,
  quantity: number
): CartItem[] {
  return items.map((line) => (isSameLine(line, productId, size, color) ? { ...line, quantity } : line));
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/cart.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Écrire les tests en échec pour CartContext**

Créer `src/context/CartContext.test.tsx`:

```tsx
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { PRODUCTS } from '@/lib/products';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
  });

  it('adds an item and persists it to localStorage', async () => {
    const product = PRODUCTS[0];
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ productId: product.id, size: 'M', color: 'Noir', quantity: 1 });
    });
    expect(result.current.itemCount).toBe(1);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('reign-cart') ?? '[]');
      expect(stored).toHaveLength(1);
    });
  });

  it('computes the subtotal from catalog prices', () => {
    const product = PRODUCTS[0];
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ productId: product.id, size: 'M', color: 'Noir', quantity: 2 });
    });
    expect(result.current.subtotalEur).toBe(product.priceEur * 2);
  });

  it('does not clobber existing localStorage data during the initial hydration effects', () => {
    const product = PRODUCTS[0];
    const seeded = [{ productId: product.id, size: 'M', color: 'Noir', quantity: 1 }];
    window.localStorage.setItem('reign-cart', JSON.stringify(seeded));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderHook(() => useCart(), { wrapper });
    const clobberedWithEmpty = setItemSpy.mock.calls.some(
      ([key, value]) => key === 'reign-cart' && value === '[]'
    );
    expect(clobberedWithEmpty).toBe(false);
    setItemSpy.mockRestore();
  });
});
```

- [ ] **Étape 6 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/context/CartContext.test.tsx`
Résultat attendu : ÉCHEC — `CartContext.tsx` n'existe pas encore.

- [ ] **Étape 7 : Implémenter CartContext**

Créer `src/context/CartContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  CartItem,
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur
} from '@/lib/cart';

const STORAGE_KEY = 'reign-cart';

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalEur: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value: CartContextValue = {
    items,
    addItem: (item) => setItems((prev) => addLine(prev, item)),
    removeItem: (productId, size, color) => setItems((prev) => removeLine(prev, productId, size, color)),
    updateQuantity: (productId, size, color, quantity) =>
      setItems((prev) => updateLineQuantity(prev, productId, size, color, quantity)),
    clearCart: () => setItems([]),
    itemCount: getCartItemCount(items),
    subtotalEur: getCartSubtotalEur(items)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
```

- [ ] **Étape 8 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/context/CartContext.test.tsx`
Résultat attendu : succès.

- [ ] **Étape 9 : Brancher le provider dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` — import `CartProvider` depuis `@/context/CartContext` and nest it inside `CurrencyProvider`:

```tsx
          <CurrencyProvider initialLocale={locale}>
            <CartProvider>
              <main>{children}</main>
            </CartProvider>
          </CurrencyProvider>
```

- [ ] **Étape 10 : Vérifier que toute la suite de tests et le build passent toujours**

Exécuter : `npm run test`
Résultat attendu : succès.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 11 : Commit**

```bash
git add src/lib/cart.ts src/lib/cart.test.ts src/context/CartContext.tsx src/context/CartContext.test.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add cart line-item logic and CartContext"
```

---

### Tâche 7 : FavoritesContext

**Fichiers :**
- Créer : `src/lib/favorites.ts`
- Test : `src/lib/favorites.test.ts`
- Créer : `src/context/FavoritesContext.tsx`
- Test : `src/context/FavoritesContext.test.tsx`
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : rien.
- Produit : `toggleFavoriteId(ids, id)` depuis `src/lib/favorites.ts`; `FavoritesProvider`, `useFavorites(): { favoriteIds, toggleFavorite, isFavorite }` depuis `src/context/FavoritesContext.tsx`. Utilisé par le Header (compteur de favoris), le bouton cœur de la fiche produit/PDP, et la page Favoris (Tâche 17).

- [ ] **Étape 1 : Écrire le test en échec pour la logique pure de bascule**

Créer `src/lib/favorites.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toggleFavoriteId } from './favorites';

describe('toggleFavoriteId', () => {
  it('adds an id that is not yet present', () => {
    expect(toggleFavoriteId([], 'p1')).toEqual(['p1']);
  });

  it('removes an id that is already present', () => {
    expect(toggleFavoriteId(['p1', 'p2'], 'p1')).toEqual(['p2']);
  });
});
```

- [ ] **Étape 2 : Exécuter le test pour vérifier qu'il échoue**

Exécuter : `npm run test -- src/lib/favorites.test.ts`
Résultat attendu : ÉCHEC — `favorites.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter la logique pure de bascule**

Créer `src/lib/favorites.ts`:

```ts
export function toggleFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}
```

- [ ] **Étape 4 : Exécuter le test pour vérifier qu'il réussit**

Exécuter : `npm run test -- src/lib/favorites.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Écrire les tests en échec pour FavoritesContext**

Créer `src/context/FavoritesContext.test.tsx`:

```tsx
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe('FavoritesContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.isFavorite('p1')).toBe(false);
  });

  it('toggles a product in and persists it to localStorage', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(true);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('reign-favorites') ?? '[]');
      expect(stored).toEqual(['p1']);
    });
  });

  it('toggles a product back out', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(false);
  });

  it('does not clobber existing localStorage data during the initial hydration effects', () => {
    window.localStorage.setItem('reign-favorites', JSON.stringify(['p1']));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderHook(() => useFavorites(), { wrapper });
    const clobberedWithEmpty = setItemSpy.mock.calls.some(
      ([key, value]) => key === 'reign-favorites' && value === '[]'
    );
    expect(clobberedWithEmpty).toBe(false);
    setItemSpy.mockRestore();
  });
});
```

- [ ] **Étape 6 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/context/FavoritesContext.test.tsx`
Résultat attendu : ÉCHEC — `FavoritesContext.tsx` n'existe pas encore.

- [ ] **Étape 7 : Implémenter FavoritesContext**

Créer `src/context/FavoritesContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toggleFavoriteId } from '@/lib/favorites';

const STORAGE_KEY = 'reign-favorites';

export interface FavoritesContextValue {
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const value: FavoritesContextValue = {
    favoriteIds,
    toggleFavorite: (productId) => setFavoriteIds((prev) => toggleFavoriteId(prev, productId)),
    isFavorite: (productId) => favoriteIds.includes(productId)
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
```

- [ ] **Étape 8 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/context/FavoritesContext.test.tsx`
Résultat attendu : succès.

- [ ] **Étape 9 : Brancher le provider dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` — nest `FavoritesProvider` inside `CartProvider`:

```tsx
            <CartProvider>
              <FavoritesProvider>
                <main>{children}</main>
              </FavoritesProvider>
            </CartProvider>
```

- [ ] **Étape 10 : Vérifier que toute la suite de tests et le build passent toujours**

Exécuter : `npm run test`
Résultat attendu : succès.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 11 : Commit**

```bash
git add src/lib/favorites.ts src/lib/favorites.test.ts src/context/FavoritesContext.tsx src/context/FavoritesContext.test.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add favorites toggle logic and FavoritesContext"
```

---

### Tâche 8 : Primitives UI partagées (Container, Heading, Button, PlaceholderBlock)

**Fichiers :**
- Créer : `src/components/ui/Container.tsx`
- Créer : `src/components/ui/Heading.tsx`
- Créer : `src/components/ui/Button.tsx`
- Test : `src/components/ui/Button.test.ts`
- Créer : `src/components/ui/PlaceholderBlock.tsx`

**Interfaces :**
- Consomme : les tokens Tailwind de la Tâche 2.
- Produit : `<Container>`, `<Heading level={1|2|3}>`, `<Button variant="primary"|"secondary">`, `buttonClassName(variant)`, `<PlaceholderBlock aspect="portrait"|"square"|"wide" label="...">`. Chaque page à partir de la Tâche 10 est construite avec ceux-ci plutôt qu'avec du balisage ad hoc.

- [ ] **Étape 1 : Écrire le test en échec pour l'unique bout de logique réelle (les classes de variante du bouton)**

Créer `src/components/ui/Button.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buttonClassName } from './Button';

describe('buttonClassName', () => {
  it('returns a dark-filled style for the primary variant', () => {
    expect(buttonClassName('primary')).toContain('bg-ink');
  });

  it('returns an outlined style for the secondary variant', () => {
    expect(buttonClassName('secondary')).toContain('border-ink');
  });

  it('defaults to the primary variant', () => {
    expect(buttonClassName()).toBe(buttonClassName('primary'));
  });
});
```

- [ ] **Étape 2 : Exécuter le test pour vérifier qu'il échoue**

Exécuter : `npm run test -- src/components/ui/Button.test.ts`
Résultat attendu : ÉCHEC — `Button.tsx` n'existe pas encore.

- [ ] **Étape 3 : Implémenter Container**

Créer `src/components/ui/Container.tsx`:

```tsx
export function Container({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
```

- [ ] **Étape 4 : Implémenter Heading**

Créer `src/components/ui/Heading.tsx`:

```tsx
type HeadingLevel = 1 | 2 | 3;

const SIZES: Record<HeadingLevel, string> = {
  1: 'text-4xl md:text-5xl',
  2: 'text-3xl md:text-4xl',
  3: 'text-2xl'
};

export function Heading({
  level = 2,
  children,
  className = ''
}: {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return <Tag className={`font-serif ${SIZES[level]} ${className}`}>{children}</Tag>;
}
```

- [ ] **Étape 5 : Implémenter Button (et le helper buttonClassName testé)**

Créer `src/components/ui/Button.tsx`:

```tsx
type ButtonVariant = 'primary' | 'secondary';

const BASE = 'inline-flex items-center justify-center px-6 py-3 text-sm tracking-wide transition-colors';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `${BASE} bg-ink text-paper hover:bg-accent`,
  secondary: `${BASE} border border-ink text-ink hover:border-accent hover:text-accent`
};

export function buttonClassName(variant: ButtonVariant = 'primary'): string {
  return VARIANTS[variant];
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${buttonClassName(variant)} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

Remarquer le `className = ''` explicitement déstructuré de `props` : cela signifie qu'un `className` fourni par l'appelant est *ajouté* aux classes de base de la variante au lieu de les remplacer silencieusement (ce qui arriverait si `{...props}` était étalé après un attribut `className` fixe).

- [ ] **Étape 6 : Exécuter le test pour vérifier qu'il réussit**

Exécuter : `npm run test -- src/components/ui/Button.test.ts`
Résultat attendu : succès.

- [ ] **Étape 7 : Implémenter PlaceholderBlock**

Créer `src/components/ui/PlaceholderBlock.tsx`:

```tsx
type Aspect = 'portrait' | 'square' | 'wide';

const ASPECT_CLASSES: Record<Aspect, string> = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]'
};

export function PlaceholderBlock({
  aspect = 'portrait',
  label,
  className = ''
}: {
  aspect?: Aspect;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`${ASPECT_CLASSES[aspect]} flex items-center justify-center bg-mist-900 ${className}`}
      role="img"
      aria-label={label ?? 'Visuel à venir'}
    >
      {label && (
        <span className="px-4 text-center text-xs uppercase tracking-widest text-mist-400">{label}</span>
      )}
    </div>
  );
}
```

- [ ] **Étape 8 : Vérifier que toute la suite de tests et le build passent toujours**

Exécuter : `npm run test`
Résultat attendu : succès.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 9 : Commit**

```bash
git add src/components/ui/Container.tsx src/components/ui/Heading.tsx src/components/ui/Button.tsx src/components/ui/Button.test.ts src/components/ui/PlaceholderBlock.tsx
git commit -m "feat: add shared UI primitives (Container, Heading, Button, PlaceholderBlock)"
```

---

### Tâche 9 : Asset du logo de marque + composant Logo

**Fichiers :**
- Créer : `public/branding/logo-reign.png` (l'asset de marque fourni par l'utilisateur dans la conversation)
- Créer : `src/components/ui/Logo.tsx`

**Interfaces :**
- Consomme : `Link` depuis `@/i18n/navigation` (Tâche 3).
- Produit : `<Logo />` — utilisé par le Header (Tâche 10) et le Footer (Tâche 11).

**Note de design :** le logo fourni est un wordmark **noir** sur fond blanc/transparent (décision confirmée avec l'utilisateur — la version noire est celle à utiliser, pas de variante blanche sur fond noir). En conséquence, le Header (Tâche 10) utilise un fond blanc (`bg-paper`) plutôt qu'un fond noir, pour que le logo noir reste lisible — le reste de l'identité « contraste maîtrisé » (logo comme mark graphique isolé, reste du site sobre) est inchangé.

- [ ] **Étape 1 : Obtenir l'asset du logo**

Enregistrer l'image du wordmark Reign partagée plus tôt dans cette conversation vers `public/branding/logo-reign.png` (créer le dossier `public/branding/` s'il n'existe pas). Si ce fichier n'est pas présent dans le dépôt au démarrage de cette tâche, s'arrêter et le demander à l'utilisateur avant de continuer — ne pas fabriquer de logo placeholder ; la spec exige cet asset exact fourni.

- [ ] **Étape 2 : Implémenter le composant Logo**

Créer `src/components/ui/Logo.tsx`:

```tsx
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="Reign — accueil" className={`inline-flex items-center ${className}`}>
      <Image
        src="/branding/logo-reign.png"
        alt="Reign"
        width={160}
        height={52}
        priority
        className="h-8 w-auto md:h-10"
      />
    </Link>
  );
}
```

- [ ] **Étape 3 : Vérifier que le logo s'affiche**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr`, et confirmer que l'image du logo se charge sans icône d'image cassée (elle flottera seule sur la page placeholder pour l'instant — le branchement dans le Header se fait à la Tâche 10).

- [ ] **Étape 4 : Commit**

```bash
git add public/branding/logo-reign.png src/components/ui/Logo.tsx
git commit -m "feat: add brand logo asset and Logo component"
```

---

### Tâche 10 : Header (nav, logo, sélecteurs langue/devise, compteurs panier/favoris)

**Fichiers :**
- Créer : `src/components/layout/Header.tsx`
- Créer : `src/components/layout/LanguageSwitcher.tsx`
- Créer : `src/components/layout/CurrencySwitcher.tsx`
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : `Logo` (Tâche 9), `CATEGORIES` (Tâche 4), `useCart` (Tâche 6), `useFavorites` (Tâche 7), `useCurrency`/`CurrencyCode` (Tâche 5), `Link`/`useRouter` depuis `@/i18n/navigation` (Tâche 3), `nav.*` messages (Tâche 3).
- Produit : `<Header />`, rendu globalement par le layout de langue, sur toutes les pages à partir d'ici.

- [ ] **Étape 1 : Implémenter le sélecteur de langue**

Créer `src/components/layout/LanguageSwitcher.tsx`:

```tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  function switchTo(nextLocale: 'fr' | 'en') {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1 text-xs tracking-widest">
      <button
        type="button"
        onClick={() => switchTo('fr')}
        aria-pressed={locale === 'fr'}
        className={locale === 'fr' ? 'text-ink' : 'text-mist-400 hover:text-ink'}
      >
        FR
      </button>
      <span className="text-mist-600">/</span>
      <button
        type="button"
        onClick={() => switchTo('en')}
        aria-pressed={locale === 'en'}
        className={locale === 'en' ? 'text-ink' : 'text-mist-400 hover:text-ink'}
      >
        EN
      </button>
    </div>
  );
}
```

- [ ] **Étape 2 : Implémenter le sélecteur de devise**

Créer `src/components/layout/CurrencySwitcher.tsx`:

```tsx
'use client';

import { useCurrency } from '@/context/CurrencyContext';
import type { CurrencyCode } from '@/lib/currency';

const CURRENCIES: CurrencyCode[] = ['EUR', 'GBP'];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-1 text-xs tracking-widest">
      {CURRENCIES.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 && <span className="text-mist-600">/</span>}
          <button
            type="button"
            onClick={() => setCurrency(code)}
            aria-pressed={currency === code}
            className={currency === code ? 'text-ink' : 'text-mist-400 hover:text-ink'}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Étape 3 : Implémenter le Header**

Créer `src/components/layout/Header.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { CATEGORIES } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const { itemCount } = useCart();
  const { favoriteIds } = useFavorites();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsMenuOpen(false);
      router.push(`/recherche?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-mist-100 bg-paper text-ink">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm tracking-wide md:flex">
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/${category}`} className="hover:text-accent">
              {t(category)}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 items-center md:flex">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="w-full border-b border-mist-300 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-mist-500 focus:border-accent focus:outline-none"
          />
        </form>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <Link href="/favoris" aria-label={t('favorites')} className="relative hover:text-accent">
            <HeartIcon />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <Link href="/panier" aria-label={t('cart')} className="relative hover:text-accent">
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Menu"
          aria-expanded={isMenuOpen}
        >
          <MenuIcon />
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-mist-100 px-4 pb-6 md:hidden">
          <nav className="flex flex-col gap-4 pt-4 text-sm tracking-wide">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/${category}`}
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-accent"
              >
                {t(category)}
              </Link>
            ))}
          </nav>
          <form onSubmit={handleSearchSubmit} className="mt-4">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="w-full border-b border-mist-300 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-mist-500 focus:border-accent focus:outline-none"
            />
          </form>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <Link href="/favoris" onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
              {t('favorites')} {favoriteIds.length > 0 && `(${favoriteIds.length})`}
            </Link>
            <Link href="/panier" onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
              {t('cart')} {itemCount > 0 && `(${itemCount})`}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Étape 4 : Brancher le Header dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` — importer `Header` depuis `@/components/layout/Header` et le rendre juste avant `<main>`, toujours à l'intérieur de `FavoritesProvider` :

```tsx
              <FavoritesProvider>
                <Header />
                <main>{children}</main>
              </FavoritesProvider>
```

- [ ] **Étape 5 : Vérifier manuellement**

Exécuter : `npm run dev` et vérifier sur `http://localhost:3000/fr` :
- Le header affiche le logo, les quatre liens de catégorie (Homme/Femme/Enfant/Accessoires), un champ de recherche, FR/EN, EUR/GBP, et les icônes favoris/panier.
- Cliquer sur « EN » navigue vers `/en` avec le même chemin et remplace chaque libellé (Men/Women/Kids/Accessories).
- Redimensionner la fenêtre sous le point de rupture `md` masque la nav desktop et affiche le bouton hamburger ; l'ouvrir révèle les mêmes liens empilés verticalement.
- Les liens de catégorie sont en 404 pour l'instant (les pages catégorie arrivent à la Tâche 14) — c'est attendu à ce stade.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/LanguageSwitcher.tsx src/components/layout/CurrencySwitcher.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add Header with navigation, search, language/currency switchers"
```

---

### Tâche 11 : Footer + bandeau de consentement cookies

**Fichiers :**
- Créer : `src/components/layout/Footer.tsx`
- Créer : `src/components/layout/CookieBanner.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `footer` and `cookies` namespaces)
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : `Container` (Tâche 8), `Button` (Tâche 8), `Link` depuis `@/i18n/navigation` (Tâche 3).
- Produit : `<Footer />`, `<CookieBanner />`, rendus globalement par le layout de langue sur toutes les pages. Les liens institutionnels du Footer pointent vers des routes construites dans les Tâches 22–27 ; ils sont en 404 jusqu'à ce que ces tâches arrivent, ce qui est attendu jusque-là.

- [ ] **Étape 1 : Ajouter les namespaces de messages footer et cookies**

Remplacer l'intégralité du contenu de `messages/fr.json` :

```json
{
  "nav": {
    "homme": "Homme",
    "femme": "Femme",
    "enfant": "Enfant",
    "accessoires": "Accessoires",
    "search": "Rechercher",
    "cart": "Panier",
    "favorites": "Favoris"
  },
  "common": {
    "brand": "Reign"
  },
  "footer": {
    "newsletterTitle": "Restez informé·e",
    "newsletterPlaceholder": "Votre email",
    "newsletterButton": "S'inscrire",
    "newsletterSuccess": "Merci, vous êtes inscrit·e.",
    "links": {
      "about": "À propos",
      "contact": "Contact",
      "faq": "FAQ",
      "shippingReturns": "Livraison & Retours",
      "sizeGuide": "Guide des tailles",
      "legalNotice": "Mentions légales",
      "terms": "CGV",
      "privacy": "Confidentialité"
    },
    "rights": "Tous droits réservés."
  },
  "cookies": {
    "message": "Nous utilisons des cookies pour améliorer votre expérience sur ce site.",
    "accept": "Accepter"
  }
}
```

Remplacer l'intégralité du contenu de `messages/en.json` :

```json
{
  "nav": {
    "homme": "Men",
    "femme": "Women",
    "enfant": "Kids",
    "accessoires": "Accessories",
    "search": "Search",
    "cart": "Cart",
    "favorites": "Favorites"
  },
  "common": {
    "brand": "Reign"
  },
  "footer": {
    "newsletterTitle": "Stay in the loop",
    "newsletterPlaceholder": "Your email",
    "newsletterButton": "Subscribe",
    "newsletterSuccess": "Thank you, you're subscribed.",
    "links": {
      "about": "About",
      "contact": "Contact",
      "faq": "FAQ",
      "shippingReturns": "Shipping & Returns",
      "sizeGuide": "Size Guide",
      "legalNotice": "Legal Notice",
      "terms": "Terms of Sale",
      "privacy": "Privacy"
    },
    "rights": "All rights reserved."
  },
  "cookies": {
    "message": "We use cookies to improve your experience on this site.",
    "accept": "Accept"
  }
}
```

- [ ] **Étape 2 : Implémenter le Footer**

Créer `src/components/layout/Footer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

const INSTITUTIONAL_LINKS: { href: string; key: string }[] = [
  { href: '/a-propos', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/aide', key: 'faq' },
  { href: '/livraison-retours', key: 'shippingReturns' },
  { href: '/guide-tailles', key: 'sizeGuide' },
  { href: '/mentions-legales', key: 'legalNotice' },
  { href: '/cgv', key: 'terms' },
  { href: '/confidentialite', key: 'privacy' }
];

export function Footer() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) {
      setHasSubscribed(true);
      setEmail('');
    }
  }

  return (
    <footer className="border-t border-mist-100 bg-paper text-ink">
      <Container className="grid gap-12 py-16 md:grid-cols-3">
        <div>
          <h2 className="font-serif text-xl">{t('newsletterTitle')}</h2>
          {hasSubscribed ? (
            <p className="mt-4 text-sm text-mist-600">{t('newsletterSuccess')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('newsletterPlaceholder')}
                className="w-full border-b border-mist-300 bg-transparent px-1 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <Button type="submit" variant="secondary">
                {t('newsletterButton')}
              </Button>
            </form>
          )}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          {INSTITUTIONAL_LINKS.map(({ href, key }) => (
            <Link key={href} href={href} className="text-mist-700 hover:text-accent">
              {t(`links.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4 md:justify-end">
          {(['Instagram', 'TikTok', 'Pinterest'] as const).map((social) => (
            <a
              key={social}
              href="#"
              aria-label={social}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mist-300 text-xs hover:border-accent hover:text-accent"
            >
              {social.slice(0, 2)}
            </a>
          ))}
        </div>
      </Container>

      <div className="border-t border-mist-100 py-6 text-center text-xs text-mist-500">
        © {new Date().getFullYear()} Reign — {t('rights')}
      </div>
    </footer>
  );
}
```

- [ ] **Étape 3 : Implémenter le bandeau cookies**

Créer `src/components/layout/CookieBanner.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'reign-cookie-consent';

export function CookieBanner() {
  const t = useTranslations('cookies');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(STORAGE_KEY);
    if (!consent) setIsVisible(true);
  }, []);

  function accept() {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-between gap-4 bg-ink px-4 py-4 text-sm text-paper sm:flex-row sm:px-8">
      <p className="max-w-2xl">{t('message')}</p>
      <Button
        variant="secondary"
        onClick={accept}
        className="border-paper text-paper hover:border-accent hover:text-accent"
      >
        {t('accept')}
      </Button>
    </div>
  );
}
```

Ceci rend `null` à la fois lors du rendu serveur et lors de la première passe d'hydratation côté client (l'état démarre à `false`), puis bascule vers visible après la vérification `useEffect` — le même pattern sûr vis-à-vis de l'hydratation que celui utilisé par les Context providers des Tâches 5–7.

- [ ] **Étape 4 : Brancher Footer et CookieBanner dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` — importer `Footer` et `CookieBanner`, et les rendre après `<main>` :

```tsx
              <FavoritesProvider>
                <Header />
                <main>{children}</main>
                <Footer />
                <CookieBanner />
              </FavoritesProvider>
```

- [ ] **Étape 5 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr` :
- Le footer affiche le formulaire de newsletter, les 8 liens institutionnels (ils sont en 404 pour l'instant — attendu jusqu'aux Tâches 22–27), et les 3 placeholders sociaux.
- Soumettre le formulaire de newsletter avec un email non vide le remplace par le message de remerciement.
- Le bandeau cookies apparaît en bas lors de la première visite ; cliquer sur « Accepter » le fait disparaître et il reste masqué après un rechargement de page (vérifier `localStorage` dans les devtools pour `reign-cookie-consent`).

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/layout/Footer.tsx src/components/layout/CookieBanner.tsx messages/fr.json messages/en.json src/app/[locale]/layout.tsx
git commit -m "feat: add Footer with newsletter/links and cookie consent banner"
```

---

### Tâche 12 : Drawer panier

**Fichiers :**
- Créer : `src/context/CartDrawerContext.tsx`
- Créer : `src/components/cart/CartDrawer.tsx`
- Modifier : `src/components/layout/Header.tsx` (l'icône panier ouvre le drawer au lieu de naviguer)
- Modifier : `messages/fr.json`, `messages/en.json` (add `cart` namespace)
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : `useCart` (Tâche 6), `useCurrency`/`formatPrice` (Tâche 5), `getProductById` (Tâche 4), `Button`/`PlaceholderBlock` (Tâche 8), `Link` (Tâche 3).
- Produit : `CartDrawerProvider`, `useCartDrawer(): { isOpen, open, close }` depuis `src/context/CartDrawerContext.tsx`; `<CartDrawer />` rendu globalement. La page Panier (Tâche 18) réutilise le même pattern `useCart()`/`formatPrice` montré ici pour sa propre mise en page pleine page.

- [ ] **Étape 1 : Ajouter le namespace de messages cart**

Ajouter dans `messages/fr.json` et `messages/en.json`, aux côtés des clés existantes `nav`/`common`/`footer`/`cookies` (ne pas les retirer — ajouter ceci comme une nouvelle clé de premier niveau dans chaque fichier) :

`messages/fr.json` addition:

```json
  "cart": {
    "title": "Panier",
    "empty": "Votre panier est vide.",
    "quantity": "Quantité",
    "remove": "Retirer",
    "subtotal": "Sous-total",
    "viewCart": "Voir le panier",
    "close": "Fermer"
  }
```

`messages/en.json` addition:

```json
  "cart": {
    "title": "Cart",
    "empty": "Your cart is empty.",
    "quantity": "Quantity",
    "remove": "Remove",
    "subtotal": "Subtotal",
    "viewCart": "View cart",
    "close": "Close"
  }
```

- [ ] **Étape 2 : Implémenter l'état ouvert/fermé du drawer**

Créer `src/context/CartDrawerContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useState } from 'react';

export interface CartDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CartDrawerContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  return ctx;
}
```

- [ ] **Étape 3 : Implémenter le CartDrawer**

Créer `src/components/cart/CartDrawer.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { getProductById } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { isOpen, close } = useCartDrawer();
  const { items, removeItem, updateQuantity, subtotalEur } = useCart();
  const { currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t('close')} onClick={close} className="absolute inset-0 bg-ink/50" />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">{t('title')}</h2>
          <button type="button" onClick={close} aria-label={t('close')} className="text-2xl leading-none">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-6">
              {items.map((line) => {
                const product = getProductById(line.productId);
                if (!product) return null;
                const lineKey = `${line.productId}-${line.size}-${line.color}`;
                return (
                  <li key={lineKey} className="flex gap-4">
                    <PlaceholderBlock aspect="square" className="w-20 flex-shrink-0" />
                    <div className="flex flex-1 flex-col text-sm">
                      <span className="font-medium">{product.name[locale]}</span>
                      <span className="text-mist-500">
                        {line.size} · {line.color}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <label htmlFor={`qty-${lineKey}`} className="sr-only">
                          {t('quantity')}
                        </label>
                        <input
                          id={`qty-${lineKey}`}
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) =>
                            updateQuantity(line.productId, line.size, line.color, Math.max(1, Number(event.target.value)))
                          }
                          className="w-14 border border-mist-300 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(line.productId, line.size, line.color)}
                          className="text-xs text-mist-500 underline hover:text-accent"
                        >
                          {t('remove')}
                        </button>
                      </div>
                      <span className="mt-2 text-sm">{formatPrice(product.priceEur * line.quantity, currency, locale)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t border-mist-100 pt-4">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotalEur, currency, locale)}</span>
              </div>
              <Link href="/panier" onClick={close} className="mt-4 block">
                <Button className="w-full">{t('viewCart')}</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Étape 4 : Faire en sorte que l'icône panier du Header ouvre le drawer au lieu de naviguer**

Modifier `src/components/layout/Header.tsx` — remplacer tout le contenu du fichier par cette version mise à jour (ajoute l'import/usage de `useCartDrawer` et remplace les deux `Link`s du panier par des boutons qui ouvrent le drawer) :

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { CATEGORIES } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const { itemCount } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { favoriteIds } = useFavorites();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsMenuOpen(false);
      router.push(`/recherche?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleOpenCart() {
    setIsMenuOpen(false);
    openCartDrawer();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-mist-100 bg-paper text-ink">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm tracking-wide md:flex">
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/${category}`} className="hover:text-accent">
              {t(category)}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 items-center md:flex">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="w-full border-b border-mist-300 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-mist-500 focus:border-accent focus:outline-none"
          />
        </form>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <Link href="/favoris" aria-label={t('favorites')} className="relative hover:text-accent">
            <HeartIcon />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <button type="button" onClick={handleOpenCart} aria-label={t('cart')} className="relative hover:text-accent">
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Menu"
          aria-expanded={isMenuOpen}
        >
          <MenuIcon />
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-mist-100 px-4 pb-6 md:hidden">
          <nav className="flex flex-col gap-4 pt-4 text-sm tracking-wide">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/${category}`}
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-accent"
              >
                {t(category)}
              </Link>
            ))}
          </nav>
          <form onSubmit={handleSearchSubmit} className="mt-4">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="w-full border-b border-mist-300 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-mist-500 focus:border-accent focus:outline-none"
            />
          </form>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <Link href="/favoris" onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
              {t('favorites')} {favoriteIds.length > 0 && `(${favoriteIds.length})`}
            </Link>
            <button type="button" onClick={handleOpenCart} className="hover:text-accent">
              {t('cart')} {itemCount > 0 && `(${itemCount})`}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Étape 5 : Brancher CartDrawerProvider et CartDrawer dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` pour que la section providers/body devienne :

```tsx
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider initialLocale={locale}>
            <CartProvider>
              <FavoritesProvider>
                <CartDrawerProvider>
                  <Header />
                  <main>{children}</main>
                  <Footer />
                  <CookieBanner />
                  <CartDrawer />
                </CartDrawerProvider>
              </FavoritesProvider>
            </CartProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
```

Ajouter les deux nouveaux imports en haut du fichier : `import { CartDrawerProvider } from '@/context/CartDrawerContext';` et `import { CartDrawer } from '@/components/cart/CartDrawer';`.

- [ ] **Étape 6 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr` :
- Cliquer sur l'icône panier ouvre le drawer avec « Votre panier est vide. » (aucune UI d'ajout au panier n'existe encore — elle arrive à la Tâche 15 — donc vérifier l'état vide et que le bouton overlay/fermeture fonctionne).
- Cliquer sur l'overlay ou sur le × ferme le drawer.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 7 : Commit**

```bash
git add src/context/CartDrawerContext.tsx src/components/cart/CartDrawer.tsx src/components/layout/Header.tsx messages/fr.json messages/en.json src/app/[locale]/layout.tsx
git commit -m "feat: add cart drawer opened from the header bag icon"
```

---

### Tâche 13 : Page d'accueil

**Fichiers :**
- Créer : `src/components/product/ProductCard.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `home` and `product` namespaces)
- Modifier : `src/app/[locale]/page.tsx` (remplacer le placeholder de la Tâche 3 par la vraie page d'accueil)

**Interfaces :**
- Consomme : `Container`/`Heading`/`PlaceholderBlock` (Tâche 8), `useCurrency`/`formatPrice` (Tâche 5), `useFavorites` (Tâche 7), `CATEGORIES`/`PRODUCTS` (Tâche 4), `Link` (Tâche 3).
- Produit : `<ProductCard product={Product} />` — réutilisé tel quel par les Tâches 14, 15 et 17.

- [ ] **Étape 1 : Ajouter les namespaces de messages home et product**

Ajouter dans `messages/fr.json` (aux côtés des clés existantes) :

```json
  "home": {
    "heroKicker": "Collection Automne 2026",
    "heroTitle": "Une silhouette qui s'impose",
    "heroSubtitle": "Vêtements et accessoires pensés pour durer, façonnés pour marquer.",
    "categoriesTitle": "Explorer par catégorie",
    "newArrivalsTitle": "Nouveautés",
    "editorialTitle": "L'exigence comme signature",
    "editorialBody": "Chaque pièce Reign naît d'un choix : celui de la matière, de la coupe, du détail qui ne se voit pas mais se ressent."
  },
  "product": {
    "toggleFavorite": "Ajouter aux favoris",
    "new": "Nouveau"
  }
```

Ajouter dans `messages/en.json` (aux côtés des clés existantes) :

```json
  "home": {
    "heroKicker": "Fall 2026 Collection",
    "heroTitle": "A silhouette that commands",
    "heroSubtitle": "Clothing and accessories built to last, shaped to leave a mark.",
    "categoriesTitle": "Shop by category",
    "newArrivalsTitle": "New Arrivals",
    "editorialTitle": "Precision as a signature",
    "editorialBody": "Every Reign piece starts with a choice: the fabric, the cut, the detail you don't see but always feel."
  },
  "product": {
    "toggleFavorite": "Add to favorites",
    "new": "New"
  }
```

- [ ] **Étape 2 : Implémenter ProductCard**

Créer `src/components/product/ProductCard.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/lib/products';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/currency';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const { currency } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  return (
    <div className="group relative">
      <Link href={`/produit/${product.slug}`} className="block">
        <PlaceholderBlock aspect="portrait" />
        <div className="mt-3">
          <h3 className="text-sm">{product.name[locale]}</h3>
          <p className="mt-1 text-sm text-mist-600">{formatPrice(product.priceEur, currency, locale)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(product.id)}
        aria-label={t('toggleFavorite')}
        aria-pressed={favorite}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/80 text-ink hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={favorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
        </svg>
      </button>
      {product.isNew && (
        <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] uppercase tracking-widest text-paper">
          {t('new')}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Étape 3 : Implémenter la page d'accueil**

Remplacer le contenu de `src/app/[locale]/page.tsx` :

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES, PRODUCTS } from '@/lib/products';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const newArrivals = PRODUCTS.filter((product) => product.isNew).slice(0, 4);

  return (
    <>
      <section className="relative">
        <PlaceholderBlock aspect="wide" className="w-full" />
        <div className="absolute inset-0 flex flex-col items-start justify-end bg-ink/20 p-8 text-paper md:p-16">
          <p className="text-xs uppercase tracking-[0.3em]">{t('heroKicker')}</p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl md:text-6xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-md text-sm md:text-base">{t('heroSubtitle')}</p>
        </div>
      </section>

      <Container className="py-16">
        <Heading level={2}>{t('categoriesTitle')}</Heading>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/${category}`} className="group">
              <PlaceholderBlock aspect="portrait" />
              <p className="mt-3 text-center text-sm tracking-wide">{tNav(category)}</p>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="py-16">
        <Heading level={2}>{t('newArrivalsTitle')}</Heading>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>

      <section className="relative">
        <PlaceholderBlock aspect="wide" className="w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-paper">
          <h2 className="max-w-2xl font-serif text-3xl md:text-4xl">{t('editorialTitle')}</h2>
          <p className="mt-4 max-w-xl text-sm md:text-base">{t('editorialBody')}</p>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Étape 4 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr` :
- Le hero, la grille des 4 catégories, une grille « Nouveautés » de 4 produits, et la bannière éditoriale s'affichent tous.
- Cliquer sur l'icône cœur d'une fiche produit la bascule et met à jour le compteur de favoris du Header (Tâche 10).
- Les liens de la grille catégorie sont encore en 404 pour l'instant (attendu jusqu'à la Tâche 14).
- Passer sur `/en` et confirmer que chaque texte ci-dessus est en anglais.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/product/ProductCard.tsx messages/fr.json messages/en.json src/app/[locale]/page.tsx
git commit -m "feat: build the Home page with hero, categories, new arrivals, editorial banner"
```

---

### Tâche 14 : Page de listing catégorie (PLP) + filtres, 4 catégories

**Fichiers :**
- Créer : `src/lib/productFilters.ts`
- Test : `src/lib/productFilters.test.ts`
- Créer : `src/components/product/CategoryFilters.tsx`
- Créer : `src/app/[locale]/[category]/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `category` namespace)

**Interfaces :**
- Consomme : `getProductsByCategory`/`CATEGORIES`/`Category` (Tâche 4), `ProductCard` (Tâche 13), `Container`/`Heading` (Tâche 8).
- Produit : `filterAndSortProducts(products, params)`, `getAvailableSubcategories/Sizes/Colors(products)` depuis `src/lib/productFilters.ts` — c'est l'unique route dynamique qui dessert les quatre catégories (`/homme`, `/femme`, `/enfant`, `/accessoires`) ; elle vit au même niveau de l'arborescence que les dossiers de route statiques construits dans les tâches suivantes (`contact/`, `favoris/`, etc.), et Next.js résout toujours un dossier statique correspondant avant de retomber sur un segment dynamique `[category]`, donc il n'y a pas de conflit de routage.

- [ ] **Étape 1 : Écrire les tests en échec pour la logique de filtre/tri**

Créer `src/lib/productFilters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  filterAndSortProducts,
  getAvailableSubcategories,
  getAvailableSizes,
  getAvailableColors
} from './productFilters';
import { getProductsByCategory } from './products';

const homme = getProductsByCategory('homme');

describe('filterAndSortProducts', () => {
  it('returns all products when no filters are given', () => {
    expect(filterAndSortProducts(homme, {})).toHaveLength(homme.length);
  });

  it('filters by subcategory', () => {
    const result = filterAndSortProducts(homme, { subcategory: 'vestes' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.subcategory === 'vestes')).toBe(true);
  });

  it('filters by size', () => {
    const result = filterAndSortProducts(homme, { size: 'XS' });
    expect(result.every((p) => p.sizes.includes('XS'))).toBe(true);
  });

  it('filters by color', () => {
    const result = filterAndSortProducts(homme, { color: 'Noir' });
    expect(result.every((p) => p.colors.includes('Noir'))).toBe(true);
  });

  it('sorts by ascending price', () => {
    const result = filterAndSortProducts(homme, { sort: 'price-asc' });
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].priceEur).toBeGreaterThanOrEqual(result[i - 1].priceEur);
    }
  });

  it('sorts by descending price', () => {
    const result = filterAndSortProducts(homme, { sort: 'price-desc' });
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].priceEur).toBeLessThanOrEqual(result[i - 1].priceEur);
    }
  });

  it('combines a subcategory filter with a sort', () => {
    const result = filterAndSortProducts(homme, { subcategory: 't-shirts', sort: 'price-asc' });
    expect(result.every((p) => p.subcategory === 't-shirts')).toBe(true);
  });
});

describe('getAvailableSubcategories/Sizes/Colors', () => {
  it('returns unique subcategories present in the given products', () => {
    const subcats = getAvailableSubcategories(homme);
    expect(new Set(subcats).size).toBe(subcats.length);
  });

  it('returns unique sizes present in the given products', () => {
    const sizes = getAvailableSizes(homme);
    expect(new Set(sizes).size).toBe(sizes.length);
  });

  it('returns unique colors present in the given products', () => {
    const colors = getAvailableColors(homme);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/productFilters.test.ts`
Résultat attendu : ÉCHEC — `productFilters.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter la logique de filtre/tri**

Créer `src/lib/productFilters.ts`:

```ts
import type { Product } from './products';

export interface ProductFilterParams {
  subcategory?: string;
  size?: string;
  color?: string;
  sort?: 'price-asc' | 'price-desc' | 'newest';
}

export function filterAndSortProducts(products: Product[], params: ProductFilterParams): Product[] {
  let result = products;

  if (params.subcategory) {
    result = result.filter((p) => p.subcategory === params.subcategory);
  }
  if (params.size) {
    result = result.filter((p) => p.sizes.includes(params.size as string));
  }
  if (params.color) {
    result = result.filter((p) => p.colors.includes(params.color as string));
  }

  const sorted = [...result];
  if (params.sort === 'price-asc') {
    sorted.sort((a, b) => a.priceEur - b.priceEur);
  } else if (params.sort === 'price-desc') {
    sorted.sort((a, b) => b.priceEur - a.priceEur);
  } else if (params.sort === 'newest') {
    sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  }

  return sorted;
}

export function getAvailableSubcategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.subcategory)));
}

export function getAvailableSizes(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.sizes)));
}

export function getAvailableColors(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.colors)));
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/productFilters.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Ajouter le namespace de messages category**

Ajouter dans `messages/fr.json`:

```json
  "category": {
    "title": {
      "homme": "Homme",
      "femme": "Femme",
      "enfant": "Enfant",
      "accessoires": "Accessoires"
    },
    "filterSubcategory": "Sous-catégorie",
    "allSubcategories": "Toutes les sous-catégories",
    "filterSize": "Taille",
    "allSizes": "Toutes les tailles",
    "filterColor": "Couleur",
    "allColors": "Toutes les couleurs",
    "sortBy": "Trier par",
    "sortDefault": "Par défaut",
    "sortPriceAsc": "Prix croissant",
    "sortPriceDesc": "Prix décroissant",
    "sortNewest": "Nouveautés",
    "empty": "Aucun article ne correspond à ces filtres."
  }
```

Ajouter dans `messages/en.json`:

```json
  "category": {
    "title": {
      "homme": "Men",
      "femme": "Women",
      "enfant": "Kids",
      "accessoires": "Accessories"
    },
    "filterSubcategory": "Subcategory",
    "allSubcategories": "All subcategories",
    "filterSize": "Size",
    "allSizes": "All sizes",
    "filterColor": "Color",
    "allColors": "All colors",
    "sortBy": "Sort by",
    "sortDefault": "Default",
    "sortPriceAsc": "Price: low to high",
    "sortPriceDesc": "Price: high to low",
    "sortNewest": "Newest",
    "empty": "No items match these filters."
  }
```

- [ ] **Étape 6 : Implémenter les contrôles de filtre**

Créer `src/components/product/CategoryFilters.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Product } from '@/lib/products';
import { getAvailableColors, getAvailableSizes, getAvailableSubcategories } from '@/lib/productFilters';

export function CategoryFilters({ products }: { products: Product[] }) {
  const t = useTranslations('category');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const subcategories = getAvailableSubcategories(products);
  const sizes = getAvailableSizes(products);
  const colors = getAvailableColors(products);

  function updateParam(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  return (
    <div className="mt-8 flex flex-wrap gap-4 text-sm">
      <select
        aria-label={t('filterSubcategory')}
        value={searchParams.get('subcategory') ?? ''}
        onChange={(event) => updateParam('subcategory', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('allSubcategories')}</option>
        {subcategories.map((subcategory) => (
          <option key={subcategory} value={subcategory}>
            {subcategory}
          </option>
        ))}
      </select>

      <select
        aria-label={t('filterSize')}
        value={searchParams.get('size') ?? ''}
        onChange={(event) => updateParam('size', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('allSizes')}</option>
        {sizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <select
        aria-label={t('filterColor')}
        value={searchParams.get('color') ?? ''}
        onChange={(event) => updateParam('color', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('allColors')}</option>
        {colors.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      <select
        aria-label={t('sortBy')}
        value={searchParams.get('sort') ?? ''}
        onChange={(event) => updateParam('sort', event.target.value)}
        className="border border-mist-300 px-3 py-2"
      >
        <option value="">{t('sortDefault')}</option>
        <option value="price-asc">{t('sortPriceAsc')}</option>
        <option value="price-desc">{t('sortPriceDesc')}</option>
        <option value="newest">{t('sortNewest')}</option>
      </select>
    </div>
  );
}
```

- [ ] **Étape 7 : Implémenter la page catégorie**

Créer `src/app/[locale]/[category]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { CATEGORIES, type Category, getProductsByCategory } from '@/lib/products';
import { filterAndSortProducts, type ProductFilterParams } from '@/lib/productFilters';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryFilters } from '@/components/product/CategoryFilters';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => CATEGORIES.map((category) => ({ locale, category })));
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!CATEGORIES.includes(category as Category)) {
    notFound();
  }

  const sp = await searchParams;
  const t = await getTranslations('category');
  const allProducts = getProductsByCategory(category as Category);

  const filterParams: ProductFilterParams = {
    subcategory: typeof sp.subcategory === 'string' ? sp.subcategory : undefined,
    size: typeof sp.size === 'string' ? sp.size : undefined,
    color: typeof sp.color === 'string' ? sp.color : undefined,
    sort: typeof sp.sort === 'string' ? (sp.sort as ProductFilterParams['sort']) : undefined
  };
  const products = filterAndSortProducts(allProducts, filterParams);

  return (
    <Container className="py-12">
      <Heading level={1}>{t(`title.${category}`)}</Heading>
      <CategoryFilters products={allProducts} />
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && <p className="mt-12 text-center text-mist-500">{t('empty')}</p>}
    </Container>
  );
}
```

- [ ] **Étape 8 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/homme` :
- Les 4 produits homme du jeu de données s'affichent en cartes.
- Changer chaque `<select>` de filtre/tri met à jour la chaîne de requête de l'URL et la grille de produits visible.
- Visiter `/fr/femme`, `/fr/enfant`, `/fr/accessoires` — même template, bons produits pour chacune.
- Visiter `/fr/does-not-exist` — on s'attend à un 404.

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 9 : Commit**

```bash
git add src/lib/productFilters.ts src/lib/productFilters.test.ts src/components/product/CategoryFilters.tsx src/app/[locale]/[category]/page.tsx messages/fr.json messages/en.json
git commit -m "feat: add category listing page with subcategory/size/color/sort filters"
```

---

### Tâche 15 : Fiche produit (PDP)

**Fichiers :**
- Créer : `src/components/product/ProductGallery.tsx`
- Créer : `src/components/product/ProductDetailView.tsx`
- Créer : `src/app/[locale]/produit/[slug]/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (ajouter au namespace `product` existant)

**Interfaces :**
- Consomme : `getProductBySlug`/`getRelatedProducts`/`PRODUCTS` (Tâche 4), `useCart` (Tâche 6), `useCartDrawer` (Tâche 12), `useCurrency`/`formatPrice` (Tâche 5), `useFavorites` (Tâche 7), `ProductCard` (Tâche 13), `Button`/`Heading`/`Container` (Tâche 8).
- Produit : la route `/produit/[slug]` utilisée par tous les liens `ProductCard` construits jusqu'ici.

- [ ] **Étape 1 : Ajouter les clés de messages product restantes**

Ajouter ces clés à l'intérieur de l'objet `product` existant dans `messages/fr.json` (aux côtés de `toggleFavorite` et `new` de la Tâche 13) :

```json
    "size": "Taille",
    "color": "Couleur",
    "quantity": "Quantité",
    "addToCart": "Ajouter au panier",
    "relatedProducts": "Vous aimerez aussi"
```

Ajouter ces clés à l'intérieur de l'objet `product` existant dans `messages/en.json` :

```json
    "size": "Size",
    "color": "Color",
    "quantity": "Quantity",
    "addToCart": "Add to cart",
    "relatedProducts": "You may also like"
```

- [ ] **Étape 2 : Implémenter la galerie**

Créer `src/components/product/ProductGallery.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function ProductGallery({ imageCount, productName }: { imageCount: number; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = Array.from({ length: imageCount }, (_, index) => index);

  return (
    <div>
      <PlaceholderBlock aspect="portrait" label={`${productName} — ${activeIndex + 1}/${imageCount}`} />
      <div className="mt-4 flex gap-2">
        {images.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${productName} ${index + 1}`}
            aria-pressed={activeIndex === index}
            className={`h-16 w-12 flex-shrink-0 ${index === activeIndex ? 'ring-2 ring-accent' : ''}`}
          >
            <PlaceholderBlock aspect="portrait" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Étape 3 : Implémenter la vue de détail interactive**

Créer `src/components/product/ProductDetailView.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';

export function ProductDetailView({
  product,
  relatedProducts
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);

  function handleAddToCart() {
    addItem({ productId: product.id, size, color, quantity });
    openCartDrawer();
  }

  return (
    <div>
      <div className="grid gap-12 md:grid-cols-2">
        <ProductGallery imageCount={product.imageCount} productName={product.name[locale]} />

        <div>
          <Heading level={1}>{product.name[locale]}</Heading>
          <p className="mt-2 text-lg">{formatPrice(product.priceEur, currency, locale)}</p>
          <p className="mt-6 text-sm text-mist-700">{product.description[locale]}</p>

          <div className="mt-8">
            <label htmlFor="size" className="text-sm font-medium">
              {t('size')}
            </label>
            <select
              id="size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            >
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="color" className="text-sm font-medium">
              {t('color')}
            </label>
            <select
              id="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            >
              {product.colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="quantity" className="text-sm font-medium">
              {t('quantity')}
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              className="mt-2 block w-24 border border-mist-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-8 flex gap-3">
            <Button onClick={handleAddToCart} className="flex-1">
              {t('addToCart')}
            </Button>
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              aria-pressed={isFavorite(product.id)}
              aria-label={t('toggleFavorite')}
              className="flex h-12 w-12 items-center justify-center border border-mist-300 hover:border-accent hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={isFavorite(product.id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <Heading level={2}>{t('relatedProducts')}</Heading>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Étape 4 : Implémenter la page**

Créer `src/app/[locale]/produit/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PRODUCTS, getProductBySlug, getRelatedProducts } from '@/lib/products';
import { routing } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { ProductDetailView } from '@/components/product/ProductDetailView';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PRODUCTS.map((product) => ({ locale, slug: product.slug })));
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

  return (
    <Container className="py-12">
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </Container>
  );
}
```

- [ ] **Étape 5 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/produit/homme-veste-oversize` :
- Les vignettes de la galerie changent le libellé du placeholder principal.
- Changer la taille/couleur met à jour les selects ; changer la quantité n'accepte que des entiers positifs.
- « Ajouter au panier » ajoute la ligne au panier et ouvre le drawer (Tâche 12) avec le bon produit, la bonne taille, couleur, quantité et prix.
- Le bouton cœur bascule les favoris et se reflète sur le badge du Header (Tâche 10).
- La grille de produits associés affiche les deux produits référencés par `relatedProductIds` (`homme-pantalon-droit`, `homme-chemise-col-mao`).
- Visiter `/fr/produit/does-not-exist` — on s'attend à un 404.

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/product/ProductGallery.tsx src/components/product/ProductDetailView.tsx src/app/[locale]/produit messages/fr.json messages/en.json
git commit -m "feat: add product detail page with variant selection and add-to-cart"
```

---

### Tâche 16 : Page de résultats de recherche

**Fichiers :**
- Créer : `src/app/[locale]/recherche/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `search` namespace)

**Interfaces :**
- Consomme : `searchProducts` (Tâche 4, déjà testée), `ProductCard` (Tâche 13), `Container`/`Heading` (Tâche 8). Atteint depuis le formulaire de recherche du Header (Tâche 10), qui soumet vers `/recherche?q=...`.
- Produit : la route `/recherche`.

- [ ] **Étape 1 : Ajouter le namespace de messages search**

Ajouter dans `messages/fr.json`:

```json
  "search": {
    "title": "Recherche",
    "resultsFor": "Résultats pour « {query} »",
    "noQuery": "Entrez un mot-clé pour rechercher un article.",
    "empty": "Aucun résultat pour cette recherche."
  }
```

Ajouter dans `messages/en.json`:

```json
  "search": {
    "title": "Search",
    "resultsFor": "Results for \"{query}\"",
    "noQuery": "Enter a keyword to search for an item.",
    "empty": "No results for this search."
  }
```

- [ ] **Étape 2 : Implémenter la page de recherche**

Créer `src/app/[locale]/recherche/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/products';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';

export default async function SearchPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const t = await getTranslations('search');
  const query = q?.trim() ?? '';
  const results = query ? searchProducts(query, locale as 'fr' | 'en') : [];

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{query ? t('resultsFor', { query }) : t('noQuery')}</p>

      {query && results.length === 0 && <p className="mt-12 text-center text-mist-500">{t('empty')}</p>}

      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Étape 3 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Visiter `http://localhost:3000/fr/recherche` (sans requête) — on s'attend au message « entrez un mot-clé » et à aucune grille de résultats.
- Visiter `http://localhost:3000/fr/recherche?q=veste` — on s'attend à voir au moins la veste oversize apparaître.
- Utiliser le champ de recherche du Header (Tâche 10) et confirmer qu'il navigue ici avec la requête saisie.
- Visiter `http://localhost:3000/fr/recherche?q=zzznomatch` — on s'attend au message « aucun résultat ».

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/[locale]/recherche messages/fr.json messages/en.json
git commit -m "feat: add search results page"
```

---

### Tâche 17 : Page favoris

**Fichiers :**
- Créer : `src/app/[locale]/favoris/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `favorites` namespace)

**Interfaces :**
- Consomme : `useFavorites` (Tâche 7), `getProductById` (Tâche 4), `ProductCard` (Tâche 13), `Container`/`Heading` (Tâche 8).
- Produit : la route `/favoris` liée depuis le Header (Tâche 10).

- [ ] **Étape 1 : Ajouter le namespace de messages favorites**

Ajouter dans `messages/fr.json`:

```json
  "favorites": {
    "title": "Favoris",
    "empty": "Vous n'avez pas encore ajouté de favoris."
  }
```

Ajouter dans `messages/en.json`:

```json
  "favorites": {
    "title": "Favorites",
    "empty": "You haven't added any favorites yet."
  }
```

- [ ] **Étape 2 : Implémenter la page Favoris**

Créer `src/app/[locale]/favoris/page.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFavorites } from '@/context/FavoritesContext';
import { getProductById } from '@/lib/products';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { favoriteIds } = useFavorites();
  const products = favoriteIds
    .map((id) => getProductById(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      {products.length === 0 ? (
        <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
```

C'est une page Client Component (pas besoin de `params`/données serveur) puisque les favoris vivent entièrement dans `localStorage` via `useFavorites()`.

- [ ] **Étape 3 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/favoris` sans favoris — on s'attend au message d'état vide. Ajouter aux favoris quelques produits depuis la page d'accueil ou une page catégorie (Tâche 13/14), puis revisiter `/fr/favoris` — on s'attend à voir exactement ces produits apparaître en cartes, avec le bouton cœur fonctionnel (retirer des favoris depuis cette page fait disparaître la carte immédiatement puisqu'elle relit `favoriteIds`).

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/[locale]/favoris messages/fr.json messages/en.json
git commit -m "feat: add favorites page"
```

---

### Tâche 18 : Page panier

**Fichiers :**
- Créer : `src/components/cart/CartLineItem.tsx`
- Modifier : `src/components/cart/CartDrawer.tsx` (réutiliser `CartLineItem` au lieu de son balisage de ligne en ligne)
- Créer : `src/app/[locale]/panier/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (ajouter la clé `checkout` au namespace `cart` existant)

**Interfaces :**
- Consomme : `useCart` (Tâche 6), `useCurrency`/`formatPrice` (Tâche 5), `getProductById` (Tâche 4), `CartItem` (Tâche 6), `Container`/`Heading`/`Button` (Tâche 8).
- Produit : `<CartLineItem line={CartItem} />` (partagé par le drawer et cette page), la route `/panier` (liée depuis l'action « voir le panier » du drawer de l'icône panier du Header, et depuis le drawer panier lui-même).

- [ ] **Étape 1 : Extraire la ligne de panier partagée**

Créer `src/components/cart/CartLineItem.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { getProductById } from '@/lib/products';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import type { CartItem } from '@/lib/cart';

export function CartLineItem({ line }: { line: CartItem }) {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { currency } = useCurrency();
  const { removeItem, updateQuantity } = useCart();
  const product = getProductById(line.productId);
  if (!product) return null;

  const lineKey = `${line.productId}-${line.size}-${line.color}`;

  return (
    <li className="flex gap-4">
      <PlaceholderBlock aspect="square" className="w-20 flex-shrink-0" />
      <div className="flex flex-1 flex-col text-sm">
        <span className="font-medium">{product.name[locale]}</span>
        <span className="text-mist-500">
          {line.size} · {line.color}
        </span>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={`qty-${lineKey}`} className="sr-only">
            {t('quantity')}
          </label>
          <input
            id={`qty-${lineKey}`}
            type="number"
            min={1}
            value={line.quantity}
            onChange={(event) =>
              updateQuantity(line.productId, line.size, line.color, Math.max(1, Number(event.target.value)))
            }
            className="w-14 border border-mist-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(line.productId, line.size, line.color)}
            className="text-xs text-mist-500 underline hover:text-accent"
          >
            {t('remove')}
          </button>
        </div>
        <span className="mt-2 text-sm">{formatPrice(product.priceEur * line.quantity, currency, locale)}</span>
      </div>
    </li>
  );
}
```

- [ ] **Étape 2 : Simplifier CartDrawer pour réutiliser CartLineItem**

Modifier `src/components/cart/CartDrawer.tsx` — remplacer tout le fichier par cette version (retire le JSX en ligne par ligne et l'import désormais inutilisé de `getProductById` au profit de `<CartLineItem />`) :

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { CartLineItem } from './CartLineItem';

export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { isOpen, close } = useCartDrawer();
  const { items, subtotalEur } = useCart();
  const { currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t('close')} onClick={close} className="absolute inset-0 bg-ink/50" />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">{t('title')}</h2>
          <button type="button" onClick={close} aria-label={t('close')} className="text-2xl leading-none">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-6">
              {items.map((line) => (
                <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
              ))}
            </ul>

            <div className="mt-6 border-t border-mist-100 pt-4">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotalEur, currency, locale)}</span>
              </div>
              <Link href="/panier" onClick={close} className="mt-4 block">
                <Button className="w-full">{t('viewCart')}</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Étape 3 : Ajouter le libellé du CTA de tunnel de commande**

Ajouter `"checkout": "Passer commande"` à l'intérieur de l'objet `cart` existant dans `messages/fr.json`, et `"checkout": "Checkout"` à l'intérieur de l'objet `cart` existant dans `messages/en.json`.

- [ ] **Étape 4 : Implémenter la page Panier**

Créer `src/app/[locale]/panier/page.tsx`:

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CartLineItem } from '@/components/cart/CartLineItem';

export default function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { items, subtotalEur } = useCart();
  const { currency } = useCurrency();

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
      ) : (
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <ul className="space-y-8 md:col-span-2">
            {items.map((line) => (
              <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
            ))}
          </ul>

          <div className="border-t border-mist-100 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div className="flex justify-between text-sm">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(subtotalEur, currency, locale)}</span>
            </div>
            <Link href="/commande/livraison" className="mt-6 block">
              <Button className="w-full">{t('checkout')}</Button>
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
```

- [ ] **Étape 5 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Ajouter quelques produits au panier depuis une PDP (Tâche 15).
- Ouvrir le drawer (icône panier) — il doit avoir le même aspect et comportement qu'avant (maintenant appuyé sur `CartLineItem`).
- Visiter `http://localhost:3000/fr/panier` directement — mêmes lignes, quantités et sous-total ; changer une quantité ou retirer une ligne ici met aussi à jour le badge du Header (`CartContext` partagé).
- Cliquer sur « Passer commande » — on s'attend à un 404 pour l'instant (la route de tunnel de commande arrive à la Tâche 19).
- Vider le panier (retirer toutes les lignes) et confirmer que le message d'état vide s'affiche.

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/cart/CartLineItem.tsx src/components/cart/CartDrawer.tsx src/app/[locale]/panier messages/fr.json messages/en.json
git commit -m "feat: add dedicated cart page, extract shared CartLineItem"
```

---

### Tâche 19 : Tunnel de commande — Page livraison

**Fichiers :**
- Créer : `src/lib/checkoutValidation.ts`
- Test : `src/lib/checkoutValidation.test.ts`
- Créer : `src/context/CheckoutContext.tsx`
- Créer : `src/app/[locale]/commande/livraison/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `checkout` namespace)
- Modifier : `src/app/[locale]/layout.tsx`

**Interfaces :**
- Consomme : `Container`/`Heading`/`Button` (Tâche 8).
- Produit : `ShippingFormValues`, `ShippingFormErrors`, `validateShippingForm(values)` depuis `src/lib/checkoutValidation.ts` (la Tâche 20 ajoute `PaymentFormValues`/`validatePaymentForm` au même fichier) ; `CheckoutProvider`, `useCheckout(): { shipping, setShipping, clearShipping }` depuis `src/context/CheckoutContext.tsx` — consommé par la page Paiement (Tâche 20) et la page Confirmation (Tâche 21). Le tunnel de commande est en mode invité uniquement : rien ici ne touche à un système de compte ou d'authentification (section 9 de la spec).

- [ ] **Étape 1 : Écrire les tests en échec pour la validation de la livraison**

Créer `src/lib/checkoutValidation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateShippingForm, type ShippingFormValues } from './checkoutValidation';

const validValues: ShippingFormValues = {
  fullName: 'Alex Martin',
  email: 'alex@example.com',
  address: '12 rue de la Paix',
  city: 'Paris',
  postalCode: '75002',
  country: 'France'
};

describe('validateShippingForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validateShippingForm(validValues)).toEqual({});
  });

  it('flags a missing full name', () => {
    expect(validateShippingForm({ ...validValues, fullName: '' }).fullName).toBe('required');
  });

  it('flags a missing email', () => {
    expect(validateShippingForm({ ...validValues, email: '' }).email).toBe('required');
  });

  it('flags an invalid email format', () => {
    expect(validateShippingForm({ ...validValues, email: 'not-an-email' }).email).toBe('invalid');
  });

  it('flags each other missing field independently', () => {
    expect(validateShippingForm({ ...validValues, address: '' }).address).toBe('required');
    expect(validateShippingForm({ ...validValues, city: '' }).city).toBe('required');
    expect(validateShippingForm({ ...validValues, postalCode: '' }).postalCode).toBe('required');
    expect(validateShippingForm({ ...validValues, country: '' }).country).toBe('required');
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/checkoutValidation.test.ts`
Résultat attendu : ÉCHEC — `checkoutValidation.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter la validation de la livraison**

Créer `src/lib/checkoutValidation.ts`:

```ts
export interface ShippingFormValues {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type ShippingFormErrors = Partial<Record<keyof ShippingFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateShippingForm(values: ShippingFormValues): ShippingFormErrors {
  const errors: ShippingFormErrors = {};

  if (!values.fullName.trim()) errors.fullName = 'required';

  if (!values.email.trim()) {
    errors.email = 'required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'invalid';
  }

  if (!values.address.trim()) errors.address = 'required';
  if (!values.city.trim()) errors.city = 'required';
  if (!values.postalCode.trim()) errors.postalCode = 'required';
  if (!values.country.trim()) errors.country = 'required';

  return errors;
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/checkoutValidation.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Ajouter le namespace de messages checkout**

Ajouter dans `messages/fr.json`:

```json
  "checkout": {
    "shippingTitle": "Livraison",
    "guestNotice": "Commande en tant qu'invité·e — aucune création de compte n'est nécessaire.",
    "fields": {
      "fullName": "Nom complet",
      "email": "Email",
      "address": "Adresse",
      "city": "Ville",
      "postalCode": "Code postal",
      "country": "Pays"
    },
    "errors": {
      "required": "Ce champ est requis.",
      "invalid": "Format invalide."
    },
    "continueToPayment": "Continuer vers le paiement"
  }
```

Ajouter dans `messages/en.json`:

```json
  "checkout": {
    "shippingTitle": "Shipping",
    "guestNotice": "Checking out as a guest — no account required.",
    "fields": {
      "fullName": "Full name",
      "email": "Email",
      "address": "Address",
      "city": "City",
      "postalCode": "Postal code",
      "country": "Country"
    },
    "errors": {
      "required": "This field is required.",
      "invalid": "Invalid format."
    },
    "continueToPayment": "Continue to payment"
  }
```

(la Tâche 20 ajoute des clés liées au paiement et la Tâche 21 ajoute des clés liées à la confirmation dans ce même objet `checkout`.)

- [ ] **Étape 6 : Implémenter le contexte d'état du tunnel de commande**

Créer `src/context/CheckoutContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ShippingFormValues } from '@/lib/checkoutValidation';

const STORAGE_KEY = 'reign-checkout-shipping';

export interface CheckoutContextValue {
  shipping: ShippingFormValues | null;
  setShipping: (values: ShippingFormValues) => void;
  clearShipping: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [shipping, setShippingState] = useState<ShippingFormValues | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setShippingState(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (shipping) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [shipping]);

  return (
    <CheckoutContext.Provider
      value={{ shipping, setShipping: setShippingState, clearShipping: () => setShippingState(null) }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider');
  return ctx;
}
```

Ceci utilise `sessionStorage` (pas `localStorage`) délibérément — un tunnel de commande en cours est transitoire et ne doit pas survivre entre les sessions de navigateur comme le panier ou les favoris.

- [ ] **Étape 7 : Brancher CheckoutProvider dans le layout de langue**

Modifier `src/app/[locale]/layout.tsx` — ajouter l'import et imbriquer `CheckoutProvider` autour des mêmes enfants que `CartDrawerProvider` (l'ordre par rapport aux autres providers n'a pas d'importance, puisqu'aucun d'eux ne lit le contexte des autres) :

```tsx
                <CartDrawerProvider>
                  <CheckoutProvider>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                    <CookieBanner />
                    <CartDrawer />
                  </CheckoutProvider>
                </CartDrawerProvider>
```

Ajouter `import { CheckoutProvider } from '@/context/CheckoutContext';` aux côtés des autres imports de contexte.

- [ ] **Étape 8 : Implémenter la page Livraison**

Créer `src/app/[locale]/commande/livraison/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useCheckout } from '@/context/CheckoutContext';
import { validateShippingForm, type ShippingFormValues, type ShippingFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: ShippingFormValues = {
  fullName: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  country: ''
};

export default function ShippingPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { shipping, setShipping } = useCheckout();
  const [values, setValues] = useState<ShippingFormValues>(shipping ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  function handleChange(field: keyof ShippingFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateShippingForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setShipping(values);
      router.push('/commande/paiement');
    }
  }

  const fields: (keyof ShippingFormValues)[] = ['fullName', 'email', 'address', 'city', 'postalCode', 'country'];

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('shippingTitle')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('guestNotice')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        {fields.map((name) => (
          <div key={name}>
            <label htmlFor={name} className="text-sm font-medium">
              {t(`fields.${name}`)}
            </label>
            <input
              id={name}
              type={name === 'email' ? 'email' : 'text'}
              value={values[name]}
              onChange={(event) => handleChange(name, event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
              <p id={`${name}-error`} className="mt-1 text-xs text-accent">
                {t(`errors.${errors[name]}`)}
              </p>
            )}
          </div>
        ))}

        <Button type="submit" className="w-full">
          {t('continueToPayment')}
        </Button>
      </form>
    </Container>
  );
}
```

- [ ] **Étape 9 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/commande/livraison` :
- Soumettre le formulaire vide affiche une erreur « requis » sous chaque champ.
- Saisir un email invalide (ex. `abc`) et soumettre affiche l'erreur « format invalide » uniquement sous l'email.
- Remplir tous les champs avec des valeurs valides et soumettre navigue vers `/fr/commande/paiement` (404 pour l'instant — Tâche 20).
- Rouvrir `/fr/commande/livraison` après une soumission réussie — les champs sont pré-remplis depuis `sessionStorage` (via `useCheckout()`).

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 10 : Commit**

```bash
git add src/lib/checkoutValidation.ts src/lib/checkoutValidation.test.ts src/context/CheckoutContext.tsx src/app/[locale]/commande/livraison messages/fr.json messages/en.json src/app/[locale]/layout.tsx
git commit -m "feat: add guest checkout shipping step with validation"
```

---

### Tâche 20 : Tunnel de commande — Page paiement (factice)

**Fichiers :**
- Modifier : `src/lib/checkoutValidation.ts` (add payment validation alongside shipping validation)
- Modifier : `src/lib/checkoutValidation.test.ts` (add payment validation tests)
- Créer : `src/app/[locale]/commande/paiement/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (ajouter les clés de paiement au namespace `checkout` existant)

**Interfaces :**
- Consomme : `useCheckout` (Tâche 19), `useCart` (Tâche 6), `Container`/`Heading`/`Button` (Tâche 8).
- Produit : `PaymentFormValues`, `PaymentFormErrors`, `validatePaymentForm(values)` ajoutés à `src/lib/checkoutValidation.ts` ; la route `/commande/paiement`. Aucun vrai processeur de paiement n'est appelé — la soumission vide le panier et enchaîne vers la Confirmation (Tâche 21), conformément au périmètre explicite de la phase 1 de la spec.

- [ ] **Étape 1 : Écrire les tests en échec pour la validation du paiement**

Ajouter dans `src/lib/checkoutValidation.test.ts` (sous le bloc describe `validateShippingForm` existant) :

```ts
import { validatePaymentForm, type PaymentFormValues } from './checkoutValidation';

const validPayment: PaymentFormValues = {
  cardName: 'Alex Martin',
  cardNumber: '4242424242424242',
  expiry: '12/28',
  cvc: '123'
};

describe('validatePaymentForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validatePaymentForm(validPayment)).toEqual({});
  });

  it('flags a missing card name', () => {
    expect(validatePaymentForm({ ...validPayment, cardName: '' }).cardName).toBe('required');
  });

  it('flags a card number that is not 16 digits', () => {
    expect(validatePaymentForm({ ...validPayment, cardNumber: '4242' }).cardNumber).toBe('invalid');
  });

  it('accepts a card number with spaces', () => {
    expect(validatePaymentForm({ ...validPayment, cardNumber: '4242 4242 4242 4242' })).toEqual({});
  });

  it('flags an expiry not in MM/YY format', () => {
    expect(validatePaymentForm({ ...validPayment, expiry: '2028-12' }).expiry).toBe('invalid');
  });

  it('flags a CVC that is not 3 or 4 digits', () => {
    expect(validatePaymentForm({ ...validPayment, cvc: '12' }).cvc).toBe('invalid');
  });
});
```

Mettre à jour le haut de `src/lib/checkoutValidation.test.ts` pour que les deux imports soient présents :

```ts
import { describe, expect, it } from 'vitest';
import {
  validateShippingForm,
  validatePaymentForm,
  type ShippingFormValues,
  type PaymentFormValues
} from './checkoutValidation';
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier que les nouveaux échouent**

Exécuter : `npm run test -- src/lib/checkoutValidation.test.ts`
Résultat attendu : ÉCHEC — `validatePaymentForm` n'existe pas encore.

- [ ] **Étape 3 : Implémenter la validation du paiement**

Ajouter dans `src/lib/checkoutValidation.ts` (sous le code de livraison existant) :

```ts
export interface PaymentFormValues {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;

const CARD_NUMBER_PATTERN = /^\d{16}$/;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVC_PATTERN = /^\d{3,4}$/;

export function validatePaymentForm(values: PaymentFormValues): PaymentFormErrors {
  const errors: PaymentFormErrors = {};

  if (!values.cardName.trim()) errors.cardName = 'required';

  const digitsOnlyCardNumber = values.cardNumber.replace(/\s/g, '');
  if (!digitsOnlyCardNumber) {
    errors.cardNumber = 'required';
  } else if (!CARD_NUMBER_PATTERN.test(digitsOnlyCardNumber)) {
    errors.cardNumber = 'invalid';
  }

  if (!values.expiry.trim()) {
    errors.expiry = 'required';
  } else if (!EXPIRY_PATTERN.test(values.expiry.trim())) {
    errors.expiry = 'invalid';
  }

  if (!values.cvc.trim()) {
    errors.cvc = 'required';
  } else if (!CVC_PATTERN.test(values.cvc.trim())) {
    errors.cvc = 'invalid';
  }

  return errors;
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/checkoutValidation.test.ts`
Résultat attendu : succès (les deux blocs describe, livraison et paiement).

- [ ] **Étape 5 : Ajouter les clés de messages de paiement**

Ajouter ces clés à l'intérieur de l'objet `checkout` existant dans `messages/fr.json` (aux côtés de `shippingTitle`, `guestNotice`, `errors`, etc. de la Tâche 19), et ajouter `cardName`/`cardNumber`/`expiry`/`cvc` à l'intérieur de l'objet `checkout.fields` existant :

```json
    "paymentTitle": "Paiement",
    "mockNotice": "Aucun paiement réel n'est traité — ceci est une démonstration.",
    "missingShipping": "Merci de renseigner d'abord vos informations de livraison.",
    "backToShipping": "Retour à la livraison",
    "confirmPayment": "Confirmer le paiement"
```

and inside `checkout.fields`:

```json
      "cardName": "Nom sur la carte",
      "cardNumber": "Numéro de carte",
      "expiry": "Expiration",
      "cvc": "CVC"
```

Ajouter les clés équivalentes à l'intérieur de l'objet `checkout` existant dans `messages/en.json` :

```json
    "paymentTitle": "Payment",
    "mockNotice": "No real payment is processed — this is a demonstration.",
    "missingShipping": "Please fill in your shipping details first.",
    "backToShipping": "Back to shipping",
    "confirmPayment": "Confirm payment"
```

and inside `checkout.fields`:

```json
      "cardName": "Name on card",
      "cardNumber": "Card number",
      "expiry": "Expiry",
      "cvc": "CVC"
```

- [ ] **Étape 6 : Implémenter la page Paiement**

Créer `src/app/[locale]/commande/paiement/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { validatePaymentForm, type PaymentFormValues, type PaymentFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: PaymentFormValues = { cardName: '', cardNumber: '', expiry: '', cvc: '' };

export default function PaymentPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { shipping } = useCheckout();
  const { clearCart } = useCart();
  const [values, setValues] = useState<PaymentFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<PaymentFormErrors>({});

  function handleChange(field: keyof PaymentFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validatePaymentForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      clearCart();
      router.push('/commande/confirmation');
    }
  }

  if (!shipping) {
    return (
      <Container className="max-w-xl py-12">
        <Heading level={1}>{t('paymentTitle')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('missingShipping')}</p>
        <Link href="/commande/livraison" className="mt-6 inline-block">
          <Button>{t('backToShipping')}</Button>
        </Link>
      </Container>
    );
  }

  const fields: { name: keyof PaymentFormValues; placeholder: string }[] = [
    { name: 'cardName', placeholder: '' },
    { name: 'cardNumber', placeholder: '4242 4242 4242 4242' },
    { name: 'expiry', placeholder: 'MM/AA' },
    { name: 'cvc', placeholder: '123' }
  ];

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('paymentTitle')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('mockNotice')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        {fields.map(({ name, placeholder }) => (
          <div key={name}>
            <label htmlFor={name} className="text-sm font-medium">
              {t(`fields.${name}`)}
            </label>
            <input
              id={name}
              type="text"
              placeholder={placeholder}
              value={values[name]}
              onChange={(event) => handleChange(name, event.target.value)}
              className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
              <p id={`${name}-error`} className="mt-1 text-xs text-accent">
                {t(`errors.${errors[name]}`)}
              </p>
            )}
          </div>
        ))}

        <Button type="submit" className="w-full">
          {t('confirmPayment')}
        </Button>
      </form>
    </Container>
  );
}
```

- [ ] **Étape 7 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Visiter `http://localhost:3000/fr/commande/paiement` directement sans avoir d'abord soumis la livraison — on s'attend au fallback « missingShipping » avec un lien retour vers `/commande/livraison`.
- Compléter la livraison (Tâche 19), arriver sur `/fr/commande/paiement`, soumettre un numéro de carte invalide (ex. `1234`) — on s'attend à l'erreur « invalide » uniquement sous le numéro de carte.
- Soumettre des valeurs de carte factices entièrement valides — on s'attend à une navigation vers `/fr/commande/confirmation` (404 pour l'instant — Tâche 21) et à un panier vide ensuite (vérifier le badge du Header).

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 8 : Commit**

```bash
git add src/lib/checkoutValidation.ts src/lib/checkoutValidation.test.ts src/app/[locale]/commande/paiement messages/fr.json messages/en.json
git commit -m "feat: add mock payment step for guest checkout"
```

---

### Tâche 21 : Tunnel de commande — Page confirmation

**Fichiers :**
- Créer : `src/app/[locale]/commande/confirmation/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (ajouter les clés de confirmation au namespace `checkout` existant)

**Interfaces :**
- Consomme : `useCheckout` (Tâche 19), `Container`/`Heading`/`Button` (Tâche 8).
- Produit : la route `/commande/confirmation`, l'étape finale du tunnel de commande invité.

- [ ] **Étape 1 : Ajouter les clés de messages de confirmation**

Ajouter ces clés à l'intérieur de l'objet `checkout` existant dans `messages/fr.json` :

```json
    "confirmationTitle": "Merci pour votre commande",
    "thankYou": "Votre commande {orderNumber} est confirmée. Un email de confirmation vous sera envoyé.",
    "noOrder": "Aucune commande à afficher.",
    "backHome": "Retour à l'accueil"
```

Ajouter ces clés à l'intérieur de l'objet `checkout` existant dans `messages/en.json` :

```json
    "confirmationTitle": "Thank you for your order",
    "thankYou": "Your order {orderNumber} is confirmed. A confirmation email will be sent to you.",
    "noOrder": "No order to display.",
    "backHome": "Back to home"
```

- [ ] **Étape 2 : Implémenter la page Confirmation**

Créer `src/app/[locale]/commande/confirmation/page.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCheckout } from '@/context/CheckoutContext';
import type { ShippingFormValues } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

export default function ConfirmationPage() {
  const t = useTranslations('checkout');
  const { shipping, clearShipping } = useCheckout();
  const [orderNumber] = useState(() => `RG-${Date.now().toString(36).toUpperCase()}`);
  const [confirmedShipping, setConfirmedShipping] = useState<ShippingFormValues | null>(null);
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (shipping && !hasCaptured.current) {
      hasCaptured.current = true;
      setConfirmedShipping(shipping);
      clearShipping();
    }
  }, [shipping, clearShipping]);

  if (!confirmedShipping) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <Heading level={1}>{t('confirmationTitle')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('noOrder')}</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>{t('backHome')}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12 text-center">
      <Heading level={1}>{t('confirmationTitle')}</Heading>
      <p className="mt-4 text-sm text-mist-600">{t('thankYou', { orderNumber })}</p>
      <div className="mt-8 border border-mist-200 p-6 text-left text-sm">
        <p className="font-medium">{confirmedShipping.fullName}</p>
        <p>{confirmedShipping.address}</p>
        <p>
          {confirmedShipping.postalCode} {confirmedShipping.city}
        </p>
        <p>{confirmedShipping.country}</p>
      </div>
      <Link href="/" className="mt-8 inline-block">
        <Button>{t('backHome')}</Button>
      </Link>
    </Container>
  );
}
```

Le ref `hasCaptured` protège contre une nouvelle capture : l'effet d'hydratation propre à `CheckoutContext` (Tâche 19) peuple `shipping` depuis `sessionStorage` de façon asynchrone après le premier rendu de cette page, donc `confirmedShipping` est délibérément capturé via un effet (une fois que `shipping` devient disponible) plutôt que via un initialiseur `useState` — un initialiseur `useState(shipping)` resterait figé sur la valeur `null` d'avant hydratation et n'afficherait jamais la vraie confirmation.

- [ ] **Étape 3 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Visiter `http://localhost:3000/fr/commande/confirmation` directement (sans tunnel de commande préalable) — on s'attend au fallback « noOrder ».
- Réaliser le parcours complet : ajouter un produit au panier → `/commande/livraison` (remplir et soumettre) → `/commande/paiement` (remplir et soumettre) → arriver sur `/commande/confirmation` avec un numéro de commande généré et l'adresse de livraison affichée.
- Recharger la page de confirmation — on s'attend à ce qu'elle retombe sur « noOrder » (les données de livraison ont été volontairement effacées après un seul affichage).
- Confirmer que le panier est vide (badge du Header) après ce parcours.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/[locale]/commande/confirmation messages/fr.json messages/en.json
git commit -m "feat: add checkout confirmation page, completing the guest checkout flow"
```

---

### Tâche 22 : Page à propos

**Fichiers :**
- Créer : `src/app/[locale]/a-propos/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `about` namespace)

**Interfaces :**
- Consomme : `Container`/`Heading`/`PlaceholderBlock` (Tâche 8).
- Produit : la route `/a-propos` liée depuis le Footer (Tâche 11).

- [ ] **Étape 1 : Ajouter le namespace de messages about**

Ajouter dans `messages/fr.json`:

```json
  "about": {
    "title": "À propos de Reign",
    "paragraph1": "Reign est née d'une conviction simple : le vêtement doit avoir de la tenue, littéralement et au figuré. Chaque collection part d'une silhouette, pas d'une tendance.",
    "paragraph2": "Nous travaillons avec un nombre volontairement restreint de matières et de fournisseurs, pour garder un contrôle total sur la coupe, la construction et la finition de chaque pièce.",
    "paragraph3": "Homme, femme, enfant, accessoires : une seule exigence traverse toutes nos catégories — que chaque pièce dure, et qu'elle s'impose."
  }
```

Ajouter dans `messages/en.json`:

```json
  "about": {
    "title": "About Reign",
    "paragraph1": "Reign was built on a simple conviction: clothing should hold its shape, literally and figuratively. Every collection starts from a silhouette, not a trend.",
    "paragraph2": "We work with a deliberately small number of materials and suppliers, to keep full control over the cut, construction, and finish of every piece.",
    "paragraph3": "Men, women, kids, accessories: one standard runs through every category — every piece is built to last, and built to command attention."
  }
```

- [ ] **Étape 2 : Implémenter la page À propos**

Créer `src/app/[locale]/a-propos/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <Container className="py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8 grid gap-12 md:grid-cols-2 md:items-center">
        <PlaceholderBlock aspect="portrait" />
        <div className="space-y-4 text-sm text-mist-700">
          <p>{t('paragraph1')}</p>
          <p>{t('paragraph2')}</p>
          <p>{t('paragraph3')}</p>
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Étape 3 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/a-propos` et `http://localhost:3000/en/a-propos` — confirmer que le titre, l'image placeholder et les trois paragraphes s'affichent correctement traduits dans chaque langue, et que le lien « À propos »/« About » du Footer se résout maintenant au lieu de faire un 404.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/[locale]/a-propos messages/fr.json messages/en.json
git commit -m "feat: add About page"
```

---

### Tâche 23 : Page contact

**Fichiers :**
- Créer : `src/lib/contactValidation.ts`
- Test : `src/lib/contactValidation.test.ts`
- Créer : `src/app/[locale]/contact/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `contact` namespace)

**Interfaces :**
- Consomme : `Container`/`Heading`/`Button` (Tâche 8).
- Produit : `ContactFormValues`, `ContactFormErrors`, `validateContactForm(values)` depuis `src/lib/contactValidation.ts`; la route `/contact` liée depuis le Footer.

- [ ] **Étape 1 : Écrire les tests en échec pour la validation du contact**

Créer `src/lib/contactValidation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateContactForm, type ContactFormValues } from './contactValidation';

const validValues: ContactFormValues = {
  name: 'Alex Martin',
  email: 'alex@example.com',
  message: "Bonjour, j'aimerais des informations sur une commande."
};

describe('validateContactForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validateContactForm(validValues)).toEqual({});
  });

  it('flags a missing name', () => {
    expect(validateContactForm({ ...validValues, name: '' }).name).toBe('required');
  });

  it('flags a missing email', () => {
    expect(validateContactForm({ ...validValues, email: '' }).email).toBe('required');
  });

  it('flags an invalid email format', () => {
    expect(validateContactForm({ ...validValues, email: 'nope' }).email).toBe('invalid');
  });

  it('flags a missing message', () => {
    expect(validateContactForm({ ...validValues, message: '' }).message).toBe('required');
  });

  it('flags a message that is too short', () => {
    expect(validateContactForm({ ...validValues, message: 'hi' }).message).toBe('tooShort');
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/contactValidation.test.ts`
Résultat attendu : ÉCHEC — `contactValidation.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter la validation du contact**

Créer `src/lib/contactValidation.ts`:

```ts
export interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!values.name.trim()) errors.name = 'required';

  if (!values.email.trim()) {
    errors.email = 'required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'invalid';
  }

  if (!values.message.trim()) {
    errors.message = 'required';
  } else if (values.message.trim().length < 10) {
    errors.message = 'tooShort';
  }

  return errors;
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/contactValidation.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Ajouter le namespace de messages contact**

Ajouter dans `messages/fr.json`:

```json
  "contact": {
    "title": "Contact",
    "intro": "Une question sur une commande, une collection ou un partenariat ? Écrivez-nous.",
    "fields": {
      "name": "Nom",
      "email": "Email",
      "message": "Message"
    },
    "errors": {
      "required": "Ce champ est requis.",
      "invalid": "Format invalide.",
      "tooShort": "Votre message est trop court (10 caractères minimum)."
    },
    "submit": "Envoyer",
    "success": "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement."
  }
```

Ajouter dans `messages/en.json`:

```json
  "contact": {
    "title": "Contact",
    "intro": "A question about an order, a collection, or a partnership? Write to us.",
    "fields": {
      "name": "Name",
      "email": "Email",
      "message": "Message"
    },
    "errors": {
      "required": "This field is required.",
      "invalid": "Invalid format.",
      "tooShort": "Your message is too short (minimum 10 characters)."
    },
    "submit": "Send",
    "success": "Thank you, your message has been sent. We'll get back to you shortly."
  }
```

- [ ] **Étape 6 : Implémenter la page Contact**

Créer `src/app/[locale]/contact/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateContactForm, type ContactFormValues, type ContactFormErrors } from '@/lib/contactValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: ContactFormValues = { name: '', email: '', message: '' };

export default function ContactPage() {
  const t = useTranslations('contact');
  const [values, setValues] = useState<ContactFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(field: keyof ContactFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateContactForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitted(true);
    }
  }

  if (isSubmitted) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <Heading level={1}>{t('title')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('success')}</p>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('intro')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            {t('fields.name')}
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(event) => handleChange('name', event.target.value)}
            className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-accent">{t(`errors.${errors.name}`)}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-accent">{t(`errors.${errors.email}`)}</p>}
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-medium">
            {t('fields.message')}
          </label>
          <textarea
            id="message"
            rows={5}
            value={values.message}
            onChange={(event) => handleChange('message', event.target.value)}
            className="mt-2 block w-full border border-mist-300 px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message && <p className="mt-1 text-xs text-accent">{t(`errors.${errors.message}`)}</p>}
        </div>

        <Button type="submit" className="w-full">
          {t('submit')}
        </Button>
      </form>
    </Container>
  );
}
```

- [ ] **Étape 7 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/contact` :
- Soumettre le formulaire vide affiche « requis » sous les trois champs.
- Un email invalide affiche « format invalide » uniquement sous l'email.
- Un message de moins de 10 caractères affiche l'erreur « trop court ».
- Une saisie valide affiche le message de succès à la place du formulaire.

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 8 : Commit**

```bash
git add src/lib/contactValidation.ts src/lib/contactValidation.test.ts src/app/[locale]/contact messages/fr.json messages/en.json
git commit -m "feat: add Contact page with validated form"
```

---

### Tâche 24 : Page FAQ / Aide

**Fichiers :**
- Créer : `src/components/ui/Accordion.tsx`
- Créer : `src/app/[locale]/aide/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `faq` namespace)

**Interfaces :**
- Consomme : `Container`/`Heading` (Tâche 8).
- Produit : `<Accordion items={AccordionItem[]} />` (une primitive générique réutilisable, pas spécifique à la FAQ — utilisable pour tout futur contenu en forme de Q&R) ; la route `/aide` liée depuis le Footer.

- [ ] **Étape 1 : Implémenter la primitive Accordion**

Créer `src/components/ui/Accordion.tsx`:

```tsx
'use client';

import { useState } from 'react';

export interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-mist-100 border-y border-mist-100">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"
            >
              <span>{item.question}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <p className="pb-4 text-sm text-mist-600">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Étape 2 : Ajouter le namespace de messages FAQ**

Ajouter dans `messages/fr.json`:

```json
  "faq": {
    "title": "FAQ",
    "items": [
      { "question": "Quels sont les délais de livraison ?", "answer": "Comptez 2 à 4 jours ouvrés en France, 4 à 7 jours ouvrés pour le Royaume-Uni." },
      { "question": "Puis-je retourner un article ?", "answer": "Oui, sous 30 jours à compter de la réception, dans son état d'origine. Voir notre page Livraison & Retours pour le détail." },
      { "question": "Comment connaître ma taille ?", "answer": "Consultez notre guide des tailles, accessible depuis chaque fiche produit et depuis le pied de page." },
      { "question": "Proposez-vous la livraison internationale ?", "answer": "Nous livrons actuellement en France et au Royaume-Uni. D'autres pays suivront." },
      { "question": "Comment suivre ma commande ?", "answer": "Un email de confirmation vous est envoyé après votre commande, avec le numéro de commande." }
    ]
  }
```

Ajouter dans `messages/en.json`:

```json
  "faq": {
    "title": "FAQ",
    "items": [
      { "question": "What are the delivery times?", "answer": "Allow 2 to 4 business days in France, 4 to 7 business days for the UK." },
      { "question": "Can I return an item?", "answer": "Yes, within 30 days of receipt, unworn and in its original packaging. See our Shipping & Returns page for details." },
      { "question": "How do I know my size?", "answer": "Check our size guide, accessible from every product page and from the footer." },
      { "question": "Do you ship internationally?", "answer": "We currently ship to France and the UK. More countries will follow." },
      { "question": "How do I track my order?", "answer": "A confirmation email is sent after your order, including your order number." }
    ]
  }
```

- [ ] **Étape 3 : Implémenter la page FAQ**

Créer `src/app/[locale]/aide/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');
  const items = t.raw('items') as AccordionItem[];

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8">
        <Accordion items={items} />
      </div>
    </Container>
  );
}
```

- [ ] **Étape 4 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/aide` :
- Les 5 questions s'affichent repliées.
- Cliquer sur une question déplie sa réponse et replie celle qui était éventuellement ouverte ; cliquer à nouveau la replie.
- Passer sur `/en/aide` et confirmer les traductions anglaises.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/ui/Accordion.tsx src/app/[locale]/aide messages/fr.json messages/en.json
git commit -m "feat: add FAQ page with reusable Accordion primitive"
```

---

### Tâche 25 : Page livraison & retours

**Fichiers :**
- Créer : `src/app/[locale]/livraison-retours/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `shippingReturns` namespace)

**Interfaces :**
- Consomme : `Container`/`Heading` (Tâche 8).
- Produit : la route `/livraison-retours` liée depuis le Footer et référencée par la FAQ (Tâche 24).

- [ ] **Étape 1 : Ajouter le namespace de messages shippingReturns**

Ajouter dans `messages/fr.json`:

```json
  "shippingReturns": {
    "title": "Livraison & Retours",
    "shippingTitle": "Livraison",
    "shippingBody": "Commandes expédiées sous 24 à 48h ouvrées. Livraison estimée : 2 à 4 jours ouvrés en France, 4 à 7 jours ouvrés au Royaume-Uni.",
    "returnsTitle": "Retours",
    "returnsBody": "Retour possible sous 30 jours à compter de la réception, article non porté et dans son emballage d'origine.",
    "exchangesTitle": "Échanges",
    "exchangesBody": "Pour un échange de taille ou de couleur, retournez l'article puis passez une nouvelle commande — le remboursement est déclenché dès réception du retour."
  }
```

Ajouter dans `messages/en.json`:

```json
  "shippingReturns": {
    "title": "Shipping & Returns",
    "shippingTitle": "Shipping",
    "shippingBody": "Orders ship within 24 to 48 business hours. Estimated delivery: 2 to 4 business days in France, 4 to 7 business days for the UK.",
    "returnsTitle": "Returns",
    "returnsBody": "Returns are accepted within 30 days of receipt, unworn and in original packaging.",
    "exchangesTitle": "Exchanges",
    "exchangesBody": "For a size or color exchange, return the item and place a new order — your refund is triggered as soon as the return is received."
  }
```

- [ ] **Étape 2 : Implémenter la page Livraison & Retours**

Créer `src/app/[locale]/livraison-retours/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export default async function ShippingReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('shippingReturns');

  const sections = [
    { title: t('shippingTitle'), body: t('shippingBody') },
    { title: t('returnsTitle'), body: t('returnsBody') },
    { title: t('exchangesTitle'), body: t('exchangesBody') }
  ];

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <Heading level={2} className="text-xl">
              {section.title}
            </Heading>
            <p className="mt-2 text-sm text-mist-700">{section.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Étape 3 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `http://localhost:3000/fr/livraison-retours` et `/en/livraison-retours` — confirmer que les trois sections (Livraison, Retours, Échanges) s'affichent correctement traduites, et que le lien du Footer se résout maintenant.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/[locale]/livraison-retours messages/fr.json messages/en.json
git commit -m "feat: add Shipping & Returns page"
```

---

### Tâche 26 : Page guide des tailles + modale

**Fichiers :**
- Créer : `src/components/product/SizeGuideTable.tsx`
- Créer : `src/components/product/SizeGuideModal.tsx`
- Créer : `src/app/[locale]/guide-tailles/page.tsx`
- Modifier : `src/components/product/ProductDetailView.tsx` (ajouter un déclencheur du guide des tailles à côté du sélecteur de taille)
- Modifier : `messages/fr.json`, `messages/en.json` (add `sizeGuide` namespace)

**Interfaces :**
- Consomme : `Container`/`Heading` (Tâche 8).
- Produit : `<SizeGuideTable />` (les mesures, présentation) et `<SizeGuideModal />` (un bouton déclencheur autonome + une modale enveloppant le tableau) — la page dédiée affiche le tableau directement ; la PDP (Tâche 15) affiche la modale à côté de son sélecteur de taille, remplissant l'exigence « page dédiée + modale réutilisable » de la spec pour ce contenu.

- [ ] **Étape 1 : Ajouter le namespace de messages sizeGuide**

Ajouter dans `messages/fr.json`:

```json
  "sizeGuide": {
    "title": "Guide des tailles",
    "modalTrigger": "Guide des tailles",
    "unitsNote": "Mesures en centimètres.",
    "adultsTitle": "Homme & Femme",
    "kidsTitle": "Enfant",
    "size": "Taille",
    "chest": "Tour de poitrine",
    "waist": "Tour de taille",
    "height": "Taille (hauteur)",
    "close": "Fermer"
  }
```

Ajouter dans `messages/en.json`:

```json
  "sizeGuide": {
    "title": "Size Guide",
    "modalTrigger": "Size guide",
    "unitsNote": "Measurements in centimeters.",
    "adultsTitle": "Men & Women",
    "kidsTitle": "Kids",
    "size": "Size",
    "chest": "Chest",
    "waist": "Waist",
    "height": "Height",
    "close": "Close"
  }
```

- [ ] **Étape 2 : Implémenter le tableau des mesures**

Créer `src/components/product/SizeGuideTable.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

const CLOTHING_ROWS = [
  { size: 'XS', chest: '86-90', waist: '68-72' },
  { size: 'S', chest: '91-95', waist: '73-77' },
  { size: 'M', chest: '96-100', waist: '78-82' },
  { size: 'L', chest: '101-106', waist: '83-88' },
  { size: 'XL', chest: '107-112', waist: '89-94' }
];

const KIDS_ROWS = [
  { size: '4A', height: '98-104' },
  { size: '6A', height: '110-116' },
  { size: '8A', height: '122-128' },
  { size: '10A', height: '134-140' },
  { size: '12A', height: '146-152' }
];

export function SizeGuideTable() {
  const t = useTranslations('sizeGuide');

  return (
    <div className="space-y-10">
      <div>
        <h3 className="font-serif text-lg">{t('adultsTitle')}</h3>
        <p className="mt-1 text-xs text-mist-500">{t('unitsNote')}</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-mist-200 text-left">
              <th className="py-2">{t('size')}</th>
              <th className="py-2">{t('chest')}</th>
              <th className="py-2">{t('waist')}</th>
            </tr>
          </thead>
          <tbody>
            {CLOTHING_ROWS.map((row) => (
              <tr key={row.size} className="border-b border-mist-100">
                <td className="py-2">{row.size}</td>
                <td className="py-2">{row.chest}</td>
                <td className="py-2">{row.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-serif text-lg">{t('kidsTitle')}</h3>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-mist-200 text-left">
              <th className="py-2">{t('size')}</th>
              <th className="py-2">{t('height')}</th>
            </tr>
          </thead>
          <tbody>
            {KIDS_ROWS.map((row) => (
              <tr key={row.size} className="border-b border-mist-100">
                <td className="py-2">{row.size}</td>
                <td className="py-2">{row.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Étape 3 : Implémenter l'enveloppe de la modale**

Créer `src/components/product/SizeGuideModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SizeGuideTable } from './SizeGuideTable';

export function SizeGuideModal() {
  const t = useTranslations('sizeGuide');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-mist-600 underline hover:text-accent"
      >
        {t('modalTrigger')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto bg-paper p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{t('title')}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t('close')}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mt-6">
              <SizeGuideTable />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Étape 4 : Implémenter la page dédiée**

Créer `src/app/[locale]/guide-tailles/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { SizeGuideTable } from '@/components/product/SizeGuideTable';

export default async function SizeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('sizeGuide');

  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <div className="mt-8">
        <SizeGuideTable />
      </div>
    </Container>
  );
}
```

- [ ] **Étape 5 : Brancher la modale dans le sélecteur de taille de la PDP**

Modifier `src/components/product/ProductDetailView.tsx` — ajouter l'import `import { SizeGuideModal } from './SizeGuideModal';`. Le fichier a deux blocs de forme similaire se terminant par `</select>\n          </div>` (taille, puis couleur, dans cet ordre) — ce changement ne cible que le **premier**, le bloc taille. Remplacer cette séquence exacte (noter le select `id="size"` et le label `{t('quantity')}` qui le suivent, inclus ici pour que la bonne occurrence soit sans ambiguïté) :

```tsx
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="color" className="text-sm font-medium">
```

with:

```tsx
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <SizeGuideModal />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="color" className="text-sm font-medium">
```

(Seul le `</div>` de fermeture du bloc taille reçoit le nouveau `<div className="mt-2"><SizeGuideModal /></div>` — le bloc couleur juste après reste inchangé.)

- [ ] **Étape 6 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Visiter `http://localhost:3000/fr/guide-tailles` — les deux tableaux de mesures s'affichent.
- Visiter une PDP (ex. `/fr/produit/homme-veste-oversize`) — un lien « Guide des tailles » apparaît sous le sélecteur de taille ; cliquer dessus ouvre le même tableau dans une modale, refermable via le × ou l'overlay.
- Passer sur `/en` et confirmer les libellés anglais à la fois sur la page et dans la modale.

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 7 : Commit**

```bash
git add src/components/product/SizeGuideTable.tsx src/components/product/SizeGuideModal.tsx src/app/[locale]/guide-tailles src/components/product/ProductDetailView.tsx messages/fr.json messages/en.json
git commit -m "feat: add size guide page and reusable modal, wired into the PDP"
```

---

### Tâche 27 : Pages légales x3 (mentions légales, CGV, confidentialité)

**Fichiers :**
- Créer : `src/components/legal/LegalPageLayout.tsx`
- Créer : `src/app/[locale]/mentions-legales/page.tsx`
- Créer : `src/app/[locale]/cgv/page.tsx`
- Créer : `src/app/[locale]/confidentialite/page.tsx`
- Modifier : `messages/fr.json`, `messages/en.json` (add `legalNotice`, `terms`, `privacy` namespaces)

**Interfaces :**
- Consomme : `Container`/`Heading` (Tâche 8).
- Produit : `<LegalPageLayout title={string} paragraphs={string[]} />`, et les routes `/mentions-legales`, `/cgv`, `/confidentialite` liées depuis le Footer.

**Important :** le texte légal ci-dessous est un texte de **modèle** réaliste pour une marque fictive, écrit pour une démo fonctionnelle — ce n'est pas un conseil juridique vérifié. Il doit être relu et adapté par un professionnel qualifié avant tout lancement réel, conformément aux Contraintes globales.

- [ ] **Étape 1 : Ajouter les trois namespaces de messages légaux**

Ajouter dans `messages/fr.json`:

```json
  "legalNotice": {
    "title": "Mentions légales",
    "paragraphs": [
      "Le site Reign est édité par Reign SAS, société fictive à des fins de démonstration, au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 000 000 000.",
      "Directeur de la publication : à compléter. Contact : contact@reign.example.",
      "Hébergement : à compléter par l'hébergeur réel du site.",
      "Ce texte est un modèle générique fourni à titre indicatif. Il doit être relu et validé par un professionnel du droit avant toute mise en ligne réelle."
    ]
  },
  "terms": {
    "title": "Conditions Générales de Vente",
    "paragraphs": [
      "Les présentes conditions générales de vente régissent les commandes passées sur le site Reign entre le client et Reign SAS.",
      "Les prix sont indiqués en euros ou en livres sterling, toutes taxes comprises, hors frais de livraison précisés avant validation de la commande.",
      "Le client dispose d'un délai de rétractation de 14 jours à compter de la réception de sa commande, conformément à la réglementation applicable.",
      "Ce texte est un modèle générique fourni à titre indicatif. Il doit être relu et validé par un professionnel du droit avant toute mise en ligne réelle."
    ]
  },
  "privacy": {
    "title": "Politique de confidentialité",
    "paragraphs": [
      "Reign SAS collecte les données nécessaires au traitement des commandes (identité, adresse, email) ainsi que les préférences de langue et de devise, stockées localement dans votre navigateur.",
      "Aucune donnée de paiement n'est traitée ni conservée par ce site en phase actuelle de démonstration.",
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en nous contactant à contact@reign.example.",
      "Ce texte est un modèle générique fourni à titre indicatif. Il doit être relu et validé par un professionnel du droit avant toute mise en ligne réelle."
    ]
  }
```

Ajouter dans `messages/en.json`:

```json
  "legalNotice": {
    "title": "Legal Notice",
    "paragraphs": [
      "The Reign website is published by Reign SAS, a fictitious company for demonstration purposes, with capital of €10,000, registered with the Paris Trade Register under number 000 000 000.",
      "Publication director: to be completed. Contact: contact@reign.example.",
      "Hosting: to be completed by the site's actual host.",
      "This text is a generic template provided for illustrative purposes. It must be reviewed and approved by a qualified legal professional before any real-world launch."
    ]
  },
  "terms": {
    "title": "Terms of Sale",
    "paragraphs": [
      "These terms of sale govern orders placed on the Reign website between the customer and Reign SAS.",
      "Prices are shown in euros or pounds sterling, all taxes included, excluding delivery fees which are specified before the order is confirmed.",
      "The customer has a 14-day withdrawal period from receipt of their order, in accordance with applicable regulations.",
      "This text is a generic template provided for illustrative purposes. It must be reviewed and approved by a qualified legal professional before any real-world launch."
    ]
  },
  "privacy": {
    "title": "Privacy Policy",
    "paragraphs": [
      "Reign SAS collects the data necessary to process orders (identity, address, email) as well as language and currency preferences, stored locally in your browser.",
      "No payment data is processed or retained by this site in its current demonstration phase.",
      "In accordance with GDPR, you have the right to access, rectify, and delete your data by contacting us at contact@reign.example.",
      "This text is a generic template provided for illustrative purposes. It must be reviewed and approved by a qualified legal professional before any real-world launch."
    ]
  }
```

- [ ] **Étape 2 : Implémenter le layout légal partagé**

Créer `src/components/legal/LegalPageLayout.tsx`:

```tsx
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export function LegalPageLayout({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <Container className="max-w-2xl py-12">
      <Heading level={1}>{title}</Heading>
      <div className="mt-8 space-y-4 text-sm text-mist-700">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Étape 3 : Implémenter les trois pages**

Créer `src/app/[locale]/mentions-legales/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legalNotice');

  return <LegalPageLayout title={t('title')} paragraphs={t.raw('paragraphs') as string[]} />;
}
```

Créer `src/app/[locale]/cgv/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('terms');

  return <LegalPageLayout title={t('title')} paragraphs={t.raw('paragraphs') as string[]} />;
}
```

Créer `src/app/[locale]/confidentialite/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');

  return <LegalPageLayout title={t('title')} paragraphs={t.raw('paragraphs') as string[]} />;
}
```

- [ ] **Étape 4 : Vérifier manuellement**

Exécuter : `npm run dev`, visiter `/fr/mentions-legales`, `/fr/cgv`, `/fr/confidentialite` et leurs équivalents `/en/...` — confirmer que chacune affiche son titre et ses quatre paragraphes, correctement traduits, et que les trois liens du Footer se résolvent maintenant (chaque lien du Footer construit depuis la Tâche 11 pointe désormais vers une vraie page).

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/legal/LegalPageLayout.tsx src/app/[locale]/mentions-legales src/app/[locale]/cgv src/app/[locale]/confidentialite messages/fr.json messages/en.json
git commit -m "feat: add legal notice, terms of sale, and privacy policy template pages"
```

---

### Tâche 28 : Page 404

**Fichiers :**
- Créer : `src/app/not-found.tsx` (root-level fallback, outside any locale)
- Créer : `src/app/[locale]/not-found.tsx` (stylisée, consciente de la langue — utilisée par chaque appel à `notFound()` depuis les Tâches 14, 15, 21)
- Modifier : `messages/fr.json`, `messages/en.json` (add `notFound` namespace)

**Interfaces :**
- Consomme : `Container`/`Heading`/`Button` (Tâche 8), `Link` (Tâche 3).
- Produit : la limite affichée pour toute route non appariée ou tout appel explicite à `notFound()`.

- [ ] **Étape 1 : Ajouter le namespace de messages notFound**

Ajouter dans `messages/fr.json`:

```json
  "notFound": {
    "title": "Page introuvable",
    "body": "La page que vous cherchez n'existe pas ou a été déplacée.",
    "backHome": "Retour à l'accueil"
  }
```

Ajouter dans `messages/en.json`:

```json
  "notFound": {
    "title": "Page not found",
    "body": "The page you're looking for doesn't exist or has been moved.",
    "backHome": "Back to home"
  }
```

- [ ] **Étape 2 : Implémenter le 404 conscient de la langue**

Créer `src/app/[locale]/not-found.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');

  return (
    <Container className="max-w-xl py-24 text-center">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-4 text-sm text-mist-600">{t('body')}</p>
      <Link href="/" className="mt-8 inline-block">
        <Button>{t('backHome')}</Button>
      </Link>
    </Container>
  );
}
```

Ceci se rend à l'intérieur de `src/app/[locale]/layout.tsx` (Header/Footer inclus) pour chaque appel à `notFound()` déjà utilisé par la page catégorie (Tâche 14), la fiche produit (Tâche 15), et le garde-fou de langue lui-même (Tâche 3).

- [ ] **Étape 3 : Implémenter le fallback au niveau racine**

Créer `src/app/not-found.tsx` (une page simple et autonome — elle ne se rend que pour les requêtes qui échouent avant même qu'une langue soit résolue, donc elle ne peut pas s'appuyer sur `next-intl` ou les tokens de design comme toutes les autres pages) :

```tsx
export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem' }}>
        <h1>404</h1>
        <p>Page not found.</p>
        <a href="/fr">Home</a>
      </body>
    </html>
  );
}
```

- [ ] **Étape 4 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Visiter `http://localhost:3000/fr/this-does-not-exist` — on s'attend au 404 stylisé (Header/Footer présents, « Page introuvable », un bouton « Retour à l'accueil » fonctionnel).
- Visiter `http://localhost:3000/en/this-does-not-exist` — pareil, en anglais.
- Visiter `http://localhost:3000/de/anything` (une langue non configurée) — on s'attend au même 404 conscient de la langue (le garde-fou de `[locale]/layout.tsx` de la Tâche 3 appelle `notFound()` pour les langues inconnues).

Exécuter : `npm run build`
Résultat attendu : succès.

- [ ] **Étape 5 : Commit**

```bash
git add src/app/not-found.tsx src/app/[locale]/not-found.tsx messages/fr.json messages/en.json
git commit -m "feat: add localized 404 page"
```

---

### Tâche 29 : Fondations SEO (metadata, hreflang, JSON-LD, sitemap, robots)

**Fichiers :**
- Créer : `src/lib/seo.ts`
- Test : `src/lib/seo.test.ts`
- Créer : `src/app/sitemap.ts`
- Créer : `src/app/robots.ts`
- Modifier : `src/app/[locale]/layout.tsx` (inject site-wide Organization JSON-LD)
- Modifier : `src/app/[locale]/page.tsx` (add `generateMetadata`)
- Modifier : `src/app/[locale]/[category]/page.tsx` (add `generateMetadata` + BreadcrumbList JSON-LD)
- Modifier : `src/app/[locale]/produit/[slug]/page.tsx` (add `generateMetadata` + Product and BreadcrumbList JSON-LD)

**Interfaces :**
- Consomme : `routing` (Tâche 3), `CATEGORIES`/`PRODUCTS` (Tâche 4).
- Produit : `buildMetadata`, `buildAlternateLanguages`, `organizationJsonLd`, `breadcrumbJsonLd`, `productJsonLd` depuis `src/lib/seo.ts`. Les pages institutionnelles (Tâches 22–27) conservent le `<title>`/description par défaut du layout de la Tâche 3 — seules les pages à plus fort trafic et les plus pertinentes pour le SEO (accueil, catégorie, produit) reçoivent des metadata et des données structurées dédiées dans cette passe ; l'étendre à chaque page institutionnelle est un petit chantier séparé à prévoir plus tard si besoin.

**Note :** `SITE_URL` ci-dessous est un domaine placeholder (`https://www.reign-example.com`) puisque Reign n'a pas encore de vrai domaine de production — mettre à jour cette seule constante une fois qu'un vrai domaine est choisi ; toutes les autres fonctions de ce fichier en dérivent.

- [ ] **Étape 1 : Écrire les tests en échec pour les helpers SEO**

Créer `src/lib/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildAlternateLanguages, breadcrumbJsonLd, productJsonLd } from './seo';

describe('buildAlternateLanguages', () => {
  it('returns an entry for each locale plus x-default', () => {
    const result = buildAlternateLanguages('/homme');
    expect(result.fr).toContain('/fr/homme');
    expect(result.en).toContain('/en/homme');
    expect(result['x-default']).toContain('/fr/homme');
  });
});

describe('breadcrumbJsonLd', () => {
  it('builds a positioned ListItem for each entry', () => {
    const result = breadcrumbJsonLd([
      { name: 'Accueil', url: 'https://example.com/fr' },
      { name: 'Homme', url: 'https://example.com/fr/homme' }
    ]);
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
  });
});

describe('productJsonLd', () => {
  it('formats the price as a fixed 2-decimal string', () => {
    const result = productJsonLd({
      name: 'Veste',
      description: 'Une veste',
      url: 'https://example.com/fr/produit/veste',
      priceEur: 320,
      imageUrl: 'https://example.com/placeholder.png'
    });
    expect(result.offers.price).toBe('320.00');
  });
});
```

- [ ] **Étape 2 : Exécuter les tests pour vérifier qu'ils échouent**

Exécuter : `npm run test -- src/lib/seo.test.ts`
Résultat attendu : ÉCHEC — `seo.ts` n'existe pas encore.

- [ ] **Étape 3 : Implémenter les helpers SEO**

Créer `src/lib/seo.ts`:

```ts
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export const SITE_URL = 'https://www.reign-example.com';

export function buildAlternateLanguages(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${SITE_URL}/${locale}${pathname}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${pathname}`;
  return languages;
}

export function buildMetadata({
  locale,
  pathname,
  title,
  description
}: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}${pathname}`,
      languages: buildAlternateLanguages(pathname)
    }
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Reign',
    url: SITE_URL,
    logo: `${SITE_URL}/branding/logo-reign.png`
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function productJsonLd({
  name,
  description,
  url,
  priceEur,
  imageUrl
}: {
  name: string;
  description: string;
  url: string;
  priceEur: number;
  imageUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [imageUrl],
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: priceEur.toFixed(2),
      availability: 'https://schema.org/InStock'
    }
  };
}
```

- [ ] **Étape 4 : Exécuter les tests pour vérifier qu'ils réussissent**

Exécuter : `npm run test -- src/lib/seo.test.ts`
Résultat attendu : succès.

- [ ] **Étape 5 : Ajouter les routes sitemap et robots**

Créer `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CATEGORIES, PRODUCTS } from '@/lib/products';
import { SITE_URL } from '@/lib/seo';

const STATIC_PATHS = [
  '',
  '/a-propos',
  '/contact',
  '/aide',
  '/livraison-retours',
  '/guide-tailles',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
  '/favoris',
  '/panier'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${SITE_URL}/${locale}${path}` });
    }
    for (const category of CATEGORIES) {
      entries.push({ url: `${SITE_URL}/${locale}/${category}` });
    }
    for (const product of PRODUCTS) {
      entries.push({ url: `${SITE_URL}/${locale}/produit/${product.slug}` });
    }
  }

  return entries;
}
```

Créer `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
```

- [ ] **Étape 6 : Injecter le JSON-LD Organization à l'échelle du site**

Modifier `src/app/[locale]/layout.tsx` — importer `organizationJsonLd` depuis `@/lib/seo`, et ajouter la balise script comme premier enfant à l'intérieur de `<body>`, avant `<NextIntlClientProvider>` :

```tsx
      <body className="bg-paper text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <NextIntlClientProvider messages={messages}>
```

- [ ] **Étape 7 : Ajouter les metadata à la page d'accueil**

Modifier `src/app/[locale]/page.tsx` — ajouter cet export au-dessus de `HomePage` (aux côtés de l'import existant `getTranslations`/`setRequestLocale`, qui couvre déjà ce qu'il faut) :

```tsx
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return buildMetadata({
    locale,
    pathname: '',
    title: `Reign — ${t('heroTitle')}`,
    description: t('heroSubtitle')
  });
}
```

- [ ] **Étape 8 : Ajouter les metadata et le fil d'Ariane à la page catégorie**

Modifier `src/app/[locale]/[category]/page.tsx` — ajouter les imports `import type { Metadata } from 'next';` et `import { buildMetadata, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';`, puis ajouter cet export au-dessus de `CategoryPage` :

```tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: 'category' });
  return buildMetadata({
    locale,
    pathname: `/${category}`,
    title: `${t(`title.${category}`)} — Reign`,
    description: t(`title.${category}`)
  });
}
```

À l'intérieur du JSX retourné par `CategoryPage`, ajouter le script de fil d'Ariane comme premier enfant du `<Container>` :

```tsx
    <Container className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Reign', url: `${SITE_URL}/${locale}` },
              { name: t(`title.${category}`), url: `${SITE_URL}/${locale}/${category}` }
            ])
          )
        }}
      />
      <Heading level={1}>{t(`title.${category}`)}</Heading>
```

- [ ] **Étape 9 : Ajouter les metadata et les données structurées à la fiche produit**

Modifier `src/app/[locale]/produit/[slug]/page.tsx` — ajouter les imports `import type { Metadata } from 'next';` et `import { buildMetadata, breadcrumbJsonLd, productJsonLd, SITE_URL } from '@/lib/seo';`, puis ajouter cet export au-dessus de `ProductPage` :

```tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const localizedLocale = locale as 'fr' | 'en';
  return buildMetadata({
    locale,
    pathname: `/produit/${slug}`,
    title: `${product.name[localizedLocale]} — Reign`,
    description: product.description[localizedLocale]
  });
}
```

Modifier le corps de `ProductPage` pour injecter les deux blocs JSON-LD avant `<ProductDetailView />` :

```tsx
  const localizedLocale = locale as 'fr' | 'en';
  const productUrl = `${SITE_URL}/${locale}/produit/${product.slug}`;

  return (
    <Container className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Reign', url: `${SITE_URL}/${locale}` },
              { name: product.category, url: `${SITE_URL}/${locale}/${product.category}` },
              { name: product.name[localizedLocale], url: productUrl }
            ])
          )
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd({
              name: product.name[localizedLocale],
              description: product.description[localizedLocale],
              url: productUrl,
              priceEur: product.priceEur,
              imageUrl: `${SITE_URL}/branding/logo-reign.png`
            })
          )
        }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </Container>
  );
```

(`imageUrl` retombe sur le logo de la marque puisqu'il n'y a pas de vraies photos produits en phase 1 — le remplacer par la vraie URL de l'image produit une fois la photographie ajoutée en phase 2.)

- [ ] **Étape 10 : Vérifier manuellement**

Exécuter : `npm run dev` :
- Visiter `http://localhost:3000/fr` et afficher le code source de la page — confirmer que le script JSON-LD Organization est présent et est un JSON valide.
- Visiter une page catégorie et une fiche produit, afficher le code source, et confirmer que leur `<title>`, leurs balises `<link>` canonical/hreflang, et les scripts JSON-LD sont présents et bien formés (les coller dans un validateur JSON en cas de doute).
- Visiter `http://localhost:3000/sitemap.xml` — on s'attend à des entrées pour chaque chemin statique, catégorie et produit, dans les deux langues.
- Visiter `http://localhost:3000/robots.txt` — on s'attend à la règle allow-all et à une référence au sitemap.

Exécuter : `npm run test && npm run build`
Résultat attendu : les deux réussissent.

- [ ] **Étape 11 : Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts src/app/sitemap.ts src/app/robots.ts src/app/[locale]/layout.tsx src/app/[locale]/page.tsx src/app/[locale]/[category]/page.tsx src/app/[locale]/produit/[slug]/page.tsx
git commit -m "feat: add metadata, hreflang, JSON-LD, sitemap, and robots.txt"
```

---

### Tâche 30 : Passe de QA finale

**Fichiers :** aucun créé — cette tâche vérifie l'ensemble du site construit à travers les Tâches 1–29 et corrige ce qu'elle trouve. Si des corrections sont nécessaires, elles atterrissent dans le fichier existant concerné ; si rien n'est trouvé, aucun commit n'est fait.

**Interfaces :**
- Consomme : l'intégralité du site construit jusqu'ici.
- Produit : la confiance que chaque route, chaque langue, les deux devises, et le parcours complet panier/tunnel de commande fonctionnent de bout en bout — le critère de sortie de ce plan.

- [ ] **Étape 1 : Exécuter les vérifications automatisées**

Exécuter, dans l'ordre, et confirmer que chacune réussit avant de passer à la suivante :

```bash
npm run test
npm run lint
npm run build
```

En cas d'échec, corriger le problème sous-jacent dans le fichier concerné (pas en affaiblissant un test ou en désactivant une règle de lint) et relancer jusqu'à ce que les trois réussissent.

- [ ] **Étape 2 : Auditer chaque lien à la recherche de 404**

Exécuter : `npm run dev`. En partant de `http://localhost:3000/fr`, cliquer sur : chaque catégorie de la nav du Header, le champ de recherche, les icônes favoris et panier, chaque lien du Footer (À propos, Contact, FAQ, Livraison & Retours, Guide des tailles, Mentions légales, CGV, Confidentialité), le parcours complet de tunnel de commande invité (Panier → Livraison → Paiement → Confirmation), et le lien « Guide des tailles » sur une PDP. Rien ne devrait être en 404 — chaque route référencée n'importe où sur le site existe désormais (les Tâches 13–28 les ont toutes construites).

- [ ] **Étape 3 : Vérifier la parité bilingue**

Pour au moins l'accueil, une catégorie, une PDP, le Panier, et l'étape Livraison, basculer entre `/fr` et `/en` avec le sélecteur de langue du Header et confirmer que chaque texte visible est traduit (pas de français qui fuit dans la version anglaise ou l'inverse) et que le chemin actuel est préservé lors du changement. Ouvrir la console devtools du navigateur pendant ce test — `next-intl` logue un avertissement pour toute clé de message manquante, donc confirmer que la console reste propre.

- [ ] **Étape 4 : Vérifier le comportement de la devise**

Sur une page catégorie et une PDP, basculer entre EUR et GBP avec le sélecteur de devise du Header et confirmer que chaque prix affiché est recalculé en utilisant le taux fixe depuis `src/lib/currency.ts` (1 EUR = 0,86 GBP) et formaté avec le bon symbole de devise pour la devise sélectionnée, quelle que soit la langue active.

- [ ] **Étape 5 : Contrôle ponctuel du responsive**

En utilisant la barre d'outils device des devtools du navigateur, vérifier l'accueil, un listing catégorie, une PDP, le Panier, et le formulaire de livraison à trois largeurs : 375px (mobile), 768px (tablette), 1280px (desktop). Confirmer : aucune barre de défilement horizontale n'apparaît nulle part, le Header se replie en menu hamburger sous `md` et se déplie correctement, les éléments `<select>` de filtre catégorie et les formulaires de tunnel de commande restent pleinement utilisables (labels visibles, champs pleine largeur) sur mobile.

- [ ] **Étape 6 : Commit (seulement si l'Étape 1 a nécessité des corrections)**

```bash
git add -A
git commit -m "fix: address issues found in final QA pass"
```

Si aucune correction n'était nécessaire, passer cette étape — il n'y a rien à commiter.

---
