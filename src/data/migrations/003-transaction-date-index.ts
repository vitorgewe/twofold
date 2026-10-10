import type { Migration } from '../database';

/** Lists and period reports filter and sort transactions by date. */
export const transactionDateIndexMigration: Migration = {
  version: 3,
  up: (db) => db.run('CREATE INDEX transactions_date ON transactions (date)'),
};
