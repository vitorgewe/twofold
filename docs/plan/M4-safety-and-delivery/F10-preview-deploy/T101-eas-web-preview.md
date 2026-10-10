---
id: T101
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M4-safety-and-delivery]]"
status: blocked
depends_on: ["[[T051-home-screen]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T101 EAS web preview

## Goal

A public preview URL of the web app on EAS Hosting.

## Description

**Blocked: needs the author's Expo account.** The author must run `npx eas-cli login` and `npx eas-cli init` in the repository, commit nothing secret, and set this task to `todo`.

After that, run `.relay/deploy.sh`, which publishes the web export to EAS Hosting and an EAS Update on the `preview` channel, and record the URL in Progress. Never submit to a store.

## Definition of Done

- [ ] The preview URL opens the app at 390 x 844
- [ ] Creating an account there and reloading keeps it
- [ ] No secret or token is in the repository

## Related decisions

- [[ADR-0013-web-preview-on-eas]]

## Progress

## QA
