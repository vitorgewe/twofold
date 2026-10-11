---
id: T101
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M5-delivery]]"
status: blocked
depends_on: ["[[T051-home-screen]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 39039
actual_hours: 0.01
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

- [x] Session: `eas-cli` is a dev dependency, `eas.json` has the `preview` channel, and `.relay/verify.sh` passes
- [ ] Session: an ADR records how the cross-origin isolation headers reach the static deploy
- [ ] Author: the preview URL opens the app at 390 x 844
- [ ] Author: `crossOriginIsolated` is `true` on the preview, and an account created there survives a reload
- [ ] No secret or token is in the repository

## Related decisions

- [[ADR-0013-web-preview-on-eas]]

## Progress

### 2026-10-11 10:00
- Done: added `eas-cli` as a dev dependency and `eas.json` with a `preview` build profile on channel `preview`; `.relay/verify.sh` passes. `app.json` already had the EAS `projectId` from the author's `eas init`.
- Failed or surprising: the ADR on how the COOP/COEP headers reach the static deploy is NOT written. WebFetch and WebSearch are denied in this session, and nothing in `node_modules` (expo, expo-router, @expo/cli, eas-cli) documents a headers mechanism for EAS Hosting. I will not record an accepted ADR from memory, because later work depends on it. Header value must be `require-corp` (not `credentialless`, which Safari lacks); `metro.config.js` currently sets `credentialless` on the dev server only.
- `.relay/deploy.sh` notes (not run): (1) `eas-cli update --channel preview` needs `expo-updates` and a `runtimeVersion` in `app.json`, neither is present, so that step will likely fail; (2) it needs `jq`; (3) `eas deploy` publishes `dist`, so headers must be inside the export or in an EAS Hosting config file the docs name.
- Next: the author, or a session with web access, reads the EAS Hosting docs on custom headers, adds the mechanism, writes the next-free ADR (ADR-0017), and decides on expo-updates. Then tick the Session ADR item.
- Status: blocked, needs docs access for the headers mechanism.

## QA
