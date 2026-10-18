# 마케팅 자동화 셋업 체크리스트 (Cozy)

`docs/marketing/STRATEGY.md`의 자동화를 켜기 위해 Cozy가 만들어 넘겨야 하는 계정·키 목록. 표기: `[ ]` 미완료 · `[x]` 완료 · `[-]` 건너뜀(사유). 값은 **GitHub Secrets**에만 넣고 레포·채팅에 붙이지 않는다(토큰을 채팅에 붙였다면 즉시 재발급).

Secret 등록 명령(값은 stdin으로):

```bash
gh secret set THREADS_TOKEN_FOURPOP_VI -R cozynye/apps   # 프롬프트에 값 붙여넣기
```

## A. 브랜드 계정 (앱 × 언어 4개)

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| A1 | Instagram **프로페셔널(크리에이터)** 계정 4개: Fourpop 베트남어, Fourpop 태국어, Nuni 베트남어, Nuni 태국어. 프로필: 앱 아이콘, 한 줄 소개(스토어 부제 재사용), 링크는 랜딩(`https://cozynye.github.io/apps/fourpop.html` / `nuni.html`) | 핸들 4개 → `marketing/accounts.json`의 `handle` | [ ] |
| A2 | 각 Instagram 계정으로 **Threads** 프로필 생성(Threads 앱에서 Instagram 로그인) | — | [ ] |
| A3 | **TikTok** 계정 2개(Fourpop 베트남어·태국어). 설정에서 **비즈니스 또는 크리에이터** 계정으로 전환(예약 기능·Buffer 연결에 필요) | 핸들 2개 | [ ] |
| A4 | **X** 계정 1개(Fourpop 태국어) — 선택 | 핸들 | [ ] |
| A5 | **Facebook 페이지** 2개(Fourpop, Nuni) — 수동 예약용(Meta Business Suite). 자동화 대상 아님 | — | [ ] |

## B. Meta 개발자 앱 + 토큰 (Threads · Instagram 자동 게시)

공식 문서: Threads `developers.facebook.com/docs/threads/get-started`, Instagram `developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login`. 앱은 **개발 모드로 둔다**(심사 불필요). 본인 계정만 쓰므로 App Review·비즈니스 인증이 필요 없다.

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| B1 | developers.facebook.com → 내 앱 → 앱 만들기 → 사용 사례 **"Threads API 액세스"** 선택 → 앱 이름 예 `Chagyung Threads Publisher`. 개인정보처리방침 URL `https://cozynye.github.io/apps/privacy.html` | 앱 ID(비밀 아님) | [ ] |
| B2 | 그 앱의 **앱 역할 › 역할 › 사람 추가 → Threads 테스터**로 4개 Threads 계정 추가. 각 Threads 앱 → 설정 → 계정 → **웹사이트 권한 → 초대**에서 수락 | — | [ ] |
| B3 | 앱 대시보드 → Threads 사용 사례 → **사용자 토큰 생성기**에서 4계정 각각 토큰 생성(권한 `threads_basic`, `threads_content_publish`, `threads_manage_insights`). 60일 유효 | Secrets `THREADS_TOKEN_FOURPOP_VI` · `THREADS_TOKEN_FOURPOP_TH` · `THREADS_TOKEN_NUNI_VI` · `THREADS_TOKEN_NUNI_TH` | [ ] |
| B4 | 두 번째 앱 만들기 → 사용 사례 **"Instagram API with Instagram Login"**(비즈니스 유형) → 이름 예 `Chagyung Instagram Publisher` | 앱 ID | [ ] |
| B5 | Instagram 제품 → **API setup with Instagram login** → 3단계 "액세스 토큰 생성"에 4개 Instagram 계정 추가(Instagram 앱 → 설정 → 앱 및 웹사이트 → **테스터 초대** 수락) → 각각 **토큰 생성**(권한 `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`). 60일 유효 | Secrets `IG_TOKEN_FOURPOP_VI` · `IG_TOKEN_FOURPOP_TH` · `IG_TOKEN_NUNI_VI` · `IG_TOKEN_NUNI_TH` | [ ] |
| B6 | 토큰 자동 갱신을 원하면 GitHub **fine-grained PAT**(이 저장소, Secrets: Read and write) 발급 | Secret `GH_ADMIN_TOKEN` (없으면 60일마다 B3·B5 수동 반복, 워크플로가 만료 2주 전부터 경고) | [ ] |

