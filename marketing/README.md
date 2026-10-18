# marketing/ — 자동 게시 파이프라인

Nuni·Fourpop의 소셜 게시를 **주 1회 생성 → PR 승인 → 매일 3회 자동 게시 → 주간 리포트**로 돌리는 폴더. 전략·근거는 `docs/marketing/STRATEGY.md`, Cozy 셋업은 `docs/marketing/CHECKLIST.md`.

```
marketing/
  pillars.json        콘텐츠 필러·해시태그·톤·슬롯 (생성기가 매주 읽음)
  seasons.json        시즌 훅과 팩 노출 기간
  accounts.json       브랜드(앱×언어) → 채널 → 비밀값 이름 (값은 GitHub Secrets)
  links.json          App Store 캠페인 링크 provider token, 랜딩 URL
  community.md        수동 게시 채널 기록
  queue/<ISO주>/posts.json   그 주의 게시물 (아래 포맷)
  queue/<ISO주>/assets/*.jpg 렌더된 이미지 (Pages가 /m/<주>/ 로 공개)
  queue/_example/     포맷 참고용 — 게시되지 않음
packages/marketing/   스키마·주차/슬롯·캡션·API 페이로드·SVG 템플릿 (순수 로직, Jest)
scripts/marketing/    render.ts · publish.ts · report.ts · refresh-tokens.ts (I/O)
.github/workflows/    marketing-publish.yml (하루 3회) · marketing-report.yml (월요일) · marketing-refresh.yml (월 1회)
```

## 주간 흐름

1. **생성**(Claude Code): `/marketing-weekly` → 다음 주 `queue/<주>/posts.json` 작성 → `pnpm marketing:render --week <주>` → 브랜치 `marketing/<주>` → PR. PR 본문에 미리보기와 커뮤니티 팩(수동 게시용 초안)이 들어간다.
2. **승인**(Cozy, 10–15분): PR의 이미지·문구를 보고 고치거나 지울 것은 `status: "skipped"`로 바꾼 뒤 **머지**. 머지가 곧 승인이다.
3. **공개**: `pages.yml`이 `assets/`를 `https://cozynye.github.io/apps/m/<주>/`에 올린다(Threads·Instagram·Buffer는 공개 URL에서 이미지를 가져간다).
4. **게시**: `marketing-publish.yml`이 00:30·05:30·13:00 UTC(07:30·12:30·20:00 ICT)에 `publish.ts`를 실행해 시간이 된 `scheduled` 게시물을 올리고 `status`·`result`를 커밋한다(`[skip ci]`). 36시간 넘게 지난 것은 `skipped`.
5. **리포트**: 월요일 02:00 UTC `marketing-report.yml` → `docs/marketing/reports/<주>.md`(ASC 캠페인 유입 + Threads/Instagram 인사이트). 다음 생성 때 읽는다.

## 명령

```bash
pnpm marketing:render --week 2026-W44           # 이미지 렌더 (PEXELS_API_KEY 없으면 플레이스홀더 사진)
pnpm marketing:publish --dry-run                 # 게시 계획만 출력
pnpm marketing:publish --week 2026-W44 --dry-run # 특정 주만
pnpm marketing:publish --list-channels           # Buffer 채널 ID 조회 (BUFFER_API_KEY 필요)
pnpm marketing:report                            # 지난 주 리포트 생성 (ASC_* 필요)
pnpm marketing:refresh-tokens --dry-run          # Meta 토큰 갱신 계획
```

로컬 비밀값은 `.env`(gitignore). 워크플로는 GitHub Secrets.

## posts.json 포맷

`packages/marketing/src/schema.ts`가 기준. 요점:

- `id`: `<주>-<brand>-<channel>-NN` (예 `2026-W44-fourpop-vi-threads-01`).
- `brand`: `fourpop-vi | fourpop-th | nuni-vi | nuni-th`. `channel`: `threads | instagram | tiktok | x | facebook`(facebook은 수동).
- `publishAt`: UTC ISO. 슬롯은 ICT 07:30/12:30/20:00 = UTC 00:30/05:30/13:00.
- `text` + `hashtags[]` + `link`(true면 Threads·X·Facebook에 캠페인 링크 첨부; Instagram·TikTok은 "링크는 바이오").
- `media[]`: `strip`(프레임 id + Pexels 사진 4장) · `card`(헤드라인·줄·Nuni는 `mood`) · `frames`(프레임 썸네일 1–4). `format`: `feed` 1080×1350 · `vertical` 1080×1920 · `square`.
- `assets[]`: 렌더가 채움. `status`: `scheduled → posted | failed | skipped`. `result`: 게시 id·시각·오류.

## 폴백·주의

- TikTok 이미지 캐러셀이 Buffer API로 안 올라가면: 해당 글을 `skipped`로 두고 TikTok Studio 웹(10일 선행 예약)에 PR의 이미지·캡션을 수동 등록.
- Facebook 페이지는 Meta Business Suite에서 수동 예약(`channel: facebook` 글은 publish가 건너뛰고 `note`에 안내).
- Meta 토큰은 60일 만료. `marketing-refresh.yml`이 매월 갱신(`GH_ADMIN_TOKEN` 있을 때) 또는 경고.
- GitHub cron은 수 분~수십 분 늦을 수 있다. 정확한 분 단위가 중요하면 Buffer 예약(X·TikTok)처럼 플랫폼 예약을 쓴다.
- 리뷰·평점을 요구하거나 보상하는 문구 금지(App Store 규정). 그룹·포럼 자동 게시 금지(계정 정지).
