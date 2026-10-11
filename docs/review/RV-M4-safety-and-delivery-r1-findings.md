---
type: review-findings
milestone: "[[M4-safety-and-delivery]]"
round: 1
findings: 8
tags: [review]
---
# Review M4-safety-and-delivery, round 1

## F1 UI labels hard-coded outside src/ui/strings
- Source: code-review
- Where: src/features/backup/SettingsScreen.tsx:145
- Severity: blocker
- Finding: The preview labels `'Accounts'`, `'Transactions'`, `'Postings'` and `'Rates'` are string literals in the screen, passed to `t.count(...)`. The CSV preview next to it uses `t.csvAccountsToCreate` and the other keys from `strings`.
- Why it matters: The constitution says "UI strings live in `src/ui/strings`" (Language section, ADR-0012). These four labels break that rule.
- Suggested change: Add `accounts`, `transactions`, `postings` and `rates` labels to `strings.settings` and use them at lines 145-148. Not checked: whether the validator and parser error messages in `format.ts`, `validate.ts` and `csv.ts`, which also reach the screen, follow the same rule or are an accepted exception.

## F2 Backup validation does not mirror the DB unique indexes
- Source: code-review
- Where: src/features/backup/format.ts:108
- Severity: important
- Finding: `validateBackup` checks duplicate ids but not two active accounts with the same name ignoring case (index `account_active_name`, migration 002) or two transactions with the same `external_id` (index `transactions_external_id`, migration 004). `src/data/backup.test.ts:68` already shows that the import rolls back on the first case.
- Why it matters: The rollback keeps the data safe, but the user sees the preview and then, after confirming, a raw message such as `UNIQUE constraint failed: transactions.external_id` (shown by `onConfirm`, SettingsScreen.tsx:67). Validation is supposed to reject the file before that point, with a reason the user can act on.
- Suggested change: In `validateBackup`, reject duplicate `external_id` values among transactions, and duplicate `name.toLowerCase()` among accounts with `archived === false`, with messages in the style of the existing duplicate checks.

## F3 Backup export reads six tables outside a transaction
- Source: code-review
- Where: src/data/backup.ts:9
- Severity: important
- Finding: `exportBackup` awaits six separate SELECTs. A write that lands between them (for example a transaction added while the export runs) gives a file with postings that point to a missing transaction, or the reverse.
- Why it matters: `validateBackup` rejects such a file ("points to a missing transaction"), so the one backup the user took cannot be restored. The window is small, but this is the data-safety feature.
- Suggested change: Run the reads inside `db.transaction(async (tx) => ...)`, as `importBackup` and `applyCsvImport` already do.

## F4 A backup without the BRL currency is accepted and breaks the app after import
- Source: code-review
- Where: src/data/backup.ts:34
- Severity: important
- Finding: `importBackup` deletes the `currency` table and refills it from the file. `validateBackup` only requires that account and rate currencies exist in the file, not that BRL is there. `createAccount` reads `SELECT code FROM currency` and fails with `Unknown currency`.
- Why it matters: A hand-edited or incomplete backup passes validation and removes the old data. Afterwards creating any BRL account fails. This needs a hand-edited file, since this app's own export always includes BRL.
- Suggested change: In `validateBackup`, fail with a clear message when `currencies` has no entry with `code === BRL.code` (BRL is already imported in format.ts).

## F5 Export is marked as done when the share sheet is dismissed
- Source: code-review
- Where: src/features/backup/SettingsScreen.tsx:38
- Severity: important
- Finding: `markBackupDone` runs after `saveBackupFile` resolves. On a device `Sharing.shareAsync` resolves whether or not the user saved the file, and it returns no result to tell the two apart. I could not run it on a device, so this rests on the expo-sharing API as I know it.
- Why it matters: Cancelling the share sheet still sets `last_backup` and shows the success message, so Home stops warning that there is no backup.
- Suggested change: The API cannot tell, so pick one: word the success message as "Backup ready to share" and record that limit in the ticket, or write the file to a persistent location the app controls on native and mark done after that write. Decide and record the choice; the author should say which.

## F6 CSV import writes external_id in a second UPDATE
- Source: code-review
- Where: src/data/csvImport.ts:45
- Severity: nit
- Finding: `createTransaction` does not take an external id, so `applyCsvImport` runs `UPDATE transactions SET external_id = ?` after each create. `createTransaction` also reads the row back with `getTransaction`, which the import does not need.
- Why it matters: Three places now write `external_id` (the `createTransaction` INSERT does not, the UPDATE here and the backup INSERT do). If `createTransaction` gains new behaviour, this path can drift from it and break idempotency.
- Suggested change: Add an optional `externalId` to `TransactionInput` and to the INSERT in `createTransaction` (src/data/transactions.ts:134), and drop the UPDATE.

## F7 Group validity breaks after the error cap
- Source: code-review
- Where: src/features/import/validate.ts:117
- Severity: nit
- Finding: `rowOk` is `errors.length === before`, but `fail` stops appending at `MAX_ERRORS` (50). After the cap, a bad row counts as ok and is pushed into its group as a posting.
- Why it matters: The import stays blocked because `errors.length > 0`, but `postingCount` and `newTransactions` shown in the preview are wrong for files with more than 50 errors.
- Suggested change: Count failures with a local flag set inside `fail` for the current row (for example `let rowFailed = false` reset per row and set by a wrapper around `fail`), and use it for `rowOk` and for `group.ok`.

## F8 Quoted CSV field accepts trailing characters
- Source: code-review
- Where: src/features/import/csv.ts:63
- Severity: nit
- Finding: After the closing quote, `quoted` is false and further characters are appended to the field. `"a"b` becomes `ab`, and `"Cash" ` keeps its trailing space because quoted fields are not trimmed. Unreported malformed input contradicts the parser's promise of line-numbered errors.
- Why it matters: The effect is small: account names are trimmed later, so the main cost is silent acceptance of broken rows and trailing spaces in descriptions.
- Suggested change: Track that a quoted field just closed. Ignore whitespace after it, and make any other character before `,` or a newline a parse error with the line number.
