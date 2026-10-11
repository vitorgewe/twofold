---
type: plan
tags: [plan]
---
# Plan

Milestones in the order they are built. Each milestone is one pull request.

| Milestone | Goal | Features | Est. tokens | Est. hours |
|---|---|---|---|---|
| [[M1-foundation]] | Running app, database that survives reloads, tested ledger core | [[F01-app-foundation]], [[F02-ledger-core]] | 2600000 | 3.5 |
| [[M2-core-flow]] | Accounts, new transaction and Home: the core flow works end to end | [[F03-accounts]], [[F04-new-transaction]], [[F05-home]] | 2550000 | 3.25 |
| [[M3-review-and-reports]] | Browse, edit and delete transactions; rates; income statement | [[F06-transactions]], [[F07-rates]], [[F08-result]] | 1600000 | 2 |
| [[M4-safety-and-delivery]] | Backup and CSV import | [[F09-data-safety]] | 1200000 | 1.5 |
| [[M5-delivery]] | Preview deploy on EAS and release publishing, led by the author | [[F10-preview-deploy]] | 300000 | 0.5 |

Totals: 22 tasks, 8250000 tokens, 10.75 hours. The deploy tasks (T101, T102) are in M5 and start `blocked`: unattended sessions are denied `eas` and `.relay/deploy.sh` by design, so the author logs in, deploys and creates the token, and a session only prepares the configuration.

Status lives in each ticket's `status` property. `relay status` prints the totals.

## Spec coverage

| Spec item | Where |
|---|---|
| Screen Home | [[F05-home]] |
| Screen New transaction | [[F04-new-transaction]] |
| Screen Transactions | [[F06-transactions]] |
| Screen Accounts (list, create, rename, archive, statement, adjust value) | [[F03-accounts]] |
| Screen Rates | [[F07-rates]] |
| Screen Result | [[F08-result]] |
| Screen Settings (backup, CSV import, version) | [[F09-data-safety]] |
| Core flow steps 1 to 4 | [[T031-accounts-screen]], [[T041-transaction-form]], [[T042-save-transaction]], [[T051-home-screen]] |
| Preview deploy and release publishing | [[F10-preview-deploy]] |

## Smoke test contract

`e2e/smoke.spec.ts` finds elements by these names, taken from the UI text in English. Build sessions may not rename them. A name that is a label is the accessible name (visible text or `aria-label`); a test id is `data-testid`.

| Where | Element | Name |
|---|---|---|
| `/accounts` | Button that opens the form | "New account" (button) |
| `/accounts` | Name field | "Account name" (label) |
| `/accounts` | Type choices | "Asset", "Liability", "Equity", "Income", "Expense" (radios) |
| `/accounts` | Save button | "Save account" (button) |
| `/accounts` | Account rows | the account name as exact text |
| Home | Net worth value, only the formatted BRL value | `net-worth` (test id) |
| Home | Month result value, only the formatted BRL value | `month-result` (test id) |
| Home | Button to `/transactions/new` | "New transaction" (button) |
| `/transactions/new` | Description field | "Description" (label) |
| `/transactions/new` | Posting rows, numbered from 1 | `posting-1`, `posting-2`, ... (test ids) |
| inside a posting row | Account control, opens a list of options | "Account" (label); options have role option and the account name |
| inside a posting row | Side choices | "Debit", "Credit" (radios) |
| inside a posting row | Amount field | "Amount" (label) |
| `/transactions/new` | Save button, disabled until balanced | "Save transaction" (button) |

Amounts are formatted with `Intl` in the browser's locale; the smoke test fixes `en-US`, so BRL values read like `-R$100.00`.
