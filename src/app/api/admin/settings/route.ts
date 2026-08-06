import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  const db = await getCommerceDatabase();
  const rows = (await db.prepare('SELECT key, value_json FROM store_settings').all()) as Array<{ key: string; value_json: string }>;
  
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = JSON.parse(row.value_json);
  }
  
  // Default values if empty
  settings.shop_name ??= 'Reign';
  settings.email ??= 'contact@reign-store.com';
  settings.phone ??= '+33 6 12 34 56 78';
  settings.address ??= '12 Rue de la Paix, 75002 Paris';
  settings.country ??= 'France';
  settings.currency ??= 'EUR';
  settings.timezone ??= 'Europe/Paris';
  settings.accent_color ??= '#0B0B0B';
  settings.min_shipping_free ??= '150,00';
  settings.return_period ??= '14 jours';
  settings.whatsapp_sync ??= true;
  settings.whatsapp_assignee ??= 'Service client';
  
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const body = await request.json() as Record<string, unknown>;
    
    const db = await getCommerceDatabase();
    await db.exec('BEGIN IMMEDIATE');
    try {
      const stmt = db.prepare(`INSERT OR REPLACE INTO store_settings (key, value_json, updated_by, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`);
      for (const [key, val] of Object.entries(body)) {
        await stmt.run(key, JSON.stringify(val), admin.id);
      }
      await db.exec('COMMIT');
    } catch (e) {
      await db.exec('ROLLBACK');
      throw e;
    }
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'SETTINGS_SAVE_FAILED' }, { status: 500 });
  }
}
