---
type: qa
milestone: "[[M5-delivery]]"
round: 1
verdict: rejected
date: 2026-10-11
tags: [qa]
---
# QA M5 Delivery

## Verdict

Rejected: the milestone's acceptance criteria are about the public preview URL and a deployed release, no URL or deploy result is recorded, and the local export shows version 0.2.0 while the repository is at 0.3.0.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 2 | 4 | `.relay/verify.sh` passes (221 unit tests, web export). The app loads at 390 x 844 and, after `.relay/init.sh --restart`, `crossOriginIsolated` is `true` locally. But the preview URL, the isolation check on EAS Hosting, the account surviving a reload there and the deployed Settings version were not seen working: the author's steps are not recorded in T101 or T102. Settings on the local server and in the fresh `dist` export shows `Version 0.2.0`, but `app.json`, `package.json` and `.release-please-manifest.json` say 0.3.0. |
| Data integrity | 3 | 4 | Not exercised: M5 changes no data code. Persistence on the preview could not be tested without the URL. Scored as unproven, not as a defect. |
| Mobile usability | 4 | 3 | Home and Settings at 390 x 844: nothing clipped, no horizontal scroll. |
| Design coherence | 4 | 3 | Home and Settings read as one app. |
| Code quality | 4 | 3 | `eas.json`, the `expo-router` headers option, ADR-0017 and the `deploy` job follow the plan; no secret in the repository (`git grep` finds only `secrets.*` references). The deploy flags are untested: `--prod` is unconfirmed, and `.relay/deploy.sh` needs `expo-updates` and `runtimeVersion`, which are absent. |

## Features

### [[F10-preview-deploy]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| The preview URL opens the app and a created account survives a reload there | Not verifiable here | No preview URL is recorded in T101 Progress, and this session has no `eas` access. Locally, after a server restart, `crossOriginIsolated` was `true` for the page; before the restart it was `false` (stale server). |
| After a release pull request is merged, the deployed app's Settings shows the new version | Not verifiable here | Needs a real release and the `EXPO_TOKEN` secret. Locally, Settings shows 0.2.0 against 0.3.0 in the repository (see Defects). |

Milestone acceptance criteria: the preview and release items are not verifiable here; "no token or secret in the repository or a log" passed for the repository (workflow only references `secrets.EXPO_TOKEN`); logs of a real run were not available.

## Defects

### D1 (T102, possibly T101): Settings shows the previous version

- Steps: run `.relay/init.sh --restart`, open `http://localhost:8081/settings` at 390 x 844. Also run `.relay/verify.sh` and search `dist/_expo/static/js/web/entry-*.js` for `"version"`.
- Expected: `Version 0.3.0`, the value in `app.json`, `package.json` and `.release-please-manifest.json`.
- Actual: `Version 0.2.0` on the dev server, and the exported bundle embeds `"version":"0.2.0"` inside the app config.
- Not known whether this is a stale Metro transform cache or a real build problem; CI starts with a clean cache and may be fine. The builder should find the cause (for example with `npx expo export --platform web --clear`), because the milestone's second criterion depends on it.

### D2 (T101): author checks not done or not recorded

- Steps: read T101 Progress.
- Expected: the preview URL and the result of the three checks (loads at 390 x 844, `crossOriginIsolated` true, account survives a reload), written by the author.
- Actual: none recorded; the Author Definition of Done items are unticked. This also settles whether ADR-0017's headers work on EAS Hosting, so it needs a human.

### D3 (T102): deploy step is unconfirmed

- The workflow runs `npx eas-cli deploy --prod --non-interactive`; `--prod` was not confirmed. The author's check on the first real release settles it, and the Progress note already says to drop `--prod` if it is rejected.
