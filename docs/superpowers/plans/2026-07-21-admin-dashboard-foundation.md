# Admin Dashboard Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication and shell for the DivinExpress admin dashboard: password login with a signed session cookie, middleware-protected `/admin/*` routes, a sidebar shell matching the site's existing black/white design system, a real "Vue d'ensemble" page, and stub pages for the sections that don't have data models yet.

**Architecture:** All auth logic (hashing, session token creation/verification, and the redirect decision) lives in pure, dependency-free functions in `lib/adminAuth.ts`, unit-tested with Vitest. `middleware.ts` and the login Server Action are thin wrappers around those pure functions. The dashboard shell is a route group (`app/admin/(dashboard)`) sharing one layout with a sidebar component; stub pages all render one shared `ComingSoon` component.

**Tech Stack:** Next.js 14 App Router (Server Actions, Route Handlers, Middleware), Node's built-in `crypto` module for password hashing (scrypt) and session signing (HMAC-SHA256) — no new npm dependency, Prisma (existing `lib/prisma.ts` singleton), Vitest for the pure-function tests.

## Global Constraints

- No new npm dependency in `package.json` `dependencies` — no bcrypt/bcryptjs/next-auth/jose. Use Node's built-in `crypto` module only.
- Vitest is configured for `**/*.test.ts` only, plain Node environment, no jsdom/RTL. Only pure functions get automated tests; Server Actions, route handlers, and page rendering are verified manually against the dev server.
- Reuse existing design tokens from `app/styles/tokens.css` (`--color-black`, `--color-white`, `--color-cream`, `--radius-md`, `--radius-sm`, `--shadow-card`, `--shadow-popover`, `--border-hairline`, `--font-sans`, `--duration-fast`, `--ease-standard`) — do not invent new colors.
- `/admin/*` is entirely outside the `app/[locale]/` tree and is French-only (no next-intl usage in admin routes).
- The existing i18n middleware behavior for the public site (`/`, `/(fr|en)/:path*`) must be unchanged — verify no regression.
- The reusable Prisma client is `prisma` exported from `lib/prisma.ts` (`import { prisma } from '@/lib/prisma'`) — never instantiate `new PrismaClient()` elsewhere.
- Spec: `docs/superpowers/specs/2026-07-21-admin-dashboard-foundation-design.md`

---

### Task 1: Pure auth helpers (`lib/adminAuth.ts`)

**Files:**
- Create: `lib/adminAuth.ts`
- Test: `lib/adminAuth.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export function hashPassword(password: string): string
  export function verifyPassword(password: string, storedHash: string): boolean
  export function createSessionToken(adminId: string, secret: string, now?: number): string
  export function verifySessionToken(token: string, secret: string, now?: number): { adminId: string } | null
  export function shouldRedirectToLogin(pathname: string, sessionCookieValue: string | undefined, secret: string): boolean
  ```
  Consumed by Task 2 (`middleware.ts`), Task 3 (login/logout), and Task 7 (seed script).

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/adminAuth.test.ts
import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  shouldRedirectToLogin
} from './adminAuth';

describe('hashPassword / verifyPassword', () => {
  it('verifies a correct password against its hash', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('produces a different salt on each call', () => {
    const hashA = hashPassword('same-password');
    const hashB = hashPassword('same-password');
    expect(hashA).not.toBe(hashB);
  });

  it('rejects a malformed stored hash', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
  });
});

describe('createSessionToken / verifySessionToken', () => {
  const secret = 'test-secret';

  it('round-trips a valid token', () => {
    const token = createSessionToken('admin-1', secret);
    expect(verifySessionToken(token, secret)).toEqual({ adminId: 'admin-1' });
  });

  it('rejects a token signed with a different secret', () => {
    const token = createSessionToken('admin-1', secret);
    expect(verifySessionToken(token, 'other-secret')).toBeNull();
  });

  it('rejects a tampered token', () => {
    const token = createSessionToken('admin-1', secret);
    const tampered = token.replace('admin-1', 'admin-2');
    expect(verifySessionToken(tampered, secret)).toBeNull();
  });

  it('rejects an expired token', () => {
    const now = 1_000_000;
    const token = createSessionToken('admin-1', secret, now);
    const eightDaysLater = now + 1000 * 60 * 60 * 24 * 8;
    expect(verifySessionToken(token, secret, eightDaysLater)).toBeNull();
  });

  it('accepts a token just before expiry', () => {
    const now = 1_000_000;
    const token = createSessionToken('admin-1', secret, now);
    const sixDaysLater = now + 1000 * 60 * 60 * 24 * 6;
    expect(verifySessionToken(token, secret, sixDaysLater)).toEqual({ adminId: 'admin-1' });
  });

  it('rejects a malformed token', () => {
    expect(verifySessionToken('not.enough.parts.here', secret)).toBeNull();
    expect(verifySessionToken('only-one-part', secret)).toBeNull();
  });
});

