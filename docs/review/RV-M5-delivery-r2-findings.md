---
type: review-findings
milestone: "[[M5-delivery]]"
round: 2
findings: 3
tags: [review]
---
# Review M5-delivery, round 2

## F1 Production deploy ships unproven isolation headers with no check
- Source: code-review
- Where: .github/workflows/release.yml:41
- Severity: important
- Finding: the deploy job runs `eas deploy --prod` on the first release, although ADR-0017 says it is not known whether EAS Hosting applies the `expo-router` plugin headers with `web.output: single`, or whether the worker and wasm load under `require-corp`. No step checks the result, so the job reports success either way. The round 1 F1 fix (require-corp on the dev server) closed the local gap but cannot answer these questions, since Metro adds headers to every response.
- Why it matters: if the headers are missing or the static assets are blocked, production serves a page where SQLite fails and no account survives a reload, and the pipeline is green.
- Suggested change: after the deploy step, fetch the deployed URL and fail the job if `Cross-Origin-Opener-Policy: same-origin` or `Cross-Origin-Embedder-Policy: require-corp` is missing from the HTML response (for example `curl -sI "$URL" | grep -i ...`). Also check the wasm asset response for a `Cross-Origin-Resource-Policy` or the COEP header. This does not replace the author's browser check from ADR-0017, but it catches the "headers not applied" case. Alternatively, deploy to a preview first and promote to `--prod` only after the check. I could not run the deploy here, so I cannot say which case applies.

## F2 Deploy job has no concurrency group
- Source: code-review
- Where: .github/workflows/release.yml:28
- Severity: nit
- Finding: two release merges in quick succession start two deploy jobs that can finish out of order.
- Why it matters: an older build can overwrite the newer production deployment.
- Suggested change: add to the `deploy` job `concurrency: { group: deploy-prod, cancel-in-progress: false }`.

## F3 eas.json carries a native build profile for a web-only deploy
- Source: code-review
- Where: eas.json:5
- Severity: nit
- Finding: `build.preview` (`channel`, `distribution: internal`) configures native builds and OTA channels. The project has no `expo-updates`, no runtimeVersion and no native build, and `.relay/deploy.sh` says it does not use OTA updates. I did not confirm whether `eas deploy` reads `eas.json` at all; if it only needs the project id from `app.json`, the file is unused.
- Why it matters: it implies a native preview flow that does not exist, and `eas build --profile preview` or `eas update` would fail in confusing ways.
- Suggested change: remove the `build` block, or the whole file if `eas deploy` works without it (check with a local `npx eas-cli deploy` dry run).
