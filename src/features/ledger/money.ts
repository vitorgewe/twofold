import { BRL, type Currency } from './currency';

export const RATE_SCALE = 100_000_000;
const RATE_DECIMALS = 8;

const DECIMAL_PATTERN = /^(\d+)(?:\.(\d+))?$/;

/**
 * Makes typed text parseable: a single comma is read as the decimal separator ("12,50" -> "12.50", the pt-BR
 * keyboard). Text with both separators ("1.234,56") or several commas is left as it is, so parsing rejects it.
 */
export function normalizeDecimalInput(text: string): string {
  const trimmed = text.trim();
  const commas = trimmed.split(',').length - 1;
  return commas === 1 && !trimmed.includes('.') ? trimmed.replace(',', '.') : trimmed;
}

function parseScaled(text: string, decimals: number, what: string): bigint {
  const match = DECIMAL_PATTERN.exec(text.trim());
  if (!match) {
    throw new Error(`Invalid ${what}: "${text}"`);
  }
  const whole = match[1];
  const fraction = match[2] ?? '';
  if (fraction.length > decimals) {
    throw new Error(`Invalid ${what}: "${text}" has more than ${decimals} fraction digits`);
  }
  return BigInt(whole + fraction.padEnd(decimals, '0'));
}

function toSafeNumber(value: bigint, what: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${what} is too large to represent exactly`);
  }
  return Number(value);
}

/** Parses non-negative decimal text into integer minor units. The sign belongs to the posting side. */
export function parseAmount(text: string, currency: Currency): number {
  return toSafeNumber(parseScaled(text, currency.decimals, 'amount'), 'Amount');
}

/** Parses a rate such as "5.1234" into an integer scaled by RATE_SCALE. */
export function parseRate(text: string): number {
  return toSafeNumber(parseScaled(text, RATE_DECIMALS, 'rate'), 'Rate');
}

export function formatAmount(minor: number, currency: Currency, locale?: string): string {
  const value = minor / 10 ** currency.decimals;
  const digits = { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals };
  try {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currency.code, ...digits });
    const symbol = formatter.formatToParts(value).find((part) => part.type === 'currency')?.value;
    if (symbol && symbol !== currency.code) {
      return formatter.format(value);
    }
  } catch {
    // Not an ISO currency code: fall through to number plus code.
  }
  return `${new Intl.NumberFormat(locale, digits).format(value)} ${currency.code}`;
}

/** Converts an amount to BRL centavos, rounding half away from zero. */
export function toBrl(amountMinor: number, currency: Currency, rateScaled: number): number {
  if (!Number.isSafeInteger(amountMinor) || !Number.isSafeInteger(rateScaled)) {
    throw new Error('Amount and rate must be integers');
  }
  if (currency.code === BRL.code) {
    return amountMinor;
  }
  const numerator = BigInt(amountMinor) * BigInt(rateScaled) * 10n ** BigInt(BRL.decimals);
  const denominator = 10n ** BigInt(currency.decimals) * BigInt(RATE_SCALE);
  const negative = numerator < 0n;
  const abs = negative ? -numerator : numerator;
  const rounded = (2n * abs + denominator) / (2n * denominator);
  return toSafeNumber(negative ? -rounded : rounded, 'BRL value');
}
