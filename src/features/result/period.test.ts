import { lastMonthPeriod, resultPeriodFor } from './period';

describe('lastMonthPeriod', () => {
  it('looks back to December of the previous year in January', () => {
    expect(lastMonthPeriod(new Date(2026, 0, 15))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('ends on the 29th when last month is a leap February, and on the 28th otherwise', () => {
    expect(lastMonthPeriod(new Date(2024, 2, 1))).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(lastMonthPeriod(new Date(2026, 2, 31))).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('handles the first and the last day of the current month the same way', () => {
    expect(lastMonthPeriod(new Date(2026, 9, 1))).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(lastMonthPeriod(new Date(2026, 9, 31))).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('works from a 31-day month into a 30-day one', () => {
    expect(lastMonthPeriod(new Date(2026, 4, 31))).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });
});

describe('resultPeriodFor', () => {
  const now = new Date(2024, 1, 29);

  it('"month" is the current month, leap day included', () => {
    expect(resultPeriodFor('month', now)).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });

  it('"lastMonth" is the month before', () => {
    expect(resultPeriodFor('lastMonth', now)).toEqual({ from: '2024-01-01', to: '2024-01-31' });
  });

  it('"year" spans January 1st to December 31st', () => {
    expect(resultPeriodFor('year', now)).toEqual({ from: '2024-01-01', to: '2024-12-31' });
    expect(resultPeriodFor('year', new Date(2026, 11, 31))).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});
