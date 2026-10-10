# Module: mobile-expo

Conventions for mobile apps built with Expo and React Native. Skills read this file as `.relay/module.md` in the project.

## Why this stack

One TypeScript codebase runs on iOS, Android and the web. The web target is what makes unattended work possible: the agent can open the app in a browser and use it like a person, without a simulator.

## Scaffold

The first task of the first milestone is always the scaffold. It must:

1. Create the app in the repository root with `npx create-expo-app@latest . --template default` (TypeScript, Expo Router). The folder is not empty, so scaffold into a temporary folder and move the files if the command refuses.
2. Confirm the web target runs: `npx expo start --web --port 8081`.
3. Add `@playwright/test` as a dev dependency and run `npx playwright install chromium`.
4. Add `jest-expo` and `@testing-library/react-native`, with a `test` script, and make Jest ignore `e2e/`.
5. Copy `.relay/templates/smoke.spec.ts` to `e2e/smoke.spec.ts` only if the plan did not already create it.
6. Leave `.relay/verify.sh` passing.

## Commands

| Purpose | Command |
|---|---|
| Install and start the web dev server | `.relay/init.sh` (prints the URL, safe to run twice) |
| Type check, lint, unit tests, web export | `.relay/verify.sh` |
| Unit tests only | `npx jest` |
| Smoke test against the dev server | `npx playwright test e2e/smoke.spec.ts` |

## Testing as a user

Use the Playwright MCP tools against `http://localhost:8081`. Set a phone-sized viewport (390 x 844) before judging layout. Navigate, tap, type, and read what the screen shows. A feature counts as working only after it was seen working this way.

Known blind spots of the web target: push notifications, camera, biometrics, native gestures, keyboard avoidance, safe areas. A task that depends on one of these says so in its ticket and is verified by unit tests plus a note for manual device testing.

## Planning rules for this module

- Local-first by default: data lives on the device unless the spec says otherwise.
- Every screen in the spec belongs to exactly one feature.
- Anything needing a paid account, an API key or a store listing is a task with `status: blocked` from the start, with the reason in its Description, so the run never waits on it silently.

## Deploy

`.relay/deploy.sh` publishes a preview: the web export to EAS Hosting and an EAS Update on the `preview` channel. It never submits to the App Store or Google Play. Store submission is a manual step for the human.
