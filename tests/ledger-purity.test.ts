import { spawnSync } from 'child_process';
import { join } from 'path';

// The ledger rules are pure (constitution, ADR-0005). The boundary is an ESLint rule; this proves it fires.
const root = join(__dirname, '..');
const lint = (source: string, file: string): number => {
  const run = spawnSync(join(root, 'node_modules', '.bin', 'eslint'), ['--stdin', '--stdin-filename', file, '--format', 'json'], {
    cwd: root,
    input: source,
    encoding: 'utf8',
  });
  const [result] = JSON.parse(run.stdout) as { messages: { ruleId: string | null }[] }[];
  return result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length;
};

describe('ledger purity rule', () => {
  it.each([
    ["import { Text } from 'react-native';", 'react-native'],
    ["import { getDatabase } from '../../data/database';", 'src/data'],
    ["import {\n  getDatabase,\n} from '../../data/database';", 'a multi-line import'],
    ["import { MoneyText } from '@/ui/MoneyText';", 'src/ui'],
    ["export { newId } from '../../data/ids';", 'a re-export'],
    ["import { randomUUID } from 'expo-crypto';", 'expo'],
  ])('rejects %s (%s)', (source) => {
    expect(lint(`${source}\nexport {};\n`, 'src/features/ledger/probe.ts')).toBeGreaterThan(0);
  });

  it('allows imports inside the ledger and the same imports outside it', () => {
    expect(lint("import { BRL } from './currency';\nexport { BRL };\n", 'src/features/ledger/probe.ts')).toBe(0);
    expect(lint("import { getDatabase } from '../../data/database';\nexport { getDatabase };\n", 'src/features/home/probe.ts')).toBe(0);
  });
});
