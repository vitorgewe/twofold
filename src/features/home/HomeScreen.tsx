import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHomeSummary } from '@/data/home';
import { BRL, BTC, USD } from '@/features/ledger/currency';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

import { BackupRow } from './BackupRow';

const CURRENCIES = { BRL, USD, BTC };

export function HomeScreen() {
  const router = useRouter();
  const { data: summary } = useHomeSummary();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {strings.home.title}
      </Text>

      <View style={styles.figures}>
        <View style={styles.figure}>
          <Text style={styles.label}>{strings.home.netWorth}</Text>
          {summary && <MoneyText brl={summary.netWorth} testID="net-worth" />}
        </View>
        <View style={styles.figure}>
          <Text style={styles.label}>{strings.home.monthResult}</Text>
          {summary && <MoneyText brl={summary.monthResult} testID="month-result" />}
        </View>
      </View>

      {summary && summary.balances.length > 0 && (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {strings.home.balances}
          </Text>
          {summary.balances.map((balance) => (
            <View key={balance.currency} style={styles.balanceRow}>
              <Text>{balance.currency}</Text>
              <MoneyText
                brl={balance.brl}
                currency={CURRENCIES[balance.currency as keyof typeof CURRENCIES] ?? BRL}
                native={balance.native}
              />
            </View>
          ))}
        </View>
      )}

      {summary && <BackupRow status={summary.backup} />}

      <Pressable accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={styles.button}>
        <Text style={styles.buttonText}>{strings.home.newTransaction}</Text>
      </Pressable>
      <Link href="/accounts" style={styles.link}>
        {strings.accounts.menu}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '600' },
  figures: { gap: 12 },
  figure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#111827' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { fontSize: 18, textDecorationLine: 'underline' },
});
