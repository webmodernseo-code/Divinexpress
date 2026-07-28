# Plan d'Implémentation de la Refonte DivinExpress

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Porter à l'identique la boutique et l'administration statique DivinExpress en Next.js 14 avec Supabase (Auth + Base de données), Tailwind CSS (thème étendu) et next-intl (Bilingue FR/EN).

**Architecture:** Application Next.js 14 en App Router avec intégration directe des fichiers CSS d'origine pour un rendu pixel-perfect. Les actions d'achat (checkout) et de gestion d'admin seront assurées par des Server Actions Next.js connectées à PostgreSQL via Prisma.

**Tech Stack:** Next.js 14, Tailwind CSS, Prisma, Supabase Auth, Supabase DB (PostgreSQL), next-intl.

## Global Constraints
* **Contrainte de Non-Modification** : Ne jamais modifier ou ajouter de fichier dans le dossier `/DivinExpress`. C'est notre blueprint en lecture seule.
* **Branding** : Utiliser uniquement "DivinExpress" (sans espace, d-i-v-i-n-e-x-p-r-e-s-s) pour tous les affichages, toasts, et localstorage.
* **Langues** : Support obligatoire de l'Anglais (en) et du Français (fr) avec routage par sous-chemins (`/fr/...` et `/en/...`).
* **Sécurité** : Authentification via Supabase Auth pour toute la section `/admin/dashboard`.

---

### Task 1: Configuration du Multilingue (next-intl)

**Files:**
- Create: `i18n.ts`
- Create: `middleware.ts`
- Create: `messages/fr.json`
- Create: `messages/en.json`

**Interfaces:**
- Produces: Routage multilingue automatique sur `/fr` et `/en` et dictionnaires de traduction UI.

- [ ] **Step 1: Créer le fichier de configuration i18n.ts**
  Créer `i18n.ts` à la racine :
  ```typescript
  import {notFound} from 'next/navigation';
  import {getRequestConfig} from 'next-intl/server';
  
  const locales = ['fr', 'en'];
  
  export default getRequestConfig(async ({locale}) => {
    if (!locales.includes(locale as any)) notFound();
    return {
      messages: (await import(`./messages/${locale}.json`)).default
    };
  });
  ```

- [ ] **Step 2: Créer le middleware de redirection et gestion des langues**
  Créer `middleware.ts` à la racine :
  ```typescript
  import createMiddleware from 'next-intl/middleware';
  
  export default createMiddleware({
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    localePrefix: 'always'
  });
  
  export const config = {
    matcher: ['/', '/(fr|en)/:path*', '/((?!api|_next|_ipx|images|.*\\..*).*)']
  };
  ```

- [ ] **Step 3: Créer les dictionnaires de traduction**
  Créer `messages/fr.json` :
  ```json
  {
    "Common": {
      "title": "DivinExpress | Boutique Officielle",
      "cart": "Panier",
      "favorites": "Favoris",
      "addToCart": "Ajouter au panier",
      "checkout": "Passer la commande",
      "total": "Total",
      "loading": "Chargement..."
    }
  }
  ```
  Créer `messages/en.json` :
  ```json
  {
    "Common": {
      "title": "DivinExpress | Official Store",
      "cart": "Cart",
      "favorites": "Favorites",
      "addToCart": "Add to cart",
      "checkout": "Checkout",
      "total": "Total",
      "loading": "Loading..."
    }
  }
  ```

- [ ] **Step 4: Commiter les fichiers multilingues**
  Run: `git add i18n.ts middleware.ts messages/fr.json messages/en.json`
  Run: `git commit -m "feat: configure next-intl localization middleware and dictionaries"`

---

### Task 2: Connexion à la Base de Données (Prisma Client Singleton)

**Files:**
- Create: `lib/db.ts`

**Interfaces:**
- Produces: Instance unique `prisma` pour exécuter les requêtes SQL.

- [ ] **Step 1: Créer le singleton Prisma Client**
  Créer le fichier `lib/db.ts` :
  ```typescript
  import { PrismaClient } from '@prisma/client';
  
  const prismaClientSingleton = () => {
    return new PrismaClient();
  };
  
  declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  }
  
  const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  
  export default prisma;
  
  if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
  ```

- [ ] **Step 2: Commiter le client de base de données**
  Run: `git add lib/db.ts`
  Run: `git commit -m "feat: add prisma client singleton"`

---

### Task 3: Contextes et Layout Global de la Boutique

**Files:**
- Create: `app/[locale]/layout.tsx`
- Create: `components/StoreContext.tsx`
- Create: `app/[locale]/storefront.css`

