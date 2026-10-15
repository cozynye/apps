# Fourpop 1.0 제출 안내서 (S5)

Nuni와 같은 순서로 간다(`nuni-submission.md`). 2026-10-15 기준 현황과 남은 일만 적는다. 릴리스 게이트(CLAUDE.md §5)는 `docs/RELEASE_CHECKLIST.md`의 F 칸으로 따로 돈다.

## 1. Cozy가 먼저 넘겨야 하는 값

| 값 | 쓰이는 곳 | 현재 |
| --- | --- | --- |
| Firebase `GoogleService-Info.plist` (Fourpop, `app.fourpop.booth`) | `apps/fourpop/` (gitignore) → EAS 파일 시크릿 `GOOGLE_SERVICES_PLIST_FOURPOP` (production·preview) | **미정 (B4)** — 없으면 Firebase 없이 빌드됨(분석·Crashlytics 없음) |
| 첫 시즌팩 여부 `[FIRST_SEASON_PACK_ID]` | 상점 CDN 팩 + R2 URL(B5) | **미정 (A5)** — 1.0 무료라 선택. ‘없음’이면 상점은 번들 팩(Basics·Pop·Y2K)만 |
| EAS 프로젝트 ID | `app.json` `extra.eas.projectId` | **완료** (`@cco33/fourpop`, 6a43354f…) |
| ASC 앱 | App ID 6821789911, 기본 언어 영어(영국) | **완료** (앱 생성 2026-10-12) |

## 2. 빌드·업로드 순서

1. plist 수령 → `cd apps/fourpop && eas env:create --scope project --name GOOGLE_SERVICES_PLIST_FOURPOP --type file --value ./GoogleService-Info.plist --environment production --visibility secret` (preview도 같게).
2. **첫 빌드는 Cozy 터미널에서**: `cd apps/fourpop && eas build -p ios --profile production` — Apple 로그인 후 `app.fourpop.booth` 프로비저닝 프로파일 생성(배포 인증서는 Nuni 때 만든 것을 재사용). 이후 빌드는 비대화형으로 가능.
3. 업로드: `eas submit -p ios --profile production --id <build id>` (ASC App ID는 `eas.json`에 있음). Fourpop EAS 프로젝트에는 ASC API 키가 없으므로 첫 submit도 Cozy 터미널에서(키 생성 질문에 Y) 하거나, `.env`의 `ASC_*` 키를 `EXPO_ASC_*` 환경 변수로 넘긴다(`eas.md`).
4. TestFlight 내부 그룹에서 Cozy iPhone 설치 확인.

## 3. App Store Connect 입력

| 칸 | 내용 | 상태 |
| --- | --- | --- |
| 이름·부제·키워드·프로모션·설명·릴리스 노트 (en-GB·en-US·vi·th), 카테고리, 연령 등급 | `apps/fourpop/store.config.json` → `eas metadata:push` | **완료 2026-10-15** |
| 스크린샷 | `docs/release/screenshots/fourpop/{iphone-6.3,ipad}/<locale>/1–6.png` → `env $(grep '^ASC_' .env \| xargs) pnpm tsx scripts/asc-screenshots.ts fourpop` | **완료 2026-10-15** — Pop·Y2K 반영해 재촬영, API로 48장 업로드(en-GB·en-US·vi·th × iPhone 6.3"·iPad 13") |
| 빌드 선택 | 1.0 버전 페이지 | Cozy (빌드 후) |
| 앱 심사 정보 | 연락처 + `docs/release/review-notes.md` › Fourpop (en) | Cozy |
| App Privacy | `docs/release/privacy-labels.md` (Nuni와 동일) | Cozy |
| 가격·국가 | 무료, 베트남·태국 | Cozy |
| 버전 출시 | 수동 출시 권장 | Cozy |

## 4. Fourpop만의 확인 항목

- 카메라·사진 추가 권한 문구(vi·th·en)는 `packages/i18n/permissions/fourpop`에서 빌드에 들어감(C8 확인됨).
- 번들 콘텐츠: 프레임 30종(Basics 10 + Pop 10 + Y2K 10), 스티커 60종(22 + 20 + 18), 매니페스트 버전 4. CDN 시즌팩은 A5 결정 후.
- 실기기 확인 대기(Cozy iPhone 12 Pro): 권한 거부, 비행기 모드, 공유, HD 저장 시간 — RELEASE_CHECKLIST C7.
