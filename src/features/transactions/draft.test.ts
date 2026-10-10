import { emptyRow, evaluateRow } from './draft';

describe('evaluateRow with pt-BR input', () => {
  it('accepts a comma as the decimal separator in amount, rate and BRL override', () => {
    const row = { ...emptyRow(1), amountText: '100,00', rateText: '5,2' };
    const result = evaluateRow(row, 'USD');
    expect(result).toMatchObject({ amount: 10000, rate: 520_000_000, amountBrl: 52000, complete: true });
    expect(evaluateRow({ ...row, brlText: '520,01' }, 'USD').amountBrl).toBe(52001);
    expect(evaluateRow({ ...emptyRow(2), amountText: '12,50' }, 'BRL').amount).toBe(1250);
  });

  it('flags an amount that mixes both separators', () => {
    expect(evaluateRow({ ...emptyRow(1), amountText: '1.234,56' }, 'BRL')).toMatchObject({ amount: null, amountError: true });
  });
});
