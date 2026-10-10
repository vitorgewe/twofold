---
id: ADR-0002
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, navigation]
---
# ADR-0002 Expo Router for navigation

## Context

The app has seven screens (Home, New transaction, Transactions, Accounts, Rates, Result, Settings). Each should map to one place in the code and one URL on the web target, so tests can open it directly.

## Options considered

1. Expo Router (file-based): the file tree is the route list, and every screen has a URL on web. Costs: conventions to follow.
2. React Navigation configured by hand: flexible. Costs: route definitions separate from screens, more boilerplate.

## Decision

Expo Router. Every screen is a file under `app/`, and `app/` holds routes only.

## Consequences

Easier: the screen list in the spec maps one-to-one to files, and Playwright can open any screen by URL. Harder: unusual navigation patterns must fit the router. We would notice the decision was wrong if a flow needs navigation the router cannot express.
