#!/usr/bin/env bash
# Installs dependencies and manages the Expo web dev server.
#
#   .relay/init.sh             start the server if nothing answers, print the URL
#   .relay/init.sh --restart   stop the server this script started, then start a fresh one
#   .relay/init.sh --stop      stop the server this script started
#   .relay/init.sh --restart --clear   same, and start with an empty Metro cache
#
# --clear matters after changing the app version, app.json or the Babel config:
# Metro inlines the app config into its transform cache without keying on it, so a
# plain restart can keep serving the old values.
#
# The server's process group leader is recorded in .relay/runs/dev-server.pid,
# and only that server is ever stopped. relay stops it when a run ends.
# Safe to run more than once.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

PORT="${PORT:-8081}"
URL="http://localhost:$PORT"
PIDFILE=.relay/runs/dev-server.pid
mkdir -p .relay/runs

serving() { curl -sf -o /dev/null "$URL"; }

stop_server() {
  [ -f "$PIDFILE" ] || return 0
  local pid
  pid="$(cat "$PIDFILE")"
  # Signal the group only if the pid still looks like our dev server: pids get reused.
  if ps -o command= -p "$pid" 2> /dev/null | grep -q expo; then
    kill -TERM -- "-$pid" 2> /dev/null || true
    for _ in $(seq 1 20); do kill -0 "$pid" 2> /dev/null || break; sleep 0.5; done
    kill -KILL -- "-$pid" 2> /dev/null || true
  fi
  rm -f "$PIDFILE"
}

start_server() {
  if [ ! -f package.json ]; then
    echo "no package.json yet: the scaffold task has not run"
    exit 0
  fi
  if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
    npm install --no-audit --no-fund
  fi
  # The server needs none of Claude Code's own variables (session tokens, API keys).
  local scrub=() v
  for v in $(env | sed -n -E 's/^((CLAUDE_CODE_|CLAUDECODE|ANTHROPIC_)[A-Za-z0-9_]*)=.*/\1/p'); do scrub+=(-u "$v"); done
  # Job control gives the server its own process group, so stopping it also stops its children.
  set -m
  CI=1 nohup env ${scrub[@]+"${scrub[@]}"} npx expo start --web --port "$PORT" ${CLEAR:+--clear} > .relay/runs/dev-server.log 2>&1 &
  echo $! > "$PIDFILE"
  set +m
  for _ in $(seq 1 90); do
    if serving; then echo "$URL"; exit 0; fi
    sleep 2
  done
  echo "dev server did not answer on $URL after 180s; see .relay/runs/dev-server.log" >&2
  exit 1
}

MODE=""; CLEAR=""
for arg in "$@"; do
  case "$arg" in
    --stop|--restart) MODE="$arg" ;;
    --clear) CLEAR=1 ;;
    *) echo "usage: init.sh [--restart|--stop] [--clear]" >&2; exit 2 ;;
  esac
done
[ -n "$CLEAR" ] && [ "$MODE" != --restart ] && { echo "--clear only applies together with --restart" >&2; exit 2; }
case "$MODE" in
  --stop) stop_server; exit 0 ;;
  --restart)
    if [ ! -f "$PIDFILE" ] && serving; then
      echo "$URL is served by a process this script did not start, so it will not stop it" >&2
      exit 1
    fi
    stop_server ;;
esac

if serving; then
  if [ -f "$PIDFILE" ]; then echo "$URL (already running)"; else echo "$URL (already running, not started by relay)"; fi
  exit 0
fi
stop_server   # a stale pid file from a crashed server
start_server
