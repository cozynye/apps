# START HERE — Cozy용 개발 시작 가이드

이 폴더는 Nuni·Fourpop 개발을 Claude Code에게 넘기기 위한 시작 키트다. 기획서, 디자인 시스템, 에셋, 번역, 약관, 목업, 그리고 Claude Code 작업 규칙이 들어 있다.

## 폴더 구성

| 경로 | 내용 | 누가 읽나 |
| --- | --- | --- |
| `CLAUDE.md` | Claude Code 작업 규칙. 실행하면 자동으로 읽힌다 | Claude Code |
| `docs/PLAN.md` | 전체 기획서 v2 (단일 기준) | Claude Code, Cozy |
| `docs/PROGRESS.md` | 진행 상황. Claude Code가 계속 갱신 | 둘 다 |
| `docs/DECISIONS.md` | 결정 기록 | 둘 다 |
| `docs/RELEASE_CHECKLIST.md` | **배포 전에 꼭 해야 할 일** 목록 | 둘 다 |
| `design/` | 토큰, 디자인 시스템 설명, 에셋, i18n, 약관, 스토어 문구, 목업 PNG | Claude Code |
| `.claude/commands/` | `/next`, `/release-check` 단축 명령 | Claude Code |
| `.cursor/rules/` | Cursor용 규칙 (CLAUDE.md를 따르라는 내용) | Cursor |
| `scripts/check-placeholders.sh` | 배포 전 자리표시자·키 누락 검사 | Claude Code |

## 1. 한 번만 준비 (Mac)

1. Xcode 최신 버전 설치 → 한 번 실행해서 iOS 시뮬레이터 컴포넌트 설치. iPhone 16 계열 + iPad Pro 13인치 시뮬레이터가 있는지 확인
2. 터미널에서 확인·설치
   ```
   node -v            # 22.x 권장 (없으면 nvm 또는 brew로 설치)
   npm i -g pnpm eas-cli
   brew install watchman
   curl -fsSL "https://get.maestro.mobile.dev" | bash   # E2E 테스트 (Claude Code가 필요할 때 써도 됨)
   ```
3. Claude Code 설치·로그인이 안 돼 있다면 Cursor 터미널에서 `claude` 실행 후 안내대로 로그인

## 2. 폴더에 풀기

1. 만들어 둔 프로젝트 폴더에 이 zip의 **안쪽 내용**(`CLAUDE.md`, `docs/`, `design/` …)을 그대로 푼다. 폴더 최상단에 `CLAUDE.md`가 있어야 한다
2. Cursor로 그 폴더 열기
3. 터미널에서
   ```
   git init && git add -A && git commit -m "chore: project kickoff kit"
   ```
   GitHub 리포(P22)를 만들었다면 remote 연결 후 push

## 3. Claude Code 실행과 첫 지시

Cursor 터미널(폴더 루트)에서 `claude` 실행 후 아래를 그대로 붙여 넣는다.

```
CLAUDE.md와 docs/PLAN.md 전체, docs/PROGRESS.md, docs/DECISIONS.md를 읽어라.
design/ 폴더 구성과 design/mockups의 PNG도 확인해라.
읽은 뒤 바로 코딩하지 말고 아래를 한국어로 보고해라:
1) 네가 이해한 두 앱의 MVP 범위 요약 (10줄 이내)
2) S1 공통 패키지 단계의 작업 계획 (순서, 산출물, 완료 조건 확인 방법)
3) 기획서에서 모호하거나 서로 충돌하는 부분, 시작 전에 내가 답해야 할 질문 (없으면 없다고)
```

보고를 보고 질문에 답한 뒤:

```
좋다. S1을 시작해라. 작은 단위로 진행하고 단위마다 PROGRESS.md 갱신하고 커밋해라.
```

그 뒤로는 대부분 `/next` 한 단어로 이어가면 된다.

## 4. 진행 중에 자주 쓸 말