**Interfaces:**
- Consumes: `lib/db.ts`
- Produces: Contexte React global pour le panier (`cart`) et les favoris (`favorites`).

- [ ] **Step 1: Créer le fichier CSS de style d'origine**
  Copier le contenu de `DivinExpress/css/divinexpress.css` dans `app/[locale]/storefront.css`.

- [ ] **Step 2: Créer le contexte global du panier et des favoris**
  Créer `components/StoreContext.tsx` :
  ```typescript
  'use client';
  import React, { createContext, useContext, useState, useEffect } from 'react';
  
  interface CartItem {
    id: string;
    variantId: string;
    size: string;
    color: string;
    quantity: number;
    title: string;
    price: number;
    image: string;
  }
  
  interface StoreContextProps {
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>, qty: number) => void;
    removeFromCart: (variantId: string) => void;
    favorites: string[];
    toggleFavorite: (id: string) => void;
  }
  
  const StoreContext = createContext<StoreContextProps | undefined>(undefined);
  
  export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
  
    useEffect(() => {
      const savedCart = localStorage.getItem('DivinExpress_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedFavs = localStorage.getItem('DivinExpress_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    }, []);
  
    const addToCart = (item: Omit<CartItem, 'quantity'>, qty: number) => {
      setCart((prev) => {
        const next = [...prev];
        const idx = next.findIndex((i) => i.variantId === item.variantId);
        if (idx !== -1) {
          next[idx].quantity += qty;
        } else {
          next.push({ ...item, quantity: qty });
        }
        localStorage.setItem('DivinExpress_cart', JSON.stringify(next));
        return next;
      });
    };
  
    const removeFromCart = (variantId: string) => {
      setCart((prev) => {
        const next = prev.filter((i) => i.variantId !== variantId);
        localStorage.setItem('DivinExpress_cart', JSON.stringify(next));
        return next;
      });
    };
  
    const toggleFavorite = (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id];
        localStorage.setItem('DivinExpress_favorites', JSON.stringify(next));
        return next;
      });
    };
  
    return (
      <StoreContext.Provider value={{ cart, addToCart, removeFromCart, favorites, toggleFavorite }}>
        {children}
      </StoreContext.Provider>
    );
  };
  
  export const useStore = () => {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used within StoreProvider');
    return ctx;
  };
  ```

- [ ] **Step 3: Créer le layout bilingue de la boutique**
  Modifier `app/[locale]/layout.tsx` :
  ```typescript
  import './storefront.css';
  import { StoreProvider } from '@/components/StoreContext';
  import { NextIntlClientProvider } from 'next-intl';
  import { getMessages } from 'next-intl/server';
  
  export default async function LocaleLayout({
    children,
    params: { locale }
  }: {
    children: React.ReactNode;
    params: { locale: string };
  }) {
    const messages = await getMessages();
  
    return (
      <html lang={locale}>
        <body>
          <NextIntlClientProvider messages={messages}>
            <StoreProvider>
              {children}
            </StoreProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }
  ```

- [ ] **Step 4: Commiter le layout et le contexte**
  Run: `git add app/[locale]/layout.tsx components/StoreContext.tsx app/[locale]/storefront.css`
  Run: `git commit -m "feat: implement store client context provider and base locale layout"`

---

### Task 4: Boutique Principale (Portage à l'identique d'index.html)

