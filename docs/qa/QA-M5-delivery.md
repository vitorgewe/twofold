---
type: qa
milestone: "[[M5-delivery]]"
round: 1
verdict: approved
date: 2026-10-11
tags: [qa]
---
# QA M5 Delivery

## Verdict

Approved for what a session can verify. `.relay/verify.sh` prints `verify: ok`, and on the dev server at 390 x 844 `/settings` shows `Version 0.3.0` and `crossOriginIsolated` is `true`. Everything that needs the real preview URL or a real release is an Author item or depends on one, and is listed below as open for the author, not as a failure. Note: the runner called this round 1, but the tickets already hold QA entries labelled rounds 1 to 3 from an earlier run, which flagged the missing author result as defect D2. Under the current rules that is not a defect.

## Scores

| Criterion | Score (1-5) | Threshold | Evidence |
|---|---|---|---|
| Functionality | 4 | 4 | `verify: ok` (221 tests, web export). Settings at 390 x 844 shows `Version 0.3.0`, matching `app.json`; `crossOriginIsolated` is `true` locally; no console error seen. The deployed behaviour is not verifiable here and is not scored. |
| Data integrity | Not verifiable here | 4 | M5 changes no data code. Persistence on the preview needs the preview URL (Author item). |
| Mobile usability | 4 | 3 | Settings: `scrollWidth` is 390 (no horizontal scroll), nothing clipped, a "Back to home" link exists. |
| Design coherence | 4 | 3 | Settings matches the other screens. |
| Code quality | 4 | 3 | `eas.json`, the `expo-router` headers option, ADR-0017 and the `deploy` job (gated on `release_created`, token only as `secrets.EXPO_TOKEN`) follow the plan. No secret found in the repository. |

## Features

### [[F10-preview-deploy]]

| Definition of Done item | Result | What I did and what happened |
|---|---|---|
| The preview URL opens the app and a created account survives a reload there | Not verifiable here | Needs `eas deploy` by the author. Locally `crossOriginIsolated` is `true`. |
| After a release pull request is merged, the deployed app's Settings shows the new version | Not verifiable here | Needs a real release and the `EXPO_TOKEN` secret. Locally Settings shows 0.3.0. |

T101 session items pass (`eas-cli` dev dependency, `eas.json` with `preview`, ADR-0017 accepted, `app.json` headers). T102 session items pass (workflow job skipped unless `release_created`, no token in the repository).

## Open for the author

- T101: run `npx expo export --platform web --clear` then `npx eas-cli deploy`; open the URL at 390 x 844; check the app loads, `crossOriginIsolated` is `true`, an account survives a reload; write the URL and result in T101 Progress. This also settles whether ADR-0017's headers work on EAS Hosting.
- T102: after merging a release pull request, check that the `deploy` job runs and Settings on the deployed app shows the new version. If `--prod` is rejected by `eas-cli deploy`, drop it.
- `.relay/deploy.sh` is stale for the same reason noted in T101: `eas update` needs `expo-updates` and `runtimeVersion`, absent from `app.json`.

## Defects

None.
