---
id: ADR-0014
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, release, ci]
---
# ADR-0014 Versioning and release with release-please

## Context

The author wants releases to be versioned and published by automation, not by hand. Pull requests and a passing `verify` check are required to change `main`, with no bypass, so no automation can push to `main`. The version bump must therefore arrive as a pull request the author merges.

## Options considered

1. release-please: reads Conventional Commits on `main` and keeps one open release pull request that bumps the version and the changelog. Merging it creates the tag and the GitHub Release. Costs: commit messages must follow Conventional Commits, and it needs a personal access token so the release pull request triggers CI.
2. semantic-release: fully automatic bump and publish. Rejected: it pushes directly to `main`, which the branch ruleset forbids.
3. Changesets: explicit change files per pull request. Rejected: aimed at npm packages and adds a file to write in every pull request.
4. Tags created by hand: no tooling. Rejected: the author asked for the bump and publication to be done by automation.

## Decision

Option 1.

- Versions follow SemVer. The manifest starts at `0.0.0`, so the first `feat:` produces `0.1.0` and the first `fix:` `0.0.1`. While the major version is 0, breaking changes bump the minor number. `1.0.0` is a deliberate decision, not an automatic one.
- Commits that reach `main` use Conventional Commits. Pull requests are squash merged so the pull request title is the commit message, and a CI job checks that title.
- `docs:`, `ci:` and `chore:` commits do not create a release.
- The release workflow runs on every push to `main` with the `RELEASE_PLEASE_TOKEN` secret, a fine-grained token limited to this repository with contents and pull requests write access.
- Publishing means a git tag `vX.Y.Z` and a GitHub Release with the changelog. Publishing the app to EAS Hosting is added to the release workflow once the app exists and an `EXPO_TOKEN` secret is set ([[ADR-0013-web-preview-on-eas]]).
- The release type is `simple` (a `version.txt` and `CHANGELOG.md`). When the Expo app exists, `package.json` and `app.json` are added as extra files so the app version follows the release.

## Consequences

Easier: every version has a changelog and a tag, and the author controls each release by merging one pull request. Harder: a badly named commit is silently ignored by the bump, which is why the title check exists; and the token is a secret that expires and must be renewed.

How we would notice the decision was wrong:

- The release pull request shows no `verify` check: the token is not being used.
- A `feat:` merged to `main` does not appear in the release pull request: the commit message did not follow the convention.

The plan must include two tasks: add `package.json` and `app.json` to the release-please extra files after the scaffold, and add the EAS publish step once `EXPO_TOKEN` exists.
