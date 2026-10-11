---
type: qa
milestone: "[[M4-safety-and-delivery]]"
round: 1
verdict: approved
date: 2026-10-11
tags: [qa]
---
# QA M4 Safety and delivery

## Verdict

Approved: `.relay/verify.sh` passes (215 Jest tests, typecheck, lint, web export) and every Definition of Done item of F09, T091 and T092 worked when used in the browser at 390 x 844, including after reloads and in fresh browser contexts.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 5 | 4 | Export, import, CSV import, rejections, version and the Home backup line all worked as a person would use them. Native share sheet and file picker are not verifiable on web. |
| Data integrity | 5 | 4 | Restore into a fresh context reproduced net worth (-R$129.99) and the transaction list exactly. Tampered, wrong-version and non-JSON backups left data unchanged. Rejected CSVs wrote nothing. Re-importing a CSV added nothing, also after restoring a backup that contained the CSV transactions (`external_id` survives). |
| Mobile usability | 4 | 3 | Settings fits 390 px with no horizontal scroll or clipping; previews and errors are readable. Buttons are about 38 px tall, slightly under the usual 44 px. |
| Design coherence | 3 | 3 | Settings matches the other screens (same dark buttons, plain type). The app overall is spare, but consistent. |
| Code quality | 4 | 3 | `app/settings.tsx` is 5 lines (route only); parser, validator and serializer are pure and in `src/features/`; storage is in `src/data/`. No dead code or disabled tests seen. |

## Features

### [[F09-data-safety]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Export, import in a fresh profile, net worth and transaction count match | Pass | Exported `twofold-backup-2026-10-11.json` (22 accounts, 8 transactions, 18 postings, 2 rates). In a new empty context (net worth R$0.00, "No transactions yet") imported it via preview and "Replace my data". Home showed -R$129.99 and R$200.01 result, as before, and the transactions list text was identical. |
| Backup with a changed posting is rejected, database unchanged | Pass | A file with one posting debit 1 centavo higher showed "This file cannot be imported. Your data is unchanged." and "Transaction "x" (2026-10-10): Transaction does not balance: debits minus credits is 1 centavos". Existing data unchanged on Home. |
| Sample CSV imports 2 transactions and 3 accounts, again reports no new | Pass | Fresh context: preview 3 accounts, 2 new, 4 postings; imported; net worth -R$300.00 on Home and after reload. Second import previewed 0 new, 2 skipped; net worth unchanged. |
| CSV with one posting missing is rejected as a whole, listing the line | Pass | t-0002 without its Checking row: "Line 4: transaction t-0002: a transaction needs at least two postings.", Import disabled, net worth stayed R$0.00. |

### [[T091-backup-export-import]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Fresh-profile restore matches net worth and count | Pass | See F09. |
| One posting changed by 1 rejected, data unchanged | Pass | See F09. |
| Unknown `format_version` rejected | Pass | Version 99: "Unsupported format_version 99; this app reads version 1." Non-JSON file: "The file is not valid JSON." |
| Home warning turns plain "Last backup today" after export | Pass | After export Home showed "Last backup today"; before it showed "No backup yet". The 30-day warning was not exercised. |
| Settings shows the app version | Pass | "Version 0.2.0". |
| Jest tests and Playwright download/re-import test | Pass | Tests present and pass in `.relay/verify.sh`. I did not run the Playwright specs; I did the same flow by hand. |

### [[T092-csv-import]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Spec example previews 3 accounts, 2 transactions, imports, net worth -R$300.00 | Pass | See F09. BTC card on Home showed R$1,750.00 / BTC 0.00500000. |
| Same file again: 0 new, 2 existing, net worth unchanged | Pass | Preview "Already imported (skipped): 2"; Import then showed "Nothing new to import."; net worth -R$300.00. Also holds after a backup restore. |
| t-0002 missing Checking row rejected with transaction and line | Pass | See F09. |
| BTC row without rate and amount with too many decimals rejected with line numbers | Pass | "Line 2: Invalid amount: "300.001" has more than 2 fraction digits" and "Line 4: rate_to_brl is required for BTC rows." A wrong header gave "Line 1: the header must be exactly ...". Nothing written. |
| Description with quoted comma imported intact | Pass | `split.csv` imported; the list shows "Dinner, drinks and tip", Checking, Dining, Drinks, Tips, R$100.00; net worth moved by -R$100.00 (to -R$400.00). |
| Jest tests and Playwright test | Pass | Unit tests pass in verify; the double-import flow was done by hand. |

## Defects

None blocking. Observations for later, not defects against the Definition of Done:

- After restoring a backup, Home shows "No backup yet" because `last_backup_at` is not part of the backup.
- With a rejected CSV, the preview still shows counts (e.g. "New transactions: 1") next to the errors.
- Buttons are about 38 px tall.
- Not verifiable here: native share sheet and document picker on devices (need a manual device check).
