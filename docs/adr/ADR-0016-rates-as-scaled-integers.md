---
id: ADR-0016
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, data, money]
---
# ADR-0016 Exchange rates as integers scaled by 10^8

## Context

[[ADR-0007-integer-money]] says rates are scaled integers or decimal strings, never floats. Converting an amount to BRL needs one fixed representation that storage, the balance check and the UI all agree on.

## Options considered

1. Decimal strings: exact, but every conversion parses a string and the database cannot compare or multiply them.
2. Floats: rejected by ADR-0007; 5.1234 has no exact binary form.
3. Integers scaled by 10^8 (`RATE_SCALE`): exact, sortable, storable in an INTEGER column. Costs: the product amount times rate can exceed 2^53, and rates with more than 8 fraction digits cannot be stored.

## Decision

A rate is the BRL price of one whole unit of a currency, stored as an integer multiplied by `RATE_SCALE` (10^8): `5.1234` is `512340000`. `parseRate` rejects more than 8 fraction digits. `toBrl` multiplies amount, rate and 10^2 with `BigInt`, divides by 10^decimals times `RATE_SCALE`, rounds half away from zero to the centavo, and throws if the result is not a safe integer. Eight digits match BTC precision, so a satoshi-level price needs no extra scale.

## Consequences

Easier: exact, deterministic conversions that can be tested with integers. Harder: code outside `money.ts` must never multiply amounts and rates with plain numbers. We would notice the decision was wrong if a needed rate has more than 8 fraction digits, or a BRL value exceeds 9 x 10^15 centavos.
