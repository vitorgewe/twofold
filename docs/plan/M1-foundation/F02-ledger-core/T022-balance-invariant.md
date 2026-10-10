---
id: T022
type: task
feature: "[[F02-ledger-core]]"
milestone: "[[M1-foundation]]"
status: todo
depends_on: ["[[T021-money-and-currency]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
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

- [ ] One credit of 100000 and three debits of 40000, 35000 and 25000 is balanced; changing one debit by 1 makes it unbalanced with difference 1
- [ ] A single posting, only debits, all zeros, and negative or fractional amounts are rejected
- [ ] A randomized test with a seeded generator and at least 1000 cases: generated balanced transactions pass in any posting order, and changing any one amount by 1 makes them fail
- [ ] A test or lint rule shows the module has no React Native, Expo or `src/data/` imports

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0005-folder-structure]]
- [[ADR-0006-testing-strategy]]

## Progress

## QA
