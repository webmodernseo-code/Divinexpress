# Dashboard Overview & Topbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin dashboard's "Vue d'ensemble" page and add a dashboard topbar so both visually match the user's reference screenshots, using only real data derived from the database — nothing fabricated.

**Architecture:** Pure, unit-testable helpers (`lib/adminStats.ts`, `lib/adminActivity.ts`) compute percent changes, chart buckets, and the merged activity feed from plain data the page fetches via Prisma. A hand-rolled SVG `RevenueChart` component renders that data — no charting library. A new `AdminTopbar` component and a `getCurrentAdmin()` helper (memoized per-request via React's `cache()`) supply the greeting name and logout menu, shared between the dashboard layout and the overview page without double-fetching.

**Tech Stack:** Next.js 14 App Router (Server Components), Prisma, Vitest for the pure-function tests, plain SVG (no charting library) — consistent with the rest of this codebase's hand-rolled icon/graphic conventions.

## Global Constraints

- No new npm dependency in `package.json` `dependencies` — no charting library, no date library.
- Reuse existing CSS tokens (`app/styles/tokens.css`) with literal fallbacks; the new `--dash-*` accent palette is additive, not a replacement of existing tokens.
- No fabricated/mock data anywhere — every number shown is a real query result. Where a feature has no backing data model yet (Retours), the corresponding UI element is omitted, not faked.
- "Aujourd'hui"/"hier" boundaries use the server's local time (`Date` local getters), not UTC — acceptable simplification for a single-admin internal tool.
- Sales/cart-value statistics only aggregate `Order` rows with `currency: 'EUR'` — do not sum across currencies.
- Vitest is configured for `**/*.test.ts` only, plain Node environment, no jsdom/RTL — only pure functions get automated tests; components are verified manually against the dev server.
- Spec: `docs/superpowers/specs/2026-07-21-dashboard-overview-redesign-design.md`

---

### Task 1: Dashboard accent color tokens

**Files:**
- Modify: `app/styles/tokens.css`

**Interfaces:**
- Produces: CSS custom properties `--dash-purple`, `--dash-purple-bg`, `--dash-orange`, `--dash-orange-bg`, `--dash-green`, `--dash-green-bg`, `--dash-blue`, `--dash-blue-bg`, `--dash-red`, `--dash-red-bg` — consumed by Tasks 5, 6, 8.

- [ ] **Step 1: Add the tokens**

In `app/styles/tokens.css`, inside the existing `:root { ... }` block, immediately after the `--color-brand-blue-hover` line, add:

```css
  --dash-purple: #7c3aed;
  --dash-purple-bg: #ede9fe;
  --dash-orange: #f59e0b;
  --dash-orange-bg: #fef3c7;
  --dash-green: #10b981;
  --dash-green-bg: #d1fae5;
  --dash-blue: #3b82f6;
  --dash-blue-bg: #dbeafe;
  --dash-red: #ef4444;
  --dash-red-bg: #fee2e2;
```

- [ ] **Step 2: Typecheck (sanity check only — this is a CSS-only change)**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add app/styles/tokens.css
git commit -m "feat: add colored accent palette tokens for the admin dashboard"
```

---

### Task 2: Admin name field, seed, and env docs

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `Admin.name` (nullable `String`) — consumed by Task 7's `getCurrentAdmin()`.

- [ ] **Step 1: Add the field to the schema**

In `prisma/schema.prisma`, change the `Admin` model from:

```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         String   @default("admin")
  createdAt    DateTime @default(now())
}
```

to:

```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String
  role         String   @default("admin")
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 2: Create and apply the migration**

Run: `npx prisma migrate dev --name add_admin_name`
Expected: a new file appears under `prisma/migrations/`, and the command ends with `Your database is now in sync with your schema.`

- [ ] **Step 3: Update the seed script**

In `prisma/seed.ts`, change:

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

to:

```typescript
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminName = process.env.ADMIN_SEED_NAME;
  if (adminEmail && adminPassword) {
    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: { passwordHash: hashPassword(adminPassword), name: adminName },
      create: { email: adminEmail, passwordHash: hashPassword(adminPassword), name: adminName, role: 'admin' }
    });
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.log('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set — skipping admin account seed.');
  }
```

(`adminName` is `string | undefined`; Prisma treats an `undefined` field as "leave unset" on `create` and "don't touch" on `update`, so omitting `ADMIN_SEED_NAME` is harmless.)

- [ ] **Step 4: Document the new env var**

In `.env.example`, change:

