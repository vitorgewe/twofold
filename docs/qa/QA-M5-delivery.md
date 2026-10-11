---
type: qa
milestone: "[[M5-delivery]]"
round: 3
verdict: rejected
date: 2026-10-11
tags: [qa]
---
# QA M5 Delivery

## Verdict

Rejected. Nothing changed in the repository that a session can fix since round 2. Both Definition of Done items of F10 and two of three milestone acceptance criteria depend on the real preview URL and a real release, which are not recorded, and QA has no `eas` access. The blocker is D2, which needs the author (`.relay/deploy.sh`, then writing the URL and the three check results in T101 Progress). This is the last round: a human has to act before another run can pass.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 2 | 4 | `.relay/verify.sh` passes (221 tests, web export, `verify: ok`). On the dev server at 390 x 844, `/settings` shows `Version 0.3.0` and `crossOriginIsolated` is `true`. The DoD items about the preview URL, an account surviving a reload there, and the deployed Settings version were not seen working. |
| Data integrity | 3 | 4 | M5 changes no data code. Persistence on the preview could not be tested without the URL. Scored as unproven, not as a defect. |
| Mobile usability | 4 | 3 | Settings at 390 x 844: nothing clipped, no horizontal scroll, a "Back to home" link exists. |
| Design coherence | 4 | 3 | Settings reads as part of the same app as before. |
| Code quality | 4 | 3 | `eas.json`, the `expo-router` headers option, ADR-0017 and the `deploy` job follow the plan; no secret in the repository. The `--prod` flag and the `.relay/deploy.sh` needs (`expo-updates`, `runtimeVersion`) remain unconfirmed. |

## Features

### [[F10-preview-deploy]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| The preview URL opens the app and a created account survives a reload there | Not verifiable here | No preview URL or result is recorded in T101 Progress; QA has no `eas` access. Locally `crossOriginIsolated` is `true`. |
| After a release pull request is merged, the deployed app's Settings shows the new version | Not verifiable here | Needs a real release and the `EXPO_TOKEN` secret. Locally Settings shows `Version 0.3.0`, matching `app.json` and `package.json`. |

Milestone acceptance criteria: preview and release items not verifiable here; "no token or secret in the repository or in a log" passed for the repository (only `secrets.EXPO_TOKEN` references); logs of a real run are not available.

## Defects

### D1 (T102): Settings shows the previous version: resolved

Settings shows `Version 0.3.0` locally. It was a stale Metro cache.

### D2 (T101): author checks not done or not recorded: open

- Steps: read T101 Progress.
- Expected: the preview URL and the result of the three checks (loads at 390 x 844, `crossOriginIsolated` true, account survives a reload), written by the author, with the Author DoD items ticked.
- Actual: none recorded. This also settles whether ADR-0017's headers work on EAS Hosting, so it needs a human.

### D3 (T102): deploy step is unconfirmed: open, not blocking by itself

- The workflow runs `npx eas-cli deploy --prod --non-interactive`; `--prod` is unconfirmed. The first real release settles it; drop `--prod` if rejected. Also `.relay/deploy.sh` runs `eas update`, which needs `expo-updates` and `runtimeVersion`, absent from `app.json`.
