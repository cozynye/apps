# 심사 노트 (App Review Notes) 최종본

App Store Connect › 버전 정보 › App Review Information › Notes. `[SANDBOX TESTER EMAIL]`은 B7(Cozy)에서 받은 계정으로 치환(비밀번호는 ASC 폼에만 입력, 문서에 쓰지 않음).

## Nuni (en)

Nuni is an original mood diary built by an individual developer under the brand name "Chagyung". The cloud mascot, illustrations and design are our own work; no third-party characters or assets are used.

No account or sign-up exists — all entries are stored on the device (SQLite + local photos). There is nothing to log in to, so no demo account is needed.

How to test:
- First launch: 3-page onboarding → Home with the entry sheet open. Pick a mood, tap tags, Save.
- Premium (auto-renewing subscription, products `mood_premium_monthly` / `mood_premium_yearly` with a 7-day free trial on yearly): Statistics tab › Year, or Settings › Nuni Premium. Use the Sandbox tester `[SANDBOX TESTER EMAIL]`. The paywall shows the price, period and auto-renewal terms with Restore Purchases, Terms and Privacy links.
- Reminders: Settings › Reminder (local notifications only, no push).
- App lock: Settings › App lock (Face ID with 4-digit passcode fallback).
- iCloud backup (Premium): Settings › Backup — uses the user's own iCloud Drive container.
- Home screen widget: small (free) and medium (Premium).

Localized for Vietnamese and Thai users (English fallback). Analytics (Firebase, anonymous) can be turned off in Settings › Privacy.

## Fourpop (en)

Fourpop is an original photo booth app by the same individual developer ("Chagyung"). All frames, stickers and illustrations are our own work; no licensed characters or third-party IP.

No account or sign-up. Camera access is requested only when the user taps "Let's shoot"; Photos add-only access only when saving. Importing from the album uses the system photo picker (no library permission).

How to test:
- Home › Let's shoot → countdown → 8 shots → pick 4 → decorate → result. Or Home › From album with 4 photos.
- Premium (auto-renewing, `booth_premium_monthly` / `booth_premium_yearly`): Settings › Fourpop Premium, or any locked item (HD, GIF, premium filters, seasonal frames). Sandbox tester `[SANDBOX TESTER EMAIL]`.
- One-time frame pack (non-consumable, `booth_pack_[FIRST_SEASON_PACK_ID]`): Shop tab › pack card › Unlock. Restore Purchases is in Settings and on the paywall.
- Seasonal packs are static files served from our CDN (`manifest.json` + images, no user data); packs that need a newer app version are hidden.
- The free output carries a small "Fourpop" watermark; HD export (Premium) removes it.

Localized for Vietnamese and Thai users (English fallback). Analytics (Firebase, anonymous) can be turned off in Settings › Privacy.