```
# Optional: set these in your local .env (never committed) and run
# `npm run db:seed` to create/update your admin login.
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

to:

```
# Optional: set these in your local .env (never committed) and run
# `npm run db:seed` to create/update your admin login.
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
# Optional: display name shown in the dashboard greeting.
ADMIN_SEED_NAME=
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts .env.example
git add prisma/migrations
git commit -m "feat: add optional name field to Admin for the dashboard greeting"
```

---

### Task 3: Pure stats helpers (`lib/adminStats.ts`)

**Files:**
- Create: `lib/adminStats.ts`
- Test: `lib/adminStats.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export function percentChange(current: number, previous: number): number | null
  export interface DailyBucket { date: string; totalCents: number }
  export function bucketOrdersByDay(
    orders: { createdAt: Date; totalCents: number }[],
    days: number,
    now?: Date
  ): DailyBucket[]
  export function dayRange(daysAgo: number, now?: Date): { start: Date; end: Date }
  ```
  Consumed by Task 8's `page.tsx`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/adminStats.test.ts
import { describe, it, expect } from 'vitest';
import { percentChange, bucketOrdersByDay, dayRange } from './adminStats';

describe('percentChange', () => {
  it('computes a positive percent change', () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it('computes a negative percent change', () => {
    expect(percentChange(50, 100)).toBe(-50);
  });

  it('returns null when the previous value is zero', () => {
    expect(percentChange(100, 0)).toBeNull();
  });

  it('returns null when the previous value is negative', () => {
    expect(percentChange(100, -10)).toBeNull();
  });
});

describe('dayRange', () => {
  const now = new Date(2026, 6, 21, 15, 30, 0); // 21 July 2026, 15:30 local

  it("returns today's local midnight-to-midnight range for daysAgo=0", () => {
    const { start, end } = dayRange(0, now);
    expect(start).toEqual(new Date(2026, 6, 21, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 22, 0, 0, 0));
  });

  it("returns yesterday's range for daysAgo=1", () => {
    const { start, end } = dayRange(1, now);
    expect(start).toEqual(new Date(2026, 6, 20, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 21, 0, 0, 0));
  });
});

describe('bucketOrdersByDay', () => {
  const now = new Date(2026, 6, 21, 12, 0, 0);

  it('places orders into the correct daily bucket', () => {
    const orders = [
      { createdAt: new Date(2026, 6, 21, 9, 0, 0), totalCents: 1000 },
      { createdAt: new Date(2026, 6, 21, 18, 0, 0), totalCents: 500 },
      { createdAt: new Date(2026, 6, 20, 10, 0, 0), totalCents: 2000 }
    ];
    const buckets = bucketOrdersByDay(orders, 3, now);
    expect(buckets).toHaveLength(3);
    expect(buckets[2].totalCents).toBe(1500); // today (21st): 1000 + 500
    expect(buckets[1].totalCents).toBe(2000); // yesterday (20th)
    expect(buckets[0].totalCents).toBe(0); // day before (19th), no orders
  });

  it('ignores orders outside the bucket range', () => {
    const orders = [{ createdAt: new Date(2026, 5, 1, 0, 0, 0), totalCents: 9999 }];
    const buckets = bucketOrdersByDay(orders, 3, now);
    const total = buckets.reduce((sum, b) => sum + b.totalCents, 0);
    expect(total).toBe(0);
  });

  it('returns buckets in chronological order with correct date keys', () => {
    const buckets = bucketOrdersByDay([], 3, now);
    expect(buckets.map((b) => b.date)).toEqual(['2026-07-19', '2026-07-20', '2026-07-21']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/adminStats.test.ts`
Expected: FAIL with "Cannot find module './adminStats'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/adminStats.ts
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface DailyBucket {
  date: string;
  totalCents: number;
}

function localDayKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dayRange(daysAgo: number, now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function bucketOrdersByDay(
  orders: { createdAt: Date; totalCents: number }[],
  days: number,
  now: Date = new Date()
): DailyBucket[] {
  const buckets: DailyBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({ date: localDayKey(d), totalCents: 0 });
  }
  const indexByKey = new Map(buckets.map((b, i) => [b.date, i]));
  for (const order of orders) {
    const index = indexByKey.get(localDayKey(order.createdAt));
    if (index !== undefined) {
      buckets[index].totalCents += order.totalCents;
    }
  }
  return buckets;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/adminStats.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/adminStats.ts lib/adminStats.test.ts
git commit -m "feat: add pure stats helpers for dashboard percent-change and daily chart buckets"
```

---

### Task 4: Pure activity feed helpers (`lib/adminActivity.ts`)

**Files:**
- Create: `lib/adminActivity.ts`
- Test: `lib/adminActivity.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ActivityItem {
    id: string;
    type: 'order' | 'product';
    label: string;
    createdAt: Date;
    amountCents?: number;
  }
  export function buildActivityFeed(
    recentOrders: { id: string; orderNumber: string; totalCents: number; createdAt: Date }[],
    recentProducts: { id: string; nameFr: string; createdAt: Date }[],
    limit: number
  ): ActivityItem[]
  export function formatRelativeTime(date: Date, now?: Date): string
  ```
  Consumed by Task 8's `page.tsx`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/adminActivity.test.ts
import { describe, it, expect } from 'vitest';
import { buildActivityFeed, formatRelativeTime } from './adminActivity';

describe('buildActivityFeed', () => {
  it('merges and sorts orders and products by most recent first', () => {
    const orders = [{ id: 'o1', orderNumber: '#1001', totalCents: 5000, createdAt: new Date(2026, 6, 20, 10, 0, 0) }];
    const products = [{ id: 'p1', nameFr: 'Veste', createdAt: new Date(2026, 6, 21, 9, 0, 0) }];
    const feed = buildActivityFeed(orders, products, 5);
    expect(feed.map((item) => item.id)).toEqual(['p1', 'o1']);
  });

  it('respects the limit', () => {
    const orders = Array.from({ length: 5 }, (_, i) => ({
      id: `o${i}`,
      orderNumber: `#${i}`,
      totalCents: 100,
      createdAt: new Date(2026, 6, 21, i, 0, 0)
    }));
    const feed = buildActivityFeed(orders, [], 3);
    expect(feed).toHaveLength(3);
  });

  it('includes amountCents for orders but not for products', () => {
    const orders = [{ id: 'o1', orderNumber: '#1001', totalCents: 5000, createdAt: new Date(2026, 6, 20) }];
    const products = [{ id: 'p1', nameFr: 'Veste', createdAt: new Date(2026, 6, 19) }];
    const feed = buildActivityFeed(orders, products, 5);
    expect(feed.find((i) => i.id === 'o1')?.amountCents).toBe(5000);
    expect(feed.find((i) => i.id === 'p1')?.amountCents).toBeUndefined();
  });
});

