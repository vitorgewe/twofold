import type { Migration } from '../database';

/** CSV import stores the file's transaction_id here, so importing the same file twice skips what exists. */
export const transactionExternalIdMigration: Migration = {
  version: 4,
  up: async (db) => {
    await db.run('ALTER TABLE transactions ADD COLUMN external_id text');
    await db.run('CREATE UNIQUE INDEX transactions_external_id ON transactions (external_id)');
  },
};
