import { balanceDifference, isBalanced, type PostingDraft, type PostingSide } from '../ledger/balance';
import { BRL, BTC, USD, type Currency } from '../ledger/currency';
import { parseAmount, parseRate, toBrl } from '../ledger/money';

const CURRENCIES: Record<string, Currency> = { BRL, USD, BTC };

export type PostingRow = {
  key: number;
  accountId: string | null;
  side: PostingSide;
  amountText: string;
  rateText: string;
  /** What the user typed over the computed BRL value; null while the computed value is used. */
  brlText: string | null;
};

export type RowResult = {
  currency: Currency | null;
  amount: number | null;
  rate: number | null;
  amountBrl: number | null;
  amountError: boolean;
  rateError: boolean;
  brlError: boolean;
  complete: boolean;
};

export const emptyRow = (key: number): PostingRow => ({
  key,
  accountId: null,
  side: 'debit',
  amountText: '',
  rateText: '',
  brlText: null,
});

export const currencyOf = (code: string): Currency | null => CURRENCIES[code] ?? null;

/** Parses text with `parse`; null when empty, malformed or not positive. */
function positive(text: string, parse: (text: string) => number): { value: number | null; error: boolean } {
  if (text.trim() === '') return { value: null, error: false };
  try {
    const value = parse(text);
    return value > 0 ? { value, error: false } : { value: null, error: true };
  } catch {
    return { value: null, error: true };
  }
}

/** Plain decimal text for centavos, such as "520.00". */
export function formatBrlPlain(centavos: number): string {
  const abs = Math.abs(centavos);
  const text = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  return centavos < 0 ? `-${text}` : text;
}

/** Works out the typed values of one row; `currencyCode` is the currency of its account, if one is chosen. */
export function evaluateRow(row: PostingRow, currencyCode: string | null): RowResult {
  const currency = currencyCode ? currencyOf(currencyCode) : null;
  const blank: RowResult = {
    currency,
    amount: null,
    rate: null,
    amountBrl: null,
    amountError: false,
    rateError: false,
    brlError: false,
    complete: false,
  };
  if (!currency) return blank;

  const amount = positive(row.amountText, (t) => parseAmount(t, currency));
  if (currency.code === BRL.code) {
    return { ...blank, amount: amount.value, amountBrl: amount.value, amountError: amount.error, complete: amount.value !== null };
  }

  const rate = positive(row.rateText, parseRate);
  let amountBrl: number | null = null;
  let brlError = false;
  if (row.brlText !== null) {
    const typed = positive(row.brlText, (t) => parseAmount(t, BRL));
    amountBrl = typed.value;
    brlError = typed.error || (row.brlText.trim() === '' && amount.value !== null);
  } else if (amount.value !== null && rate.value !== null) {
    try {
      amountBrl = toBrl(amount.value, currency, rate.value);
    } catch {
      brlError = true;
    }
    if (amountBrl === 0) {
      amountBrl = null;
      brlError = true;
    }
  }
  return {
    currency,
    amount: amount.value,
    rate: rate.value,
    amountBrl,
    amountError: amount.error,
    rateError: rate.error,
    brlError,
    complete: amount.value !== null && rate.value !== null && amountBrl !== null,
  };
}

export type Summary = { debits: number; credits: number; difference: number };

/** Totals of the postings that are complete so far, in centavos. */
export function summarize(postings: readonly PostingDraft[]): Summary {
  const sum = (side: PostingSide) => postings.filter((p) => p.side === side).reduce((s, p) => s + p.amountBrl, 0);
  return { debits: sum('debit'), credits: sum('credit'), difference: balanceDifference(postings) };
}

export { isBalanced };