| 상황 | 이렇게 말하기 |
| --- | --- |
| 이어서 진행 | `/next` |
| 어디까지 했는지 | `PROGRESS.md 기준으로 현재 상태와 남은 일 요약해라` |
| 시뮬레이터로 보고 싶음 | `Nuni를 iPhone 시뮬레이터와 iPad 시뮬레이터에서 실행해라` |
| 화면이 목업과 다름 | `A4 화면을 design/mockups/nuni/A4Entry.png와 PLAN 화면 목록 기준으로 비교하고 차이를 고쳐라` |
| 새 세션 시작 (컨텍스트 초기화 후) | `CLAUDE.md 규칙대로 PROGRESS.md부터 읽고 이어서 진행해라` |
| 배포 전 점검만 | `/release-check` |
| 배포 | `배포하자` → Claude Code가 체크리스트의 **안 끝난 항목을 먼저 전부 알려준다** |

## 5. Cozy가 넘겨줄 것 (생기는 대로)

개발은 이것들 없이도 진행된다. 생기면 Claude Code에게 알려주고, 키·plist는 채팅에 붙이지 말고 파일로 넣는다.

| 언제 | 무엇 | 어디에 |
| --- | --- | --- |
| S1 중 (가능하면) | 보유 도메인 주소 | 채팅으로 알려주기 |
| P15 계정 이슈 해결 후 | App Store Connect 앱 등록, 상품 등록 완료 | 채팅으로 완료 알림 |
| P17 | RevenueCat iOS 키 2개 | `.env` (`.env.example` 복사) |
| P18 | `GoogleService-Info.plist` 2개 | `apps/nuni/`, `apps/fourpop/` |
| P19 | R2 공개 URL | `.env`의 `EXPO_PUBLIC_CDN_BASE_URL` |
| S4 시작 전 | 첫 시즌팩 id·테마 | 채팅으로 알려주기 |

## 6. 배포 전에 꼭 해야 할 것 (요약)

자세한 목록과 체크 상태는 `docs/RELEASE_CHECKLIST.md`. “배포하자”라고 하면 Claude Code가 이 중 안 된 것을 다시 알려주고, 끝나기 전엔 제출하지 않는다.

- **Cozy 결정**: 개발자 계정 종류, 출시 국가, 도메인, 약관 시행일, 첫 시즌팩 id, 태국 결제 수단 확인, 정산 은행, 가격 최종 확인
- **Cozy 계정 작업**: App Store Connect 계약·세금·은행 활성, 인앱 상품 등록, RevenueCat·Firebase·R2 설정, Small Business Program, Sandbox 테스터, 현지 TestFlight 테스터 3명, (권장) 약관 법률 검토
- **Claude Code 작업**: 자리표시자 0건, 약관·개인정보 웹 페이지 배포, 실제 키로 결제 Sandbox 검증, 분석 이벤트 확인, 시즌팩 CDN 업로드, 완료 기준 전부, 스크린샷 앱당 36장(6장 × 3언어 × iPhone·iPad), 메타데이터·개인정보 라벨·심사 노트 최종본, TestFlight 외부 테스트 1주

## 7. 참고 링크 (클라우드 원본)

- 기획서: https://claude.ai/code/artifact/dd0f3ac1-2b8e-4f64-b670-a4e5fccc1596
- 디자인 시스템: https://claude.ai/artifact/YPYbEiwv6wy8QHb3Tmyccs
- Nuni 목업: https://claude.ai/artifact/KHD32DNRxpo1p1RhmUS39m
- Fourpop 목업: https://claude.ai/artifact/Uc9rE1yc21PzThBuXao8F5
- 아이콘·스플래시 시안: https://claude.ai/artifact/E7Z4J9agNiKTnNmVeP9Pv2

이 폴더의 파일이 개발 기준이다. 클라우드 원본을 고치면 해당 파일을 다시 받아 `design/`에 덮어쓰고 `pnpm design:sync`를 실행하라고 하면 된다.
