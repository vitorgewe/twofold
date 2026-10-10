---
id: ADR-0007
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, data, money]
---
# ADR-0007 Money as integers in the minor unit

## Context

The app holds BRL, USD and BTC. Balances must close to the exact cent, and floating point errors would break the debit equals credit rule.

## Options considered

1. Floats: easy. Rejected: 0.1 + 0.2 is not 0.3, so balances would drift.
2. A decimal library on every value: exact. Costs: a dependency and slower, heavier values in the database.
3. Integers in the minor unit (centavos, cents, satoshis): exact and cheap, and the database can sum them. Costs: conversion at the edges, and a decimals count per currency.

## Decision

Amounts and BRL values are stored as integers in the minor unit of their currency. The number of decimals comes from the Currency table (BRL 2, USD 2, BTC 8). Decimals appear only when parsing input and formatting output. Rates are stored as scaled integers or decimal strings, never floats. A BRL value computed from amount times rate is rounded half away from zero to the centavo, and the user may edit the BRL value of a posting to absorb rounding.

## Consequences

Easier: exact sums, and the balance check is integer equality. Harder: every input and output path must convert correctly. We would notice the decision was wrong if a total is off by one centavo; the tests in [[ADR-0006-testing-strategy]] include rounding cases for this.
