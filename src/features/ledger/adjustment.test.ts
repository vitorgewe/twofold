import { isBalanced } from './balance';
import { buildAdjustmentPostings, canAdjustValue, counterAccountType } from './adjustment';

const asset = { id: 'a', type: 'asset', currency: 'USD' } as const;
const liability = { id: 'l', type: 'liability', currency: 'USD' } as const;

describe('buildAdjustmentPostings', () => {
  it('asset up: debits the account with amount 0, credits the counter account', () => {
    const postings = buildAdjustmentPostings(asset, 20000, 'c');
    expect(postings).toEqual([
      { accountId: 'a', side: 'debit', amount: 0, amountBrl: 20000 },
      { accountId: 'c', side: 'credit', amount: 20000, amountBrl: 20000 },
    ]);
    expect(isBalanced(postings)).toBe(true);
    expect(counterAccountType(asset, 20000)).toBe('income');
  });

  it('asset down: credits the account, debits the counter account', () => {
    const postings = buildAdjustmentPostings(asset, -5000, 'c');
    expect(postings[0]).toEqual({ accountId: 'a', side: 'credit', amount: 0, amountBrl: 5000 });
    expect(postings[1]).toEqual({ accountId: 'c', side: 'debit', amount: 5000, amountBrl: 5000 });
    expect(isBalanced(postings)).toBe(true);
    expect(counterAccountType(asset, -5000)).toBe('expense');
  });

  it('liability up: credits the account, debits an expense', () => {
    const postings = buildAdjustmentPostings(liability, 700, 'c');
    expect(postings[0].side).toBe('credit');
    expect(postings[1].side).toBe('debit');
    expect(isBalanced(postings)).toBe(true);
    expect(counterAccountType(liability, 700)).toBe('expense');
  });

  it('liability down: debits the account, credits an income', () => {
    const postings = buildAdjustmentPostings(liability, -700, 'c');
    expect(postings[0].side).toBe('debit');
    expect(postings[1].side).toBe('credit');
    expect(isBalanced(postings)).toBe(true);
    expect(counterAccountType(liability, -700)).toBe('income');
  });

  it('rejects a zero change and accounts that cannot be adjusted', () => {
    expect(() => buildAdjustmentPostings(asset, 0, 'c')).toThrow();
    expect(() => buildAdjustmentPostings({ ...asset, currency: 'BRL' }, 100, 'c')).toThrow();
    expect(() => buildAdjustmentPostings({ ...asset, type: 'income' } as never, 100, 'c')).toThrow();
  });
});

describe('canAdjustValue', () => {
  it('is true only for foreign asset and liability accounts', () => {
    expect(canAdjustValue(asset)).toBe(true);
    expect(canAdjustValue(liability)).toBe(true);
    expect(canAdjustValue({ type: 'asset', currency: 'BRL' })).toBe(false);
    expect(canAdjustValue({ type: 'expense', currency: 'USD' })).toBe(false);
  });
});
