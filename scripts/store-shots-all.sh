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
# Store shots show only bundled content: no CDN (dev sample packs would appear). STORE_CDN=url to include one.
CDN=${STORE_CDN:-}
LOG=${LOG:-/tmp/store-shots}
DEVICES=${DEVICES:-iphone ipad}   # e.g. DEVICES=ipad to recapture only iPad
mkdir -p "$LOG"

restart_metro() { # app port locale extra-env...
  local app=$1 port=$2 locale=$3; shift 3
  local pid; pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t || true)
  [ -n "$pid" ] && kill "$pid" && sleep 2
  (cd "$ROOT/apps/$app" && env EXPO_PUBLIC_FORCE_LOCALE="$locale" "$@" nohup pnpm start --port "$port" > "$LOG/metro-$app-$locale.log" 2>&1 < /dev/null &)
  for _ in $(seq 1 30); do curl -s -o /dev/null "http://localhost:$port/status" && break; sleep 2; done
  curl -s -o /dev/null "http://localhost:$port/status" || { echo "Metro $app:$port did not start" >&2; return 1; }
  # Warm the bundle so the first launch after a locale switch is not spent compiling 2,600 modules.
  curl -s -o /dev/null "http://localhost:$port/index.bundle?platform=ios&dev=true&hot=false&lazy=false" || true
}

use_sim() { # exactly one simulator booted (the Maestro driver times out with two); system locale = shot locale
  local on=$1 locale=$2
  xcrun simctl shutdown all >/dev/null 2>&1 || true
  # iPad's status bar shows the date in the system language; match it to the screenshot locale.
  local prefs="$HOME/Library/Developer/CoreSimulator/Devices/$on/data/Library/Preferences/.GlobalPreferences.plist"
  local region; case "$locale" in vi) region=vi_VN ;; th) region=th_TH ;; *) region=en_US ;; esac
  if [ -f "$prefs" ]; then
    plutil -replace AppleLanguages -json "[\"$locale\"]" "$prefs" >/dev/null 2>&1 || true
    plutil -replace AppleLocale -string "$region" "$prefs" >/dev/null 2>&1 || true
  fi
  xcrun simctl boot "$on" >/dev/null 2>&1 || true
  sleep 8
  # Apple-style clean status bar for store shots.
  xcrun simctl status_bar "$on" override --time 9:41 --batteryState discharging --batteryLevel 100 --wifiBars 3 --cellularBars 4 --operatorName '' >/dev/null 2>&1 || true
}

capture() { # app device locale udid port — skipped when the 6 raw files already exist
  local app=$1 device=$2 locale=$3 udid=$4 port=$5
  local dir="$ROOT/docs/release/screenshots/raw/$app/$device/$locale"
  if [ "$(ls "$dir"/[1-6].png 2>/dev/null | wc -l | tr -d ' ')" = "6" ]; then echo "skip $app/$device/$locale (done)"; return 0; fi
  # No foreground app when the dev client opens, or iOS shows a "◀ Fourpop" back link in the status bar.
  xcrun simctl terminate "$udid" app.nuni.mood >/dev/null 2>&1 || true
  xcrun simctl terminate "$udid" app.fourpop.booth >/dev/null 2>&1 || true
  # One retry: the dev-client intro and Test Store network calls are occasionally flaky.
  bash "$ROOT/scripts/store-shots.sh" "$app" "$device" "$locale" "$udid" "$port" && return 0
  echo "retry $app/$device/$locale"
  bash "$ROOT/scripts/store-shots.sh" "$app" "$device" "$locale" "$udid" "$port"
}

STATUS=0
for locale in "${@:-en vi th}"; do
  echo "=== locale $locale"
  restart_metro nuni "$NUNI_PORT" "$locale" || STATUS=1
  restart_metro fourpop "$FOURPOP_PORT" "$locale" EXPO_PUBLIC_MOCK_CAMERA=1 ${CDN:+EXPO_PUBLIC_CDN_BASE_URL="$CDN"} || STATUS=1
  case " $DEVICES " in *" iphone "*)
    use_sim "$IPHONE" "$locale"
    capture fourpop iphone "$locale" "$IPHONE" "$FOURPOP_PORT" || STATUS=1
    capture nuni iphone "$locale" "$IPHONE" "$NUNI_PORT" || STATUS=1 ;;
  esac
  case " $DEVICES " in *" ipad "*)
    use_sim "$IPAD" "$locale"
    capture fourpop ipad "$locale" "$IPAD" "$FOURPOP_PORT" || STATUS=1
    capture nuni ipad "$locale" "$IPAD" "$NUNI_PORT" || STATUS=1 ;;
  esac
done
(cd "$ROOT" && pnpm tsx scripts/store-screenshots.ts) || STATUS=1
exit $STATUS
