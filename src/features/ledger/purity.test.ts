import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// The ledger rules are pure: nothing in this folder may depend on the UI, Expo or the
// database layer (constitution, ADR-0005). This scans every file, tests included.
const FORBIDDEN = [/react-native/, /from ['"]expo/, /\/data(\/|['"])/, /\.\.\/\.\.\/app/];

const importLines = (source: string): string[] =>
  source.split('\n').filter((line) => /^\s*(import|export)\b.*\bfrom\b/.test(line) || /^\s*import\s+['"]/.test(line));

describe('ledger purity', () => {
  const files = readdirSync(__dirname).filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'));

  it('scans the ledger files', () => {
    expect(files).toContain('balance.ts');
    expect(files).toContain('reports.ts');
  });

  it.each(files)('%s imports nothing from react-native, expo, src/data or app', (name) => {
    const imports = importLines(readFileSync(join(__dirname, name), 'utf8'));
    for (const line of imports) {
      for (const pattern of FORBIDDEN) {
        expect({ file: name, line, forbidden: pattern.test(line) }).toEqual({ file: name, line, forbidden: false });
      }
    }
  });
});
