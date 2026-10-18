# Nuni & Fourpop 홍보·마케팅 전략 (2026-10-19)

Cozy 요청: 앱 개발을 잠시 멈추고, 두 앱(과 앞으로의 프로젝트)을 베트남·태국 커뮤니티에 홍보할 수단을 분석하고 **AI로 매일 정해진 시간에 자동 포스팅**하는 체계를 만든다. 계정은 Cozy가 제공한다.

Cozy 결정(2026-10-19): 월 예산 **$0(무료 도구만)**, 게시 승인은 **주 1회 배치**, 사람 사진은 **무료 스톡(Pexels)**, 실행 환경은 **클라우드 전용**(Mac이 꺼져 있어도 게시).

관련 문서: 셋업 체크리스트 `docs/marketing/CHECKLIST.md`, 운영 방법 `marketing/README.md`, 주간 리포트 `docs/marketing/reports/`.

## 1. 출발점 (레포 상태)

- Nuni 1.0.0 (2) 심사 대기(App ID 6821789626), Fourpop 1.0.0 (1) 제출 직전(6821789911). 판매 국가 베트남·태국, 둘 다 무료·광고 없음.
- 마케팅 자료·소셜 계정·랜딩 페이지 없음. 호스팅은 GitHub Pages `https://cozynye.github.io/apps/`(지원·법률 페이지).
- 공유 결과물(Nuni 공유 카드, Fourpop 스트립)에 앱 이름·링크·해시태그가 붙지 않는다(1.0은 전부 프리미엄 취급이라 워터마크가 꺼짐). 바이럴 루프가 약하다.
- Firebase 이벤트(`booth_share`, `share_card`, `entry_create` 등)는 있으나 광고 식별자·딥링크·캠페인 링크는 없다.
- vi/th 스토어 카피는 초안(네이티브 검수 없음). 스토어 키워드는 `docs/release/store-*.md`.

## 2. 시장·채널 분석 (Gen Z 18–30, iOS만)

### 2-1. 어디에 모여 있나

| | 베트남 | 태국 |
| --- | --- | --- |
| 사용률 | Facebook 94%, Zalo 89%, YouTube 87%, TikTok 77%(주간 82%), **Threads 23%로 급성장**(2024 Q2 10% → 2025 Q4 23%) | Gen Z **Instagram 87%, TikTok 76%**, LINE 사실상 전 국민, X는 Gen Z 해시태그·사회 이슈 문화의 중심, Lemon8은 태국·일본에서 특히 인기 |
| Gen Z 추세 | Facebook 선호 감소, Zalo는 취업과 함께 필수 앱으로 상승, TikTok 숏폼이 1위 | TikTok 20%·Instagram 14%가 "가장 많이 쓰는 플랫폼" |
| iOS 점유율 | 약 40% (2026-07) | 약 33% (2026-06) |
| 커뮤니티 | Facebook 그룹(관심사·학교·지역 단위), Voz(116만, 남초 IT 포럼), Webtretho(여성·육아), Tinhte(테크) | **Pantip**(방 단위 거대 포럼), Dek-D(10대·입시), Jeban(뷰티), LINE OpenChat |

### 2-2. 한국 커뮤니티에 빗대면

| 한국 | 베트남 | 태국 |
| --- | --- | --- |
| 네이버 카페·맘카페 | Facebook 그룹, Webtretho | Facebook 그룹, LINE OpenChat |
| 디시·펨코 | Voz(IT·남초), Tinhte | Pantip(사이암스퀘어 방 = 10대·대학 생활, 마분콩 방 = 모바일·iOS·Android — 두 방 모두 판매·홍보 목적 글 금지) |
| 트위터(X) 문화 | Threads(Gen Z 텍스트 바이럴, 답글이 조회의 절반) | X(해시태그 트렌드) |
| 카카오채널 | Zalo OA(무료 티어 있음) | LINE OA(무료 300건/월) |
| 네이버 블로그·핀터레스트 | — | Lemon8, Dek-D |

