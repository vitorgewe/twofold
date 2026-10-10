---
type: qa
milestone: "[[M1-foundation]]"
round: 1
verdict: rejected
date: 2026-10-10
tags: [qa]
---
# QA M1 Foundation

## Verdict

Rejected: a throwaway debug route, `app/dbcheck.tsx`, is committed to the repository and ships in the app. Visiting `/dbcheck` writes a new account to the real database every time. Everything else in the milestone worked.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 4 | 4 | Home placeholder renders at 390 x 844 with no console errors. Data written to SQLite survived a full reload (see F01). `.relay/verify.sh` ends with `verify: ok` (74 Jest tests). Not 5: the app still exposes a debug route. |
| Data integrity | 3 | 4 | Persistence works and the invariants were rejected as designed (duplicate name, currency change, unknown currency). But each visit to `/dbcheck` inserts an account: the count went 3 to 4 on a reload, so a reachable URL pollutes user data. |
| Mobile usability | 3 | 3 | At 390 x 844 the title is centred, `scrollWidth` equals `clientWidth` (390), nothing is clipped. There is no screen beyond the placeholder, so empty and error states are not applicable yet. |
| Design coherence | 3 | 3 | One placeholder screen: plain but consistent, not the starter template. |
| Code quality | 2 | 3 | `app/dbcheck.tsx` is tracked in git (`git ls-files app` lists it), contradicts the T023 Progress claim that it is untracked, bypasses the repository layer by calling `db.run` directly, and `.relay/verify.sh` prints 3 lint warnings for it (`'e' is defined but never used`). Constitution: `app/` holds routes only, and no screen reads the database outside `src/data/` hooks. |

## Features

### [[F01-app-foundation]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Home placeholder at 390 x 844 with no console errors | Pass | Opened `/`; it shows "Twofold", with 0 console errors and 0 warnings. |
| Value written to the database is readable after reload and after closing and reopening the tab | Pass | Reloaded `/dbcheck` and the account count went from 3 to 4. I then opened a second tab, closed the first, and reloaded: the count read 5, so earlier rows were still there. This was a tab close, not a browser restart. |
| `npm ci` and `.relay/verify.sh` pass from a clean checkout | Pass | `.relay/verify.sh` printed `verify: ok`. I did not run a clean clone `npm ci`; `init.sh` reported the install up to date. |
| `package.json` and `app.json` carry 0.0.0 and are listed in the release-please config | Pass | `package.json` and `app.json` both have version 0.0.0, and the config lists both as `extra-files` with `jsonpath`. |

### [[F02-ledger-core]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| `npx jest` runs all suites and they pass | Pass | verify ran 10 suites, 74 tests, all passing, including the repository suites on sql.js. |
| Seeded randomized create/edit/delete test finds no unbalanced transaction | Pass | The T025 seeded run is in `transactions.test.ts` and passes; I did not read its internals. |
| Nothing under `src/features/ledger/` imports React Native, Expo or `src/data/` | Pass | `balance.test.ts` has an import-scan test and it passes. |
| App still starts on the web target after migrations run | Pass | `/dbcheck` ran migration 2 on the real browser database and returned BRL, BTC and USD in `currency`. `/` loads with 0 console errors. |

## Defects

### D1: throwaway debug route committed ([[T023-database-schema-and-accounts-repository]])

Steps to reproduce:
1. Run `git ls-files app`. The output includes `app/dbcheck.tsx`.
2. Run `.relay/init.sh` and open `http://localhost:8081/dbcheck`.
3. Reload the page.

Expected: no such route. T023 says the proof used a throwaway route that is not committed, and the constitution keeps `app/` for real screens that use `src/data/` hooks.

Actual: the route exists and is tracked. Each load creates an account named `Check <timestamp>` (the count went 3 to 4 after a reload), calls `db.run` directly, and attempts invalid writes. `.relay/verify.sh` also prints 3 lint warnings for this file.

Fix: `git rm app/dbcheck.tsx` and confirm `.relay/verify.sh` prints no lint warnings.
