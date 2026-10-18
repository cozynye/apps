---
name: marketing-weekly
description: Draft next week's social posts for Nuni & Fourpop (marketing/queue/<week>/posts.json), render the images, and open a PR for Cozy's approval. Use when Cozy says 다음 주 콘텐츠 / 주간 큐 / 포스팅 만들어 / 마케팅 큐, or runs /marketing-weekly.
---

# Weekly marketing queue

You draft one week of posts for four brands (`fourpop-vi`, `fourpop-th`, `nuni-vi`, `nuni-th`), render the images and open a PR. Cozy's merge is the approval; GitHub Actions publishes at the slots. Everything you need to know about the pipeline is in `marketing/README.md`; strategy in `docs/marketing/STRATEGY.md`.

## 1. Gather inputs (read, don't guess)

1. Week: `pnpm tsx scripts/marketing/week.ts --next` → use `week` and `dates` (Monday…Sunday). If a queue for that week already exists, ask Cozy whether to replace it.
2. `marketing/pillars.json` — weekly mix per brand, pillar weights, tone rules, hashtags, iOS line, photo queries.
3. `marketing/seasons.json` — events active during the week (by `from`/`until`, `markets`). Season pillar only when a pack is live.
4. Last report `docs/marketing/reports/<previous week>.md` if it exists — repeat what worked (pillar, slot), fix failures, avoid repeating the exact same angle.
5. Previous queue `marketing/queue/<previous week>/posts.json` — do not reuse headlines, frames or photo queries back to back.
6. Frame ids: `node -e "const m=require('./design/assets/manifest.json');for(const p of m.packs)if(p.type==='frame')console.log(p.id, p.items.map(i=>i.id).join(' '))"`.
7. Vocabulary: `design/i18n/{common,nuni,fourpop}/{vi,th}.json`, `docs/release/store-nuni.md`, `docs/release/store-fourpop.md`. Posts must use the same words the app and the store use.

## 2. Write `marketing/queue/<week>/posts.json`

Schema: `packages/marketing/src/schema.ts` (`parseQueue`). Rules:

- Counts per brand/channel = `weeklyMix`. Spread over the 7 days and the three slots (ICT 07:30 / 12:30 / 20:00 → UTC 00:30 / 05:30 / 13:00; `slotUtc` in `packages/marketing/src/week.ts`). Never two posts of one brand in the same slot. Threads check-in questions go in the morning slot; strips in the evening.
- `id` = `<week>-<brand>-<channel>-NN`. `pillar` = pillar id.
- Vietnamese brands write Vietnamese, Thai brands Thai. Follow `tone.rules`. One emoji at most. Include the iOS line once (or "link in bio" on Instagram/TikTok). Threads/X posts set `link: true` (campaign link appended automatically); Instagram/TikTok `link: false`.
- Threads ≤ 500 characters including tags and link (≈75 chars); X ≤ 280.
- Media: Fourpop strips use real frame ids and 4 `photoQueries.candid` entries (vary them); Nuni cards set `mood` 1–5 matching the message; `frames` for season/showcase. Threads text-only posts have `media: []`.
- `facebook` posts (fourpop-vi, 2/week) are manual: include them with a `note` "Meta Business Suite에서 예약".
- No placeholders, no prices, no review/rating asks, no claims the app can't back.

Also write `marketing/queue/<week>/community.md`: two community drafts per country (Facebook group post, Pantip/Threads reply or Reddit comment) in the local language, each with the campaign link `ct` to use (`fbgroup_vi`, `pantip_th`, …), the rule reminder (no copy-paste across groups, experience/question format), and a Korean summary for Cozy.

## 3. Validate and render

```bash
pnpm marketing:validate --week <week>        # fix every issue it prints
pnpm marketing:render --week <week>          # needs PEXELS_API_KEY in .env; otherwise it renders placeholder tiles
```

If the renderer warned about a missing `PEXELS_API_KEY`, stop and tell Cozy — never open a PR with placeholder photos. Open 3–4 of the rendered JPEGs with the Read tool and check: text not cut, Thai renders, strip centred, footer visible. Fix copy or captions and re-render (`--only <postId>`).

## 4. Open the PR

```bash
git checkout -b marketing/<week>
git add marketing/queue/<week>
git commit -m "marketing: queue <week>"
git push -u origin marketing/<week>
gh pr create --title "Marketing queue <week>" --body-file <body.md>
```

PR body (Korean): a table brand × channel × count, the ICT schedule from `marketing:validate`, 4–6 preview images (`https://github.com/cozynye/apps/blob/marketing/<week>/marketing/queue/<week>/assets/<file>.jpg?raw=true`), the community pack, anything you were unsure about (translation, claims), and the approval line: "머지하면 예약 시간에 자동 게시됩니다. 빼고 싶은 글은 `status`를 `skipped`로 바꾸거나 지우세요."

Then tell Cozy in 2–4 lines what is in the queue and link the PR. Do not merge it yourself.

## 5. After the week

When Cozy asks how it went, read `docs/marketing/reports/<week>.md` (written Monday by `marketing-report.yml`, or run `pnpm marketing:report --week <week>`), summarise in Korean, and propose 2–3 concrete changes to `marketing/pillars.json` (slots, weights, hashtags). Record notable learnings in `marketing/community.md` and `docs/DECISIONS.md` when they change the approach.
