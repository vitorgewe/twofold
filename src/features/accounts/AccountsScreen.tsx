import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AccountError, archiveAccount, renameAccount, unarchiveAccount } from '@/data/accounts';
import { getDatabase } from '@/data/database';
import { useAccountsWithBalances, type AccountWithBalance } from '@/data/transactions';
import { ACCOUNT_TYPES } from '@/features/ledger/account-types';
import { BRL, BTC, USD } from '@/features/ledger/currency';
import { MoneyText } from '@/ui/MoneyText';
import { strings } from '@/ui/strings';

import { AccountForm } from './AccountForm';
import { validateAccountName } from './validate';

const CURRENCIES = { BRL, USD, BTC };

export function AccountsScreen() {
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const { data: accounts } = useAccountsWithBalances({ includeArchived: showArchived });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {strings.accounts.title}
      </Text>

      {creating ? (
        <AccountForm onDone={() => setCreating(false)} />
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={styles.newButton}>
          <Text style={styles.newButtonText}>{strings.accounts.newAccount}</Text>
        </Pressable>
      )}

      <View style={styles.toggle}>
        <Text>{strings.accounts.showArchived}</Text>
        <Switch
          accessibilityLabel={strings.accounts.showArchived}
          value={showArchived}
          onValueChange={setShowArchived}
        />
      </View>

      {accounts && accounts.length === 0 && !creating && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{strings.accounts.emptyTitle}</Text>
          <Text>{strings.accounts.emptyBody}</Text>
        </View>
      )}

      {ACCOUNT_TYPES.map((type) => {
        const group = (accounts ?? []).filter((a) => a.type === type);
        if (group.length === 0) return null;
        return (
          <View key={type} style={styles.group}>
            <Text accessibilityRole="header" style={styles.groupTitle}>
              {strings.accounts.types[type]}
            </Text>
            {group.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function AccountRow({ account }: { account: AccountWithBalance }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(account.name);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof AccountError ? e.message : 'Something went wrong.');
      return false;
    }
  };

  const saveName = async () => {
    const invalid = validateAccountName(name);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (await run(async () => renameAccount(await getDatabase(), account.id, name))) setRenaming(false);
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        {renaming ? (
          <TextInput
            accessibilityLabel={`New name for ${account.name}`}
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
          />
        ) : (
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{account.name}</Text>
            {account.archived && <Text style={styles.muted}>{strings.accounts.archivedTag}</Text>}
          </View>
        )}
        <MoneyText
          brl={account.brl}
          currency={CURRENCIES[account.currency as keyof typeof CURRENCIES] ?? BRL}
          native={account.native}
        />
      </View>

      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      <View style={styles.actions}>
        {renaming ? (
          <>
            <RowButton label={strings.accounts.saveName} onPress={saveName} />
            <RowButton
              label={strings.accounts.cancel}
              onPress={() => {
                setRenaming(false);
                setName(account.name);
                setError(null);
              }}
            />
          </>
        ) : (
          <>
            <RowButton label={strings.accounts.rename} onPress={() => setRenaming(true)} />
            {account.archived ? (
              <RowButton
                label={strings.accounts.unarchive}
                onPress={() => run(async () => unarchiveAccount(await getDatabase(), account.id))}
              />
            ) : (
              <RowButton
                label={strings.accounts.archive}
                onPress={() => run(async () => archiveAccount(await getDatabase(), account.id))}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

function RowButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.rowButton}>
      <Text style={styles.rowButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: '600' },
  newButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6, backgroundColor: '#111827' },
  newButtonText: { color: '#fff', fontWeight: '600' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { gap: 4, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  emptyTitle: { fontWeight: '600' },
  group: { gap: 8 },
  groupTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  row: { gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  rowMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nameBlock: { flexShrink: 1 },
  name: { fontSize: 16 },
  muted: { fontSize: 12, color: '#6b7280' },
  input: { flex: 1, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 6, fontSize: 16 },
  error: { color: '#b91c1c' },
  actions: { flexDirection: 'row', gap: 8 },
  rowButton: { paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6 },
  rowButtonText: { fontSize: 13 },
});
