import { BRL, BTC, USD } from './currency';
import { RATE_SCALE, formatAmount, normalizeDecimalInput, parseAmount, parseRate, toBrl } from './money';

describe('parseAmount', () => {
  it('parses to minor units', () => {
    expect(parseAmount('300.00', BRL)).toBe(30000);
    expect(parseAmount('1234.56', BRL)).toBe(123456);
    expect(parseAmount('1234', BRL)).toBe(123400);
    expect(parseAmount('0.00500000', BTC)).toBe(500000);
    expect(parseAmount('0.005', BTC)).toBe(500000);
  });

  it.each(['', '  ', 'abc', '1,5', '-5', '+5', '1.234', '1.', '.5'])('throws on %p for BRL', (text) => {
    expect(() => parseAmount(text, BRL)).toThrow();
  });
});

describe('parseRate', () => {
  it('scales by 10^8', () => {
    expect(RATE_SCALE).toBe(100_000_000);
    expect(parseRate('5.1234')).toBe(512340000);
    expect(parseRate('350000')).toBe(35_000_000_000_000);
  });

  it('throws on more than 8 fraction digits', () => {
    expect(() => parseRate('1.123456789')).toThrow();
    expect(() => parseRate('-1')).toThrow();
  });
});

describe('toBrl', () => {
  it('converts BTC', () => {
    expect(toBrl(500000, BTC, parseRate('350000'))).toBe(175000);
  });

  it('converts USD', () => {
    expect(toBrl(100000, USD, parseRate('5.1234'))).toBe(512340);
  });

  it('rounds half away from zero', () => {
    expect(toBrl(1, USD, parseRate('5.5'))).toBe(6);
    expect(toBrl(-1, USD, parseRate('5.5'))).toBe(-6);
    expect(toBrl(1, USD, parseRate('5.4'))).toBe(5);
  });

  it('stays exact for large values', () => {
    expect(toBrl(2100000000000000, BTC, parseRate('350000'))).toBe(735000000000000);
  });

  it('returns BRL unchanged', () => {
    expect(toBrl(12345, BRL, parseRate('9'))).toBe(12345);
  });

  it('throws when the result is not a safe integer', () => {
    expect(() => toBrl(2100000000000000, BTC, parseRate('5000000'))).toThrow();
  });
});

describe('formatAmount', () => {
  it('formats BRL with its symbol', () => {
    expect(formatAmount(30000, BRL, 'en-US')).toBe('R$300.00');
  });

  it('formats currencies without an Intl symbol as number and code', () => {
    expect(formatAmount(500000, BTC, 'en-US')).toBe('0.00500000 BTC');
  });
});

describe('normalizeDecimalInput', () => {
  it('reads a single comma as the decimal separator', () => {
    expect(parseAmount(normalizeDecimalInput('12,50'), BRL)).toBe(1250);
    expect(parseAmount(normalizeDecimalInput('12.50'), BRL)).toBe(1250);
    expect(parseAmount(normalizeDecimalInput(' 0,5 '), BRL)).toBe(50);
    expect(parseAmount(normalizeDecimalInput('0,00000001'), BTC)).toBe(1);
    expect(parseRate(normalizeDecimalInput('5,2'))).toBe(520_000_000);
  });

  it('leaves mixed or repeated separators for parsing to reject', () => {
    for (const text of ['1.234,56', '1,234.5', '1,2,3']) {
      expect(() => parseAmount(normalizeDecimalInput(text), BRL)).toThrow();
    }
  });
});
