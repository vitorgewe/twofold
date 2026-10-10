---
id: T011
type: task
feature: "[[F01-app-foundation]]"
milestone: "[[M1-foundation]]"
status: todo
depends_on: []
estimate_tokens: 800000
estimate_hours: 1
actual_tokens: 130476
actual_hours: 0.00
tags: [task]
---
# T011 Scaffold Expo app

## Goal

A TypeScript Expo app that runs on the web target, with lint, unit tests and the Playwright runner wired up.

## Description

Follow the Scaffold section of `.relay/module.md`. Create the app in the repository root, scaffolding into a temporary folder and moving files if the command refuses a non-empty folder. Keep everything that already exists: `docs/`, `.relay/`, `.github/`, `.claude/`, `e2e/`, `README.md`, `.gitignore` and the release-please files. Name the package `twofold`.

- TypeScript strict, Expo Router. Remove the template demo content (explore screen, sample images, hello-wave component and similar).
- `app/_layout.tsx` and `app/index.tsx`: a Home placeholder showing a title taken from `src/ui/strings.ts`.
- Create the folders from the constitution: `src/features/`, `src/ui/`, `src/data/`. `src/ui/strings.ts` exports a `strings` object; all UI text comes from it.
- `jest-expo` and `@testing-library/react-native` with a `test` script that ignores `e2e/`; `@playwright/test` with Chromium and a `playwright.config.ts` (test directory `e2e`, base URL `http://localhost:8081`, no `webServer`, since `.relay/init.sh` starts the server).
- Do not edit `e2e/smoke.spec.ts`. Commit `package-lock.json`.

Out of scope: the database, ledger code, real screens, tab navigation.

## Definition of Done

- [ ] `.relay/init.sh` prints a URL, and the web app shows the Home placeholder at 390 x 844 with no console errors
- [ ] `npx playwright test e2e/smoke.spec.ts` launches Chromium against the dev server. The test is expected to fail until M2; note the failing step in Progress
- [ ] From a clean checkout, `npm ci` then `.relay/verify.sh` passes (the lock file is committed)
- [ ] A Jest component test renders the Home placeholder and finds its title from `strings`
- [ ] No template demo content is left in the repository

## Related decisions

- [[ADR-0001-expo-managed-typescript]]
- [[ADR-0002-expo-router]]
- [[ADR-0005-folder-structure]]
- [[ADR-0006-testing-strategy]]
- [[ADR-0012-english-only]]

## Progress

## QA
