# 배포 전 체크리스트 (Release Gate)

이 파일은 **배포 전에 반드시 끝내야 하는 일**의 목록이다. 개발은 이 항목들이 비어 있어도 진행한다.

Cozy가 “배포 / 출시 / 심사 제출 / TestFlight 외부 배포”를 말하면 Claude Code는 이 파일을 열어 **체크되지 않은 항목을 전부** 다시 알려주고, 해결 전에는 제출하지 않는다 (CLAUDE.md §5). 건너뛰기는 Cozy가 항목을 지정해 명시적으로 말한 경우만, 아래 ‘건너뛴 항목’에 사유와 함께 기록한다.

표기: `[ ]` 미완료 · `[x]` 완료 · `[-]` 해당 없음/건너뜀(사유 기록). 앱별로 다른 항목은 Nuni(N)·Fourpop(F) 칸을 따로 체크한다.

---

## A. Cozy가 결정·전달해야 할 것 (미확정 사항)

| # | 항목 | 전달할 것 | N | F |
| --- | --- | --- | --- | --- |
| A1 | 개발자 계정 종류 (개인 / 법인) — 개인(App Store Connect 한국 개인 계정, 2026-10-15 확인) | 결정 한 줄 | [x] | [x] |
| A2 | 첫 출시 국가 (기본안: 베트남 + 태국 동시) | 확정 국가 목록 | [ ] | [ ] |
| A3 | 보유 도메인 주소 → `[DOMAIN]` — 2026-10-15 Cozy: 커스텀 도메인 대신 GitHub Pages `https://cozynye.github.io/apps/` 사용 | — | [x] | [x] |
| A4 | 약관·개인정보처리방침 시행일 → `[EFFECTIVE DATE]` — 2026-10-15 (Cozy) | — | [x] | [x] |
| A5 | Fourpop 첫 시즌팩 id·테마 → `[FIRST_SEASON_PACK_ID]` — 1.0 무료라 **선택**: 무료 다운로드 팩으로 올릴 때만(없으면 상점은 번들 팩만 표시) | id + 테마 (예 `tet_2027`, 뗏) 또는 ‘1.0은 없음’ | — | [ ] |
| A6 | 태국 App Store 결제 수단 현지 지원 범위 확인 — 1.0 무료(Cozy 결정 2026-10-15), 결제 추가 시(v1.1) | 확인 결과 한 줄 | [-] | [-] |
| A7 | 세금·정산 은행 정보 — 1.0 무료(Cozy 결정 2026-10-15), 유료 앱 계약 자체를 보류 | App Store Connect에 직접 입력 완료 확인 | [-] | [-] |
| A8 | 가격 최종 확인 (PLAN ‘수익 모델과 가격’ 표) — 1.0 무료(Cozy 결정 2026-10-15). v1.1 결제는 월·연 구독 대신 아이템 단위 일회성 해금으로 재설계(Cozy) | 그대로 / 변경값 | [-] | [-] |

## B. Cozy가 계정에서 해야 할 것

