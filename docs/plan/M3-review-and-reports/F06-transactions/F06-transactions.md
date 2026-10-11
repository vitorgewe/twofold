---
id: F06
type: feature
milestone: "[[M3-review-and-reports]]"
status: done
estimate_tokens: 800000
estimate_hours: 1
tags: [feature]
---
# F06 Transactions

## Goal

The user can find any past transaction, open it, correct it or remove it, with the books still balanced afterwards.

## Description

The Transactions screen lists transactions newest first with filters for period and account. A transaction opens in a detail view, from which it can be edited with the same form as a new transaction, or deleted after a confirmation.

## Definition of Done

- [ ] Filtering by period and by account narrows the list, and clearing the filters restores it
- [ ] Editing both sides of a transaction by the same amount is saved; changing only one side leaves "Save transaction" disabled
- [ ] Deleting a transaction removes it from the list, the account balances and Home, also after a reload
- [ ] Cancelling the delete confirmation keeps the transaction

## Tasks

- [[T061-transactions-list]]
- [[T062-edit-and-delete-transaction]]

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

## QA
