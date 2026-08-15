# Promo Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin create/activate a promo code from the dashboard; the active code appears on the storefront and actually reduces the order total at checkout; deactivating a code removes it from the site and stops it working at checkout.

**Architecture:** A new `promo_codes` table + `PromoCodeRepository` (mirrors `CatalogRepository`'s shape). `OrderService.createOrder` resolves a client-supplied *code string* to a discount server-side (never trusts a client-supplied discount amount — matches how `discountMinor` is already always `0` from the client today). Admin CRUD follows the lightweight `retours` page/route pattern. Storefront banner is server-fetched and renders nothing when no code is active.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod, SQLite (via the project's `Database` abstraction — same one used in-memory for tests and against Postgres/SQLite in the real environment), Vitest, next-intl.

**Spec:** `docs/superpowers/specs/2026-08-15-promo-codes-design.md`

## Global Constraints

- Client never sends a discount amount — only a promo *code* string. The server always recomputes the discount from the DB. (Spec: "Checkout integration — security note".)
- Exactly one active code at a time, enforced by a partial unique index, not just application logic.
- Fields: `code`, `discount_type` (`percentage`|`fixed`), `discount_value`, `active`. No expiry, no minimum purchase, no description field.
- `discount_value` for `fixed` type is raw minor-currency units applied as-is to the order's own currency — no cross-currency conversion (same simplification already used for `shippingMinor`/`taxMinor` on `CreateOrderInput`).
- No countdown timer in the redesigned banner — it was fictional (no expiry data exists).
- Banner: dark theme (`bg-ink`/`text-paper`) with a background image + overlay, reusing `/image/hero_3.png` (freed up when the old editorial section was replaced by the Nouveautés carousel; unused elsewhere in `src/`).
- Vitest on this workstation needs `--no-file-parallelism` per targeted file (OneDrive path quirk) — every test-run step below uses that flag. Run `rm -rf .next` before `npm run typecheck` if a stale build cache causes false type errors.

---

### Task 1: `promo_codes` table + migration test + dev seed

**Files:**
- Create: `src/server/db/migrations/0005_promo_codes.sql`
- Create: `src/server/db/migration-0005.test.ts`
- Modify: `src/server/db/migrate.ts:8`
- Modify: `src/server/db/seed.ts`

**Interfaces:**
- Produces: table `promo_codes(id, code, discount_type, discount_value, active, created_at, updated_at)`, unique index `idx_promo_codes_one_active` (partial, `WHERE active = 1`). Later tasks read/write this table only through `PromoCodeRepository` (Task 2) or, inside `OrderService`, via a direct `SELECT` on `code`/`active` (Task 3).

- [ ] **Step 1: Write the failing migration test**

Create `src/server/db/migration-0005.test.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from './client';
import { migrateDatabase } from './migrate';

describe('migration 0005 — promo_codes', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('creates the promo_codes table with the expected columns', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);

    const columns = (await db.prepare("SELECT name FROM pragma_table_info('promo_codes')")
      .all()) as Array<{ name: string }>;
    expect(columns.map((c) => c.name)).toEqual(
      expect.arrayContaining(['id', 'code', 'discount_type', 'discount_value', 'active', 'created_at', 'updated_at']),
    );
  });

  it('allows only one active code at a time', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);

    await db.prepare(`INSERT INTO promo_codes (id, code, discount_type, discount_value, active)
      VALUES ('promo-1', 'FIRST10', 'percentage', 10, 1)`).run();

    await expect(
      db.prepare(`INSERT INTO promo_codes (id, code, discount_type, discount_value, active)
        VALUES ('promo-2', 'SECOND10', 'percentage', 10, 1)`).run(),
    ).rejects.toThrow();
  });

  it('rejects a percentage discount value over 100', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);

    await expect(
      db.prepare(`INSERT INTO promo_codes (id, code, discount_type, discount_value, active)
        VALUES ('promo-3', 'TOOBIG', 'percentage', 150, 0)`).run(),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/db/migration-0005.test.ts --no-file-parallelism`
Expected: FAIL — migration `'0005_promo_codes'` isn't registered / file doesn't exist yet, so the table is never created and the first assertion fails.

- [ ] **Step 3: Write the migration SQL**

Create `src/server/db/migrations/0005_promo_codes.sql`:

```sql
CREATE TABLE promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100) OR
    (discount_type = 'fixed' AND discount_value > 0)
  )
) STRICT;

-- At most one active code at a time, enforced at the DB level.
CREATE UNIQUE INDEX idx_promo_codes_one_active ON promo_codes(active) WHERE active = 1;
```

- [ ] **Step 4: Register the migration**

Modify `src/server/db/migrate.ts:8`:

```ts
const MIGRATIONS = ['0001_initial', '0002_conversations', '0003_compare_at_price', '0004_product_brand', '0005_promo_codes'] as const;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/server/db/migration-0005.test.ts --no-file-parallelism`
Expected: PASS (all 3 tests)

- [ ] **Step 6: Seed a dev promo code**

Modify `src/server/db/seed.ts` — add, inside the existing `BEGIN IMMEDIATE`/`COMMIT` block (alongside the other `INSERT OR IGNORE` calls), a single active dev code so the storefront/admin have something to look at locally:

```ts
    await database.prepare(`INSERT OR IGNORE INTO promo_codes (id, code, discount_type, discount_value, active)
      VALUES ('promo:seed-1', 'DIVINEXPRESS10', 'percentage', 10, 1)`).run();
```

(Place it near the other seed inserts, before the closing `await database.exec('COMMIT');` of `seedDevelopmentDatabase`.)

- [ ] **Step 7: Commit**

```bash
git add src/server/db/migrations/0005_promo_codes.sql src/server/db/migration-0005.test.ts src/server/db/migrate.ts src/server/db/seed.ts
git commit -m "feat(db): add promo_codes table with single-active-code constraint"
```

---

### Task 2: `PromoCodeRepository` domain layer

**Files:**
- Create: `src/server/promotions/schemas.ts`
- Create: `src/server/promotions/repository.ts`
- Create: `src/server/promotions/repository.test.ts`

**Interfaces:**
- Consumes: `Database` type from `src/server/db/client.ts`; `DomainError` from `src/server/domain/errors.ts` (Task 3 adds `'INVALID_PROMO_CODE'` to its union — this task only uses the existing `'CONFLICT'`/`'NOT_FOUND'` codes, already present).
- Produces: `PromoCodeRepository` with `list()`, `create(input)`, `setActive(id, active)`, `delete(id)`, `findById(id)`, `findActive()`, `findByCode(code)`, all returning/consuming the `PromoCode` type — used by Task 6 (admin routes), Task 5 (validate route), Task 10 (storefront page).

