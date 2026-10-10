---
id: T021
type: task
feature: "[[F02-ledger-core]]"
milestone: "[[M1-foundation]]"
status: review
depends_on: ["[[T011-scaffold-expo-app]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T021 Money and currency

## Goal

Exact money arithmetic: parse, format and convert, with no floating point.

## Description

In `src/features/ledger/currency.ts` and `money.ts`:

- `Currency` is `{ code, name, decimals }`. Constants for BRL (2), USD (2) and BTC (8).
- `parseAmount(text, currency)` returns integer minor units. It accepts `"1234.56"`, `"1234"` and `"0.005"`, and throws on empty text, letters, a negative sign, or more fraction digits than the currency allows. The sign of a posting is expressed by its side, never by the number.
- `formatAmount(minor, currency, locale?)` formats with the currency's decimals. BRL shows `R$`; currencies without a currency symbol in `Intl` show the number and the code.
- Rates are integers scaled by 10^8 (`RATE_SCALE`). `parseRate("5.1234")` returns `512340000` and throws on more than 8 fraction digits.
- `toBrl(amountMinor, currency, rateScaled)` returns BRL centavos. Do the intermediate multiplication with `BigInt`, round half away from zero to the centavo, and return the amount unchanged for BRL.
- Write an ADR (next free number, status accepted) that records the rate representation as a scaled integer.

Out of scope: any UI, and storage.

## Definition of Done

- [x] `parseAmount("300.00", BRL)` is `30000`; `parseAmount("0.00500000", BTC)` is `500000`; `"1.234"` for BRL and `"-5"` throw
- [x] `toBrl(500000, BTC, parseRate("350000"))` is `175000` (0.005 BTC at R$ 350,000 is R$ 1,750.00)
- [x] `toBrl(100000, USD, parseRate("5.1234"))` is `512340` (USD 1,000.00 is R$ 5,123.40)
- [x] Rounding: `toBrl(1, USD, parseRate("5.5"))` is `6` (5.5 centavos rounds up)
- [x] Large values stay exact: `toBrl(2100000000000000, BTC, parseRate("350000"))` is `735000000000000`
- [x] `formatAmount(30000, BRL, "en-US")` is `"R$300.00"`
- [x] The ADR for the rate representation exists with status accepted

## Related decisions

- [[ADR-0007-integer-money]]
- [[ADR-0006-testing-strategy]]

## Progress

### 2026-10-10 15:00
- Done: added `src/features/ledger/currency.ts` and `money.ts` (parseAmount, parseRate, formatAmount, toBrl with BigInt and half-away-from-zero rounding) and ADR-0016 (rates as integers scaled by 10^8). Every DoD value is asserted in `money.test.ts` (20 tests pass); `.relay/verify.sh` passes. The task has no UI, so the proof is the unit tests, not the browser.
- Failed or surprising: `toBrl` returns a JS number and throws when the result exceeds `Number.MAX_SAFE_INTEGER` (about 9e15 centavos); the 21M BTC case at R$ 350,000 is 7.35e15, so it fits. `formatAmount` falls back to "number code" when Intl has no symbol for the code (BTC).
- Next: nothing left for this task.

## QA