describe('formatRelativeTime', () => {
  const now = new Date(2026, 6, 21, 12, 0, 0);

  it('formats less than a minute as "à l\'instant"', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 59, 30), now)).toBe("à l'instant");
  });

  it('formats minutes (singular)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 59, 0), now)).toBe('il y a 1 minute');
  });

  it('formats minutes (plural)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 45, 0), now)).toBe('il y a 15 minutes');
  });

  it('formats hours (singular)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 0, 0), now)).toBe('il y a 1 heure');
  });

  it('formats hours (plural)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 8, 0, 0), now)).toBe('il y a 4 heures');
  });

  it('formats days (singular)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 20, 12, 0, 0), now)).toBe('il y a 1 jour');
  });

  it('formats days (plural)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 18, 12, 0, 0), now)).toBe('il y a 3 jours');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/adminActivity.test.ts`
Expected: FAIL with "Cannot find module './adminActivity'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/adminActivity.ts
export interface ActivityItem {
  id: string;
  type: 'order' | 'product';
  label: string;
  createdAt: Date;
  amountCents?: number;
}

export function buildActivityFeed(
  recentOrders: { id: string; orderNumber: string; totalCents: number; createdAt: Date }[],
  recentProducts: { id: string; nameFr: string; createdAt: Date }[],
  limit: number
): ActivityItem[] {
  const orderItems: ActivityItem[] = recentOrders.map((o) => ({
    id: o.id,
    type: 'order',
    label: `Nouvelle commande ${o.orderNumber}`,
    createdAt: o.createdAt,
    amountCents: o.totalCents
  }));
  const productItems: ActivityItem[] = recentProducts.map((p) => ({
    id: p.id,
    type: 'product',
    label: `Produit ajouté : ${p.nameFr}`,
    createdAt: p.createdAt
  }));
  return [...orderItems, ...productItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/adminActivity.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/adminActivity.ts lib/adminActivity.test.ts
git commit -m "feat: add pure activity-feed and relative-time helpers"
```

---

### Task 5: `RevenueChart` component

**Files:**
- Create: `components/Admin/RevenueChart.tsx`
- Create: `components/Admin/RevenueChart.module.css`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure presentational component; its `data` prop shape matches Task 3's `DailyBucket[]`).
- Produces:
  ```typescript
  export interface RevenueChartPoint { date: string; totalCents: number }
  export function RevenueChart(props: { data: RevenueChartPoint[] }): JSX.Element
  ```
  Consumed by Task 8's `page.tsx`. Caller must always pass a non-empty `data` array (Task 3's `bucketOrdersByDay` guarantees this).

- [ ] **Step 1: Create the component**

```tsx
// components/Admin/RevenueChart.tsx
import styles from './RevenueChart.module.css';

export interface RevenueChartPoint {
  date: string;
  totalCents: number;
}

const MONTH_NAMES = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function formatDateLabel(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${Number(day)} ${MONTH_NAMES[Number(month) - 1]}`;
}

export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  const width = 640;
  const height = 220;
  const paddingLeft = 8;
  const paddingTop = 16;
  const paddingBottom = 8;
  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((d) => d.totalCents), 100);
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  function xFor(index: number) {
    return paddingLeft + index * stepX;
  }
  function yFor(value: number) {
    return paddingTop + chartHeight - (value / maxValue) * chartHeight;
  }

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(d.totalCents)}`).join(' ');
  const baseline = paddingTop + chartHeight;
  const areaPoints = `${xFor(0)},${baseline} ${linePoints} ${xFor(data.length - 1)},${baseline}`;

  const labelStep = Math.max(1, Math.round(data.length / 7));
  const labeledPoints = data.filter((_, i) => i % labelStep === 0);

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dash-purple)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--dash-purple)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#revenueGradient)" stroke="none" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--dash-purple)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1].totalCents)} r="4" fill="var(--dash-purple)" />
      </svg>
      <div className={styles.xLabels}>
        {labeledPoints.map((d) => (
          <span key={d.date} className={styles.xLabel}>
            {formatDateLabel(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

```css
/* components/Admin/RevenueChart.module.css */
.wrapper {
  width: 100%;
}

.svg {
  width: 100%;
  height: 220px;
  display: block;
}

.xLabels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.xLabel {
  font-family: var(--font-sans);
  font-size: 11px;
  color: #9ca3af;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (component isn't consumed anywhere yet — must compile standalone)

- [ ] **Step 4: Commit**

```bash
git add components/Admin/RevenueChart.tsx components/Admin/RevenueChart.module.css
git commit -m "feat: add hand-rolled SVG RevenueChart component"
```

---

### Task 6: `AdminTopbar` component

**Files:**
- Create: `components/Admin/AdminTopbar.tsx`
- Create: `components/Admin/AdminTopbar.module.css`

**Interfaces:**
- Produces:
  ```typescript
  export function AdminTopbar(props: { name: string | null; email: string }): JSX.Element
  ```
  Consumed by Task 7's dashboard layout. Posts to the existing `POST /admin/logout` route (Task 3 of the foundation plan) — do not recreate that route.

- [ ] **Step 1: Create the component**

```tsx
// components/Admin/AdminTopbar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AdminTopbar.module.css';

export function AdminTopbar({ name, email }: { name: string | null; email: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = name ?? email;
  const initials = (name ? name.slice(0, 2) : email.split('@')[0].slice(0, 2)).toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  return (
    <header className={styles.topbar}>
      <div className={styles.search}>
        <svg
          className={styles.searchIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input type="text" placeholder="Rechercher..." className={styles.searchInput} readOnly />
        <span className={styles.searchKbd}>⌘K</span>
      </div>

      <div className={styles.right}>
        <span className={styles.statusPill}>
          <span className={styles.statusDot} />
          Boutique en ligne
        </span>

        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className={styles.profileWrapper} ref={menuRef}>
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.profileName}>{displayName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.profileMenu}>
              <form action="/admin/logout" method="POST">
                <button type="submit" className={styles.logoutItem}>
                  Déconnexion
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create the styles**

```css
/* components/Admin/AdminTopbar.module.css */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6, 24px);
  padding: var(--space-4, 16px) var(--space-8, 32px);
  background: var(--color-white, #ffffff);
  border-bottom: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 420px;
  background: var(--color-cream, #f6f1e9);
  border-radius: var(--radius-full, 999px);
  padding: 8px 14px;
}

.searchIcon {
  color: #9ca3af;
  flex-shrink: 0;
}

.searchInput {
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-sans);
  font-size: 14px;
  flex: 1;
  color: var(--color-black, #0c0407);
}

.searchInput::placeholder {
  color: #9ca3af;
}

.searchKbd {
  font-family: var(--font-sans);
  font-size: 11px;
  color: #9ca3af;
  border: 1px solid rgba(12, 4, 7, 0.12);
  border-radius: 4px;
  padding: 1px 6px;
}

.right {
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
}

.statusPill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--dash-green, #10b981);
  background: var(--dash-green-bg, #d1fae5);
  border-radius: var(--radius-full, 999px);
  padding: 6px 12px;
  white-space: nowrap;
}

.statusDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dash-green, #10b981);
}

.iconButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-black, #0c0407);
  cursor: pointer;
  transition: background var(--duration-fast, 150ms) var(--ease-standard, ease);
}

.iconButton:hover {
  background: var(--color-cream, #f6f1e9);
}

.profileWrapper {
  position: relative;
}

.profileButton {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  color: var(--color-black, #0c0407);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-black, #0c0407);
  color: var(--color-white, #ffffff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
}

.profileName {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
}

.profileMenu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--color-white, #ffffff);
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.08));
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-popover, 0 8px 40px rgba(12, 4, 7, 0.14));
  padding: 6px;
  z-index: 1000;
}

.logoutItem {
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  border-radius: var(--radius-sm, 8px);
  border: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black, #0c0407);
  cursor: pointer;
}

.logoutItem:hover {
  background: var(--color-cream, #f6f1e9);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/Admin/AdminTopbar.tsx components/Admin/AdminTopbar.module.css
git commit -m "feat: add AdminTopbar with decorative search, status pill, and profile menu"
```

---

### Task 7: `getCurrentAdmin()` helper and dashboard layout wiring

**Files:**
- Create: `lib/currentAdmin.ts`
- Modify: `app/admin/(dashboard)/layout.tsx`
- Modify: `app/admin/(dashboard)/layout.module.css`

**Interfaces:**
- Consumes: `verifySessionToken` from `@/lib/adminSession` (existing); `prisma` from `@/lib/prisma` (existing); `AdminTopbar` from `@/components/Admin/AdminTopbar` (Task 6).
- Produces:
  ```typescript
  export const getCurrentAdmin: () => Promise<{ name: string | null; email: string } | null>
  ```
  Consumed by Task 8's `page.tsx` (memoized per-request via React's `cache()`, so calling it in both the layout and the page performs only one DB query).

- [ ] **Step 1: Create the helper**

```typescript
// lib/currentAdmin.ts
import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/adminSession';

export const getCurrentAdmin = cache(async (): Promise<{ name: string | null; email: string } | null> => {
  const sessionCookie = cookies().get('admin_session')?.value;
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const session = sessionCookie ? await verifySessionToken(sessionCookie, secret) : null;
  if (!session) return null;
  return prisma.admin.findUnique({ where: { id: session.adminId }, select: { name: true, email: true } });
});
```

- [ ] **Step 2: Wire it into the dashboard layout**

Replace the full contents of `app/admin/(dashboard)/layout.tsx`:

```tsx
// app/admin/(dashboard)/layout.tsx
import { getCurrentAdmin } from '@/lib/currentAdmin';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { AdminTopbar } from '@/components/Admin/AdminTopbar';
import styles from './layout.module.css';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminTopbar name={admin?.name ?? null} email={admin?.email ?? ''} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update the layout styles for the new topbar + content column**

Replace the full contents of `app/admin/(dashboard)/layout.module.css`:

```css
/* app/admin/(dashboard)/layout.module.css */
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-cream, #f6f1e9);
  font-family: var(--font-sans);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content {
  flex: 1;
  padding: var(--space-8, 32px);
  max-width: 100%;
  overflow-x: hidden;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Manual verification**

With `npm run dev` running and logged in with a real admin account (see the foundation plan's Task 8 for how to seed one), visit `http://localhost:3000/admin`: confirm the topbar renders above the content with the search bar, "Boutique en ligne" pill, notification bell, and a profile button showing your admin's initials/name. Click the profile button: confirm a dropdown with "Déconnexion" appears and clicking it logs you out (redirects to `/admin/login`, and revisiting `/admin` redirects back to login).

- [ ] **Step 6: Commit**

```bash
git add lib/currentAdmin.ts "app/admin/(dashboard)/layout.tsx" "app/admin/(dashboard)/layout.module.css"
git commit -m "feat: add getCurrentAdmin helper and wire AdminTopbar into the dashboard layout"
```

---

### Task 8: Rewrite "Vue d'ensemble"

**Files:**
- Modify: `app/admin/(dashboard)/page.tsx` (full rewrite)
- Modify: `app/admin/(dashboard)/page.module.css` (full rewrite)

**Interfaces:**
- Consumes: `getCurrentAdmin` (Task 7); `percentChange`, `bucketOrdersByDay`, `dayRange` (Task 3); `buildActivityFeed`, `formatRelativeTime` (Task 4); `RevenueChart` (Task 5); `prisma` (existing).

**Deliberate spec deviation:** the spec's §5 describes the activity feed's order half as its own `take: 3` query. This task instead reuses the single `take: 5` `recentOrders` query (already needed for the "Commandes récentes" table) as the input to `buildActivityFeed` too, rather than firing a second, redundant `take: 3` order query. This is strictly more correct (guarantees the top-5 merged-feed invariant holds even if 4+ of the 5 most recent activities are orders, which a `take: 3` order query could miss) and avoids a duplicate DB round-trip. `recentProducts` still uses `take: 3` exactly as specified, since only one product feed size was ever needed.

- [ ] **Step 1: Rewrite the page**

Replace the full contents of `app/admin/(dashboard)/page.tsx`:

```tsx
// app/admin/(dashboard)/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/currentAdmin';
import { percentChange, bucketOrdersByDay, dayRange } from '@/lib/adminStats';
import { buildActivityFeed, formatRelativeTime } from '@/lib/adminActivity';
import { RevenueChart } from '@/components/Admin/RevenueChart';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

const CHART_DAYS = 14;

function formatEUR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const today = dayRange(0);
  const yesterday = dayRange(1);
  const chartStart = dayRange(CHART_DAYS - 1).start;
  const last30DaysStart = dayRange(29).start;

  const [
    admin,
    todayOrders,
    yesterdayOrders,
    last30DaysOrders,
    pendingCount,
    last14DaysOrders,
    lowStockVariants,
    recentOrders,
    recentProducts
  ] = await Promise.all([
    getCurrentAdmin(),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: today.start, lt: today.end } },
      select: { totalCents: true }
    }),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: yesterday.start, lt: yesterday.end } },
      select: { totalCents: true }
    }),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: last30DaysStart } },
      select: { totalCents: true }
    }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: chartStart } },
      select: { totalCents: true, createdAt: true }
    }),
    prisma.productVariant.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: 'asc' },
      take: 5,
      include: { product: true }
    }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })
  ]);

  const salesTodayCents = todayOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const salesYesterdayCents = yesterdayOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const salesChange = percentChange(salesTodayCents, salesYesterdayCents);

  const avgCartCents =
    last30DaysOrders.length > 0
      ? Math.round(last30DaysOrders.reduce((sum, o) => sum + o.totalCents, 0) / last30DaysOrders.length)
      : null;

  const chartData = bucketOrdersByDay(last14DaysOrders, CHART_DAYS);
  const chartTotalCents = chartData.reduce((sum, b) => sum + b.totalCents, 0);

  const activityFeed = buildActivityFeed(
    recentOrders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, totalCents: o.totalCents, createdAt: o.createdAt })),
    recentProducts.map((p) => ({ id: p.id, nameFr: p.nameFr, createdAt: p.createdAt })),
    5
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bonjour {admin?.name ?? 'DivinExpress'} 👋</h1>
          <p className={styles.subtitle}>Voici ce qui se passe avec votre boutique aujourd&rsquo;hui.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/produits" className={styles.secondaryButton}>
            Voir les produits
          </Link>
          <Link href="/admin/produits" className={styles.primaryButton}>
            Ajouter un produit
          </Link>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link href="/admin/produits" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Ajouter des produits</span>
            <span className={styles.quickDesc}>Créez vos fiches produit et gérez votre stock.</span>
          </span>
        </Link>
        <Link href="/admin/reductions" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconOrange}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4a2 2 0 0 1 1.4-.4H19a2 2 0 0 1 2 2v6.8a2 2 0 0 1-.4 1.4zM15 8h.01" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Créer une réduction</span>
            <span className={styles.quickDesc}>Lancez un code promo pour vos clients.</span>
          </span>
        </Link>
        <Link href="/admin/commandes" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Traiter les commandes</span>
            <span className={styles.quickDesc}>Expédiez et suivez les commandes en cours.</span>
          </span>
        </Link>
        <Link href="/admin/blog" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Publier un article</span>
            <span className={styles.quickDesc}>Rédigez du contenu pour le blog DivinExpress.</span>
          </span>
        </Link>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconPurple}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span className={styles.statLabel}>Ventes aujourd&rsquo;hui</span>
          <span className={styles.statValue}>{formatEUR(salesTodayCents)}</span>
          <span className={styles.statMeta}>
            {salesChange === null ? '—' : `${salesChange >= 0 ? '↗' : '↘'} ${Math.abs(salesChange).toFixed(1)}%`} vs hier
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconOrange}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4a2 2 0 0 1 1.4-.4H19a2 2 0 0 1 2 2v6.8a2 2 0 0 1-.4 1.4zM15 8h.01" />
            </svg>
          </span>
          <span className={styles.statLabel}>Commandes à traiter</span>
          <span className={styles.statValue}>{pendingCount}</span>
          <span className={styles.statMeta}>À expédier</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <span className={styles.statLabel}>Panier moyen</span>
          <span className={styles.statValue}>{avgCartCents === null ? '—' : formatEUR(avgCartCents)}</span>
          <span className={styles.statMeta}>30 derniers jours</span>
        </div>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Chiffre d&rsquo;affaires</h2>
            <div className={styles.chartPeriods}>
              <span className={`${styles.periodPill} ${styles.periodActive}`}>14 jours</span>
              <span className={styles.periodPill}>3 mois</span>
              <span className={styles.periodPill}>12 mois</span>
            </div>
          </div>
          <div className={styles.chartTotal}>
            <span className={styles.chartTotalValue}>{formatEUR(chartTotalCents)}</span>
            <span className={styles.chartTotalLabel}>sur les 14 derniers jours</span>
          </div>
          <RevenueChart data={chartData} />
        </div>

        <div className={styles.sidePanels}>
          <div className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Stock faible</h2>
            {lowStockVariants.length === 0 ? (
              <p className={styles.empty}>Aucune variante en stock faible.</p>
            ) : (
              <ul className={styles.stockList}>
                {lowStockVariants.map((variant) => (
                  <li key={variant.id} className={styles.stockItem}>
                    <span className={styles.stockName}>
                      {variant.product.nameFr}
                      <span className={styles.stockMeta}>
                        {variant.size} · {variant.color}
                      </span>
                    </span>
                    <span className={styles.stockBadge}>
                      {variant.stock} restant{variant.stock > 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Activité récente</h2>
            {activityFeed.length === 0 ? (
              <p className={styles.empty}>Aucune activité récente.</p>
            ) : (
              <ul className={styles.activityList}>
                {activityFeed.map((item) => (
                  <li key={item.id} className={styles.activityItem}>
                    <span className={styles.activityLabel}>{item.label}</span>
                    <span className={styles.activityTime}>{formatRelativeTime(item.createdAt)}</span>
                    {item.amountCents !== undefined && (
                      <span className={styles.activityAmount}>{formatEUR(item.amountCents)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
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

- [ ] **Step 2: Rewrite the styles**

Replace the full contents of `app/admin/(dashboard)/page.module.css`:

```css
/* app/admin/(dashboard)/page.module.css */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4, 16px);
  margin-bottom: var(--space-6, 24px);
  flex-wrap: wrap;
}

.title {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0;
}

.subtitle {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0;
}

.headerActions {
  display: flex;
  gap: 10px;
}

.secondaryButton,
.primaryButton {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--radius-full, 999px);
  padding: 10px 18px;
  text-decoration: none;
  white-space: nowrap;
}

.secondaryButton {
  color: var(--color-black, #0c0407);
  border: var(--border-hairline, 1px solid rgba(12, 4, 7, 0.12));
}

.primaryButton {
  color: var(--color-white, #ffffff);
  background: var(--color-black, #0c0407);
}

.quickActions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4, 16px);
  margin-bottom: var(--space-6, 24px);
}

.quickAction {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-5, 20px);
  text-decoration: none;
  transition: box-shadow var(--duration-fast, 150ms) var(--ease-standard, ease);
}

.quickAction:hover {
  box-shadow: var(--shadow-card-hover, 0 12px 32px rgba(12, 4, 7, 0.1));
}

.quickIcon,
.statIcon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.iconPurple {
  background: var(--dash-purple-bg);
  color: var(--dash-purple);
}

.iconOrange {
  background: var(--dash-orange-bg);
  color: var(--dash-orange);
}

.iconGreen {
  background: var(--dash-green-bg);
  color: var(--dash-green);
}

.iconBlue {
  background: var(--dash-blue-bg);
  color: var(--dash-blue);
}

.quickText {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quickTitle {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
}

.quickDesc {
  font-family: var(--font-sans);
  font-size: 13px;
  color: #6b7280;
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
  font-size: 28px;
  font-weight: 800;
  color: var(--color-black, #0c0407);
}

.statMeta {
  font-family: var(--font-sans);
  font-size: 12px;
  color: #6b7280;
}

.chartRow {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4, 16px);
  margin-bottom: var(--space-6, 24px);
  align-items: start;
}

.chartCard,
.panelCard,
.tableCard {
  background: var(--color-white, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-card, 0 4px 24px rgba(12, 4, 7, 0.06));
  padding: var(--space-6, 24px);
}

.chartHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4, 16px);
}

.chartTitle,
.panelTitle,
.tableTitle {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black, #0c0407);
  margin: 0 0 var(--space-4, 16px);
}

.chartHeader .chartTitle {
  margin: 0;
}

.chartPeriods {
  display: flex;
  gap: 6px;
}

.periodPill {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: var(--radius-full, 999px);
}

.periodActive {
  background: var(--color-black, #0c0407);
  color: var(--color-white, #ffffff);
}

.chartTotal {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: var(--space-4, 16px);
}

.chartTotalValue {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 800;
  color: var(--color-black, #0c0407);
}

.chartTotalLabel {
  font-family: var(--font-sans);
  font-size: 13px;
  color: #6b7280;
}

.sidePanels {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.stockList,
.activityList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.stockItem,
.activityItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 13px;
}

.stockName {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--color-black, #0c0407);
  font-weight: 600;
}

.stockMeta {
  font-weight: 400;
  color: #6b7280;
  font-size: 12px;
}

.stockBadge {
  font-weight: 700;
  color: var(--dash-orange, #f59e0b);
  background: var(--dash-orange-bg, #fef3c7);
  border-radius: var(--radius-full, 999px);
  padding: 4px 10px;
  white-space: nowrap;
}

.activityLabel {
  flex: 1;
  color: var(--color-black, #0c0407);
}

.activityTime {
  color: #6b7280;
  white-space: nowrap;
}

.activityAmount {
  font-weight: 700;
  color: var(--color-black, #0c0407);
  white-space: nowrap;
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

@media (max-width: 1100px) {
  .quickActions {
    grid-template-columns: repeat(2, 1fr);
  }

  .chartRow {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Manual verification**

With `npm run dev` running and logged in with a real admin account, visit `http://localhost:3000/admin`:
- Confirm the greeting shows the real admin name, 4 quick-action cards with colored icons link to their respective sections (even if those are still stub pages).
- Confirm the 3 stat cards show real values: "Ventes aujourd'hui" and "Panier moyen" show "—" if there's no order history yet (not `NaN`/`Infinity`/blank), "Commandes à traiter" shows a real count.
- Confirm the chart renders 14 points without a JS error even with all-zero data (a flat line at the bottom is correct), and clicking "3 mois"/"12 mois" does nothing but doesn't crash.
- Confirm "Stock faible" lists real product variants with stock < 10, sorted ascending (compare against a direct query if unsure).
- Confirm "Activité récente" shows a real, timestamp-sorted mix of recent orders/products, or the empty-state message if there's truly nothing yet.
- Confirm "Commandes récentes" still works as before.
- Confirm there is no "Retours en cours" card anywhere on the page.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(dashboard)/page.tsx" "app/admin/(dashboard)/page.module.css"
git commit -m "feat: rebuild Vue d'ensemble with quick actions, real stats, chart, and activity panels"
```

---

### Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the new `adminStats` (9) and `adminActivity` (10) tests

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 3: Confirm no dependency changes**

Run: `git diff --stat <first-commit-of-this-plan> HEAD -- package.json package-lock.json`
Expected: no output

- [ ] **Step 4: Full manual walkthrough against the spec's acceptance criteria**

Using the real admin account, re-verify each of the 10 acceptance criteria in `docs/superpowers/specs/2026-07-21-dashboard-overview-redesign-design.md`, side-by-side with the user's original reference screenshots. Pay particular attention to:
- The colored accent palette (violet/orange/green/blue) actually renders as intended, not the site's usual black/white.
- No console errors on `/admin`.
- The migration didn't affect the existing seeded admin account's password (log in still works with the same credentials as before).

- [ ] **Step 5: Commit any fixups found during the walkthrough**

If Step 4 surfaced issues, fix them and commit. If no issues were found, no commit is needed for this task.
