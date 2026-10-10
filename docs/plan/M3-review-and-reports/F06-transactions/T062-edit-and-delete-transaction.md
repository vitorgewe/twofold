---
id: T062
type: task
feature: "[[F06-transactions]]"
milestone: "[[M3-review-and-reports]]"
status: todo
depends_on: ["[[T061-transactions-list]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T062 Edit and delete transaction

## Goal

The user can correct or remove a transaction, and the books stay balanced.

## Description

In the detail view (T061) add "Edit" and "Delete". Edit opens `TransactionForm` (T041) prefilled with the transaction, and saves through `updateTransaction`; the form's own rule keeps "Save transaction" disabled while the sides differ. Delete asks for confirmation and calls `deleteTransaction`. After either action return to the list.

Out of scope: reversal entries and an audit trail ([[ADR-0009-balance-invariant]]).

## Definition of Done

- [ ] Open the Groceries transaction of 100.00, change both postings to 120.00 and save: the list, account balances and Home reflect 120.00
- [ ] Change only the Groceries posting to 130.00: "Save transaction" is disabled and the difference of 10.00 is shown
- [ ] Delete a transaction and confirm: it disappears from the list, the accounts and Home, and stays gone after a reload
- [ ] Cancelling the delete confirmation keeps everything unchanged
- [ ] Jest component test for the prefilled form; `e2e/edit-delete.spec.ts` covers edit and delete

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

## QA
