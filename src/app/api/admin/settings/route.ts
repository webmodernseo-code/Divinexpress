import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';
import { z } from 'zod';

const settingsSchema = z.object({
  shop_name: z.string().trim().min(1).max(120).optional(),
  email: z.email().optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  currency: z.enum(['EUR', 'USD', 'CAD']).optional(),
  timezone: z.enum(['Europe/Paris', 'America/New_York', 'Europe/London']).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  min_shipping_free: z.string().regex(/^\d+(?:[.,]\d{1,2})?$/).optional(),
  return_period: z.enum(['14 jours', '30 jours', '60 jours']).optional(),
  whatsapp_sync: z.boolean().optional(),
  whatsapp_number: z.string().trim().max(40).optional(),
  whatsapp_assignee: z.string().trim().min(1).max(120).optional(),
}).strict();
const allowedSettingKeys = new Set<string>(settingsSchema.keyof().options);

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  const db = await getCommerceDatabase();
  const rows = (await db.prepare('SELECT key, value_json FROM store_settings').all()) as Array<{ key: string; value_json: string }>;
  
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    if (allowedSettingKeys.has(row.key)) {
      settings[row.key] = JSON.parse(row.value_json);
    }
  }
  
  // Default values if empty
  settings.shop_name ??= 'Reign';
  settings.email ??= 'contact@reign.webmodernseo.co';
  settings.phone ??= '+33 7 53 74 10 30';
  settings.address ??= '12 Rue de la Paix, 75002 Paris';
  settings.country ??= 'France';
  settings.currency ??= 'EUR';
  settings.timezone ??= 'Europe/Paris';
  settings.accent_color ??= '#0B0B0B';
  settings.min_shipping_free ??= '150,00';
  settings.return_period ??= '14 jours';
  settings.whatsapp_sync ??= true;
  settings.whatsapp_number ??= '+33 7 53 74 10 30';
  settings.whatsapp_assignee ??= 'Service client';
  
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const body = settingsSchema.parse(await request.json());
    
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
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_SETTINGS' }, { status: 400 });
    return NextResponse.json({ error: 'SETTINGS_SAVE_FAILED' }, { status: 500 });
  }
}
