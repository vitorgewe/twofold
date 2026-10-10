import * as SQLite from 'expo-sqlite';

import { ledgerMigration } from './migrations/002-ledger';

export type SqlValue = string | number | null;

export interface Database {
  run(sql: string, params?: SqlValue[]): Promise<void>;
  query<T = Record<string, SqlValue>>(sql: string, params?: SqlValue[]): Promise<T[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

export interface Migration {
  version: number;
  up(db: Database): Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => db.run('CREATE TABLE meta (key text primary key, value text)'),
  },
  ledgerMigration,
];

export async function runMigrations(db: Database, list: Migration[]): Promise<void> {
  await db.run('CREATE TABLE IF NOT EXISTS schema_version (version integer not null)');
  const rows = await db.query<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_version',
  );
  const current = rows[0]?.version ?? 0;
  const pending = list.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  for (const migration of pending) {
    await db.transaction(async () => {
      await migration.up(db);
      await db.run('INSERT INTO schema_version (version) VALUES (?)', [migration.version]);
    });
  }
}

const DATABASE_NAME = 'twofold.db';

let opening: Promise<Database> | null = null;

export function getDatabase(): Promise<Database> {
  opening ??= open().catch((error) => {
    opening = null;
    throw error;
  });
  return opening;
}

async function open(): Promise<Database> {
  const native = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await native.execAsync('PRAGMA foreign_keys = ON');
  const db: Database = {
    run: async (sql, params = []) => {
      await native.runAsync(sql, params);
    },
    query: (sql, params = []) => native.getAllAsync(sql, params),
    transaction: async (callback) => {
      let result!: Awaited<ReturnType<typeof callback>>;
      await native.withTransactionAsync(async () => {
        result = await callback();
      });
      return result;
    },
  };
  await runMigrations(db, migrations);
  return db;
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
