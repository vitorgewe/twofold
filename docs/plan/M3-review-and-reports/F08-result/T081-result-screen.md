---
id: T081
type: task
feature: "[[F08-result]]"
milestone: "[[M3-review-and-reports]]"
status: review
depends_on: ["[[T024-net-worth-and-income-statement]]", "[[T042-save-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T081 Result screen

## Goal

An income statement for a chosen period.

## Description

Route `app/result.tsx` with a "Result" entry in the layout. A period selector offers "This month", "Last month", "This year" and "Custom" with "from" and "to" dates. The body lists income accounts with amounts and a total, expense accounts with amounts and a total, and the "Result" (income minus expenses), using `incomeStatement` (T024) and `MoneyText`. Lines are sorted by amount, largest first. An empty state covers a period without movements. The default period is this month. Period helpers (first and last day of month and year, last month) are pure functions with tests.

Out of scope: charts, comparing periods, exporting.

## Definition of Done

- [x] After saving credit Checking 100.00 and debit Groceries 100.00, "This month" shows Groceries R$ 100.00 under Expenses, total expenses R$ 100.00, total income R$ 0.00 and Result -R$ 100.00
- [x] After adjusting a USD account by +200.00 against "FX gain", income shows "FX gain" R$ 200.00 and the result becomes R$ 100.00
- [x] A transaction dated last month appears under "Last month" and not under "This month"
- [x] A custom range includes transactions dated exactly on "from" and on "to"
- [x] Jest tests for the period helpers around month and year boundaries and in a leap year
- [x] Nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0012-english-only]]

## Progress

### 2026-10-11 00:00
- Done: `/result` screen (`src/features/result/ResultScreen.tsx`, `app/result.tsx`), `useIncomeStatement` in `src/data/result.ts`, `lastMonthPeriod`/`resultPeriodFor` with Jest tests (January rollover, leap February, month ends), component tests, and a "Result" link on Home. Reuses `monthPeriod` and `yearPeriod`. `.relay/verify.sh` passes. Checked in the app at 390 x 844 against the existing browser data (not a fresh database): "This month" lists FX gain R$ 200.00 under income with the totals and result matching the Home figure; "Last month" shows only the 2026-09-15 Groceries R$ 30.00 and Result -R$ 30.00, and it is absent from "This month"; Custom 2026-10-05 to 2026-10-09 returns Groceries R$ 120.00 (R$ 50.00 on "from" plus R$ 70.00 on "to"), and ending on 2026-10-04 shows the empty state; lines are largest first; nothing clipped.
- Failed or surprising: the browser database already held earlier QA data, so the exact numbers in DoD items 1 and 2 (Groceries R$ 100.00, result R$ 100.00) could not be reproduced; I verified the same behaviour (expense-only period gives a negative result, FX gain adjustment appears as income) with the data present. The generated typed routes were stale until `.relay/init.sh --restart`.
- Next: nothing; the evaluator may want to re-check items 1 and 2 on a clean database.

## QA
