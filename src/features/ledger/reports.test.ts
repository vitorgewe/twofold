import type { Account, AccountType } from '../../data/accounts';
import type { PostingSide } from './balance';
import { accountBalances, balancesByCurrency, incomeStatement, netWorth, type ReportPosting } from './reports';

const account = (id: string, type: AccountType, currency = 'BRL'): Account => ({
  id,
  name: id,
  type,
  currency,
  archived: false,
});

const posting = (
  accountId: string,
  side: PostingSide,
  amount: number,
  amountBrl = amount,
  date = '2026-10-10',
): ReportPosting => ({ accountId, side, amount, amountBrl, date });

const accounts = [
  account('Checking', 'asset'),
  account('USD', 'asset', 'USD'),
  account('BTC', 'asset', 'BTC'),
  account('Card', 'liability'),
  account('Opening', 'equity'),
  account('FX gain', 'income'),
  account('Groceries', 'expense'),
];

describe('reports', () => {
  it('opening balance gives net worth 500000 and result 0', () => {
    const postings = [posting('Checking', 'debit', 500000), posting('Opening', 'credit', 500000)];
    expect(netWorth(accounts, postings)).toBe(500000);
    expect(incomeStatement(postings, accounts, { from: '2026-10-01', to: '2026-10-31' }).result).toBe(0);
  });

  it('credit card spending gives net worth -30000 and result -30000', () => {
    const postings = [posting('Card', 'credit', 30000), posting('Groceries', 'debit', 30000)];
    expect(netWorth(accounts, postings)).toBe(-30000);
    const statement = incomeStatement(postings, accounts, { from: '2026-10-01', to: '2026-10-31' });
    expect(statement.totalExpenses).toBe(30000);
    expect(statement.result).toBe(-30000);
  });

  it('a USD purchase leaves net worth unchanged and a manual adjustment raises it by exactly the gain', () => {
    const opening = [posting('Checking', 'debit', 500000), posting('Opening', 'credit', 500000)];
    const buy = [posting('USD', 'debit', 100000, 500000), posting('Checking', 'credit', 500000)];
    const adjust = [posting('USD', 'debit', 0, 20000), posting('FX gain', 'credit', 20000)];

    expect(netWorth(accounts, [...opening, ...buy])).toBe(500000);
    const all = [...opening, ...buy, ...adjust];
    expect(netWorth(accounts, all)).toBe(520000);
    expect(incomeStatement(all, accounts, { from: '2026-10-01', to: '2026-10-31' }).totalIncome).toBe(20000);
    const usd = accountBalances(accounts, all).find((b) => b.accountId === 'USD');
    expect(usd).toEqual({ accountId: 'USD', native: 100000, brl: 520000 });
  });

  it('excludes postings outside the period and includes both boundary dates', () => {
    const postings = [
      posting('Groceries', 'debit', 1, 1, '2026-09-30'),
      posting('Groceries', 'debit', 10, 10, '2026-10-01'),
      posting('Groceries', 'debit', 100, 100, '2026-10-31'),
      posting('Groceries', 'debit', 1000, 1000, '2026-11-01'),
    ];
    const statement = incomeStatement(postings, accounts, { from: '2026-10-01', to: '2026-10-31' });
    expect(statement.totalExpenses).toBe(110);
  });

  it('groups native balances by currency', () => {
    const postings = [
      posting('Checking', 'debit', 500000),
      posting('USD', 'debit', 100000, 500000),
      posting('BTC', 'debit', 25000000, 1000000),
      posting('Card', 'credit', 30000),
    ];
    expect(balancesByCurrency(accounts, postings)).toEqual({
      BRL: 470000,
      USD: 100000,
      BTC: 25000000,
    });
  });
});
