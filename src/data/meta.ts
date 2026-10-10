import { notifyDataChanged } from './changes';
import type { Database } from './database';

export async function getMeta(db: Database, key: string): Promise<string | null> {
  const rows = await db.query<{ value: string | null }>('SELECT value FROM meta WHERE key = ?', [key]);
  return rows[0]?.value ?? null;
}

export async function setMeta(db: Database, key: string, value: string): Promise<void> {
  await db.run(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
  notifyDataChanged();
}
