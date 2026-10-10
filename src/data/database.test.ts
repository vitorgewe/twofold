import { runMigrations, type Migration } from './database';
import { createTestDatabase } from './sqljs-adapter';

const create = (version: number, table: string): Migration => ({
  version,
  up: (db) => db.run(`CREATE TABLE ${table} (id integer)`),
});

const tables = async (db: Awaited<ReturnType<typeof createTestDatabase>>) =>
  (
    await db.query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  ).map((r) => r.name);

describe('runMigrations', () => {
  it('applies migrations once and records the version', async () => {
    const db = await createTestDatabase();
    await runMigrations(db, [create(1, 'a')]);
    expect(await tables(db)).toEqual(['a', 'schema_version']);
    expect(await db.query('SELECT version FROM schema_version')).toEqual([{ version: 1 }]);
  });

  it('applies new migrations in order, skipping applied ones', async () => {
    const db = await createTestDatabase();
    await runMigrations(db, [create(1, 'a')]);
    await runMigrations(db, [create(3, 'c'), create(1, 'a'), create(2, 'b')]);
    expect(await tables(db)).toEqual(['a', 'b', 'c', 'schema_version']);
    expect(await db.query('SELECT version FROM schema_version ORDER BY rowid')).toEqual([
      { version: 1 },
      { version: 2 },
      { version: 3 },
    ]);
  });

  it('is idempotent when run twice', async () => {
    const db = await createTestDatabase();
    const list = [create(1, 'a'), create(2, 'b')];
    await runMigrations(db, list);
    await runMigrations(db, list);
    expect(await db.query('SELECT COUNT(*) AS n FROM schema_version')).toEqual([{ n: 2 }]);
  });

  it('rolls back a failing migration without recording it', async () => {
    const db = await createTestDatabase();
    const bad: Migration = { version: 2, up: () => Promise.reject(new Error('boom')) };
    await expect(runMigrations(db, [create(1, 'a'), bad])).rejects.toThrow('boom');
    expect(await db.query('SELECT version FROM schema_version')).toEqual([{ version: 1 }]);
  });
});