### 2-3. 두 앱에 맞는 흐름

- **Fourpop**: 베트남에서 포토부스는 2024년 말 TikTok `#PhotoboothChallenge`로 폭발했고 오프라인 체인이 전국에 생겼다. 모바일 경쟁앱 **Licowa**가 "한국식 포토부스 톤·필름 그레인·다양한 레이아웃"으로 TikTok에서 바이럴됐다. 태국은 오프라인 포토부스 시장이 약 10억 바트(PLAN). → **TikTok·Threads의 네컷 트렌드에 편승**하는 시각 콘텐츠가 핵심. K-컬처(인생네컷·포토이즘)가 훅이 된다.
- **Nuni**: 현지어 감정일기 강자가 없다(DailyBean은 vi/th 미지원인데도 VN 12,000·TH 4,900 평가). 베트남 `chữa lành`, 태국 `ฮีลใจ`(힐링) 코드와 "계정 없음·기기에만 저장"이 메시지. → **Threads 텍스트 + 마스코트 밈**이 핵심.
- 두 나라 모두 Android가 60~67%라 도달의 과반이 막힌다. 게시물마다 iOS임을 밝히고, 랜딩에 Android 알림 폼(선택)을 둔다.

### 2-4. 시즌 훅 (팩 노출 기간은 `docs/DECISIONS.md` 2026-10-16)

| 시기 | 훅 | 팩 |
| --- | --- | --- |
| 10/16–11/02 | Halloween (진행 중 → 첫 캠페인) | `halloween-2026` |
| 11/24 | Loy Krathong (TH) | — (프레임 없음, 콘텐츠만) |
| 11/20–12/31 | Christmas·연말 | `xmas-2026` |
| 02/01–02/15 | Valentine | `valentine-2027` |
| 02/06 (팩 01/16–02/21) | Tết 2027 (VN 최대 명절) | `tet-2027` |
| 04/13–15 (팩 04/01–04/20) | Songkran (TH) | `songkran-2027` |
| 03/08·10/20·11/20 | VN 여성의 날·스승의 날 | — |

## 3. 수단별 분석 (2026-10 기준, $0 조건)

| 수단 | 가능 여부 | 결론 |
| --- | --- | --- |
| **Threads API** | Meta 개발자 앱을 개발 모드로 두고 계정을 Threads Tester로 넣으면 **본인 계정에 공개 게시, App Review 불필요**. 250건/일, 텍스트 500자, JPEG/PNG 8MB, 캐러셀 2–20장 | 자동화 1순위 |
| **Instagram API (Instagram Login)** | 개발 모드 + Instagram Tester, 프로페셔널(크리에이터) 계정이면 **심사 없이 본인 계정 게시**. 100건/일, 이미지는 **JPEG만**, 공개 URL 필요, 캐러셀 10장 | 자동화 |
| Facebook 페이지 API | 개발 모드 게시는 관리자에게만 보인다 → 공개 게시는 App Review 필요 | 자동화 제외, Meta Business Suite 수동 예약 |
| **TikTok** | 직접 API(Content Posting)는 심사(2–6주) 전엔 비공개 강제. **Buffer**는 2026-05 공개 API를 열었고 **Free 플랜(3채널)까지 API 제공**(100 req/일) | Buffer API 경유 자동화, 폴백은 TikTok Studio 웹 예약(10일 선행, 무료) |
| X | 2026-02 무료 티어 폐지, 종량제(게시 $0.015, 링크 포함 $0.20) | 자체 연동 제외, Buffer 채널 1개로만 |
| Facebook 그룹 | 2024년 그룹 API 삭제, 브라우저 자동 게시는 계정 정지 사례 다수 | 수동(Claude 초안 → Cozy 게시) |
| Pantip / Dek-D / Reddit | API 없음, 홍보글 규칙 엄격(Reddit 90/10, Pantip 방 규칙) | 수동, 주 1회 이하, 체험기·질문 형식 |
| Zalo OA / LINE OA | 무료 티어 있음(Zalo 기본 무료, LINE 300건/월) | 팔로워가 생긴 뒤(v1.1) |
| 데스크톱 AI 에이전트 | **Aside**: Chromium 기반 AI 브라우저(macOS/Windows), 로그인된 사이트를 에이전트가 조작, Routines(예약 반복) 있음. 유료 $17–200/월, 무료는 제한판. **Claude Cowork** 예약 작업은 2026-07부터 클라우드 실행(유료 플랜). **Claude in Chrome**(Claude 구독 포함) | $0·클라우드 제약상 중심축이 아님. 커뮤니티 수동 게시 때 초안 작성·붙여넣기 보조로만 |
| 측정 | App Store **캠페인 링크**(`?pt=<provider>&ct=<channel>&mt=8`, 무료) → ASC Analytics "App Store Discovery and Engagement" **Detailed** 리포트에 Campaign 필드. Threads/IG Insights API. Firebase | 채널별 설치 측정 가능 |
| 금지 | Apple: 평점·리뷰에 보상·유도 금지(프로그램 퇴출 사유). 가짜 리뷰·사칭 UGC 금지 | 리뷰 캠페인 안 함 |

