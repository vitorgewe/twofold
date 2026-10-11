---
id: T091
type: task
feature: "[[F09-data-safety]]"
milestone: "[[M4-safety-and-delivery]]"
status: done
depends_on: ["[[T051-home-screen]]", "[[T062-edit-and-delete-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 115459
actual_hours: 0.07
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

- [x] With two accounts and a transaction, export a backup, open the app in a fresh browser profile (no data), import the file: net worth and the transaction count match the values before the export
- [x] A file with one posting amount changed by 1 is rejected with a clear message and the existing data is unchanged
- [x] A file with an unknown `format_version` is rejected
- [x] After an export, the backup warning on Home turns plain and reads "Last backup today"
- [x] Settings shows the app version
- [x] Jest tests for the serializer and the validator; a Playwright test downloads the file and re-imports it

## Related decisions

- [[ADR-0011-backup-and-csv-import]]
- [[ADR-0009-balance-invariant]]
- [[ADR-0014-versioning-and-release]]

## Progress

### 2026-10-11 11:45
- Done: `/settings` route (linked from Home) with Export backup, Import backup (picker, validation, preview with counts and replace warning, confirm) and the app version. Pure validator/serializer in `src/features/backup/format.ts` (version, shape, references, `assertBalanced`, BRL value vs amount times rate); atomic replace in `src/data/backup.ts`; `last_backup_at` set after the file is handed over. Added expo-document-picker, expo-sharing and expo-file-system (managed-workflow modules). Checked in the browser with `e2e/backup.spec.ts` (download, import into a fresh context with matching net worth and transaction count, tampered amount and format_version 99 rejected with data unchanged, Home shows "Last backup today", version shown) and by hand at 390x844. `.relay/verify.sh` passes.
- Failed or surprising: the dev server showed "Version 0.0.0" because Metro had cached an old app.json manifest; `npx expo export --platform web --clear` plus `.relay/init.sh --restart` fixed it (a machine with a stale cache may need the same). Native share sheet and file picker are not testable on web; they need a manual device check.
- Next: nothing left for this task; T092 (CSV) can reuse `validateBackup`-style error lists.

## QA
