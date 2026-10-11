---
type: review-findings
milestone: "[[M3-review-and-reports]]"
round: 1
findings: 7
tags: [review]
---
# Review M3-review-and-reports, round 1

## F1 Edit form builds its rows before its own accounts have loaded
- Source: code-review
- Where: src/features/transactions/TransactionForm.tsx:45
- Severity: blocker
- Finding: `rowsFromPostings` runs once, in the `useState` initializer, using `data` from the form's own `useAccountsWithBalances`. That query starts with `data` undefined, so `currencyOfAccount` returns null and every row is treated as BRL. `TransactionDetailScreen.tsx:46` waits for its own `accounts` query, which does not help, because the form runs a separate query (the `initial` doc comment "mount it once the accounts have loaded" is not enough). Also, the form's `accounts` list is empty on that first render, so the account labels are blank.
- Why it matters: editing a transaction with a USD or BTC posting shows wrong amounts. A 500000-sat posting is shown as `5000.00`, the rate is empty and the BRL value is null. Saving would fail validation or store a wrong amount, which breaks the integer-money and balance rules in the constitution (ADR-0007, ADR-0009).
- Suggested change: pass the already loaded accounts to the form as a prop (the detail screen has them), or build the rows from `initial` in an effect once `data` is defined. Add a test that mounts the edit form with a foreign-currency posting and checks the amount, rate and BRL value of the first render. This also fixes the empty account labels in edit mode.

## F2 Rate prefill overwrites a stored historical rate in edit mode
- Source: code-review
- Where: src/features/transactions/TransactionForm.tsx:159
- Severity: blocker
- Finding: Choosing an account clears `rateText` and then calls `prefillRate`, whose only guard is `rateText === ''`. This runs in edit mode as well, so the stored rate is replaced with today's latest rate.
- Why it matters: a user who changes a posting's account on an old transaction gets today's rate and a recomputed BRL value. The ledger value changes without the user noticing, and the net worth (ADR-0010) changes with it.
- Suggested change: when the posting's account changes, clear `brlText` and the amount as now, but only prefill the rate in create mode (`initial === undefined`), or show the prefilled rate in a way the user must confirm. A test: edit a USD transaction at rate 5.00, switch to another USD account, and check that the rate field is not today's rate.

## F3 Typing in one date field clears the other on the transactions list
- Source: code-review
- Where: src/features/transactions/TransactionsScreen.tsx:76
- Severity: important
- Finding: With a preset chosen, the inputs show `period.from` and `period.to`. The first keystroke in either input calls `setChoice(null)`, and both inputs then switch to `fromText`/`toText`, which are `''`. The other bound is lost.
- Why it matters: with "This month" selected, editing From empties To, and the filter becomes "everything after the date" instead of "that month up to the date".
- Suggested change: when switching from a preset to custom, copy both preset bounds into `fromText` and `toText` first (as `ResultScreen.pick` already does), then apply the typed text.

## F4 Custom result period accepts a reversed range
- Source: code-review
- Where: src/features/result/ResultScreen.tsx:51
- Severity: important
- Finding: The custom period is valid when both texts pass `isIsoDate`, without checking `from <= to`. A reversed range returns no postings.
- Why it matters: from=2026-10-31, to=2026-10-01 shows the "no postings in this period" notice. It reads as no activity, while the real problem is the range.
- Suggested change: treat `from > to` as an invalid period (`undefined`) and show a range error message in `strings.result`. ISO dates compare correctly as strings. Add a test for the reversed range.

## F5 Screenshots committed at the repo root
- Source: code-review
- Where: detail.png
- Severity: important
- Finding: `detail.png` and `list-nomatch.png` were added at the repo root by the QA commit and nothing references them.
- Why it matters: binary files stay in the history. They are not code, docs or tests.
- Suggested change: `git rm detail.png list-nomatch.png`. If the QA report needs them, move them under `docs/qa/` and link them from `QA-M3-review-and-reports.md`.

## F6 Third copy of the local-date helper
- Source: code-review
- Where: src/features/rates/format.ts:25
- Severity: nit
- Finding: `todayIso` now exists in `rates/format.ts`, `transactions/TransactionForm.tsx:26` and `accounts/AdjustValueForm.tsx:13`, and `home/summary.ts:8` has its own `pad`. The new copy is the exported, tested one (it takes a `now` argument).
- Why it matters: a timezone fix to one copy misses the others.
- Suggested change: move the `rates/format.ts` version to `src/features/ledger/date.ts` (next to `isIsoDate`) and import it in `TransactionForm.tsx`, `RatesScreen.tsx` and `AdjustValueForm.tsx`, deleting the local copies. The `format.test.ts` case moves with it.

## F7 Two rate formatters with different rules
- Source: code-review
- Where: src/features/transactions/draft.ts:75
- Severity: nit
- Finding: `rowsFromPostings` builds the rate text with `formatPlain(p.rate, 8)` and two regexes, which keeps at least 1 decimal. `formatRate` in `rates/format.ts` does the same job and keeps at least 2.
- Why it matters: the same stored rate shows as `5.1` in the edit form and `5.10` on the rates screen and in the prefill.
- Suggested change: use `formatRate(p.rate)` in `rowsFromPostings` and drop the regex chain. Update the edit-form test that expects the one-decimal text if there is one.
