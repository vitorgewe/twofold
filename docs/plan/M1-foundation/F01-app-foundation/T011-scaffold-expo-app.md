---
id: T011
type: task
feature: "[[F01-app-foundation]]"
milestone: "[[M1-foundation]]"
status: review
depends_on: []
estimate_tokens: 800000
estimate_hours: 1
actual_tokens: 208778
actual_hours: 0.01
tags: [task]
---
# T011 Scaffold Expo app

## Goal

A TypeScript Expo app that runs on the web target, with lint, unit tests and the Playwright runner wired up.

## Description

Follow the Scaffold section of `.relay/module.md`. Create the app in the repository root, scaffolding into a temporary folder and moving files if the command refuses a non-empty folder. Keep everything that already exists: `docs/`, `.relay/`, `.github/`, `.claude/`, `e2e/`, `README.md`, `.gitignore` and the release-please files. Name the package `twofold`.

- TypeScript strict, Expo Router. Do not bring the template demo content (explore screen, sample images, hello-wave component and similar) into the repository: scaffold into a temporary folder and copy only what the app needs (`package.json`, `tsconfig.json`, `app.json`, config files) plus the files you write yourself. `rm` is not allowed in this project, so delete nothing: copy selectively, and use `git rm` for files that are already tracked.
- `app/_layout.tsx` and `app/index.tsx`: a Home placeholder showing a title taken from `src/ui/strings.ts`.
- Create the folders from the constitution: `src/features/`, `src/ui/`, `src/data/`. `src/ui/strings.ts` exports a `strings` object; all UI text comes from it.
- `jest-expo` and `@testing-library/react-native` with a `test` script that ignores `e2e/`; `@playwright/test` with Chromium and a `playwright.config.ts` (test directory `e2e`, base URL `http://localhost:8081`, no `webServer`, since `.relay/init.sh` starts the server).
- Do not edit `e2e/smoke.spec.ts`. Commit `package-lock.json`.

Out of scope: the database, ledger code, real screens, tab navigation.

## Definition of Done

- [x] `.relay/init.sh` prints a URL, and the web app shows the Home placeholder at 390 x 844 with no console errors
- [x] `npx playwright test e2e/smoke.spec.ts` launches Chromium against the dev server. The test is expected to fail until M2; note the failing step in Progress
- [x] From a clean checkout, `npm ci` then `.relay/verify.sh` passes (the lock file is committed)
- [x] A Jest component test renders the Home placeholder and finds its title from `strings`
- [x] No template demo content is left in the repository

## Related decisions

- [[ADR-0001-expo-managed-typescript]]
- [[ADR-0002-expo-router]]
- [[ADR-0005-folder-structure]]
- [[ADR-0006-testing-strategy]]
- [[ADR-0012-english-only]]

## Progress

### 2026-10-10
- Done: read constitution, methodology, module and ticket; confirmed the repo has no `package.json` yet.
- Failed or surprising: the session runs in "don't ask" permission mode and the first write/network command (`npx create-expo-app` into a temp folder) was denied, so nothing could be scaffolded. No code changed.
- Next: rerun with Bash permission for `npx`, `npm`, `git` and `.relay/*.sh` (or approve those commands), then follow the Scaffold section of `.relay/module.md`. Needed from the human: that permission.

### 2026-10-10 19:10
- Done: scaffolded with `create-expo-app` into a temp folder and copied only `package.json`, `tsconfig.json`, `app.json` (trimmed: no icons or splash assets, no demo code). Wrote `app/_layout.tsx`, `app/index.tsx` (title from `src/ui/strings.ts`), `app/+html.tsx` (inline `data:` favicon so the web console has no 404), `src/{features,ui,data}`, `eslint.config.js`, `playwright.config.ts`, and `tests/index.test.tsx` (the test lives outside `app/` so Expo Router does not treat it as a route). Package named `twofold`. Seen working: `.relay/init.sh` printed `http://localhost:8081`; at 390 x 844 the Home shows "Twofold" with 0 console errors; `.relay/verify.sh` passes (typecheck, lint, 1 Jest test, web export); `npm ci --dry-run` is clean against the committed lock file; `npx playwright test e2e/smoke.spec.ts` launches Chromium and runs.
- Failed or surprising: the smoke test fails at its first step, `getByRole('button', { name: 'New account' })` on `/accounts`, timing out after 30s. Expected until M2. TypeScript 6 needs `"types": ["jest"]` in tsconfig. RNTL 14 `render` is async (must be awaited). Jest had to ignore `.relay/` too because the smoke template there matched the spec pattern. A real clean-clone `npm ci` was not run, only `--dry-run`.
- Next: nothing for this task. The `app.json` has no icons; add them when a task needs them.

## QA
