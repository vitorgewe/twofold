---
id: ADR-0010
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, ledger, currency]
---
# ADR-0010 Net worth comes from the ledger; currency gains are manual transactions

## Context

Accounts in USD and BTC change value in BRL as rates move. The author updates rates by hand, always against BRL, and wants gains and losses to appear as income or expense of the period, entered as normal transactions.

## Options considered

1. Net worth at market value (native balance times latest rate): always current. Rejected: it diverges from the ledger, so assets would no longer equal liabilities plus equity plus result, and the income statement could not explain the change.
2. Automatic month-end close that revalues foreign accounts: no manual work. Rejected for now: with manual rates it would run on rates that may be stale. The author prefers manual entries at first.
3. Net worth as the sum of ledger BRL values, with value changes entered as ordinary transactions: every number traces to a transaction. Costs: net worth moves only when the author records a gain or loss.

## Decision

Option 3. A value adjustment is a transaction of two postings: a debit on the foreign-currency asset with amount 0 and a positive BRL amount, and a credit on an income account such as "FX gain". A loss is the mirror image. Rates only prefill new postings and show how old they are.

## Consequences

Easier: net worth and the income statement always agree with the ledger. Harder: the author must remember to post adjustments. The check: buy 1,000 USD at 5.00 (R$ 5,000 on the books), post an adjustment of R$ 200, and net worth rises by exactly R$ 200 and the month result shows R$ 200 of income. Automatic month-end revaluation can supersede this decision later.
