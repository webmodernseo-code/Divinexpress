import { Client } from '@neondatabase/serverless';

export function translateSql(sql: string): string {
  let pgSql = sql;

  // Remove SQLite STRICT keyword
  pgSql = pgSql.replace(/\bSTRICT\b/gi, '');

  // Remove COLLATE NOCASE
  pgSql = pgSql.replace(/\bCOLLATE NOCASE\b/gi, '');

  // Convert SQLite INSERT OR IGNORE INTO
  if (pgSql.toLowerCase().includes('insert or ignore into')) {
    pgSql = pgSql.replace(/INSERT OR IGNORE INTO (\w+)/gi, 'INSERT INTO $1');
    pgSql += ' ON CONFLICT DO NOTHING';
  }

  // Convert SQLite INSERT OR REPLACE INTO for store_settings
  if (pgSql.toLowerCase().includes('insert or replace into store_settings')) {
    pgSql = pgSql.replace(/INSERT OR REPLACE INTO store_settings/gi, 'INSERT INTO store_settings');
    pgSql += ' ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at';
  }

  // Convert SQLite INSERT OR REPLACE INTO for shipments
  if (pgSql.toLowerCase().includes('insert or replace into shipments')) {
    pgSql = pgSql.replace(/INSERT OR REPLACE INTO shipments/gi, 'INSERT INTO shipments');
    pgSql += ' ON CONFLICT (id) DO UPDATE SET order_id = EXCLUDED.order_id, carrier = EXCLUDED.carrier, tracking_number = EXCLUDED.tracking_number, status = EXCLUDED.status, shipped_at = EXCLUDED.shipped_at';
  }

  // Convert SQLite datetime modifiers to PostgreSQL INTERVALs
  // e.g. datetime('now', '-20 minutes') -> CURRENT_TIMESTAMP + INTERVAL '-20 minutes'
  pgSql = pgSql.replace(/datetime\('now',\s*'(-?\d+)\s+(\w+)'\)/gi, "CURRENT_TIMESTAMP + INTERVAL '$1 $2'");
  pgSql = pgSql.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');

  // Convert BEGIN IMMEDIATE to BEGIN
  pgSql = pgSql.replace(/BEGIN IMMEDIATE/gi, 'BEGIN');

  // Translate ? positional parameters to $1, $2, $3, ...
  let index = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${index++}`);

  return pgSql;
}

export class PgStatement {
  constructor(
    private client: Client,
    private sql: string,
    private ensureConnected: () => Promise<void>,
  ) {}

  async run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    await this.ensureConnected();
    const translated = translateSql(this.sql);
    const res = await this.client.query(translated, params);
    return {
      changes: res.rowCount ?? 0,
      lastInsertRowid: 0,
    };
  }

  async get(...params: unknown[]): Promise<unknown> {
    await this.ensureConnected();
    const translated = translateSql(this.sql);
    const res = await this.client.query(translated, params);
    return res.rows[0] ?? undefined;
  }

  async all(...params: unknown[]): Promise<unknown[]> {
    await this.ensureConnected();
    const translated = translateSql(this.sql);
    const res = await this.client.query(translated, params);
    return res.rows;
  }
}

export class PgDatabase {
  private client: Client;
  private connected = false;
  private connectionPromise: Promise<void> | undefined;

  constructor(connectionString: string) {
    this.client = new Client({ connectionString });
  }

  private async ensureConnected() {
    if (this.connected) return;
    this.connectionPromise ??= this.client.connect()
      .then(() => { this.connected = true; })
      .catch((error) => {
        this.connectionPromise = undefined;
        throw error;
      });
    await this.connectionPromise;
  }

  async exec(sql: string): Promise<void> {
    await this.ensureConnected();
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      const translated = translateSql(stmt);
      await this.client.query(translated);
    }
  }

  prepare(sql: string): PgStatement {
    return new PgStatement(this.client, sql, () => this.ensureConnected());
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }
}
