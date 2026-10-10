import { groupByDate, totalBrl } from './group';

describe('groupByDate', () => {
  it('groups consecutive items of the same date and keeps the order', () => {
    const items = [
      { date: '2026-10-03', n: 1 },
      { date: '2026-10-03', n: 2 },
      { date: '2026-09-30', n: 3 },
    ];
    expect(groupByDate(items)).toEqual([
      { date: '2026-10-03', items: [items[0], items[1]] },
      { date: '2026-09-30', items: [items[2]] },
    ]);
  });

  it('returns no groups for no items', () => {
    expect(groupByDate([])).toEqual([]);
  });
});

describe('totalBrl', () => {
  it('sums the debit side only', () => {
    expect(
      totalBrl([
        { side: 'debit', amountBrl: 6000 },
        { side: 'debit', amountBrl: 4000 },
        { side: 'credit', amountBrl: 10000 },
      ]),
    ).toBe(10000);
  });
});
