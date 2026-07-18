# Cart System & Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fully functional React Cart Context, persistent localStorage cart, slide-in Cart Drawer responsive component (mobile, tablet, PC), and a notification Toast system, aligned with the prototype designs in `Site DivinExpress.dc.html`.

**Architecture:** Create client contexts for Toast (`ToastContext.tsx`) and Cart (`CartContext.tsx`). Build the `CartDrawer` component to slide in using CSS modules. Wrap the application root layout with these contexts, and bind the Header bag icon to trigger the drawer open action.

**Tech Stack:** Next.js 14 App Router, TypeScript, next-intl, CSS Modules, React Context, React hooks.

## Global Constraints

- No Tailwind — CSS Modules only.
- `@/` resolves to the repo root.
- Locale-aware links use `Link` from `@/i18n/navigation`.
- Maintain Inter sans-serif font family.
- All prices are processed in centimes (`priceCents`) to prevent decimal precision errors.

---

### Task 1: Implement Toast Notification System

**Files:**
- Create: `components/Toast/ToastContext.tsx`
- Create: `components/Toast/Toast.module.css`

**Interfaces:**
- Produces: `ToastProvider` context and `useToast()` hook. Offers a `showToast(msg: string)` method that renders a black pill at the bottom-center of the viewport.

- [ ] **Step 1: Write Toast stylesheet**
Create `components/Toast/Toast.module.css`:
```css
.toastContainer {
  position: fixed;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast {
  background: var(--color-black, #0c0407);
  color: var(--color-white, #ffffff);
  border-radius: var(--radius-full, 999px);
  padding: 11px 22px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-popover);
  font-family: var(--font-sans);
  animation: slideUpFade 0.25s var(--ease-standard);
  white-space: nowrap;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: Write Toast context code**
Create `components/Toast/ToastContext.tsx`:
```tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showToast = (msg: string) => {
    setMessage(msg);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className={styles.toastContainer}>
          <div className={styles.toast}>{message}</div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
```

- [ ] **Step 3: Commit**
```bash
git add components/Toast/ToastContext.tsx components/Toast/Toast.module.css
git commit -m "feat: add Toast notification system"
```

---

### Task 2: Implement Cart Context & Provider

**Files:**
- Create: `components/Cart/CartContext.tsx`

**Interfaces:**
- Produces: `CartProvider` context and `useCart()` hook. Manages items, quantity mutations, open/close drawer states, and syncs cart state automatically with `localStorage`.

- [ ] **Step 1: Write Cart context code**
Create `components/Cart/CartContext.tsx`:
```tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotalCents: number;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'divinexpress_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Avoid SSR hydration error by loading from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    setIsMounted(true);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [cart, isMounted]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = newItem.quantity ?? 1;
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.size === newItem.size &&
          item.color === newItem.color
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qtyToAdd };
        return updated;
      }
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.productId === productId && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotalCents = cart.reduce((total, item) => total + item.quantity * item.priceCents, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        totalItems,
        subtotalCents,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
```

- [ ] **Step 2: Commit**
```bash
git add components/Cart/CartContext.tsx
git commit -m "feat: add CartContext and Provider with localStorage persistence"
```

---

### Task 3: Create Cart Drawer Component

**Files:**
- Create: `components/Cart/CartDrawer.tsx`
- Create: `components/Cart/CartDrawer.module.css`

**Interfaces:**
- Produces: `CartDrawer` sliding responsive client component. Lists added items, modifies quantities, calculates subtotal, slides from the right, and simulates checkout with a Toast message.

- [ ] **Step 1: Write CartDrawer stylesheet**
Create `components/Cart/CartDrawer.module.css`:
```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 4, 7, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9990;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--duration-base) var(--ease-standard), visibility var(--duration-base) var(--ease-standard);
}

.overlayActive {
  opacity: 1;
  visibility: visible;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 420px;
  background: var(--color-white, #ffffff);
  box-shadow: -10px 0 30px rgba(12, 4, 7, 0.08);
  z-index: 9991;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform var(--duration-base) var(--ease-standard);
  font-family: var(--font-sans);
}

@media (max-width: 480px) {
  .drawer {
    width: 100%;
  }
}

.drawerActive {
  transform: translateX(0);
}

.header {
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border-hairline);
}

.title {
  margin: 0;
  font-size: var(--body-md-size);
  font-weight: 700;
}

.closeButton {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  color: var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.itemList {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-grey-mid);
  gap: var(--space-3);
  font-size: 14px;
}

.item {
  display: flex;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid rgba(12, 4, 7, 0.05);
}

.itemImage {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-cream-soft);
}

.itemDetails {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.itemName {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: var(--color-black);
}

.itemOptions {
  font-size: 12px;
  color: var(--color-grey-mid);
}

.qtyActions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-grey-light);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.stepButton {
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--color-black);
}

.qtyValue {
  font-size: 13px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.removeButton {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  color: var(--color-grey-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: color var(--duration-fast) var(--ease-standard);
}

.removeButton:hover {
  color: var(--color-price-sale);
}

.itemPrice {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-black);
  align-self: flex-start;
}

.footer {
  padding: var(--space-6);
  border-top: var(--border-hairline);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-cream-soft);
}

.summaryRow {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 700;
}

.checkoutButton {
  width: 100%;
  background: var(--color-black);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: 16px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard);
  text-align: center;
}

