---
id: T092
type: task
feature: "[[F09-data-safety]]"
milestone: "[[M4-safety-and-delivery]]"
status: todo
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

- [ ] The spec example (t-0001 Supermarket, t-0002 Buy BTC) previews 3 accounts to create and 2 new transactions, imports, and leaves net worth at -R$ 300.00 (Checking -2,050.00 and Crypto +1,750.00 on the books)
- [ ] Importing the same file again previews 0 new and 2 existing, and net worth is unchanged
- [ ] A file where t-0002 lost its Checking row is rejected as a whole, the error names the transaction and the line, and nothing is written
- [ ] A BTC row without a rate, and an amount with too many decimals, are rejected with their line numbers
- [ ] A description containing a comma inside quotes is imported intact
- [ ] Jest tests for the parser and the validator; a Playwright test imports the fixture twice

## Related decisions

- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0009-balance-invariant]]
- [[ADR-0008-uuid-identifiers]]

## Progress

## QA
