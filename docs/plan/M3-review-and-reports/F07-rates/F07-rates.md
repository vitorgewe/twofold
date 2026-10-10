---
id: F07
type: feature
milestone: "[[M3-review-and-reports]]"
status: done
estimate_tokens: 400000
estimate_hours: 0.5
tags: [feature]
---
# F07 Rates

## Goal

The user keeps exchange rates against BRL up to date by hand, and the new-transaction form uses them as a starting point.

## Description

A simple page lists each foreign currency with its latest rate and how old it is, and lets the user add a rate. Rates prefill the rate field of foreign-currency postings. They never change net worth.

## Definition of Done

- [ ] Saving USD 5.1234 shows it as the latest USD rate with today's date
- [ ] A new USD posting of 100.00 has its rate prefilled with 5.1234 and a BRL value of 512.34
- [ ] Net worth on Home is the same before and after saving a rate

## Tasks

- [[T071-rates-screen]]

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]

## Progress

## QA
