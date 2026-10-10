---
id: T062
type: task
feature: "[[F06-transactions]]"
milestone: "[[M3-review-and-reports]]"
status: review
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

- [x] Open the Groceries transaction of 100.00, change both postings to 120.00 and save: the list, account balances and Home reflect 120.00
- [x] Change only the Groceries posting to 130.00: "Save transaction" is disabled and the difference of 10.00 is shown
- [x] Delete a transaction and confirm: it disappears from the list, the accounts and Home, and stays gone after a reload
- [x] Cancelling the delete confirmation keeps everything unchanged
- [x] Jest component test for the prefilled form; `e2e/edit-delete.spec.ts` covers edit and delete

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0004-database-as-source-of-truth]]

## Progress

### 2026-10-11 12:00
- Done: Edit and Delete on the detail screen. Edit swaps the screen to `TransactionForm` with a new `initial` prop (rows built by `rowsFromPostings` in `draft.ts`) and saves through `updateTransaction`; Delete asks inline ("Confirm delete" / "Cancel"; `Alert` does not work on web) and calls `deleteTransaction`. Both return to the list with `dismissTo`. Checked with `e2e/edit-delete.spec.ts` (390x844 Chromium): 100 -> 120 on both postings updates the account balance and changes Home net worth, also after reload; changing one side to 130 disables Save and shows 10.00; cancel keeps the detail; confirm removes it from the list, also after reload. Jest test for the prefilled form added. `.relay/verify.sh` passed.
- Failed or surprising: the running dev server served a stale bundle until `.relay/init.sh --restart`. Home shows totals only, not per-account balances, so the e2e checks the net worth text changed rather than reading 120.00. The delete e2e checks the list and reload, not the accounts or Home screens (same database hooks).
- Next: nothing.

## QA