- [ ] **Step 1: Write the failing repository test**

Create `src/server/promotions/repository.test.ts`:

```ts
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { DomainError } from '../domain/errors';
import { PromoCodeRepository } from './repository';

describe('PromoCodeRepository', () => {
  let database: Database;
  let repository: PromoCodeRepository;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    repository = new PromoCodeRepository(database);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('creates a code and finds it by id and by code (case-insensitive)', async () => {
    const created = await repository.create({ code: 'SUMMER10', discountType: 'percentage', discountValue: 10 });
    expect(created).toMatchObject({ code: 'SUMMER10', discountType: 'percentage', discountValue: 10, active: false });

    expect(await repository.findById(created.id)).toMatchObject({ id: created.id });
    expect(await repository.findByCode('summer10')).toMatchObject({ id: created.id });
  });

  it('rejects a duplicate code', async () => {
    await repository.create({ code: 'SUMMER10', discountType: 'percentage', discountValue: 10 });
    await expect(repository.create({ code: 'summer10', discountType: 'fixed', discountValue: 500 }))
      .rejects.toThrowError(DomainError);
  });

  it('activating a code deactivates any other active code', async () => {
    const first = await repository.create({ code: 'FIRST10', discountType: 'percentage', discountValue: 10 });
    const second = await repository.create({ code: 'SECOND20', discountType: 'percentage', discountValue: 20 });

    await repository.setActive(first.id, true);
    expect((await repository.findById(first.id))?.active).toBe(true);

    await repository.setActive(second.id, true);
    expect((await repository.findById(first.id))?.active).toBe(false);
    expect((await repository.findById(second.id))?.active).toBe(true);
  });

  it('findActive returns the single active code or null', async () => {
    expect(await repository.findActive()).toBeNull();
    const code = await repository.create({ code: 'ACTIVE10', discountType: 'percentage', discountValue: 10 });
    await repository.setActive(code.id, true);
    expect(await repository.findActive()).toMatchObject({ id: code.id, active: true });
  });

  it('deletes a code', async () => {
    const code = await repository.create({ code: 'GONE10', discountType: 'percentage', discountValue: 10 });
    await repository.delete(code.id);
    expect(await repository.findById(code.id)).toBeNull();
  });

  it('lists codes newest first', async () => {
    await repository.create({ code: 'OLD10', discountType: 'percentage', discountValue: 10 });
    await repository.create({ code: 'NEW10', discountType: 'percentage', discountValue: 10 });
    const list = await repository.list();
    expect(list.map((c) => c.code)).toEqual(['NEW10', 'OLD10']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/promotions/repository.test.ts --no-file-parallelism`
Expected: FAIL with "Cannot find module './repository'"

- [ ] **Step 3: Write `schemas.ts`**

Create `src/server/promotions/schemas.ts`:

```ts
import { z } from 'zod';

export const createPromoCodeInputSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().int().positive(),
}).refine(
  (value) => value.discountType !== 'percentage' || value.discountValue <= 100,
  { message: 'Percentage discount must be between 1 and 100', path: ['discountValue'] },
);

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeInputSchema>;
```

- [ ] **Step 4: Write `repository.ts`**

