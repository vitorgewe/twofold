---
id: T091
type: task
feature: "[[F09-data-safety]]"
milestone: "[[M4-safety-and-delivery]]"
status: todo
depends_on: ["[[T051-home-screen]]", "[[T062-edit-and-delete-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T091 Backup export and import

## Goal

The user can export all data to one file and restore it.

## Description

Route `app/settings.tsx` with a "Settings" entry in the layout. A "Backup" section with:

- "Export backup": produces `twofold-backup-YYYY-MM-DD.json` containing a `format_version`, the export time and every table (currencies, accounts, transactions, postings, rates). On web it downloads; on devices it uses the share sheet. After a successful export set `last_backup_at` in `meta`, which Home reads (T051).
- "Import backup": a file picker, then validation, then a preview with counts (accounts, transactions, postings, rates) and a warning that the current data will be replaced. Validation checks `format_version`, references between records, and that every transaction balances using `assertBalanced`. The replacement is atomic; on any failure the database is left unchanged and the reasons are shown.
- A row showing the app version read from the Expo configuration, for example "Version 0.1.0".

Out of scope: CSV (T092), automatic or cloud backup.

## Definition of Done

- [ ] With two accounts and a transaction, export a backup, open the app in a fresh browser profile (no data), import the file: net worth and the transaction count match the values before the export
- [ ] A file with one posting amount changed by 1 is rejected with a clear message and the existing data is unchanged
- [ ] A file with an unknown `format_version` is rejected
- [ ] After an export, the backup warning on Home turns plain and reads "Last backup today"
- [ ] Settings shows the app version
- [ ] Jest tests for the serializer and the validator; a Playwright test downloads the file and re-imports it

## Related decisions

- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0009-balance-invariant]]
- [[ADR-0014-versioning-and-release]]

## Progress

## QA
