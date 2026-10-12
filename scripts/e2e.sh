#!/usr/bin/env bash
# Runs Maestro flows for an app on one simulator. Metro must be running (pnpm <app> start).
# Usage: bash scripts/e2e.sh <app> "<simulator name or UDID>" [flow-glob]
#   bash scripts/e2e.sh nuni "iPhone 17 Pro"
#   bash scripts/e2e.sh nuni "iPad Pro 13-inch (M5)" 's1-*'
#   METRO_PORT=8082 bash scripts/e2e.sh nuni <UDID>   # a second Metro (e.g. a QA worktree)
set -euo pipefail
APP=${1:?app}
DEVICE=${2:?simulator}
GLOB=${3:-'*'}
# Maestro needs Java 17+; prefer Homebrew's keg-only openjdk@17 when present.
if [ -d /opt/homebrew/opt/openjdk@17 ]; then export JAVA_HOME=/opt/homebrew/opt/openjdk@17; fi
export PATH="${JAVA_HOME:+$JAVA_HOME/bin:}$HOME/.maestro/bin:$PATH"
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
# Same-name simulators can exist per iOS runtime; runtimes are listed oldest first, so take the newest.
UDID=$(xcrun simctl list devices available | grep -F "$DEVICE" | tail -1 | grep -oE '[0-9A-F-]{36}' || true)
[ -n "$UDID" ] || UDID=$DEVICE
xcrun simctl boot "$UDID" 2>/dev/null || true
cd "apps/$APP/.maestro"
STATUS=0
for flow in $GLOB.yaml; do
  echo "== $flow on $DEVICE"
  maestro --device "$UDID" test -e METRO_PORT="${METRO_PORT:-8081}" "$flow" || STATUS=1
done
exit $STATUS
