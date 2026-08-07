import { CATEGORIES, ALL_PRODUCTS } from '@/lib/products';
import type { Database } from './client';

const categoryNames = {
  homme: { fr: 'Homme', en: 'Men' },
  femme: { fr: 'Femme', en: 'Women' },
  enfant: { fr: 'Enfant', en: 'Kids' },
  accessoires: { fr: 'Accessoires', en: 'Accessories' },
} as const;

function identifierPart(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}

export async function seedDevelopmentDatabase(database: Database): Promise<void> {
  const insertCategory = database.prepare(`INSERT OR IGNORE INTO categories
    (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)`);
  const insertProduct = database.prepare(`INSERT OR IGNORE INTO products
    (id, category_id, slug, name_fr, name_en, description_fr, description_en, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`);
  const insertVariant = database.prepare(`INSERT OR IGNORE INTO product_variants
    (id, product_id, sku, size, color, price_minor, currency)
    VALUES (?, ?, ?, ?, ?, ?, 'EUR')`);
  const insertStock = database.prepare(`INSERT OR IGNORE INTO inventory_movements
    (id, variant_id, quantity_delta, reason, reference_type, reference_id)
    VALUES (?, ?, 25, 'initial', 'seed', 'storefront-v1')`);

  await database.exec('BEGIN IMMEDIATE');
  try {
    for (const category of CATEGORIES) {
      const names = categoryNames[category];
      await insertCategory.run(`category:${category}`, category, names.fr, names.en);
    }

    for (const product of ALL_PRODUCTS.filter((p) => p.id === 'homme-hoodie-yahweh')) {
      await insertProduct.run(
        product.id,
        `category:${product.category}`,
        product.slug,
        product.name.fr,
        product.name.en,
        product.description.fr,
        product.description.en,
      );

      for (const size of product.sizes) {
        for (const color of product.colors) {
          const variantId = `${product.id}:${identifierPart(size)}:${identifierPart(color)}`;
          const sku = `${product.id}-${size}-${identifierPart(color)}`.toUpperCase();
          await insertVariant.run(variantId, product.id, sku, size, color, Math.round(product.priceEur * 100));
          await insertStock.run(`stock:${variantId}`, variantId);
        }
      }
    }

    // --- Demo data (development only) ---
    // Previously injected inside the returns GET handler; moved here so read
    // endpoints stay side-effect free. All idempotent via INSERT OR IGNORE.
    const demoCustomer = 'demo-cust-returns-1';
    await database
      .prepare(
        `INSERT OR IGNORE INTO customers (id, email, first_name, last_name, phone)
         VALUES (?, 'pierre.leroux@email.com', 'Pierre', 'Leroux', '+33 6 12 34 56 78')`,
      )
      .run(demoCustomer);

    const demoOrders: Array<[string, string, string, number]> = [
      ['order-ret-1', '#1081', 'refunded', 27200],
      ['order-ret-2', '#1083', 'preparing', 8990],
      ['order-ret-3', '#1080', 'preparing', 16250],
    ];
    for (const [oid, number, status, total] of demoOrders) {
      await database
        .prepare(
          `INSERT OR IGNORE INTO orders
           (id, number, customer_id, idempotency_key, status, currency, subtotal_minor,
            shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json)
           VALUES (?, ?, ?, ?, ?, 'EUR', ?, 0, 0, 0, ?, '{}')`,
        )
        .run(oid, number, demoCustomer, `key-${oid}`, status, total, total);
    }

    const demoReturns: Array<[string, string, string, string]> = [
      ['RET-001', 'order-ret-1', 'refunded', 'Taille trop petite'],
      ['RET-002', 'order-ret-2', 'requested', "Changement d'avis"],
      ['RET-003', 'order-ret-3', 'approved', 'Article défectueux'],
    ];
    for (const [rid, oid, status, reason] of demoReturns) {
      await database
        .prepare(`INSERT OR IGNORE INTO returns (id, order_id, status, reason) VALUES (?, ?, ?, ?)`)
        .run(rid, oid, status, reason);
    }

    // Demo WhatsApp conversation so the messaging inbox is not empty in dev.
    await database
      .prepare(
        `INSERT OR IGNORE INTO conversations
         (id, channel, external_id, customer_id, display_name, status, ai_enabled, unread_count,
          last_message_at, last_message_preview)
         VALUES ('conv-demo-wa', 'whatsapp', '33612345678', ?, 'Pierre Leroux', 'pending', 1, 1,
          datetime('now', '-5 minutes'), 'Bonjour Pierre, votre commande #1081 a été remboursée.')`,
      )
      .run(demoCustomer);
    await database
      .prepare(
        `INSERT OR IGNORE INTO messages (id, conversation_id, direction, author, body, created_at)
         VALUES ('msg-demo-1', 'conv-demo-wa', 'inbound', 'customer',
          'Bonjour, où en est ma commande #1081 ?', datetime('now', '-6 minutes'))`,
      )
      .run();
    await database
      .prepare(
        `INSERT OR IGNORE INTO messages (id, conversation_id, direction, author, body, created_at)
         VALUES ('msg-demo-2', 'conv-demo-wa', 'outbound', 'ai',
          'Bonjour Pierre, votre commande #1081 a été remboursée. Puis-je vous aider pour autre chose ?',
          datetime('now', '-5 minutes'))`,
      )
      .run();

    await database.exec('COMMIT');
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}
