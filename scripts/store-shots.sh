#!/usr/bin/env bash
# Captures the 6 store screenshots of one app in one locale on one simulator, then copies them to
# docs/release/screenshots/raw/<app>/<device>/<locale>/N.png for scripts/store-screenshots.ts.
# Metro for that app must already run with EXPO_PUBLIC_FORCE_LOCALE=<locale> (Fourpop: + MOCK_CAMERA).
# Usage: bash scripts/store-shots.sh <nuni|fourpop> <iphone|ipad> <en|vi|th> <simulator UDID> [metro port]
set -euo pipefail
APP=${1:?app}; DEVICE=${2:?iphone|ipad}; LOCALE=${3:?locale}; UDID=${4:?udid}; PORT=${5:-8081}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
MAESTRO_DRIVER_STARTUP_TIMEOUT=${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000} METRO_PORT=$PORT bash "$ROOT/scripts/e2e.sh" "$APP" "$UDID" store-shots
RUN=$(ls -dt "$HOME/.maestro/tests"/*/ | head -1)
DEST="$ROOT/docs/release/screenshots/raw/$APP/$DEVICE/$LOCALE"
mkdir -p "$DEST"
for i in 1 2 3 4 5 6; do cp "$RUN/store-shots/takeScreenshot/store-$i.png" "$DEST/$i.png"; done
echo "raw screenshots → $DEST"
