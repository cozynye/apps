/**
 * Weekly marketing report → docs/marketing/reports/<week>.md
 *
 *   1. queue summary (posted / failed / skipped per brand and channel)
 *   2. Threads insights per post (views, likes, replies, reposts, quotes) + followers
 *   3. Instagram insights per post (reach, likes, comments, saved, shares) + followers
 *   4. App Store campaign links: "App Store Discovery and Engagement" (Detailed) report, Campaign × Event, via the
 *      App Store Connect Analytics Reports API (same JWT as scripts/asc-screenshots.ts; the key may need the Admin role)
 *
 * Every section degrades to a note instead of failing, so the report is always written.
 *   pnpm marketing:report [--week 2026-W44]
 */
import { createPrivateKey, sign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import type { Brand, Post } from '../../packages/marketing/src';
import { APP_IDS, BRANDS, INSTAGRAM_API, THREADS_API, isoWeek, utcToIct, weekDates } from '../../packages/marketing/src';
import { ROOT, accounts, arg, graphGet, loadDotenv, readEnv, readQueue, weekDirs } from './lib';

loadDotenv();
if (!weekDirs().length) {
  // Before the first queue exists the Monday job would commit an empty report every week.
  console.log('no queue in marketing/queue yet; nothing to report');
  process.exit(0);
}
const DAY = 86_400_000;
const week = arg('week') ?? isoWeek(new Date(Date.now() - 7 * DAY));
const dates = weekDates(week);
const from = dates[0]!;
const to = dates[6]!;
const cfg = accounts();
const OUT = join(ROOT, 'docs/marketing/reports');
const lines: string[] = [`# 마케팅 주간 리포트 ${week} (${from} ~ ${to})`, '', `생성: ${new Date().toISOString()} · \`pnpm marketing:report --week ${week}\``, ''];
const note = (s: string) => lines.push(`> ${s}`, '');
const firstLine = (e: unknown) => (e as Error).message.split('\n')[0] ?? '';

// ---------- 1. queue ----------
const inWeek = (p: Post) => p.publishAt >= `${from}T00:00:00.000Z` && p.publishAt <= `${to}T23:59:59.999Z`;
const all: Post[] = [];
for (const w of weekDirs()) {
  try {
    all.push(...readQueue(w, { lenient: true }).posts);
  } catch (e) {
    note(`큐 ${w} 읽기 실패: ${(e as Error).message.split('\n')[0]}`);
  }
}
const weekPosts = all.filter(inWeek);
lines.push('## 1. 게시 요약', '', '| 브랜드 | 채널 | posted | failed | skipped | scheduled |', '| --- | --- | --- | --- | --- | --- |');
const groups = new Map<string, Record<Post['status'], number>>();
for (const p of weekPosts) {
  const k = `${p.brand}|${p.channel}`;
  const g = groups.get(k) ?? { posted: 0, failed: 0, skipped: 0, scheduled: 0 };
  g[p.status] += 1;
  groups.set(k, g);
}
for (const [k, g] of [...groups].sort()) {
  const [b, c] = k.split('|');
  lines.push(`| ${b} | ${c} | ${g.posted} | ${g.failed} | ${g.skipped} | ${g.scheduled} |`);
}
if (!groups.size) lines.push('| – | – | 0 | 0 | 0 | 0 |');
lines.push('');
const failed = weekPosts.filter((p) => p.status === 'failed');
if (failed.length) {
  lines.push('실패:', '');
  for (const p of failed) lines.push(`- \`${p.id}\`: ${p.result?.error?.split('\n')[0] ?? '?'}`);
  lines.push('');
}

// ---------- 2/3. Meta insights ----------
type Insight = { name: string; values?: { value: number }[]; total_value?: { value: number } };
const val = (d: Insight[] | undefined, name: string) => {
  const m = d?.find((x) => x.name === name);
  return m?.total_value?.value ?? m?.values?.[0]?.value ?? '';
};
const tokenFor = (brand: Brand, channel: 'threads' | 'instagram') => {
  const envName = cfg.brands[brand]?.channels[channel]?.tokenEnv;
  return envName ? readEnv(envName) : undefined;
};
const posted = (channel: 'threads' | 'instagram') =>
  all.filter((p) => p.channel === channel && p.status === 'posted' && p.result?.id && p.publishAt >= `${dates[0]}T00:00:00.000Z` && p.publishAt <= `${to}T23:59:59.999Z`);

async function main(): Promise<void> {
  lines.push('## 2. Threads', '');
  {
    const rows: string[] = [];
    for (const brand of BRANDS) {
      const token = tokenFor(brand, 'threads');
      if (!token) {
        rows.push(`| ${brand} | (토큰 없음) | | | | | |`);
        continue;
      }
      try {
        const me = await graphGet<{ id: string }>(`${THREADS_API}/me`, { fields: 'id' }, token);
        const f = await graphGet<{ data: Insight[] }>(`${THREADS_API}/${me.id}/threads_insights`, { metric: 'followers_count' }, token).catch(() => ({ data: [] }));
        rows.push(`| ${brand} | 팔로워 ${val(f.data, 'followers_count')} | | | | | |`);
      } catch (e) {
        rows.push(`| ${brand} | 오류: ${firstLine(e).slice(0, 80)} | | | | | |`);
      }
      for (const p of posted('threads').filter((p) => p.brand === brand)) {
        try {
          const r = await graphGet<{ data: Insight[] }>(`${THREADS_API}/${p.result!.id}/insights`, { metric: 'views,likes,replies,reposts,quotes' }, token);
          rows.push(`| ${brand} | ${utcToIct(p.publishAt)} [${p.pillar ?? ''}](${p.result?.permalink ?? ''}) | ${val(r.data, 'views')} | ${val(r.data, 'likes')} | ${val(r.data, 'replies')} | ${val(r.data, 'reposts')} | ${val(r.data, 'quotes')} |`);
        } catch (e) {
          rows.push(`| ${brand} | ${p.id} | 오류 ${firstLine(e).slice(0, 60)} | | | | |`);
        }
      }
    }
    lines.push('| 브랜드 | 게시물 | views | likes | replies | reposts | quotes |', '| --- | --- | --- | --- | --- | --- | --- |', ...rows, '');
  }

  lines.push('## 3. Instagram', '');
  {
    const rows: string[] = [];
    for (const brand of BRANDS) {
      const token = tokenFor(brand, 'instagram');
      if (!token) {
        rows.push(`| ${brand} | (토큰 없음) | | | | | |`);
        continue;
      }
      try {
        const me = await graphGet<{ followers_count?: number; media_count?: number }>(`${INSTAGRAM_API}/me`, { fields: 'followers_count,media_count' }, token);
        rows.push(`| ${brand} | 팔로워 ${me.followers_count ?? '?'} · 게시물 ${me.media_count ?? '?'} | | | | | |`);
      } catch (e) {
        rows.push(`| ${brand} | 오류: ${firstLine(e).slice(0, 80)} | | | | | |`);
      }
      for (const p of posted('instagram').filter((p) => p.brand === brand)) {
        try {
          const r = await graphGet<{ data: Insight[] }>(`${INSTAGRAM_API}/${p.result!.id}/insights`, { metric: 'reach,likes,comments,saved,shares' }, token);
          rows.push(`| ${brand} | ${utcToIct(p.publishAt)} [${p.pillar ?? ''}](${p.result?.permalink ?? ''}) | ${val(r.data, 'reach')} | ${val(r.data, 'likes')} | ${val(r.data, 'comments')} | ${val(r.data, 'saved')} | ${val(r.data, 'shares')} |`);
        } catch (e) {
          rows.push(`| ${brand} | ${p.id} | 오류 ${firstLine(e).slice(0, 60)} | | | | |`);
        }
      }
    }
    lines.push('| 브랜드 | 게시물 | reach | likes | comments | saved | shares |', '| --- | --- | --- | --- | --- | --- | --- |', ...rows, '');
  }

  // ---------- 4. App Store campaigns ----------
  lines.push('## 4. App Store 캠페인 링크 (ct)', '');
  const ASC = 'https://api.appstoreconnect.apple.com/v1';
  const KEY_ID = process.env.ASC_KEY_ID;
  const ISSUER = process.env.ASC_ISSUER_ID;
  const KEY_PATH = process.env.ASC_KEY_PATH;
  if (!KEY_ID || !ISSUER || !KEY_PATH) {
    note('ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_PATH 가 없어 건너뜀 (CHECKLIST E2).');
  } else {
    const b64url = (b: Buffer) => b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = () => {
      const now = Math.floor(Date.now() / 1000);
      const header = b64url(Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })));
      const payload = b64url(Buffer.from(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' })));
      const key = createPrivateKey(readFileSync(KEY_PATH, 'utf8'));
      const sig = sign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' });
      return `${header}.${payload}.${b64url(sig)}`;
    };
    const api = async (method: string, path: string, body?: unknown) => {
      const res = await fetch(path.startsWith('http') ? path : `${ASC}${path}`, {
        method,
        headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.replace(/\s+/g, " ").slice(0, 300)}`);
      return text ? JSON.parse(text) : {};
    };
    for (const [app, appId] of Object.entries(APP_IDS)) {
      lines.push(`### ${app}`, '');
      try {
        const reqs = await api('GET', `/apps/${appId}/analyticsReportRequests?filter[accessType]=ONGOING`);
        let reqId: string | undefined = reqs.data?.[0]?.id;
        if (!reqId) {
          const created = await api('POST', '/analyticsReportRequests', {
            data: { type: 'analyticsReportRequests', attributes: { accessType: 'ONGOING' }, relationships: { app: { data: { type: 'apps', id: appId } } } },
          });
          reqId = created.data.id;
          note('ONGOING 리포트 요청을 처음 만들었다. 데이터는 다음 날부터 쌓인다.');
        }
        const reports = await api('GET', `/analyticsReportRequests/${reqId}/reports?filter[category]=APP_STORE_ENGAGEMENT&limit=50`);
        const candidates = (reports.data ?? []).filter((r: any) => /Discovery and Engagement/i.test(r.attributes.name));
        const report = candidates.find((r: any) => /Detailed/i.test(r.attributes.name)) ?? candidates[0];
        if (!report) {
          note('"App Store Discovery and Engagement" 리포트가 아직 없다(요청 직후이거나 권한 부족).');
          continue;
        }
        if (!/Detailed/i.test(report.attributes.name)) note('Detailed 리포트가 없어 Standard를 읽음: Campaign 열이 없어 채널별 분리는 불가.');
        const instances = await api('GET', `/analyticsReports/${report.id}/instances?filter[granularity]=DAILY&limit=200`);
        const wanted = (instances.data ?? []).filter((i: any) => i.attributes.processingDate >= from && i.attributes.processingDate <= dates[6]!.slice(0, 8) + String(Number(dates[6]!.slice(8)) + 2).padStart(2, '0'));
        const agg = new Map<string, number>();
        const territory = new Map<string, number>();
        let rowsRead = 0;
        for (const inst of wanted) {
          const segs = await api('GET', `/analyticsReportInstances/${inst.id}/segments`);
          for (const s of segs.data ?? []) {
            const gz = Buffer.from(await (await fetch(s.attributes.url)).arrayBuffer());
            const tsv = gunzipSync(gz).toString('utf8').split('\n').filter(Boolean);
            const header = tsv[0]!.split('\t');
            const col = (name: string) => header.indexOf(name);
            const [cDate, cCamp, cEvent, cEng, cTerr, cCount] = ['Date', 'Campaign', 'Event', 'Engagement Type', 'Territory', 'Counts'].map(col);
            for (const line of tsv.slice(1)) {
              const f = line.split('\t');
              const d = f[cDate!] ?? '';
              if (d < from || d > to) continue;
              rowsRead += 1;
              const count = Number(f[cCount!] ?? 0);
              const camp = cCamp! >= 0 ? f[cCamp!] : '';
              if (camp) {
                const k = `${camp}|${f[cEvent!] ?? ''}|${f[cEng!] ?? ''}`;
                agg.set(k, (agg.get(k) ?? 0) + count);
              }
              const t = `${f[cTerr!] ?? '?'}|${f[cEvent!] ?? ''}`;
              territory.set(t, (territory.get(t) ?? 0) + count);
            }
          }
        }
        lines.push(`리포트 "${report.attributes.name}", 인스턴스 ${wanted.length}개, 행 ${rowsRead}개.`, '');
        lines.push('| ct | Event | Engagement | Counts |', '| --- | --- | --- | --- |');
        if (!agg.size) lines.push('| (캠페인 유입 없음) | | | |');
        for (const [k, n] of [...agg].sort((a, b) => b[1] - a[1])) lines.push(`| ${k.split('|').join(' | ')} | ${n} |`);
        lines.push('', '| Territory | Event | Counts |', '| --- | --- | --- |');
        for (const [k, n] of [...territory].sort((a, b) => b[1] - a[1]).slice(0, 12)) lines.push(`| ${k.split('|').join(' | ')} | ${n} |`);
        lines.push('');
      } catch (e) {
        note(`${app}: ${(e as Error).message.split('\n')[0]}`);
      }
    }
  }

  lines.push('## 5. 다음 주에 반영할 것', '', '- (생성기가 채움: 잘 된 필러·슬롯, 실패 원인, 커뮤니티 반응)', '');
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, `${week}.md`);
  writeFileSync(file, `${lines.join('\n')}\n`);
  console.log(`wrote ${file}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
