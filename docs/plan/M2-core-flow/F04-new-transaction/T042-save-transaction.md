---
id: T042
type: task
feature: "[[F04-new-transaction]]"
milestone: "[[M2-core-flow]]"
status: review
depends_on: ["[[T041-transaction-form]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 95012
actual_hours: 0.08
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

- [x] Saving a balanced transaction returns to Home, and the affected account balances on the Accounts screen are updated, also after a full page reload
- [x] Tapping "Save transaction" twice quickly creates exactly one transaction
- [x] When the repository rejects the write, the error is shown and the form keeps its values
- [x] `e2e/new-transaction.spec.ts` passes

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

### 2026-10-10 23:35
- Done: the route saves through `createTransaction` and replaces to Home. `TransactionForm.onSubmit` may now return a promise; a ref guard plus a `saving` state disable the button, the description is already trimmed on submit, and a rejection is shown under the summary while the form keeps its values (the guard is released only on failure, so a late tap after success cannot save twice). Checked in the browser at 390x844 with `e2e/new-transaction.spec.ts` (passes): two accounts created, a `dblclick` on Save creates exactly one transaction, Home appears, and both balances show 42.50 before and after `page.reload()`. `.relay/verify.sh` passes.
- Failed or surprising: the dev server that was already running served the old `app/transactions/new.tsx` (save did nothing) until `.relay/init.sh --restart`. The form blocks every invalid input, so a rejected write cannot be triggered by clicking in the app; I saw the error path in `SaveTransaction.test.tsx` instead, which renders the real route against a real SQLite test database and archives the chosen account before saving. That is the evidence for the third Definition of Done item, not a manual run in the browser. A unit test that overlaps two presses breaks later tests (an `act` scope stays open), so the overlap is covered by the e2e `dblclick`, and the component test covers the tap after success.
- Next: nothing left for this task.

## QA