.checkoutButton:hover {
  background: var(--color-grey-dark);
}
```

- [ ] **Step 2: Write CartDrawer component code**
Create `components/Cart/CartDrawer.tsx`:
```tsx
'use client';

import { useCart } from './CartContext';
import { useToast } from '../Toast/ToastContext';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const {
    cart,
    isOpen,
    subtotalCents,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();
  const { showToast } = useToast();

  const handleCheckout = () => {
    clearCart();
    closeCart();
    showToast('Commande confirmée — merci pour votre achat !');
  };

  // Simple price formatter inside client drawer
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayActive : ''}`}
        onClick={closeCart}
      />
      <div className={`${styles.drawer} ${isOpen ? styles.drawerActive : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Votre panier</h2>
          <button onClick={closeCart} className={styles.closeButton} aria-label="Fermer le panier">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.itemList}>
          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Votre panier est vide</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className={styles.item}>
                <img src={item.image} alt={item.name} className={styles.itemImage} />
                <div className={styles.itemDetails}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                  <span className={styles.itemOptions}>
                    Taille: {item.size} | Couleur: {item.color}
                  </span>
                  <div className={styles.qtyActions}>
                    <div className={styles.stepper}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className={styles.stepButton}
                        aria-label="Diminuer"
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        className={styles.stepButton}
                        aria-label="Augmenter"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className={styles.removeButton}
                      aria-label="Supprimer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className={styles.itemPrice}>{formatPrice(item.priceCents * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span>Sous-total</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <button onClick={handleCheckout} className={styles.checkoutButton}>
              Commander
            </button>
          </div>
        )}
      </div>
    </>
  );
}
export default CartDrawer;
```

- [ ] **Step 3: Commit**
```bash
git add components/Cart/CartDrawer.tsx components/Cart/CartDrawer.module.css
git commit -m "feat: add CartDrawer component with animations and checkout simulation"
```

---

### Task 4: Integrate Providers and Drawer in Layout

**Files:**
- Modify: [layout.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/app/%5Blocale%5D/layout.tsx)

**Interfaces:**
- Produces: Updated root layout wrapping children inside context providers and injecting `<CartDrawer />`.

- [ ] **Step 1: Edit layout.tsx**
Wrap everything inside `ToastProvider` and `CartProvider`, then append `<CartDrawer />` to the body.
Let's modify `app/[locale]/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { locales, type Locale } from '@/i18n';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { CartProvider } from '@/components/Cart/CartContext';
import { ToastProvider } from '@/components/Toast/ToastContext';
import { CartDrawer } from '@/components/Cart/CartDrawer';
import '@/app/styles/tokens.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'DivinExpress',
  description: "E-commerce de vêtements premium, livrés en France et en Afrique de l'Ouest"
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <CartProvider>
              <Header locale={locale} />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer locale={locale} />
              <CartDrawer />
            </CartProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add app/[locale]/layout.tsx
git commit -m "feat: integrate Cart and Toast providers and CartDrawer globally in Layout"
```

---

### Task 5: Bind Header Cart Icon to Drawer

**Files:**
- Modify: [HeaderActions.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/DivinExpress/components/Header/HeaderActions.tsx)

**Interfaces:**
- Produces: Interactive bag icon in Header displaying the sum of added items and opening the cart on click.

- [ ] **Step 1: Rewrite HeaderActions.tsx**
Use the `useCart()` hook to get `totalItems` and `openCart`, then bind them to the cart action wrapper.
Replace `components/Header/HeaderActions.tsx` with:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { useCart } from '@/components/Cart/CartContext';
import styles from './HeaderActions.module.css';

export function HeaderActions({
  locale,
  searchLabel
}: {
  locale: Locale;
  searchLabel: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { totalItems, openCart } = useCart();

  function submitSearch() {
    if (query.trim() === '') return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className={styles.actions}>
      <div className={styles.searchWrapper}>
        {searchOpen && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSearch();
            }}
            placeholder={searchLabel}
            autoFocus
            className={styles.searchInput}
          />
        )}
        <svg
          onClick={() => setSearchOpen((open) => !open)}
          className={styles.icon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-black)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ cursor: 'pointer', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <div className={styles.cartWrapper} onClick={openCart}>
        <svg
          className={styles.icon}
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-black)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ cursor: 'pointer' }}
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add components/Header/HeaderActions.tsx
git commit -m "feat: bind Header bag icon to CartDrawer state and display item count badge"
```

---

## Verification Plan

### Automated Verification
```bash
npx tsc --noEmit
npm run lint
npm run test
```

### Manual Verification
1. Open page `http://localhost:3002/fr`.
2. Click the shopping bag icon. Verify that the drawer slides in from the right and that a blurred backdrop overlay appears.
3. Verify that clicking the backdrop or the "X" button close the drawer.
4. Open the JavaScript browser console. Execute a temporary script to test adding an item:
   ```javascript
   // Run this inside console:
   const addBtn = document.querySelector('button'); // Or run a dispatch event if we expose context window-side, or simply proceed to test PDP.
   ```
   Alternatively, we can edit the HomePage temporarily or test inside a test file that `useCart().addToCart` populates localStorage correctly.
5. In the drawer, verify that quantity adjusters work and calculate correct prices.
6. Verify clicking checkout closes cart, clears data, and displays Toast.
