---
id: T051
type: task
feature: "[[F05-home]]"
milestone: "[[M2-core-flow]]"
status: todo
depends_on: ["[[T024-net-worth-and-income-statement]]", "[[T042-save-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T051 Home screen

## Goal

Home shows net worth, the month result, balances by currency and backup status, all derived from the ledger.

## Description

Replace the placeholder in `app/index.tsx`. Use the labels and test ids in the smoke test contract in [[plan]]; `net-worth` and `month-result` are test ids on elements that contain only the formatted BRL value.

- Net worth from `netWorth` (T024), labelled "Net worth", test id `net-worth`.
- "Result this month" from `incomeStatement` over the current calendar month in the device's date, test id `month-result`.
- A balances section: one row per non-BRL currency with a balance, BRL as the main amount and the original amount muted (`MoneyText`).
- A "New transaction" button that opens `/transactions/new`, and a link to Accounts.
- A backup row reading the `last_backup_at` key from `meta` (T023): "No backup yet" with a warning style when absent, "Last backup N days ago" with a warning style when older than 30 days, plain otherwise. The key is written by T091.
- Data comes from `useQuery`, so Home updates after a save without reload.

Out of scope: charts, the Settings screen, backup itself.

## Definition of Done

- [ ] On an empty database Home shows R$ 0.00 for both figures and "No backup yet" in warning style
- [ ] Create "Checking" (Asset) and "Groceries" (Expense), save a transaction with credit Checking 100.00 and debit Groceries 100.00: Home shows net worth -R$ 100.00 and result this month -R$ 100.00, without a manual reload, and still after a reload
- [ ] With a USD account holding R$ 500.00 on the books, Home lists USD with R$ 500.00 as the main amount and the USD amount muted
- [ ] Jest test: the backup row is plain with a `last_backup_at` of 29 days ago and in warning style with 31 days ago
- [ ] `npx playwright test e2e/smoke.spec.ts` passes
- [ ] Nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

## QA
