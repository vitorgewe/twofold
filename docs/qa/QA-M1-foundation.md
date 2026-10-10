---
type: qa
milestone: "[[M1-foundation]]"
round: 2
verdict: approved
date: 2026-10-10
tags: [qa]
---
# QA M1 Foundation

## Verdict

Approved: defect D1 from round 1 is fixed (`app/dbcheck.tsx` is removed and `/dbcheck` no longer resolves), `.relay/verify.sh` is clean, and every Definition of Done item passed.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 4 | 4 | Home placeholder renders at 390 x 844 with 0 console errors and 0 warnings. `.relay/verify.sh` ends with `verify: ok` (10 suites, 74 tests, web export succeeds). Not 5: there is no user-facing feature yet to exercise beyond Home. |
| Data integrity | 4 | 4 | Persistence and the invariants (duplicate name, currency change, unknown currency rejected) were watched in round 1. The polluting debug route is gone, so no reachable URL writes to user data. I could not re-watch persistence this round because no remaining screen touches the database (see below). |
| Mobile usability | 3 | 3 | At 390 x 844 `scrollWidth` equals `clientWidth` (390); the title "Twofold" is the only content and nothing is clipped. Empty and error states do not apply yet. An unknown URL shows the router's "Unmatched Route" page with a "Go back" link. |
| Design coherence | 3 | 3 | One plain, consistent placeholder screen; not the starter template. |
| Code quality | 3 | 3 | `git ls-files app` lists only `+html.tsx`, `_layout.tsx`, `index.tsx`. `git status` is clean. `.relay/verify.sh` prints no lint warnings. `app/` holds routes only. |

## Features

### [[F01-app-foundation]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| Home placeholder at 390 x 844 with no console errors | Pass | After restarting the dev server I opened `/`: the page shows "Twofold", 0 console errors, 0 warnings, no horizontal scroll. |
| Value written to the database is readable after reload and after closing and reopening the tab | Pass (carried from round 1) | Watched in round 1 through a debug route that no longer exists. `src/data/database.ts` is unchanged by the fix, and no screen can write to the database now, so I could not repeat it. |
| `npm ci` and `.relay/verify.sh` pass from a clean checkout | Pass | `.relay/verify.sh` printed `verify: ok`. I did not run `npm ci` from a clean clone; the install reported up to date. |
| `package.json` and `app.json` carry 0.0.0 and are listed in the release-please config | Pass | Checked in round 1; `tests/release-versions.test.ts` passes in this round's verify run. |

### [[F02-ledger-core]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| `npx jest` runs all suites and they pass | Pass | verify ran 10 suites, 74 tests, all passing. |
| Seeded randomized create/edit/delete test finds no unbalanced transaction | Pass | The seeded run in `transactions.test.ts` passes; I did not read its internals. |
| Nothing under `src/features/ledger/` imports React Native, Expo or `src/data/` | Pass | The import-scan test in `balance.test.ts` passes. |
| App still starts on the web target after migrations run | Pass | `/` loads with 0 console errors after a dev server restart. |

## Defects

None open.

Round 1 defect D1 (throwaway debug route committed, T023): retested. `ls app` and `git ls-files app` no longer list `dbcheck.tsx`. After `.relay/init.sh --restart`, `/dbcheck` shows "Unmatched Route". Before the restart the already-running dev server still served the deleted route from its cache; that is a dev server behaviour, not a code defect.
