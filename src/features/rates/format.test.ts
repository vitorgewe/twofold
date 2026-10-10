import { daysBetween, formatRate, todayIso } from './format';

describe('formatRate', () => {
  it('drops trailing zeros but keeps two decimals', () => {
    expect(formatRate(512340000)).toBe('5.1234');
    expect(formatRate(520000000)).toBe('5.20');
    expect(formatRate(35_000_000_000_000)).toBe('350000.00');
    expect(formatRate(1)).toBe('0.00000001');
  });
});

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-10-08', '2026-10-11')).toBe(3);
    expect(daysBetween('2026-10-11', '2026-10-11')).toBe(0);
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    expect(daysBetween('2026-10-12', '2026-10-11')).toBe(-1);
  });
});

describe('todayIso', () => {
  it('formats the local date', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
