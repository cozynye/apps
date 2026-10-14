#!/usr/bin/env bash
# Captures all store screenshots (2 apps × iPhone 6.9" + iPad 13" × en/vi/th) and composes them.
# Restarts each app's Metro per locale with EXPO_PUBLIC_FORCE_LOCALE; boots one simulator at a time.
# Usage: bash scripts/store-shots-all.sh [locales...]   (default: en vi th)
#   IPHONE / IPAD env: simulator UDIDs with both dev builds installed (defaults below).
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
IPHONE=${IPHONE:-FB8DC577-5B85-40D4-9EA7-CED269D56965}   # iPhone 17 Pro Max, iOS 26.5
IPAD=${IPAD:-3C3FCE0E-483C-4833-93DE-278FD428027E}       # iPad Pro 13-inch (M5), iOS 26.5
NUNI_PORT=${NUNI_PORT:-8081}
FOURPOP_PORT=${FOURPOP_PORT:-8083}
CDN=${EXPO_PUBLIC_CDN_BASE_URL:-http://localhost:8090}
LOG=${LOG:-/tmp/store-shots}
mkdir -p "$LOG"

restart_metro() { # app port locale extra-env...
  local app=$1 port=$2 locale=$3; shift 3
  local pid; pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t || true)
  [ -n "$pid" ] && kill "$pid" && sleep 2
  (cd "$ROOT/apps/$app" && env EXPO_PUBLIC_FORCE_LOCALE="$locale" "$@" nohup pnpm start --port "$port" > "$LOG/metro-$app-$locale.log" 2>&1 < /dev/null &)
  for _ in $(seq 1 30); do curl -s -o /dev/null "http://localhost:$port/status" && return 0; sleep 2; done
  echo "Metro $app:$port did not start" >&2; return 1
}

use_sim() { # boot one, shut the other
  local on=$1 off=$2
  xcrun simctl shutdown "$off" >/dev/null 2>&1 || true
  xcrun simctl boot "$on" >/dev/null 2>&1 || true
  sleep 6
}

STATUS=0
for locale in "${@:-en vi th}"; do
  echo "=== locale $locale"
  restart_metro nuni "$NUNI_PORT" "$locale" || STATUS=1
  restart_metro fourpop "$FOURPOP_PORT" "$locale" EXPO_PUBLIC_MOCK_CAMERA=1 EXPO_PUBLIC_CDN_BASE_URL="$CDN" || STATUS=1
  use_sim "$IPHONE" "$IPAD"
  bash "$ROOT/scripts/store-shots.sh" fourpop iphone "$locale" "$IPHONE" "$FOURPOP_PORT" || STATUS=1
  bash "$ROOT/scripts/store-shots.sh" nuni iphone "$locale" "$IPHONE" "$NUNI_PORT" || STATUS=1
  use_sim "$IPAD" "$IPHONE"
  bash "$ROOT/scripts/store-shots.sh" fourpop ipad "$locale" "$IPAD" "$FOURPOP_PORT" || STATUS=1
  bash "$ROOT/scripts/store-shots.sh" nuni ipad "$locale" "$IPAD" "$NUNI_PORT" || STATUS=1
done
(cd "$ROOT" && pnpm tsx scripts/store-screenshots.ts) || STATUS=1
exit $STATUS
