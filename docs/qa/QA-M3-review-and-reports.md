---
type: qa
milestone: "[[M3-review-and-reports]]"
round: 1
verdict: approved
date: 2026-10-11
tags: [qa]
---
# QA M3 Review and reports

## Verdict

Approved: `.relay/verify.sh` ends with `verify: ok`, the Playwright specs pass, and every Definition of Done item worked in the browser at 390 x 844, including after reloads.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 4 | 4 | Period and account filters narrow and restore the list; editing both sides 50.00 to 60.00 saved, changing one side showed "Difference: R$10.00" with Save disabled; cancelling delete kept the transaction; confirming removed it from the list, after a reload and from Home. Rates: 5.1234 saved as latest with today's date, a new Cash USD posting of 100.00 prefilled rate 5.1234 and BRL 512.34. Result: all four periods work and custom bounds are inclusive. Not 5: a reversed custom range (from after to) shows "No movements" instead of an error. |
| Data integrity | 4 | 4 | Net worth moved correctly with each write: 120.01 to 110.01 after the edit (expense +10.00), to 170.01 after the delete (-60.00), unchanged at 170.01 after saving a rate. The Groceries statement and the list stayed in step after the delete and a reload. Result month figure (R$200.01) matches Home. |
| Mobile usability | 4 | 3 | scrollWidth is 390 on transactions, detail, rates, result and the edit form. Empty states exist on transactions, result and rates (fresh context); an unknown id shows "Transaction not found" with a way back; invalid rates and dates show messages. |
| Design coherence | 3 | 3 | Same type, pill selectors, inputs and buttons as M1 and M2. Plain but consistent. List amounts sit right next to the description instead of aligned at the edge. |
| Code quality | 3 | 3 | Judged from the tree and tooling: routes under `app/`, logic in `src/features/`, data in `src/data/`, pure period helpers with Jest tests, 169 tests pass, typecheck and lint clean, no disabled tests seen. |

## Features

### [[F06-transactions]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Filtering by period and account narrows the list; clearing restores it | Pass | "This month" hid 2026-09-15; the Groceries filter showed only its three transactions; "All" and "All accounts" restored the full list. |
| Editing both sides by the same amount saves; one side only leaves Save disabled | Pass | Mid shop 50.00 to 60.00 on both sides saved and showed R$60.00 in the list. One side only showed a difference of R$10.00 and Save was disabled. |
| Deleting removes it from the list, balances and Home, also after a reload | Pass | After "Confirm delete" the row was gone, still gone after reload, the Groceries statement lost it and net worth went from 110.01 to 170.01. |
| Cancelling the delete confirmation keeps the transaction | Pass | "Cancel" returned to the detail with both postings intact. |

### [[F07-rates]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Saving USD 5.1234 shows it as the latest USD rate with today's date | Pass | Showed "5.1234 BRL per USD, 2026-10-11 (today)", also after a reload. Letters, 9 decimals and empty input showed the message "Enter a positive rate with up to 8 decimals". |
| A new USD posting of 100.00 is prefilled with 5.1234 and BRL 512.34 | Pass | Rate field 5.1234 and BRL value 512.34, totals R$512.34. |
| Net worth on Home is the same before and after saving a rate | Pass | R$170.01 before and after. |

### [[F08-result]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| "This month" shows Groceries under Expenses with R$ 100.00 and result -R$ 100.00 | Pass (adapted) | The browser profile holds earlier data, so exact numbers differ. `e2e/smoke.spec.ts` passes on a clean database; on the existing data Expenses lists Groceries and the result equals the Home figure. Not seen on a fresh database by hand. |
| A value adjustment on a USD account against "FX gain" shows R$ 200.00 as income | Pass | "FX gain R$200.00" under Income this month, included in the total. |
| A custom range excludes outside transactions and includes both boundary dates | Pass | 2026-09-15 to 2026-10-09 gave Groceries R$100.00 (30 on "from", 70 on "to"); 09-16 to 10-08 showed the empty state; each boundary alone gave its own transaction. Blank, letters and 2026-02-30 show "Enter both dates as YYYY-MM-DD." |

## Not verifiable here

- Keyboard avoidance and safe areas, as for every screen on the web target.

## Defects

None.

Observations, not defects: a custom range with "from" after "to" shows "No movements in this period" instead of a message about the order. The Playwright capture files `detail.png` and `list-nomatch.png` that T061 left in the repo root should be deleted by a human.
