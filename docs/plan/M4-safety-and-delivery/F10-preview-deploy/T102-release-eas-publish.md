---
id: T102
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M4-safety-and-delivery]]"
status: blocked
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

**Blocked: needs the `EXPO_TOKEN` repository secret.** The author creates an access token on expo.dev and stores it with `gh secret set EXPO_TOKEN`, then sets this task to `todo`. The task also needs T101.

Then add a job to `.github/workflows/release.yml` that runs only when release-please reports `release_created`, installs dependencies with `npm ci`, exports the web build and deploys it to EAS Hosting with the token. Do not print the token, and do not run the job on pull requests from forks.

## Definition of Done

- [ ] The workflow file is valid and the new job is skipped when no release was created
- [ ] After a release pull request is merged, the job runs and the deployed app's Settings shows the new version
- [ ] The token appears nowhere in logs or in the repository

## Related decisions

- [[ADR-0014-versioning-and-release]]
- [[ADR-0013-web-preview-on-eas]]

## Progress

## QA
