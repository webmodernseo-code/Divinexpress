import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from './client';

// Ordered list of migrations. Add new entries at the end; each id must be unique
// and match a `<id>.sql` file in ./migrations. Applied migrations are tracked in
// the schema_migrations table so re-running is idempotent.
const MIGRATIONS = [
  '0001_initial',
  '0002_conversations',
  '0003_compare_at_price',
  '0004_product_brand',
  '0005_promotion_slides',
] as const;

export async function migrateDatabase(database: Database): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const id of MIGRATIONS) {
    const applied = await database.prepare('SELECT 1 FROM schema_migrations WHERE id = ?').get(id);
    if (applied) continue;

    const sql = readFileSync(
      join(process.cwd(), 'src', 'server', 'db', 'migrations', `${id}.sql`),
      'utf8',
    );

    await database.exec('BEGIN IMMEDIATE');
    try {
      await database.exec(sql);
      await database.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run(id);
      await database.exec('COMMIT');
    } catch (error) {
      await database.exec('ROLLBACK');
      throw error;
    }
  }
}