Create `src/server/promotions/repository.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import { DomainError } from '../domain/errors';
import { createPromoCodeInputSchema, type CreatePromoCodeInput } from './schemas';

export type DiscountType = 'percentage' | 'fixed';

export interface PromoCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  active: boolean;
  createdAt: string;
}

interface PromoCodeRow {
  id: string; code: string; discount_type: DiscountType; discount_value: number;
  active: number; created_at: string;
}

function toPromoCode(row: PromoCodeRow): PromoCode {
  return {
    id: row.id, code: row.code, discountType: row.discount_type,
    discountValue: row.discount_value, active: row.active === 1, createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = 'id, code, discount_type, discount_value, active, created_at';

export class PromoCodeRepository {
  constructor(private readonly database: Database) {}

  async list(): Promise<PromoCode[]> {
    const rows = (await this.database.prepare(
      `SELECT ${SELECT_COLUMNS} FROM promo_codes ORDER BY created_at DESC`,
    ).all()) as unknown as PromoCodeRow[];
    return rows.map(toPromoCode);
  }

  async create(rawInput: CreatePromoCodeInput): Promise<PromoCode> {
    const input = createPromoCodeInputSchema.parse(rawInput);
    const id = randomUUID();
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      await this.database.prepare(
        `INSERT INTO promo_codes (id, code, discount_type, discount_value, active) VALUES (?, ?, ?, ?, 0)`,
      ).run(id, input.code, input.discountType, input.discountValue);
      await this.database.exec('COMMIT');
    } catch {
      await this.database.exec('ROLLBACK');
      throw new DomainError('CONFLICT', 'A promo code with this code already exists');
    }
    return (await this.findById(id))!;
  }

  async setActive(id: string, active: boolean): Promise<PromoCode> {
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      if (active) {
        await this.database.prepare(
          `UPDATE promo_codes SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE active = 1`,
        ).run();
      }
      await this.database.prepare(
        `UPDATE promo_codes SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ).run(active ? 1 : 0, id);
      await this.database.exec('COMMIT');
    } catch (error) {
      await this.database.exec('ROLLBACK');
      throw error;
    }
    const updated = await this.findById(id);
    if (!updated) throw new DomainError('NOT_FOUND', 'Promo code not found', 404);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.database.prepare('DELETE FROM promo_codes WHERE id = ?').run(id);
  }

  async findById(id: string): Promise<PromoCode | null> {
    const row = (await this.database.prepare(
      `SELECT ${SELECT_COLUMNS} FROM promo_codes WHERE id = ?`,
    ).get(id)) as PromoCodeRow | undefined;
    return row ? toPromoCode(row) : null;
  }

  async findActive(): Promise<PromoCode | null> {
    const row = (await this.database.prepare(
      `SELECT ${SELECT_COLUMNS} FROM promo_codes WHERE active = 1 LIMIT 1`,
    ).get()) as PromoCodeRow | undefined;
    return row ? toPromoCode(row) : null;
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const row = (await this.database.prepare(
      `SELECT ${SELECT_COLUMNS} FROM promo_codes WHERE code = ? COLLATE NOCASE`,
    ).get(code)) as PromoCodeRow | undefined;
    return row ? toPromoCode(row) : null;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/server/promotions/repository.test.ts --no-file-parallelism`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/server/promotions/
git commit -m "feat(promotions): add PromoCodeRepository (list/create/activate/delete/find)"
```

---

### Task 3: Checkout integration — `OrderService` resolves the discount server-side

**Files:**
- Modify: `src/server/domain/errors.ts:1-11`
- Modify: `src/server/orders/schemas.ts`
- Modify: `src/server/orders/service.ts:61-66,92-98`
- Modify: `src/server/orders/service.test.ts`

**Interfaces:**
- Consumes: `promo_codes` table (Task 1) — queried directly with raw SQL inline in `OrderService`, matching how `OrderService` already queries `product_variants`/`products` directly rather than depending on `CatalogRepository`. Does **not** depend on `PromoCodeRepository`.
- Produces: `CreateOrderInput` now has `promoCode?: string` instead of `discountMinor: number`. `OrderRecord.discountMinor` (unchanged field, now computed instead of trusted) is consumed by Task 4 (checkout route — unchanged), Task 9 (confirmation page).

- [ ] **Step 1: Update the existing test to match the new input shape, and add promo-code tests**

Modify `src/server/orders/service.test.ts` — replace the shared `input` fixture (remove `discountMinor: 1000`) and its first assertion, and add a `beforeEach` promo-code seed plus new test cases. Full replacement of the file:

```ts
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { DomainError } from '../domain/errors';
import { OrderService } from './service';

describe('OrderService', () => {
  let database: Database;
  let service: OrderService;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, 'active')`)
      .run('product-1', 'category:test', 'veste', 'Veste', 'Jacket');
    await database.prepare(`INSERT INTO product_variants
      (id, product_id, sku, size, color, price_minor, currency) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('variant-1', 'product-1', 'VESTE-M', 'M', 'Noir', 10000, 'EUR');
    await database.prepare(`INSERT INTO inventory_movements
      (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`)
      .run('stock-1', 'variant-1', 5);
    service = new OrderService(database, () => new Date('2026-08-04T10:00:00.000Z'));
  });

  afterEach(async () => {
    await closeDatabase();
  });

  const input = {
    idempotencyKey: 'checkout-12345678', currency: 'EUR' as const,
    customer: { email: 'client@example.com', firstName: 'Ada', lastName: 'Lovelace', phone: null },
    shippingAddress: { recipient: 'Ada Lovelace', line1: '1 rue DivinExpress', line2: null, postalCode: '75001', city: 'Paris', region: null, countryCode: 'FR' },
    lines: [{ variantId: 'variant-1', quantity: 2 }],
    shippingMinor: 500, taxMinor: 0,
  };

  it('recalculates totals, snapshots lines, and reserves stock atomically', async () => {
    const order = await service.createOrder(input);
    expect(order).toMatchObject({ subtotalMinor: 20000, totalMinor: 20500, discountMinor: 0, status: 'pending_payment' });
    expect(order.items[0]).toMatchObject({ sku: 'VESTE-M', unitPriceMinor: 10000, quantity: 2, lineTotalMinor: 20000 });
    const stock = (await database.prepare('SELECT SUM(quantity_delta) AS stock FROM inventory_movements WHERE variant_id = ?')
      .get('variant-1')) as { stock: number };
    expect(stock.stock).toBe(3);
  });

  it('returns the original order for the same idempotency key without reserving twice', async () => {
    const first = await service.createOrder(input);
    const second = await service.createOrder(input);
    expect(second.id).toBe(first.id);
    const counts = (await database.prepare('SELECT COUNT(*) AS count FROM orders').get()) as { count: number };
    expect(counts.count).toBe(1);
  });

  it('rejects unavailable stock and mismatched currencies', async () => {
    await expect(service.createOrder({ ...input, lines: [{ variantId: 'variant-1', quantity: 6 }] }))
      .rejects.toThrowError(new DomainError('CONFLICT', 'Insufficient stock'));
    await expect(service.createOrder({ ...input, idempotencyKey: 'checkout-gbp-1234', currency: 'GBP' }))
      .rejects.toThrowError(new DomainError('CURRENCY_MISMATCH', 'Currencies must match'));
  });

  it('enforces the order state machine for dashboard transitions', async () => {
    const order = await service.createOrder(input);

    await expect(service.transition(order.id, 'shipped'))
      .rejects.toThrowError(new DomainError('INVALID_ORDER_TRANSITION', 'Invalid order transition'));

    expect((await service.transition(order.id, 'paid')).status).toBe('paid');
    expect((await service.transition(order.id, 'preparing')).status).toBe('preparing');
  });

  it('returns not found when a dashboard transition targets an unknown order', async () => {
    await expect(service.transition('missing-order', 'cancelled'))
      .rejects.toThrowError(new DomainError('NOT_FOUND', 'Order not found', 404));
  });

  describe('promo codes', () => {
    beforeEach(async () => {
      await database.prepare(`INSERT INTO promo_codes (id, code, discount_type, discount_value, active)
        VALUES ('promo-pct', 'TEN10', 'percentage', 10, 1)`).run();
      await database.prepare(`INSERT INTO promo_codes (id, code, discount_type, discount_value, active)
        VALUES ('promo-fixed', 'FIVEOFF', 'fixed', 500, 0)`).run();
    });

    it('applies a percentage discount, case-insensitively, from subtotal', async () => {
      const order = await service.createOrder({ ...input, promoCode: 'ten10' });
      // subtotal 20000 * 10% = 2000
      expect(order).toMatchObject({ subtotalMinor: 20000, discountMinor: 2000, totalMinor: 18500 });
    });

    it('rejects a promo code that is not active', async () => {
      await expect(service.createOrder({ ...input, idempotencyKey: 'checkout-inactive-1', promoCode: 'FIVEOFF' }))
        .rejects.toThrowError(new DomainError('INVALID_PROMO_CODE', 'Promo code is invalid or no longer active'));
    });

    it('rejects an unknown promo code', async () => {
      await expect(service.createOrder({ ...input, idempotencyKey: 'checkout-unknown-1', promoCode: 'NOPE' }))
        .rejects.toThrowError(new DomainError('INVALID_PROMO_CODE', 'Promo code is invalid or no longer active'));
    });

    it('caps the discount at the subtotal so the total never goes negative', async () => {
      await database.prepare(`UPDATE promo_codes SET discount_value = 999900 WHERE id = 'promo-fixed'`).run();
      await database.prepare(`UPDATE promo_codes SET active = 1 WHERE id = 'promo-fixed'`).run();
      await database.prepare(`UPDATE promo_codes SET active = 0 WHERE id = 'promo-pct'`).run();
      const order = await service.createOrder({ ...input, promoCode: 'FIVEOFF' });
      expect(order.discountMinor).toBe(20000);
      expect(order.totalMinor).toBe(500);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/orders/service.test.ts --no-file-parallelism`
Expected: FAIL — `discountMinor` is still required on `createOrderInputSchema` (TS/zod), and `'INVALID_PROMO_CODE'` isn't a valid `DomainErrorCode` yet.

- [ ] **Step 3: Add the new error code**

Modify `src/server/domain/errors.ts`:

```ts
export type DomainErrorCode =
  | 'CURRENCY_MISMATCH'
  | 'INVALID_MONEY'
  | 'INVALID_QUANTITY'
  | 'INVALID_ORDER_TRANSITION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'PAYMENT_PROVIDER_NOT_CONFIGURED'
  | 'INVALID_PROMO_CODE';
```

- [ ] **Step 4: Replace `discountMinor` with `promoCode` on the input schema**

Modify `src/server/orders/schemas.ts` — replace this line:

```ts
  discountMinor: z.number().int().nonnegative(),
```

with:

```ts
  promoCode: z.string().trim().min(1).optional(),
```

(It's the last field before the closing `});` of `createOrderInputSchema` — `shippingMinor`/`taxMinor` lines above it are unchanged.)

- [ ] **Step 5: Resolve the discount server-side in `OrderService.createOrder`**

Modify `src/server/orders/service.ts` — replace:

```ts
      const subtotalMinor = variants.reduce(
        (total, { line, variant }) => total + variant.price_minor * line.quantity,
        0,
      );
      const totalMinor = subtotalMinor + input.shippingMinor + input.taxMinor - input.discountMinor;
      if (totalMinor < 0) throw new DomainError('CONFLICT', 'Discount exceeds order total');
```

with:

```ts
      const subtotalMinor = variants.reduce(
        (total, { line, variant }) => total + variant.price_minor * line.quantity,
        0,
      );

      let discountMinor = 0;
      if (input.promoCode) {
        const promo = (await this.database.prepare(`SELECT discount_type, discount_value
          FROM promo_codes WHERE code = ? COLLATE NOCASE AND active = 1`)
          .get(input.promoCode)) as { discount_type: 'percentage' | 'fixed'; discount_value: number } | undefined;
        if (!promo) throw new DomainError('INVALID_PROMO_CODE', 'Promo code is invalid or no longer active');
        const rawDiscount = promo.discount_type === 'percentage'
          ? Math.round((subtotalMinor * promo.discount_value) / 100)
          : promo.discount_value;
        discountMinor = Math.min(rawDiscount, subtotalMinor);
      }

      const totalMinor = subtotalMinor + input.shippingMinor + input.taxMinor - discountMinor;
      if (totalMinor < 0) throw new DomainError('CONFLICT', 'Discount exceeds order total');
```

Then, further down, in the `INSERT INTO orders` call, replace `input.discountMinor` (the 4th value in the second `.run(...)` line) with the local `discountMinor`:

```ts
      await this.database.prepare(`INSERT INTO orders
        (id, number, customer_id, idempotency_key, status, currency, subtotal_minor,
         shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(orderId, number, customer.id, input.idempotencyKey, input.currency, subtotalMinor,
          input.shippingMinor, input.taxMinor, discountMinor, totalMinor,
          JSON.stringify(input.shippingAddress), this.now().toISOString(), this.now().toISOString());
```

(Only `input.discountMinor` → `discountMinor` changes on that line — everything else is unchanged.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/server/orders/service.test.ts --no-file-parallelism`
Expected: PASS (9 tests)

- [ ] **Step 7: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors (this will surface any other caller still passing `discountMinor` — there should be none left after Task 4 below, but run it now to catch this file's own change first).

- [ ] **Step 8: Commit**

```bash
git add src/server/domain/errors.ts src/server/orders/schemas.ts src/server/orders/service.ts src/server/orders/service.test.ts
git commit -m "feat(orders): resolve promo code discounts server-side instead of trusting a client discount amount"
```

---

### Task 4: Wire `promoCode` through the checkout API route

**Files:**
- Modify: `src/app/api/checkout/route.ts:11-24,73-88`

**Interfaces:**
- Consumes: `CreateOrderInput` (Task 3, now has `promoCode?: string`, no `discountMinor`).
- Produces: nothing new — `POST /api/checkout` request body gains an optional `promoCode` field, consumed by Task 8's payment page.

- [ ] **Step 1: Add `promoCode` to the request schema**

Modify `src/app/api/checkout/route.ts` — in `requestSchema`, add a field after `items`:

```ts
const requestSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  method: z.enum(['stripe', 'genius']),
  shipping: z.object({
    fullName: z.string().trim().min(1), email: z.email(), address: z.string().trim().min(1),
    city: z.string().optional(), postalCode: z.string().optional(), country: z.string().trim().min(1),
    countryCode: z.string().trim().length(2), phone: z.string().optional(),
    region: z.enum(['europe', 'africa']).optional(),
  }),
  items: z.array(z.object({
    productId: z.string().min(1), size: z.string().min(1), color: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
  promoCode: z.string().trim().min(1).optional(),
});
```

- [ ] **Step 2: Pass it through instead of the hardcoded discount**

Modify the `checkout.start({ ... })` call — replace:

```ts
      lines, shippingMinor: 0, taxMinor: 0, discountMinor: 0,
    });
```

with:

```ts
      lines, shippingMinor: 0, taxMinor: 0, promoCode: input.promoCode,
    });
```

- [ ] **Step 3: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat(checkout): accept an optional promo code on the checkout request"
```

---

### Task 5: Public promo-code validation endpoint

**Files:**
- Create: `src/app/api/promo/validate/route.ts`

**Interfaces:**
- Consumes: `PromoCodeRepository.findByCode` (Task 2).
- Produces: `POST /api/promo/validate` → `{ valid: true, discountType, discountValue }` or `{ valid: false }`. Consumed by Task 8 (payment page "Apply" button). This is a UX convenience only — Task 3's server-side check at order-creation time is the actual authority.

- [ ] **Step 1: Create the route**

Create `src/app/api/promo/validate/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PromoCodeRepository } from '@/server/promotions/repository';
import { getCommerceDatabase } from '@/server/db/runtime';

const requestSchema = z.object({ code: z.string().trim().min(1) });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ valid: false }, { status: 400 });

  const db = await getCommerceDatabase();
  const promo = await new PromoCodeRepository(db).findByCode(parsed.data.code);
  if (!promo || !promo.active) return NextResponse.json({ valid: false });

  return NextResponse.json({
    valid: true,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev` (in the background), then in another shell:

```bash
curl -s -X POST http://localhost:3000/api/promo/validate -H "content-type: application/json" -d '{"code":"DIVINEXPRESS10"}'
```

Expected: `{"valid":true,"discountType":"percentage","discountValue":10}` (relies on the Task 1 dev seed). Then:

```bash
curl -s -X POST http://localhost:3000/api/promo/validate -H "content-type: application/json" -d '{"code":"NOPE"}'
```

Expected: `{"valid":false}`. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/promo/validate/route.ts
git commit -m "feat(promotions): add public promo code validation endpoint"
```

---

### Task 6: Admin API routes for promo codes

**Files:**
- Create: `src/app/api/admin/promo-codes/route.ts`
- Create: `src/app/api/admin/promo-codes/[id]/route.ts`

**Interfaces:**
- Consumes: `PromoCodeRepository` (Task 2), `getCurrentAdmin`/`requireRole` (existing, `src/server/auth/runtime.ts` and `src/server/auth/authorization.ts`).
- Produces: `GET/POST /api/admin/promo-codes`, `PATCH/DELETE /api/admin/promo-codes/[id]` — consumed by Task 7's dashboard page.

- [ ] **Step 1: Create the collection route**

Create `src/app/api/admin/promo-codes/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { PromoCodeRepository } from '@/server/promotions/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const createSchema = z.object({
  code: z.string().trim().min(3).max(40),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().int().positive(),
});

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const db = await getCommerceDatabase();
  return NextResponse.json(await new PromoCodeRepository(db).list());
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const body = createSchema.parse(await request.json());
    const db = await getCommerceDatabase();
    const promo = await new PromoCodeRepository(db).create({
      code: body.code.toUpperCase(),
      discountType: body.discountType,
      discountValue: body.discountValue,
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_PROMO_CODE_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'PROMO_CODE_CREATE_FAILED' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the item route**

Create `src/app/api/admin/promo-codes/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { PromoCodeRepository } from '@/server/promotions/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const patchSchema = z.object({ active: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const db = await getCommerceDatabase();
    const promo = await new PromoCodeRepository(db).setActive(id, body.active);
    return NextResponse.json(promo);
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'PROMO_CODE_UPDATE_FAILED' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const db = await getCommerceDatabase();
    await new PromoCodeRepository(db).delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    return NextResponse.json({ error: 'PROMO_CODE_DELETE_FAILED' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/promo-codes/
git commit -m "feat(admin): add promo code CRUD API routes"
```

---

### Task 7: Admin "Promotions" dashboard page

**Files:**
- Create: `src/app/[locale]/(dashboard)/promotions/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx:6-45`

**Interfaces:**
- Consumes: `GET/POST /api/admin/promo-codes`, `PATCH/DELETE /api/admin/promo-codes/[id]` (Task 6).
- Produces: `/promotions` dashboard route, reachable from the sidebar.

- [ ] **Step 1: Create the page**

Create `src/app/[locale]/(dashboard)/promotions/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';

type PromoCode = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
  createdAt: string;
};

export default function PromotionsPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    fetch('/api/admin/promo-codes')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: PromoCode[]) => setCodes(data))
      .catch(() => undefined);
  };

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const value = discountType === 'percentage'
      ? Math.round(Number(discountValue))
      : Math.round(Number(discountValue) * 100);
    if (!code.trim() || !Number.isFinite(value) || value <= 0) {
      setError(systemLocale === 'fr' ? 'Merci de remplir un code et une valeur valides.' : 'Please fill in a valid code and value.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discountType, discountValue: value }),
      });
      if (!response.ok) throw new Error('FAILED');
      setCode('');
      setDiscountValue('');
      refresh();
    } catch {
      setError(systemLocale === 'fr' ? 'Ce code existe peut-être déjà.' : 'This code may already exist.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: PromoCode) {
    await fetch(`/api/admin/promo-codes/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !item.active }),
    });
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
    refresh();
  }

  function formatDiscount(item: PromoCode) {
    return item.discountType === 'percentage'
      ? `-${item.discountValue}%`
      : `-${(item.discountValue / 100).toFixed(2)} €`;
  }

  return (
    <div className="space-y-6 animate-fade-in text-admin-text font-sans">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {systemLocale === 'fr' ? 'Codes promo' : 'Promo codes'}
        </h1>
        <p className="text-sm text-admin-muted mt-1.5">
          {systemLocale === 'fr'
            ? 'Un seul code peut être actif à la fois — il apparaît alors sur le site.'
            : 'Only one code can be active at a time — it then appears on the site.'}
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-admin-muted mb-1.5">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DIVINEXPRESS10"
            className="w-full h-11 px-4 border border-slate-200 bg-slate-50/40 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-xs text-black"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-admin-muted mb-1.5">
            {systemLocale === 'fr' ? 'Type' : 'Type'}
          </label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
            className="h-11 px-4 border border-slate-200 bg-slate-50/40 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-xs font-bold text-slate-700"
          >
            <option value="percentage">{systemLocale === 'fr' ? 'Pourcentage' : 'Percentage'}</option>
            <option value="fixed">{systemLocale === 'fr' ? 'Montant fixe (€)' : 'Fixed amount (€)'}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-admin-muted mb-1.5">
            {discountType === 'percentage' ? '%' : '€'}
          </label>
          <input
            type="number"
            min="0"
            step={discountType === 'percentage' ? '1' : '0.01'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="w-28 h-11 px-4 border border-slate-200 bg-slate-50/40 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-xs text-black"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 px-5 rounded-xl bg-black text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition disabled:opacity-50"
        >
          <Plus className="size-4" />
          {systemLocale === 'fr' ? 'Créer' : 'Create'}
        </button>
      </form>
      {error && <p className="text-xs text-admin-error">{error}</p>}

      <div className="bg-white border border-admin-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-admin-border bg-admin-ivory/30 text-admin-muted font-semibold">
                <th className="p-4">Code</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Réduction' : 'Discount'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50 font-medium">
              {codes.length > 0 ? (
                codes.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-4 text-black font-semibold">{item.code}</td>
                    <td className="p-4">{formatDiscount(item)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.active ? 'bg-green-50 text-[#247A52] border-green-150' : 'bg-slate-50 text-slate-500 border-slate-150'
                      }`}>
                        {item.active
                          ? (systemLocale === 'fr' ? 'Actif' : 'Active')
                          : (systemLocale === 'fr' ? 'Inactif' : 'Inactive')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleActive(item)}
                          className="h-8 px-2.5 rounded-lg border border-admin-border hover:border-black text-admin-muted hover:text-black transition text-[10px] font-semibold"
                        >
                          {item.active
                            ? (systemLocale === 'fr' ? 'Désactiver' : 'Deactivate')
                            : (systemLocale === 'fr' ? 'Activer' : 'Activate')}
                        </button>
                        <button
                          onClick={() => remove(item.id)}
                          className="size-8 rounded-lg border border-admin-border hover:border-black text-admin-muted hover:text-black flex items-center justify-center transition"
                          title={systemLocale === 'fr' ? 'Supprimer' : 'Delete'}
                        >
                          <Trash2 className="size-4 text-admin-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-admin-muted">
                    {systemLocale === 'fr' ? 'Aucun code promo' : 'No promo codes'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the sidebar entry**

Modify `src/components/admin/AdminSidebar.tsx` — add `Tag` to the `lucide-react` import list (currently `LayoutDashboard, ShoppingBag, Receipt, RotateCcw, MessageSquare, Users, Settings, ChevronLeft, ChevronRight, LogOut, ChevronDown`):

```ts
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  RotateCcw,
  MessageSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Tag
} from 'lucide-react';
```

Then add an entry to `SIDEBAR_LINKS` (after `Retours`, before `Messages`):

```ts
const SIDEBAR_LINKS: SidebarLink[] = [
  { name: 'Vue d\'ensemble', nameEn: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Produits', nameEn: 'Products', href: '/produits', icon: ShoppingBag,
    children: [
      { name: 'Liste de produits', nameEn: 'Product list', href: '/produits' },
      { name: 'Ajouter un produit', nameEn: 'Add a product', href: '/produits/nouveau' },
    ],
  },
  { name: 'Commandes', nameEn: 'Orders', href: '/commandes', icon: Receipt, badgeKey: 'orders' },
  { name: 'Retours', nameEn: 'Returns', href: '/retours', icon: RotateCcw, badgeKey: 'returns' },
  { name: 'Promotions', nameEn: 'Promotions', href: '/promotions', icon: Tag },
  { name: 'Messages', nameEn: 'Messages', href: '/messages', icon: MessageSquare, badgeKey: 'messages' },
  { name: 'Clients', nameEn: 'Customers', href: '/clients', icon: Users },
  { name: 'Paramètres', nameEn: 'Settings', href: '/parametres', icon: Settings },
];
```

- [ ] **Step 3: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(dashboard)/promotions/page.tsx" src/components/admin/AdminSidebar.tsx
git commit -m "feat(admin): add Promotions dashboard page"
```

---

### Task 8: Checkout UI — promo code input on the payment page

**Files:**
- Modify: `src/context/CheckoutContext.tsx`
- Modify: `src/app/[locale]/commande/paiement/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `POST /api/promo/validate` (Task 5), `POST /api/checkout` with `promoCode` (Task 4).
- Produces: `useCheckout()` gains `promoCode: string | null` and `setPromoCode(code: string | null)`, consumed by Task 9's flow indirectly (the applied code travels through checkout, not read directly by the confirmation page — that page reads the *result* via `findOrderConfirmation`).

- [ ] **Step 1: Add `promoCode` to `CheckoutContext`**

Replace the full contents of `src/context/CheckoutContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ShippingFormValues } from '@/lib/checkoutValidation';

const STORAGE_KEY = 'divinexpress-checkout-shipping';
const PROMO_STORAGE_KEY = 'divinexpress-checkout-promo';

export interface CheckoutContextValue {
  shipping: ShippingFormValues | null;
  setShipping: (values: ShippingFormValues) => void;
  clearShipping: () => void;
  promoCode: string | null;
  setPromoCode: (code: string | null) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [shipping, setShippingState] = useState<ShippingFormValues | null>(null);
  const [promoCode, setPromoCodeState] = useState<string | null>(null);
  const isFirstShippingRender = useRef(true);
  const isFirstPromoRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setShippingState(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    try {
      const rawPromo = window.sessionStorage.getItem(PROMO_STORAGE_KEY);
      if (rawPromo) setPromoCodeState(rawPromo);
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstShippingRender.current) {
      isFirstShippingRender.current = false;
      return;
    }
    if (shipping) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [shipping]);

  useEffect(() => {
    if (isFirstPromoRender.current) {
      isFirstPromoRender.current = false;
      return;
    }
    if (promoCode) {
      window.sessionStorage.setItem(PROMO_STORAGE_KEY, promoCode);
    } else {
      window.sessionStorage.removeItem(PROMO_STORAGE_KEY);
    }
  }, [promoCode]);

  return (
    <CheckoutContext.Provider
      value={{
        shipping, setShipping: setShippingState, clearShipping: () => setShippingState(null),
        promoCode, setPromoCode: setPromoCodeState,
      }}
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

- [ ] **Step 2: Add new translation keys**

Modify `messages/fr.json` — inside the `checkout` object, add after `"confirmPayment": "Confirmer le paiement",`:

```json
    "promoCodeLabel": "Code promo",
    "promoCodePlaceholder": "Entrez votre code",
    "promoApply": "Appliquer",
    "promoApplied": "Code appliqué : {value}",
    "promoInvalid": "Ce code n'est plus valide.",
    "discountLabel": "Réduction",
```

Modify `messages/en.json` — same location, add:

```json
    "promoCodeLabel": "Promo code",
    "promoCodePlaceholder": "Enter your code",
    "promoApply": "Apply",
    "promoApplied": "Code applied: {value}",
    "promoInvalid": "This code is no longer valid.",
    "discountLabel": "Discount",
```

- [ ] **Step 3: Add the promo input UI and wire it into submit**

Modify `src/app/[locale]/commande/paiement/page.tsx`.

Replace:

```ts
  const { shipping } = useCheckout();
  const { items, clearCart } = useCart();
  const [values, setValues] = useState<PaymentFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [capabilities, setCapabilities] = useState<PaymentCapabilities | null>(null);
```

with:

```ts
  const { shipping, promoCode, setPromoCode } = useCheckout();
  const { items, clearCart } = useCart();
  const [values, setValues] = useState<PaymentFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [capabilities, setCapabilities] = useState<PaymentCapabilities | null>(null);
  const [promoInput, setPromoInput] = useState(promoCode ?? '');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>(promoCode ? 'valid' : 'idle');
  const [promoDiscount, setPromoDiscount] = useState<{ discountType: 'percentage' | 'fixed'; discountValue: number } | null>(null);

  async function handleApplyPromo() {
    const trimmed = promoInput.trim();
    if (!trimmed) return;
    setPromoStatus('checking');
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const result = (await response.json()) as { valid: boolean; discountType?: 'percentage' | 'fixed'; discountValue?: number };
      if (result.valid && result.discountType && typeof result.discountValue === 'number') {
        setPromoCode(trimmed);
        setPromoDiscount({ discountType: result.discountType, discountValue: result.discountValue });
        setPromoStatus('valid');
      } else {
        setPromoCode(null);
        setPromoDiscount(null);
        setPromoStatus('invalid');
      }
    } catch {
      setPromoStatus('invalid');
    }
  }
```

Replace the checkout POST body:

```ts
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idempotencyKey, method: values.method, shipping, items }),
        });
