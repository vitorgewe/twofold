#!/usr/bin/env bash
# Installs dependencies and starts the Expo web dev server if it is not running.
# Prints the URL. Safe to run more than once.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

PORT="${PORT:-8081}"
URL="http://localhost:$PORT"

if [ ! -f package.json ]; then
  echo "no package.json yet: the scaffold task has not run"
  exit 0
fi

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm install --no-audit --no-fund
fi

if curl -sf -o /dev/null "$URL"; then
  echo "$URL (already running)"
  exit 0
fi

mkdir -p .relay/runs
CI=1 nohup npx expo start --web --port "$PORT" > .relay/runs/dev-server.log 2>&1 &

for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "$URL"; then echo "$URL"; exit 0; fi
  sleep 2
done
echo "dev server did not answer on $URL after 180s; see .relay/runs/dev-server.log" >&2
exit 1
