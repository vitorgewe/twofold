import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createAccount, AccountError } from '@/data/accounts';
import { getDatabase } from '@/data/database';
import { ACCOUNT_TYPES, type AccountType } from '@/features/ledger/account-types';
import { BRL, BTC, USD } from '@/features/ledger/currency';
import { strings } from '@/ui/strings';

import { validateAccountName } from './validate';

const CURRENCIES = [BRL, USD, BTC];

export function AccountForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('asset');
  const [currency, setCurrency] = useState(BRL.code);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const invalid = validateAccountName(name);
    if (invalid) {
      setError(invalid);
      return;
    }
    try {
      await createAccount(await getDatabase(), { name, type, currency });
      onDone();
    } catch (e) {
      setError(e instanceof AccountError ? e.message : 'Could not save the account.');
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>{strings.accounts.nameLabel}</Text>
      <TextInput
        accessibilityLabel={strings.accounts.nameLabel}
        style={styles.input}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
      />

      <Text style={styles.label}>{strings.accounts.typeLabel}</Text>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {ACCOUNT_TYPES.map((t) => (
          <Choice key={t} label={strings.accounts.types[t]} selected={type === t} onPress={() => setType(t)} />
        ))}
      </View>

      <Text style={styles.label}>{strings.accounts.currencyLabel}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={strings.accounts.currencyLabel} style={styles.choices}>
        {CURRENCIES.map((c) => (
          <Choice key={c.code} label={c.code} selected={currency === c.code} onPress={() => setCurrency(c.code)} />
        ))}
      </View>

      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={save} style={[styles.button, styles.primary]}>
          <Text style={styles.primaryText}>{strings.accounts.save}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.button}>
          <Text>{strings.accounts.cancel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={selected ? styles.choiceSelectedText : undefined}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6, padding: 8, fontSize: 16 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 16 },
  choiceSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  choiceSelectedText: { color: '#fff' },
  error: { color: '#b91c1c' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 6 },
  primary: { backgroundColor: '#111827', borderColor: '#111827' },
  primaryText: { color: '#fff', fontWeight: '600' },
});
