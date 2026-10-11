---
id: F10
type: feature
milestone: "[[M5-delivery]]"
status: todo
estimate_tokens: 300000
estimate_hours: 0.5
tags: [feature]
---
# F10 Preview deploy

## Goal

The author opens the app from a URL, and every release publishes the new version there.

## Description

Both tasks start `blocked` because they need accounts and tokens that only the author can create. Their Descriptions say exactly what to provide.

## Definition of Done

- [ ] The preview URL opens the app and a created account survives a reload there
- [ ] After a release pull request is merged, the deployed app's Settings shows the new version

## Tasks

- [[T101-eas-web-preview]]
- [[T102-release-eas-publish]]

## Related decisions

- [[ADR-0013-web-preview-on-eas]]
- [[ADR-0014-versioning-and-release]]

## Progress

## QA

### Round 1, 2026-10-11
- Both Definition of Done items are not verifiable here (no preview URL recorded, no real release). Local Settings shows 0.2.0 against 0.3.0 in the repository (D1). Details in `docs/qa/QA-M5-delivery.md`.