describe('shouldRedirectToLogin', () => {
  const secret = 'test-secret';

  it('never redirects for non-admin paths', () => {
    expect(shouldRedirectToLogin('/fr/boutique', undefined, secret)).toBe(false);
  });

  it('never redirects the login page itself', () => {
    expect(shouldRedirectToLogin('/admin/login', undefined, secret)).toBe(false);
  });

  it('redirects an admin path with no session cookie', () => {
    expect(shouldRedirectToLogin('/admin', undefined, secret)).toBe(true);
  });

  it('redirects an admin path with an invalid session cookie', () => {
    expect(shouldRedirectToLogin('/admin', 'garbage', secret)).toBe(true);
  });

  it('allows an admin path with a valid session cookie', () => {
    const token = createSessionToken('admin-1', secret);
    expect(shouldRedirectToLogin('/admin', token, secret)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/adminAuth.test.ts`
Expected: FAIL with "Cannot find module './adminAuth'" (or similar)

- [ ] **Step 3: Write the implementation**

```typescript
// lib/adminAuth.ts
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';

const SCRYPT_KEYLEN = 64;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidateHash = scryptSync(password, salt, SCRYPT_KEYLEN);
  const storedHashBuffer = Buffer.from(hash, 'hex');
  if (candidateHash.length !== storedHashBuffer.length) return false;
  return timingSafeEqual(candidateHash, storedHashBuffer);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(adminId: string, secret: string, now: number = Date.now()): string {
  const expiresAt = now + SESSION_DURATION_MS;
  const payload = `${adminId}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): { adminId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [adminId, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!adminId || !expiresAtStr || !signature || Number.isNaN(expiresAt)) return null;

  const expectedSignature = sign(`${adminId}.${expiresAtStr}`, secret);
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  if (expiresAt < now) return null;

  return { adminId };
}

export function shouldRedirectToLogin(
  pathname: string,
  sessionCookieValue: string | undefined,
  secret: string
): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (pathname === '/admin/login') return false;
  if (!sessionCookieValue) return true;
  return verifySessionToken(sessionCookieValue, secret) === null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/adminAuth.test.ts`
Expected: PASS (17 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/adminAuth.ts lib/adminAuth.test.ts
git commit -m "feat: add pure password hashing and session token helpers for admin auth"
```

---

### Task 2: Middleware protection for `/admin/*`

**Files:**
- Modify: `middleware.ts` (full rewrite)

**Interfaces:**
- Consumes: `shouldRedirectToLogin(pathname: string, sessionCookieValue: string | undefined, secret: string): boolean` from `./lib/adminAuth` (Task 1).

- [ ] **Step 1: Rewrite the middleware**

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';
import { shouldRedirectToLogin } from './lib/adminAuth';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const secret = process.env.ADMIN_SESSION_SECRET ?? '';
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (shouldRedirectToLogin(pathname, sessionCookie, secret)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*', '/admin/:path*']
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual verification**

With `npm run dev` running, open `http://localhost:3000/admin` in a browser: it should redirect to `http://localhost:3000/admin/login` (the login page will 404 until Task 3 — that's expected at this point, just confirm the redirect itself happens, e.g. via the Network tab or curl: `curl -I http://localhost:3000/admin` should show a `307`/`308` redirect to `/admin/login`). Then confirm the public site still works: open `http://localhost:3000/` and confirm it still redirects to `/fr` as before (no regression).

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /admin routes with session-cookie middleware"
```

---

### Task 3: Admin root layout, login page, Server Action, and logout route

**Context:** `app/admin/*` is a top-level route segment, a sibling of `app/[locale]/`, not nested under it. There is no `app/layout.tsx` at the true repo root — `app/[locale]/layout.tsx` is currently the only root layout, and it defines the `<html>`/`<body>` tags and imports `app/styles/tokens.css`. Since `/admin` doesn't share that layout, it needs its own root layout doing the same for the admin branch, or admin pages would have no valid HTML document shell and none of the `var(--color-black)` etc. tokens used elsewhere in this plan would resolve.

**Files:**
- Create: `app/admin/layout.tsx` (root layout for the whole `/admin` branch — wraps both `/admin/login` and everything under `(dashboard)`)
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/page.module.css`
- Create: `app/admin/login/actions.ts`
- Create: `app/admin/logout/route.ts`

**Interfaces:**
- Consumes: `verifyPassword`, `createSessionToken` from `@/lib/adminAuth` (Task 1); `prisma` from `@/lib/prisma`.

- [ ] **Step 1: Create the admin root layout**

```tsx
// app/admin/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '@/app/styles/tokens.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'DivinExpress — Admin',
  description: 'Dashboard admin DivinExpress.'
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create the Server Action**

```typescript
// app/admin/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken } from '@/lib/adminAuth';

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const secret = process.env.ADMIN_SESSION_SECRET;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !secret || !verifyPassword(password, admin.passwordHash)) {
    redirect('/admin/login?error=1');
  }

  cookies().set('admin_session', createSessionToken(admin.id, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect('/admin');
}
```

- [ ] **Step 3: Create the login page**

```tsx
// app/admin/login/page.tsx
import { login } from './actions';
import styles from './page.module.css';

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === '1';

  return (
    <main className={styles.container}>
      <form action={login} className={styles.card}>
        <div className={styles.brand}>
          <svg width="40" height="40" viewBox="0 0 100 100">
            <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="#0c0407" />
            <text x="50" y="62" fontSize="36" fontWeight="800" fill="#ffffff" textAnchor="middle" fontFamily="Inter, sans-serif">
              DX
            </text>
          </svg>
          <span className={styles.brandText}>DIVINEXPRESS</span>
        </div>
        <h1 className={styles.title}>Connexion admin</h1>
        {hasError && <p className={styles.error}>Email ou mot de passe incorrect.</p>}
        <label className={styles.label}>
          Email
          <input type="email" name="email" required autoFocus className={styles.input} />
        </label>
        <label className={styles.label}>
          Mot de passe
          <input type="password" name="password" required className={styles.input} />
        </label>
        <button type="submit" className={styles.submit}>
          Se connecter
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Create the login page styles**

```css
/* app/admin/login/page.module.css */
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-cream, #f6f1e9);
  padding: var(--space-6, 24px);
}

.card {
  width: 100%;
  max-width: 360px;
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-8, 32px);
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  margin-bottom: var(--space-2, 8px);
}

.brandText {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.04em;
  color: var(--color-black, #0c0407);
}

.title {
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0;
}

.error {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-price-sale, #b3271e);
  background: rgba(179, 39, 30, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 12px;
  margin: 0;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
}

.input {
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 10px 12px;
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-sm, 8px);
  outline: none;
  transition: border-color var(--duration-fast, 150ms) var(--ease-standard, ease);
}

.input:focus {
  border-color: var(--color-black, #0c0407);
}

.submit {
  margin-top: var(--space-2, 8px);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
  border: none;
  border-radius: var(--radius-full, 999px);
  padding: 12px;
  cursor: pointer;
  transition: opacity var(--duration-fast, 150ms) var(--ease-standard, ease);
}

.submit:hover {
  opacity: 0.85;
}
```

- [ ] **Step 5: Create the logout route**

```typescript
// app/admin/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.cookies.set('admin_session', '', { path: '/admin', expires: new Date(0) });
  return response;
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Manual verification (partial — no valid credentials yet)**

With `npm run dev` running, open `http://localhost:3000/admin/login`: confirm the page renders with the DivinExpress logo, wordmark, and a styled card (rounded corners, shadow, Inter font) — not an unstyled HTML form. This confirms `app/admin/layout.tsx` is correctly providing the `<html>`/`<body>` shell and `tokens.css`. Submitting the form will redirect to `/admin/login?error=1` (no admin account exists yet) — confirm the error message renders styled (red text on light red background), not just plain text.

- [ ] **Step 8: Commit**

```bash
git add app/admin/layout.tsx app/admin/login app/admin/logout
git commit -m "feat: add admin root layout, login page, server action, and logout route"
```

---

### Task 4: Dashboard shell (sidebar + protected layout)

**Files:**
- Create: `components/Admin/AdminSidebar.tsx`
- Create: `components/Admin/AdminSidebar.module.css`
- Create: `app/admin/(dashboard)/layout.tsx`
- Create: `app/admin/(dashboard)/layout.module.css`

**Interfaces:**
- Produces: `<AdminSidebar />` (no props — reads the current path itself via `usePathname`), consumed by Task 4's own layout only.

- [ ] **Step 1: Create the sidebar component**

```tsx
// components/Admin/AdminSidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminSidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const icon = (path: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Boutique',
    items: [
      { label: 'Vue d’ensemble', href: '/admin', icon: icon('M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z') },
      { label: 'Commandes', href: '/admin/commandes', icon: icon('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0') },
      { label: 'Retours', href: '/admin/retours', icon: icon('M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 9') },
      { label: 'Clients', href: '/admin/clients', icon: icon('M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z') }
    ]
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Produits', href: '/admin/produits', icon: icon('M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8') },
      { label: 'Réductions', href: '/admin/reductions', icon: icon('M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4a2 2 0 0 1 1.4-.4H19a2 2 0 0 1 2 2v6.8a2 2 0 0 1-.4 1.4zM15 8h.01') },
      { label: 'Articles de blog', href: '/admin/blog', icon: icon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6') }
    ]
  },
  {
    label: 'Suivi',
    items: [
      { label: 'Analytique', href: '/admin/analytique', icon: icon('M3 3v18h18M8 17V10M13 17V6M18 17v-4') },
      { label: 'Messages', href: '/admin/messages', icon: icon('M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z') }
    ]
  }
];

const SETTINGS_ITEM: NavItem = {
  label: 'Paramètres',
  href: '/admin/parametres',
  icon: icon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z')
};

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  function renderItem(item: NavItem) {
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <svg width="32" height="32" viewBox="0 0 100 100">
          <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="#0c0407" />
          <text x="50" y="62" fontSize="36" fontWeight="800" fill="#ffffff" textAnchor="middle" fontFamily="Inter, sans-serif">
            DX
          </text>
        </svg>
        <span className={styles.brandText}>DIVINEXPRESS</span>
      </div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{group.label}</span>
            {group.items.map(renderItem)}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        {renderItem(SETTINGS_ITEM)}
        <form action="/admin/logout" method="POST">
          <button type="submit" className={styles.logout}>
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create the sidebar styles**

```css
/* components/Admin/AdminSidebar.module.css */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--color-white, #ffffff);
  border-right: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  display: flex;
  flex-direction: column;
  padding: var(--space-6, 24px) var(--space-4, 16px);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: 0 var(--space-2, 8px);
  margin-bottom: var(--space-8, 32px);
}

.brandText {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--color-black, #0c0407);
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6, 24px);
  overflow-y: auto;
}

.navGroup {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.navGroupLabel {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: var(--label-tracking, 0.04em);
  text-transform: uppercase;
  color: #9ca3af;
  padding: 0 var(--space-2, 8px);
  margin-bottom: 6px;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px var(--space-2, 8px);
  border-radius: var(--radius-full, 999px);
  color: var(--color-black, #0c0407);
  text-decoration: none;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  transition: background var(--duration-fast, 150ms) var(--ease-standard, ease);
}

.navItem:hover {
  background: var(--color-cream, #f6f1e9);
}

.navItemActive {
  background: var(--color-black, #0c0407);
  color: var(--color-white, #ffffff);
}

.navItemActive:hover {
  background: var(--color-black, #0c0407);
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: var(--space-4, 16px);
  border-top: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.logout {
  width: 100%;
  text-align: left;
  padding: 9px var(--space-2, 8px);
  border-radius: var(--radius-full, 999px);
  border: none;
  background: transparent;
  color: #9ca3af;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-fast, 150ms) var(--ease-standard, ease), color var(--duration-fast, 150ms) var(--ease-standard, ease);
}

.logout:hover {
  background: var(--color-cream, #f6f1e9);
  color: var(--color-black, #0c0407);
}
```

- [ ] **Step 3: Create the protected layout**

```tsx
// app/admin/(dashboard)/layout.tsx
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import styles from './layout.module.css';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create the layout styles**

```css
/* app/admin/(dashboard)/layout.module.css */
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-cream, #f6f1e9);
  font-family: var(--font-sans);
}

.content {
  flex: 1;
  padding: var(--space-8, 32px);
  max-width: 100%;
  overflow-x: hidden;
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (this layout has no page yet, that's Tasks 5-6 — it must still compile standalone)

- [ ] **Step 6: Commit**

```bash
git add components/Admin/AdminSidebar.tsx components/Admin/AdminSidebar.module.css "app/admin/(dashboard)/layout.tsx" "app/admin/(dashboard)/layout.module.css"
git commit -m "feat: add admin dashboard sidebar and protected layout shell"
```

---

### Task 5: Shared `ComingSoon` component and stub pages

**Files:**
- Create: `components/Admin/ComingSoon.tsx`
- Create: `components/Admin/ComingSoon.module.css`
- Create: `app/admin/(dashboard)/commandes/page.tsx`
- Create: `app/admin/(dashboard)/retours/page.tsx`
- Create: `app/admin/(dashboard)/clients/page.tsx`
- Create: `app/admin/(dashboard)/produits/page.tsx`
- Create: `app/admin/(dashboard)/reductions/page.tsx`
- Create: `app/admin/(dashboard)/blog/page.tsx`
- Create: `app/admin/(dashboard)/analytique/page.tsx`
- Create: `app/admin/(dashboard)/messages/page.tsx`
- Create: `app/admin/(dashboard)/parametres/page.tsx`

**Interfaces:**
- Produces: `<ComingSoon title={string} />`, consumed by all 9 stub pages below.

- [ ] **Step 1: Create the shared component**

```tsx
// components/Admin/ComingSoon.tsx
import styles from './ComingSoon.module.css';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>Cette section arrive bientôt.</p>
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

```css
/* components/Admin/ComingSoon.module.css */
.wrapper {
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-16, 64px) var(--space-8, 32px);
  text-align: center;
}

.title {
  font-family: var(--font-sans);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 8px;
}

.message {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
```

- [ ] **Step 3: Create the 9 stub pages**

```tsx
// app/admin/(dashboard)/commandes/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminOrdersPage() {
  return <ComingSoon title="Commandes" />;
}
```

```tsx
// app/admin/(dashboard)/retours/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminReturnsPage() {
  return <ComingSoon title="Retours" />;
}
```

```tsx
// app/admin/(dashboard)/clients/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminCustomersPage() {
  return <ComingSoon title="Clients" />;
}
```

```tsx
// app/admin/(dashboard)/produits/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminProductsPage() {
  return <ComingSoon title="Produits" />;
}
```

```tsx
// app/admin/(dashboard)/reductions/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminDiscountsPage() {
  return <ComingSoon title="Réductions" />;
}
```

```tsx
// app/admin/(dashboard)/blog/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminBlogPage() {
  return <ComingSoon title="Articles de blog" />;
}
```

```tsx
// app/admin/(dashboard)/analytique/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminAnalyticsPage() {
  return <ComingSoon title="Analytique" />;
}
```

```tsx
// app/admin/(dashboard)/messages/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminMessagesPage() {
  return <ComingSoon title="Messages" />;
}
```

```tsx
// app/admin/(dashboard)/parametres/page.tsx
import { ComingSoon } from '@/components/Admin/ComingSoon';

export default function AdminSettingsPage() {
  return <ComingSoon title="Paramètres" />;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/Admin/ComingSoon.tsx components/Admin/ComingSoon.module.css "app/admin/(dashboard)/commandes" "app/admin/(dashboard)/retours" "app/admin/(dashboard)/clients" "app/admin/(dashboard)/produits" "app/admin/(dashboard)/reductions" "app/admin/(dashboard)/blog" "app/admin/(dashboard)/analytique" "app/admin/(dashboard)/messages" "app/admin/(dashboard)/parametres"
git commit -m "feat: add shared ComingSoon component and stub pages for unbuilt admin sections"
```

---

### Task 6: Vue d'ensemble page with real data

**Files:**
- Create: `app/admin/(dashboard)/page.tsx`
- Create: `app/admin/(dashboard)/page.module.css`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`; `OrderStatus` enum from `@prisma/client`.

- [ ] **Step 1: Create the page**

```tsx
// app/admin/(dashboard)/page.tsx
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

export default async function AdminOverviewPage() {
  const [productCount, orderCount, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  return (
    <div>
      <h1 className={styles.title}>Vue d&rsquo;ensemble</h1>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Produits</span>
          <span className={styles.statValue}>{productCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Commandes</span>
          <span className={styles.statValue}>{orderCount}</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h2 className={styles.tableTitle}>Commandes récentes</h2>
        {recentOrders.length === 0 ? (
          <p className={styles.empty}>Aucune commande pour le moment.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customerEmail}</td>
                  <td>{STATUS_LABELS[order.status]}</td>
                  <td>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency }).format(
                      order.totalCents / 100
                    )}
                  </td>
                  <td>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

```css
/* app/admin/(dashboard)/page.module.css */
.title {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 var(--space-6, 24px);
}

.statsRow {
  display: flex;
  gap: var(--space-4, 16px);
  margin-bottom: var(--space-6, 24px);
}

.statCard {
  flex: 1;
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.statLabel {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.statValue {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 800;
  color: var(--color-black, #0c0407);
}

.tableCard {
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
}

.tableTitle {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 var(--space-4, 16px);
}

.empty {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 14px;
}

.table th {
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
  padding: 8px 12px;
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.table td {
  padding: 12px;
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  color: var(--color-black, #0c0407);
}

.table tr:last-child td {
  border-bottom: none;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(dashboard)/page.tsx" "app/admin/(dashboard)/page.module.css"
git commit -m "feat: add admin overview page with real product/order counts"
```

---

### Task 7: Admin seed and env documentation

**Files:**
- Modify: `prisma/seed.ts` (append only, at the end of the `main`/top-level seeding logic)
- Modify: `.env.example`

**Interfaces:**
- Consumes: `hashPassword` from `@/lib/adminAuth` (Task 1).

- [ ] **Step 1: Read the end of the current seed script to find the insertion point**

Run: `tail -n 20 prisma/seed.ts` and confirm where the top-level seeding logic ends (after the last `await prisma...` call, before any closing `main().then(...)`/`process.exit` boilerplate if present).

- [ ] **Step 2: Add the admin upsert**

Add this import at the top of `prisma/seed.ts` (alongside the existing `PrismaClient` import):

```typescript
import { hashPassword } from '../lib/adminAuth';
```

Add this block at the end of the seeding logic, before any final `console.log`/exit code:

```typescript
const adminEmail = process.env.ADMIN_SEED_EMAIL;
const adminPassword = process.env.ADMIN_SEED_PASSWORD;
if (adminEmail && adminPassword) {
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hashPassword(adminPassword) },
    create: { email: adminEmail, passwordHash: hashPassword(adminPassword), role: 'admin' }
  });
  console.log(`Admin account ready: ${adminEmail}`);
} else {
  console.log('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set — skipping admin account seed.');
}
```

- [ ] **Step 3: Document the new env vars**

Update `.env.example`:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"

# Secret used to sign admin dashboard session cookies. Generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_SESSION_SECRET=

# Optional: set these in your local .env (never committed) and run
# `npm run db:seed` to create/update your admin login.
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts .env.example
git commit -m "feat: seed the admin account from env vars and document required env vars"
```

---

### Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the 17 new `adminAuth` tests

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 3: Confirm no dependency changes**

Run: `git diff --stat <first-commit-of-this-plan> HEAD -- package.json package-lock.json`
Expected: no output

- [ ] **Step 4: Set up a temporary local-only admin account for verification**

The real admin credentials are the user's to set (via their own `.env`, per the design spec) and were intentionally not shared. To verify the login flow end-to-end without them, set temporary env vars for this verification only (do not write these into any tracked file):

```bash
export ADMIN_SEED_EMAIL="verify-temp@local.test"
export ADMIN_SEED_PASSWORD="verify-temp-password-$(date +%s)"
npm run db:seed
```

- [ ] **Step 5: Manual walkthrough against the spec's acceptance criteria**

With `npm run dev` running:
1. Visit `http://localhost:3000/admin/produits` while logged out → confirm redirect to `/admin/login`.
2. On `/admin/login`, submit the wrong password for `verify-temp@local.test` → confirm the generic error message appears, still on `/admin/login`, no cookie set (check DevTools Application tab).
3. Submit the correct temporary credentials → confirm redirect to `/admin`, sidebar renders with 3 groups + Paramètres, "Vue d'ensemble" is visually active (black pill).
4. Confirm "Vue d'ensemble" shows the real product count, real order count, and up to 5 recent orders (or the empty-state message if there are none).
5. Click every other sidebar link → confirm each renders the shared "Bientôt disponible" card with the correct title, no 404s.
6. Click "Déconnexion" → confirm redirect to `/admin/login`, then re-visit `/admin` → confirm redirect back to `/admin/login` (cookie was actually cleared).
7. Visit `http://localhost:3000/fr` and `http://localhost:3000/en` → confirm the public site still works exactly as before (no i18n middleware regression).

- [ ] **Step 6: Remove the temporary verification account**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.admin.delete({ where: { email: 'verify-temp@local.test' } })
  .then(() => console.log('temp admin removed'))
  .finally(() => prisma.\$disconnect());
"
```

- [ ] **Step 7: Commit any fixups found during the walkthrough**

If Step 5 surfaced issues, fix them and commit. If no issues were found, no commit is needed for this task.
