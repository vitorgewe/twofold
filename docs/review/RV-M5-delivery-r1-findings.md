---
type: review-findings
milestone: "[[M5-delivery]]"
round: 1
findings: 3
tags: [review]
---
# Review M5-delivery, round 1

## F1 Local isolation check uses a different COEP value than the deploy
- Source: code-review
- Where: metro.config.js:10
- Severity: important
- Finding: The dev server sends `Cross-Origin-Embedder-Policy: credentialless`, while `app.json` (and ADR-0017) deploy `require-corp`. QA and the tickets record "`crossOriginIsolated` is true locally" as evidence, but that run never exercises `require-corp`.
- Why it matters: under `require-corp` any cross-origin resource without a `Cross-Origin-Resource-Policy` header fails to load. That failure is invisible on the dev server, so a page that breaks on the preview can still pass every local check. I could not run the app here, so I cannot say whether the app loads any cross-origin resource today.
- Suggested change: set `require-corp` in `metro.config.js` so local and deployed behaviour match, restart with `.relay/init.sh --restart --clear`, and confirm the smoke test still passes. If it breaks, that is the problem the preview would have had. If you prefer to keep `credentialless` locally, say in ADR-0017 that the local check does not cover `require-corp`.

## F2 init.sh accepts contradictory mode flags
- Source: code-review
- Where: .relay/init.sh:63
- Severity: nit
- Finding: the new argument loop overwrites `MODE` on each flag, so `--stop --restart` restarts and `--restart --stop` stops. The previous version rejected anything but a single argument with exit 2.
- Why it matters: a mistyped or scripted pair of modes silently does one of them instead of failing with the usage message.
- Suggested change: reject a second mode flag in the loop:
  `--stop|--restart) [ -z "$MODE" ] || { echo "usage: init.sh [--restart|--stop] [--clear]" >&2; exit 2; }; MODE="$arg" ;;`

## F3 deploy.sh header comment is one long line
- Source: code-review
- Where: .relay/deploy.sh:2
- Severity: nit
- Finding: the two-line header comment was joined into a single line of about 130 characters, and the removal of `eas update` is explained by a second comment further down.
- Why it matters: it breaks the file's line-length habit and keeps a comment about code that no longer exists.
- Suggested change: restore two lines, e.g. `# Publishes a PREVIEW of the web export to EAS Hosting. Never submits to a store.` / `# Run by you, or by \`relay run --yolo\`.`, and drop the "No \`eas update\` here" comment (T101 Progress already records why).
