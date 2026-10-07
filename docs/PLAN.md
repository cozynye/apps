## 개발자: Claude Code

이 프로젝트의 개발자는 Claude Code다. 앱 사용자는 베트남·태국 MZ이고, 이 문서를 읽고 구현하는 개발자가 Claude Code다. 개발은 Claude Code에게 일임하며, 이 문서와 디자인 시스템 아티팩트가 개발을 시작할 때 Claude Code에게 반드시 전문을 보여주는 기준 문서다. 이 문서는 2026-10-07 기획·CTO·디자인·개발·UX 5개 관점 검수를 반영한 2판이다.

Claude Code는 다음 원칙을 따른다.

1. 이 문서가 요구사항의 단일 기준(source of truth)이다. 코드와 문서가 다르면 문서를 따르고, 다른 점을 보고한다. 디자인 시스템 아티팩트의 `README.md`, `tokens.json`, `assets/*/README.md`, `i18n/`, `legal/`, `store/`는 이 문서의 일부다.
2. 화면은 문서의 화면 ID(A1–A13, B1–B13)로 부르고, ‘라우트 트리’의 파일명을 그대로 쓴다. `testID`는 `${screenId}.${element}`(예 `a4.save`).
3. ‘기능 범위 (MVP)’ 표에 없는 기능은 만들지 않는다. v1.1·v2로 표시된 항목은 구현하지 않는다.
4. 자체 서버를 만들지 않는다. ‘공통 기반’ 표의 스택과 **Expo SDK 공식 모듈**은 허용한다. 그 밖의 라이브러리가 필요하면 이유를 적고 제안한 뒤 진행한다(막히지 않는다).
5. 사용자에게 보이는 모든 문구는 디자인 시스템 `i18n/`의 키를 쓴다. 키가 없으면 en·vi·th 세 파일에 같이 추가한다. 하드코딩 문자열·하드코딩 가격·하드코딩 hex는 금지한다.
6. 레퍼런스 앱(하루콩, 인생네컷 등)의 이름·캐릭터·아이콘·문구·레이아웃을 코드나 에셋에 쓰지 않는다.
7. 문서에 없거나 모호한 결정은 가장 단순한 쪽으로 가정하고 `DECISIONS.md`에 적은 뒤 진행한다. 되돌리기 어려운 결정(스키마, 상품 ID, 번들 ID, 권한 문구)만 질문으로 남긴다.
8. 작업 순서는 ‘진행 단계와 리스크’의 S1→S5를 따른다. 날짜 일정은 없고, 각 단계의 완료 조건이 다음 단계의 시작 조건이다.
9. 모든 화면은 iPhone과 iPad에서 동작해야 한다. 목업은 iPhone 기준이고 iPad는 ‘공통 기반 › iPad 대응’ 규칙을 따른다. 고정 픽셀 너비로 레이아웃을 짜지 않는다.
10. 목업(HTML)은 레이아웃·위계·문구의 참고다. 목업의 대문자 라벨, 하드코딩 색, 예시 데이터(“Café”, “Night” 프레임, “Autumn Café pack”)는 그대로 옮기지 않는다. 목업과 이 문서가 다르면 문서를 따른다.

## 개요

베트남·태국 MZ를 타겟으로 한국에서 검증된 두 컨셉(감정일기, 포토부스)을 현지어 네이티브 iOS 앱으로 출시한다. 감정일기 Nuni를 먼저 내서 결제·다국어·출시 파이프라인을 검증하고, 기회가 더 큰 포토부스 Fourpop을 이어서 낸다.

| 항목 | 결정 |
| --- | --- |
| 앱 이름 | **Nuni** (감정일기, `app.nuni.mood`) / **Fourpop** (포토부스, `app.fourpop.booth`) |
| 퍼블리셔 | Chagyung (브랜드명). Apple 개인 개발자 계정이므로 App Store 판매자명은 실명으로 표시됨 — 약관·스토어 설명에 “Chagyung”은 브랜드명임을 명시 |
| 타겟 | 베트남·태국 18–30세 (Gen Z + 후기 밀레니얼) |
| 플랫폼 | iOS 우선(iPhone + iPad Universal), React Native(Expo)로 개발해 안드로이드 확장 대비 |
| 서버 | 원칙적으로 없음. 기기 로컬 저장 + iCloud + 정적 CDN(R2) + RevenueCat + Firebase |
| 수익 | 무료 다운로드 + 인앱결제(구독 + 단품) |
| 언어 | 베트남어, 태국어, 영어 (한국어는 내부 QA용) |
| 레퍼런스 | 감정일기: 하루콩(DailyBean) / 포토부스: 인생네컷·나만의 네컷(MY4CUT) |
| 원칙 | 컨셉만 참고, 이름·캐릭터·아이콘·UI·문구는 전부 자체 제작 |

## 시장 분석 요약

두 카테고리 모두 현지어를 제대로 지원하는 강자가 없다. 하루콩은 베트남어·태국어 없이도 현지 평가를 수천~만 건 받았고, 포토부스는 오프라인만 크고 앱은 비어 있다. (2026년 10월 App Store 확인 기준)

