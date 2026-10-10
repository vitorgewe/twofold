---
id: T033
type: task
feature: "[[F03-accounts]]"
milestone: "[[M2-core-flow]]"
status: review
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

- [x] After the adjustments from T032, the statement of "Cash USD" lists the +200.00 and the -50.00 rows newest first, with running balances R$ 150.00 and R$ 200.00 respectively
- [x] A new account's statement shows an empty state
- [x] Opening `/accounts/<id>` directly after a reload works; an unknown id shows a not-found message with a link back
- [x] Jest test for the running balance function, including postings on the same date
- [x] Nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0005-folder-structure]]
- [[ADR-0010-net-worth-from-ledger]]

## Progress

### 2026-10-10 22:30
- Done: `buildStatement` (pure, `src/features/ledger/statement.ts`) with Jest tests including same-date postings, liabilities and the -0 case. `getAccount`, `getAccountStatement` and `useAccountStatement` in the data layer; `listPostingsForAccount` now also returns the description. Route `app/accounts/[id].tsx`, `StatementScreen`, and account names on the Accounts screen are links to it. Checked in the browser at 390x844: Cash USD lists -R$ 50.00 (balance R$ 150.00) above +R$ 200.00 (balance R$ 200.00); "Cash USD 2" shows the empty state; direct load of `/accounts/<id>` works; `/accounts/does-not-exist` shows "Account not found"; "Back to accounts" returns to the list; nothing clipped. `.relay/verify.sh` passes.
- Failed or surprising: the first version printed "-USD 0.00" on the credit adjustment (sign * 0 = -0); fixed and tested. The DoD text lists "+200.00 and -50.00 ... R$ 150.00 and R$ 200.00 respectively", which read literally contradicts newest-first order; the screen shows -50.00 / R$ 150.00 first and +200.00 / R$ 200.00 second, which is the arithmetically correct pairing. The dev server needed `.relay/init.sh --restart` to regenerate typed routes and pick up edits.
- Next: nothing left for this task.

## QA
