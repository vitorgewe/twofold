---
id: T031
type: task
feature: "[[F03-accounts]]"
milestone: "[[M2-core-flow]]"
status: done
depends_on: ["[[T023-database-schema-and-accounts-repository]]", "[[T024-net-worth-and-income-statement]]", "[[T025-transactions-and-rates-repositories]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 63016
actual_hours: 0.04
tags: [task]
---
# T031 Accounts screen

## Goal

The user can see the chart of accounts and create, rename and archive accounts.

## Description

Route `app/accounts.tsx`, with an "Accounts" entry in the layout. Use the exact labels in the smoke test contract in [[plan]].

- Create `src/ui/MoneyText.tsx`: the BRL value is the main text; when the account currency is not BRL, the original amount appears smaller and muted next to or below it. Nothing extra is shown for BRL.
- Accounts are grouped by type (Asset, Liability, Equity, Income, Expense), each row showing the name and the balance from `useAccountsWithBalances`.
- "New account" opens a form: "Account name", radios Asset, Liability, Equity, Income, Expense, a "Currency" control that defaults to BRL and offers BRL, USD and BTC, and a "Save account" button.
- Rows offer rename and archive. A "Show archived" toggle reveals archived accounts.
- Add `e2e/accounts.spec.ts`: create an account, reload, find it again.

Out of scope: statement (T033), value adjustment (T032).

## Definition of Done

- [x] At 390 x 844, create "Checking" (Asset, BRL) and "Cash USD" (Asset, USD): both appear under Asset; Checking shows R$ 0.00 and Cash USD shows R$ 0.00 with a muted USD 0.00
- [x] After a full page reload both accounts are still listed
- [x] Renaming an account updates its row; archiving hides it, and "Show archived" shows it again
- [x] Creating an account with a name already in use shows an error and creates nothing
- [x] With no accounts, an empty state explains how to create the first one
- [x] Nothing is clipped or overlapping and there is no horizontal scroll at 390 x 844
- [x] Jest component tests: `MoneyText` for a BRL value and for a foreign value; the form validation. `e2e/accounts.spec.ts` passes

## Related decisions

- [[ADR-0004-database-as-source-of-truth]]
- [[ADR-0005-folder-structure]]
- [[ADR-0012-english-only]]
- [[ADR-0002-expo-router]]

## Progress

### 2026-10-10 22:20
- Done: finished the accounts screen started by an earlier session (route, form, rows, MoneyText, archived toggle, empty state, home link). Checked in the app at 390 x 844 with Playwright: created Checking and Cash USD under Asset (Cash USD shows R$0.00 with muted USD 0.00), both survive a reload, rename and archive work, "Show archived" reveals archived accounts (also after reload), a duplicate name shows an error and creates nothing, a fresh browser context shows the empty state, and there is no horizontal scroll. `e2e/accounts.spec.ts` passes; `.relay/verify.sh` prints `verify: ok`.
- Failed or surprising: the typed-routes file was stale and failed typecheck on `/accounts` until `.relay/init.sh --restart` regenerated it. The RNTL version here makes `render` and `fireEvent` async, so the new component tests needed `await`. Jest runs in the machine locale (pt-BR, `R$ 123,45`), so the MoneyText test patterns accept `.` or `,` as decimal separator. The e2e smoke contract fixes en-US, so the UI itself is unchanged.
- Next: nothing left for this task. The evaluator can review it.

## QA
