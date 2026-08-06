import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import type { NotificationProvider } from '../notifications/provider';
import type { PaymentProvider, PaymentStatus } from '../payments/provider';
import { OrderService, type OrderRecord } from '../orders/service';
import type { CreateOrderInput } from '../orders/schemas';

export interface CheckoutPayment {
  id: string;
  status: PaymentStatus | 'refunded' | 'partially_refunded';
  provider: string;
  providerReference: string | null;
}

export class CheckoutService {
  private readonly orders: OrderService;

  constructor(
    private readonly database: Database,
    private readonly payments: PaymentProvider,
    private readonly notifications: NotificationProvider,
  ) {
    this.orders = new OrderService(database);
  }

  async start(input: CreateOrderInput): Promise<{ order: OrderRecord; payment: CheckoutPayment; checkoutUrl?: string }> {
    const order = await this.orders.createOrder(input);
    const paymentKey = `${input.idempotencyKey}:payment`;
    const existing = await this.findPayment(paymentKey);
    if (existing) {
      // Find the associated checkout url if stored in the last event payload or payment status
      const lastEvent = await this.database.prepare(`
        SELECT payload_json FROM payment_events
        WHERE payment_id = ?
        ORDER BY processed_at DESC LIMIT 1
      `).get(existing.id) as { payload_json: string } | undefined;
      let checkoutUrl: string | undefined;
      if (lastEvent) {
        try {
          const parsed = JSON.parse(lastEvent.payload_json);
          checkoutUrl = parsed?.checkoutUrl || parsed?.payload?.checkoutUrl;
        } catch {}
      }
      return { order: (await this.orders.findById(order.id))!, payment: existing, checkoutUrl };
    }

    const result = await this.payments.start({
      orderId: order.id,
      orderNumber: order.number,
      amountMinor: order.totalMinor,
      currency: order.currency,
      idempotencyKey: paymentKey,
    });
    const paymentId = randomUUID();

    await this.database.exec('BEGIN IMMEDIATE');
    try {
      await this.database.prepare(`INSERT INTO payments
        (id, order_id, provider, provider_reference, idempotency_key, status, amount_minor, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(paymentId, order.id, this.payments.name, result.providerReference, paymentKey,
          result.status, order.totalMinor, order.currency);
      await this.database.prepare(`INSERT INTO payment_events
        (id, payment_id, provider, provider_event_id, event_type, payload_json, processed_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
        .run(randomUUID(), paymentId, this.payments.name, result.providerEventId,
          `payment.${result.status}`, JSON.stringify(result.payload));
      if (result.status === 'paid') {
        await this.database.prepare(`UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'pending_payment'`).run(order.id);
      }
      await this.database.exec('COMMIT');
    } catch (error) {
      await this.database.exec('ROLLBACK');
      const duplicate = await this.findPayment(paymentKey);
      if (duplicate) return { order: (await this.orders.findById(order.id))!, payment: duplicate };
      throw error;
    }

    if (result.status === 'paid') {
      await this.notifications.send({
         recipient: input.customer.email.trim().toLowerCase(),
        template: 'order-confirmation',
        payload: { orderId: order.id, orderNumber: order.number, totalMinor: order.totalMinor, currency: order.currency },
      });
    }
    return {
      order: (await this.orders.findById(order.id))!,
      payment: (await this.findPayment(paymentKey))!,
      checkoutUrl: result.payload?.checkoutUrl as string | undefined,
    };
  }

  async completePayment(providerReference: string, providerEventId: string, payload: Record<string, unknown>): Promise<void> {
    const payment = (await this.database.prepare(`
      SELECT id, order_id, status, amount_minor, currency FROM payments
      WHERE provider_reference = ?
    `).get(providerReference)) as { id: string; order_id: string; status: string; amount_minor: number; currency: string } | undefined;

    if (!payment) {
      throw new Error(`Payment not found for provider reference: ${providerReference}`);
    }

    if (payment.status === 'paid') {
      return; // Already processed
    }

    const order = await this.orders.findById(payment.order_id);
    if (!order) {
      throw new Error(`Order not found: ${payment.order_id}`);
    }

    await this.database.exec('BEGIN IMMEDIATE');
    try {
      await this.database.prepare(`
        UPDATE payments SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(payment.id);

      await this.database.prepare(`
        UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending_payment'
      `).run(order.id);

      await this.database.prepare(`
        INSERT INTO payment_events (id, payment_id, provider, provider_event_id, event_type, payload_json, processed_at)
        VALUES (?, ?, ?, ?, 'payment.success', ?, CURRENT_TIMESTAMP)
      `).run(randomUUID(), payment.id, 'genius', providerEventId, JSON.stringify(payload));

      await this.database.exec('COMMIT');
    } catch (error) {
      await this.database.exec('ROLLBACK');
      throw error;
    }

    const customer = (await this.database.prepare(`
      SELECT c.email FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(order.id)) as { email: string } | undefined;

    if (!customer) {
      throw new Error(`Customer not found for order: ${order.id}`);
    }

    await this.notifications.send({
      recipient: customer.email,
      template: 'order-confirmation',
      payload: {
        orderId: order.id,
        orderNumber: order.number,
        totalMinor: order.totalMinor,
        currency: order.currency
      },
    });
  }

  private async findPayment(idempotencyKey: string): Promise<CheckoutPayment | null> {
    const row = (await this.database.prepare(`SELECT id, status, provider, provider_reference
      FROM payments WHERE idempotency_key = ?`).get(idempotencyKey)) as
        | { id: string; status: CheckoutPayment['status']; provider: string; provider_reference: string | null }
        | undefined;
    return row ? {
      id: row.id, status: row.status, provider: row.provider, providerReference: row.provider_reference,
    } : null;
  }
}
