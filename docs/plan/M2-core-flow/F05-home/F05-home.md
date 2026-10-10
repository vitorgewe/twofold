---
id: F05
type: feature
milestone: "[[M2-core-flow]]"
status: todo
estimate_tokens: 400000
estimate_hours: 0.5
tags: [feature]
---
# F05 Home

## Goal

Opening the app shows how much the user is worth, how the month is going, and whether their data is backed up.

## Description

Home shows net worth in BRL, the result of the current month, the balances by currency, a button to record a new transaction and the date of the last backup. Everything is derived from the ledger and refreshes after a save without a reload.

## Definition of Done

- [ ] On an empty database Home shows R$ 0.00 for net worth and for the month result
- [ ] After the smoke test transaction (credit Checking 100.00, debit Groceries 100.00) Home shows net worth -R$ 100.00 and month result -R$ 100.00, also after a reload
- [ ] A foreign-currency account shows BRL as the main amount with the original amount muted
- [ ] A warning shows when there is no backup or the last one is older than 30 days

## Tasks

- [[T051-home-screen]]

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0011-backup-and-csv-import]]

## Progress

## QA
