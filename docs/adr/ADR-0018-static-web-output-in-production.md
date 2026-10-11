---
id: ADR-0018
type: adr
status: accepted
date: 2026-10-11
supersedes: ""
superseded_by: ""
tags: [adr, deploy, web]
---
# ADR-0018 Static web output for the production export

## Context

The first real deploy to EAS Hosting (`npx eas-cli deploy`, 2026-10-11) served the app with HTTP 200 and no `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` header (checked with `curl -I` on the deployment URL). Without them `crossOriginIsolated` is false and SQLite on web may not run ([[ADR-0017-cross-origin-isolation-headers]]).

Cause: `app.json` has `web.output: "single"` ([[ADR-0015-database-interface-and-test-adapter]]), and the `single` export contains only `index.html`, `metadata.json` and the bundles. The headers of the `expo-router` plugin are written to `dist/_expo/.routes.json` only by the `static` export, and that manifest is what the hosting applies to HTML responses. The Expo Router documentation covers `static` and `server`, not `single`.

## Options considered

1. `web.output: "static"` everywhere: the export emits the headers and runs. Rejected: the dev server answered 500 with it (static server rendering of expo-sqlite's web worker, ADR-0015), and the relay, the QA and `init.sh` use the dev server.
2. `app.config.js` chooses the output by `NODE_ENV`: `static` for `expo export` (production), `single` for `expo start`. Keeps the dev flow that is tested and gives the export the headers.
3. A client-side service worker that injects the headers (`coi-serviceworker`): works on any static host. Rejected for now: it needs a reload on the first visit and adds a script that must keep working in every browser.
4. A host that supports a `_headers` file: leaves EAS Hosting and ADR-0013. Not needed if option 2 works.

## Decision

Option 2. `app.json` stays the single source (release-please edits its `version`); `app.config.js` only sets `web.output`. The headers stay on the `expo-router` plugin in `app.json`.

Evidence before choosing, on a clean checkout: `expo export` with the new config writes 11 static routes and `dist/_expo/.routes.json` with both headers; the dev server answers 200 on `/`, `/accounts` and `/settings`; `e2e/smoke.spec.ts` passes against the dev server and against the static export served with those headers, so the SQLite worker and wasm load under `require-corp` and the data survives a reload.

## Consequences

Easier: the isolation headers can reach the hosting. `.relay/verify.sh` and the CI run `expo export`, so a regression in static rendering is caught before a deploy. A test pins the config per environment.

Harder: development renders as a single-page app while production is pre-rendered, so a bug that only shows after pre-rendering appears first in the export or on the deployment.

Still unknown, and settled by the author after the next deploy: whether EAS Hosting applies the manifest headers. The decision is wrong if `curl -I` on the new deployment URL lacks the two headers or `crossOriginIsolated` is false in the browser; the fallbacks are options 3 and 4.
