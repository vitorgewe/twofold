# Module: mobile-expo

Conventions for mobile apps built with Expo and React Native. Skills read this file as `.relay/module.md` in the project.

## Why this stack

One TypeScript codebase runs on iOS, Android and the web. The web target is what makes unattended work possible: the agent can open the app in a browser and use it like a person, without a simulator.

## Scaffold

The first task of the first milestone is always the scaffold. It must:

1. Create the app in the repository root (TypeScript, Expo Router). The folder is not empty, so scaffold inside the repository, in the ignored folder `.relay/scaffold`, with relative paths: `npx --yes create-expo-app@latest .relay/scaffold --template default --no-install`. Then `cp -R` the files the app needs up to the root. Unattended sessions are refused when they `cd` outside the repository, so do not scaffold in a system temporary folder. Do not rely on `rm`: it is not on the allow list, because a rule matches command text and `rm` limited to one path would still accept more paths. Use `git rm` for tracked files you must remove, and leave `.relay/scaffold` where it is (it is gitignored).
2. Confirm the web target runs: `npx expo start --web --port 8081`.
3. Add `@playwright/test` as a dev dependency and run `npx playwright install chromium`.
4. Add `jest-expo` and `@testing-library/react-native`, with a `test` script, and make Jest ignore `e2e/`.
5. Copy `.relay/templates/smoke.spec.ts` to `e2e/smoke.spec.ts` only if the plan did not already create it.
6. Leave `.relay/verify.sh` passing.

## Commands

| Purpose | Command |
|---|---|
| Install and start the web dev server | `.relay/init.sh` (prints the URL, safe to run twice) |
| Restart the dev server (after changing `metro.config.js`, `app.json`, env files) | `.relay/init.sh --restart` |
| Restart with an empty Metro cache (after changing the app version, `app.json` or the Babel config) | `.relay/init.sh --restart --clear` |
| Fresh web export without the cache | `npx expo export --platform web --clear` |
| Type check, lint, unit tests, web export | `.relay/verify.sh` |
| Unit tests only | `npx jest` |
| Smoke test against the dev server | `npx playwright test e2e/smoke.spec.ts` |

## Dependencies

Change dependencies with `npx --yes npm@10 install <package>` rather than plain `npm install`: CI runs `npm ci` with its own npm, and a lockfile written by a newer local npm can pass `.relay/verify.sh` (node_modules is already installed) and still fail in CI. When `package.json` or `package-lock.json` differ from `main`, `.relay/verify.sh` also runs `npx --yes npm@10 ci --dry-run` and fails with the command that regenerates the lock. Change the major with `CI_NPM` in `.relay/verify.sh`, or set it empty to skip the check.

## Unattended sessions

- Create and change files with the Write and Edit tools. Shell redirection and heredocs (`cat > file <<'EOF'`) are refused by the permission rules.
- Manage the dev server only through `.relay/init.sh`. It records the server it starts and `--restart` replaces exactly that one; relay stops it when the run ends. Do not kill processes by name, do not `sleep` to wait for it, and do not move to another port: a server on 8081 that is in the way is replaced with `--restart`. An environment prefix such as `PORT=8082 .relay/init.sh` does not match the permission rule and is refused.
- If a value you changed (the app version, something read from `app.json`) still shows the old value after `--restart`, suspect the Metro cache before suspecting your change: Metro inlines the app config into its transform cache without keying on it. Use `--restart --clear`, or `npx expo export --platform web --clear`, and compare.
- Definition of Done items that start with `Author:` are for the human. Never tick them or try to satisfy them; prepare what the author needs and say how to do it in Progress.
- If `.relay/init.sh --restart` says the server was not started by relay, stop and record it in the ticket's Progress as `blocked`: a human has to stop it.

## Testing as a user

Use the Playwright MCP tools against `http://localhost:8081`. Set a phone-sized viewport (390 x 844) before judging layout. Navigate, tap, type, and read what the screen shows. A feature counts as working only after it was seen working this way.

Known blind spots of the web target: push notifications, camera, biometrics, native gestures, keyboard avoidance, safe areas. A task that depends on one of these says so in its ticket and is verified by unit tests plus a note for manual device testing.

## Planning rules for this module

- Local-first by default: data lives on the device unless the spec says otherwise.
- Every screen in the spec belongs to exactly one feature.
- Anything needing a paid account, an API key or a store listing is a task with `status: blocked` from the start, with the reason in its Description, so the run never waits on it silently.

## Deploy

`.relay/deploy.sh` publishes a preview: the web export to EAS Hosting and an EAS Update on the `preview` channel. It never submits to the App Store or Google Play. Store submission is a manual step for the human.
