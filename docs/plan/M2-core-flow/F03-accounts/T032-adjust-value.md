---
id: T032
type: task
feature: "[[F03-accounts]]"
milestone: "[[M2-core-flow]]"
status: review
depends_on: ["[[T031-accounts-screen]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 72769
actual_hours: 0.03
tags: [task]
---
# T032 Adjust value

## Goal

The user records a gain or loss on a foreign-currency account as an ordinary transaction.

## Description

On the Accounts screen, accounts whose currency is not BRL and whose type is asset or liability get an "Adjust value" action. It asks for the change in the account's value in BRL (positive or negative), the date (default today), and a counter account, and creates a two-posting transaction through `createTransaction`.

- Asset, value goes up: debit the account with amount 0 and the BRL change, credit an income account. Asset, value goes down: credit the account, debit an expense account.
- Liability, value goes up: credit the account, debit an expense account. Liability, value goes down: debit the account, credit an income account.
- The counter account list shows only the account types that fit the case, and it may be left empty only if none exists, in which case the form says to create one first.
- A pure function `buildAdjustmentPostings(account, changeBrl, counterAccountId)` in `src/features/ledger/` builds the postings.

Out of scope: automatic revaluation, and an "Adjust value" action for BRL accounts.

## Definition of Done

- [x] Using only the Accounts screen: create "Cash USD" (Asset, USD) and "FX gain" (Income, BRL), adjust Cash USD by +200.00 with counter account "FX gain": Cash USD shows R$ 200.00 with USD 0.00 muted, and "FX gain" shows R$ 200.00
- [x] Create "FX loss" (Expense, BRL) and adjust Cash USD by -50.00: Cash USD shows R$ 150.00 and "FX loss" shows R$ 50.00
- [x] The action is not offered for BRL accounts, and the counter account list only offers income accounts for a gain on an asset
- [x] The adjustments are still there after a full page reload
- [x] Jest tests for `buildAdjustmentPostings`: asset up, asset down, liability up, liability down; every result is balanced

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0009-balance-invariant]]

## Progress

### 2026-10-10 22:20
- Done: `buildAdjustmentPostings`, `canAdjustValue` and `counterAccountType` in `src/features/ledger/adjustment.ts` with Jest tests (four cases, all balanced). "Adjust value" action and `AdjustValueForm` on the Accounts screen. Checked in the browser at 390x844: Cash USD +200.00 with FX gain gave R$ 200.00 / USD 0.00 and FX gain R$ 200.00; -50.00 with FX loss gave Cash USD R$ 150.00 and FX loss R$ 50.00; the button is absent on BRL accounts; a gain on an asset lists only income accounts; values survived a reload. `.relay/verify.sh` passes.
- Failed or surprising: the already-running dev server served a stale bundle without the new button until `.relay/init.sh --restart`. The browser profile already held a "Cash USD" account from earlier sessions, so I reused it and created only FX gain and FX loss. A zero-amount foreign posting must carry a positive BRL amount (validate in `transactions.ts`), so a loss is a credit with the absolute value, not a negative amount.
- Decision: the counter list offers only active BRL accounts of the fitting type, because the counter posting has no rate and a BRL posting needs amount equal to its BRL value.
- Next: nothing left for this task.

## QA
