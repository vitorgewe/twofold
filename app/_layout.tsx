import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { requestPersistentStorage } from '../src/data/database';

export default function RootLayout() {
  useEffect(() => {
    void requestPersistentStorage();
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
}
