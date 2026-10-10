export type Currency = {
  code: string;
  name: string;
  decimals: number;
};

export const BRL: Currency = { code: 'BRL', name: 'Brazilian Real', decimals: 2 };
export const USD: Currency = { code: 'USD', name: 'US Dollar', decimals: 2 };
export const BTC: Currency = { code: 'BTC', name: 'Bitcoin', decimals: 8 };

export const CURRENCIES: readonly Currency[] = [BRL, USD, BTC];

/** The known currency for a code; undefined for an unknown code. */
export const currencyOf = (code: string): Currency | undefined => CURRENCIES.find((c) => c.code === code);
