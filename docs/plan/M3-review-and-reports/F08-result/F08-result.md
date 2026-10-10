---
id: F08
type: feature
milestone: "[[M3-review-and-reports]]"
status: todo
estimate_tokens: 400000
estimate_hours: 0.5
tags: [feature]
---
# F08 Result

## Goal

The user reads an income statement, with income, expenses and the result, for any period.

## Description

The Result screen shows income and expense accounts with their totals and the result for a chosen period: this month, last month, this year or a custom range.

## Definition of Done

- [ ] After the smoke test transaction, "This month" shows Groceries under Expenses with R$ 100.00 and a result of -R$ 100.00
- [ ] A value adjustment on a USD account with an "FX gain" account shows R$ 200.00 as income
- [ ] A custom range excludes transactions outside it and includes both boundary dates

## Tasks

- [[T081-result-screen]]

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]

## Progress

## QA
