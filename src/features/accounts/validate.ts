import { strings } from '@/ui/strings';

/** Returns the error message for an account name, or null when the name can be saved. */
export function validateAccountName(name: string): string | null {
  return name.trim() ? null : strings.accounts.nameRequired;
}
