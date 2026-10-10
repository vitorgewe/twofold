import { archiveAccount, createAccount } from './accounts';
import { subscribeToDataChanges } from './changes';
import { migrations, runMigrations, type Database } from './database';
import { addRate, latestRate, listRates } from './rates';
import { createTestDatabase } from './sqljs-adapter';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listAccountsWithBalances,
  listPostingsForAccount,
  listTransactions,
  updateTransaction,
  type PostingInput,
} from './transactions';

async function setup() {
  const db = await createTestDatabase();
  await runMigrations(db, migrations);
  const cash = await createAccount(db, { name: 'Cash', type: 'asset', currency: 'BRL' });
  const salary = await createAccount(db, { name: 'Salary', type: 'income', currency: 'BRL' });
  const food = await createAccount(db, { name: 'Food', type: 'expense', currency: 'BRL' });
  const fun = await createAccount(db, { name: 'Fun', type: 'expense', currency: 'BRL' });
  const usd = await createAccount(db, { name: 'Dollars', type: 'asset', currency: 'USD' });
  return { db, cash, salary, food, fun, usd };
}

const debit = (accountId: string, amount: number): PostingInput => ({ accountId, side: 'debit', amount, amountBrl: amount });
const credit = (accountId: string, amount: number): PostingInput => ({ accountId, side: 'credit', amount, amountBrl: amount });

async function snapshot(db: Database) {
  return {
    t: await db.query('SELECT * FROM transactions ORDER BY id'),
    p: await db.query('SELECT * FROM postings ORDER BY id'),
  };
}

