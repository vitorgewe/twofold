#!/usr/bin/env bash
# Mechanical gate run by relay after every session. Agents may run it, not edit it.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ ! -f package.json ]; then
  echo "no package.json yet: nothing to verify"
  exit 0
fi

# CI runs `npm ci` with its own npm. A lockfile written by a newer local npm can pass
# here (node_modules is already installed) and still fail there, so when the
# dependencies changed, check that the lock installs under the CI's npm major.
# Set CI_NPM to another major, or to an empty value to skip this.
CI_NPM="${CI_NPM-npm@10}"
if [ -n "$CI_NPM" ] && [ -n "$(git diff --name-only "${RELAY_MAIN_BRANCH:-main}" -- package.json package-lock.json 2> /dev/null)" ]; then
  echo "== package-lock.json installs with $CI_NPM (the npm CI uses)"
  if ! npx --yes "$CI_NPM" ci --dry-run --no-audit --no-fund; then
    echo "package-lock.json does not install with $CI_NPM, so CI would fail at npm ci." >&2
    echo "Regenerate it with: npx --yes $CI_NPM install --package-lock-only" >&2
    exit 1
  fi
fi

echo "== typecheck";  npx tsc --noEmit
echo "== lint";       npx expo lint
echo "== unit tests"; npx jest --ci --passWithNoTests
echo "== web export"; npx expo export --platform web
echo "verify: ok"
