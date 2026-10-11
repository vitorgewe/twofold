---
id: T101
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M5-delivery]]"
status: review
depends_on: ["[[T051-home-screen]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 72915
actual_hours: 0.02
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

Research for the cross-origin isolation ADR (done by the author's interactive session on 2026-10-11, because unattended sessions have no web access; do not look anything up, use these findings and state the unknowns as unknowns):
- Mechanism found in the Expo Router documentation (https://docs.expo.dev/router/web/server-headers/): add a `headers` object to the `expo-router` plugin entry in `app.json`, for example `["expo-router", { "headers": { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } }]`. The page's own example for `expo-sqlite` uses `credentialless`; use `require-corp` because `credentialless` does not work in Safari.
- Limits stated there: the headers apply only to HTML and API route responses, not to static assets (JavaScript bundles, wasm, images, fonts) and not to redirects. The page covers `web.output` `static` and `server`, and does not mention `single`, which this project uses since T012 (ADR-0015).
- NOT documented, so unknown: whether EAS Hosting applies these plugin headers to its responses, and whether they apply with `single`. Whether the SQLite worker and wasm still load under `require-corp` is also unverified.
- So the ADR must record the decision as provisional: set the headers through the `expo-router` plugin in `app.json` (make that change), keep `metro.config.js` for the dev server, and treat the author's check on the real preview (`crossOriginIsolated` is `true` and an account survives a reload) as the test that settles it. List the fallbacks in the ADR: a `coi-serviceworker` that injects the headers on the client, or a static host that supports a `_headers` file. Do not claim the headers work on EAS Hosting before that check.

Human steps, after the session (author):
- Run `.relay/deploy.sh`, open the URL it prints at 390 x 844, and check three things: the app loads, `crossOriginIsolated` is `true` in the browser console, and an account created there survives a reload. Write the URL and the result in Progress.

Never submit to a store.

## Definition of Done

- [x] Session: `eas-cli` is a dev dependency, `eas.json` has the `preview` channel, and `.relay/verify.sh` passes
- [x] Session: an ADR records how the cross-origin isolation headers reach the static deploy
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

### 2026-10-11 11:00
- Done: added the `headers` option (COOP `same-origin`, COEP `require-corp`) to the `expo-router` plugin entry in `app.json`, and wrote ADR-0017 (accepted, provisional) with the fallbacks (`coi-serviceworker`, static host with `_headers`). `metro.config.js` unchanged. `.relay/verify.sh` passes with the new config.
- Failed or surprising: the `dist` export with `single` output contains only `index.html`, `metadata.json` and bundles, so no headers file is visible there; I could not confirm locally that EAS Hosting applies the plugin headers. This is the unknown the author's check settles. Did not add `credentialless` anywhere.
- Next: author runs `.relay/deploy.sh`, then checks the three items in the Description. `deploy.sh` notes from the earlier entry still hold (`eas update` needs `expo-updates` and `runtimeVersion`; needs `jq`).
- Status: review (session items done; author items remain unticked on purpose).

## QA
