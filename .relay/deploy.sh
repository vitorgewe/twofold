#!/usr/bin/env bash
# Publishes a PREVIEW of the web export to EAS Hosting. Never submits to a store. Run by you, or by `relay run --yolo`.
# Contract with relay: the last line of stdout is the deployed URL.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

npm install --no-audit --no-fund >&2
npx expo export --platform web >&2

mkdir -p .relay/runs
npx eas-cli deploy --non-interactive --json > .relay/runs/deploy.json
# No `eas update` here: it publishes over-the-air updates to native apps and needs expo-updates and a
# runtimeVersion. This project is a web app served by EAS Hosting, so the deploy above is the whole publish.

url="$(jq -r '.url // .deployment.url // empty' .relay/runs/deploy.json)"
[ -n "$url" ] || url="$(grep -Eo 'https://[^" ]+' .relay/runs/deploy.json | head -1)"
echo "$url"
