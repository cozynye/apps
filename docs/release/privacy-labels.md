# App Privacy 라벨 답변표 (Nuni · Fourpop 공통)

App Store Connect › 앱 정보 › App Privacy. 근거: `design/legal/README.md` 매핑표와 `privacy-en.md` 2절. 두 앱 모두 같은 SDK(Firebase Analytics·Crashlytics)만 쓰므로 답이 같다. 1.0은 인앱결제가 없어 RevenueCat SDK를 초기화하지 않는다(`EXPO_PUBLIC_MONETIZATION` 꺼짐, 2026-10-15).

**Do you collect data from this app?** → Yes

| 데이터 유형 | 수집 | 사용자와 연결 | 추적(Tracking) | 목적 |
| --- | --- | --- | --- | --- |
| Identifiers › Device ID (Firebase app instance id) | 예 | 아니오 | 아니오 | Analytics |
| Usage Data › Product Interaction (화면·이벤트, `snake_case` 이벤트) | 예 | 아니오 | 아니오 | Analytics |
| Diagnostics › Crash Data | 예 | 아니오 | 아니오 | App Functionality |
| Diagnostics › Performance Data | 예 | 아니오 | 아니오 | App Functionality |
| Photos or Videos | 아니오 (기기 내 처리, 전송 없음) | — | — | — |
| User Content (일기 본문·태그·스트립) | 아니오 (기기 내 저장) | — | — | — |
| Purchases | 아니오 (1.0 인앱결제 없음) | — | — | — |
| Contact Info, Contacts, Location, Health, Financial Info, Browsing/Search History, Sensitive Info, Other | 아니오 | — | — | — |

- "Data Used to Track You": 없음 (IDFA 미사용, `withoutAdIdSupport`, 광고 개인화 신호 끔 — DECISIONS 2026-10-13).
- 분석은 온보딩 토글·설정 › Privacy에서 끌 수 있음(`setAnalyticsCollectionEnabled(false)`); Crashlytics는 정당한 이익으로 항상 수집(개인정보처리방침 명시).
- Nuni iCloud 백업은 사용자의 iCloud Drive 컨테이너에만 저장되며 우리 서버로 가지 않음 → "수집"에 해당하지 않음.
