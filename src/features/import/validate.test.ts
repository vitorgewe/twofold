import { parseCsv } from './csv';
import { planImport, type ExistingAccount } from './validate';

const HEADER = 'transaction_id,date,description,account,account_type,side,amount,currency,rate_to_brl';
const EXAMPLE = [
  't-0001,2026-09-05,Supermarket,Checking,asset,credit,300.00,BRL,',
  't-0001,2026-09-05,Supermarket,Groceries,expense,debit,300.00,BRL,',
  't-0002,2026-09-06,Buy BTC,Crypto,asset,debit,0.00500000,BTC,350000',
  't-0002,2026-09-06,Buy BTC,Checking,asset,credit,1750.00,BRL,',
];

function plan(lines: string[], accounts: Record<string, ExistingAccount> = {}, existing: string[] = []) {
  const parsed = parseCsv([HEADER, ...lines].join('\n'));
  if (!parsed.ok) throw new Error(parsed.errors.join('; '));
  return planImport(parsed.rows, new Map(Object.entries(accounts)), new Set(existing));
}

describe('planImport', () => {
  it('plans the spec example: 3 accounts, 2 transactions, BTC converted to BRL', () => {
    const result = plan(EXAMPLE);
    expect(result.errors).toEqual([]);
    expect(result.accountsToCreate.map((a) => `${a.name}:${a.type}:${a.currency}`)).toEqual([
      'Checking:asset:BRL',
      'Groceries:expense:BRL',
      'Crypto:asset:BTC',
    ]);
    expect(result.newTransactions).toHaveLength(2);
    expect(result.postingCount).toBe(4);
    const btc = result.newTransactions[1].postings[0];
    expect(btc).toMatchObject({ amount: 500000, rate: 350000 * 1e8, amountBrl: 175000 });
  });

  it('skips transactions that already exist and creates no account for them', () => {
    const result = plan(EXAMPLE, { checking: { type: 'asset', currency: 'BRL' } }, ['t-0001']);
    expect(result.errors).toEqual([]);
    expect(result.existingCount).toBe(1);
    expect(result.newTransactions.map((t) => t.externalId)).toEqual(['t-0002']);
    expect(result.accountsToCreate.map((a) => a.name)).toEqual(['Crypto']);
  });

  it('does not plan a row that fails after the error cap', () => {
    const junk = Array.from({ length: 60 }, () => 'junk,2026-13-40,Junk,Checking,asset,debit,1.00,BRL,');
    const result = plan([
      ...junk,
      'late,2026-13-40,Late,Checking,asset,debit,1.00,BRL,',
      'late,2026-13-40,Late,Food,expense,credit,1.00,BRL,',
    ]);
    expect(result.errors.length).toBe(50);
    expect(result.newTransactions).toEqual([]);
    expect(result.postingCount).toBe(0);
  });

  it('accepts one credit and three debits', () => {
    const result = plan([
      's-1,2026-09-10,Dinner,Checking,asset,credit,100.00,BRL,',
      's-1,2026-09-10,Dinner,A,expense,debit,60.00,BRL,',
      's-1,2026-09-10,Dinner,B,expense,debit,30.00,BRL,',
      's-1,2026-09-10,Dinner,C,expense,debit,10.00,BRL,',
    ]);
    expect(result.errors).toEqual([]);
    expect(result.newTransactions[0].postings).toHaveLength(4);
  });

  it('rejects a transaction that lost a row, naming it and its line', () => {
    const result = plan(EXAMPLE.slice(0, 3));
    expect(result.errors).toEqual([expect.stringMatching(/^Line 4: transaction t-0002: .*at least two postings/)]);
  });

  it('rejects a transaction that does not balance after conversion', () => {
    const result = plan([
      't-1,2026-09-06,Buy BTC,Crypto,asset,debit,0.00500000,BTC,350000',
      't-1,2026-09-06,Buy BTC,Checking,asset,credit,1750.01,BRL,',
    ]);
    expect(result.errors).toEqual([expect.stringContaining('Line 2: transaction t-1: Transaction does not balance')]);
  });

  it('rejects a foreign row without a rate and a BRL row with one', () => {
    const result = plan([
      't-1,2026-09-06,x,Crypto,asset,debit,0.00500000,BTC,',
      't-1,2026-09-06,x,Checking,asset,credit,10.00,BRL,2',
    ]);
    expect(result.errors).toEqual([
      'Line 2: rate_to_brl is required for BTC rows.',
      'Line 3: rate_to_brl must be empty for BRL rows.',
    ]);
  });

  it('rejects a zero amount on a foreign-currency row, naming its line', () => {
    const result = plan([
      't-1,2026-09-06,x,Crypto,asset,debit,0.00000000,BTC,350000',
      't-1,2026-09-06,x,Checking,asset,credit,0.00,BRL,',
    ]);
    expect(result.errors).toEqual(['Line 2: a zero amount is not allowed for BTC rows.']);
    expect(result.newTransactions).toEqual([]);
  });

  it('rejects too many decimals, bad dates, sides, currencies and amounts', () => {
    const result = plan([
      't-1,2026-02-30,x,Checking,asset,credit,10.001,BRL,',
      't-1,2026-02-30,x,Food,expense,sideways,10.00,BRL,',
      't-1,2026-02-30,x,Food,expense,debit,-1,BRL,',
      't-1,2026-02-30,x,Food,expense,debit,1.00,EUR,',
    ]);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Line 2: date "2026-02-30" must be a real date as YYYY-MM-DD.',
        expect.stringContaining('Line 2: Invalid amount: "10.001" has more than 2 fraction digits'),
        'Line 3: side "sideways" must be debit or credit.',
        expect.stringContaining('Line 4: Invalid amount: "-1"'),
        'Line 5: currency "EUR" is not supported.',
      ]),
    );
  });

  it('keeps one type and one currency per account across the file', () => {
    const result = plan([
      't-1,2026-09-06,x,Checking,asset,credit,10.00,BRL,',
      't-1,2026-09-06,x,Food,expense,debit,10.00,BRL,',
      't-2,2026-09-06,y,Checking,liability,credit,1.00,BRL,',
      't-2,2026-09-06,y,Food,expense,debit,1.00,USD,5',
    ]);
    expect(result.errors).toEqual([
      'Line 4: account "Checking" is asset elsewhere in the file but liability here.',
      'Line 5: account "Food" is in BRL elsewhere in the file but USD here.',
    ]);
  });

  it('requires account_type for a new account and checks existing ones', () => {
    const lines = [
      't-1,2026-09-06,x,Checking,,credit,10.00,BRL,',
      't-1,2026-09-06,x,Food,,debit,10.00,BRL,',
    ];
    expect(plan(lines).errors).toEqual([
      'Line 2: account "Checking" does not exist yet, so account_type is required.',
      'Line 3: account "Food" does not exist yet, so account_type is required.',
    ]);
    const known = { checking: { type: 'asset', currency: 'BRL' }, food: { type: 'expense', currency: 'USD' } } as const;
    const result = plan(lines, known);
    expect(result.errors).toEqual(['Line 3: account "Food" exists in USD, the file uses BRL.']);
  });

  it('rejects rows of one transaction that disagree on date or description', () => {
    const result = plan([
      't-1,2026-09-06,x,Checking,asset,credit,10.00,BRL,',
      't-1,2026-09-07,y,Food,expense,debit,10.00,BRL,',
    ]);
    expect(result.errors).toEqual([
      'Line 3: date differs from line 2 for the same transaction_id.',
      'Line 3: description differs from line 2 for the same transaction_id.',
    ]);
  });
});
