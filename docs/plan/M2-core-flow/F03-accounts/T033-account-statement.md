---
id: T033
type: task
feature: "[[F03-accounts]]"
milestone: "[[M2-core-flow]]"
status: todo
depends_on: ["[[T031-accounts-screen]]", "[[T032-adjust-value]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T033 Account statement

## Goal

The user can open an account and read its postings with a running balance.

## Description

Route `app/accounts/[id].tsx`, opened by tapping an account row. List the account's postings newest first with date, transaction description, the signed amount and the running balance, using `MoneyText` (BRL main, original currency muted). A pure function computes running balances. Include a way back to the list, an empty state, and a not-found message for an unknown id.

Out of scope: editing or deleting from the statement (that is T062).

## Definition of Done

- [ ] After the adjustments from T032, the statement of "Cash USD" lists the +200.00 and the -50.00 rows newest first, with running balances R$ 150.00 and R$ 200.00 respectively
- [ ] A new account's statement shows an empty state
- [ ] Opening `/accounts/<id>` directly after a reload works; an unknown id shows a not-found message with a link back
- [ ] Jest test for the running balance function, including postings on the same date
- [ ] Nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0005-folder-structure]]
- [[ADR-0010-net-worth-from-ledger]]

## Progress

## QA
