---
id: ADR-0013
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, deploy]
---
# ADR-0013 Web preview on EAS Hosting

## Context

The author wants to open the app from a URL on a phone or computer without going through a store. Nothing financial is stored on a server, so the deployed app is only code.

## Options considered

1. Run locally only: no account and no cost. Costs: the app is reachable only while the dev server runs.
2. Web preview on EAS Hosting plus EAS Update on the `preview` channel: a stable URL. Costs: an Expo account, which is a manual step for the author.
3. Store builds: native install. Rejected: needs developer accounts and review, and the module never submits to stores.

## Decision

Option 2, through `.relay/deploy.sh`. The deploy task is `status: blocked` from the start because it needs the Expo account; the reason is written in the ticket so the run does not wait on it silently. Nothing is ever submitted to the App Store or Google Play.

## Consequences

Easier: a link to the app anywhere. Harder: data on the web is kept in the browser storage and is separate from data on the phone, and the browser may clear it. The backup file is the only way to move data between them ([[ADR-0011-backup-and-csv-import]]), and the app must request persistent storage on the web ([[ADR-0003-local-first-sqlite-storage]]). The preview URL is public but holds no user data. We would notice the decision was wrong if the free Expo plan limits get in the way.
