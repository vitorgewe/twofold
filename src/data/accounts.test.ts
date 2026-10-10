import { archiveAccount, createAccount, listAccounts, renameAccount, unarchiveAccount } from './accounts';
import { subscribeToDataChanges } from './changes';
import { migrations, runMigrations, type Database } from './database';
import { newId } from './ids';
import { getMeta, setMeta } from './meta';
import { createTestDatabase } from './sqljs-adapter';

async function freshDb(): Promise<Database> {
  const db = await createTestDatabase();
  await runMigrations(db, migrations);
  return db;
}

describe('migrations', () => {
  it('create every ledger table on an empty database', async () => {
    const db = await freshDb();
    const names = (
      await db.query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    ).map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining(['meta', 'currency', 'account', 'transactions', 'postings', 'rate']),
    );
  });

  it('are idempotent and seed BRL 2, USD 2, BTC 8', async () => {
    const db = await freshDb();
    await runMigrations(db, migrations);
    expect(await db.query('SELECT code, decimals FROM currency ORDER BY code')).toEqual([
      { code: 'BRL', decimals: 2 },
      { code: 'BTC', decimals: 8 },
      { code: 'USD', decimals: 2 },
    ]);
  });

  it('delete postings together with their transaction', async () => {
    const db = await freshDb();
    const account = await createAccount(db, { name: 'Cash', type: 'asset', currency: 'BRL' });
    await db.run("INSERT INTO transactions (id, date, description) VALUES ('t1', '2026-01-31', 'x')");
    await db.run(
      "INSERT INTO postings (id, transaction_id, account_id, side, amount, rate, amount_brl) VALUES ('p1', 't1', ?, 'debit', 100, NULL, 100)",
      [account.id],
    );
    await db.run("DELETE FROM transactions WHERE id = 't1'");
    expect(await db.query('SELECT id FROM postings')).toEqual([]);
  });

  it('key rates by currency and date', async () => {
    const db = await freshDb();
    await db.run("INSERT INTO rate (currency, date, rate_scaled) VALUES ('USD', '2026-01-31', 512340000)");
    await expect(
      db.run("INSERT INTO rate (currency, date, rate_scaled) VALUES ('USD', '2026-01-31', 1)"),
    ).rejects.toThrow();
  });
});

describe('accounts', () => {
  it('creates and lists accounts', async () => {
    const db = await freshDb();
    const created = await createAccount(db, { name: ' Checking ', type: 'asset', currency: 'BRL' });
    expect(created).toMatchObject({ name: 'Checking', type: 'asset', currency: 'BRL', archived: false });
    expect(await listAccounts(db)).toEqual([created]);
  });

  it('renames an account', async () => {
    const db = await freshDb();
    const { id } = await createAccount(db, { name: 'Checking', type: 'asset', currency: 'BRL' });
    await renameAccount(db, id, 'Main');
    expect((await listAccounts(db))[0].name).toBe('Main');
  });

  it('archives and unarchives, hiding archived accounts unless asked', async () => {
    const db = await freshDb();
    const { id } = await createAccount(db, { name: 'Old', type: 'expense', currency: 'BRL' });
    await archiveAccount(db, id);
    expect(await listAccounts(db)).toEqual([]);
    expect(await listAccounts(db, { includeArchived: true })).toMatchObject([{ id, archived: true }]);
    await unarchiveAccount(db, id);
    expect(await listAccounts(db)).toMatchObject([{ id, archived: false }]);
  });

  it('rejects a duplicate active name, ignoring case', async () => {
    const db = await freshDb();
    await createAccount(db, { name: 'Savings', type: 'asset', currency: 'BRL' });
    await expect(createAccount(db, { name: 'SAVINGS', type: 'asset', currency: 'USD' })).rejects.toThrow(
      /already exists/,
    );
    const other = await createAccount(db, { name: 'Other', type: 'asset', currency: 'BRL' });
    await expect(renameAccount(db, other.id, 'savings')).rejects.toThrow(/already exists/);
  });

  it('allows the name of an archived account, but not unarchiving into a clash', async () => {
    const db = await freshDb();
    const old = await createAccount(db, { name: 'Savings', type: 'asset', currency: 'BRL' });
    await archiveAccount(db, old.id);
    await createAccount(db, { name: 'savings', type: 'asset', currency: 'BRL' });
    await expect(unarchiveAccount(db, old.id)).rejects.toThrow(/already exists/);
  });

  it('rejects an unknown currency and an empty name', async () => {
    const db = await freshDb();
    await expect(createAccount(db, { name: 'X', type: 'asset', currency: 'EUR' })).rejects.toThrow(
      /Unknown currency/,
    );
    await expect(createAccount(db, { name: '  ', type: 'asset', currency: 'BRL' })).rejects.toThrow(/empty/);
  });

  it('rejects an unknown account type', async () => {
    const db = await freshDb();
    await expect(
      createAccount(db, { name: 'X', type: 'bogus' as never, currency: 'BRL' }),
    ).rejects.toThrow(/Unknown account type/);
  });

  it('rejects a currency change at the database level', async () => {
    const db = await freshDb();
    const { id } = await createAccount(db, { name: 'Cash', type: 'asset', currency: 'BRL' });
    await expect(db.run("UPDATE account SET currency = 'USD' WHERE id = ?", [id])).rejects.toThrow(
      /currency cannot change/,
    );
    expect((await listAccounts(db))[0].currency).toBe('BRL');
  });

  it('rejects an unknown currency at the database level', async () => {
    const db = await freshDb();
    await expect(
      db.run("INSERT INTO account (id, name, type, currency) VALUES ('a', 'X', 'asset', 'EUR')"),
    ).rejects.toThrow();
  });

  it('notifies subscribers on every write', async () => {
    const db = await freshDb();
    const listener = jest.fn();
    const unsubscribe = subscribeToDataChanges(listener);
    const { id } = await createAccount(db, { name: 'A', type: 'asset', currency: 'BRL' });
    await renameAccount(db, id, 'B');
    await archiveAccount(db, id);
    await unarchiveAccount(db, id);
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
  });
});

describe('meta', () => {
  it('sets, overwrites and reads values', async () => {
    const db = await freshDb();
    expect(await getMeta(db, 'k')).toBeNull();
    await setMeta(db, 'k', 'one');
    await setMeta(db, 'k', 'two');
    expect(await getMeta(db, 'k')).toBe('two');
  });
});

describe('newId', () => {
  it('returns UUID v4 strings', () => {
    const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const ids = Array.from({ length: 50 }, newId);
    for (const id of ids) expect(id).toMatch(v4);
    expect(new Set(ids).size).toBe(50);
  });

  it('builds a valid v4 even without crypto.randomUUID', () => {
    const original = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', { value: original, configurable: true });
    }
  });
});