```

with:

```ts
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idempotencyKey, method: values.method, shipping, items, promoCode: promoCode ?? undefined }),
        });
```

Replace the submit `catch`/`finally`:

```ts
      } catch {
        setServerError(locale === 'fr'
          ? 'Le paiement n’a pas pu être finalisé. Vérifiez votre panier et réessayez.'
          : 'Payment could not be completed. Check your cart and try again.');
      } finally {
        setSubmitting(false);
      }
```

with:

```ts
      } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_PROMO_CODE') {
          setPromoCode(null);
          setPromoDiscount(null);
          setPromoStatus('invalid');
          setServerError(locale === 'fr'
            ? 'Votre code promo n’est plus valide. Retirez-le pour continuer.'
            : 'Your promo code is no longer valid. Remove it to continue.');
        } else {
          setServerError(locale === 'fr'
            ? 'Le paiement n’a pas pu être finalisé. Vérifiez votre panier et réessayez.'
            : 'Payment could not be completed. Check your cart and try again.');
        }
      } finally {
        setSubmitting(false);
      }
```

Add the promo UI block right after the payment-methods `<div className="space-y-3">...</div>` closes and before `{errors.method && ...}`:

```tsx
        <div className="rounded-2xl border border-mist-100 p-4">
          <label htmlFor="promoCode" className="block text-xs font-bold uppercase tracking-wide text-mist-600">
            {t('promoCodeLabel')}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="promoCode"
              type="text"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value); setPromoStatus('idle'); }}
              placeholder={t('promoCodePlaceholder')}
              className="flex-1 rounded-xl border border-mist-200 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoStatus === 'checking' || !promoInput.trim()}
              className="rounded-xl border border-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
            >
              {t('promoApply')}
            </button>
          </div>
          {promoStatus === 'valid' && promoDiscount && (
            <p className="mt-2 text-xs font-medium text-success">
              {t('promoApplied', {
                value: promoDiscount.discountType === 'percentage'
                  ? `-${promoDiscount.discountValue}%`
                  : `-${(promoDiscount.discountValue / 100).toFixed(2)} €`,
              })}
            </p>
          )}
          {promoStatus === 'invalid' && (
            <p className="mt-2 text-xs text-accent">{t('promoInvalid')}</p>
          )}
        </div>
