---
id: F02
type: feature
milestone: "[[M1-foundation]]"
status: todo
estimate_tokens: 1250000
estimate_hours: 1.75
tags: [feature]
---
# F02 Ledger core

## Goal

The accounting rules exist, are tested, and are the only way data reaches the database, so no screen can break the books.

## Description

Pure functions for money, the balance rule, net worth and the income statement live in `src/features/ledger/`. Repositories in `src/data/` apply those rules on every write and expose hooks that re-read after changes. There is no new screen; the feature is evaluated through its test suites and a typecheck.

## Definition of Done

- [ ] `npx jest` runs the suites for money, balance, net worth and income statement, and the repository suites against real SQL, and all pass
- [ ] A seeded randomized test creates, edits and deletes transactions and afterwards finds no transaction whose debits differ from its credits
- [ ] Nothing under `src/features/ledger/` imports React Native, Expo or `src/data/`
- [ ] The app still starts on the web target after the migrations run

## Tasks

- [[T021-money-and-currency]]
- [[T022-balance-invariant]]
- [[T023-database-schema-and-accounts-repository]]
- [[T024-net-worth-and-income-statement]]
- [[T025-transactions-and-rates-repositories]]

## Related decisions

- [[ADR-0007-integer-money]]
- [[ADR-0008-uuid-identifiers]]
- [[ADR-0009-balance-invariant]]
- [[ADR-0010-net-worth-from-ledger]]

## Progress

## QA

### Round 1, 2026-10-10

Left open only because T023 goes back for defect D1 (committed `app/dbcheck.tsx`, see the T023 QA section). All four Definition of Done items of this feature passed: Jest 74 tests green, the import-scan test passes, and the app starts after the migrations run.
