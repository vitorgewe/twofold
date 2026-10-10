import { readFileSync } from 'fs';
import { join } from 'path';

import {
  InvalidTransactionError,
  UnbalancedTransactionError,
  assertBalanced,
  balanceDifference,
  isBalanced,
  type PostingDraft,
} from './balance';

const debit = (amountBrl: number, accountId = 'a'): PostingDraft => ({ accountId, side: 'debit', amountBrl });
const credit = (amountBrl: number, accountId = 'b'): PostingDraft => ({ accountId, side: 'credit', amountBrl });

describe('balance invariant', () => {
  const sample = [credit(100000), debit(40000), debit(35000), debit(25000)];

  it('accepts one credit against three debits that sum to it', () => {
    expect(balanceDifference(sample)).toBe(0);
    expect(isBalanced(sample)).toBe(true);
    expect(() => assertBalanced(sample)).not.toThrow();
  });

  it('reports a difference of 1 when one debit changes by 1', () => {
    const off = [credit(100000), debit(40001), debit(35000), debit(25000)];
    expect(isBalanced(off)).toBe(false);
    expect(balanceDifference(off)).toBe(1);
    try {
      assertBalanced(off);
      throw new Error('expected assertBalanced to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UnbalancedTransactionError);
      expect((error as UnbalancedTransactionError).difference).toBe(1);
    }
  });

  it.each([
    ['a single posting', [debit(100)]],
    ['only debits', [debit(100), debit(0)]],
    ['only credits', [credit(100), credit(0)]],
    ['all zeros', [debit(0), credit(0)]],
    ['a negative amount', [debit(-100), credit(-100)]],
    ['a fractional amount', [debit(10.5), credit(10.5)]],
    ['an unsafe integer', [debit(2 ** 53), credit(2 ** 53)]],
    ['NaN', [debit(NaN), credit(NaN)]],
    ['no postings', []],
  ])('rejects %s', (_name, postings) => {
    expect(isBalanced(postings)).toBe(false);
    expect(() => assertBalanced(postings)).toThrow(InvalidTransactionError);
  });

  describe('randomized', () => {
    // mulberry32: small seeded generator so failures reproduce.
    function rng(seed: number) {
      let a = seed;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function split(random: () => number, total: number, parts: number): number[] {
      const cuts = Array.from({ length: parts - 1 }, () => Math.floor(random() * (total + 1))).sort((x, y) => x - y);
      return [...cuts, total].map((cut, i) => cut - (i === 0 ? 0 : cuts[i - 1]));
    }

    function shuffle<T>(random: () => number, items: T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    it('passes balanced transactions in any order and fails when any amount moves by 1', () => {
      const random = rng(20261010);
      for (let n = 0; n < 1500; n++) {
        const total = 1 + Math.floor(random() * 1_000_000_000);
        const debits = split(random, total, 1 + Math.floor(random() * 4)).map((a) => debit(a));
        const credits = split(random, total, 1 + Math.floor(random() * 4)).map((a) => credit(a));
        const postings = shuffle(random, [...debits, ...credits]);

        expect(isBalanced(postings)).toBe(true);
        expect(isBalanced(shuffle(random, postings))).toBe(true);

        const index = Math.floor(random() * postings.length);
        const delta = random() < 0.5 && postings[index].amountBrl > 0 ? -1 : 1;
        const changed = postings.map((p, i) => (i === index ? { ...p, amountBrl: p.amountBrl + delta } : p));
        expect(isBalanced(changed)).toBe(false);
      }
    });
  });

  it('imports nothing from React Native, Expo or src/data', () => {
    const source = readFileSync(join(__dirname, 'balance.ts'), 'utf8');
    const specifiers = [...source.matchAll(/(?:from|import|require\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const specifier of specifiers) {
      expect(specifier).not.toMatch(/^(react-native|expo)(\/|-|$)|(^|\/)data(\/|$)/);
    }
  });
});
