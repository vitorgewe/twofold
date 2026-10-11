import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getDatabase } from '@/data/database';
import {
  deleteTransaction,
  updateTransaction,
  useAccountsWithBalances,
  useTransaction,
  type TransactionInput,
} from '@/data/transactions';
import { BRL, currencyOf } from '@/features/ledger/currency';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

import { TransactionForm } from './TransactionForm';

const t = strings.transactions;

export function TransactionDetailScreen({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const { data: transaction, loading } = useTransaction(transactionId);
  const { data: accounts } = useAccountsWithBalances({ includeArchived: true });
  const byId = new Map((accounts ?? []).map((a) => [a.id, a]));
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const save = async (draft: TransactionInput) => {
    await updateTransaction(await getDatabase(), transactionId, draft);
    router.dismissTo('/transactions');
  };

  const remove = async () => {
    setDeleteError(null);
    try {
      await deleteTransaction(await getDatabase(), transactionId);
      setDeleted(true);
      router.dismissTo('/transactions');
    } catch (e) {
      setDeleteError(e instanceof Error && e.message ? e.message : t.deleteFailed);
    }
  };

  if (editing && transaction && accounts) {
    return <TransactionForm initial={transaction} onSubmit={save} onCancel={() => setEditing(false)} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/transactions" accessibilityRole="link" style={styles.back}>
        {t.detailBack}
      </Link>

      {(loading && !transaction) || deleted ? null : !transaction ? (
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
                  currency={currencyOf(account?.currency ?? BRL.code) ?? BRL}
                  native={p.amount}
                />
              </View>
            );
          })}

          {confirming ? (
            <View style={styles.notice}>
              <Text>{t.deleteQuestion}</Text>
              {deleteError !== null && <Text style={styles.error}>{deleteError}</Text>}
              <Pressable accessibilityRole="button" onPress={remove} style={[styles.button, styles.danger]}>
                <Text style={styles.dangerText}>{t.deleteConfirm}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setConfirming(false)} style={styles.button}>
                <Text>{t.cancel}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.button}>
                <Text>{t.edit}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setConfirming(true)} style={styles.button}>
                <Text>{t.delete}</Text>
              </Pressable>
            </View>
          )}
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
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, alignItems: 'center' },
  danger: { backgroundColor: '#b91c1c', borderColor: '#b91c1c' },
  dangerText: { color: '#fff', fontWeight: '600' },
  error: { color: '#b91c1c' },
});
