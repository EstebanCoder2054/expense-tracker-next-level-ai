import type { SQLiteDatabase } from 'expo-sqlite';

const BASE_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT 'pricetag-outline'
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category_id TEXT NOT NULL,
  occurred_on TEXT NOT NULL,
  note TEXT,
  space_id TEXT,
  kind TEXT NOT NULL DEFAULT 'expense',
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_occurred ON expenses (occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category_id);
`;

async function tableHasColumn(
  db: SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

async function ensureLegacyColumns(db: SQLiteDatabase): Promise<void> {
  if (!(await tableHasColumn(db, 'categories', 'icon'))) {
    await db.execAsync(
      `ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'pricetag-outline'`,
    );
  }
  if (!(await tableHasColumn(db, 'expenses', 'kind'))) {
    await db.execAsync(`ALTER TABLE expenses ADD COLUMN kind TEXT NOT NULL DEFAULT 'expense'`);
  }
  if (!(await tableHasColumn(db, 'expenses', 'pinned'))) {
    await db.execAsync(`ALTER TABLE expenses ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`);
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(BASE_SQL);
  await ensureLegacyColumns(db);
}
