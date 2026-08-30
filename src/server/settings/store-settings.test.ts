// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from '@/server/db/client';
import { migrateDatabase } from '@/server/db/migrate';
import {
  DEFAULT_STORE_SETTINGS,
  readPublicStoreSettings,
  readStoreSettings,
  writeStoreSettings,
} from './store-settings';

describe('store settings repository', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('merges persisted values over safe defaults', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare(`INSERT INTO store_settings (key, value_json)
      VALUES ('shop_name', '"Maison Divine"'), ('shop_enabled', 'false')`).run();

    await expect(readStoreSettings(database)).resolves.toMatchObject({
      shop_name: 'Maison Divine',
      shop_enabled: false,
      currency: 'EUR',
    });
  });

  it('exposes only the public contract', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);

    const settings = await readPublicStoreSettings(database);
    expect(settings).toEqual(DEFAULT_STORE_SETTINGS);
    expect(settings).not.toHaveProperty('currentPassword');
  });

  it('persists every validated setting', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);
    const input = { ...DEFAULT_STORE_SETTINGS, shop_name: 'Maison Divine', return_period_days: 30 as const };

    await writeStoreSettings(database, null, input);

    await expect(readStoreSettings(database)).resolves.toEqual(input);
  });
});
