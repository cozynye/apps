# 진행 상황

Claude Code가 작업 단위가 끝날 때마다 갱신한다. 새 세션은 이 파일부터 읽고 이어서 진행한다.

## 현재 단계

S4 Fourpop 개발 — 진행 중 (S2 완료 2026-10-14)

## 단계 현황

| 단계 | 상태 | 메모 |
| --- | --- | --- |
| S0 준비 | 완료 (개발 차단 항목 없음) | P15·P16 보류 → RevenueCat Test Store로 대체. 미확정 사항은 배포 전 해결 (RELEASE_CHECKLIST) |
| S1 공통 패키지 | 완료 (2026-10-12) | 아래 완료 조건 표 |
| S2 Nuni 개발 | 완료 (2026-10-14) | A1–A13·위젯·리마인더·잠금·백업·Firebase. 예외: 콜드 스타트·TestFlight 1주 Cozy 지시로 건너뜀, VoiceOver 실기기 완주 선택(미실시) |
| S3 Nuni 출시 | 대기 — 릴리스 게이트 적용 | |
| S4 Fourpop 개발 | 진행 중 | 1–5단계(뼈대, B3·B4, 촬영 B5·B6, 꾸미기·결과 B7·B8, 갤러리 B9·상점 B10·팩 구매/다운로드) 완료 — 화면 B1–B13 전부 있음. 다음 6단계(완료 기준 점검: 결제 검증·3언어·오프라인·예외 표) |
| S5 Fourpop 출시 | 대기 — 릴리스 게이트 적용 | |

## S1 완료 조건 확인 (2026-10-07)

