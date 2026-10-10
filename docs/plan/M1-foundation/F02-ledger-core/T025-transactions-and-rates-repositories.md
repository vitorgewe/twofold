---
id: T025
type: task
feature: "[[F02-ledger-core]]"
milestone: "[[M1-foundation]]"
status: todo
depends_on: ["[[T022-balance-invariant]]", "[[T023-database-schema-and-accounts-repository]]", "[[T024-net-worth-and-income-statement]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T025 Transactions and rates repositories

## Goal

Transactions with any number of postings, and rates, can be stored, read, edited and deleted without ever breaking the balance rule.

## Description

`src/data/transactions.ts`: `createTransaction({ date, description, postings })`, `updateTransaction(id, ...)` which replaces the postings, `deleteTransaction(id)`, `getTransaction`, `listTransactions({ from, to, accountId })` and `listPostingsForAccount(accountId)`.

Every write runs inside one database transaction, calls `assertBalanced` (T022) and rolls back completely on failure. Rules checked on every write:

- A BRL account posting has `amount` equal to `amount_brl` and no rate.
- A foreign-currency posting with amount above 0 needs a rate.
- A foreign-currency posting may have amount 0 only as a value adjustment, with a positive BRL amount ([[ADR-0010-net-worth-from-ledger]]).
- Archived accounts cannot receive postings, and a posting uses its account's currency.

`src/data/rates.ts`: `addRate`, `latestRate(currency)` and `listRates(currency)`. Adding a rate for the same currency and date replaces it.

Hooks: `useTransactions`, `useAccountsWithBalances` (accounts plus the balances from T024) and `useRates`, all built on `useQuery`. Every write calls `notifyDataChanged()`.

Out of scope: any screen, backup and import.

## Definition of Done

- [ ] Jest: a transaction with one credit and three debits is stored and read back with every amount and BRL value intact
- [ ] Jest: creating or updating to an unbalanced transaction is rejected and the database is unchanged
- [ ] Jest: an update that changes one amount and keeps the balance is accepted; one that unbalances is rejected
- [ ] Jest: deleting a transaction removes all its postings
- [ ] Jest: after a seeded random sequence of creates, updates and deletes, a SQL query finds no transaction whose debits differ from its credits
- [ ] Jest: the BRL, foreign-currency, zero-amount and archived-account rules, and same-day rate replacement
- [ ] `.relay/verify.sh` passes

## Related decisions

- [[ADR-0009-balance-invariant]]
- [[ADR-0007-integer-money]]
- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0008-uuid-identifiers]]

## Progress

## QA
