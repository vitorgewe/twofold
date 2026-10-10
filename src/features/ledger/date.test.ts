import { isIsoDate } from './date';

describe('isIsoDate', () => {
  it('accepts real calendar dates, including leap days', () => {
    for (const d of ['2026-01-31', '2026-12-01', '2024-02-29', '2000-02-29']) expect(isIsoDate(d)).toBe(true);
  });

  it('rejects impossible dates and wrong shapes', () => {
    for (const d of ['2026-13-45', '2026-02-30', '2025-02-29', '1900-02-29', '2026-00-10', '2026-04-31', '2026-1-1', '2026-01-01T00:00', '']) {
      expect(isIsoDate(d)).toBe(false);
    }
  });
});
