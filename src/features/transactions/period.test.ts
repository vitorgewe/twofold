import { periodFor, yearPeriod } from './period';

describe('periodFor', () => {
  it('"month" spans the first to the last day of the month', () => {
    expect(periodFor('month', new Date(2026, 9, 11))).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(periodFor('month', new Date(2026, 3, 30))).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  it('"month" ends on the 29th in a leap February and the 28th otherwise', () => {
    expect(periodFor('month', new Date(2024, 1, 10)).to).toBe('2024-02-29');
    expect(periodFor('month', new Date(2026, 1, 10)).to).toBe('2026-02-28');
  });

  it('"month" covers the first and the last day of the month themselves', () => {
    expect(periodFor('month', new Date(2026, 11, 1))).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(periodFor('month', new Date(2026, 11, 31))).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });

  it('"year" spans January 1st to December 31st', () => {
    expect(periodFor('year', new Date(2026, 5, 15))).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(yearPeriod(new Date(2026, 0, 1))).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(yearPeriod(new Date(2026, 11, 31))).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('"all" has no bounds', () => {
    expect(periodFor('all', new Date(2026, 5, 15))).toEqual({});
  });
});
