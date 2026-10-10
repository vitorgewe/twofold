import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { createAccount, listAccounts } from '../src/data/accounts';
import { getDatabase } from '../src/data/database';

export default function DbCheck() {
  const [out, setOut] = useState('running');
  useEffect(() => {
    (async () => {
      const db = await getDatabase();
      const lines: string[] = [];
      lines.push('currencies=' + JSON.stringify(await db.query('SELECT code, decimals FROM currency ORDER BY code')));
      const name = 'Check ' + Date.now();
      await createAccount(db, { name, type: 'asset', currency: 'BRL' });
      lines.push('accounts=' + (await listAccounts(db)).length);
      try {
        await createAccount(db, { name: name.toUpperCase(), type: 'asset', currency: 'BRL' });
        lines.push('dup=allowed');
      } catch (e) {
        lines.push('dup=rejected');
      }
      try {
        await db.run("UPDATE account SET currency = 'USD'");
        lines.push('currency=changed');
      } catch (e) {
        lines.push('currency=rejected');
      }
      try {
        await db.run("INSERT INTO account (id, name, type, currency) VALUES ('z', 'Z', 'asset', 'EUR')");
        lines.push('fk=allowed');
      } catch (e) {
        lines.push('fk=rejected');
      }
      setOut(lines.join(' | '));
    })().catch((e) => setOut('ERROR ' + String(e)));
  }, []);
  return <Text testID="out">{out}</Text>;
}
