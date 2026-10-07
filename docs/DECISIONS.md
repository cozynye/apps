# 결정 기록

문서(PLAN)에 없거나 모호해서 Claude Code가 정한 것. 형식: `날짜 — 결정 — 이유`. 되돌리기 어려운 결정은 Cozy 확인 후 기록.

## 기획 단계에서 이미 정한 것 (2026-10-07)

- 2026-10-07 — 패키지 매니저 pnpm workspaces + `node-linker=hoisted` — RN 네이티브 모듈 호환
- 2026-10-07 — 카메라 expo-camera (vision-camera 사용 안 함) — 실시간 프레임 처리 불필요
- 2026-10-07 — 페이월 자체 구현, RevenueCat은 Offering·가격만 — 고지 문구를 앱 안에 둬야 함
- 2026-10-07 — Fourpop MVP 레이아웃 1×4만, Nuni 스킨 상점 v1.1 — 1인 MVP 범위
- 2026-10-07 — 미확정 사항은 배포 전 해결, 개발 중에는 자리표시자 — Cozy 결정
- 2026-10-07 — vi·th 네이티브 검수 생략, 초안으로 출시 후 보완 — Cozy 결정

## 개발 중 결정

- 2026-10-07 — GitHub 리포(P22)·도메인 없이 S1 진행. CI 워크플로 파일과 `web/legal` 페이지는 만들되 실행·배포는 리포·도메인 수령 후 — Cozy: 당장 배포 안 함
- 2026-10-07 — S1 결제 검증은 RevenueCat Test Store 키(`test_`)로 진행. production 빌드에는 실제 iOS 키(`appl_`)로 교체 필수 — App Store Connect(P15) 보류 중에도 구매·복원 흐름 검증 가능
- 2026-10-07 — Expo SDK 57 (expo 57.0.27, RN 0.86.3, React 19.2.3, TypeScript 6.0) — 시작 시점 최신 안정판
- 2026-10-07 — 워크스페이스 패키지 이름 `@nf/{ui,i18n,purchases,analytics,content,db}`, 빌드 없이 `src/index.ts`를 직접 import — Metro가 TS 소스를 처리하므로 빌드 단계 불필요
- 2026-10-07 — `.env`는 루트 하나만 둔다. 앱 스크립트가 `node --env-file-if-exists=../../.env`로 Expo CLI를 실행 — Expo CLI는 앱 폴더의 `.env`만 읽기 때문
- 2026-10-07 — Primary 버튼 라벨은 `on-accent` (README 컴포넌트 표의 `ink`가 아님) — 원칙 3, 다크 모드에서 `ink`는 밝아져 주 색 위에서 안 읽힘
- 2026-10-07 — 태국어 body 행간은 tokens `th-body` 15/24를 따름 (i18n README의 “22 그대로”와 충돌) — 토큰이 더 구체적
- 2026-10-07 — 토큰 `caption`(weight 500)은 SemiBold 폰트로 매핑 — 번들 폰트는 400/600/700 6개뿐(PLAN)
- 2026-10-07 — 태국어 `body-strong`은 th-body 행간(24) + Prompt SemiBold, th-* 정의가 없는 스타일은 Prompt로만 교체 — tokens에 th-body-strong 없음
- 2026-10-07 — 폰트 TTF 6개는 google/fonts 저장소(OFL)에서 받아 `packages/ui/fonts/`에 커밋 — design/에 폰트 파일 없음
- 2026-10-07 — 마스코트·온보딩 SVG는 design-sync가 라이트 토큰 hex를 토큰 참조로 바꾼 TS 함수로 생성(`svgs[name](colors)`) — 테마(다크) 자동 대응, SVG 트랜스포머 불필요. 얼굴색 hex는 `mascot-face`로 매핑
- 2026-10-07 — 아이콘 라이브러리 `phosphor-react-native` 추가 — 디자인 시스템이 Phosphor Regular(MIT) 지정. 번들 크기 때문에 아이콘별 경로로 require
- 2026-10-07 — Dynamic Type 최대 배율 1.65 (`maxFontSizeMultiplier`) — PLAN ‘AX1까지’, iOS body 17pt→AX1 28pt 비율
- 2026-10-07 — 바텀시트는 expo-router `formSheet`(네이티브 그래버) 사용, 별도 BottomSheet 컴포넌트 없음 — 가장 단순. 탭 바 컴포넌트는 탭이 생기는 S2에서 작성
- 2026-10-07 — 언어 이름(Tiếng Việt · ไทย · English)은 i18n 파일이 아니라 코드 상수 — 모든 UI 언어에서 같은 고유명사
- 2026-10-07 — 한국어(ko)는 번역 파일이 없어 지원 목록에서 제외. ko 파일이 생기면 preview 빌드에서만 활성화 — PLAN ‘ko는 preview만’
- 2026-10-07 — en 날짜: Intl `en-US`(예 “Tue, Oct 20”), 숫자 날짜는 모든 언어 `dd/MM/yyyy`. 태국어는 `th-TH-u-ca-gregory` + `calendar: 'gregory'`로 불기 차단
- 2026-10-07 — i18n 키 추가·수정은 `packages/i18n/overrides/`에 두고 design-sync가 design/i18n 위에 병합 — design/는 읽기 전용(CLAUDE.md)
- 2026-10-07 — i18n 키 추가: `common.paywall.periodYear` / `periodMonth` — `afterTrial`·`noTrial`의 `{{period}}`에 넣을 단어가 없었음
- 2026-10-07 — `nuni.paywall.perk3`를 “Up to 10 photos, longer notes, medium widget”(목업 문구)로 수정, vi·th 초안 작성 — 원문 “themes and unlimited photos”는 MVP 범위(테마 없음, 사진 최대 10장)와 달라 심사·사용자 오해 위험
- 2026-10-07 — DB: FK 컬럼(`entry_tags.*`, `photos.entry_id`)에 NOT NULL 추가 (PLAN SQL에는 없음) — SQLite 복합 PK는 NULL을 허용하므로. S2 시작 전이라 질문 대상 아님
- 2026-10-07 — DB 파일 위치는 expo-sqlite 기본(`Documents/SQLite/nuni.db`) — PLAN의 `Documents/nuni.db`와 디렉터리만 다름. 백업은 VACUUM INTO로 하므로 영향 없음
- 2026-10-07 — 마이그레이션 SQL은 `packages/db/scripts/bundle-migrations.ts`가 TS 문자열 모듈로 묶음 — 앱마다 babel inline-import·metro `sql` 설정 불필요
- 2026-10-07 — 마이그레이션 실패 시: Drizzle이 트랜잭션으로 롤백 → `PRAGMA query_only = ON`으로 읽기 전용. 대기 중 마이그레이션이 있으면 실행 전 `VACUUM INTO backup-<적용 버전>.db`
- 2026-10-07 — uuid v7은 `uuidv7` 패키지(PLAN 명시). crypto.getRandomValues가 없으면 Math.random 폴백 — 기기 로컬 id로 충분
- 2026-10-07 — 매니페스트: 번들 팩 id는 CDN이 덮어쓰지 못함, 루트 `minAppVersion` 미달이면 CDN 팩 전체 무시 + updateRequired, 시즌 배너 ‘최신’ = `availableFrom`이 가장 늦은 팩
- 2026-10-07 — zod v4 사용 — PLAN ‘manifest 타입(zod)’
- 2026-10-07 — 분석: `@nf/analytics`는 타입 이벤트·동의·공통 파라미터·금지 키 검사까지. Firebase 전송은 P18(`GoogleService-Info.plist`) 수령 후 `@react-native-firebase` + transport로 연결 — plist 없이는 config plugin 빌드가 불가. 그 전에는 dev 로그만
- 2026-10-07 — 결제 상태: 앱 실행 중 CustomerInfo를 받았으면 RevenueCat active 목록을 그대로 신뢰(billing retry 포함), CustomerInfo 없이 MMKV 미러만 있을 때만 `expiresAt + 3일` 유예 적용
- 2026-10-07 — 페이월 공용 컴포넌트 `Paywall`(@nf/purchases)로 A9·B11 공유. 연간 기본 선택, CTA: 체험 가능 연간=`startTrial`, 연간=`subscribe`, 월간=`monthlyCta`. 할인율 = 1 − 연간가/(월간가×12) 반올림
- 2026-10-07 — 오프라인 판정은 `expo-network`(Expo 공식 모듈) `isConnected === false || isInternetReachable === false`
- 2026-10-07 — 앱 버전은 `expo-application` `nativeApplicationVersion` (PLAN의 expo-constants 필드는 SDK 57에 없음)
- 2026-10-07 — 토스트는 react-native-screens `FullWindowOverlay` 안에 렌더 — 네이티브 모달(페이월) 위에서도 보이게
- 2026-10-07 — StoreKit Configuration 파일 대신 RevenueCat Test Store로 S1 결제 검증 — Cozy가 Test Store 키를 줌. 실제 StoreKit(체험 자격·Sandbox)은 P15·P16 뒤 Sandbox로 검증
- 2026-10-07 — A13: en Markdown + `legal.englishOnly` 안내 키 추가, 라이선스 문서는 design-sync가 폰트 OFL 2개 + Phosphor MIT 원문으로 생성
- 2026-10-07 — E2E: Maestro(JDK 17 keg-only, `scripts/e2e.sh`). dev client 플로팅 Tools 버튼은 우상단 닫기 버튼을 가려 Info.plist `EXDevMenuShowFloatingActionButton=false` (dev 빌드에만 의미)
- 2026-10-07 — ESLint: eslint-config-expo flat config를 루트에서 실행
