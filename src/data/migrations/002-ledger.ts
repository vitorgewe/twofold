import type { Migration } from '../database';

export const ledgerMigration: Migration = {
  version: 2,
  up: async (db) => {
    await db.run(`CREATE TABLE currency (
      code text primary key,
      name text not null,
      decimals integer not null check (decimals >= 0)
    )`);
    await db.run(
      "INSERT INTO currency (code, name, decimals) VALUES ('BRL', 'Brazilian Real', 2), ('USD', 'US Dollar', 2), ('BTC', 'Bitcoin', 8)",
    );

    await db.run(`CREATE TABLE account (
      id text primary key,
      name text not null,
      type text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
      currency text not null references currency (code),
      archived integer not null default 0 check (archived in (0, 1))
    )`);
    await db.run('CREATE UNIQUE INDEX account_active_name ON account (lower(name)) WHERE archived = 0');
    await db.run(`CREATE TRIGGER account_currency_is_fixed
      BEFORE UPDATE OF currency ON account
      WHEN NEW.currency <> OLD.currency
      BEGIN SELECT RAISE(ABORT, 'account currency cannot change'); END`);

    // Dates are calendar dates as YYYY-MM-DD text, with no time zone.
    await db.run(`CREATE TABLE transactions (
      id text primary key,
      date text not null,
      description text not null
    )`);
    await db.run(`CREATE TABLE postings (
      id text primary key,
      transaction_id text not null references transactions (id) on delete cascade,
      account_id text not null references account (id),
      side text not null check (side in ('debit', 'credit')),
      amount integer not null check (amount >= 0),
      rate integer,
      amount_brl integer not null check (amount_brl >= 0)
    )`);
    await db.run('CREATE INDEX postings_transaction ON postings (transaction_id)');
    await db.run('CREATE INDEX postings_account ON postings (account_id)');

    await db.run(`CREATE TABLE rate (
      currency text not null references currency (code),
      date text not null,
      rate_scaled integer not null,
      primary key (currency, date)
    )`);
  },
};
