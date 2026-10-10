import { useRouter } from 'expo-router';

import { getDatabase } from '@/data/database';
import { createTransaction, type TransactionInput } from '@/data/transactions';
import { TransactionForm } from '@/features/transactions/TransactionForm';

export default function NewTransaction() {
  const router = useRouter();
  const save = async (draft: TransactionInput) => {
    await createTransaction(await getDatabase(), draft);
    router.replace('/');
  };
  return <TransactionForm onSubmit={save} />;
}
