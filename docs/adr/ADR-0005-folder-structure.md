---
id: ADR-0005
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, structure]
---
# ADR-0005 Folder structure

## Context

Accounting rules must be testable without a screen, and screens must stay thin so the agent can change one without touching the others.

## Options considered

1. Routes only in `app/`, logic in `src/features/<feature>/`, shared UI in `src/ui/`, storage in `src/data/` (module default). Costs: more folders.
2. Everything inside `app/` next to the routes: fewer folders. Rejected: logic ends up tangled with rendering and is hard to test.

## Decision

Option 1. The ledger rules (balance check, net worth, income statement, CSV parsing) live in `src/features/ledger/` as pure functions with no UI or database imports.

## Consequences

Easier: unit tests on pure functions, small tickets per feature. Harder: new contributors need to learn the layout. We would notice the decision was wrong if features start importing each other's internals; then shared code moves to a common module.
