---
id: T071
type: task
feature: "[[F07-rates]]"
milestone: "[[M3-review-and-reports]]"
status: todo
depends_on: ["[[T042-save-transaction]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T071 Rates screen

## Goal

The user records exchange rates and the transaction form prefills from them.

## Description

Route `app/rates.tsx` with a "Rates" entry in the layout.

- One section per non-BRL currency (USD, BTC) with the latest rate, its date and its age ("3 days ago").
- A form: "Currency", "BRL per unit" (parsed with `parseRate`, up to 8 decimals), a date defaulting to today, and "Save rate". A rate for the same currency and date replaces the previous one.
- A history list per currency, newest first.
- In `TransactionForm` (T041), when a posting's account is in a foreign currency and the rate field is empty, prefill it with `latestRate`. The user can still overwrite it.

Out of scope: automatic rates, and any use of rates in net worth.

## Definition of Done

- [ ] Save USD 5.1234: the USD section shows 5.1234 and today's date; saving 5.20 on the same date replaces it
- [ ] A new transaction with a "Cash USD" posting of 100.00 shows the rate prefilled and a BRL value of 520.00 after the 5.20 rate; overwriting the rate field wins
- [ ] A rate dated 3 days ago shows "3 days ago"
- [ ] Invalid input (letters, more than 8 decimals) is rejected with a message
- [ ] Net worth on Home is identical before and after saving a rate
- [ ] Rates are still there after a reload; nothing is clipped at 390 x 844

## Related decisions

- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0007-integer-money]]

## Progress

## QA
