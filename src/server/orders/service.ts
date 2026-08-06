import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import { DomainError } from '../domain/errors';
import { createOrderInputSchema, type CreateOrderInput } from './schemas';

type Currency = 'EUR' | 'GBP';
type Status = 'pending_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface VariantRow {
  id: string; sku: string; size: string | null; color: string | null;
  price_minor: number; currency: Currency; product_name: string; stock: number;
}

export interface OrderItemRecord {
  id: string; variantId: string | null; productName: string; sku: string;
  variantLabel: string | null; unitPriceMinor: number; quantity: number; lineTotalMinor: number;
}

export interface OrderRecord {
  id: string; number: string; status: Status; currency: Currency;
  subtotalMinor: number; shippingMinor: number; taxMinor: number; discountMinor: number;
  totalMinor: number; items: OrderItemRecord[];
}

export class OrderService {
  constructor(
    private readonly database: Database,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createOrder(rawInput: CreateOrderInput): Promise<OrderRecord> {
    const input = createOrderInputSchema.parse(rawInput);
    const existing = await this.findByIdempotencyKey(input.idempotencyKey);
    if (existing) return existing;

    await this.database.exec('BEGIN IMMEDIATE');
    try {
      const duplicate = await this.findByIdempotencyKey(input.idempotencyKey);
      if (duplicate) {
        await this.database.exec('COMMIT');
        return duplicate;
      }

      const variants = await Promise.all(input.lines.map(async (line) => {
        const variant = (await this.database.prepare(`SELECT v.id, v.sku, v.size, v.color,
          v.price_minor, v.currency, p.name_fr AS product_name,
          COALESCE(SUM(m.quantity_delta), 0) AS stock
          FROM product_variants v JOIN products p ON p.id = v.product_id
          LEFT JOIN inventory_movements m ON m.variant_id = v.id
          WHERE v.id = ? AND v.active = 1 AND p.status = 'active' GROUP BY v.id`)
          .get(line.variantId)) as VariantRow | undefined;
        if (!variant) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
        if (variant.currency !== input.currency) {
          throw new DomainError('CURRENCY_MISMATCH', 'Currencies must match');
        }
        if (variant.stock < line.quantity) throw new DomainError('CONFLICT', 'Insufficient stock');
        return { line, variant };
      }));

      const subtotalMinor = variants.reduce(
        (total, { line, variant }) => total + variant.price_minor * line.quantity,
        0,
      );
      const totalMinor = subtotalMinor + input.shippingMinor + input.taxMinor - input.discountMinor;
      if (totalMinor < 0) throw new DomainError('CONFLICT', 'Discount exceeds order total');

      const email = input.customer.email.trim().toLowerCase();
      let customer = (await this.database.prepare('SELECT id FROM customers WHERE email = ?')
        .get(email)) as { id: string } | undefined;
      if (!customer) {
        customer = { id: randomUUID() };
        await this.database.prepare(`INSERT INTO customers
          (id, email, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)`)
          .run(customer.id, email, input.customer.firstName, input.customer.lastName, input.customer.phone);
      } else {
        await this.database.prepare(`UPDATE customers SET first_name = ?, last_name = ?, phone = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(input.customer.firstName, input.customer.lastName, input.customer.phone, customer.id);
      }

      await this.database.prepare(`INSERT INTO customer_addresses
        (id, customer_id, recipient, line1, line2, postal_code, city, region, country_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(randomUUID(), customer.id, input.shippingAddress.recipient, input.shippingAddress.line1,
          input.shippingAddress.line2, input.shippingAddress.postalCode, input.shippingAddress.city,
          input.shippingAddress.region, input.shippingAddress.countryCode);

      const orderId = randomUUID();
      const date = this.now().toISOString().slice(0, 10).replaceAll('-', '');
      const number = `RG-${date}-${orderId.slice(0, 8).toUpperCase()}`;
      await this.database.prepare(`INSERT INTO orders
        (id, number, customer_id, idempotency_key, status, currency, subtotal_minor,
         shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(orderId, number, customer.id, input.idempotencyKey, input.currency, subtotalMinor,
          input.shippingMinor, input.taxMinor, input.discountMinor, totalMinor,
          JSON.stringify(input.shippingAddress), this.now().toISOString(), this.now().toISOString());

      const insertItem = this.database.prepare(`INSERT INTO order_items
        (id, order_id, variant_id, product_name, sku, variant_label, unit_price_minor,
         quantity, line_total_minor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const reserve = this.database.prepare(`INSERT INTO inventory_movements
        (id, variant_id, quantity_delta, reason, reference_type, reference_id)
        VALUES (?, ?, ?, 'reservation', 'order', ?)`);
      for (const { line, variant } of variants) {
        const label = [variant.size, variant.color].filter(Boolean).join(' / ') || null;
        await insertItem.run(randomUUID(), orderId, variant.id, variant.product_name, variant.sku, label,
          variant.price_minor, line.quantity, variant.price_minor * line.quantity);
        await reserve.run(randomUUID(), variant.id, -line.quantity, orderId);
      }
      await this.database.exec('COMMIT');
      return (await this.findById(orderId))!;
    } catch (error) {
      await this.database.exec('ROLLBACK');
      if (error instanceof DomainError) throw error;
      throw new DomainError('CONFLICT', 'Unable to create order');
    }
  }

  async findByIdempotencyKey(key: string): Promise<OrderRecord | null> {
    const row = (await this.database.prepare('SELECT id FROM orders WHERE idempotency_key = ?')
      .get(key)) as { id: string } | undefined;
    return row ? this.findById(row.id) : null;
  }

  async findById(id: string): Promise<OrderRecord | null> {
    const order = (await this.database.prepare(`SELECT id, number, status, currency, subtotal_minor,
      shipping_minor, tax_minor, discount_minor, total_minor FROM orders WHERE id = ?`)
      .get(id)) as {
        id: string; number: string; status: Status; currency: Currency; subtotal_minor: number;
        shipping_minor: number; tax_minor: number; discount_minor: number; total_minor: number;
      } | undefined;
    if (!order) return null;
    const items = (await this.database.prepare(`SELECT id, variant_id, product_name, sku, variant_label,
      unit_price_minor, quantity, line_total_minor FROM order_items WHERE order_id = ? ORDER BY rowid`)
      .all(id)) as unknown as Array<{
        id: string; variant_id: string | null; product_name: string; sku: string;
        variant_label: string | null; unit_price_minor: number; quantity: number; line_total_minor: number;
      }>;
    return {
      id: order.id, number: order.number, status: order.status, currency: order.currency,
      subtotalMinor: order.subtotal_minor, shippingMinor: order.shipping_minor,
      taxMinor: order.tax_minor, discountMinor: order.discount_minor, totalMinor: order.total_minor,
      items: items.map((item) => ({
        id: item.id, variantId: item.variant_id, productName: item.product_name, sku: item.sku,
        variantLabel: item.variant_label, unitPriceMinor: item.unit_price_minor,
        quantity: item.quantity, lineTotalMinor: item.line_total_minor,
      })),
    };
  }
}
