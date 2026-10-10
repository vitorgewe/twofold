---
id: ADR-0004
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, state]
---
# ADR-0004 The database is the single source of truth

## Context

The module default keeps screen state in components and shared state in one store module. In a ledger, balances and net worth are derived from postings. A second copy of them in memory can drift from the database, and a wrong balance is the worst failure this app can have.

## Options considered

1. One client store module that mirrors data (module default): fast reads. Costs: two copies of the truth and cache invalidation on every write.
2. A query cache library: less hand-written sync. Costs: another dependency and still a second copy.
3. No store: screens read the database through hooks in `src/data/` and re-read after writes. Costs: repeated queries, which is cheap at personal scale.

## Decision

No separate client store. The database is the only source of truth, and screens read it through hooks in `src/data/`. Screen-local state (form inputs, open dialogs) stays in components.

## Consequences

Easier: no drift between what is shown and what is stored. Harder: hooks must re-query after writes. We would notice the decision was wrong if a list screen becomes visibly slow; the fix is a new ADR that adds a cache.
