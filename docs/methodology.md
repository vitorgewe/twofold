---
type: methodology
tags: [methodology]
---
# Methodology

How work is done in this project. The constitution says what the system is; this says how we build it.

## One task per session

A build session works on exactly one task ticket and stops. It never starts a second one.

## Definition of done for every task

- Every item in the ticket's Definition of Done is checked and was observed working in the running app, not inferred from the code.
- `.relay/verify.sh` passes.
- New behaviour has a test at the cheapest level that would catch a regression.
- Work is committed with a message that starts with the task id, for example `T011: add login screen`.
- The ticket's Progress section has an entry for the session.

## Tests

- Unit tests for logic with branches. Component tests for screens with state. Do not test the framework.
- A test is never deleted or weakened to make a task pass. If a test is wrong, say so in Progress and fix the test in its own commit.

## Decisions

- A choice the constitution does not cover, and that another task would need to know about, gets an ADR in `docs/adr/` with status `accepted`.
- A choice that contradicts the constitution is not made. Write the ADR as `proposed`, set the task to `blocked`, stop.

## Commits

Small commits, one concern each. Never commit secrets, build output or `node_modules`.
