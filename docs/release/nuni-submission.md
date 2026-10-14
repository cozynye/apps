# Nuni 1.0 제출 안내서 (S3)

이 문서는 App Store Connect에 무엇을 어디에 넣는지와, 그 전에 Cozy가 넘겨야 할 값을 한 곳에 모은 것이다. 본문·답변표의 원본은 같은 폴더의 다른 파일에 있다. 릴리스 게이트(CLAUDE.md §5)는 `docs/RELEASE_CHECKLIST.md`로 따로 돈다.

## 1. Cozy가 먼저 넘겨야 하는 값 (없으면 제출 불가)

| 값 | 쓰이는 곳 | 현재 |
| --- | --- | --- |
| 도메인 `[DOMAIN]` | 개인정보처리방침 URL `https://[DOMAIN]/privacy.html`, 지원 URL `https://[DOMAIN]/`, 약관 링크, 앱 설명의 `[TERMS URL]`·`[PRIVACY URL]` | 미정 (A3) |
| 시행일 `[EFFECTIVE DATE]` | 앱 내 A13 약관·개인정보 + 웹 페이지 | 미정 (A4) |
| RevenueCat 실제 iOS 키 `appl_…` (Nuni) | EAS 시크릿 `EXPO_PUBLIC_RC_IOS_KEY_NUNI` (production·preview) | 미정 (B3) — Test Store 키는 릴리스 빌드에서 비활성 처리됨 |
| RevenueCat ↔ App Store 연결 (.p8, Shared Secret) | 영수증 검증 | 미정 (B3) |
| App Store Connect 상품 `mood_premium_monthly`·`mood_premium_yearly` + **연간 7일 무료체험** | 페이월 가격·체험 문구 | 상품 2개 생성됨, 체험 미설정 (B2) |
| 유료 앱 계약·세금·은행 Active | 심사 제출 조건 | 미정 (B1) |
| EAS 프로젝트 ID (`eas init`) | `app.json` `extra.eas.projectId` | 미정 (P22) |
| Sandbox 테스터 이메일 | 심사 노트 `[SANDBOX TESTER EMAIL]` | 미정 (B7) |
| Firebase plist (Nuni) | EAS 파일 시크릿 `GOOGLE_SERVICES_PLIST_NUNI` | **있음** (로컬) — EAS에 등록 필요 |
| 가격 확정 (월 29,000đ/฿49, 연 199,000đ/฿349) | ASC 가격 포인트 | 미정 (A8) |

## 2. 빌드·제출 순서 (Claude Code)

1. `docs/release/eas.md`대로 시크릿 등록 확인 → `cd apps/nuni && eas build -p ios --profile production`.
2. 빌드 산출물로 `docs/RELEASE_CHECKLIST.md` C1(자리표시자 0건)·C3(약관 본문 일치)·C4(Sandbox 결제: 구독·체험·체험 자격 없음·복원·만료) 확인.
3. `eas submit -p ios --profile production` — 게이트 통과 후에만.

## 3. App Store Connect 입력

| 칸 | 내용 |
| --- | --- |
| 이름·부제·키워드·프로모션·설명 (en·vi·th) | `docs/release/store-nuni.md` 각 언어 절 (URL 자리표시자만 치환) |
| 카테고리 | Lifestyle (보조 Health & Fitness) |
| 연령 등급 | 4+ |
| 스크린샷 | `docs/release/screenshots/nuni/iphone/<locale>/1–6.png`(6.9", 1320×2868), `…/ipad/<locale>/1–6.png`(13", 2064×2752). 캡션 순서는 store-nuni.md의 1~6 |
| 개인정보처리방침 URL · 지원 URL | `https://[DOMAIN]/privacy.html` · `https://[DOMAIN]/` |
| App Privacy 라벨 | `docs/release/privacy-labels.md` |
| 심사 노트 | `docs/release/review-notes.md` › Nuni (Sandbox 계정 치환) |
| 새로운 기능 | `docs/release/release-notes.md` › Nuni 1.0 |
| 수출 규정 | `ITSAppUsesNonExemptEncryption = NO` (app.json에 설정, 빌드에 포함) |
| 판매 국가 | 베트남, 태국 (A2 확정 시) |
| 인앱 상품 | `mood_premium_monthly`(1개월), `mood_premium_yearly`(1년, 7일 체험) — 구독 그룹 `Nuni Premium`, 현지화 이름·설명은 vi·th·en |
| 지원 이메일 | nunicozy@gmail.com |

## 4. Nuni만의 확인 항목

- App Group `group.app.nuni.mood`·iCloud 컨테이너 `iCloud.app.nuni.mood`가 App ID에 켜져 있음(2026-10-12 Cozy 보고). production 프로비저닝은 EAS가 자동 생성.
- 위젯 확장(`targets/widget`)은 EAS 빌드에 포함되며 별도 번들 ID `app.nuni.mood.widget`의 프로비저닝도 EAS가 만든다.
- 알림은 로컬만 — Push capability 없음(`aps-environment` 제거됨).
- 분석: Firebase DebugView에서 `mood`·본문·태그 이름 미전송 확인 완료(2026-10-14).
