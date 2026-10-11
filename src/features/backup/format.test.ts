import { backupFileName, parseBackup, serializeBackup, validateBackup, type Backup } from './format';

const good = (): Backup => ({
  format_version: 1,
  exported_at: '2026-10-11T10:00:00.000Z',
  currencies: [
    { code: 'BRL', name: 'Brazilian Real', decimals: 2 },
    { code: 'USD', name: 'US Dollar', decimals: 2 },
  ],
  accounts: [
    { id: 'a1', name: 'Cash', type: 'asset', currency: 'BRL', archived: false },
    { id: 'a2', name: 'Food', type: 'expense', currency: 'BRL', archived: false },
    { id: 'a3', name: 'Dollars', type: 'asset', currency: 'USD', archived: false },
  ],
  transactions: [{ id: 't1', date: '2026-10-01', description: 'Lunch' }],
  postings: [
    { id: 'p1', transaction_id: 't1', account_id: 'a1', side: 'credit', amount: 5000, rate: null, amount_brl: 5000 },
    { id: 'p2', transaction_id: 't1', account_id: 'a2', side: 'debit', amount: 5000, rate: null, amount_brl: 5000 },
  ],
  rates: [{ currency: 'USD', date: '2026-10-01', rate_scaled: 520000000 }],
});

const errorsOf = (input: unknown): string[] => {
  const result = validateBackup(input);
  return result.ok ? [] : result.errors;
};

describe('validateBackup', () => {
  it('accepts a good backup and counts its records', () => {
    const result = validateBackup(good());
    expect(result).toMatchObject({ ok: true, counts: { accounts: 3, transactions: 1, postings: 2, rates: 1 } });
  });

  it('survives serialize and parse', () => {
    expect(parseBackup(serializeBackup(good()))).toMatchObject({ ok: true, backup: good() });
  });

  it('rejects text that is not JSON', () => {
    expect(parseBackup('nope')).toEqual({ ok: false, errors: ['The file is not valid JSON.'] });
  });

  it('rejects an unknown format_version', () => {
    expect(errorsOf({ ...good(), format_version: 2 })[0]).toMatch(/format_version/);
    expect(errorsOf({ ...good(), format_version: undefined })[0]).toMatch(/format_version/);
  });

  it('rejects a posting amount changed by 1', () => {
    const backup = good();
    backup.postings[1] = { ...backup.postings[1], amount: 5001, amount_brl: 5001 };
    expect(errorsOf(backup).join(' ')).toMatch(/does not balance/);
  });

  it('rejects a posting whose BRL value no longer matches its amount', () => {
    const backup = good();
    backup.postings[1] = { ...backup.postings[1], amount: 5001 };
    expect(errorsOf(backup).join(' ')).toMatch(/BRL account/);
  });

  it('rejects a foreign posting whose BRL value does not match amount times rate', () => {
    const backup = good();
    backup.postings = [
      { id: 'p1', transaction_id: 't1', account_id: 'a3', side: 'debit', amount: 1000, rate: 520000000, amount_brl: 5300 },
      { id: 'p2', transaction_id: 't1', account_id: 'a1', side: 'credit', amount: 5300, rate: null, amount_brl: 5300 },
    ];
    expect(errorsOf(backup).join(' ')).toMatch(/amount times rate/);
  });

  it('rejects broken references', () => {
    const backup = good();
    backup.postings[0] = { ...backup.postings[0], account_id: 'ghost' };
    backup.postings[1] = { ...backup.postings[1], transaction_id: 'ghost' };
    const text = errorsOf(backup).join(' ');
    expect(text).toMatch(/missing account/);
    expect(text).toMatch(/missing transaction/);
  });

  it('rejects an account with an unknown currency and a rate for one', () => {
    const backup = good();
    backup.accounts[0] = { ...backup.accounts[0], currency: 'EUR' };
    backup.rates[0] = { ...backup.rates[0], currency: 'EUR' };
    const text = errorsOf(backup).join(' ');
    expect(text).toMatch(/unknown currency EUR/);
    expect(text).toMatch(/Rate for unknown currency/);
  });

  it('rejects duplicate ids and a missing table', () => {
    const backup = good();
    backup.accounts.push({ ...backup.accounts[0] });
    expect(errorsOf(backup).join(' ')).toMatch(/Duplicate account/);
    expect(errorsOf({ ...good(), rates: undefined }).join(' ')).toMatch(/"rates" must be a list/);
  });

  it('rejects a transaction with no postings', () => {
    const backup = good();
    backup.postings = [];
    expect(errorsOf(backup).join(' ')).toMatch(/at least two postings/);
  });
});

describe('backupFileName', () => {
  it('uses the local calendar date', () => {
    expect(backupFileName(new Date(2026, 9, 5, 23, 30))).toBe('twofold-backup-2026-10-05.json');
  });
});