| 항목 | 감정일기 | 포토부스 |
| --- | --- | --- |
| 한국 레퍼런스 | [하루콩](https://apps.apple.com/kr/app/%ED%95%98%EB%A3%A8%EC%BD%A9/id1553223828): 별점 4.8, 리뷰 3.3만, 구독 + 클로버 재화 | [나만의 네컷](https://apps.apple.com/kr/app/%EB%82%98%EB%A7%8C%EC%9D%98-%EB%84%A4%EC%BB%B7-%EC%9D%B8%EC%83%9D%EB%84%A4%EC%BB%B7-%ED%8F%AC%ED%86%A0%EB%B6%80%EC%8A%A4-%ED%94%84%EB%A0%88%EC%9E%84/id6504497435): 구독 월 6,600원, 빵 재화 |
| 베트남 현황 | [DailyBean VN](https://apps.apple.com/vn/app/dailybean-simplest-journal/id1553223828) 평가 1.2만(베트남어 미지원), [Daylio](https://apps.apple.com/vn/app/daylio-journal-mood-tracker/id1194023242) 평가 595(베트남어 지원) | 현지어 포토부스 앱 없음. 오프라인은 PHOTO TIME 56개 지점, 1회 7~15만 동 |
| 태국 현황 | [DailyBean TH](https://apps.apple.com/th/app/dailybean-simplest-journal/id1553223828) 평가 4,900(태국어 미지원), MOODA 등 | [MY4CUT TH](https://apps.apple.com/th/app/my4cut-korean-photo-booth/id6504497435) 평가 거의 없음, 태국어 미지원. 오프라인 시장 약 10억 바트, 1회 150~200바트 |
| 현지 결제 가격대 | 월 29,000~49,000동 / ฿49~149 | 월 ฿199(MY4CUT) |
| 공유 채널 습관 | — | 베트남: Zalo·Facebook·Messenger·Instagram / 태국: LINE·Instagram·TikTok. 두 앱의 공유 행은 로케일별로 구성한다 |
| 기회 | 중간~높음: 수요 검증, 현지화만으로 차별화 | 높음: 오프라인 붐 + 앱 공백 |

출처: [베트남 포토부스 비즈니스](https://tuoitre.vn/saigontimes/photobooth-kinh-doanh-tu-trai-nghiem-cam-xuc-co-de-thang-1061208912.htm) · [태국 포토부스 시장](https://marketeeronline.co/archives/468421) · [베트남 감정 앱](https://vietcetera.com/vn/on-app-binh-tam-tinh-khi-nho-cac-ung-dung-sau) · [태국 감정일기 앱](https://www.checkraka.com/mobilephone/article/131453)

## 공통 기반

두 앱은 하나의 모노레포에서 결제·다국어·분석·디자인 시스템 패키지를 공유한다. 자체 서버는 두지 않고, 외부 SaaS와 정적 파일만 쓴다.

### 기술 스택

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| 프레임워크 | Expo SDK (dev build) + EAS Build/Submit, New Architecture | 안드로이드 확장 시 코드 재사용 |
| 내비게이션 | expo-router | ‘라우트 트리’ 참조 |
| 상태 | Zustand + react-native-mmkv | ‘상태 경계’ 참조 |
| 로컬 DB | expo-sqlite + Drizzle ORM (`drizzle-kit generate`로 마이그레이션 파일, 앱 시작 시 `useMigrations`) | 연결 시 `PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;` |
| 카메라 | expo-camera | 실시간 프레임 프로세서 불필요(필터는 B7에서 사후 적용). vision-camera는 쓰지 않는다 |
| 그래픽·합성·필터 | @shopify/react-native-skia (오프스크린 캔버스, 컬러 매트릭스, 그레인 셰이더) | Nuni 공유 카드(A7)도 Skia로 통일 |
| 이미지 처리 | expo-image-manipulator (리사이즈, EXIF 회전, JPEG 변환) | |
| 미디어 | expo-image-picker (PHPicker, 권한 불필요) / expo-media-library (`addOnly` 권한으로 카메라 롤 저장) | 전용 앨범은 만들지 않는다 |
| 파일·공유 | expo-file-system, expo-sharing (시스템 공유 시트) | Instagram 스토리는 URL scheme(`instagram-stories://share`) 직접 호출 |
| 벡터 | react-native-svg (마스코트, 온보딩 일러스트) | |
| GIF | `gifenc` (JS 인코더, 480px 8프레임) — 로딩 상태 필수 | Swift 모듈 불필요 |
| zip | `react-native-zip-archive` (Nuni 내보내기) | 없으면 JSON + 사진 폴더를 공유 시트로 대체 가능 |
| Markdown 렌더 | react-native-markdown-display (A13·B13 약관) | |
| 인앱결제 | RevenueCat (react-native-purchases) | 영수증 검증·구독 상태 대행 |
| 페이월 | **자체 구현**(A9·B11, i18n 키 사용). RevenueCat에서는 Offering·Package(가격·상품)만 받는다. RevenueCat Paywalls 템플릿은 S6 A/B 테스트 때 검토 | 고지 문구·약관 링크를 앱 안에 둬야 하므로 |
| 백업 | iCloud Drive(ubiquity container `iCloud.app.nuni.mood`) — 커스텀 Expo Module(Swift) + config plugin 작성 허용 | CloudKit은 쓰지 않는다 |
| 콘텐츠 배포 | Cloudflare R2 + 정적 `manifest.json` | 시즌 프레임·스티커팩을 앱 업데이트 없이 추가 |
| 분석·크래시 | Firebase Analytics + Crashlytics (`@react-native-firebase`) | 광고 신호 비활성 플래그 설정 |
| 다국어 | i18next + react-i18next + expo-localization | vi / th / en |
| 로컬 알림 | expo-notifications | 반복 알림 대신 단발 알림 재예약 |
| 생체 인증·보안 | expo-local-authentication, expo-secure-store(비밀번호 해시) | |
| 햅틱 | expo-haptics | 디자인 시스템 README ‘모션과 햅틱’ |
| 위젯 | expo-apple-targets + Swift(WidgetKit) | 빌드 실패 시 S3 이후로 미룸(리스크 표) |
| 폰트 | expo-font config plugin, TTF 6개 | 디자인 시스템 README ‘타이포그래피’ |
| 테스트 | Jest(유닛) + Maestro(E2E, 로컬 시뮬레이터) | |

모노레포 구조:

```
apps/
  nuni/        # 감정일기 (app.nuni.mood)
  fourpop/     # 포토부스 (app.fourpop.booth)
packages/
  ui/          # tokens.ts, useTheme, useTypography, 공통 컴포넌트, fonts/
  i18n/        # common·nuni·fourpop × en·vi·th, i18next 설정
  purchases/   # RevenueCat 래퍼, entitlement 훅, 캐시
  analytics/   # 이벤트 정의·전송
  content/     # manifest 타입(zod), 로더, 번들 에셋 맵
  db/          # Drizzle 스키마, 마이그레이션
web/
  legal/       # GitHub Pages: privacy, terms, support (P21)
```

### 상태 경계

| 저장소 | 내용 |
| --- | --- |
| MMKV (영구 KV) | settings(언어, 외관, 알림 시간, 잠금, 분석 동의, 저장 화질, 셔터음), 권한 캐시 `rc.entitlements.v1`, 매니페스트 캐시, 온보딩 완료 플래그, 설치일 |
| SQLite | Nuni: entries, tags, entry_tags, photos / Fourpop: strips, installed_packs |
| Zustand (메모리) | boothSession(shots[], picked[], decorations[]), 현재 테마, 네트워크 상태 |
| 파일 | Nuni `Documents/photos/`, `Documents/nuni.db` / Fourpop `Documents/strips/`, `Documents/packs/<id>/`, `Cache/booth-session/` |
| SecureStore | 잠금 비밀번호 해시 |

### 라우트 트리 (expo-router)

Nuni:

```
app/_layout.tsx            # Purchases.configure, i18n, 폰트, 잠금 게이트, 테마
app/a11-lock.tsx           # 잠금 (루트 게이트, 잠금 켜짐 시)
app/a2-onboarding.tsx      # 온보딩 3장 (풀스크린, 1회)
app/(tabs)/_layout.tsx     # 탭 3개: a3-home, a6-stats, a10-settings
app/(tabs)/a3-home.tsx
app/(tabs)/a6-stats.tsx
app/(tabs)/a10-settings.tsx
app/a4-entry.tsx           # 기록 작성·수정 (formSheet 모달) ?date=YYYY-MM-DD&id=
app/a5-entry/[date].tsx    # 날짜별 기록 목록·상세 (formSheet)
app/a7-share.tsx           # 공유 카드 (모달)
app/a9-paywall.tsx         # 페이월 (모달, 스와이프 다운 닫기) ?source=
app/a12-reminder.tsx       # 첫 저장 직후 알림 프리프롬프트 (시트)
app/a13-legal/[doc].tsx    # terms | privacy | licenses
app/settings/lock.tsx      # 잠금 설정·비밀번호
app/settings/backup.tsx    # iCloud 백업·복원·내보내기
```

Fourpop:

```
app/_layout.tsx
app/b2-onboarding.tsx
app/(tabs)/_layout.tsx     # 탭 3개: b3-home, b9-gallery, b10-shop (설정은 헤더 톱니 → b12)
app/(tabs)/b3-home.tsx
app/(tabs)/b9-gallery.tsx
app/(tabs)/b10-shop.tsx
app/b4-frames.tsx          # 프레임 전체 선택 (formSheet)
app/booth/_layout.tsx      # 촬영 세션 스택 (풀스크린, camera-* 토큰)
app/booth/b5-capture.tsx
app/booth/b6-pick.tsx
app/booth/b7-decorate.tsx
app/booth/b8-result.tsx
app/b11-paywall.tsx        # ?source=&packId=
app/b12-settings.tsx
app/b13-legal/[doc].tsx
```

딥링크: `nuni://entry/today`(위젯·알림 탭 → a4-entry), `fourpop://shop/<packId>`(시즌 배너).

### iPad 대응 (두 앱 공통, 필수)

두 앱 모두 Universal 앱으로 배포해 iPad에서 iPhone 확대 모드가 아닌 네이티브 레이아웃으로 동작한다. 화면 목업은 iPhone 기준이고, iPad는 아래 규칙으로 같은 컴포넌트를 재배치한다. 별도 iPad 목업은 만들지 않는다.

| 항목 | 규칙 |
| --- | --- |
| 설정 | `app.json` `ios.supportsTablet: true`, `ios.requireFullScreen: true` (MVP에서는 Split View·Slide Over 미지원) |
| 방향 | iPhone: 세로 고정. iPad: Nuni는 세로·가로 모두, Fourpop은 세로 고정 |
| 분기점 | `useWindowDimensions().width >= 744`(`breakpoint-tablet`)이면 iPad 레이아웃. 기기 종류로 판단하지 않음 |
| Nuni 레이아웃 | 콘텐츠 최대 너비 `layout-max-content` 600 중앙 정렬. 1024pt 이상이면 캘린더(왼쪽 60%) + 선택한 날 기록(오른쪽 40%) 2단. A4·A5 시트는 바텀시트 대신 중앙 모달(너비 520) |
| Fourpop 레이아웃 | 홈: 프레임 그리드 5열 → 8열. 촬영: 뷰파인더는 컷 비율(3:2) 유지, 최대 너비 600, 양옆은 `camera-surface`. 꾸미기·결과: 미리보기 왼쪽, 도구·필터·공유 패널 오른쪽(`layout-side-panel` 360) 2단 |
| 탭 바 | 744pt 이상에서도 하단 탭 바 유지. 탭 항목은 가운데 모음, 최대 너비 480 |
| 터치 영역·글자 크기 | iPhone과 동일. 글자를 키우지 않고 여백과 열 수만 늘림 |
| 포토부스 출력 | iPad에서도 출력 픽셀은 같음(600×1800 / 1200×3600) |
| 위젯 | iPad 홈 화면 위젯도 같은 타겟, extraLarge는 지원하지 않음 |
| 카메라 없는 iPad·시뮬레이터 | 뷰파인더 자리에 `error.cameraUnavailable` + 앨범 가져오기만 활성. `EXPO_PUBLIC_MOCK_CAMERA=1`이면 번들 샘플 8장으로 촬영을 대체(E2E용) |
| 완료 기준 | iPad Pro 13인치 시뮬레이터에서 전체 플로우 동작, 가로 모드(Nuni) 레이아웃 깨짐 없음 |

### 빌드·릴리스

| 항목 | 규칙 |
| --- | --- |
| EAS 프로필 | `development`(dev client, 시뮬레이터), `preview`(TestFlight 내부, ko 활성, `EXPO_PUBLIC_ENV=preview`), `production` |
| 시크릿 | RevenueCat 키 `EXPO_PUBLIC_RC_IOS_KEY_NUNI` / `_FOURPOP`, `GoogleService-Info.plist` 2개, R2 base URL → EAS Secrets(파일 시크릿). 리포에 커밋 금지 |
| 버전 | semver `version`, `ios.buildNumber` EAS autoIncrement. 매니페스트 `minAppVersion` 비교는 `expo-constants`의 `nativeApplicationVersion` |
| CI (GitHub Actions) | typecheck, Jest, i18n 키 패리티 검사(`packages/i18n/scripts/check.ts`), lint. Maestro는 로컬 시뮬레이터에서 수동 실행 |
| 브랜치 | `main` 보호, 기능 브랜치 → PR. 커밋마다 `DECISIONS.md` 갱신 가능 |
## 앱 A — Nuni (감정일기)

하루 기록을 3탭·10초 안에 끝내는 것이 핵심이다. 마스코트는 구름 ‘Nuni’. 감정 5단계를 구름의 표정과 날씨(비→노을)로 표현한다.

### 기능 범위 (MVP)

| 기능 | 무료 | 프리미엄 |
| --- | --- | --- |
| 감정 5단계 기록 (Rough / Low / Okay / Good / Great) | ✓ | |
| 활동 태그 (기본 20종) | ✓ | |
| 커스텀 태그 | 3개 | 무제한 |
| 한 줄 메모 | 200자 | 2,000자 |
| 사진 | 1장 | 최대 10장 |
| 월간 캘린더, 같은 날 여러 기록 | ✓ | |
| 통계: Week·Month 탭(감정 분포, 연속 기록 카드) | ✓ | |
| 통계: Year 탭, 활동–감정 상관 카드 | 잠금(블러 + 페이월) | ✓ |
| 리마인더 알림 (1일 1회) | ✓ | |
| 앱 잠금 (Face ID / Touch ID / 4자리 비밀번호) | ✓ | |
| 홈 위젯 | small 1종 | medium 추가 |
| iCloud 백업·복원 | | ✓ |
| 내보내기 (JSON + 사진 zip) | ✓ | |
| 공유 카드 (월간·연간) | 워터마크 포함 | 워터마크 제거 |
| 테마·마스코트 스킨 상점(A8) | v1.1 (MVP 제외, 상품 `mood_skin_*` 미등록) | |

### 화면 목록

| # | 화면 | 핵심 요소 |
| --- | --- | --- |
| A1 | 스플래시 | 로고 + 단색 배경, 1초 이내 |
| A2 | 온보딩 (3장) | 가치 제안 → 패턴 → 리마인더 소개. 마지막 장 버튼 위에 ‘익명 사용 통계 보내기’ 토글(기본 ON). **권한 요청 없음**, Skip 가능 |
| A3 | 홈 (월간 캘린더) | 월 이동, 연속 기록 칩(0일이면 숨김), 날짜별 구름(`-sm`), 오늘 셀 강조. 설치 전 날짜는 숫자만, 설치 후 빈 날은 점선 원. 오늘 기록이 있으면 “Today: Good · 3 tags → Edit” 카드, 없으면 “How was today?” 카드. + FAB. 모든 날짜 셀은 Pressable(눌림 배경) |
| A4 | 기록 작성·수정 | 바텀시트 한 장: 제목 `entry.titleFor`(today / yesterday / Oct 12, 날짜 줄 탭으로 변경 가능) → 감정 5개 → 태그 15개 노출 + “Show all tags” → 메모(키보드 회피) → 사진 → Save. 감정 미선택 시 Save 비활성 + `entry.pickMood`. 변경 후 닫기 시 `entry.discardConfirm` |
| A5 | 날짜별 기록 | 그 날의 기록 목록(마지막 기록이 캘린더 대표). 탭 → A4로 수정, 스와이프 삭제(`entry.deleteConfirm`), “Add another entry” |
| A6 | 통계 | 세그먼트 Week / Month / Year(자물쇠). 감정 분포 바(구분선 포함) + 단계별 개수(얼굴 있는 sm 아이콘), 연속 기록 카드 2개, 활동–감정 카드(블러 + `stats.tryPremium`). 우상단 “Share this month” → A7 |
| A7 | 공유 카드 | 9:16 이미지(Skia): 월 이름, 캘린더 구름, 분포, 마스코트. 무료는 우하단 워터마크(“Nuni” 로고, 너비 18%, 불투명 70%) |
| A9 | 페이월 | 헤드라인은 진입 `source`별(“See what lifts your mood” 등), 혜택 3줄(아이콘 각각 다름), 연간(7일 체험, 절약 배지)·월간 플랜, CTA(연간 선택 시 `startTrial`, 월간 선택 시 `monthlyCta`), 체험 후 가격 굵게(`afterTrial` / 체험 자격 없으면 `noTrial`), 고지 `legal`, 복원·약관·개인정보 링크, “Not now”. 모달 스와이프 다운 닫기 |
| A10 | 설정 | 언어, 외관(system/light/dark), 리마인더 시간·토글, 앱 잠금 → `settings/lock`, 백업 → `settings/backup`(상단에 `localOnlyNotice`), 구독 관리, 구매 복원, Privacy 섹션(분석 토글), 문의(nunicozy@gmail.com), 평가, 약관·개인정보·라이선스, 버전, 전체 삭제 |
| A11 | 잠금 화면 | `lock.biometric`(Face ID / Touch ID 자동) 또는 4자리 비밀번호. 백그라운드 전환 시 콘텐츠 가림 |
| A12 | 알림 프리프롬프트 | 첫 저장 직후 시트: `reminder.title` + 시간 피커(기본 21:00) + `enableReminder` / `notNow`. 켜면 시스템 권한 요청 |
| A13 | 약관·개인정보·라이선스 | 번들 Markdown 렌더. MVP는 en 본문만, 상단에 “English only” 한 줄. 라이선스는 OFL·MIT 고지 |

위젯(WidgetKit, Swift): small = 오늘 구름 또는 `widget.tapToLog`, medium = 최근 7일(프리미엄 아니면 `widget.locked`). 잠금 켜짐 시 둘 다 `widget.hidden`만 표시.

### 사용자 플로우

첫 실행:

1. A1 → A2 온보딩 3장(언어는 기기 설정 자동, 분석 토글 기본 ON) → Get started
2. A3에 바로 A4 시트가 열린 상태로 진입(빈 캘린더 대신 첫 성공 경험). 캘린더 아래 `home.firstCloud`
3. 첫 저장 → 캘린더에 구름 새김 애니메이션 + 햅틱 → A12 알림 프리프롬프트 → (켜면) 시스템 알림 권한
4. 3일 연속 기록 시 저장 직후 축하 시트(`streak.celebrateTitle`, `seePatterns` → A6). 페이월은 여기서 강제로 띄우지 않는다

매일 기록:

1. 리마인더 알림 탭(→ `nuni://entry/today`, A4 바로 열림. 알림 액션 Low / Okay / Good은 태그 없이 즉시 저장) 또는 위젯 탭 또는 홈 FAB
2. 감정 → 태그 → (선택) 메모·사진 → Save → 캘린더 복귀, 연속 기록 갱신
3. 과거 날짜: 캘린더 셀 탭 → 기록 있으면 A5, 없으면 A4(`titleFor` = 그 날짜)

결제:

1. 잠긴 기능(Year 탭, 활동–감정 카드, 백업, medium 위젯, 커스텀 태그 4번째, 사진 2장째, 메모 201자, 공유 카드 워터마크 제거) 탭 → A9 `?source=`
2. 구독 → 성공 시 즉시 해제, 실패·취소 시 원래 화면 복귀
3. 구독 만료: 프리미엄 기능 잠김. 이미 만든 데이터는 유지(초과 사진·긴 메모는 열람·삭제만 가능, 적용 중인 테마는 없음(MVP 테마 없음), medium 위젯은 `widget.locked`)

### 구현 명세

감정 단계는 1(Rough)부터 5(Great)까지 정수로 저장하고, 하루에 여러 건 기록할 수 있다. 날짜 경계는 기기 현지 시간 기준 00:00이고, `date`는 작성 시점의 현지 날짜로 고정한다(시간대 변경 시 재계산하지 않음). 시트를 열어둔 채 자정이 지나면 저장 시점의 날짜를 쓴다.

SQLite 스키마(Drizzle로 정의, 연결 시 `PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;`):

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,            -- uuid v7 (`uuidv7` 패키지)
  date TEXT NOT NULL,             -- 'YYYY-MM-DD' (기기 현지 시간)
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,                      -- 무료 200자, 프리미엄 2,000자 (앱 레벨 검증)
  created_at INTEGER NOT NULL,    -- unix ms
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_entries_date ON entries(date);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name_key TEXT,                  -- 기본 태그는 i18n 키(tags.sleep …), 커스텀은 NULL
  custom_name TEXT,               -- 커스텀 태그 이름
  icon TEXT NOT NULL,             -- Phosphor 아이콘 이름
  sort_order INTEGER NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE entry_tags (
  entry_id TEXT REFERENCES entries(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);
CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);

CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  entry_id TEXT REFERENCES entries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,        -- Documents/photos/ 아래 상대 경로
  width INTEGER, height INTEGER,
  sort_order INTEGER NOT NULL
);
CREATE INDEX idx_photos_entry ON photos(entry_id);
```

연속 기록(streak) — 유닛 테스트 대상:

```
D = 기기 오늘 날짜 ('YYYY-MM-DD'), S = entries.date의 distinct 집합 (date > D 는 무시)
start = D if D ∈ S else D-1
current = 0;  d = start;  while d ∈ S: current += 1; d -= 1일
best = S를 정렬해 연속 구간 중 최장 길이 (기록 0건이면 0)
예) S={10/18,10/19,10/20}, D=10/20 → current 3 / D=10/21 → 3 / D=10/22 → 0 / S={} → 0, best 0
```

캘린더 대표 기록 = 그 날 `created_at`이 가장 큰 기록. 3일·7일·30일 도달 시 `streak_milestone` 이벤트 + 축하 시트(3일만 1회).

규칙:

| 항목 | 규칙 |
| --- | --- |
| 기본 태그 20종 | sleep, exercise, study, work, friends, family, partner, food, cafe, shopping, travel, games, movies, music, reading, weather, photos, chores, health, pray (i18n `tags.*`) |
| 사진 저장 | 선택 직후 `expo-image-manipulator`로 긴 변 1600px, JPEG 85, EXIF 회전 적용 → `Cache/` 임시 파일. Save 시 SQLite 트랜잭션 안에서 `photos` 행 삽입 후 `Documents/photos/`로 move. 엔트리 삭제 시 앱 코드가 파일 먼저 삭제 후 DB 삭제. 앱 시작 시 DB에 없는 고아 파일 정리 |
| 리마인더 | 반복 알림을 쓰지 않는다. ‘다음 미기록일의 설정 시각’ 단발 알림 1개만 유지. 기록 저장·삭제·시간 변경·언어 변경·앱 포그라운드 진입 시 전부 취소 후 재예약(최대 7일분 선예약). 본문은 현재 앱 언어. 알림 카테고리에 Low / Okay / Good 빠른 액션 |
| 가입 없음 | 계정·로그인 없음. 구매 복원은 RevenueCat 익명 ID + Apple 영수증 |
| iCloud 백업 | 백업 전 `VACUUM INTO 'backup.db'`로 스냅샷(−wal/−shm 미포함) + `photos/` 폴더 + `meta.json{schemaVersion, appVersion, createdAt}`을 ubiquity 컨테이너 `Documents/`에 복사. 복원은 DB 연결 종료 → 파일 교체 → 앱 재시작 안내. 백업의 schemaVersion이 앱보다 높으면 복원 거부(`error.updateRequired`). 덮어쓰기 전 확인 다이얼로그 |
| 내보내기 | `export.json`(entries + tags) + 사진을 zip으로 공유 시트. 무료 |
| 잠금 | expo-local-authentication, 실패·미지원 시 4자리 비밀번호(SecureStore에 해시). 백그라운드 전환 시 콘텐츠 가림. DB·photos는 `NSFileProtectionCompleteUntilFirstUserAuthentication`, SQLCipher 미사용 |
| 홈 위젯 | App Group `group.app.nuni.mood`, 공유 파일 `widget.json` `{today: {mood, date} | null, last7: [{date, mood | null}], locale, locked: boolean, hidden: boolean, updatedAt}`. 기록 저장·삭제·언어 변경·잠금 토글 시 쓰고 `WidgetCenter.reloadAllTimelines`. 타임라인은 다음 자정 엔트리 1개 추가. 탭 URL `nuni://entry/today` |
| 공유 카드 | Skia 오프스크린 1080×1920, 워터마크는 `mascot-face` 색 70%, 우하단 `space-4`×2 여백 |
| 언어 변경 | i18next `changeLanguage` → MMKV 저장 → 리마인더 재예약 → 위젯 JSON 재작성 → `Intl` 로케일 갱신. 재시작 불필요 |
| 테마 | `settings.appearance` system / light / dark. MVP에는 판매 테마 없음 |
## 앱 B — Fourpop (포토부스)

오프라인 부스의 긴장감(카운트다운, 제한된 컷 수, 촬영 GIF)을 폰으로 옮기는 것이 핵심이다. 현지 시즌 프레임(뗏, 송끄란, 발렌타인, 졸업)을 정적 CDN으로 계속 추가해 단품 매출을 반복한다. 모든 촬영·합성은 기기 안에서 처리한다.

### 기능 범위 (MVP)

| 기능 | 무료 | 프리미엄 |
| --- | --- | --- |
| 레이아웃 | **1×4 스트립 하나** (2×2·1×3은 v1.1 — 홈에 레이아웃 선택기 없음) | |
| 프레임 | base 10종 | 시즌팩 전체 (단품 구매도 가능) |
| 촬영: 3/5/10초 카운트다운, 포즈 가이드, 전·후면, 미러 | ✓ | |
| 8컷 촬영 후 4컷 고르기, 컷별 재촬영 | ✓ | |
| 앨범에서 4장 골라 합성 (PHPicker, 자동 중앙 크롭) | ✓ | |
| 필터 6종 (Original, Mono, Warm 무료 / Film, Fade, Night 프리미엄) | 3종 | 6종 |
| 꾸미기: 스티커(base 22종), 펜, 텍스트, 날짜 스탬프, Undo, 요소 삭제 | ✓ | 스티커팩 추가 |
| 저장 화질 | 일반 600×1800 + 워터마크 | HD 1200×3600, 워터마크 없음 |
| GIF (8컷, 480px) | | ✓ |
| 공유: 사진 앱 저장, 로케일별 빠른 공유(Zalo / Messenger / Instagram / LINE), 시스템 공유 시트 | ✓ | |
| 갤러리 (앱 내) | ✓ | |
| 친구와 원격 네컷 | v2 (실시간 서버 필요) | |
| 라이브 영상 | 제외 | |

### 화면 목록

| # | 화면 | 핵심 요소 |
| --- | --- | --- |
| B1 | 스플래시 | 로고 + 단색 배경 |
| B2 | 온보딩 (2장) | 2장 + Get started, 마지막 장에 분석 토글. **권한 요청 없음** |
| B3 | 홈 | 시즌 배너(매니페스트 `category: season` 최신 팩, 없으면 숨김), base 프레임 10종 실제 썸네일 5열 2행 + “All frames”, 잠긴 프레임은 B4의 시즌 탭에만. 하단 CTA 2분할: `home.startShooting`(주) + `home.fromAlbum`(보조, 텍스트+아이콘). 헤더 우측 톱니 → B12 |
| B4 | 프레임 선택 | 탭: Basics / Season / Owned. 잠긴 프레임 탭 시 `home.lockedHint` 툴팁 1회, 선택은 허용 |
| B5 | 촬영 | 뷰파인더 화면 폭 전체(3:2 크롭 가이드, 밖은 `overlay`), 상단 `capture.shotOf` + 8칸 진행 도트, 카운트다운 숫자 144px(스케일 인, 0에서 흰 플래시 120ms + 햅틱), 포즈 가이드는 각 컷 시작 1초간 중앙 크게. 시작 전: 타이머 pill, 플래시, 전후면, 미러, 셔터=`capture.start`. 시작 후: 타이머·플래시 숨김, 셔터=`capture.pause`/`resume`. X 탭 시 `capture.stopConfirm`. 백그라운드 전환 시 일시정지, 복귀 시 현재 컷부터 |
| B6 | 컷 고르기 | 8장 그리드, 4장 선택(순서 = 번호 배지). 길게 누르기 → `pick.retakeOne`(그 컷만 B5로 돌아가 1컷 재촬영). `pick.retakeAll`은 보조 텍스트 버튼 + 확인 |
| B7 | 꾸미기 | 상단: Back(→ B6), Undo(44px), Done(44px). 미리보기 최소 240×720(화면 폭 − 여백), 컷 탭 시 그 컷 2배 확대 편집. 도구 5개(필터·스티커·펜·텍스트·날짜)는 하단 탭, 필터·스티커 목록은 바텀시트. 선택 요소에 X(삭제)·회전·크기 핸들 |
| B8 | 결과·공유 | 완성 스트립, 화질 칩(`result.standard` / 잠긴 `hdUpsell` → B11 `?source=hd`), 공유 행(로케일별 4개 + `result.share`), `result.saveToPhotos` 버튼(저장 후 체크 상태 + `result.saved` 토스트), 아래 `result.inGallery`, `result.shootAnother`. 잠긴 프레임이면 블러 오버레이: `paywall.unlockPack`(단품, 결제 중 스트립 메모리 유지) + `paywall.orPremium` + `result.useFreeFrame` |
| B9 | 갤러리 | 앱 내 스트립 날짜별, 탭 → B8(재공유), 스와이프 삭제. 빈 상태 `gallery.empty` + `gallery.emptyCta` |
| B10 | 상점 | 프레임팩·스티커팩, 단품 `shop.unlock`, 구독 배너. 오프라인이면 `shop.offline` + 설치된 팩만 |
| B11 | 페이월 | A9와 같은 구조(혜택 3줄 Fourpop용). `?packId=`가 있으면 단품 카드가 위, 구독이 아래 |
| B12 | 설정 | 언어, 외관, 저장 화질(일반/HD — HD는 프리미엄), 셔터음, 미러 셀피 기본값, 구독·복원, Privacy(분석 토글), 문의, 약관·개인정보·라이선스, 버전 |
| B13 | 약관·개인정보·라이선스 | A13과 동일 |

### 사용자 플로우

1. B3에서 프레임 선택(기본 Classic). 잠긴 프레임도 선택 가능(이미지 1장은 선택 즉시 다운로드, 실패 시 촬영 진입 차단 안내)
2. `home.startShooting` → 카메라 권한 요청(첫 1회, 거부 시 `permission.cameraBody` + 설정 열기) → B5. 또는 `home.fromAlbum` → PHPicker 4장 선택 → 자동 중앙 크롭 → B7 직행
3. B5: Start → 카운트다운 → 8컷 자동 연속 촬영 → B6에서 4컷 선택(컷별 재촬영 가능) → B7 꾸미기
4. B8: `result.saveToPhotos` 첫 탭 시 사진 add-only 권한 요청 → 저장. 공유 행에서 채널 선택
5. 잠긴 프레임: 블러 + 단품 구매(`booth_pack_<id>`) 또는 Premium 또는 무료 프레임으로 교체. 결제 성공 시 그 자리에서 블러 해제
6. 저장된 스트립은 갤러리에도 자동 보관(일반 화질 결과물 + 썸네일). GIF는 사진 앱에만 저장하고 갤러리에는 보관하지 않음

페이월 노출 트리거(`paywall_view.source`): `hd`(결과 화질 칩), `gif`, `filter`(잠긴 필터 탭), `pack`(잠긴 프레임·스티커, 단품 카드 우선), `banner`(시즌 배너), `settings`, `shop`. 세션당 자동 노출은 없다(사용자 탭에만 반응).

### 구현 명세

좌표계: 모든 편집 상태(스티커·펜·텍스트·날짜)는 **프레임 canvas 공간(1200×3600, 원점 좌상단)**에 저장한다. 미리보기·일반 출력·HD 출력은 같은 장면을 scale만 바꿔 Skia 오프스크린으로 렌더한다(일반 = 0.5). 컷은 슬롯에 `cover` 방식으로 중앙 크롭한다. 합성 순서: 배경(`surface-0`) → 각 컷(필터 적용) → 프레임 PNG → 스티커·펜·텍스트 → 날짜 스탬프(기본 captionSlot 좌측) → 워터마크(무료, captionSlot 위 우측, 높이 72, 불투명 70%). 꾸미기 상태는 결과물에 구워지며 재편집은 불가(MVP).

메모리: 촬영 원본은 `Cache/booth-session/<n>.jpg`(긴 변 2400, JPEG 90)로 즉시 저장하고 메모리에는 480px 썸네일만 유지. 합성 시 선택한 4장만 디코드. GIF는 480px 썸네일 8장으로 생성(JS 인코더, 로딩 표시). 세션 종료·다음 실행 시 캐시 폴더 정리. 성능 목표: HD strip4 합성 2초 이내(iPhone 12, 릴리스 빌드, 캐시 워밍 후, `performance.now()`로 측정해 `booth_complete.duration_ms`에 기록).

필터(Skia ColorMatrix 4×5 + 그레인):

| id | 매트릭스 | 그레인 |
| --- | --- | --- |
| original | identity | 0 |
| mono | luma [0.2126 0.7152 0.0722] 3행 반복 | 0 |
| warm | R×1.08, G×1.02, B×0.92, +0.02 R offset | 0 |
| film | 채도 0.85, 대비 1.1, 섀도 +0.03 | 0.06 |
| fade | 대비 0.9, 블랙 +0.08 (리프트), 채도 0.9 | 0.03 |
| night | 채도 0.8, R×0.92, B×1.1, 대비 1.05 | 0.05 |

SQLite 스키마:

```sql
CREATE TABLE strips (
  id TEXT PRIMARY KEY,            -- uuid v7
  created_at INTEGER NOT NULL,
  layout TEXT NOT NULL,           -- 'strip4'
  frame_id TEXT NOT NULL,         -- manifest item id
  pack_id TEXT NOT NULL,
  filter TEXT NOT NULL,
  hd INTEGER NOT NULL DEFAULT 0,  -- 1 = HD로 저장됨
  file_name TEXT NOT NULL,        -- Documents/strips/<id>.jpg (일반 화질 결과물)
  thumb_name TEXT NOT NULL,       -- 300px
  width INTEGER NOT NULL, height INTEGER NOT NULL
);
CREATE INDEX idx_strips_created ON strips(created_at DESC);

CREATE TABLE installed_packs (
  id TEXT PRIMARY KEY,            -- pack id
  manifest_json TEXT NOT NULL,    -- 설치 시점의 Pack JSON 조각 (매니페스트에서 사라져도 로드 가능)
  installed_at INTEGER NOT NULL,
  version INTEGER NOT NULL
);
```

콘텐츠 매니페스트: 스키마와 타입은 디자인 시스템 `assets/README.md`의 `Manifest` 타입이 기준이고, 번들 매니페스트 `assets/manifest.json`(base 프레임 10 + base 스티커 22)이 실제 예시다. CDN(R2)의 `manifest.json`도 같은 스키마.

| 항목 | 규칙 |
| --- | --- |
| 조회 | 앱 시작 시 1회 `GET /manifest.json`(`Cache-Control: no-cache`, `If-None-Match` ETag). 실패 시 MMKV 캐시본, 없으면 번들 매니페스트만 |
| 버전 | `version` 단조 증가, 낮으면 무시. 모르는 `schemaVersion`은 무시하고 캐시본 유지. `minAppVersion`은 루트와 팩 단위 모두 적용(낮으면 그 팩만 숨기고 상점 상단에 `shop.updateApp`) |
| 이미지 경로 | `packs/<id>/<version>/<file>` 불변 경로 + `Cache-Control: immutable`. 번들 팩은 `bundledAssets.ts`의 `id → require()` 정적 맵 |
| 다운로드 | 프레임 선택 시 그 아이템 이미지 1장만(구매 여부 무관). 팩 전체는 구매 후 임시 폴더에 받아 전부 성공 시 `Documents/packs/<id>/`로 원자적 이동. 매니페스트에 `sha256`이 있으면 검증, 실패 시 삭제 후 지수 백오프 3회 |
| 설치 기록 | 구매·다운로드한 팩은 `installed_packs`에 Pack JSON을 저장해 매니페스트에서 숨겨져도(`availableUntil` 경과) 계속 사용 |
| 시즌팩 만료 | 매니페스트에서 삭제하지 않고 `availableUntil`로 상점에서만 숨김 |
| 상품·권한 매핑 | 매니페스트에 `productId`와 `entitlementId`를 **둘 다 명시**(변환 규칙 없음, 둘은 같은 문자열) |
| 썸네일 | 홈·B4·상점은 `thumbnail`만 로드 |

규칙:

| 항목 | 규칙 |
| --- | --- |
| 촬영 | 레이아웃과 무관하게 항상 8컷, 4컷 선택. 전면 카메라 결과는 미러 ON 기본(`settings.mirrorSelfie`). 셔터음은 설정으로 끌 수 있음(지역 법규상 iOS가 강제하는 경우 제외) |
| 앨범 가져오기 | PHPicker 4장 다중 선택(권한 불필요) → 자동 중앙 크롭(조정 UI 없음) → B7 |
| 워터마크 | “Fourpop” 워드마크, `mascot-face` 색 70%, 캡션 영역 위 우측(프레임 README 좌표). HD 저장 시 제거 |
| 사진 저장 | `expo-media-library` `addOnly` 권한, 카메라 롤에 저장(전용 앨범 없음). 권한 거부 시 `permission.photosBody` + 설정 열기, 앱 내 갤러리에는 이미 저장됨을 안내 |
| 공유 행 | vi: Save · Zalo · Messenger · Instagram · Share / th: Save · LINE · Instagram · Share / en 외: Save · Instagram · Share. 각 앱은 `canOpenURL`로 설치 확인, 미설치면 숨김. Zalo·Messenger·LINE은 이미지 파일을 시스템 공유 시트에 해당 앱 사전 선택으로 전달(직접 SDK 없음). Instagram은 `instagram-stories://share` URL scheme + 배경 이미지 |
| 날짜 스탬프 | `decorate.dateFormats` 3가지 중 선택(기본 첫 번째, `dd/MM/yyyy`), 서기 연도 |
| GIF | 프리미엄. 8컷 0.4초 간격 480px 루프, 사진 앱에만 저장 |
| 갤러리 | 결과물 일반 화질 + 300px 썸네일 + 메타를 `strips`에. 삭제 시 파일 먼저 삭제 |
| 시즌 배너 | `category: season` 팩 중 `availableFrom ≤ 오늘 ≤ availableUntil`인 최신 팩. 없으면 배너 숨김 |
## 다국어·현지화

번역만으로는 부족하다. 텍스트 길이, 폰트, 달력, 시즌 테마까지 현지 기준으로 맞춘다. vi·th 문구는 초안으로 출시하고 리뷰·TestFlight 피드백으로 고친다.

| 항목 | 베트남 (vi) | 태국 (th) |
| --- | --- | --- |
| 텍스트 길이 | 영어보다 20~30% 길어짐. 버튼 두 줄 허용, 말줄임 금지 | 띄어쓰기 없음 → 줄바꿈 깨짐 점검, 상하 모음 부호로 행간 여유 |
| 폰트 | Be Vietnam Pro (400/600/700) | Prompt (400/600/700), `th-*` 타이포 스타일로 치환 |
| 날짜 | `dd/MM/yyyy`, 월요일 시작 | `dd/MM/yyyy`, 월요일 시작, **서기 연도**(불기 미사용) |
| 시즌 테마 | 뗏(음력 설), 3/8 여성의 날, 20/10 베트남 여성의 날, 중추(Trung Thu), 20/11 스승의 날, 졸업 | 송끄란(4월), 로이끄라통(11월), 발렌타인, 졸업, 연말 |
| 문화 포인트 | 3/8·20/10은 선물·사진 수요가 큰 날 | 요일별 행운의 색 문화 → 추후 Nuni ‘오늘의 색’ 테마 아이디어 |
| 공유 채널 | Zalo, Messenger, Instagram | LINE, Instagram, TikTok(공유 시트) |
| 결제 | Apple ID에 MoMo 지갑 연결 가능 | Apple 결제 수단 현지 지원 범위 확인(미확정 표) |
| 개인정보 | 개인정보보호 시행령 13/2023 대응 | PDPA 대응 |

앱 언어 설정: 기본값은 시스템 언어를 따르고, 설정 화면에서 Tiếng Việt · ไทย · English 세 가지 중 고를 수 있다. 언어 이름은 각 언어로 표기한다. 시스템 언어가 이 세 가지가 아니면 English. 한국어는 `preview` 빌드에서만 켠다. Info.plist에 지원 언어를 선언해 iOS 설정의 앱별 언어 변경도 지원한다. 권한 팝업 문구(`NSCameraUsageDescription` 등)는 `app.json` `locales`에 넣고 iOS 기준 언어를 따른다. 변경 시 처리 순서는 ‘앱 A 구현 명세 › 언어 변경’.

스토어 메타데이터는 언어별로 따로 만든다(디자인 시스템 `store/nuni.md`, `store/fourpop.md`). 대문자 변환(`textTransform`)은 쓰지 않는다.

## 수익 모델과 가격

현지 경쟁앱보다 약간 낮게 시작한다. Nuni는 구독 중심, Fourpop은 시즌팩 단품 중심이다. 아래는 제안 가격이며 App Store Connect의 가까운 가격 포인트로 맞춘다. Nuni 단품(스킨)은 MVP에서 판매하지 않는다.

| 앱 | 상품 | 유형 | 베트남 | 태국 |
| --- | --- | --- | --- | --- |
| Nuni | 프리미엄 월간 | 자동갱신 구독 | 29,000đ | ฿49 |
| Nuni | 프리미엄 연간 (7일 무료체험) | 자동갱신 구독 | 199,000đ | ฿349 |
| Fourpop | 프리미엄 월간 | 자동갱신 구독 | 49,000đ | ฿99 |
| Fourpop | 프리미엄 연간 | 자동갱신 구독 | 299,000đ | ฿590 |
| Fourpop | 시즌 프레임팩 | 비소모성 | 25,000đ | ฿35 |
| Fourpop | 스티커팩 | 비소모성 | 25,000đ | ฿35 |

- App Store Small Business Program 신청 시 수수료 30% → 15%.
- 비소모성 단품은 ‘구매 복원’ 버튼이 필수다(심사 가이드라인 3.1.1).
- 페이월 안에 가격, 기간, 자동갱신 안내 문구를 직접 보여야 한다(3.1.2). 이 문구는 외부 페이지로 대신할 수 없다. 약관·개인정보처리방침은 앱 내 화면(A13·B13)으로 연결하고, App Store Connect용 웹 페이지 1개(P21)를 따로 둔다.
- 체험 자격이 없는 사용자(이미 체험함)에게는 `afterTrial` 대신 `noTrial` 문구(`checkTrialOrIntroductoryPriceEligibility`).

### 페이월 고지 문구

페이월 하단에 선택한 상품의 이름·가격·기간을 먼저 보여주고, 그 아래 `common.paywall.legal`(en·vi·th)을 둔다. 가격은 RevenueCat이 내려주는 현지 통화 값을 쓰고 하드코딩하지 않는다. 무료체험이 있는 상품은 “체험 기간이 끝나면 {{price}}/{{period}}로 자동 결제” 문구를 가격 바로 아래에 크게 표시한다.

### 약관·처리방침 화면

디자인 시스템 `legal/terms-en.md`, `privacy-en.md`를 번들해 A13·B13에서 렌더(MVP는 en만). 같은 본문을 P21 웹 페이지에 올리고, App Store 개인정보 라벨은 `legal/README.md`의 매핑표와 일치시킨다.

### 상품 ID와 권한

App Store Connect와 RevenueCat에 같은 ID를 쓴다. 코드는 상품 ID가 아니라 권한(entitlement)으로 잠금을 판단한다. 규칙: **entitlementId == productId**(단품), 구독은 앱별 하나.

| 앱 | 상품 ID | 유형 | 권한 | RevenueCat Offering |
| --- | --- | --- | --- | --- |
| Nuni | `mood_premium_monthly` | 구독 | `mood_premium` | `default` |
| Nuni | `mood_premium_yearly` | 구독, 7일 체험 | `mood_premium` | `default` |
| Fourpop | `booth_premium_monthly` | 구독 | `booth_premium` | `default` |
| Fourpop | `booth_premium_yearly` | 구독 | `booth_premium` | `default` |
| Fourpop | `booth_pack_<id>` (예 `booth_pack_tet_2027`) | 비소모성 | 같은 문자열 | — (`getProducts([id])`로 조회) |
| Fourpop | `booth_stickers_<id>` | 비소모성 | 같은 문자열 | — |

MVP에서 등록하는 단품은 출시 시점 시즌팩 1개(출시 직후 가장 가까운 현지 행사)와 스티커팩 0개. `<id>`는 소문자·언더스코어만(매니페스트 팩 id가 하이픈이면 `productId`에 언더스코어 형태를 **명시**해 둔다, 자동 변환 금지).

결제 코드 규약:

- `packages/purchases`가 앱 루트 `_layout`에서 `Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_IOS_KEY_* })`, 익명 appUserID.
- 1차 소스는 SDK `CustomerInfo`(`addCustomerInfoUpdateListener` → Zustand `entitlements`). MMKV `rc.entitlements.v1`은 `{ [entitlementId]: expiresAt | null }` 미러. 비소모성은 `null`(영구), 구독은 `expiresAt + 3일 유예`가 지나면 오프라인에서도 잠금. 앱 포그라운드 복귀 시 `getCustomerInfo` 재조회.
- 구독 사용자는 모든 팩을 쓸 수 있고, 구독이 끝나도 단품으로 산 팩은 유지.
- 로그인이 없으므로 재설치 후에는 ‘구매 복원’이 유일한 경로. 설정과 페이월 양쪽에 둔다.
- P15·P16(App Store Connect) 완료 전에는 Xcode StoreKit Configuration(`.storekit`) + RevenueCat Test Store로 S1 완료 조건을 대체한다.
- P17 산출물에 API 키 외에 App Store In-App Purchase Key(.p8), Shared Secret, App Store Server Notifications URL 등록이 포함된다.

### 분석 이벤트

이벤트 이름은 `snake_case`, 공통 파라미터는 `locale`, `app_version`. 개인 식별 정보, 일기 본문, 태그 이름, **감정 값(`mood`)**은 보내지 않는다. 분석 동의(`settings.analytics`)가 꺼지면 `setAnalyticsCollectionEnabled(false)`. 광고 개인화 신호는 plist 플래그로 끈다.

| 이벤트 | 앱 | 파라미터 | 묻는 질문 |
| --- | --- | --- | --- |
| `onboarding_complete` | 공통 | `analytics_opt_in` | 온보딩 이탈률 |
| `paywall_view` | 공통 | `source` (Nuni: year / lifts / backup / widget / tag / photo / note / share / settings; Fourpop: hd / gif / filter / pack / banner / settings / shop) | 페이월 도달 경로 |
| `purchase_start` / `purchase_success` / `purchase_fail` | 공통 | `product_id`, `error_code` | 결제 전환율 |
| `entry_create` | Nuni | `tag_count`, `has_photo`, `has_note`, `source` (fab / widget / notification / calendar) | 핵심 활성 행동 |
| `streak_milestone` | Nuni | `days` (3/7/30) | 리텐션 |
| `share_card` | Nuni | `period` | 바이럴 |
| `booth_start` | Fourpop | `frame_id`, `pack_id`, `source` (camera / album) | 핵심 활성 행동 |
| `booth_complete` | Fourpop | `frame_id`, `filter`, `hd`, `duration_ms` | 촬영 완주율, 성능 |
| `booth_share` | Fourpop | `channel` (photos / zalo / messenger / line / instagram / system / gif) | 바이럴 |
| `pack_view` / `pack_unlock` | Fourpop | `pack_id`, `method` (single / premium) | 어떤 팩이 팔리나 |
| `permission_denied` | 공통 | `type` (camera / photos / notifications) | 권한 이탈 |

핵심 지표: 다운로드 → 첫 기록(또는 첫 촬영 완주) 전환율, 7일 리텐션, 페이월 → 결제 전환율, 국가별 ARPU.
## 예외 상황과 상태 처리

모든 화면은 로딩, 빈 상태(디자인 시스템의 빈 상태 컴포넌트 + 마스코트/일러스트), 에러의 세 가지 상태를 가진다. 에러 문구는 무엇이 잘됐는지와 다음 행동을 한 줄로 말한다(`common.error.*`). 아래 표의 항목은 각각 재현 가능해야 하며, 완료 기준의 Maestro 플로우나 유닛 테스트 중 하나에 묶인다.

| 상황 | 앱 | 처리 |
| --- | --- | --- |
| 카메라·사진 권한 거부 | Fourpop | 권한은 사용 시점에 요청한다(온보딩에서 미리 묻지 않음). 거부 시 `permission.cameraTitle/Body` 안내 + ‘설정 열기’. 앨범 가져오기 경로는 계속 제공 |
| 사진 접근이 ‘선택한 사진만’(limited) | Fourpop | 저장은 `addOnly` 권한만 쓰므로 영향 없음. 가져오기는 PHPicker라 권한 불필요. limited 안내 배너를 띄우지 않는다 |
| 카메라 없는 기기(시뮬레이터, 일부 iPad 상태) | Fourpop | `Camera.isAvailableAsync()` false → B5 대신 `error.cameraUnavailable` + 앨범 가져오기 버튼. 개발용 mock 카메라는 `EXPO_PUBLIC_MOCK_CAMERA=1`일 때 번들 샘플 4장을 내보낸다 |
| 알림 권한 거부 | Nuni | 앱은 정상 동작. 설정의 리마인더 행에 `permission.notificationsOff` + ‘설정 열기’ |
| 오프라인 | 공통 | 기록·촬영·꾸미기·저장 전부 동작. 상점은 캐시된 매니페스트 표시 + 상단 ‘오프라인’ 배너. 결제 버튼은 비활성 + `error.purchaseOffline` |
| 결제 도중 오프라인·앱 종료 | 공통 | RevenueCat이 미완료 트랜잭션을 다음 실행 때 마무리한다. 앱은 포그라운드 복귀 시 `getCustomerInfo`로 권한을 다시 읽고, 성공했으면 토스트 `paywall.purchaseSuccess` |
| 매니페스트 다운로드 실패·JSON 파싱 실패 | Fourpop | 직전 성공본(MMKV `manifest.cache.v1`) 사용, 없으면 번들 `assets/manifest.json`. 실패는 Crashlytics non-fatal로만 기록 |
| `minAppVersion` 미달 팩 | Fourpop | 상점 상단에 `error.updateRequired`, 해당 팩은 목록에서 숨김 |
| 팩 다운로드 중 실패 | Fourpop | zip은 임시 경로에 받고 검증 후 `packs/<id>/`로 이동한다. 실패 시 임시 파일 삭제, 팩 카드에 ‘다시 시도’ |
| 결제 실패·사용자 취소 | 공통 | 취소(`userCancelled`)는 조용히 돌아가기. 실패는 `paywall.purchaseFailed` 토스트 + 재시도. `purchase_fail` 이벤트에 `error_code` |
| 구매 복원했는데 권한 없음 | 공통 | `settings.restoreNone` 안내. 실패로 취급하지 않는다 |
| 구독 만료 | 공통 | `expiresAt + 3일 유예` 뒤 프리미엄 잠김. Nuni: 이미 쓴 사진·메모·태그는 그대로 열람·수정 가능, 새 기록에서만 제한. 연간 통계·공유 카드는 잠김 카드로 바뀜. Fourpop: 단품으로 산 팩은 유지, 구독으로만 쓰던 팩은 잠김 표시(설치본은 삭제하지 않음). 만든 결과물은 그대로 |
| 구독 유예 기간(billing retry) | 공통 | RevenueCat `entitlements.active`가 유지되는 동안은 정상. 만료로 전환되면 위 규칙 |
| 저장 공간 부족 | 공통 | 저장 시점에 예외를 잡아 `error.storageFull`. 작업 내용은 메모리에 유지하고 시트를 닫지 않는다 |
| 저장(합성) 중 앱 종료 | Fourpop | 합성은 임시 파일에 쓰고 성공 후에만 `strips` 행을 넣는다. 다음 실행 시 `tmp/` 정리 |
| 촬영 도중 앱 종료 | Fourpop | 세션 버림. 원본은 다음 실행 시 임시 폴더 정리 |
| 기록 시트가 열린 채 자정을 넘김 | Nuni | 시트가 열릴 때의 `date`를 유지한다(사용자가 그 날에 대해 쓰기 시작했으므로). 저장 후 홈은 새 날짜로 갱신 |
| 기기 시간대 변경 | Nuni | `date`는 작성 시점 현지 날짜 문자열로 고정, 재계산하지 않음 |
| 같은 날 여러 기록 | Nuni | 캘린더는 마지막 기록의 감정, 상세에서 전부 나열 |
| 앱 잠금 실패(Face ID 불가) | Nuni | 생체 인증 실패·미등록 시 4자리 패스코드로 폴백. 패스코드 분실은 복구 수단이 없음을 설정에서 미리 안내 |
| iCloud 백업 불가(미로그인·용량 부족) | Nuni | `FileManager.url(forUbiquityContainerIdentifier:)`가 nil이면 설정 백업 행에 ‘iCloud에 로그인하면 자동 백업’ 안내. 백업은 기능이 아니라 안전장치이므로 실패해도 토스트만 |
| DB 마이그레이션 | 공통 | Drizzle 마이그레이션(앞으로만). 실행 전 `VACUUM INTO 'backup-<version>.db'`. 실패하면 백업을 복구하고 Crashlytics에 기록, 앱은 읽기 전용 모드로 열린다 |
| Dynamic Type | 공통 | 본문·설정은 큰 글씨 2단계(AX1)까지 대응. 촬영·꾸미기 화면은 고정 크기, 결과 화면은 대응 |
| 화면 회전·크기 변화(iPad) | 공통 | 레이아웃은 `useWindowDimensions` 기준으로 매 렌더 계산. 촬영 중 회전은 세션을 유지하고 프리뷰만 재배치 |

## 완료 기준과 제출 체크리스트

각 앱은 아래 기준을 모두 충족할 때 MVP 완료로 본다. 측정 방법이 적힌 항목은 그 방법으로만 판정한다. Claude Code는 미완성 항목을 표시해서 보고한다.

완료 기준:

- [ ] 화면 목록의 모든 화면이 있고, Maestro 플로우(Nuni: `onboarding`, `entry-create`, `paywall-restore`; Fourpop: `onboarding`, `booth-complete`, `pack-unlock`)가 iPhone·iPad 시뮬레이터에서 통과한다
- [ ] 모든 인터랙티브 요소에 `testID`가 있다(규칙: `<screen>.<element>`, 예 `a4.save`)
- [ ] vi·th·en 세 언어로 Maestro 플로우를 돌렸고, 스크린샷에서 잘린 문구·말줄임이 없다(언어 전환은 `EXPO_PUBLIC_FORCE_LOCALE`로 고정)
- [ ] StoreKit Configuration(P15·P16 전) 또는 Sandbox 계정(후)으로 구독·단품·복원·만료·체험 자격 없음을 검증했다
- [ ] 비행기 모드에서 핵심 플로우가 동작한다
- [ ] 예외 상황 표의 항목이 각각 재현·확인되었다(표의 행 번호를 PR 설명에 적는다)
- [ ] 콜드 스타트(앱 아이콘 탭 → 첫 화면 인터랙션 가능)가 iPhone 12 실기기 Release 빌드에서 Instruments App Launch 5회 중앙값 2초 이내
- [ ] Fourpop 고화질 합성(2400×7200)이 iPhone 12에서 2초 이내, 메모리 피크 300MB 이하(Instruments Allocations)
- [ ] 분석 이벤트가 Firebase DebugView에 표의 이름·파라미터대로 들어오고, `mood`·본문·태그 이름이 어떤 이벤트에도 없다
- [ ] Crashlytics 크래시 없는 사용자 비율 99.5% 이상으로 TestFlight 1주
- [ ] 유닛 테스트: 연속 기록 계산, 권한(entitlement) 판단, 합성 좌표 변환, 매니페스트 병합, 날짜 포맷(vi/th/en) 각각
- [ ] 약관·개인정보 화면과 페이월 고지 문구에 `[TERMS URL]`, `[PRIVACY URL]`, `[EFFECTIVE DATE]` 자리표시자가 남아 있지 않다(빌드 스크립트에서 grep으로 실패 처리)
- [ ] 접근성: VoiceOver로 온보딩 → 핵심 플로우 1회 완주, 모든 아이콘 버튼에 `accessibilityLabel`

App Store 제출 체크리스트:

- [ ] 유료 앱 계약, 세금 양식, 은행 계좌 등록(처리에 수 일)
- [ ] Small Business Program 신청
- [ ] 번들 ID `app.nuni.mood`, `app.fourpop.booth`; iPad 지원 체크(`supportsTablet: true`)
- [ ] 개인정보처리방침 URL, 고객지원 URL(P21), 지원 이메일 nunicozy@gmail.com
- [ ] 개인정보 라벨: `legal/README.md` 매핑표대로 — 식별자·사용 데이터·구매 내역을 ‘사용자와 연결되지 않은 데이터’로, 일기·사진은 ‘수집하지 않음’
- [ ] 연령 등급 4+
- [ ] 수출 규정: `ITSAppUsesNonExemptEncryption = NO`
- [ ] Info.plist 권한 문구(카메라, 사진 추가, 알림, Face ID) vi·th·en + 기본 en
- [ ] 언어별 메타데이터(vi, th, en) + iPhone 6.9인치·iPad 13인치 스크린샷 각 언어 6장
- [ ] 심사 노트: 구독 테스트 방법, 로그인 없음 설명, 자체 브랜드·현지화 차별점(4.1 카피캣 대비)
- [ ] 일반 출시 국가: 베트남·태국만
- [ ] TestFlight 외부 테스터에 현지 사용자 3명 이상

## 개발 전 준비 (Claude Code 작업 시작 조건)

‘여기서’는 이 대화(Claude)에서 만들었다는 뜻이고, ‘Cozy’는 계정·결제가 필요해 직접 해야 하는 것이다. Claude Code는 상태가 ‘완료’가 아닌 항목에 의존하는 작업을 시작하지 않고 질문한다. 보류 항목(P15·P16)이 있어도 S1·S2·S4는 StoreKit Configuration으로 진행할 수 있다.

| # | 항목 | 담당 | 산출물 | 상태 |
| --- | --- | --- | --- | --- |
| P1 | 마스코트 모티브·비주얼 톤 결정 | Cozy | 마스코트 = 구름, 톤 = 파스텔 미니멀 | 완료 |
| P2 | 디자인 시스템 (공유 토큰 v2 + 앱별 액센트) | 여기서 | [Nuni & Fourpop Design System](https://claude.ai/artifact/YPYbEiwv6wy8QHb3Tmyccs) — `tokens.json`(on-accent, mascot-face, camera-*, status-*, 레이아웃·모션 토큰, 태국어 타이포), README(소비 규칙·컴포넌트·라이선스) | 완료 (v2) |
| P3 | Nuni 아이콘·스플래시 | 여기서 | 시안 B 확정. 디자인 시스템 `assets/app-icons/`, `assets/splash/`. [시안 캔버스](https://claude.ai/artifact/E7Z4J9agNiKTnNmVeP9Pv2) | 완료 |
| P4 | Fourpop 아이콘·스플래시 | 여기서 | 시안 B 확정. 같은 폴더 | 완료 |
| P5 | Nuni 마스코트 표정 5종 (벡터) | 여기서 | `assets/mascot/nuni-mood-1~5.svg` + `-sm` 5종(작은 크기용). 색은 토큰 `mood-*`·`mascot-face` | 완료 (v2) |
| P6 | Nuni 핵심 화면 목업 (A3, A4, A6, A9) | 여기서 | [Nuni 화면 목업](https://claude.ai/artifact/KHD32DNRxpo1p1RhmUS39m). 문구는 en 원문. 검수 반영 사항은 화면 목록 표가 우선 | 완료 |
| P7 | Fourpop 핵심 화면 목업 (B3, B5, B7, B8) | 여기서 | [Fourpop 화면 목업](https://claude.ai/artifact/Uc9rE1yc21PzThBuXao8F5). 검수 반영 사항은 화면 목록 표가 우선 | 완료 |
| P8 | Fourpop 기본 프레임 10종 | 여기서 | `assets/frames/base/` 10종(1200×3600 PNG + 썸네일), 규칙은 폴더 README. 목록은 `assets/manifest.json` | 완료 (v2) |
| P9 | 온보딩 일러스트 (Nuni 3, Fourpop 2) | 여기서 | `assets/onboarding/` SVG 5종 + 폴더 README | 완료 (v2) |
| P10 | i18n 문구 원문 (en) 전체 키 | 여기서 | `i18n/{common,nuni,fourpop}/en.json` (92 + 121 + 110 키). 규칙은 `i18n/README.md` | 완료 (v2) |
| P11 | vi·th 번역 초안 | 여기서 | `i18n/*/vi.json`, `th.json`. 네이티브 검수 생략, 초안으로 출시 후 리뷰·TestFlight 피드백으로 보완 | 완료 (검수 생략) |
| P12 | 이용약관·개인정보처리방침 본문 (en) | 여기서 | `legal/terms-en.md`, `privacy-en.md`. 퍼블리셔 Chagyung, nunicozy@gmail.com, Seoul 반영. 자리표시자는 `[EFFECTIVE DATE]`만 남음 | 완료 (법률 검토 전) |
| P13 | 스토어 메타데이터 3언어 + 스크린샷 | 여기서 | `store/nuni.md`, `store/fourpop.md`. 스크린샷은 TestFlight 빌드에서 캡처(S3/S5) | 문구 완료, 스크린샷 대기 |
| P14 | Apple Developer Program | Cozy | Team ID | 완료 |
| P15 | App Store Connect: 앱 2개 등록, 유료 앱 계약·세금·은행 | Cozy | 앱 ID, 계약 활성 | 보류 (계정 이슈) |
| P16 | 인앱 상품 등록 (상품 ID 표) | Cozy | 상품 승인 | 보류 (P15 뒤) |
| P17 | RevenueCat 계정, 앱 2개, Offering·Entitlement | Cozy | iOS API 키 2개, In-App Purchase Key(.p8), Shared Secret | 대기 |
| P18 | Firebase 프로젝트 2개 (Analytics, Crashlytics) | Cozy | `GoogleService-Info.plist` 2개 | 대기 |
| P19 | Cloudflare R2 버킷 + 공개 URL | Cozy | CDN base URL | 대기 |
| P20 | 도메인 | Cozy | 보유 도메인 있음(주소는 Cozy가 Claude Code에게 전달). P21 페이지를 이 도메인 아래 배포 | 완료 |
| P21 | 개인정보처리방침·지원 웹 페이지 | Claude Code | `web/legal/` 정적 페이지 2개 + URL (S1에서 제작) | 대기 |
| P22 | GitHub 리포 + Expo(EAS) 프로젝트 | Cozy | 리포 URL, EAS project ID | 대기 |
| P23 | 퍼블리셔 이름 | Cozy | Chagyung. 약관·개인정보처리방침에 반영됨 | 완료 |
| P24 | Fourpop 기본 스티커 22종 | 여기서 | `assets/stickers/base/` 512×512 PNG 22종 + `pack.json`, 규칙은 폴더 README | 완료 |

비밀 값(API 키, plist, .p8)은 이 문서에 적지 않고 EAS Secrets와 `.env`로 전달한다. 디자인 시스템의 파일을 코드로 옮기는 규칙(토큰 → 테마 객체, 매니페스트 → 번들, i18n JSON → `packages/i18n`)은 디자인 시스템 README ‘소비 방법’ 표를 따른다. 레퍼런스 앱의 이름·캐릭터·아이콘 형태·레이아웃은 쓰지 않는다(심사 가이드라인 4.1).

## 진행 단계와 리스크

날짜 일정은 두지 않는다. 개발은 준비가 완료된 순서대로 바로 진행하고, 아래 단계만 지킨다. 각 단계는 앞 단계의 완료 조건이 충족돼야 시작한다.

| 단계 | 내용 | 완료 조건 |
| --- | --- | --- |
| S0 준비 | ‘개발 전 준비’ 표 중 Claude Code가 막히는 항목(P2–P13, P20, P22, P24) | 해당 항목 완료. P15–P19는 S1에서 StoreKit Configuration·더미 키로 대체 가능 |
| S1 공통 패키지 | 모노레포, `packages/ui`(토큰·컴포넌트), `i18n`, `purchases`, `analytics`, `db`, `content`, `web/legal` | 더미 앱에서 언어 전환·페이월 표시·StoreKit 결제·복원이 동작하고, 컴포넌트 스토리 화면이 iPhone·iPad에서 렌더된다 |
| S2 Nuni 개발 | 화면 A1–A13 + 위젯, 구현 명세, 예외 처리 | 완료 기준 전부 충족 |
| S3 Nuni 출시 | TestFlight → 심사 → 베트남·태국 일반 출시 | 스토어 공개. P13 스크린샷 완료 |
| S4 Fourpop 개발 | 화면 B1–B13, 구현 명세, 기본 프레임 10·스티커 22 탑재 | 완료 기준 전부 충족 |
| S5 Fourpop 출시 | TestFlight → 심사 → 일반 출시 | 스토어 공개 |
| S6 운영 | 시즌 프레임팩 추가(CDN만), 리뷰 대응, RevenueCat Paywalls로 페이월 A/B, vi·th 문구 보완 | 반복 |
| v1.1 | Fourpop 2×2·1×3 레이아웃, Nuni 스킨 | 별도 기획 |
| v2 | 원격 네컷, 안드로이드 빌드 | 별도 기획 |

S2와 S4는 같은 공통 패키지를 쓰므로 Fourpop은 Nuni보다 빨리 끝날 것으로 본다. Fourpop 첫 시즌팩은 출시 시점에 가장 가까운 현지 행사(뗏, 송끄란, 발렌타인 등)에 맞춰 만든다.

| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| 심사 리젝 (4.1 카피캣, 4.3 스팸, 3.1.2 구독 고지) | 출시 지연 | 자체 브랜드·마스코트, 현지화·시즌 테마를 심사 노트에 명시. 페이월 고지 문구는 앱 안에 전부 표시 |
| 현지어 품질 (네이티브 검수 없음) | 리뷰 하락, 전환 하락 | 문구는 짧고 평이하게. 출시 후 리뷰·TestFlight 피드백 반영을 S6 반복 작업으로 고정 |
| 낮은 결제 전환 | 매출 부진 | 저가 단품, RevenueCat Paywalls A/B(S6) |
| 프레임·스티커 IP | 저작권 분쟁, 삭제 | 아이돌 사진·캐릭터·로고 사용 금지. 폰트는 OFL, 아이콘은 Phosphor(MIT) |
| 로컬 데이터 유실 | 일기 사용자 이탈 | iCloud Drive 스냅샷(무료), JSON·이미지 내보내기 무료 |
| 메모리 (Fourpop 고화질 합성) | 구형 기기 크래시 | 원본 2048px 제한, 합성은 Skia 오프스크린 1회, 완료 기준에 피크 300MB |
| 네이티브 모듈 의존 (expo-apple-targets 위젯, iCloud 커스텀 모듈) | 빌드 실패·일정 지연 | 위젯은 MVP에서 실패 시 v1.1로 미룸(기능 범위 표에 ‘선택’ 표시). iCloud 모듈은 Expo Modules API로 100줄 이내 |
| App Store Connect 계정 이슈 (P15) | 결제 검증·제출 지연 | 개발은 StoreKit Configuration으로 진행, 제출 전까지 해결 |
| 1인 운영 범위 초과 | 출시 미루어짐 | MVP 범위 고정, 레이아웃 추가·스킨·원격 네컷은 v1.1/v2 |
| 해외 세금·계약 | 정산 지연 | App Store Connect 계약·세금·은행 정보 먼저 완료 |

## 미확정 사항

아래는 Cozy가 결정해야 하는 항목이다. **이 항목들은 개발을 막지 않으며 배포 전에 해결한다.** Claude Code는 이 항목을 추측하지 않고 자리표시자(`[EFFECTIVE DATE]`, `[DOMAIN]`, `[FIRST_SEASON_PACK_ID]` 등)로 두고 개발을 계속한다. Cozy가 “배포”, “출시”, “심사 제출”, “TestFlight 외부 배포”를 요청하면 Claude Code는 먼저 `docs/RELEASE_CHECKLIST.md`를 열어 완료되지 않은 항목을 전부 알려주고, 해결되기 전에는 제출 단계로 넘어가지 않는다. 결정된 항목은 표에서 지웠다(퍼블리셔 Chagyung, 마스코트 구름, 번역 검수 생략, 웹 페이지 위치 보유 도메인, 앱 이름 Nuni·Fourpop).

| # | 항목 | 초기값 제안 | 결정 필요 시점 |
| --- | --- | --- | --- |
| 1 | 개발자 계정 종류 | 개인(추후 법인 전환 고려) | P15 진행 시 |
| 2 | 첫 출시 국가 | 베트남 + 태국 동시 | 1.0 제출 시 |
| 3 | Fourpop 첫 시즌팩 id·테마 | 출시 시점에 가장 가까운 행사(예 `tet_2027`) | S4 시작 전 |
| 4 | 태국 App Store 결제 수단 현지 지원 범위 | 신용카드·선불카드 기본, 통신사 결제 여부 확인 | S5 전 |
| 5 | 약관·개인정보처리방침 시행일 `[EFFECTIVE DATE]` | 1.0 제출일 | 제출 전 |
| 6 | 보유 도메인 주소 | — | S1 `web/legal` 배포 전 |
| 7 | 원격 네컷(v2) 실시간 백엔드 | Supabase Realtime 또는 Firebase | v2 착수 전 |
| 8 | 세금·정산 은행 | — | P15 |
