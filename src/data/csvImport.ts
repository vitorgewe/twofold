import { accountKey, planImport, type ExistingAccount, type ImportPlan } from '../features/import/validate';
import type { CsvRow } from '../features/import/csv';
import { createAccount } from './accounts';
import type { Database } from './database';
import { createTransaction } from './transactions';

/** Checks the rows against the current data and returns what an import would do. Writes nothing. */
export async function previewCsvImport(db: Database, rows: readonly CsvRow[]): Promise<ImportPlan> {
  const accounts = await db.query<{ name: string; type: ExistingAccount['type']; currency: string }>(
    'SELECT name, type, currency FROM account WHERE archived = 0',
  );
  const ids = await db.query<{ external_id: string }>(
    'SELECT external_id FROM transactions WHERE external_id IS NOT NULL',
  );
  return planImport(
    rows,
    new Map(accounts.map((a) => [accountKey(a.name), { type: a.type, currency: a.currency }])),
    new Set(ids.map((r) => r.external_id)),
  );
}

/** Writes a plan with no errors in one SQLite transaction: any failure leaves the data as it was. */
export async function applyCsvImport(db: Database, plan: ImportPlan): Promise<void> {
  if (plan.errors.length > 0) throw new Error('The file has errors and cannot be imported.');
  await db.transaction(async (tx) => {
    const ids = new Map<string, string>();
    for (const a of await tx.query<{ id: string; name: string }>('SELECT id, name FROM account WHERE archived = 0')) {
      ids.set(accountKey(a.name), a.id);
    }
    for (const a of plan.accountsToCreate) {
      ids.set(accountKey(a.name), (await createAccount(tx, a)).id);
    }
    for (const t of plan.newTransactions) {
      await createTransaction(tx, {
        date: t.date,
        description: t.description,
        externalId: t.externalId,
        postings: t.postings.map((p) => ({
          accountId: ids.get(accountKey(p.account))!,
          side: p.side,
          amount: p.amount,
          rate: p.rate,
          amountBrl: p.amountBrl,
        })),
      });
    }
  });
}
