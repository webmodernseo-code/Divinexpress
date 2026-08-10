import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';
import { OrderService } from '@/server/orders/service';
import { DomainError } from '@/server/domain/errors';

const patchSchema = z.object({
  status: z.enum(['pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
}).superRefine((value, context) => {
  if (value.status === 'shipped' && (!value.trackingNumber?.trim() || !value.carrier?.trim())) {
    context.addIssue({ code: 'custom', message: 'Tracking number and carrier are required for shipment' });
  }
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  
  interface DbOrderRow {
    id: string;
    number: string;
    status: string;
    currency: string;
    total_minor: number;
    subtotal_minor: number;
    shipping_minor: number;
    tax_minor: number;
    discount_minor: number;
    shipping_address_json: string;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  }

  interface DbOrderItemRow {
    id: string;
    variant_id: string | null;
    product_name: string;
    sku: string;
    variant_label: string | null;
    unit_price_minor: number;
    quantity: number;
    line_total_minor: number;
  }

  interface DbShipmentRow {
    carrier: string;
    tracking_number: string;
  }

  const db = await getCommerceDatabase();
  const order = (await db.prepare(`SELECT o.id, o.number, o.status, o.currency, o.total_minor, o.subtotal_minor,
    o.shipping_minor, o.tax_minor, o.discount_minor, o.shipping_address_json, o.created_at,
    c.first_name, c.last_name, c.email, c.phone
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ? OR o.number = ?`).get(id, id)) as DbOrderRow | undefined;
    
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  
  const items = (await db.prepare(`SELECT id, variant_id, product_name, sku, variant_label,
    unit_price_minor, quantity, line_total_minor FROM order_items WHERE order_id = ?`).all(order.id)) as DbOrderItemRow[];
    
  const shipment = (await db.prepare(`SELECT carrier, tracking_number FROM shipments WHERE order_id = ? LIMIT 1`).get(order.id)) as DbShipmentRow | undefined;
  
  return NextResponse.json({
    id: order.id,
    number: order.number,
    status: order.status,
    currency: order.currency,
    totalMinor: order.total_minor,
    subtotalMinor: order.subtotal_minor,
    shippingMinor: order.shipping_minor,
    taxMinor: order.tax_minor,
    discountMinor: order.discount_minor,
    shippingAddress: JSON.parse(order.shipping_address_json),
    createdAt: order.created_at,
    customer: {
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
    },
    shipment: shipment ? { carrier: shipment.carrier, trackingNumber: shipment.tracking_number } : null,
    items: items.map(item => ({
      id: item.id,
      variantId: item.variant_id,
      productName: item.product_name,
      sku: item.sku,
      variantLabel: item.variant_label,
      unitPriceMinor: item.unit_price_minor,
      quantity: item.quantity,
      lineTotalMinor: item.line_total_minor,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    
    const db = await getCommerceDatabase();
    
    await db.exec('BEGIN IMMEDIATE');
    try {
      const updatedOrder = await new OrderService(db).transition(id, body.status);
        
      if (body.status === 'shipped' && (body.trackingNumber || body.carrier)) {
        if (updatedOrder) {
          await db.prepare(`INSERT OR REPLACE INTO shipments (id, order_id, carrier, tracking_number, status, shipped_at)
            VALUES (?, ?, ?, ?, 'shipped', CURRENT_TIMESTAMP)`)
            .run(updatedOrder.id, updatedOrder.id, body.carrier, body.trackingNumber);
        }
      }
      await db.exec('COMMIT');
    } catch (e) {
      await db.exec('ROLLBACK');
      throw e;
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    return NextResponse.json({ error: 'ORDER_UPDATE_FAILED' }, { status: 500 });
  }
}
