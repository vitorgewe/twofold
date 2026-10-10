---
id: ADR-0011
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, data, safety]
---
# ADR-0011 Backup file and CSV import

## Context

Data lives only on the device ([[ADR-0003-local-first-sqlite-storage]]), so losing the device, reinstalling the app or clearing the browser storage would lose everything. The author does not accept losing data. The author also needs to bring in history from another app once, and can shape that export freely.

## Options considered

1. Rely on device backups only: nothing to build. Rejected: not under the author's control and not verifiable.
2. Manual export and import of a full JSON file, with the last backup date shown: simple, under the author's control, works on phone and web. Costs: the author has to export.
3. Automatic cloud backup: no manual step. Rejected for now: needs an account and a service.
4. CSV with a custom format designed for this app, instead of parsing the old app's native export: the author adapts the source side. Costs: a documented format.

## Decision

Options 2 and 4. Settings has Export backup (one JSON file with all data), Import backup (restore) and Import CSV. Home shows the date of the last export and warns when it is older than 30 days. The CSV has one row per posting with columns `transaction_id, date, description, account, account_type, side, amount, currency, rate_to_brl`, and rows with the same `transaction_id` form one transaction. Import is all or nothing: if any transaction does not balance ([[ADR-0009-balance-invariant]]) the whole file is rejected with the failing lines listed. A preview shows accounts to create, new transactions and ones that already exist. Transactions whose `transaction_id` already exists are skipped, so the same file can be imported twice safely.

## Consequences

Easier: data is portable and recoverable. Harder: protection depends on the author exporting. Checks: reinstall the app, import the latest backup, and net worth and transaction count must match the values before. Importing the same CSV twice must report 0 new transactions and leave net worth unchanged. A CSV with one posting missing must be rejected entirely.
