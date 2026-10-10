---
id: M1
type: milestone
tags: [milestone]
---
# M1 Foundation

## Goal

A runnable Expo app on the web target with a database that survives page reloads, and a tested ledger core: money, the balance rule, net worth, income statement and repositories. There is no user-facing screen beyond a Home placeholder yet.

## Acceptance criteria

- [ ] From a clean checkout, `npm ci` then `.relay/verify.sh` passes, so CI runs the real checks
- [ ] The web target starts and shows a Home placeholder at 390 x 844 with no console errors
- [ ] Data written through the database module survives a full page reload on the web (evidence in T012 Progress)
- [ ] The ledger rules have unit tests, including the seeded randomized balance tests
- [ ] The app version in `package.json` and `app.json` is 0.0.0 and both are listed in the release-please config

## Features

- [[F01-app-foundation]]
- [[F02-ledger-core]]