| 조건 | 결과 | 확인 방법 |
| --- | --- | --- |
| 언어 전환 (vi/th/en) | 통과 (iPhone 17 Pro, iPad Pro 13") | Maestro `s1-stories` |
| 페이월 표시 (RevenueCat 가격) | 통과 (iPhone, iPad) | Maestro `s1-paywall` |
| 결제·취소·실패·복원 | 통과 (iPhone, iPad, 2026-10-12) — `mood_premium` 해제, 연간 7일 체험 문구 표시 | Maestro `s1-paywall`, `s1-purchase-restore` (RevenueCat Test Store: 상품 `mood_premium_monthly`/`_yearly`, 권한 `mood_premium`, Offering `default`) |
| 컴포넌트 스토리 iPhone·iPad 렌더 | 통과 (라이트·다크, en/th/vi) | Maestro `s1-stories` 스크린샷 |
| A13 약관·라이선스, 페이월 → Terms 링크 | 통과 (iPhone, iPad) | Maestro `s1-legal` |
| DB (마이그레이션, CHECK, FK cascade, WAL) | 통과 (iPhone, iPad) | Maestro `s1-data` |
| typecheck / lint / Jest / i18n 패리티 | 통과 (Jest 33개, lint 오류 0·경고 2) | `pnpm typecheck && pnpm lint && pnpm test && pnpm i18n:check` |

## 완료한 일

- 모노레포 (pnpm hoisted, Expo SDK 57), `scripts/design-sync.ts` (토큰·SVG·i18n·매니페스트·에셋·약관·라이선스)
- `@nf/i18n`: i18next, 언어 결정(강제 → 설정 → 기기 → en), 날짜 포맷(태국 서기), 패리티 검사, overrides
- `@nf/ui`: 테마(라이트/다크/시스템), 타이포(태국어 치환), 설정 스토어(MMKV), Button·Chip·Segment·Card·Toast·EmptyState·PlanCard·Mascot·Illustration·Screen·MarkdownDocument, 스토리 화면
- `@nf/db`: Drizzle 스키마(Nuni·Fourpop), 번들 마이그레이션 + 사전 백업 + 실패 시 읽기 전용
- `@nf/content`: zod 매니페스트, 카탈로그 병합·상점·시즌 배너, ETag 로더
- `@nf/purchases`: RevenueCat 래퍼, 권한 스토어 + MMKV 미러(3일 유예), 공용 Paywall
- `@nf/analytics`: 타입 이벤트, 동의, 금지 키 검사 (Firebase 전송은 P18 후)
- Nuni 더미 앱: dev 메뉴, A9 페이월, A13 약관·개인정보·라이선스
- `web/legal`: support / privacy / terms 정적 페이지 (`pnpm legal:build`, 미배포)
- CI 워크플로(.github/workflows/ci.yml), Maestro 플로우 5개(`apps/nuni/.maestro/s1-*`) + `pnpm e2e nuni "<시뮬레이터>" 's1-*'` (Metro 실행 필요: `pnpm nuni start`)

## 완료한 일 (2026-10-08)

- 자정 넘김 날짜 규칙(시트 연 시점), 권한 팝업 문구 초안(`packages/i18n/permissions`, Nuni `app.config.ts` 연결), 약관 4절 수정(legal-patches), Copy ID를 S2·S4 범위에 추가 — DECISIONS 2026-10-08

## 완료한 일 (2026-10-12, S2)

- A1 스플래시(라이트·다크 로고 PNG, `surface-1` 배경), 탭 레이아웃 + 공용 `TabBar`(iPad 가운데 정렬 최대 480)
- A2 온보딩 3장(Skip, 페이지 점, 마지막 장 분석 토글, `onboarding_complete`), 첫 실행 라우팅(`index` → A2 / A3), 설치일·온보딩 플래그(MMKV)
- A3·A6·A10은 탭 셸만(제목) — 다음 단계에서 구현
- Maestro `onboarding`, `onboarding-skip` + S1 플로우 전체: iPhone 17 Pro·iPad Pro 13" (iOS 26.5) 통과, `s1-purchase-restore`만 RevenueCat 설정 대기로 실패(기존과 같음)

## 완료한 일 (2026-10-12, S2 2단계)

- 앱 DB 초기화(스플래시 유지 → 마이그레이션 → 기본 태그 20종), 고아 사진 정리
- 연속 기록·날짜 계산 + 유닛 테스트(PLAN 예시 포함)
- A3 홈: 월간 캘린더(대표 구름, 점선 원, 설치 전 숫자만), 연속 기록 칩, 오늘 카드, FAB, iPad 1024pt+ 2단
- A4 기록 작성·수정: 감정·태그(15 + 전체, 커스텀)·메모·사진(PHPicker → 1600px JPEG 85)·날짜 변경·닫기 확인, 무료 한도 → A9
- A5 날짜별 기록: 목록, 수정, 스와이프 삭제, “Add another entry”
- Maestro `entry-create` 추가(iPhone·iPad)

## 완료한 일 (2026-10-12, S2 3단계)

- 저장 직후: 구름 새김 애니메이션, A12 알림 프리프롬프트(첫 기록 후), 3일 연속 축하 시트, `streak_milestone`
- 리마인더: 7일 선예약 단발 알림, 빠른 액션(Low/Okay/Good 즉시 저장), 알림 탭·`nuni://entry/today` → A4
- Maestro `reminder`(예약 6건 확인), `streak` 추가

## 완료한 일 (2026-10-12, S2 4단계)

- A6 통계(Week/Month/Year 잠금, 분포, 연속 기록, What lifts your mood + 무료 블러), A7 공유 카드(월간·연간, 워터마크, 저장·공유)
- Maestro `stats-share` (iPhone 통과, iPad·전체 회귀는 QA 에이전트가 진행)

## 완료한 일 (2026-10-12, S2 5단계)

- A10 설정(언어·외관·리마인더·구독·Privacy·문의·평가·약관·버전·전체 삭제), 공용 `SettingsSection`/`SettingsRow`
- Maestro `settings` (iPhone 통과)
- QA 서브에이전트: 커밋마다 별도 worktree·Metro 8082·iOS 26.2 시뮬레이터에서 회귀 + 탐색 QA

## 완료한 일 (2026-10-12, S2 6단계)

- A11 잠금(Face ID/Touch ID 자동 → 4자리 패스코드), `settings/lock`(설정·변경·끄기), 백그라운드 가림. Maestro `lock` (iPhone 통과)

## 완료한 일 (2026-10-12, S2 7단계)

- `settings/backup`: iCloud 백업·복원(Swift Expo Module), 하루 1회 자동 백업, zip 내보내기. Maestro `backup`

## 완료한 일 (2026-10-12, S2 8단계)

- 홈 위젯 small·medium(`@bacons/apple-targets`, `widget-bridge` 모듈), A9 source별 헤드라인, `nuni://premium/<source>`

## 완료한 일 (2026-10-12~13, 사용성 테스트·QA)

- QA 에이전트 1차(41bdeb7)·2차(beee3ca) + vi·th 사용자 여정 테스트에서 찾은 문제 반영 — DECISIONS 2026-10-12 ‘사용성 개선’, 2026-10-13 ‘QA 2차 반영’
- 탭 바 네이티브(리퀴드 글래스)로 교체 — Cozy 결정 2026-10-13, iPad는 상단 탭
- 회귀: iPhone 16/16, iPad 주요 플로우 통과(b286142 기준), Jest 54

## 완료한 일 (2026-10-13, 실기기)

- Cozy iPhone 12 Pro(iOS 26.6.2)에 개발 빌드 설치·실행, Cozy 보고 ‘잘된다’
- Metro 로그로 확인: 온보딩, 기록 저장, 사진 포함 기록 저장, Test Store 결제 성공, 오류 없음
- Cozy 확인(2026-10-13 ‘전부 다 되더라’): iCloud 백업→복원→재실행, 위젯 오늘 구름, Face ID·패스코드 폴백, 알림 빠른 액션, 공유 카드 사진 저장, 비행기 모드
- 첫 실기기 빌드: `expo run:ios`가 `-allowProvisioningUpdates`를 넘기지 않아 와일드카드 프로파일로 실패 → `xcodebuild -allowProvisioningUpdates`로 앱·위젯 프로파일 생성 후 `xcrun devicectl`로 설치

## 완료한 일 (2026-10-14, S4 1단계)

- `apps/fourpop` 뼈대: 번들 `app.fourpop.booth`, 아이콘·스플래시, 권한 문구(카메라·사진 추가, vi/th/en), DB 초기화, B2 온보딩 2장, 네이티브 탭. Maestro `onboarding`(iPhone 통과)

## 완료한 일 (2026-10-14, S4 2–4단계)

- B3 홈(시즌 배너, 프레임 그리드, 촬영·앨범 CTA), B4 프레임 선택(기본/시즌/보유), B11 페이월, B12 설정(화질·셔터음·미러), B13 약관
- B5 촬영(타이머 3/5/10, 카운트다운, 포즈 가이드, 플래시·전환·미러, 일시정지, 한 장 재촬영), B6 4장 고르기, 앨범 4장 가져오기
- B7 꾸미기: 필터 6종(유료 3), 스티커(이동·회전·크기·삭제), 펜, 텍스트, 날짜 3형식, 되돌리기. Skia 미리보기 = 저장과 같은 장면(`StripScene`)
- B8 결과: 일반 600×1800 자동 렌더 + 갤러리 보관, HD 1200×3600(프리미엄), GIF(8컷 480px, 프리미엄), 사진 앱 저장, 공유(설치된 메신저만 + 시스템 공유), 잠긴 프레임 블러·팩 구매·무료 프레임 전환
- 시뮬레이터 카메라 대체: `EXPO_PUBLIC_MOCK_CAMERA=1`이면 목업 8장(`assets/mock`)
- 검증: typecheck·lint(오류 0, 경고 2 기존)·Jest 63·i18n 패리티 통과. Maestro `onboarding`·`booth-complete` iPhone 17 Pro·iPad Pro 13" 통과(Metro 8082, MOCK_CAMERA)
- 미검증: 실제 카메라 촬영·셔터음·플래시(실기기 필요), GIF·HD 저장(프리미엄 필요 — Fourpop RevenueCat 키 없음), 메신저 공유(앱 미설치), 합성 시간 2초·메모리 300MB 목표(실기기 측정 필요)

## 완료한 일 (2026-10-14, S4 5단계)

- B9 갤러리: 날짜별 섹션 + 행(썸네일·프레임명·시간·필터), 탭 → B8 재공유(`?stripId=`, 갤러리 사본 저장·공유만), 스와이프 삭제(확인 → 파일 먼저 삭제), 빈 상태 → Booth 탭
- B10 상점: 프레임팩·스티커팩 카드(Free / Owned / Included in Premium / Unlock {{price}} / Download / Try again), 프리미엄 배너 → B11, 오프라인 배너 + 번들·설치 팩만, `shop.updateApp`, `pack_view`
- 팩 구매·다운로드(`src/packs.ts`): `purchasePack`(비소모성 `getProducts` → 구매 → `pack_unlock` → 설치), 개별 파일 다운로드 → sha256 검증(`expo-crypto`, 매니페스트 `sha256` 맵) → `Documents/packs/<id>/` 원자적 이동 → `installed_packs` → 카탈로그 재계산(설치 파일 우선). 프리미엄 구독자 다운로드 = `pack_unlock(premium)`
- B11 `?packId=`: 공용 `Paywall`에 `single` 카드(단품이 위·주 색, 구독 CTA는 Secondary). B8 팩 구매도 같은 경로(가격 표시)
- 딥링크 `fourpop://shop/<packId>`, 개발 메뉴 `fourpop:///dev`(구매 없이 팩 설치, production 제외), 모의 CDN `pnpm cdn:mock`(포트 8090, 샘플 시즌팩·스티커팩 + sha256, ETag/304)
- i18n 키 추가 `shop.download`, `shop.frames_*`, `shop.stickers_*`(en·vi·th). 유닛 테스트 `packFiles`/`fileName`, `groupStripsByDate` 추가(Jest 68)
- 검증: typecheck·lint(오류 0, 경고 2 기존)·Jest 68·i18n 패리티 통과. Fourpop 개발 빌드 재생성(expo-crypto) iPhone 17 Pro·iPad Pro 13" (iOS 26.5). Maestro(Metro 8082, `EXPO_PUBLIC_MOCK_CAMERA=1` + `EXPO_PUBLIC_CDN_BASE_URL=http://localhost:8090`, 모의 CDN 실행 중) iPhone·iPad 모두 통과: `onboarding`, `booth-complete`, `gallery`(촬영 → 목록 → 재공유 → 삭제 → 빈 상태), `pack-install`(CDN 매니페스트 → 시즌 배너 → 상점 카드 → B11 단품 카드 → 다운로드·sha256·설치 → B4 Season)
- 결제 검증(2026-10-14 오후, Cozy가 RevenueCat Fourpop 프로젝트 + Test Store 설정, `.env`에 `test_` 키): Maestro `pack-unlock`(상점 → B11 단품 카드 $0.99 → Test Store 구매 → `pack_unlock(single)` → 다운로드 → Owned → B4 Season 잠금 해제 → 촬영 → B8 블러 없이 저장)과 `paywall-restore`(B12 → B11 연간/월간 플랜·절약 배지, 취소 → 실패 토스트 → 성공 토스트·Premium 행 사라짐 → 복원 ‘Purchases restored’) iPhone 17 Pro·iPad Pro 13" 통과. 이로써 PLAN 완료 기준의 Fourpop Maestro 3종(`onboarding`·`booth-complete`·`pack-unlock`) iPhone·iPad 통과
- 미검증: 프리미엄 구독자의 팩 Download 버튼 경로(E2E 없음, 코드는 구매 설치와 같은 `installPack`), 구독 만료 후 잠금 전환(Test Store 자동 갱신 5회 뒤 취소를 기다려야 함), 실제 CDN(R2) ETag·immutable 헤더 동작(P19 후), 실기기 결제 시트

## 다음 할 일

0. S4 6단계(완료 기준 점검): vi·th·en 플로우 스크린샷 점검(`EXPO_PUBLIC_FORCE_LOCALE`); 비행기 모드(상점 오프라인·촬영·저장); 예외 상황 표 항목 재현 기록; Fourpop Firebase plist(P18) 후 Copy ID; 프리미엄 Download 경로 E2E; QA 회귀

1. Firebase DebugView 파라미터 최종 확인(Cozy): `share_card` 등에 `mood`·본문·태그 이름 미포함
   - 2026-10-14 실기기 DebugView에 자동 이벤트 + 앱 이벤트(`share_card`) 도착 확인. 이벤트 파라미터는 `buildEventParams`가 금지 키를 막음(유닛 테스트)
2. 남은 S2 완료 기준: VoiceOver 실기기 완주(선택). 콜드 스타트·TestFlight 1주는 Cozy 지시로 건너뜀(RELEASE_CHECKLIST)

## 완료한 일 (2026-10-13, Firebase)

- P18 Nuni: Analytics + Crashlytics 연결(동적 프레임워크·SPM), 광고 ID 끔, 분석 토글 연동, 설정 Copy ID. 시뮬레이터 회귀 15/15, 실기기 설치·실행

## 막힌 것 / Cozy에게 필요한 것

- 2026-10-12 Cozy: App Group `group.app.nuni.mood` 등록·App ID 연결 완료(보고), Team ID `TC547C863K` → app.json `appleTeamId`. iCloud 컨테이너 `iCloud.app.nuni.mood` + App ID iCloud 체크 완료(보고). 남은 것: 실기기에서 iCloud 백업·복원·위젯 App Group 검증(서명 빌드 필요)

- 2026-10-12 P15: 번들 ID 2개 등록, App Store Connect 앱 생성 완료(“Nuni - Mood Diary”, “Fourpop - Photo Booth”, 스크린샷 확인), 유료 앱 계약은 Cozy 보고. RELEASE_CHECKLIST B1은 계약 ‘Active’·세금·은행 확인 후 체크
- 2026-10-12 P16(Nuni): 구독 그룹 `Nuni Premium`에 `mood_premium_monthly`(1개월), `mood_premium_yearly`(1년) 생성(스크린샷 확인). **연간 7일 무료체험(Introductory Offer)은 아직 미설정** — 출시 전 설정 필요(PLAN 가격표). 미설정 동안 페이월은 체험 없는 문구(`subscribe`/`noTrial`)로 표시됨
- (출시 전) P17: RevenueCat에 App Store 앱 연결(.p8) → `appl_` 키. 실제 StoreKit 검증은 TestFlight로(Sandbox 테스터는 필요 시 — Cozy 2026-10-12)

- 2026-10-14 P17(Fourpop, 개발용) 완료: Cozy가 RevenueCat Fourpop 프로젝트 + Test Store(상품 `booth_premium_monthly`·`booth_premium_yearly`·`booth_pack_dev_sample`·`booth_stickers_dev_sample`, 권한 `booth_premium` + 단품 2개, Offering `default` Monthly/Annual)를 설정, `.env`에 `EXPO_PUBLIC_RC_IOS_KEY_FOURPOP`(test_). 출시 전 실제 `appl_` 키와 실제 시즌팩 상품은 P17에서
- P18 Firebase plist(Fourpop), P19 R2 URL, 도메인 — 배포 전까지. P22 GitHub 리포는 2026-10-14 `github.com/cozynye/apps`(public, main)로 연결·푸시 완료