| # | 항목 | 전달할 것 | N | F |
| --- | --- | --- | --- | --- |
| B1 | P15 App Store Connect 계정 이슈 해결, 앱 등록, 유료 앱 계약·세금·은행 활성. 2026-10-15: 유료 앱 계약 서명·은행(KB) 처리 중. **대한민국 세금 양식은 사업자등록번호 + 90일 이내 영문 사업자등록증명(또는 국세청 고유번호+고유번호증)만 받음 — 개인 비사업자 옵션 없음** → 개인사업자 등록 필요. **→ 2026-10-15 Cozy 결정: 1.0은 무료 출시, 유료 앱 계약은 보류**(앱 등록은 완료). 남은 확인: ASC ‘한국 규정 준수 정보’가 무료 앱에도 사업자등록번호를 요구하는지(미확인) | 무료 앱 제출에 막히는 항목이 있으면 화면 캡처 | [-] | [-] |
| B2 | P16 인앱 상품 등록 (PLAN ‘상품 ID와 권한’ 표 그대로, Fourpop은 첫 시즌팩 1개). 2026-10-12 Nuni 구독 2개 생성됨 — **연간 7일 무료체험(Introductory Offer) 미설정**, 사용 가능 국가 VN·TH. — 1.0 무료(Cozy 결정 2026-10-15): 이 버전에 상품을 연결하지 않음 | 등록 완료 확인 | [-] | [-] |
| B3 | P17 RevenueCat: 앱 2개, Entitlement·Offering, In-App Purchase Key(.p8), Shared Secret, Server Notifications URL — 1.0 무료(Cozy 결정 2026-10-15): `EXPO_PUBLIC_MONETIZATION` 꺼짐, SDK 미초기화 | iOS API 키 2개 (`.env` / EAS Secrets) | [-] | [-] |
| B4 | P18 Firebase 프로젝트 2개 (Analytics, Crashlytics). 2026-10-13 Nuni plist 수령·연결(프로젝트 nuni-6dc73), EAS 파일 시크릿 `GOOGLE_SERVICES_PLIST_NUNI` production·preview 등록 완료(2026-10-15) | `GoogleService-Info.plist` 2개 | [x] | [ ] |
| B5 | P19 Cloudflare R2 버킷 + 공개 URL | CDN base URL | — | [ ] |
| B6 | Small Business Program 신청 (수수료 15%) — 1.0 무료(Cozy 결정 2026-10-15), 매출 없음 | 신청 완료 확인 | [-] | [-] |
| B7 | Sandbox 테스터 계정 1개 이상 — 1.0 무료(Cozy 결정 2026-10-15), 결제 없음 | 계정 이메일 (비밀번호는 문서에 쓰지 않음) | [-] | [-] |
| B8 | TestFlight 외부 테스터 현지 사용자 3명 이상 섭외 — C13(외부 테스트 1주)과 함께 Cozy 지시로 건너뜀 | 이메일 목록 | [-] | [-] |
| B9 | (권장) 약관·개인정보처리방침 법률 검토 | 검토 완료 / 생략 결정 | [ ] | [ ] |

## C. Claude Code가 해야 할 것 (배포 직전)

