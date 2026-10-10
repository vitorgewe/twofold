---
id: T023
type: task
feature: "[[F02-ledger-core]]"
milestone: "[[M1-foundation]]"
status: todo
depends_on: ["[[T012-sqlite-web-persistence]]", "[[T021-money-and-currency]]", "[[T022-balance-invariant]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T023 Database schema and accounts repository

## Goal

The ledger tables exist, and accounts can be created, listed, renamed and archived through a repository and a hook.

## Description

Migration 2 in `src/data/migrations/` creates:

- `currency(code, name, decimals)`, seeded with BRL 2, USD 2 and BTC 8. There is no UI to add currencies in this version, and unknown codes are rejected everywhere.
- `account(id, name, type, currency, archived)`; type is one of asset, liability, equity, income, expense. The currency cannot change after creation.
- `transactions(id, date, description)`, `postings(id, transaction_id, account_id, side, amount, rate, amount_brl)` with postings deleted together with their transaction, and `rate(currency, date, rate_scaled)` with the pair currency and date as key.
- Dates are calendar dates stored as `YYYY-MM-DD` text, with no time zone.

Also create:

- `src/data/ids.ts` with `newId()` returning a UUID v4.
- `src/data/changes.ts` with `notifyDataChanged()`, called by every repository write.
- `src/data/useQuery.ts`, a hook that runs a query function and runs it again after any change notification.
- `getMeta` and `setMeta` helpers over the `meta` table.
- `src/data/accounts.ts`: create, rename, archive, unarchive and list accounts (with an option to include archived). An active account name must be unique, ignoring case.

Test the repository against the real SQL adapter from T012.

Out of scope: transactions, postings and rates repositories (T025), and any screen.

## Definition of Done

- [ ] Jest: the migrations create all tables on an empty database, are idempotent, and seed BRL 2, USD 2, BTC 8
- [ ] Jest: create, rename, archive and list accounts work; a duplicate active name, an unknown currency and a currency change are rejected
- [ ] Jest component test: a component using `useQuery` shows new data after a repository write, without a reload
- [ ] Ids are UUID v4 strings
- [ ] `.relay/verify.sh` passes

## Related decisions

- [[ADR-0003-local-first-sqlite-storage]]
- [[ADR-0004-database-as-source-of-truth]]
- [[ADR-0005-folder-structure]]
- [[ADR-0008-uuid-identifiers]]

## Progress

## QA
