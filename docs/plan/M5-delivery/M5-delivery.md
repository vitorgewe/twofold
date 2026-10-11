---
id: M5
type: milestone
tags: [milestone]
---
# M5 Delivery

## Goal

The app can be opened from a public preview URL, and merging a release publishes the new version there. This milestone is led by the author: unattended build sessions are not allowed to log in to Expo or to deploy, so each task lists what the author does and what a session can prepare.

## Acceptance criteria

- [ ] The preview URL opens the app at 390 x 844, `crossOriginIsolated` is true there, and an account created on the preview survives a reload
- [ ] After a release pull request is merged, the deployed app's Settings shows the new version
- [ ] No token or secret is in the repository or in a log

## Features

- [[F10-preview-deploy]]
