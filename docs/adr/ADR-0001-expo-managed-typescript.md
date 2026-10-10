---
id: ADR-0001
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, stack]
---
# ADR-0001 Expo managed workflow with TypeScript

## Context

twofold is a personal finance app used by one person, mainly on a phone. The build runs unattended, so the agent must be able to open the app and use it like a person, without a simulator.

## Options considered

1. Expo managed workflow, React Native, TypeScript: one codebase for iOS, Android and web. The web target lets the agent drive the app in a browser. Costs: libraries must be Expo-compatible.
2. Bare React Native: full native access. Costs: native toolchain maintenance, no easy browser target.
3. Flutter: good cross-platform UI. Costs: new language, weaker browser automation story.
4. Web-only PWA: simplest to build and test. Rejected because the author wants a phone app that feels native.

## Decision

Expo managed workflow with React Native and TypeScript in strict mode. No custom native modules and no ejecting.

## Consequences

Easier: one codebase, browser-based end-to-end tests, preview deploys. Harder: a feature that needs a native-only capability cannot be built without a new ADR. We would notice the decision was wrong if a needed library has no Expo-compatible version.
