---
type: review-response
milestone: "[[M4-safety-and-delivery]]"
round: 1
agreed: 8
disagreed: 0
tags: [review]
---
# Review M4-safety-and-delivery, round 1: responses

| Finding | Decision | Resolution |
|---|---|---|
| F1 | agree | Fixed in 53829df: the four preview labels now live in strings.settings. The validator and parser messages (format.ts, validate.ts, csv.ts) are left as they are, matching the M3 convention for domain errors |
| F2 | agree | Fixed in 53829df: validateBackup rejects duplicate external_id and duplicate active account names ignoring case; tests added in format.test.ts |
| F3 | agree | Fixed in 53829df: exportBackup reads all six tables inside db.transaction |
| F4 | agree | Fixed in 53829df: validateBackup fails when the BRL currency is missing; test added |
| F5 | agree | Fixed in 53829df: the share sheet cannot report a cancel, so the message now says "Backup ready as <name>." instead of "saved"; last_backup is still set once the file is handed over, and e2e/backup.spec.ts follows the new wording |
| F6 | agree | Fixed in 53829df: TransactionInput takes an optional externalId written by the INSERT, and the follow-up UPDATE is gone |
| F7 | agree | Fixed in 53829df: row and group validity use a per-row failure flag instead of the capped error count; test added with 60 bad rows |
| F8 | agree | Fixed in 53829df: after a closing quote only blanks are ignored and any other character is a parse error with its line; test added |

The simplification proposal was an empty diff, so nothing from it was applied.
