#!/usr/bin/env bash
# Internal cron driver. Runs in the same container as Next.js.
# Sleeps until the next firing time in IST, then curls the local
# ingest endpoint and (later) the commentary endpoint.
#
# Schedule (configurable via env):
#   CRON_INGEST_HOUR   default 11   (IST)
#   CRON_INGEST_MIN    default 0
#   CRON_COMMENTARY_HOUR default 11
#   CRON_COMMENTARY_MIN  default 30
#
# A missed firing is recovered on next container start because the
# ingest endpoint is idempotent (ON CONFLICT upsert).

set -euo pipefail

INGEST_HOUR="${CRON_INGEST_HOUR:-11}"
INGEST_MIN="${CRON_INGEST_MIN:-0}"
COMM_HOUR="${CRON_COMMENTARY_HOUR:-11}"
COMM_MIN="${CRON_COMMENTARY_MIN:-30}"

BASE="${INTERNAL_BASE_URL:-http://127.0.0.1:${PORT:-3000}}"

log() { echo "[cron] $(date '+%F %T %Z') $*"; }

if [[ -z "${CRON_SECRET:-}" ]]; then
  log "CRON_SECRET unset — refusing to run; staying alive so the container doesn't restart-loop"
  while sleep 3600; do :; done
fi

call() {
  local path="$1" timeout="${2:-300}"
  log "→ ${path}"
  if curl -fsS -m "$timeout" \
      -H "Authorization: Bearer ${CRON_SECRET}" \
      "${BASE}${path}"; then
    echo
    log "✓ ${path}"
  else
    log "✗ ${path} failed (continuing)"
  fi
}

seconds_until() {
  # $1=HH $2=MM (IST). Compute seconds from now to that time today;
  # if past, schedule for tomorrow.
  local target_hms now_hms today_epoch target_epoch
  target_hms=$(printf "%02d:%02d:00" "$1" "$2")
  now_hms=$(date '+%H:%M:%S')
  today_epoch=$(date "+%s" -d "today $target_hms")
  target_epoch=$today_epoch
  if [[ "$now_hms" > "$target_hms" || "$now_hms" == "$target_hms" ]]; then
    target_epoch=$(date "+%s" -d "tomorrow $target_hms")
  fi
  echo $(( target_epoch - $(date +%s) ))
}

# Wait for the web server to be ready before any HTTP calls.
log "waiting for ${BASE}/api/cron/status …"
for i in $(seq 1 60); do
  if curl -fsS -m 3 "${BASE}/api/cron/status" >/dev/null 2>&1; then
    log "web is up after ${i}s"
    break
  fi
  sleep 1
done

log "schedule: ingest @ ${INGEST_HOUR}:${INGEST_MIN} IST · commentary @ ${COMM_HOUR}:${COMM_MIN} IST"

# Optional: run one ingest at startup so a freshly-launched container
# isn't empty until the next scheduled fire.
if [[ "${RUN_ON_BOOT:-true}" == "true" ]]; then
  log "boot run enabled — calling ingest now"
  call "/api/cron/ingest" 290
fi

while true; do
  ingest_wait=$(seconds_until "$INGEST_HOUR" "$INGEST_MIN")
  log "next ingest in ${ingest_wait}s"
  sleep "$ingest_wait"
  call "/api/cron/ingest" 290

  comm_wait=$(seconds_until "$COMM_HOUR" "$COMM_MIN")
  log "next commentary in ${comm_wait}s"
  sleep "$comm_wait"
  call "/api/cron/commentary" 60
done
