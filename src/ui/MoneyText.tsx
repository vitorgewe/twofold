import { StyleSheet, Text, View } from 'react-native';

import { BRL, type Currency } from '@/features/ledger/currency';
import { formatAmount } from '@/features/ledger/money';

/** "USD 12.00": the currency code, not its symbol, so the original amount is unambiguous. */
function formatOriginal(minor: number, currency: Currency): string {
  const digits = { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals };
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.code, currencyDisplay: 'code', ...digits })
    .format(minor / 10 ** currency.decimals)
    .replace(/\s/g, ' ');
}

type Props = {
  brl: number;
  /** The account's currency; the original amount is shown only when it is not BRL. */
  currency?: Currency;
  native?: number;
  testID?: string;
};

/** The BRL value is the main text; a foreign original amount sits below it, smaller and muted. */
export function MoneyText({ brl, currency = BRL, native, testID }: Props) {
  const foreign = currency.code !== BRL.code && native !== undefined;
  return (
    <View style={styles.container}>
      <Text style={styles.main} testID={testID}>
        {formatAmount(brl, BRL)}
      </Text>
      {foreign && <Text style={styles.original}>{formatOriginal(native, currency)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end' },
  main: { fontSize: 16, fontWeight: '600' },
  original: { fontSize: 12, color: '#6b7280' },
});
