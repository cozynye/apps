#!/usr/bin/env bash
# Builds an app in the Release configuration for the simulator (embedded JS bundle, no dev client),
# installs it and runs the `release-smoke` Maestro flow. Catches release-only failures before EAS.
# Usage: bash scripts/release-smoke.sh <nuni|fourpop> <simulator UDID>
set -euo pipefail
APP=${1:?app}; UDID=${2:?udid}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
NAME=$([ "$APP" = nuni ] && echo Nuni || echo Fourpop)
BUNDLE=$([ "$APP" = nuni ] && echo app.nuni.mood || echo app.fourpop.booth)
DD="$HOME/Library/Developer/Xcode/DerivedData/$NAME-release-sim"
cd "$ROOT/apps/$APP"
[ -d ios ] || npx expo prebuild --platform ios --no-install
xcodebuild -workspace "ios/$NAME.xcworkspace" -scheme "$NAME" -configuration Release -sdk iphonesimulator \
  -destination "id=$UDID" -derivedDataPath "$DD" build | grep -E 'error:|BUILD (SUCCEEDED|FAILED)' || true
APP_PATH="$DD/Build/Products/Release-iphonesimulator/$NAME.app"
[ -d "$APP_PATH" ] || { echo "no app at $APP_PATH" >&2; exit 1; }
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl uninstall "$UDID" "$BUNDLE" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP_PATH"
cd "$ROOT"
MAESTRO_DRIVER_STARTUP_TIMEOUT=${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000} bash scripts/e2e.sh "$APP" "$UDID" release-smoke
# Put the dev client back afterwards: pnpm <app> ios --device <UDID> --no-bundler
