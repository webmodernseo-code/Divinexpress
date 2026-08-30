// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '@/server/db/client';
import { migrateDatabase } from '@/server/db/migrate';
import { DEFAULT_STORE_SETTINGS } from '@/server/settings/store-settings';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  getCommerceDatabase: vi.fn(),
}));

vi.mock('@/server/auth/runtime', () => ({ getCurrentAdmin: mocks.getCurrentAdmin }));
vi.mock('@/server/db/runtime', () => ({ getCommerceDatabase: mocks.getCommerceDatabase }));

import { GET, POST } from './route';

describe('admin settings route', () => {
  let database: Database;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare(`INSERT INTO admin_users (id, email, password_hash, role)
      VALUES (?, ?, ?, ?)`).run('admin:owner', 'owner@example.com', 'hash', 'owner');
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin:owner', role: 'owner' });
    mocks.getCommerceDatabase.mockResolvedValue(database);
  });

  afterEach(async () => {
    await closeDatabase();
    vi.clearAllMocks();
  });

  it('returns the complete functional settings contract', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(DEFAULT_STORE_SETTINGS);
  });

  it('persists and returns a validated complete settings document', async () => {
    const input = { ...DEFAULT_STORE_SETTINGS, shop_name: 'Maison Divine', shop_enabled: false };
    const response = await POST(new Request('http://localhost/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(input);
    await expect((await GET()).json()).resolves.toEqual(input);
  });
});
