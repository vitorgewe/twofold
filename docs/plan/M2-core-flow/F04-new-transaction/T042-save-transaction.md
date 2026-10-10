---
id: T042
type: task
feature: "[[F04-new-transaction]]"
milestone: "[[M2-core-flow]]"
status: todo
depends_on: ["[[T041-transaction-form]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T042 Save transaction

## Goal

Saving the form writes the transaction to the database and returns the user to Home.

## Description

Wire `onSubmit` of the new-transaction route to `createTransaction` (T025). While saving, disable the button so a double tap cannot create two transactions. On success navigate to Home; on a rejected write show the error and keep the form as it was. Trim the description.

Add `e2e/new-transaction.spec.ts`: create two accounts through the Accounts screen, save a balanced transaction, land on Home, open the accounts and find the new balances after a reload.

Out of scope: Home figures (T051), editing and deleting (T062).

## Definition of Done

- [ ] Saving a balanced transaction returns to Home, and the affected account balances on the Accounts screen are updated, also after a full page reload
- [ ] Tapping "Save transaction" twice quickly creates exactly one transaction
- [ ] When the repository rejects the write, the error is shown and the form keeps its values
- [ ] `e2e/new-transaction.spec.ts` passes

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

## QA