사용자 ID는 토큰으로 자동 조회하므로 따로 적지 않는다.

## C. Buffer (TikTok · X 자동 게시)

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| C1 | buffer.com **Free** 가입(채널 3개 한도) → 채널 연결: TikTok Fourpop VI, TikTok Fourpop TH, X Fourpop TH | — | [ ] |
| C2 | publish.buffer.com/settings/api → API 키 생성 | Secret `BUFFER_API_KEY` | [ ] |
| C3 | 채널 ID 조회: `.env`에 키를 넣고 `pnpm marketing:publish --list-channels` 실행 → 출력된 ID | Secrets `BUFFER_CHANNEL_TIKTOK_FOURPOP_VI` · `BUFFER_CHANNEL_TIKTOK_FOURPOP_TH` · `BUFFER_CHANNEL_X_FOURPOP_TH` | [ ] |
| C4 | 첫 테스트 게시 뒤 TikTok에 **이미지 캐러셀**이 올라갔는지 확인(Buffer API 베타). 안 되면 TikTok은 TikTok Studio 웹 예약(10일 선행)으로 폴백 — Claude가 주간 PR에 캡션·이미지를 함께 넣어 준다 | 확인 한 줄 | [ ] |

## D. Pexels (무료 스톡 사진)

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| D1 | pexels.com/api → 무료 API 키(200 req/시간, 20,000/월) | Secret `PEXELS_API_KEY` (로컬 `.env`에도) | [ ] |

## E. App Store Connect (측정)

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| E1 | ASC → 앱 → **Analytics → Acquisition → Campaigns → 캠페인 링크 생성** 화면에서 **provider token(`pt=` 값)** 확인(계정 공통) | `marketing/links.json`의 `providerToken` | [ ] |
| E2 | ASC → 사용자 및 액세스 → 통합 → App Store Connect API → 팀 키 생성, 역할 **Admin**. 기존 App Manager 키(`Z3256B5QP4`)는 분석 리포트 요청이 `403 FORBIDDEN_ERROR "The API key in use does not allow this request"`로 거부됨(2026-10-19 확인). 새 키는 리포트 워크플로 전용으로 쓴다 | Secrets `ASC_KEY_ID` · `ASC_ISSUER_ID` · `ASC_KEY_P8`(.p8 파일 내용 전체) | [ ] |

## F. GitHub

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| F1 | 위 Secrets 전부 등록 후 Actions → **Marketing publish** → Run workflow(`dry_run: true`)로 연결 확인 | 실행 링크 | [ ] |
| F2 | 채널별 실제 테스트 게시 1건(Claude가 테스트 큐를 만들어 PR) → 각 앱에서 확인 → 삭제 | 확인 한 줄 | [ ] |

## G. 커뮤니티 (수동 게시용 개인 계정)

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| G1 | 개인 Facebook으로 베트남 그룹 3~5개 가입(검색어 `photobooth`, `chụp ảnh`, `sống ảo`, `Gen Z`; 회원 수·최근 활동·규칙 확인) | 그룹 이름·규칙 요약 → `marketing/community.md`에 Claude가 기록 | [ ] |
| G2 | 태국: Facebook 포토부스·K-컬처 그룹 2~3개, **Pantip** 계정(사이암스퀘어·카메라 방 — 판매·홍보 톤 금지), X 계정은 A4 공용 | 같음 | [ ] |
| G3 | Reddit 계정(`r/VietNam`, `r/Thailand`는 광고 금지 → 2주 댓글로 카르마, 질문·댓글형만) | — | [ ] |

## H. 선택

| # | 항목 | 전달할 것 | 상태 |
| --- | --- | --- | --- |
| H1 | Android 출시 알림용 Google Form 링크(랜딩에 노출) | URL → `marketing/links.json`의 `androidWaitlist` | [ ] |
| H2 | 샘플 실촬영(지인, 동의) 10~20장 — 스톡보다 반응이 좋다 | 파일 → `marketing/photos/`(gitignore) | [ ] |

## 완료 후

Claude Code에서 `/marketing-weekly`를 실행하면 다음 주 큐(PR)가 만들어진다. 머지하면 cron이 게시한다. 운영 방법은 `marketing/README.md`.
