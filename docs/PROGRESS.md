# 진행 상황

Claude Code가 작업 단위가 끝날 때마다 갱신한다. 새 세션은 이 파일부터 읽고 이어서 진행한다.

## 현재 단계

S2 Nuni 개발 — 진행 중 (S1 완료 2026-10-12)

## 단계 현황

| 단계 | 상태 | 메모 |
| --- | --- | --- |
| S0 준비 | 완료 (개발 차단 항목 없음) | P15·P16 보류 → RevenueCat Test Store로 대체. 미확정 사항은 배포 전 해결 (RELEASE_CHECKLIST) |
| S1 공통 패키지 | 완료 (2026-10-12) | 아래 완료 조건 표 |
| S2 Nuni 개발 | 진행 중 | A1·A2·탭 완료 |
| S3 Nuni 출시 | 대기 — 릴리스 게이트 적용 | |
| S4 Fourpop 개발 | 대기 | |
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

## 다음 할 일

1. A3 홈(월간 캘린더, 연속 기록 칩, 오늘 카드, FAB, iPad 2단) + 연속 기록 계산(유닛 테스트)
2. A4 기록 작성(formSheet / iPad 중앙 모달), 첫 실행 시 A3에서 A4 자동 열기, A5
3. P18 plist 수령 시 Firebase transport 연결 + 설정 Privacy의 Copy ID 행

## 막힌 것 / Cozy에게 필요한 것

- 2026-10-12 P15: 번들 ID 2개 등록, App Store Connect 앱 생성 완료(“Nuni - Mood Diary”, “Fourpop - Photo Booth”, 스크린샷 확인), 유료 앱 계약은 Cozy 보고. RELEASE_CHECKLIST B1은 계약 ‘Active’·세금·은행 확인 후 체크
- 2026-10-12 P16(Nuni): 구독 그룹 `Nuni Premium`에 `mood_premium_monthly`(1개월), `mood_premium_yearly`(1년) 생성(스크린샷 확인). **연간 7일 무료체험(Introductory Offer)은 아직 미설정** — 출시 전 설정 필요(PLAN 가격표). 미설정 동안 페이월은 체험 없는 문구(`subscribe`/`noTrial`)로 표시됨
- (출시 전) P17: RevenueCat에 App Store 앱 연결(.p8) → `appl_` 키. 실제 StoreKit 검증은 TestFlight로(Sandbox 테스터는 필요 시 — Cozy 2026-10-12)

- (S4 전) PLAN 충돌 5번(HD 해상도 1200×3600 vs 2400×7200)
- P18 Firebase plist, P19 R2 URL, P22 리포, 도메인 — 배포 전까지
