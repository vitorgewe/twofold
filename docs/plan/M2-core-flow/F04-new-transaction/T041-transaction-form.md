---
id: T041
type: task
feature: "[[F04-new-transaction]]"
milestone: "[[M2-core-flow]]"
status: done
depends_on: ["[[T021-money-and-currency]]", "[[T022-balance-invariant]]", "[[T025-transactions-and-rates-repositories]]", "[[T031-accounts-screen]]"]
estimate_tokens: 800000
estimate_hours: 1
actual_tokens: 84844
actual_hours: 0.04
tags: [task]
---
# T041 Transaction form

## Goal

A form that builds a balanced multi-posting transaction and shows the user, live, whether it balances.

## Description

Route `app/transactions/new.tsx`, built as a reusable `TransactionForm` component in `src/features/transactions/` (T062 reuses it for editing). Add a "New transaction" button to the Home placeholder that opens the route; T051 keeps it.

Use the exact labels and test ids in the smoke test contract in [[plan]].

- "Description" text field and a date field defaulting to today (`YYYY-MM-DD`).
- Posting rows `posting-1`, `posting-2`, and so on, starting with two. Each row has an "Account" control that opens a list of non-archived accounts (options), "Debit" and "Credit" radios, and an "Amount" field parsed with `parseAmount` in the account's currency.
- For a foreign-currency account the row also shows a "Rate" field (BRL per unit, `parseRate`) and a "BRL value" field. BRL value is computed with `toBrl` and the user can overwrite it to absorb rounding; the balance check uses the value shown. Until T071 exists the rate is typed by hand.
- "Add posting" and a remove action per row, never below two postings.
- A live summary: total debits, total credits and the difference in BRL.
- "Save transaction" is enabled only when the description is filled, every posting is complete and the difference is zero. In this task it calls an `onSubmit(draft)` prop; T042 wires it to the database.
- `useQuery` supplies the accounts. Strings come from `src/ui/strings.ts`.

Out of scope: writing to the database (T042), prefilled rates (T071), editing (T062).

## Definition of Done

- [x] One credit of R$ 1,000.00 and three debits of 400.00, 350.00 and 250.00: the summary shows a difference of 0.00 and "Save transaction" is enabled. Changing the last debit to 249.99 shows a difference of 0.01 and disables it
- [x] A BTC posting accepts `0.00500000` and rejects `0.005000001`; a BRL posting rejects `1.234`
- [x] A USD posting of 100.00 with rate 5.20 shows BRL value 520.00; editing it to 520.01 changes the summary accordingly
- [x] Archived accounts are not offered; removing a posting never leaves fewer than two
- [x] With four postings at 390 x 844 nothing is clipped or overlapping and there is no horizontal scroll
- [x] Jest component tests for the validation and the difference summary; the control names match the contract in [[plan]]

## Related decisions

- [[ADR-0007-integer-money]]
- [[ADR-0009-balance-invariant]]
- [[ADR-0010-net-worth-from-ledger]]
- [[ADR-0012-english-only]]

## Progress

### 2026-10-10 22:30
- Done: `TransactionForm` (`src/features/transactions/`), pure row/summary logic in `draft.ts`, route `app/transactions/new.tsx`, Home "New transaction" button, strings. Checked at 390 x 844 with Playwright: 1000 credit vs 400/350/250 debits gives difference R$0.00 and enables Save; 249.99 disables it; BTC 0.005000001 and BRL 1.234 are rejected, 0.00500000 accepted; USD 100.00 at 5.20 shows 520.00, overwrite to 520.01 moves the totals; archived account not offered; no remove button with two rows; scrollWidth equals viewport width with four postings. `.relay/verify.sh` passes.
- Failed or surprising: the difference is signed debits minus credits, so 249.99 shows -R$0.01 (magnitude 0.01 as the DoD says). Typed routes failed typecheck until `.relay/init.sh --restart` regenerated them. The route passes a no-op `onSubmit`; T042 must wire it. Editing amount or rate clears a typed BRL override. Only the form was exercised in the browser, not the full smoke test (needs T042 and T051).
- Next: T042 wires `onSubmit` to `createTransaction`.

## QA
