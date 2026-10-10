---
id: F01
type: feature
milestone: "[[M1-foundation]]"
status: done
estimate_tokens: 1350000
estimate_hours: 1.75
tags: [feature]
---
# F01 App foundation

## Goal

A running app skeleton on the web target, backed by a database that survives reloads, wired into CI and the release process.

## Description

The first task scaffolds the Expo app. The second proves the riskiest assumption of the stack: that SQLite persists in the browser. The third makes the app version follow the release version.

## Definition of Done

- [ ] Opening the web app at 390 x 844 shows the Home placeholder with no console errors
- [ ] A value written to the database is still readable after reloading the page and after closing and reopening the tab
- [ ] `npm ci` and `.relay/verify.sh` pass from a clean checkout
- [ ] `package.json` and `app.json` carry version 0.0.0 and are listed in the release-please config

## Tasks

- [[T011-scaffold-expo-app]]
- [[T012-sqlite-web-persistence]]
- [[T013-release-please-extra-files]]

## Related decisions

- [[ADR-0001-expo-managed-typescript]]
- [[ADR-0003-local-first-sqlite-storage]]
- [[ADR-0014-versioning-and-release]]

## Progress

## QA