## 4. 전략

### 4-1. 우선순위와 계정 구조

- **Fourpop 먼저**(시각·트렌드), Nuni는 Threads 중심으로 가볍게.
- 계정은 **앱 × 언어 = 4개 브랜드**: `fourpop-vi`, `fourpop-th`, `nuni-vi`, `nuni-th`. 한 계정에 두 언어를 섞으면 양쪽 피드가 다 망가진다. 핸들(예 `fourpop.vn`)은 Cozy가 정한다.

### 4-2. Phase 1 채널 매트릭스 (주당 게시 수, 첫 4주)

| 브랜드 | Threads(API) | Instagram(API) | TikTok(Buffer) | 기타 |
| --- | --- | --- | --- | --- |
| fourpop-vi | 7 | 4 (캐러셀) | 3–4 (포토 캐러셀) | FB 페이지 수동 2 |
| fourpop-th | 7 | 4 | 3–4 | X(Buffer) 5 |
| nuni-vi | 5 | 2 | – | – |
| nuni-th | 5 | 2 | – | – |

- 게시 슬롯(ICT): **07:30 / 12:30 / 20:00** (조사된 출근·점심·저녁 피크. 2주 뒤 자체 인사이트로 조정).
- 콘텐츠 필러 — Fourpop: 포즈 아이디어, 오늘의 프레임, 시즌 팩, "집에서 네컷" 튜토리얼, 네컷 문화(K-컬처), 트렌드 참여. Nuni: 오늘의 구름(체크인 질문), 마스코트 공감 밈, 월간 카드 쇼케이스, 힐링 한 줄, 스트릭 챌린지, (TH) 행운색.
- 톤: `design/DESIGN_SYSTEM.md`대로 짧고 sentence case, 대문자 변환 금지. 어휘는 앱 i18n(`design/i18n`)과 스토어 카피를 재사용.

### 4-3. 커뮤니티 레이어 (수동, 주 30분)

매주 "커뮤니티 팩" 국가별 2건을 Claude가 초안으로 만들고 Cozy가 올린다. 규칙: 같은 글을 여러 곳에 복붙하지 않기, 체험기·질문 형식, 링크는 캠페인 링크, 그룹 규칙 먼저 읽기, 답글에 성실히 반응하기. Reddit은 2주간 댓글로 카르마를 쌓은 뒤.

### 4-4. 하지 않는 것

리뷰 보상·유도, 그룹 자동 게시, 가짜 UGC·가짜 후기, X 자체 연동, 유료 광고(예산 생기면 9장).

## 5. 자동화 아키텍처 ($0 · 클라우드)

