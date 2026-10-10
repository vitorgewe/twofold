#!/usr/bin/env bash
# Publishes a PREVIEW: web export to EAS Hosting and an EAS Update on the
# preview channel. Never submits to a store. Run by you, or by `relay run --yolo`.
# Contract with relay: the last line of stdout is the deployed URL.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

npm install --no-audit --no-fund >&2
npx expo export --platform web >&2

mkdir -p .relay/runs
npx eas-cli deploy --non-interactive --json > .relay/runs/deploy.json
npx eas-cli update --channel preview --message "relay $(git rev-parse --short HEAD)" --non-interactive >&2

url="$(jq -r '.url // .deployment.url // empty' .relay/runs/deploy.json)"
[ -n "$url" ] || url="$(grep -Eo 'https://[^" ]+' .relay/runs/deploy.json | head -1)"
echo "$url"
