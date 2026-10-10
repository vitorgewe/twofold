import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAccountStatement } from '@/data/transactions';
import { BRL, BTC, USD } from '@/features/ledger/currency';
import type { StatementRow } from '@/features/ledger/statement';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

const CURRENCIES = { BRL, USD, BTC };

export function StatementScreen({ accountId }: { accountId: string }) {
  const { data: statement, loading } = useAccountStatement(accountId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/accounts" accessibilityRole="link" style={styles.back}>
        {strings.accounts.statement.back}
      </Link>

      {loading && !statement ? null : statement === null || statement === undefined ? (
        <View style={styles.notice}>
          <Text accessibilityRole="header" style={styles.noticeTitle}>
            {strings.accounts.statement.notFoundTitle}
          </Text>
          <Text>{strings.accounts.statement.notFoundBody}</Text>
        </View>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.title}>
            {statement.account.name}
          </Text>

          {statement.rows.length === 0 ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>{strings.accounts.statement.emptyTitle}</Text>
              <Text>{strings.accounts.statement.emptyBody}</Text>
            </View>
          ) : (
            statement.rows.map((row) => (
              <Row key={row.id} row={row} currencyCode={statement.account.currency} />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function Row({ row, currencyCode }: { row: StatementRow; currencyCode: string }) {
  const currency = CURRENCIES[currencyCode as keyof typeof CURRENCIES] ?? BRL;
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.description}>
          <Text style={styles.date}>{row.date}</Text>
          <Text>{row.description}</Text>
        </View>
        <View style={styles.amount}>
          {row.brl > 0 && <Text style={styles.plus}>+</Text>}
          <MoneyText brl={row.brl} currency={currency} native={row.native} />
        </View>
      </View>
      <View style={styles.balanceLine}>
        <Text style={styles.muted}>{strings.accounts.statement.balance}</Text>
        <MoneyText brl={row.balanceBrl} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  back: { fontSize: 14, color: '#1d4ed8' },
  title: { fontSize: 28, fontWeight: '600' },
  notice: { gap: 4, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  noticeTitle: { fontWeight: '600' },
  row: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  description: { flexShrink: 1 },
  date: { fontSize: 12, color: '#6b7280' },
  amount: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  plus: { fontSize: 16, fontWeight: '600' },
  balanceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: 12, color: '#6b7280' },
});
