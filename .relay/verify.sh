#!/usr/bin/env bash
# Mechanical gate run by relay after every session. Agents may run it, not edit it.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ ! -f package.json ]; then
  echo "no package.json yet: nothing to verify"
  exit 0
fi

echo "== typecheck";  npx tsc --noEmit
echo "== lint";       npx expo lint
echo "== unit tests"; npx jest --ci --passWithNoTests
echo "== web export"; npx expo export --platform web
echo "verify: ok"
