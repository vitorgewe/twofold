---
id: T081
type: task
feature: "[[F08-result]]"
milestone: "[[M3-review-and-reports]]"
status: todo
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

- [ ] After saving credit Checking 100.00 and debit Groceries 100.00, "This month" shows Groceries R$ 100.00 under Expenses, total expenses R$ 100.00, total income R$ 0.00 and Result -R$ 100.00
- [ ] After adjusting a USD account by +200.00 against "FX gain", income shows "FX gain" R$ 200.00 and the result becomes R$ 100.00
- [ ] A transaction dated last month appears under "Last month" and not under "This month"
- [ ] A custom range includes transactions dated exactly on "from" and on "to"
- [ ] Jest tests for the period helpers around month and year boundaries and in a leap year
- [ ] Nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0012-english-only]]

## Progress

## QA
