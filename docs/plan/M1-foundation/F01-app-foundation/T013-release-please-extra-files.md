---
id: T013
type: task
feature: "[[F01-app-foundation]]"
milestone: "[[M1-foundation]]"
status: review
depends_on: ["[[T011-scaffold-expo-app]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T013 Release-please extra files

## Goal

The app version in `package.json` and `app.json` follows the release version.

## Description

Edit `release-please-config.json` only: add `extra-files` entries of type `json` for `package.json` (path `$.version`) and `app.json` (path `$.expo.version`). Set both versions to `0.0.0` to match `.release-please-manifest.json`. Do not touch the workflows or the manifest.

Out of scope: publishing, and any change to `.github/`.

## Definition of Done

- [x] `package.json` `version` and `app.json` `expo.version` are both `0.0.0`
- [x] `release-please-config.json` is valid JSON and lists both files as extra files
- [x] A Jest test reads `package.json`, `app.json` and `.release-please-manifest.json` and fails if the three versions differ
- [x] `.relay/verify.sh` passes

## Related decisions

- [[ADR-0014-versioning-and-release]]

## Progress

### 2026-10-10
- Done: added `extra-files` (json type) for `package.json` `$.version` and `app.json` `$.expo.version` to `release-please-config.json`. Versions were already `0.0.0` in both files and the manifest. Added `tests/release-versions.test.ts` (three versions equal; config lists both files). `.relay/verify.sh` passes. No UI change, so no Playwright check.
- Failed or surprising: the Description says "path"; release-please's schema key for JSON extra files is `jsonpath` (with `path` as the file), so I used `jsonpath`.
- Next: nothing.

## QA