**Files:**
- Create: `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `components/StoreContext.tsx`
- Produces: La page d'accueil bilingue DivinExpress avec tous ses états (filtres, panier, détails produit, commande).

- [ ] **Step 1: Porter le code d'index.html en TSX**
  Créer le fichier `app/[locale]/page.tsx` en reprenant la structure HTML exacte de `DivinExpress/index.html` (avec le Header, le Hero, la grille de produits, le formulaire de suivi de colis, les popups, et le panier client interactif).
  S'assurer que toutes les images pointent vers `/images/` au lieu de `images/`.

- [ ] **Step 2: Coder la logique d'interactivité avec React**
  Implémenter les filtres de catégories, de tri, l'ajout au panier, la sélection de taille/couleur, et l'affichage des fenêtres modales (Quick View et Tiroir du Panier) en utilisant les variables d'état React.

- [ ] **Step 3: Commiter la boutique principale**
  Run: `git add app/[locale]/page.tsx`
  Run: `git commit -m "feat: port static storefront HTML and logic identically to page.tsx"`

---

### Task 4: Pages Légales Boutique (CGV, Mentions Légales, Confidentialité)

**Files:**
- Create: `app/[locale]/legal/page.tsx`
- Create: `app/[locale]/privacy/page.tsx`
- Create: `app/[locale]/terms/page.tsx`

- [ ] **Step 1: Porter legal.html en legal/page.tsx**
  Créer `app/[locale]/legal/page.tsx` en copiant l'HTML structurel de `DivinExpress/legal.html`.

- [ ] **Step 2: Porter privacy.html en privacy/page.tsx**
  Créer `app/[locale]/privacy/page.tsx` en copiant l'HTML de `DivinExpress/privacy.html`.

- [ ] **Step 3: Porter terms.html en terms/page.tsx**
  Créer `app/[locale]/terms/page.tsx` en copiant l'HTML de `DivinExpress/terms.html`.

- [ ] **Step 4: Commiter les pages légales**
  Run: `git add app/[locale]/legal/page.tsx app/[locale]/privacy/page.tsx app/[locale]/terms/page.tsx`
  Run: `git commit -m "feat: port legal, privacy, and terms pages"`

---

### Task 5: Server Actions d'Achat (Checkout & Codes Promos)

**Files:**
- Create: `app/[locale]/actions.ts`

**Interfaces:**
- Consumes: `lib/db.ts`
- Produces: Actions de validation de panier et d'enregistrement de commande.

- [ ] **Step 1: Implémenter l'action de validation du code promo**
  Créer `app/[locale]/actions.ts` avec la validation de promo :
  ```typescript
  'use server';
  import prisma from '@/lib/db';
  
  export async function validatePromoCode(code: string) {
    const promo = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    });
    if (!promo || !promo.isActive) {
      return { success: false, message: 'Code invalide ou expiré' };
    }
    return { success: true, type: promo.type, value: promo.value };
  }
  ```

- [ ] **Step 2: Implémenter l'action d'enregistrement de la commande**
  Ajouter l'action de checkout dans `app/[locale]/actions.ts` :
  ```typescript
  export async function createOrder(data: {
    email: string;
    phone: string;
    address: string;
    paymentMethod: string;
    total: number;
    items: { variantId: string; quantity: number; price: number }[];
    promoCode?: string;
  }) {
    // Calcul et validation
    // Génération du numéro de commande DV-XXXXX
    const num = 'DV-' + Math.floor(10000 + Math.random() * 90000);
    
    const order = await prisma.order.create({
      data: {
        orderNumber: num,
        customerEmail: data.email,
        shippingAddr: data.address,
        country: 'Côte d’Ivoire',
        currency: 'FCFA',
        totalCents: Math.round(data.total * 100),
        status: 'PENDING',
        items: {
          create: data.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPriceCents: Math.round(i.price * 100)
          }))
        }
      }
    });
    
    return { success: true, orderNumber: num };
  }
  ```

- [ ] **Step 3: Commiter les actions d'achat**
  Run: `git add app/[locale]/actions.ts`
  Run: `git commit -m "feat: implement server actions for promo validation and order creation"`

---

### Task 6: Administration (Connexion & Tableau de Bord)

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/dashboard/page.tsx`
- Create: `app/admin/admin.css`

**Interfaces:**
- Consumes: `lib/db.ts`
- Produces: Zone d'administration protégée avec connexion et dashboard interactif d'origine.

- [ ] **Step 1: Copier le CSS d'administration**
  Copier le contenu de `DivinExpress/admin/admin.css` dans `app/admin/admin.css`.

- [ ] **Step 2: Créer le layout de l'administration**
  Créer `app/admin/layout.tsx` pour inclure uniquement `admin.css`.

- [ ] **Step 3: Créer la page de connexion administrateur**
  Créer `app/admin/login/page.tsx` avec le formulaire de connexion Supabase Auth (email et mot de passe).

- [ ] **Step 4: Importer le Dashboard d'administration statique**
  Créer `app/admin/dashboard/page.tsx` en transposant identiquement le code de `DivinExpress/admin/index.html` (avec la barre latérale, l'en-tête, les compteurs de statistiques, les onglets des commandes, des produits et des codes promos).
  Brancher l'affichage et la mise à jour des statuts de commandes directement sur la base de données PostgreSQL via des appels de requêtes Prisma.

- [ ] **Step 5: Commiter l'administration**
  Run: `git add app/admin/layout.tsx app/admin/login/page.tsx app/admin/dashboard/page.tsx app/admin/admin.css`
  Run: `git commit -m "feat: implement admin dashboard layout, login, and pages"`
