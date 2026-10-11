---
type: review-response
milestone: "[[M3-review-and-reports]]"
round: 2
agreed: 3
disagreed: 0
tags: [review]
---
# Review M3-review-and-reports, round 2: responses

The simplification proposal was empty, so nothing was applied from it.

| Finding | Decision | Resolution |
|---|---|---|
| F1 | agree | Fixed in 5a7d137: the list shows strings.transactions.dateInvalid for a non-empty custom date that is not ISO, and rangeInvalid (instead of the no-match notice) when from is after to; two tests added in TransactionsScreen.test.tsx |
| F2 | agree | Fixed in 442bc6e: the detail screen uses currencyOf(account?.currency ?? BRL.code) ?? BRL and the local map and USD/BTC imports are gone |
| F3 | agree | Fixed in 748d2a0: a deleted state set after deleteTransaction resolves hides the not-found notice before dismissTo; new TransactionDetailScreen.test.tsx checks the notice never shows after a delete, but the flash is timing dependent so the test may not fail without the fix |
