export type Currency = {
  code: string;
  name: string;
  decimals: number;
};

export const BRL: Currency = { code: 'BRL', name: 'Brazilian Real', decimals: 2 };
export const USD: Currency = { code: 'USD', name: 'US Dollar', decimals: 2 };
export const BTC: Currency = { code: 'BTC', name: 'Bitcoin', decimals: 8 };
