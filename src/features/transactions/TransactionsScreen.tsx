import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAccountsWithBalances, useTransactions } from '@/data/transactions';
import { isIsoDate } from '@/features/ledger/date';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

import { groupByDate, totalBrl } from './group';
import { periodFor, type PeriodChoice } from './period';

const t = strings.transactions;
const CHOICES: { choice: PeriodChoice; label: string }[] = [
  { choice: 'month', label: t.periodThisMonth },
  { choice: 'year', label: t.periodThisYear },
  { choice: 'all', label: t.periodAll },
];

export function TransactionsScreen() {
  const [choice, setChoice] = useState<PeriodChoice | null>('all');
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const period = choice ? periodFor(choice, new Date()) : {};
  const from = choice ? period.from : isIsoDate(fromText) ? fromText : undefined;
  const to = choice ? period.to : isIsoDate(toText) ? toText : undefined;

  const { data: transactions } = useTransactions({ from, to, accountId });
  const { data: accounts } = useAccountsWithBalances({ includeArchived: true });
  const names = new Map((accounts ?? []).map((a) => [a.id, a.name]));
  const selected = accountId ? names.get(accountId) : undefined;

  const pickChoice = (next: PeriodChoice) => {
    setChoice(next);
    setFromText('');
    setToText('');
  };

  /** Typing leaves the preset: the other bound keeps the value the preset showed. */
  const typeDate = (which: 'from' | 'to', text: string) => {
    if (choice) {
      setFromText(period.from ?? '');
      setToText(period.to ?? '');
      setChoice(null);
    }
    (which === 'from' ? setFromText : setToText)(text);
  };

  const noFilter = choice === 'all' && !accountId;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/" accessibilityRole="link" style={styles.back}>
        {strings.home.title}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {t.listTitle}
      </Text>

      <View accessibilityRole="radiogroup" style={styles.chips}>
        {CHOICES.map((c) => (
          <Pressable
            key={c.choice}
            accessibilityRole="radio"
            accessibilityLabel={c.label}
            accessibilityState={{ checked: choice === c.choice }}
            onPress={() => pickChoice(c.choice)}
            style={[styles.chip, choice === c.choice && styles.chipSelected]}
          >
            <Text style={choice === c.choice ? styles.chipSelectedText : undefined}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dates}>
        <View style={styles.dateField}>
          <Text style={styles.small}>{t.periodFrom}</Text>
          <TextInput
            accessibilityLabel={t.periodFrom}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            value={choice ? (period.from ?? '') : fromText}
            onChangeText={(text) => typeDate('from', text)}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.small}>{t.periodTo}</Text>
          <TextInput
            accessibilityLabel={t.periodTo}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            value={choice ? (period.to ?? '') : toText}
            onChangeText={(text) => typeDate('to', text)}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.accountFilter}
        accessibilityState={{ expanded: pickerOpen }}
        onPress={() => setPickerOpen(!pickerOpen)}
        style={styles.input}
      >
        <Text>{selected ?? t.allAccounts}</Text>
      </Pressable>
      {pickerOpen && (
        <View accessibilityRole="list" style={styles.options}>
          {[{ id: undefined, name: t.allAccounts }, ...(accounts ?? [])].map((a) => (
            <Pressable
              key={a.id ?? 'all'}
              role="option"
              aria-selected={a.id === accountId}
              onPress={() => {
                setAccountId(a.id);
                setPickerOpen(false);
              }}
              style={styles.option}
            >
              <Text>{a.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {transactions && transactions.length === 0 && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{noFilter ? t.emptyTitle : t.noMatchTitle}</Text>
          <Text>{noFilter ? t.emptyBody : t.noMatchBody}</Text>
        </View>
      )}

      {groupByDate(transactions ?? []).map((group) => (
        <View key={group.date} style={styles.group}>
          <Text accessibilityRole="header" style={styles.groupTitle}>
            {group.date}
          </Text>
          {group.items.map((tx) => {
            const involved = [...new Set(tx.postings.map((p) => names.get(p.accountId) ?? ''))].filter(Boolean);
            return (
              <Link
                key={tx.id}
                href={{ pathname: '/transactions/[id]', params: { id: tx.id } }}
                accessibilityLabel={t.open(tx.description)}
                style={styles.row}
              >
                <View style={styles.rowInner}>
                  <View style={styles.rowText}>
                    <Text>{tx.description}</Text>
                    <Text style={styles.small}>{involved.join(', ')}</Text>
                  </View>
                  <MoneyText brl={totalBrl(tx.postings)} />
                </View>
              </Link>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  back: { fontSize: 14, color: '#1d4ed8' },
  title: { fontSize: 28, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 16 },
  chipSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  chipSelectedText: { color: '#fff' },
  dates: { flexDirection: 'row', gap: 8 },
  dateField: { flex: 1, gap: 2 },
  small: { fontSize: 12, color: '#6b7280' },
  input: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 8, fontSize: 16 },
  options: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6 },
  option: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  notice: { gap: 4, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  noticeTitle: { fontWeight: '600' },
  group: { gap: 4 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  rowInner: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowText: { flexShrink: 1 },
});