```
[주 1회] Claude Code에서 /marketing-weekly
   → marketing/pillars.yaml · seasons.json · 지난주 리포트
   → marketing/queue/<ISO주>/posts.json (vi/th/en 캡션·해시태그·슬롯·이미지 스펙)
   → pnpm marketing:render  (Pexels 사진 → 실제 프레임 PNG 슬롯에 합성, 마스코트 카드; resvg + sharp)
   → 브랜치 marketing/<주> → PR (미리보기)
[Cozy 10–15분] PR 검토·수정·머지 = 승인
[자동] pages.yml 이 marketing/queue/<주>/assets 를 https://cozynye.github.io/apps/m/<주>/ 로 공개
[자동, 하루 3회 cron] marketing-publish.yml → scripts/marketing/publish.ts
   → 시간이 된 게시물: Threads API / Instagram API 직접, TikTok·X 는 Buffer API
   → posts.json 의 status → posted + 결과 id 커밋 ([skip ci])
[자동, 매주 월] marketing-report.yml → docs/marketing/reports/<주>.md
   → ASC 캠페인 지표 + Threads/IG 인사이트 → 다음 주 생성에 반영
```

비용이 $0인 이유: Meta API·Buffer Free·Pexels API·GitHub Actions(공개 저장소라 분 제한 없음)·GitHub Pages·ASC API 모두 무료. 콘텐츠 생성은 Cozy의 Claude 구독 안에서 Claude Code가 한다(API 과금 없음).

## 6. 측정·KPI

- 채널별 `ct` 토큰(`marketing/links.json`)으로 App Store 유입을 나눈다. 리포트는 주간 md로 쌓인다.
- 첫 2주는 **기준선 수집**이 목표(목표치는 데이터 뒤에 정한다). 보는 지표: 채널별 제품 페이지 조회·다운로드, 게시물별 조회·좋아요·답글, 팔로워 증감, Firebase `booth_share`/`share_card`.

## 7. 리스크·한계 (정직하게)

- vi/th 카피에 네이티브 검수가 없다 → 짧은 문장, 앱 i18n 어휘 재사용, 초기 사용자 피드백으로 보정. **미검증 상태로 출발.**
- 스톡 사진은 동남아 얼굴이 적어 "광고 느낌"이 날 수 있다 → 캔디드·로파이 쿼리, 마스코트·프레임 중심 비율을 높이고, 출시 뒤 허락받은 UGC로 교체.
- 무음 슬라이드쇼 TikTok은 성과가 낮다 → 포토 캐러셀 우선, 가능하면 Cozy가 주 1개 실촬영.
- Buffer API는 베타(GraphQL). TikTok 이미지 캐러셀 지원은 셋업 때 확인, 불가 시 TikTok Studio 수동 예약.
- GitHub cron은 수 분~수십 분 지연될 수 있다. Meta 장기 토큰은 60일마다 갱신.
- 커뮤니티 게시는 자동화할 수 없다(정지 위험). Cozy 시간이 주 30분 든다.
- 공유 이미지에 브랜드 마크가 없어 바이럴 루프가 약하다(10장).

## 8. 커뮤니티 후보 (Cozy가 가입·규칙 확인, CHECKLIST G)

- 베트남: Facebook에서 `photobooth`, `chụp ảnh`, `sống ảo`, `Gen Z` 키워드로 회원 수 많은 공개 그룹을 고른다(검색 결과는 로그인 상태에 따라 달라 여기 고정 목록을 두지 않는다). Threads는 해시태그 `#photobooth #chụpảnh #sốngảo #chữalành`로 대화에 참여. Reddit `r/VietNam`은 홍보 금지에 가까우니 질문·댓글만.
- 태국: Pantip 사이암스퀘어(10대·대학 생활)·카메라 방에 "앱으로 네컷 찍어봄" 체험기(판매·홍보 톤 금지), X 해시태그 `#โฟโต้บูธ #ถ่ายรูป #ฮีลใจ`, Facebook 포토부스·K-컬처 그룹, Reddit `r/Thailand`는 광고 금지.

## 9. 예산이 생기면 (지금은 제외)

