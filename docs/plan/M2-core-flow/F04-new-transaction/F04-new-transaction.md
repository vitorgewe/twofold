---
id: F04
type: feature
milestone: "[[M2-core-flow]]"
status: todo
estimate_tokens: 950000
estimate_hours: 1.25
tags: [feature]
---
# F04 New transaction

## Goal

The user records a transaction with any number of postings, in any of the listed currencies, and can only save it when it balances.

## Description

From Home the user taps "New transaction", enters a date and description, adds postings (account, debit or credit, amount in the account's currency) and watches the difference between debits and credits in BRL. Saving is possible only when the difference is zero. After saving, the user lands on Home.

## Definition of Done

- [ ] One credit of R$ 1,000.00 split across three debits saves only when the three debits sum to R$ 1,000.00
- [ ] While the sides differ, the screen shows the difference and "Save transaction" is disabled
- [ ] A saved transaction shows in the account balances after a reload
- [ ] A USD posting of 100.00 at rate 5.20 shows a BRL value of 520.00, which the user can edit

## Tasks

- [[T041-transaction-form]]
- [[T042-save-transaction]]

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0007-integer-money]]

## Progress

## QA