describe('transactions', () => {
  it('stores one credit and three debits and reads every amount back', async () => {
    const { db, cash, salary, food, fun } = await setup();
    const created = await createTransaction(db, {
      date: '2026-02-01',
      description: 'Split',
      postings: [credit(cash.id, 1000), debit(food.id, 400), debit(fun.id, 350), debit(salary.id, 250)],
    });
    const read = await getTransaction(db, created.id);
    expect(read?.postings.map((p) => [p.side, p.amount, p.amountBrl])).toEqual([
      ['credit', 1000, 1000],
      ['debit', 400, 400],
      ['debit', 350, 350],
      ['debit', 250, 250],
    ]);
    expect(await listTransactions(db)).toHaveLength(1);
  });

  it('rejects unbalanced create and update and leaves the database unchanged', async () => {
    const { db, cash, food } = await setup();
    const tx = await createTransaction(db, { date: '2026-02-01', description: 'ok', postings: [debit(food.id, 500), credit(cash.id, 500)] });
    const before = await snapshot(db);

    await expect(
      createTransaction(db, { date: '2026-02-02', description: 'bad', postings: [debit(food.id, 500), credit(cash.id, 499)] }),
    ).rejects.toThrow(/balance/);
    await expect(
      updateTransaction(db, tx.id, { date: '2026-02-03', description: 'bad', postings: [debit(food.id, 500), credit(cash.id, 1)] }),
    ).rejects.toThrow(/balance/);
    expect(await snapshot(db)).toEqual(before);
  });

  it('accepts an update that changes an amount and keeps the balance', async () => {
    const { db, cash, food } = await setup();
    const tx = await createTransaction(db, { date: '2026-02-01', description: 'ok', postings: [debit(food.id, 500), credit(cash.id, 500)] });
    const updated = await updateTransaction(db, tx.id, {
      date: '2026-02-05',
      description: 'changed',
      postings: [debit(food.id, 700), credit(cash.id, 700)],
    });
    expect(updated.date).toBe('2026-02-05');
    expect(updated.postings.map((p) => p.amountBrl)).toEqual([700, 700]);
  });

  it('deletes a transaction with all its postings', async () => {
    const { db, cash, food } = await setup();
    const tx = await createTransaction(db, { date: '2026-02-01', description: 'ok', postings: [debit(food.id, 500), credit(cash.id, 500)] });
    await deleteTransaction(db, tx.id);
    expect(await getTransaction(db, tx.id)).toBeNull();
    expect(await db.query('SELECT id FROM postings')).toEqual([]);
  });

  it('keeps every transaction balanced through a seeded random sequence of writes', async () => {
    const { db, cash, food, fun, salary } = await setup();
    const accounts = [cash.id, food.id, fun.id, salary.id];
    let seed = 42;
    const next = (n: number) => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed % n;
    };
    const randomPostings = (balanced: boolean): PostingInput[] => {
      const amounts = [1 + next(1000), 1 + next(1000)];
      const total = amounts[0] + amounts[1];
      const postings = [debit(accounts[next(4)], amounts[0]), debit(accounts[next(4)], amounts[1]), credit(accounts[next(4)], balanced ? total : total + 1)];
      return postings;
    };
    const ids: string[] = [];
    for (let i = 0; i < 80; i++) {
      const action = next(3);
      const balanced = next(4) !== 0;
      try {
        if (action === 0 || ids.length === 0) {
          ids.push((await createTransaction(db, { date: '2026-03-01', description: `t${i}`, postings: randomPostings(balanced) })).id);
        } else if (action === 1) {
          await updateTransaction(db, ids[next(ids.length)], { date: '2026-03-02', description: `u${i}`, postings: randomPostings(balanced) });
        } else {
          await deleteTransaction(db, ids.splice(next(ids.length), 1)[0]);
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/balance/);
      }
    }
    const bad = await db.query(
      `SELECT transaction_id FROM postings GROUP BY transaction_id
       HAVING SUM(CASE side WHEN 'debit' THEN amount_brl ELSE -amount_brl END) <> 0`,
    );
    expect(bad).toEqual([]);
    expect((await db.query('SELECT id FROM transactions')).length).toBe(ids.length);
  });

  it('enforces the BRL, foreign-currency, zero-amount and archived-account rules', async () => {
    const { db, cash, food, usd } = await setup();
    const tx = (postings: PostingInput[]) => createTransaction(db, { date: '2026-02-01', description: 'r', postings });

    await expect(tx([{ ...debit(food.id, 100), amountBrl: 101 }, credit(cash.id, 101)])).rejects.toThrow(/BRL posting/);
    await expect(tx([{ ...debit(food.id, 100), rate: 500000000 }, credit(cash.id, 100)])).rejects.toThrow(/rate/);

    await expect(tx([{ accountId: usd.id, side: 'debit', amount: 100, amountBrl: 500 }, credit(cash.id, 500)])).rejects.toThrow(/needs a positive rate/);
    const ok = await tx([{ accountId: usd.id, side: 'debit', amount: 100, rate: 500000000, amountBrl: 500 }, credit(cash.id, 500)]);
    expect(ok.postings[0].rate).toBe(500000000);

    const adjustment = await tx([{ accountId: usd.id, side: 'debit', amount: 0, amountBrl: 30 }, credit(cash.id, 30)]);
    expect(adjustment.postings[0].amount).toBe(0);
    await expect(tx([{ accountId: usd.id, side: 'debit', amount: 0, amountBrl: 0 }, debit(food.id, 5), credit(cash.id, 5)])).rejects.toThrow(/value adjustment/);

    await archiveAccount(db, food.id);
    await expect(tx([debit(food.id, 5), credit(cash.id, 5)])).rejects.toThrow(/archived/);
    await expect(tx([debit('missing', 5), credit(cash.id, 5)])).rejects.toThrow(/not found/);
  });

  it('filters by date range and account, and lists postings per account', async () => {
    const { db, cash, food, fun } = await setup();
    await createTransaction(db, { date: '2026-01-10', description: 'a', postings: [debit(food.id, 10), credit(cash.id, 10)] });
    await createTransaction(db, { date: '2026-02-10', description: 'b', postings: [debit(fun.id, 20), credit(cash.id, 20)] });
    expect((await listTransactions(db, { from: '2026-02-01' })).map((t) => t.description)).toEqual(['b']);
    expect((await listTransactions(db, { to: '2026-01-31' })).map((t) => t.description)).toEqual(['a']);
    expect((await listTransactions(db, { accountId: fun.id })).map((t) => t.description)).toEqual(['b']);
    expect((await listPostingsForAccount(db, cash.id)).map((p) => p.date)).toEqual(['2026-01-10', '2026-02-10']);
  });

  it('notifies on writes and reports balances', async () => {
    const { db, cash, food } = await setup();
    const listener = jest.fn();
    const unsubscribe = subscribeToDataChanges(listener);
    await createTransaction(db, { date: '2026-02-01', description: 'ok', postings: [debit(food.id, 500), credit(cash.id, 500)] });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    const balances = await listAccountsWithBalances(db);
    expect(balances.find((a) => a.id === cash.id)?.brl).toBe(-500);
    expect(balances.find((a) => a.id === food.id)?.brl).toBe(500);
  });
});

describe('rates', () => {
  it('replaces a rate for the same currency and date and returns the latest', async () => {
    const { db } = await setup();
    await addRate(db, { currency: 'USD', date: '2026-02-01', rate: 500000000 });
    await addRate(db, { currency: 'USD', date: '2026-02-01', rate: 510000000 });
    await addRate(db, { currency: 'USD', date: '2026-01-01', rate: 490000000 });
    expect(await listRates(db, 'USD')).toEqual([
      { currency: 'USD', date: '2026-02-01', rate: 510000000 },
      { currency: 'USD', date: '2026-01-01', rate: 490000000 },
    ]);
    expect(await latestRate(db, 'USD')).toEqual({ currency: 'USD', date: '2026-02-01', rate: 510000000 });
    expect(await latestRate(db, 'BTC')).toBeNull();
  });

  it('rejects BRL, unknown currencies and non-positive rates', async () => {
    const { db } = await setup();
    await expect(addRate(db, { currency: 'BRL', date: '2026-02-01', rate: 1 })).rejects.toThrow();
    await expect(addRate(db, { currency: 'XXX', date: '2026-02-01', rate: 1 })).rejects.toThrow();
    await expect(addRate(db, { currency: 'USD', date: '2026-02-01', rate: 0 })).rejects.toThrow();
  });
});
