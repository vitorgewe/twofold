---
type: qa
milestone: "[[M2-core-flow]]"
round: 1
verdict: approved
date: 2026-10-10
tags: [qa]
---
# QA M2 Core flow

## Verdict

Approved: `.relay/verify.sh` ends with `verify: ok`, the smoke test passes, and every Definition of Done item I could exercise worked in the browser at 390 x 844, including after reloads. Two items could only be checked partly (see "Not verifiable here").

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 4 | 4 | 1 credit of 1,000.00 + debits 400/350/250 saved; 249.99 showed a difference of -R$0.01 and disabled Save; a double click on Save created one transaction (Checking statement has one row). Home changed to the correct net worth (-R$250.00) and month result without a reload. USD 100.00 at 5.20 gave BRL 520.00, edited to 520.01, saved, Home showed R$270.01 and USD balance R$670.01 / USD 100.00 muted. Not 5: the backup warning older than 30 days and the rejected-write error cannot be reached from the UI (no screen writes `last_backup_at`; the form blocks invalid input), so they rest on Jest only. |
| Data integrity | 4 | 4 | Accounts, transactions and archive state survived `page.goto` and reloads. Rename and archive touched only the chosen row. Balances matched the ledger by hand: Checking -R$1,000.00, RejA and W1 +R$250.00 / +R$350.00, net worth -250.00 then 270.01 after the USD transaction. Fresh context shows an empty database with R$0.00 figures. |
| Mobile usability | 4 | 3 | Scroll width equals 390 on Home, Accounts, form with four postings, and statement. A 110-character account name wraps without clipping. Empty states exist for accounts and statements; unknown id shows "Account not found" with a way back. Rename opens inline with "Save name" and "Cancel". Small buttons (Rename, Archive) are compact but usable. |
| Design coherence | 3 | 3 | Same type, card style and dark primary buttons across Home, Accounts, form and statement. It is plain but consistent, nothing reads as the starter template. |
| Code quality | 3 | 3 | Judged from the tree and tooling, not a line-by-line read: routes under `app/`, logic in `src/features/`, data in `src/data/`, pure ledger functions with Jest tests, 120 tests pass, typecheck and lint clean, no disabled tests seen. |

## Features

### [[F03-accounts]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Create Checking (Asset, BRL) and Cash USD (Asset, USD); USD shows BRL main, USD muted | Pass | Created both in a fresh context. Both listed under Asset; Cash USD shows R$0.00 with muted USD 0.00. |
| Created accounts survive a reload | Pass | Reloaded the fresh context; both still listed. |
| Adjust Cash USD by +200.00 with an income account raises it to R$ 200.00 and the statement shows the row | Pass | Adjust form offers only the Income account. In the existing profile Cash USD shows R$150.00 after +200.00 / -50.00, FX gain R$200.00, FX loss R$50.00. Its statement lists -R$50.00 (balance R$150.00) above +R$200.00 (balance R$200.00). |
| Archived accounts hidden until "Show archived" is on | Pass | Archived "Check 1791661326048": gone from the list and from the transaction account picker; "Show archived" shows it as "Archived" with Unarchive. Hidden state held after reload. |

### [[F04-new-transaction]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| One credit of 1,000.00 split across three debits saves only when they sum to 1,000.00 | Pass | 400 + 350 + 250 enabled Save and saved; 249.99 disabled it. |
| While sides differ the screen shows the difference and Save is disabled | Pass | "Difference: -R$0.01", Save disabled. Save is also disabled with an empty description. |
| A saved transaction shows in balances after a reload | Pass | Checking -R$1,000.00 and Home figures correct after reload. |
| USD 100.00 at rate 5.20 shows BRL 520.00, editable | Pass | BRL value 520.00; set to 520.01, totals followed. BTC 0.005000001 and BRL 1.234 are rejected with a clear message. |

### [[F05-home]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Empty database shows R$ 0.00 for both figures | Pass | Fresh browser context: R$0.00 twice and "No backup yet". |
| After the smoke transaction Home shows -R$ 100.00 twice, also after a reload | Pass | `npx playwright test e2e/smoke.spec.ts` passes; my own transactions also showed correct figures after reload. |
| Foreign-currency account shows BRL main, original muted | Pass | Home lists USD R$670.01 with USD 100.00 muted. |
| Warning when no backup or the last one is older than 30 days | Partly | "No backup yet" shows in warning style. The 29 / 31 day cases are only covered by Jest because nothing in the app writes `last_backup_at` yet (T091). Not counted as a fail. |

## Not verifiable here

- Backup older than 30 days in the real app: no UI writes the key; Jest covers it.
- T042 "rejected write shows the error and keeps values": the form blocks every invalid input, so I could not trigger it; covered by `SaveTransaction.test.tsx` only.

## Defects

None.

Observations, not defects: the Home USD row says "USD 100.00" while a value adjustment alone leaves "USD 0.00", which follows from ADR-0010 (adjustments are BRL-only). The adjust form's counter-account chip has no obvious selected state when only one choice exists; worth a look in a later polish task.
