---
id: T061
type: task
feature: "[[F06-transactions]]"
milestone: "[[M3-review-and-reports]]"
status: review
depends_on: ["[[T042-save-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 89109
actual_hours: 0.05
tags: [task]
---
# T061 Transactions list

## Goal

The user can browse transactions and open one in a detail view.

## Description

Route `app/transactions/index.tsx` with a "Transactions" entry in the layout, and route `app/transactions/[id].tsx` for the detail.

- List newest first, grouped by date. Each row shows the description, the names of the accounts involved and the total in BRL.
- Filters: a period (quick choices "This month", "This year", "All" and "from" and "to" dates) and an account. Filtering uses `listTransactions`.
- The detail view lists every posting with the account, side and amount (`MoneyText`), the date and the description. Do not render "Edit" or "Delete" in this task; T062 adds them.
- An empty state for no transactions and for no matches; a not-found message for an unknown id.

Out of scope: editing and deleting.

## Definition of Done

- [x] After saving three transactions on different dates, the list shows them newest first, grouped by date
- [x] Choosing "This month" hides a transaction dated last month; "All" shows it again
- [x] Filtering by the account "Groceries" shows only transactions with a posting on it
- [x] Opening a transaction shows all its postings; opening `/transactions/<id>` after a reload works
- [x] Empty and not-found states exist; nothing is clipped at 390 x 844
- [x] Jest tests for the period quick-choice helpers, including the first and last day of a month

## Related decisions

- [[ADR-0004-database-as-source-of-truth]]
- [[ADR-0012-english-only]]

## Progress

### 2026-10-11 00:00
- Done: `/transactions` list (grouped by date, newest first, period quick choices plus From/To, account filter via `listTransactions`) and `/transactions/[id]` detail (all postings, not-found state), linked from Home. Pure helpers `periodFor`/`yearPeriod` (reusing `monthPeriod`), `groupByDate`, `totalBrl` with Jest tests. Checked in the browser at 390 x 844: saved three transactions (2026-09-15, 10-05, 10-09), list order and grouping, "This month" hid the September one and "All" brought it back, Groceries filter, no-match state, detail after reload, unknown id message, empty state in a fresh browser context, no horizontal overflow (scrollWidth 390). `.relay/verify.sh` passes.
- Failed or surprising: typed routes were stale until `.relay/init.sh --restart`. The browser profile already held data from earlier sessions. `.relay/init.sh` modified `package-lock.json`; I left that out of the commits. Screenshots `detail.png` and `list-nomatch.png` are left untracked in the repo root (no `rm` allowed); delete them.
- Next: T062 adds Edit and Delete to the detail view. The From/To inputs only apply once they hold a valid YYYY-MM-DD date.

## QA
