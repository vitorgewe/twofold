---
id: T092
type: task
feature: "[[F09-data-safety]]"
milestone: "[[M4-safety-and-delivery]]"
status: review
depends_on: ["[[T091-backup-export-import]]", "[[T042-save-transaction]]"]
estimate_tokens: 800000
estimate_hours: 1
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T092 CSV import

## Goal

The user imports transactions from a CSV in the documented format, all or nothing, and can repeat the import without duplicates.

## Description

Add "Import CSV" to Settings (T091). The format is in the spec and [[ADR-0011-backup-and-csv-import]]: columns `transaction_id, date, description, account, account_type, side, amount, currency, rate_to_brl`, one row per posting, rows with the same `transaction_id` forming one transaction.

- Migration 3 adds a nullable unique `external_id` column to `transactions` that stores the CSV `transaction_id`.
- A parser in `src/features/import/` (quoted fields with commas, header check, line numbers) and a validator: dates, side, amounts parsed with `parseAmount` for the row's currency, unknown currencies rejected, `rate_to_brl` required for non-BRL rows, an account keeps one type and one currency across the file, `account_type` required when the account does not exist yet, and each transaction passes `assertBalanced` after conversion to BRL.
- A preview before writing: accounts to create, new transactions, transactions that already exist (skipped), posting count, and the list of errors with line numbers. "Import" is disabled while there are errors.
- The write is atomic. Transactions whose `transaction_id` already exists are skipped.
- A fixture file with the spec example plus a case with one credit and three debits.

Out of scope: other file formats, column mapping.

## Definition of Done

- [x] The spec example (t-0001 Supermarket, t-0002 Buy BTC) previews 3 accounts to create and 2 new transactions, imports, and leaves net worth at -R$ 300.00 (Checking -2,050.00 and Crypto +1,750.00 on the books)
- [x] Importing the same file again previews 0 new and 2 existing, and net worth is unchanged
- [x] A file where t-0002 lost its Checking row is rejected as a whole, the error names the transaction and the line, and nothing is written
- [x] A BTC row without a rate, and an amount with too many decimals, are rejected with their line numbers
- [x] A description containing a comma inside quotes is imported intact
- [x] Jest tests for the parser and the validator; a Playwright test imports the fixture twice

## Related decisions

- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0009-balance-invariant]]
- [[ADR-0008-uuid-identifiers]]

## Progress

### 2026-10-11 12:55
- Done: Import CSV in Settings with preview (accounts to create, new, existing, postings, errors with line numbers; Import disabled on errors). Parser (`src/features/import/csv.ts`), validator (`validate.ts`, pure), DB layer (`src/data/csvImport.ts`, one SQLite transaction, reuses `createAccount`/`createTransaction`). Fixtures in `e2e/fixtures/` (`example.csv` is the spec example, `split.csv` is one credit, three debits and a quoted comma). Seen working at 390x844 in a fresh browser context via Playwright (`e2e/csv-import.spec.ts`): example previews 3/2, imports, net worth -R$300.00 after reload; second import previews 0 new / 2 existing, net worth unchanged; broken files rejected with line numbers and disabled Import; quoted comma kept in the transactions list. `.relay/verify.sh` prints `verify: ok`.
- Failed or surprising: the ticket says "Migration 3" but version 3 was already the date index, so `external_id` is migration version 4 (unique index, since SQLite cannot add a UNIQUE column). The backup format carries an optional `external_id` per transaction (format_version stays 1, old backups still load) so a restore keeps the import idempotent; covered by a Jest test. The ticket's "a fixture file" became two files because the DoD needs the spec example alone. The dev server had to be restarted with `.relay/init.sh --restart` to pick up new files.
- Next: nothing left for this task. Rules I chose: accounts match by case-insensitive name among active accounts; BRL rows must leave rate_to_brl empty; accounts to create are counted only for new transactions.

## QA