```

- [ ] **Step 4: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run `npm run dev`, add an item to the cart, go through `/commande/livraison` → `/commande/paiement`. Type `DIVINEXPRESS10` in the promo field, click "Appliquer" — expect "Code appliqué : -10%" to appear. Type a bogus code — expect "Ce code n'est plus valide." Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add src/context/CheckoutContext.tsx "src/app/[locale]/commande/paiement/page.tsx" messages/fr.json messages/en.json
git commit -m "feat(checkout): add promo code input to the payment page"
```

---

### Task 9: Show the applied discount on the confirmation page

**Files:**
- Modify: `src/server/orders/confirmation.ts`
- Modify: `src/app/[locale]/commande/confirmation/page.tsx`

**Interfaces:**
- Consumes: `orders.discount_minor` column (already existed; now populated correctly by Task 3).
- Produces: `OrderConfirmation.discountMinor: number`, used only within this task's page.

- [ ] **Step 1: Expose `discountMinor` from `findOrderConfirmation`**

Replace the full contents of `src/server/orders/confirmation.ts`:

```ts
import type { Database } from '../db/client';

export interface OrderConfirmation {
  number: string;
  status: string;
  currency: string;
  totalMinor: number;
  discountMinor: number;
}

export async function findOrderConfirmation(
  database: Database,
  orderNumber: string,
): Promise<OrderConfirmation | null> {
  const row = await database.prepare(`SELECT number, status, currency, total_minor, discount_minor
    FROM orders WHERE number = ? LIMIT 1`).get(orderNumber) as {
      number: string;
      status: string;
      currency: string;
      total_minor: number;
      discount_minor: number;
    } | undefined;

  return row ? {
    number: row.number,
    status: row.status,
    currency: row.currency,
    totalMinor: row.total_minor,
    discountMinor: row.discount_minor,
  } : null;
}
```

