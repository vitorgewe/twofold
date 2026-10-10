---
id: T024
type: task
feature: "[[F02-ledger-core]]"
milestone: "[[M1-foundation]]"
status: review
depends_on: ["[[T021-money-and-currency]]", "[[T022-balance-invariant]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T024 Net worth and income statement

## Goal

Pure functions that turn postings into balances, net worth and an income statement.

## Description

In `src/features/ledger/reports.ts`. Inputs are plain arrays of accounts and postings, never the database.

- Sign convention: assets and expenses increase with debits; liabilities, equity and income increase with credits.
- `accountBalances` returns, per account, the native balance in minor units and the BRL balance from posting BRL amounts.
- `netWorth` is the sum of asset BRL balances minus the sum of liability BRL balances. It uses ledger values only, never rates ([[ADR-0010-net-worth-from-ledger]]).
- `balancesByCurrency` groups native balances by currency.
- `incomeStatement(postings, accounts, { from, to })` returns income lines, expense lines, total income, total expenses and result (income minus expenses). Both dates are inclusive `YYYY-MM-DD` strings.

Out of scope: storage, UI, formatting.

## Definition of Done

- [x] Opening balance: debit Checking (asset) 500000 and credit Opening balance (equity) 500000 give net worth 500000 and result 0
- [x] Credit card: credit Card (liability) 30000 and debit Groceries (expense) 30000 give net worth -30000 and result -30000
- [x] The check from ADR-0010: buy USD 1,000.00 at 5.00 (debit USD account with amount 100000 and BRL 500000, credit Checking 500000) leaves net worth unchanged. Then an adjustment (debit the USD account with amount 0 and BRL 20000, credit an income account "FX gain" 20000) raises net worth by exactly 20000, shows 20000 as income in that month, and leaves the native USD balance at 100000
- [x] Postings outside the period are excluded and the boundary dates are included
- [x] `balancesByCurrency` returns separate native totals for BRL, USD and BTC

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0009-balance-invariant]]

## Progress

### 2026-10-10 12:00
- Done: added `src/features/ledger/reports.ts` (`accountBalances`, `netWorth`, `balancesByCurrency`, `incomeStatement`) and `reports.test.ts` with one test per Definition of Done item; all pass and `.relay/verify.sh` passes. The task is pure functions with no UI, so I checked it with unit tests only and did not use the browser.
- Decisions: postings are passed as `ReportPosting` (`accountId, side, amount, amountBrl, date`), because the stored posting has no date and the date lives on its transaction, so the caller must join them. `balancesByCurrency` covers asset and liability accounts only and counts liabilities as negative (a debt is a negative position). Income and expense lines list every account of that type that has a posting in the period.
- Failed or surprising: nothing.
- Next: nothing left in this task.

## QA