| # | 항목 | N | F |
| --- | --- | --- | --- |
| C1 | `scripts/check-placeholders.sh` 결과 0건 (`[DOMAIN]`, `[TERMS URL]`, `[PRIVACY URL]`, `[EFFECTIVE DATE]`, `[FIRST_SEASON_PACK_ID]`, `TODO(release)`) — 2026-10-15 자리표시자 0건; 스크립트의 시크릿 검사는 2026-10-15부터 RC 키를 결제 켠 경우에만 요구, CDN URL은 안내만 → Fourpop은 plist만 남음 | [x] | [ ] |
| C2 | P21 `web/legal` 개인정보처리방침·이용약관·지원 페이지를 `https://cozynye.github.io/apps/`에 배포(GitHub Pages, Actions), URL 접속 확인 — 2026-10-15 세 URL 모두 200 (시행일은 아직 자리표시자) | [x] | [x] |
| C3 | 앱 내 A13/B13 약관 본문과 웹 페이지 본문 일치, 시행일 반영 — 같은 `legalMarkdown` 소스에서 생성, 2026-10-15 시행일 반영 | [x] | [x] |
| C4 | 실제 RevenueCat 키·실제 상품으로 Sandbox 검증: 구독·체험·체험 자격 없음·단품·복원·만료 — 1.0 무료(Cozy 결정 2026-10-15), v1.1 | [-] | [-] |
| C5 | Firebase DebugView에서 이벤트 확인, `mood`·본문·태그 이름 미전송 확인 (Nuni 2026-10-14 실기기 DebugView) | [x] | [ ] |
| C6 | Fourpop: R2에 `manifest.json` + 첫 시즌팩 업로드, 앱에서 상점·다운로드 확인 — A5가 ‘1.0은 없음’이면 [-] (구매 단계는 1.0에 없음) | — | [ ] |
| C7 | PLAN ‘완료 기준’ 전 항목 충족 (Maestro iPhone·iPad, 3개 언어, 비행기 모드, 콜드 스타트, 합성 성능, 접근성) — Nuni: S2 완료, 건너뛴 항목은 아래 표 | [x] | [ ] |
| C8 | Info.plist 권한 문구 vi·th·en, `ITSAppUsesNonExemptEncryption = NO`, `supportsTablet: true` (2026-10-14 ios/ 생성물에서 확인) | [x] | [x] |
| C9 | 스토어 스크린샷: iPhone 6.9인치 + iPad 13인치 × vi·th·en × 6장 (`design/store/*.md`의 캡션) — 2026-10-14 생성 `docs/release/screenshots/<app>/<device>/<locale>/1–6.png` (시뮬레이터 dev 빌드, Fourpop 사진은 도형 샘플). 2026-10-15 무료 UI(잠금·워터마크 없음)로 재촬영 | [x] | [x] |
| C10 | 스토어 메타데이터 입력용 최종본 정리 (`design/store/*.md`에서 자리표시자 치환) — `docs/release/store-*.md` 2026-10-15 무료 1.0 반영(Premium 절·구독 문구 삭제, 가격 무료, URL 치환 완료). Nuni는 `store.config.json`으로 ASC에 푸시 완료 | [x] | [x] |
| C11 | 개인정보 라벨 답변표 (`design/legal/README.md` 매핑) 최종본 — `docs/release/privacy-labels.md` | [x] | [x] |
| C12 | 심사 노트 최종본 (로그인 없음, 무료·결제 없음, 자체 브랜드·현지화 설명) — `docs/release/review-notes.md` 2026-10-15 무료 1.0 반영(Sandbox·상품 항목 삭제) | [x] | [x] |
| C13 | TestFlight 외부 테스트 1주, Crashlytics 크래시 없는 사용자 99.5% 이상 | [ ] | [ ] |
| C14 | 버전·빌드 번호, 릴리스 노트(vi·th·en) — 1.0.0(`app.json`), 빌드 번호는 EAS autoIncrement(`docs/release/eas.md`), `docs/release/release-notes.md` 2026-10-15 무료 문구 반영 | [x] | [x] |

## D. 알고 가는 것 (차단하지 않음)

- vi·th 문구는 네이티브 검수 없이 초안으로 출시한다. 출시 후 리뷰·TestFlight 피드백으로 보완 (S6).
- iOS 위젯이 빌드 문제로 빠졌다면 v1.1로 미룬 사실을 릴리스 노트에서 빼고 DECISIONS에 기록.

## 건너뛴 항목

| 날짜 | 항목 | 앱 | 사유 (Cozy 지시) |
| --- | --- | --- | --- |
| 2026-10-13 | C7 중 콜드 스타트 2초 측정 (iPhone 12 Release, Instruments) | Nuni | Cozy: “콜드스타트 하지말고” |
| 2026-10-13 | C13 TestFlight 외부 테스트 1주 + Crashlytics 99.5% | Nuni | Cozy: “테스트플라이트도 안해도 된다” |
| 2026-10-14 | C7 중 콜드 스타트 2초, HD 메모리 300MB(Instruments) · C13 TestFlight 1주 | Fourpop | Cozy: “건너뛰고 일단 개발 빨리하고 배포하고 싶다” |
| 2026-10-15 | A6·A7·A8·B1(유료 앱 계약)·B2·B3·B6·B7·C4 | Nuni·Fourpop | Cozy: 한국 계정 유료 앱 계약에 사업자등록번호가 필요 → “일단 수익화보다 사용자 확보를 먼저” — 1.0은 구독·단품·광고 없이 전부 무료, 수익화는 추후 아이템 단위 인앱 해금으로 |
| 2026-10-15 | B8 외부 테스터 섭외 (C13과 한 묶음) | Nuni·Fourpop | Cozy 2026-10-13/14 “테스트플라이트도 안해도 된다” |
