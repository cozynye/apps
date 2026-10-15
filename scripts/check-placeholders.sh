#!/usr/bin/env bash
# Release gate helper: lists unresolved placeholders in shipped code/content.
# Exit 1 if any are found. design/ and docs/ are excluded (source material).
set -u
PATTERN='\[DOMAIN\]|\[TERMS URL\]|\[PRIVACY URL\]|\[EFFECTIVE DATE\]|\[FIRST_SEASON_PACK_ID\]|TODO\(release\)'
HITS=$(grep -RInE "$PATTERN" apps packages web 2>/dev/null \
  --exclude-dir=node_modules --exclude-dir=ios --exclude-dir=android --exclude-dir=.expo || true)
MISSING_ENV=""
envval() { grep -E "^$1=" .env 2>/dev/null | cut -d= -f2-; }
# 1.0 ships free (DECISIONS 2026-10-15): RevenueCat keys are required only when purchases are switched on.
if [ "$(envval EXPO_PUBLIC_MONETIZATION)" = "on" ]; then
  for k in EXPO_PUBLIC_RC_IOS_KEY_NUNI EXPO_PUBLIC_RC_IOS_KEY_FOURPOP; do
    [ -z "$(envval $k)" ] && MISSING_ENV="$MISSING_ENV $k"
  done
else
  echo "Monetization: off (free build; RevenueCat keys not required)"
fi
# The CDN URL is only needed when a season pack ships (RELEASE_CHECKLIST A5/B5); otherwise the shop lists bundled packs.
[ -z "$(envval EXPO_PUBLIC_CDN_BASE_URL)" ] && echo "Note: EXPO_PUBLIC_CDN_BASE_URL not set (no season pack; bundled packs only)"
[ -f apps/nuni/GoogleService-Info.plist ] || MISSING_ENV="$MISSING_ENV apps/nuni/GoogleService-Info.plist"
[ -f apps/fourpop/GoogleService-Info.plist ] || MISSING_ENV="$MISSING_ENV apps/fourpop/GoogleService-Info.plist"
STATUS=0
if [ -n "$HITS" ]; then echo "Unresolved placeholders:"; echo "$HITS"; STATUS=1; else echo "Placeholders: none"; fi
if [ -n "$MISSING_ENV" ]; then echo "Missing secrets/files:$MISSING_ENV"; STATUS=1; else echo "Secrets: present"; fi
exit $STATUS
