---
id: M2
type: milestone
tags: [milestone]
---
# M2 Core flow

## Goal

The core flow of the spec works end to end in the browser: create accounts, record a balanced transaction with any number of postings, and see net worth and the month result on Home. The smoke test passes.

## Acceptance criteria

- [ ] `npx playwright test e2e/smoke.spec.ts` passes against the dev server
- [ ] Accounts can be created, renamed, archived, adjusted in value, and opened to see their statement
- [ ] A transaction of one credit and three debits saves only when the sides are equal in BRL
- [ ] Net worth, month result and the per-currency balances on Home match the ledger and survive a reload
- [ ] All screens work at 390 x 844 with no clipped text and no horizontal scroll

## Features

- [[F03-accounts]]
- [[F04-new-transaction]]
- [[F05-home]]
