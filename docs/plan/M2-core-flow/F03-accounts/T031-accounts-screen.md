---
id: T031
type: task
feature: "[[F03-accounts]]"
milestone: "[[M2-core-flow]]"
status: todo
depends_on: ["[[T023-database-schema-and-accounts-repository]]", "[[T024-net-worth-and-income-statement]]", "[[T025-transactions-and-rates-repositories]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
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

- [ ] At 390 x 844, create "Checking" (Asset, BRL) and "Cash USD" (Asset, USD): both appear under Asset; Checking shows R$ 0.00 and Cash USD shows R$ 0.00 with a muted USD 0.00
- [ ] After a full page reload both accounts are still listed
- [ ] Renaming an account updates its row; archiving hides it, and "Show archived" shows it again
- [ ] Creating an account with a name already in use shows an error and creates nothing
- [ ] With no accounts, an empty state explains how to create the first one
- [ ] Nothing is clipped or overlapping and there is no horizontal scroll at 390 x 844
- [ ] Jest component tests: `MoneyText` for a BRL value and for a foreign value; the form validation. `e2e/accounts.spec.ts` passes

## Related decisions

- [[ADR-0004-database-as-source-of-truth]]
- [[ADR-0005-folder-structure]]
- [[ADR-0012-english-only]]
- [[ADR-0002-expo-router]]

## Progress

## QA