- Apple Search Ads: 베트남·태국 모두 가능. 브랜드·카테고리 키워드로 일 $5–10 테스트. 콘솔의 키워드 인기도는 **무료로 조회**할 수 있어 ASO 키워드 조사에만 써도 된다.
- TikTok Spark Ads: 잘 된 오가닉을 부스트. 동남아 CPM은 $1 미만, 앱 설치 CPI $0.5–1.8 수준(업계 평균).
- KOC 시딩: 베트남 REVU·ACCESS KOC(마이크로 KOC 대량 부킹), 태국 Tellscore, 범동남아 Hiip(최소 $500). 앱이 무료라 "무료 제공"은 보상이 안 되므로 **크리에이터 전용 프레임 팩**(v1.1 CDN 팩) 같은 협업 보상을 설계해야 한다.
- 네이티브 카피 검수 외주(vi·th 각 월 1회).
- 도구: Aside Routines(커뮤니티 모니터링 자동화), Postiz(API+MCP, $29/월), ASO 도구(Astro $9/월).

## 10. 앱 내 성장 훅 제안 (v1.0.1, Cozy 결정 필요 — 이번 작업에서 구현하지 않음)

1. 내보내기 이미지 하단에 작은 "Fourpop"/"Nuni" 브랜드 마크(유료 워터마크와는 별개 판단).
2. 공유 시트에 캡션·캠페인 링크·해시태그 기본 첨부.
3. Fourpop 설정에 평가 요청 행(Nuni에는 있음).
4. 스토어 카피 "40 frames" → 실제 70 프레임·100 스티커로 갱신, 온보딩의 "Stories/TikTok" 문구 정리.

## 11. 출처

- 베트남 플랫폼 사용률·Threads 성장: Decision Lab Connected Consumer(Q4 2025), Q&Me 모바일 앱 트렌드 2026, Brands Vietnam(Threads 2026).
- 태국 Gen Z 플랫폼: YouGov "Generational trends: Thailand social media & Gen Z", Relevant Audience(LINE Thailand 2026), Primal(Lemon8).
- iOS 점유율: StatCounter mobile OS share, Viet Nam 2026-07 / Thailand 2026-06.
- 포토부스 트렌드: Điện Máy Chợ Lớn "Cách tạo ảnh photobooth"(Licowa), Advertising Vietnam(photobooth 마케팅), PLAN.md 시장 조사.
- Threads API: developers.facebook.com/docs/threads (Get started, Posts). Instagram: developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing. Pages API 개발 모드 제한: developers.facebook.com/docs/pages-api.
- Facebook 그룹 API 삭제(2024-02, Graph v19): techpoint.africa, developers.facebook.com community. 자동 게시 정지 사례: closo.co Facebook autoposter guide 2026.
- TikTok Content Posting API 비공개 제한·심사: developers.tiktok.com(content-sharing-guidelines), bundle.social(2026-08). TikTok Studio 예약 10일: hopperhq, metricool.
- Buffer 공개 API(2026-05, Free 포함): buffer.com/resources/buffer-api-is-here, developers.buffer.com(getting-started, posts-and-scheduling, hosting-media).
- X API 종량제: opentweet.io/x-api-pricing, zernio.com/blog/twitter-api-pricing (2026).
- Aside: aside.com, eesel.ai 리뷰(2026). Claude Cowork 예약 작업: alejandrorioja.com 가이드, hatchworks(2026).
- App Store 캠페인 링크·Analytics 리포트: developer.apple.com/help/app-store-connect/view-app-analytics/manage-campaigns, developer.apple.com/documentation/analytics-reports/app-store-discovery-and-engagement.
- Apple 리뷰 조작 금지: App Store Review Guidelines(개발자 프로그램 퇴출 조항).
- Pexels 라이선스·API 한도: help.pexels.com, pexels.com/api.
- 게시 시간대: timetopost.co(TikTok Vietnam/Thailand 2026), megadigital.ai.
- KOC 플랫폼·비용: Brands Vietnam(REVU 2026, ACCESS KOC), hiip.asia FAQ, Tellscore. Zalo OA 요금: misaeshop.vn, zenify.vn. LINE OA 요금: marketingoops.com.
