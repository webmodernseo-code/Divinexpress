import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from './client';

const INITIAL_MIGRATION = '0001_initial';

export async function migrateDatabase(database: Database): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = await database.prepare('SELECT 1 FROM schema_migrations WHERE id = ?')
    .get(INITIAL_MIGRATION);
  if (applied) return;

  const sql = readFileSync(
    join(process.cwd(), 'src', 'server', 'db', 'migrations', `${INITIAL_MIGRATION}.sql`),
    'utf8',
  );

  await database.exec('BEGIN IMMEDIATE');
  try {
    await database.exec(sql);
    await database.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run(INITIAL_MIGRATION);
    await database.exec('COMMIT');
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}
