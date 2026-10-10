---
id: ADR-0012
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, language]
---
# ADR-0012 Everything in English

## Context

The author is a Portuguese speaker who wants to use English daily and is the only user. The repository, code and docs are English by decision.

## Options considered

1. English everywhere, including the interface: one language, practice for the author. Costs: none for a single user.
2. Portuguese (Brazil) interface with English code and docs: more familiar for the author. Rejected: the author wants the practice.
3. Both languages through an i18n library: flexible. Rejected: extra code for one user.

## Decision

Code, identifiers, docs, commit messages and UI text are in English. UI text lives in `src/ui/strings`, so a translation can be added later without touching screens. Dates and numbers follow the device locale.

## Consequences

Easier: one language to maintain. Harder: another language would need translating the strings file. We would notice the decision was wrong if other users who do not read English start using the app.
