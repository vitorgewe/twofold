---
type: review-findings
milestone: "[[M4-safety-and-delivery]]"
round: 2
findings: 3
tags: [review]
---
# Review M4-safety-and-delivery, round 2

The eight round 1 fixes (F1-F8) are in 53829df and work as described in the response. The simplification proposal was an empty diff.

## F1 CSV preview accepts a zero-amount foreign-currency row that the write then rejects
- Source: code-review
- Where: src/features/import/validate.ts:99
- Severity: important
- Finding: planImport computes `amountBrl = toBrl(0, currency, rate)` = 0 for a non-BRL row with amount 0 and records no error. `createTransaction` rejects that posting at src/data/transactions.ts:106-107 ("a zero-amount foreign-currency posting must be a value adjustment with a positive BRL amount"). A CSV row cannot carry a separate BRL value, so such a row can never be valid.
- Why it matters: the preview shows a clean plan and enables Import. On confirm the whole import rolls back and the user sees only "The backup was not imported" plus the raw domain message, with no line number. This breaks the preview-then-all-or-nothing promise of ADR-0011. Check: a CSV with `USD,0,rate_to_brl=5` on a balanced transaction (for example with a 0 BRL counter-row) previews with 0 errors and fails on confirm.
- Suggested change: in planImport, after parsing, add `if (currency.code !== BRL.code && amount === 0) fail(row.line, 'a zero amount is not allowed for ' + currency.code + ' rows.')`, and add a validate.test.ts case that asserts the error and its line.

## F2 Double press on the confirm buttons runs the import twice
- Source: code-review
- Where: src/features/backup/SettingsScreen.tsx:59 and :84
- Severity: important
- Finding: `onConfirm` and `onConfirmCsv` have no in-flight guard. Both close over the preview or plan from the render in which they were pressed, so a second press before `reset()` runs starts a second import with the same data.
- Why it matters: for CSV the second apply inserts the same `external_id` values and hits the unique index in migration 004. A successful import then ends on the "import failed" error screen with a raw SQLite message. For a backup the second run deletes and reinserts all data again, which is harmless but wasted. A double click is easy to do on web.
- Suggested change: add a `busy` state (or a ref) set at the start of both handlers and cleared in `finally`; return early when it is set, and use it to disable both confirm buttons. Apply the same to `onExport` so two downloads are not started.

## F3 Web export revokes the blob URL right after click
- Source: code-review
- Where: src/features/backup/files.ts:19
- Severity: nit
- Finding: `URL.revokeObjectURL(url)` runs synchronously after `link.click()`. The download starts asynchronously, and some browsers can then fail it or save an empty file.
- Why it matters: the screen then still shows "Backup ready as ..." and `markBackupDone` clears the Home reminder, although no usable file was saved. I could not test Safari or Firefox here, so the browser behaviour is from the report, not reproduced.
- Suggested change: `setTimeout(() => URL.revokeObjectURL(url), 0)` is the minimum; a delay of a few seconds is safer.
