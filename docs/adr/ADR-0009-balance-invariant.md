---
id: ADR-0009
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, ledger]
---
# ADR-0009 Every transaction must balance, on every write

## Context

Double-entry bookkeeping only works if debits equal credits. The author wants to edit and delete transactions freely, and to import files, as long as the books stay balanced. Transactions may have any number of postings and mix currencies.

## Options considered

1. Database constraints or triggers only: strong guarantee. Costs: hard to express across rows, hard to test, error messages the UI cannot explain.
2. UI validation only: friendly messages. Rejected: imports and edits could bypass it.
3. One pure domain function that checks a transaction, called by every write path inside a database transaction: testable and explainable. Costs: discipline so no write skips it.
4. Allow unbalanced drafts: flexible. Rejected: the author does not want unbalanced data in the books.

## Decision

Option 3. A pure function in `src/features/ledger/` returns whether the sum of debit BRL amounts equals the sum of credit BRL amounts. Create, edit, delete and import all call it, and a write that would unbalance any transaction is rejected as a whole. Deleting a transaction removes all its postings together.

## Consequences

Easier: one place to test and one error message to show. Harder: every new write path must use it. We would notice the decision was wrong if any query finds a transaction whose sides differ; a test runs that query after every end-to-end scenario.
