---
id: T022
type: task
feature: "[[F02-ledger-core]]"
milestone: "[[M1-foundation]]"
status: done
depends_on: ["[[T021-money-and-currency]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 37987
actual_hours: 0.01
tags: [task]
---
# T022 Balance invariant

## Goal

One pure function decides whether a transaction balances.

## Description

In `src/features/ledger/balance.ts`:

- `PostingDraft` is `{ accountId, side: "debit" | "credit", amountBrl }`.
- `balanceDifference(postings)` is the sum of debit BRL amounts minus the sum of credit BRL amounts.
- `isBalanced(postings)` and `assertBalanced(postings)`. The assertion throws `UnbalancedTransactionError` carrying the difference.
- A transaction is rejected when it has fewer than two postings, has no debit or no credit, has a BRL amount that is negative or not a safe integer, or sums to zero on both sides.

The module imports nothing from React Native, Expo or `src/data/`.

Out of scope: storage, and currency conversion (done in T021).

## Definition of Done

- [x] One credit of 100000 and three debits of 40000, 35000 and 25000 is balanced; changing one debit by 1 makes it unbalanced with difference 1
- [x] A single posting, only debits, all zeros, and negative or fractional amounts are rejected
- [x] A randomized test with a seeded generator and at least 1000 cases: generated balanced transactions pass in any posting order, and changing any one amount by 1 makes them fail
- [x] A test or lint rule shows the module has no React Native, Expo or `src/data/` imports

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0005-folder-structure]]
- [[ADR-0006-testing-strategy]]

## Progress

### 2026-10-10 12:00
- Done: added `src/features/ledger/balance.ts` (`balanceDifference`, `isBalanced`, `assertBalanced`, `UnbalancedTransactionError` with `difference`, plus `InvalidTransactionError` for malformed transactions) and `balance.test.ts` (13 tests: the 100000/40000/35000/25000 example, rejections, 1500 seeded random cases with shuffles and ±1 changes, import-scan test). `npx jest` on it passes and `.relay/verify.sh` prints `verify: ok`. This is a pure module with no screen, so the Playwright check does not apply; the tests are the proof.
- Failed or surprising: nothing. Decision: structural problems (fewer than two postings, no debit/credit, bad amounts, all zeros) throw `InvalidTransactionError`; only a non-zero difference throws `UnbalancedTransactionError`. `isBalanced` returns false for both.
- Next: callers (T023 onward) should catch both error classes when showing messages.

## QA
