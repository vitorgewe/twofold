import { buildStatement, type StatementPosting } from './statement';

const posting = (id: string, date: string, side: 'debit' | 'credit', amountBrl: number): StatementPosting => ({
  id,
  date,
  description: id,
  side,
  amount: amountBrl,
  amountBrl,
});

describe('buildStatement', () => {
  it('returns an empty list for no postings', () => {
    expect(buildStatement('asset', [])).toEqual([]);
  });

  it('accumulates the balance oldest to newest and lists newest first', () => {
    const rows = buildStatement('asset', [
      posting('a', '2026-01-01', 'debit', 20000),
      posting('b', '2026-01-02', 'credit', 5000),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
    expect(rows.map((r) => r.brl)).toEqual([-5000, 20000]);
    expect(rows.map((r) => r.balanceBrl)).toEqual([15000, 20000]);
  });

  it('keeps the given order for postings on the same date', () => {
    const rows = buildStatement('asset', [
      posting('first', '2026-03-01', 'debit', 1000),
      posting('second', '2026-03-01', 'debit', 2000),
      posting('third', '2026-03-01', 'credit', 500),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['third', 'second', 'first']);
    expect(rows.map((r) => r.balanceBrl)).toEqual([2500, 3000, 1000]);
  });

  it('treats credits as increases for liability and income accounts', () => {
    const rows = buildStatement('liability', [
      posting('a', '2026-01-01', 'credit', 8000),
      posting('b', '2026-01-02', 'debit', 3000),
    ]);
    expect(rows.map((r) => r.balanceBrl)).toEqual([5000, 8000]);
    expect(rows.map((r) => r.brl)).toEqual([-3000, 8000]);
  });

  it('keeps native zero for a value adjustment while the BRL balance moves', () => {
    const rows = buildStatement('asset', [{ ...posting('adj', '2026-01-01', 'debit', 20000), amount: 0 }]);
    expect(rows[0]).toMatchObject({ native: 0, brl: 20000, balanceBrl: 20000 });
  });

  it('never returns negative zero for a credit adjustment', () => {
    const rows = buildStatement('asset', [{ ...posting('adj', '2026-01-01', 'credit', 5000), amount: 0 }]);
    expect(Object.is(rows[0].native, 0)).toBe(true);
  });
});
