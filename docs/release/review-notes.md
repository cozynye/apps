# 심사 노트 (App Review Notes) 최종본

App Store Connect › 버전 정보 › App Review Information › Notes. 1.0은 무료(인앱결제 없음, Cozy 결정 2026-10-15)라 Sandbox 계정 항목이 없다.

## Nuni (en)

Nuni is an original mood diary built by an individual developer under the brand name "Chagyung". The cloud mascot, illustrations and design are our own work; no third-party characters or assets are used.

No account or sign-up exists — all entries are stored on the device (SQLite + local photos). There is nothing to log in to, so no demo account is needed. This version is free: no in-app purchases, subscriptions or ads.

How to test:
- First launch: 3-page onboarding → Home with the entry sheet open. Pick a mood, tap tags, Save.
- Statistics tab: mood distribution, streaks, "what lifts you" and the yearly view.
- Reminders: Settings › Reminder (local notifications only, no push).
- App lock: Settings › App lock (Face ID with 4-digit passcode fallback).
- iCloud backup: Settings › Backup — uses the user's own iCloud Drive container.
- Home screen widget: small and medium.

Localized for Vietnamese and Thai users (English fallback). Analytics (Firebase, anonymous) can be turned off in Settings › Privacy.

## Fourpop (en)

Fourpop is an original photo booth app by the same individual developer ("Chagyung"). All frames, stickers and illustrations are our own work; no licensed characters or third-party IP.

No account or sign-up. This version is free: no in-app purchases, subscriptions or ads. Camera access is requested only when the user taps "Let's shoot"; Photos add-only access only when saving. Importing from the album uses the system photo picker (no library permission).

How to test:
- Home › Let's shoot → countdown → 8 shots → pick 4 → decorate → result. Or Home › From album with 4 photos.
- Shop tab lists frame and sticker packs; in this version every pack is free (bundled packs are ready, seasonal packs download on tap).
- Seasonal packs are static files served from our CDN (`manifest.json` + images, no user data); packs that need a newer app version are hidden.
- Output is saved without a watermark. HD export (2400×7200) and the animated GIF are available to everyone (Settings › Save quality, or the chips on the result screen).

Localized for Vietnamese and Thai users (English fallback). Analytics (Firebase, anonymous) can be turned off in Settings › Privacy.
