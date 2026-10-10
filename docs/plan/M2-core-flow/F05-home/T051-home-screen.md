---
id: T051
type: task
feature: "[[F05-home]]"
milestone: "[[M2-core-flow]]"
status: review
depends_on: ["[[T024-net-worth-and-income-statement]]", "[[T042-save-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 96023
actual_hours: 0.07
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

- [x] On an empty database Home shows R$ 0.00 for both figures and "No backup yet" in warning style
- [x] Create "Checking" (Asset) and "Groceries" (Expense), save a transaction with credit Checking 100.00 and debit Groceries 100.00: Home shows net worth -R$ 100.00 and result this month -R$ 100.00, without a manual reload, and still after a reload
- [x] With a USD account holding R$ 500.00 on the books, Home lists USD with R$ 500.00 as the main amount and the USD amount muted
- [x] Jest test: the backup row is plain with a `last_backup_at` of 29 days ago and in warning style with 31 days ago
- [x] `npx playwright test e2e/smoke.spec.ts` passes
- [x] Nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

### 2026-10-10 22:40
- Done: Home (`src/features/home/HomeScreen.tsx`, rendered by `app/index.tsx`) shows net worth, result this month, balances per non-BRL currency, backup row, the New transaction button and the Accounts link. Data comes from `useHomeSummary` in `src/data/home.ts` (via `useQuery`); pure helpers (month period, backup status, foreign balances) are in `src/features/home/summary.ts`. Checked at 390 x 844 in fresh browser contexts: empty database gives R$0.00 twice and "No backup yet" in the warning colour; a USD account with a R$500.00 adjustment lists USD with R$500.00 main and "USD 0.00" muted; nothing clipped (scroll width 390). `npx playwright test e2e/smoke.spec.ts` passes (save updates Home without reload, and after reload). Jest covers the 29 vs 31 day backup row, and the month period. `.relay/verify.sh` prints `verify: ok`.
- Failed or surprising: (1) After saving, `router.replace('/')` in `app/transactions/new.tsx` (T042) left the original Home mounted under the new one, so `net-worth` matched two elements and the smoke test failed on strict mode. Fixed with `router.dismissTo('/')` in its own commit; `SaveTransaction.test.tsx` now asserts `dismissTo` instead of `replace`, the checks are otherwise unchanged. (2) The dev server served a stale bundle until `.relay/init.sh --restart`. (3) The USD balance's muted amount is "USD 0.00" because a value adjustment books BRL only, with no native amount. (4) The `last_backup_at` format is assumed to be an ISO timestamp; T091 writes it, so it should keep that format. The "Last backup" label uses "today" for 0 days and "1 day ago" for 1.
- Next: nothing left for this task.

## QA
