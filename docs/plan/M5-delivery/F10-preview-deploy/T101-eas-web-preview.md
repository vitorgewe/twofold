---
id: T101
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M5-delivery]]"
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

**Blocked until the author has done the first two human steps below.** Unattended build sessions are denied `eas`, `npx eas*` and `.relay/deploy.sh` in `.claude/settings.json` on purpose, so a session must never log in, deploy or run `deploy.sh`, and nothing in this task may depend on it doing so.

Human steps, before the session (author):
1. In the repository run `npx eas-cli login` and `npx eas-cli init`. Commit nothing secret.
2. Set this task to `todo`.

Work for the build session, once the task is `todo`:
- Add `eas-cli` as a dev dependency, so `npx eas-cli` resolves from the project and does not stop to ask to install it.
- Add `eas.json` with the `preview` channel the deploy script uses.
- Make the static export carry `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on EAS Hosting. SQLite on web needs `SharedArrayBuffer`, and `metro.config.js` sets those headers only on the dev server. Find the supported mechanism in the Expo EAS Hosting documentation and write an ADR (next free number, accepted) with the choice, because later work depends on it. `credentialless` does not work in Safari.
- Read `.relay/deploy.sh` (do not run it) and note in Progress any change it needs.

Human steps, after the session (author):
- Run `.relay/deploy.sh`, open the URL it prints at 390 x 844, and check three things: the app loads, `crossOriginIsolated` is `true` in the browser console, and an account created there survives a reload. Write the URL and the result in Progress.

Never submit to a store.

## Definition of Done

- [ ] Session: `eas-cli` is a dev dependency, `eas.json` has the `preview` channel, and `.relay/verify.sh` passes
- [ ] Session: an ADR records how the cross-origin isolation headers reach the static deploy
- [ ] Author: the preview URL opens the app at 390 x 844
- [ ] Author: `crossOriginIsolated` is `true` on the preview, and an account created there survives a reload
- [ ] No secret or token is in the repository

## Related decisions

- [[ADR-0013-web-preview-on-eas]]

## Progress

## QA
