---
type: review-findings
milestone: "[[M3-review-and-reports]]"
round: 2
findings: 3
tags: [review]
---
# Review M3-review-and-reports, round 2

## F1 Transactions list widens the filter silently on an invalid or reversed custom date
- Source: code-review
- Where: src/features/transactions/TransactionsScreen.tsx:28
- Severity: important
- Finding: In custom mode, a date that fails `isIsoDate` becomes `undefined`, so the bound disappears and the list shows more than the user asked for, with the partial text still in the field. A reversed range (from after to) shows only the "no match" notice. ResultScreen handles both cases with `dateInvalid` and `rangeInvalid` (round 1 F4); this screen does not.
- Why it matters: typing "2026-1" in From lists every transaction up to the To date. The numbers on screen look like a filtered result but are not, and nothing says why.
- Suggested change: when `choice` is null and a non-empty text is not an ISO date, show `strings.result.dateInvalid` (or a transactions equivalent) under the field. When both are valid and `fromText > toText`, show the `rangeInvalid` message instead of the generic no-match notice. Add a test next to the existing TransactionsScreen tests.

## F2 Detail screen keeps its own currency map
- Source: code-review
- Where: src/features/transactions/TransactionDetailScreen.tsx:20
- Severity: nit
- Finding: `CURRENCIES = { BRL, USD, BTC }` plus a cast duplicates the registry, while `draft.ts` already uses `currencyOf(code) ?? BRL`.
- Why it matters: a currency added to the ledger registry is rendered as BRL on this screen until the map is also edited.
- Suggested change: replace line 83 with `currencyOf(account?.currency ?? BRL.code) ?? BRL`, import `currencyOf` and `BRL` from `@/features/ledger/currency`, and delete the map and the `USD`/`BTC` imports.

## F3 Detail screen flashes "not found" after a delete
- Source: code-review
- Where: src/features/transactions/TransactionDetailScreen.tsx:40
- Severity: nit
- Finding: `deleteTransaction` notifies a data change, so `useTransaction` can refetch and return `null` before `dismissTo` takes effect. The screen then renders the not-found notice. I could not check the timing in a running app, so this depends on how fast the navigation completes.
- Why it matters: a successful delete may briefly look like a failure.
- Suggested change: keep a `deleted` state set right after `deleteTransaction` resolves and render nothing (or the previous content) while it is true, then navigate.
