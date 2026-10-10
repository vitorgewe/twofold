import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAccountsWithBalances, useTransaction } from '@/data/transactions';
import { BRL, BTC, USD } from '@/features/ledger/currency';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

const t = strings.transactions;
const CURRENCIES = { BRL, USD, BTC };

export function TransactionDetailScreen({ transactionId }: { transactionId: string }) {
  const { data: transaction, loading } = useTransaction(transactionId);
  const { data: accounts } = useAccountsWithBalances({ includeArchived: true });
  const byId = new Map((accounts ?? []).map((a) => [a.id, a]));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/transactions" accessibilityRole="link" style={styles.back}>
        {t.detailBack}
      </Link>

      {loading && !transaction ? null : !transaction ? (
        <View style={styles.notice}>
          <Text accessibilityRole="header" style={styles.noticeTitle}>
            {t.notFoundTitle}
          </Text>
          <Text>{t.notFoundBody}</Text>
        </View>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.title}>
            {transaction.description}
          </Text>
          <Text style={styles.muted}>{transaction.date}</Text>

          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t.detailPostings}
          </Text>
          {transaction.postings.map((p) => {
            const account = byId.get(p.accountId);
            return (
              <View key={p.id} testID="posting" style={styles.row}>
                <View style={styles.rowText}>
                  <Text>{account?.name ?? p.accountId}</Text>
                  <Text style={styles.muted}>{p.side === 'debit' ? t.debit : t.credit}</Text>
                </View>
                <MoneyText
                  brl={p.amountBrl}
                  currency={CURRENCIES[(account?.currency ?? 'BRL') as keyof typeof CURRENCIES] ?? BRL}
                  native={p.amount}
                />
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  back: { fontSize: 14, color: '#1d4ed8' },
  title: { fontSize: 28, fontWeight: '600' },
  muted: { fontSize: 12, color: '#6b7280' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  notice: { gap: 4, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  noticeTitle: { fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowText: { flexShrink: 1 },
});
