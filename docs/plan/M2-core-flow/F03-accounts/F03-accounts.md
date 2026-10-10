---
id: F03
type: feature
milestone: "[[M2-core-flow]]"
status: todo
estimate_tokens: 1200000
estimate_hours: 1.5
tags: [feature]
---
# F03 Accounts

## Goal

The user manages the chart of accounts, sees every balance with the original currency kept quiet, reads an account statement, and records gains or losses on foreign-currency accounts.

## Description

The Accounts screen lists accounts grouped by type with their balances. From it the user creates, renames and archives accounts, opens an account to see its statement, and adjusts the value of a foreign-currency account with an ordinary transaction.

## Definition of Done

- [ ] At 390 x 844, create "Checking" (Asset, BRL) and "Cash USD" (Asset, USD); both appear under Asset, and the USD account shows BRL as the main amount with USD small and muted
- [ ] Created accounts are still listed after a full page reload
- [ ] Using only the Accounts screen: adjusting "Cash USD" by +200.00 with an income account raises its balance to R$ 200.00, and its statement shows that row
- [ ] Archived accounts are hidden until "Show archived" is turned on

## Tasks

- [[T031-accounts-screen]]
- [[T032-adjust-value]]
- [[T033-account-statement]]

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0005-folder-structure]]
- [[ADR-0012-english-only]]

## Progress

## QA