- [ ] **Step 2: Show the discount line when present**

Modify `src/app/[locale]/commande/confirmation/page.tsx` — after computing `formattedTotal`, add:

```ts
  const formattedDiscount = order.discountMinor > 0
    ? new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        style: 'currency', currency: order.currency,
      }).format(order.discountMinor / 100)
    : null;
```

And in the `<dl>`, insert a row between the status row and the total row:

```tsx
      <dl className="mt-8 rounded-2xl border border-mist-200 p-6 text-left text-sm">
        <div className="flex justify-between gap-4"><dt>{locale === 'fr' ? 'Statut' : 'Status'}</dt><dd>{order.status}</dd></div>
        {formattedDiscount && (
          <div className="mt-3 flex justify-between gap-4"><dt>{t('discountLabel')}</dt><dd>-{formattedDiscount}</dd></div>
        )}
        <div className="mt-3 flex justify-between gap-4 font-medium"><dt>Total</dt><dd>{formattedTotal}</dd></div>
      </dl>
```

- [ ] **Step 3: Typecheck**

Run: `rm -rf .next && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Complete a test checkout with `DIVINEXPRESS10` applied (from Task 8's manual test) through to the confirmation page (Genius/Stripe must be configured locally, or use whichever provider `.env.local` has set up — see `divinexpress-deploy` project memory if unsure). Expect a "Réduction" line showing `-12,00 €` (10% of a 120,00 € item) above the total. Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add src/server/orders/confirmation.ts "src/app/[locale]/commande/confirmation/page.tsx"
git commit -m "feat(checkout): show the applied discount on the confirmation page"
```

