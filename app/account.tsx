import { useLocalSearchParams } from 'expo-router';

import { StatementScreen } from '@/features/accounts/StatementScreen';

// Not `accounts/[id]`: the production export is static and the hosting answers 404 for an id it did
// not pre-render (ADR-0018), so the id travels in the query: /account?id=...
export default function AccountStatement() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <StatementScreen accountId={id ?? ''} />;
}
