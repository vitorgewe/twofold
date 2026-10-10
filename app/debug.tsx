import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getDatabase } from '../src/data/database';

export default function Debug() {
  const [out, setOut] = useState('idle');
  const w = async () => {
    try {
      const db = await getDatabase();
      await db.run("INSERT OR REPLACE INTO meta (key,value) VALUES ('k','hello')");
      setOut('written');
    } catch (e) {
      setOut('ERR ' + String(e));
    }
  };
  const r = async () => {
    try {
      const db = await getDatabase();
      setOut('read ' + JSON.stringify(await db.query('SELECT * FROM meta')));
    } catch (e) {
      setOut('ERR ' + String(e));
    }
  };
  return (
    <View>
      <Pressable onPress={w}><Text>WRITE</Text></Pressable>
      <Pressable onPress={r}><Text>READ</Text></Pressable>
      <Text testID="out">{out}</Text>
    </View>
  );
}
