---
id: ADR-0006
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, quality]
---
# ADR-0006 Testing strategy

## Context

A ledger has hard invariants (every transaction balances, net worth equals assets minus liabilities) and a user flow that must keep working. The agent verifies work by using the app in a browser.

## Options considered

1. Jest with React Native Testing Library for units and components, Playwright on the web target for end-to-end (module default). Costs: two tools.
2. Unit tests only: fast. Rejected: does not prove the core flow works in the running app.
3. End-to-end only: realistic. Rejected: slow and poor at pinpointing rule bugs.

## Decision

Option 1. Ledger rules get table-driven and randomized tests that check the invariants, including edits, deletes and CSV import. One Playwright smoke test covers the core flow in the spec.

## Consequences

Easier: rule regressions are caught at the unit level. Harder: native-only behaviour is not covered by the web target and needs a manual note. We would notice the decision was wrong if a bug in balances reaches the running app despite green tests.
