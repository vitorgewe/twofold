import { useRouter } from 'expo-router';

import { getDatabase } from '@/data/database';
import { createTransaction, type TransactionInput } from '@/data/transactions';
import { TransactionForm } from '@/features/transactions/TransactionForm';

export default function NewTransaction() {
  const router = useRouter();
  const save = async (draft: TransactionInput) => {
    await createTransaction(await getDatabase(), draft);
    // Pops back to the Home already in the stack; replace('/') left a second Home mounted under it.
    router.dismissTo('/');
  };
  return <TransactionForm onSubmit={save} />;
}
