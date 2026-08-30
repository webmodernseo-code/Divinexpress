import { z } from 'zod';
import type { Database } from '@/server/db/client';

export const storeSettingsSchema = z.object({
  shop_name: z.string().trim().min(1).max(120),
  email: z.email(),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  country: z.string().trim().min(2).max(80),
  currency: z.enum(['EUR', 'GBP']),
  timezone: z.enum(['Europe/Paris', 'Europe/London']),
  free_shipping_threshold_minor: z.number().int().nonnegative(),
  return_period_days: z.union([z.literal(14), z.literal(30), z.literal(60)]),
  payment_europe_enabled: z.boolean(),
  payment_africa_enabled: z.boolean(),
  shop_enabled: z.boolean(),
}).strict();

export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type PublicStoreSettings = StoreSettings;

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shop_name: 'DivinExpress',
  email: 'contact@divinexpress.fr',
  phone: '+33 7 53 74 10 30',
  address: '',
  country: 'France',
  currency: 'EUR',
  timezone: 'Europe/Paris',
  free_shipping_threshold_minor: 15000,
  return_period_days: 14,
  payment_europe_enabled: true,
  payment_africa_enabled: true,
  shop_enabled: true,
};

export async function readStoreSettings(database: Database): Promise<StoreSettings> {
  const rows = await database.prepare('SELECT key, value_json FROM store_settings').all() as Array<{
    key: string;
    value_json: string;
  }>;
  const knownKeys = new Set(storeSettingsSchema.keyof().options);
  const persisted: Record<string, unknown> = {};

  for (const row of rows) {
    if (!knownKeys.has(row.key)) continue;
    persisted[row.key] = JSON.parse(row.value_json);
  }

  return storeSettingsSchema.parse({ ...DEFAULT_STORE_SETTINGS, ...persisted });
}

export async function readPublicStoreSettings(database: Database): Promise<PublicStoreSettings> {
  return readStoreSettings(database);
}

export async function writeStoreSettings(
  database: Database,
  adminId: string | null,
  input: StoreSettings,
): Promise<StoreSettings> {
  const settings = storeSettingsSchema.parse(input);
  await database.exec('BEGIN IMMEDIATE');
  try {
    const statement = database.prepare(`INSERT OR REPLACE INTO store_settings (key, value_json, updated_by, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)`);
    for (const [key, value] of Object.entries(settings)) {
      await statement.run(key, JSON.stringify(value), adminId);
    }
    await database.exec('COMMIT');
    return settings;
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}
