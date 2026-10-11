---
type: review-response
milestone: "[[M3-review-and-reports]]"
round: 1
agreed: 7
disagreed: 0
tags: [review]
---
# Review M3-review-and-reports, round 1: responses

The simplification proposal was empty, so nothing was applied from it.

| Finding | Decision | Resolution |
|---|---|---|
| F1 | agree | TransactionForm now waits for its accounts in edit mode (wrapper renders the body only once loaded), so rows and labels are built with the right currencies; test mounts an edit with a BTC posting and checks amount, rate, BRL value and account label |
| F2 | agree | Rate prefill on account change now runs only for a new transaction; test checks that an edit does not receive today's rate, and a second test keeps the create-mode prefill working |
| F3 | agree | Typing in a date field now copies both preset bounds into the text state before applying the typed one (typeDate in TransactionsScreen); new TransactionsScreen.test.tsx covers it |
| F4 | agree | A custom range with from after to is now an invalid period with its own message (strings.result.rangeInvalid); test added in ResultScreen.test.tsx |
| F5 | agree | detail.png and list-nomatch.png removed with git rm; the QA report only mentions them by name |
| F6 | agree | todayIso moved to src/features/ledger/date.ts and used by TransactionForm, RatesScreen and AdjustValueForm; the test moved to date.test.ts; home/summary.ts keeps its own pad because it formats month parts, not today |
| F7 | agree | rowsFromPostings uses formatRate, so the edit form shows 5.00 like the rates screen; the edit-form test expectation changed from 5.0 to 5.00 |
