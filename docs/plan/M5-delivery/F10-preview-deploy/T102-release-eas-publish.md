---
id: T102
type: task
feature: "[[F10-preview-deploy]]"
milestone: "[[M5-delivery]]"
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

**Blocked until T101 is done and the `EXPO_TOKEN` repository secret exists.** The author creates an access token on expo.dev and stores it with `gh secret set EXPO_TOKEN --repo vitorgewe/twofold`; the token never goes in the repository or in a log. Then the author sets this task to `todo`. An unattended session is denied `eas` and `deploy.sh`, so it only writes the workflow and never runs a deploy.

Work for the build session:
- Add a job to `.github/workflows/release.yml` that runs only when release-please reports `release_created`. It installs dependencies with `npm ci`, exports the web build and deploys it to EAS Hosting with the token from the secret (using the headers setup from T101). Do not print the token and do not run the job for pull requests from forks.

Check by the author, after merging a release pull request: the job runs, and Settings on the deployed app shows the new version.

## Definition of Done

- [ ] Session: the workflow file is valid and the new job is skipped when no release was created
- [ ] Author: after a release pull request is merged, the job runs and the deployed app's Settings shows the new version
- [ ] The token appears nowhere in logs or in the repository

## Related decisions

- [[ADR-0014-versioning-and-release]]
- [[ADR-0013-web-preview-on-eas]]

## Progress

## QA
