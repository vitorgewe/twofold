---
id: T061
type: task
feature: "[[F06-transactions]]"
milestone: "[[M3-review-and-reports]]"
status: todo
depends_on: ["[[T042-save-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
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

- [ ] After saving three transactions on different dates, the list shows them newest first, grouped by date
- [ ] Choosing "This month" hides a transaction dated last month; "All" shows it again
- [ ] Filtering by the account "Groceries" shows only transactions with a posting on it
- [ ] Opening a transaction shows all its postings; opening `/transactions/<id>` after a reload works
- [ ] Empty and not-found states exist; nothing is clipped at 390 x 844
- [ ] Jest tests for the period quick-choice helpers, including the first and last day of a month

## Related decisions

- [[ADR-0004-database-as-source-of-truth]]
- [[ADR-0012-english-only]]

## Progress

## QA
