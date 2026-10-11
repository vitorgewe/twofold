---
id: T102
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M5-delivery]]"
status: review
depends_on: ["[[T101-eas-web-preview]]", "[[T013-release-please-extra-files]]"]
estimate_tokens: 150000
estimate_hours: 0.25
actual_tokens: 0
actual_hours: 0
tags: [task]
---
# T102 Release EAS publish

## Goal

Merging a release pull request publishes the new version to EAS Hosting.

## Description

**Blocked until T101 is done and the `EXPO_TOKEN` repository secret exists.** The author creates an access token on expo.dev and stores it with `gh secret set EXPO_TOKEN --repo vitorgewe/twofold`; the token never goes in the repository or in a log. Then the author sets this task to `todo`. An unattended session is denied `eas` and `deploy.sh`, so it only writes the workflow and never runs a deploy.

Work for the build session:
- Add a job to `.github/workflows/release.yml` that runs only when release-please reports `release_created`. It installs dependencies with `npm ci`, exports the web build and deploys it to EAS Hosting with the token from the secret (using the headers setup from T101). Do not print the token and do not run the job for pull requests from forks.

Check by the author, after merging a release pull request: the job runs, and Settings on the deployed app shows the new version.

## Definition of Done

- [x] Session: the workflow file is valid and the new job is skipped when no release was created
- [ ] Author: after a release pull request is merged, the job runs and the deployed app's Settings shows the new version
- [x] The token appears nowhere in logs or in the repository

## Related decisions

- [[ADR-0014-versioning-and-release]]
- [[ADR-0013-web-preview-on-eas]]

## Progress

### 2026-10-11 12:00
- Done: added a `deploy` job to `.github/workflows/release.yml`. The `release-please` job now has `id: release` and exposes `release_created` as a job output. `deploy` has `needs: release-please` and `if: needs.release-please.outputs.release_created == 'true'`, so it is skipped otherwise. It runs `npm ci`, `npx expo export --platform web` and `npx eas-cli deploy --prod --non-interactive`. `EXPO_TOKEN` comes from `secrets.EXPO_TOKEN` as an env var on the deploy step only. The workflow triggers only on push to `main`, so fork pull requests never reach the secret. `.relay/verify.sh` passes.
- Failed or surprising: no YAML or workflow linter was allowed to run (python and `eas deploy --help` were denied), so "valid" and "token appears nowhere" are checked by reading the file only. The token is referenced only as `secrets.EXPO_TOKEN`. `--prod` is from my knowledge of eas-cli, not confirmed locally.
- Next: the author checks on the first real release: the `deploy` job runs and Settings on the deployed app shows the new version. If `--prod` is rejected, drop it (`.relay/deploy.sh` uses plain `eas-cli deploy`). Note that T101's isolation-header check (ADR-0017) is still pending on the real preview.

## QA
