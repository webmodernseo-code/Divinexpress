import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  connect: vi.fn(async () => undefined),
  query: vi.fn(async () => ({ rows: [{ value: 1 }], rowCount: 1 })),
  end: vi.fn(async () => undefined),
}));

vi.mock('@neondatabase/serverless', () => ({
  Client: class {
    connect = mocks.connect;
    query = mocks.query;
    end = mocks.end;
  },
}));

import { PgDatabase } from './pg-adapter';

describe('PgDatabase connection lifecycle', () => {
  it('shares one connection attempt across concurrent statements', async () => {
    const database = new PgDatabase('postgresql://example.test/database');

    await Promise.all([
      database.prepare('SELECT 1').get(),
      database.prepare('SELECT 1').get(),
    ]);

    expect(mocks.connect).toHaveBeenCalledTimes(1);
    expect(mocks.query).toHaveBeenCalledTimes(2);
  });
});
