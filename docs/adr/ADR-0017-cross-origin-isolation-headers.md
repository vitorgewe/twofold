---
id: ADR-0017
type: adr
status: accepted
date: 2026-10-11
supersedes: ""
superseded_by: ""
tags: [adr, deploy]
---
# ADR-0017 Cross-origin isolation headers on the web preview

## Context

SQLite on web (wa-sqlite through expo-sqlite) needs `SharedArrayBuffer`, which browsers expose only when the page is cross-origin isolated: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy` set on the document. `metro.config.js` sets them on the dev server only, so the static export deployed by `.relay/deploy.sh` ([[ADR-0013-web-preview-on-eas]]) has no such headers. The project uses `web.output: single` ([[ADR-0015-database-interface-and-test-adapter]]).

## Options considered

1. `headers` option of the `expo-router` plugin in `app.json`, documented at https://docs.expo.dev/router/web/server-headers/. Config only, no new code. Documented limits: applies to HTML and API route responses, not to static assets or redirects. Not documented: whether EAS Hosting applies it, and whether it applies with `single`.
2. `coi-serviceworker`, a service worker that re-serves the page with the headers on the client. Works on any static host. Costs: a first load without isolation (it reloads once), extra code, and a service worker to maintain.
3. A static host that supports a `_headers` file. Reliable. Costs: leaves EAS Hosting, which ADR-0013 chose.

## Decision

Provisional: option 1. The `expo-router` plugin entry in `app.json` carries `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. `require-corp` is used instead of `credentialless` because `credentialless` does not work in Safari. `metro.config.js` sends the same `require-corp` on the dev server, so local checks cover it.

This is not yet known to work on EAS Hosting. Unknown: whether EAS Hosting applies the plugin headers, whether they apply with `single`, and whether the SQLite worker and wasm load under `require-corp`. The test that settles it is the author's check on the real preview: `crossOriginIsolated` is `true` in the browser console and an account created there survives a reload. If it fails, supersede this ADR with option 2, then option 3.

## Consequences

Easier: no new code or dependency. Harder: until the check passes, the preview may open but fail to store data. Under `require-corp`, any cross-origin resource must send `Cross-Origin-Resource-Policy`, so a future third-party asset or font could break the page. We would notice the decision was wrong if `crossOriginIsolated` is `false` on the preview.

## Update 2026-10-11: first deploy

The first deployment served the app without the two headers (`curl -I` on the deployment URL): the `single` export has no `.routes.json` for the hosting to read. [[ADR-0018-static-web-output-in-production]] makes the production export static, which writes the headers into that manifest. Whether EAS Hosting applies them is still to be confirmed on the next deployment.