---

### Task 10: Storefront banner — fetch the active code, redesign, disappear when none active

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/components/home/PromoBanner.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `PromoCodeRepository.findActive()` (Task 2).
- Produces: nothing consumed elsewhere — this is the final, user-visible piece.

- [ ] **Step 1: Fetch the active promo in `page.tsx`**

Modify `src/app/[locale]/page.tsx` — add the import:

```tsx
import { PromoCodeRepository } from '@/server/promotions/repository';
```

(alongside the other imports near `import { getCommerceDatabase } from '@/server/db/runtime';`)

Add, right after the existing `const products = await new StorefrontCatalog(await getCommerceDatabase()).list();` line:

```tsx
  const activePromo = await new PromoCodeRepository(await getCommerceDatabase()).findActive();
```

Replace `<PromoBanner />` with:

```tsx
      <PromoBanner promo={activePromo} />
```

- [ ] **Step 2: Update translation keys**

Modify `messages/fr.json` — inside the `home` object:

- Change `"promoTitle": "-10% sur toute la collection",` to `"promoTitle": "{discount} sur toute la collection",`
- Change `"promoBody": "Utilisez ce code au moment de passer commande. Offre valable jusqu'à la fin du mois."` to `"promoBody": "Utilisez ce code au moment de passer commande."`
- Remove the lines: `"promoCode": "DIVINEXPRESS10",`, `"promoDays": "Jours",`, `"promoHours": "Heures",`, `"promoMinutes": "Min",`, `"promoSeconds": "Sec",`

