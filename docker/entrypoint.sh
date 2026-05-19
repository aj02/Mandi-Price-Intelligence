#!/usr/bin/env bash
# Run Next.js + the internal cron driver under tini (PID 1).
# tini reaps zombies; we forward signals to both children and exit on either.
set -euo pipefail

export TZ="${TZ:-Asia/Kolkata}"

log() { echo "[entrypoint] $*"; }

log "starting Next.js (standalone) on :${PORT:-3000}"
node server.js &
WEB_PID=$!

log "starting internal cron driver (TZ=$TZ)"
/usr/local/bin/cron.sh &
CRON_PID=$!

shutdown() {
  log "received signal — terminating ($WEB_PID, $CRON_PID)"
  kill -TERM "$WEB_PID" "$CRON_PID" 2>/dev/null || true
  wait || true
  exit 0
}
trap shutdown SIGTERM SIGINT

# Exit as soon as either process dies — docker will restart us under the
# `restart` policy in compose.
wait -n "$WEB_PID" "$CRON_PID"
EXITED=$?
log "child exited with $EXITED — propagating"
kill -TERM "$WEB_PID" "$CRON_PID" 2>/dev/null || true
exit "$EXITED"
