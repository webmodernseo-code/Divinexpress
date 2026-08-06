import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PgDatabase } from './pg-adapter';

export interface Statement {
  run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  get(...params: unknown[]): Promise<unknown>;
  all(...params: unknown[]): Promise<unknown[]>;
}

export interface Database {
  exec(sql: string): Promise<void>;
  prepare(sql: string): Statement;
  close(): Promise<void>;
}

class SqliteStatementWrapper implements Statement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private stmt: any) {}
  async run(...params: unknown[]) {
    const res = this.stmt.run(...params);
    return {
      changes: res.changes,
      lastInsertRowid: res.lastInsertRowid,
    };
  }
  async get(...params: unknown[]) {
    return this.stmt.get(...params) ?? undefined;
  }
  async all(...params: unknown[]) {
    return this.stmt.all(...params);
  }
}

class SqliteDatabaseWrapper implements Database {
  constructor(private db: DatabaseSync) {}
  async exec(sql: string) {
    this.db.exec(sql);
  }
  prepare(sql: string) {
    return new SqliteStatementWrapper(this.db.prepare(sql));
  }
  async close() {
    this.db.close();
  }
}

const openDatabases = new Set<Database>();

function resolveDatabasePath(input: string): string {
  if (input === ':memory:') return input;
  const withoutScheme = input.startsWith('file:') ? input.slice(5) : input;
  const absolute = resolve(process.cwd(), withoutScheme);
  mkdirSync(dirname(absolute), { recursive: true });
  return absolute;
}

export function createDatabase(url = process.env.DATABASE_URL ?? 'file:./data/reign.db'): Database {
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    const pgDb = new PgDatabase(url);
    openDatabases.add(pgDb);
    return pgDb;
  }

  const sqliteDb = new DatabaseSync(resolveDatabasePath(url), {
    enableForeignKeyConstraints: true,
  });
  sqliteDb.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  const db = new SqliteDatabaseWrapper(sqliteDb);
  openDatabases.add(db);
  return db;
}

let applicationDatabase: Database | undefined;

export function getDatabase(): Database {
  applicationDatabase ??= createDatabase();
  return applicationDatabase;
}

export async function closeDatabase(): Promise<void> {
  for (const database of openDatabases) {
    await database.close();
  }
  openDatabases.clear();
  applicationDatabase = undefined;
}