Modify `messages/en.json` — same object:

- Change `"promoTitle": "-10% on the whole collection",` to `"promoTitle": "{discount} off the whole collection",`
- Change `"promoBody": "Use this code at checkout. Valid until the end of the month."` to `"promoBody": "Use this code at checkout."`
- Remove the lines: `"promoCode": "DIVINEXPRESS10",`, `"promoDays": "Days",`, `"promoHours": "Hours",`, `"promoMinutes": "Min",`, `"promoSeconds": "Sec",`

(`promoKicker`, `promoCopyButton`, `promoCopiedConfirmation` stay unchanged in both files.)

- [ ] **Step 3: Redesign `PromoBanner`**

Replace the full contents of `src/components/home/PromoBanner.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export interface ActivePromo {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

const COPIED_FEEDBACK_MS = 1500;

export function PromoBanner({ promo }: { promo: ActivePromo | null }) {
  const t = useTranslations('home');
  const locale = useLocale();
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    };
  }, []);

  async function copyCode() {
    if (!promo) return;
    try {
      await navigator.clipboard.writeText(promo.code);
    } catch {
      return;
    }
    setIsCopied(true);
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    copiedTimeout.current = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
  }

  if (!promo) return null;

  const discountLabel = promo.discountType === 'percentage'
    ? `-${promo.discountValue}%`
    : `-${new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(promo.discountValue / 100)}`;

  return (
    <section className="relative w-full overflow-hidden py-20 text-paper md:py-28">
      <img src="/image/hero_3.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-ink/70" />

      <div className="relative mx-auto max-w-[760px] px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-paper/75">{t('promoKicker')}</p>
        <h2 className="mt-3.5 font-serif text-2xl md:text-3xl">
          {t('promoTitle', { discount: discountLabel })}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-paper/85">{t('promoBody')}</p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border-2 border-dashed border-paper/45 py-2.5 pl-5 pr-2.5">
          <span className="text-lg font-bold tracking-[0.08em]">{promo.code}</span>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-full bg-paper px-4 py-2 text-xs font-bold tracking-wide text-ink transition-opacity hover:opacity-85"
          >
            {isCopied ? t('promoCopiedConfirmation') : t('promoCopyButton')}
          </button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `rm -rf .next && npm run typecheck && npm run lint`
Expected: no errors (a `no-img-element` warning on the new `<img>` is expected and acceptable — `PlaceholderBlock.tsx` already has the same warning for the same reason, see `divinexpress-deploy` project conventions).

- [ ] **Step 5: Visual verification**

Run `npm run dev`, open `/fr`, scroll to the promo section: expect a full-bleed `/image/hero_3.png` background with a dark overlay, "OFFRE LIMITÉE" kicker, "-10% sur toute la collection" title, the real code "DIVINEXPRESS10" (from the dev seed) with a working copy button, no countdown. Then deactivate the code from `/promotions` in another tab and reload `/fr` — expect the whole section to disappear. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/page.tsx" src/components/home/PromoBanner.tsx messages/fr.json messages/en.json
git commit -m "feat(storefront): drive the promo banner from the active DB promo code, redesign with image overlay"
```

---

## Self-Review

**Spec coverage:**
- Data model + single-active constraint → Task 1. ✓
- Domain layer (list/create/setActive/delete/findActive/findByCode) → Task 2. ✓
- Checkout security (code, not amount; server recomputes) → Task 3, Task 4. ✓
- Checkout UI (apply button, inline feedback, confirmation discount line) → Task 8, Task 9. ✓
- Admin CRUD (list/create/toggle/delete, lightweight page) → Task 6, Task 7. ✓
- Storefront display + "disappears when inactive" + redesign (dark, image overlay, no countdown) → Task 10. ✓
- Out-of-scope items (expiry, min purchase, multi-code, analytics) → intentionally not built; no task references them. ✓

**Placeholder scan:** no "TBD"/"TODO"/"similar to Task N" — every step has full code. ✓

**Type consistency:** `PromoCode`/`ActivePromo`/`DiscountType` shapes checked across tasks — `discountType`/`discountValue` field names match everywhere they cross a task boundary (repository → admin routes → dashboard page; repository → validate route → payment page; repository → page.tsx → PromoBanner). `CreateOrderInput.promoCode` name matches from schema (Task 3) through the checkout route (Task 4) through the payment page (Task 8). ✓
