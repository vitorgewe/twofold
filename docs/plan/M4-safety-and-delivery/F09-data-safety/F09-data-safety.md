---
id: F09
type: feature
milestone: "[[M4-safety-and-delivery]]"
status: todo
estimate_tokens: 1200000
estimate_hours: 1.5
tags: [feature]
---
# F09 Data safety

## Goal

The user cannot lose their data: everything can be exported and restored, and the history of the old app can be imported once, safely, and repeatedly without duplicates.

## Description

The Settings screen offers Export backup, Import backup and Import CSV, and shows the app version. Home warns when there has been no backup for 30 days.

## Definition of Done

- [ ] Export a backup, open the app in a fresh browser profile, import it, and net worth and the number of transactions match the values before
- [ ] A backup file with a changed posting is rejected and the database is unchanged
- [ ] The sample CSV from the spec imports two transactions and three accounts, and importing it again reports no new transactions
- [ ] A CSV with one posting missing is rejected as a whole, listing the failing line

## Tasks

- [[T091-backup-export-import]]
- [[T092-csv-import]]

## Related decisions

- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0003-local-first-sqlite-storage]]

## Progress

## QA
