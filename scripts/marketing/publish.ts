/**
 * Publishes the posts whose time has come.
 *
 *   threads   → Threads API (Meta app in development mode, account added as Threads Tester)
 *   instagram → Instagram API with Instagram Login (same idea, Instagram Tester; JPEG from a public URL)
 *   tiktok, x → Buffer API: one scheduled post per item, Buffer publishes at `publishAt` and fetches the images then
 *   facebook  → manual (Meta Business Suite); marked skipped with a note
 *
 * Runs three times a day from .github/workflows/marketing-publish.yml and writes status/result back into posts.json.
 * Buffer posts are created as soon as they are on main (Buffer keeps the exact time); Meta posts go out at the slot.
 *
 *   pnpm marketing:publish [--week 2026-W44] [--dry-run] [--now 2026-10-26T13:00:00Z] [--list-channels]
 */
import type { Brand, Channel, Post, Queue } from '../../packages/marketing/src';
import {
  BUFFER_API,
  BUFFER_ORGANIZATIONS_QUERY,
  INSTAGRAM_API,
  THREADS_API,
  brandApp,
  brandLocale,
  bufferChannelsQuery,
  bufferCreatePost,
  campaignLink,
  composeCaption,
  ctToken,
  duePosts,
  instagramContainers,
  threadsContainers,
  withChildren,
} from '../../packages/marketing/src';
import { accounts, arg, env, error, fetchJson, flag, graphGet, graphPost, links, loadDotenv, mask, readEnv, readQueue, sleep, warn, weekDirs, writeQueue } from './lib';

loadDotenv();
const dryRun = flag('dry-run');
const now = new Date(arg('now') ?? Date.now());
const onlyWeek = arg('week');
const cfg = accounts();
const lnk = links();
const BUFFER_LEAD_DAYS = 7;

// ---------- Buffer ----------
async function buffer<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const key = env(cfg.buffer.apiKeyEnv);
  const res = await fetchJson<{ data?: T; errors?: { message: string }[] }>(BUFFER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, variables }),
  });
  if (res.errors?.length) throw new Error(`Buffer: ${res.errors.map((e) => e.message).join('; ')}`);
  return res.data as T;
}

async function listChannels(): Promise<void> {
  const orgs = await buffer<{ account: { organizations: { id: string; name: string }[] } }>(BUFFER_ORGANIZATIONS_QUERY);
  for (const org of orgs.account.organizations) {
    console.log(`organization ${org.name} (${org.id})`);
    const ch = await buffer<{ channels: { id: string; name: string; service: string }[] }>(bufferChannelsQuery(org.id));
    for (const c of ch.channels) console.log(`  ${c.service.padEnd(10)} ${c.name.padEnd(28)} ${c.id}`);
  }
}

// ---------- helpers ----------
const userIds = new Map<string, string>();
async function threadsUser(token: string): Promise<string> {
  const hit = userIds.get(token);
  if (hit) return hit;
  const me = await graphGet<{ id: string; username: string }>(`${THREADS_API}/me`, { fields: 'id,username' }, token);
  userIds.set(token, me.id);
  return me.id;
}
async function instagramUser(token: string): Promise<string> {
  const hit = userIds.get(token);
  if (hit) return hit;
  const me = await graphGet<{ user_id: string; username: string }>(`${INSTAGRAM_API}/me`, { fields: 'user_id,username' }, token);
  userIds.set(token, me.user_id);
  return me.user_id;
}

function assetUrls(week: string, p: Post): string[] {
  if (p.media.length && p.assets.length !== p.media.length) throw new Error('assets not rendered (run pnpm marketing:render)');
  const base = cfg.assetBaseUrl.endsWith('/') ? cfg.assetBaseUrl : `${cfg.assetBaseUrl}/`;
  return p.assets.map((a) => `${base}${week}/${a}`);
}

async function reachable(urls: string[]): Promise<string | null> {
  for (const u of urls) {
    const res = await fetch(u, { method: 'HEAD' });
    if (!res.ok) return `${u} → ${res.status}`;
  }
  return null;
}

function caption(p: Post): string {
  const link = p.link ? campaignLink({ app: brandApp(p.brand), providerToken: lnk.providerToken, ct: ctToken(p.channel, brandLocale(p.brand)) }) : null;
  const c = composeCaption({ channel: p.channel, text: p.text, hashtags: p.hashtags, link });
  if (!c.ok) throw new Error(`caption ${c.length} > ${c.limit}`);
  return c.caption;
}

function channelConfig(brand: Brand, channel: Channel) {
  const c = cfg.brands[brand]?.channels[channel];
  if (!c) throw new Error(`${brand} has no ${channel} in marketing/accounts.json`);
  return c;
}

type Outcome = { status: Post['status']; id?: string; permalink?: string; note?: string };

/** Secrets are required for real runs; a dry run only warns so the plan can be reviewed before setup is complete. */
function secret(name: string): string {
  if (!dryRun) return env(name);
  if (!readEnv(name)) warn(`${name} not set (fine for a dry run)`);
  return readEnv(name) ?? '(unset)';
}

// ---------- publishers ----------
async function publishThreads(p: Post, urls: string[]): Promise<Outcome> {
  const token = secret(channelConfig(p.brand, 'threads').tokenEnv!);
  const text = caption(p);
  const plan = threadsContainers(text, urls);
  if (dryRun) {
    console.log(`    threads ← ${JSON.stringify(plan.final)} ${plan.items.length ? `+${plan.items.length} items` : ''}`);
    return { status: 'scheduled' };
  }
  const uid = await threadsUser(token);
  const children: string[] = [];
  for (const item of plan.items) children.push((await graphPost<{ id: string }>(`${THREADS_API}/${uid}/threads`, item, token)).id);
  const container = await graphPost<{ id: string }>(`${THREADS_API}/${uid}/threads`, withChildren(plan.final, children), token);
  await sleep(urls.length ? 30_000 : 5_000); // Meta: "wait on average 30 seconds" for media containers
  const pub = await graphPost<{ id: string }>(`${THREADS_API}/${uid}/threads_publish`, { creation_id: container.id }, token);
  const info = await graphGet<{ permalink?: string }>(`${THREADS_API}/${pub.id}`, { fields: 'permalink' }, token).catch((): { permalink?: string } => ({}));
  return { status: 'posted', id: pub.id, permalink: info.permalink };
}

async function waitFinished(id: string, token: string): Promise<void> {
  for (let i = 0; i < 12; i += 1) {
    const s = await graphGet<{ status_code: string }>(`${INSTAGRAM_API}/${id}`, { fields: 'status_code' }, token);
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Instagram container ${id}: ${s.status_code}`);
    await sleep(5_000);
  }
  throw new Error(`Instagram container ${id} not ready after 60 s`);
}

async function publishInstagram(p: Post, urls: string[]): Promise<Outcome> {
  const token = secret(channelConfig(p.brand, 'instagram').tokenEnv!);
  const text = caption(p);
  const plan = instagramContainers(text, urls);
  if (dryRun) {
    console.log(`    instagram ← ${JSON.stringify(plan.final)} ${plan.items.length ? `+${plan.items.length} items` : ''}`);
    return { status: 'scheduled' };
  }
  const uid = await instagramUser(token);
  const children: string[] = [];
  for (const item of plan.items) {
    const c = await graphPost<{ id: string }>(`${INSTAGRAM_API}/${uid}/media`, item, token);
    await waitFinished(c.id, token);
    children.push(c.id);
  }
  const container = await graphPost<{ id: string }>(`${INSTAGRAM_API}/${uid}/media`, withChildren(plan.final, children), token);
  await waitFinished(container.id, token);
  const pub = await graphPost<{ id: string }>(`${INSTAGRAM_API}/${uid}/media_publish`, { creation_id: container.id }, token);
  const info = await graphGet<{ permalink?: string }>(`${INSTAGRAM_API}/${pub.id}`, { fields: 'permalink' }, token).catch((): { permalink?: string } => ({}));
  return { status: 'posted', id: pub.id, permalink: info.permalink };
}

async function publishBuffer(p: Post, urls: string[]): Promise<Outcome> {
  const c = channelConfig(p.brand, p.channel);
  const channelId = secret(c.channelIdEnv!);
  const text = caption(p);
  const dueAt = new Date(Math.max(new Date(p.publishAt).getTime(), now.getTime() + 120_000)).toISOString();
  const { query, variables } = bufferCreatePost({ channelId, text, dueAt, imageUrls: urls });
  if (dryRun) {
    console.log(`    buffer(${p.channel}) ← dueAt ${dueAt} channel ${mask(channelId)} ${urls.length} image(s)`);
    return { status: 'scheduled' };
  }
  const res = await buffer<{ createPost: { post?: { id: string; dueAt: string }; message?: string } }>(query, variables);
  if (!res.createPost.post) throw new Error(`Buffer: ${res.createPost.message ?? 'no post returned'}`);
  return { status: 'posted', id: res.createPost.post.id, note: `scheduled in Buffer for ${res.createPost.post.dueAt}` };
}

// ---------- main ----------
async function processWeek(week: string): Promise<{ posted: number; failed: number; skipped: number }> {
  let q: Queue;
  try {
    q = readQueue(week);
  } catch (e) {
    error(`${week}: ${(e as Error).message.split('\n')[0]}`);
    return { posted: 0, failed: 0, skipped: 0 };
  }
  const { due, stale } = duePosts(q, now);
  // Buffer keeps the schedule itself: hand over anything within the lead window, not just due posts.
  const bufferAhead = q.posts.filter(
    (p) => p.status === 'scheduled' && (p.channel === 'tiktok' || p.channel === 'x') && !due.includes(p) && !stale.includes(p)
      && new Date(p.publishAt).getTime() - now.getTime() < BUFFER_LEAD_DAYS * 86_400_000,
  );
  const counts = { posted: 0, failed: 0, skipped: 0 };
  let changed = false;
  const set = (p: Post, o: Outcome, err?: string) => {
    if (dryRun) return;
    p.status = o.status;
    p.result = { ...(o.id ? { id: o.id } : {}), ...(o.permalink ? { permalink: o.permalink } : {}), at: new Date().toISOString(), ...(err ? { error: err } : {}) };
    if (o.note) p.note = o.note;
    changed = true;
  };
  for (const p of stale) {
    console.log(`  skip  ${p.id} (slot ${p.publishAt} missed by >36 h)`);
    set(p, { status: 'skipped', note: 'missed the slot by more than 36 hours; reschedule by editing publishAt and status' });
    counts.skipped += 1;
  }
  for (const p of [...due, ...bufferAhead]) {
    console.log(`  ${p.channel.padEnd(9)} ${p.id} @ ${p.publishAt}`);
    try {
      if (p.channel === 'facebook') {
        set(p, { status: 'skipped', note: 'manual: schedule this in Meta Business Suite (no public Pages API without App Review)' });
        counts.skipped += 1;
        continue;
      }
      const urls = assetUrls(week, p);
      if (!dryRun && urls.length) {
        const bad = await reachable(urls);
        if (bad) {
          warn(`${p.id}: asset not public yet (${bad}); retrying next run`);
          p.result = { ...(p.result ?? {}), error: `asset not reachable: ${bad}` };
          changed = true;
          continue;
        }
      }
      let o: Outcome;
      if (p.channel === 'threads') o = await publishThreads(p, urls);
      else if (p.channel === 'instagram') o = await publishInstagram(p, urls);
      else o = await publishBuffer(p, urls);
      set(p, o);
      if (o.status === 'posted') counts.posted += 1;
      if (o.permalink) console.log(`    → ${o.permalink}`);
    } catch (e) {
      const msg = (e as Error).message;
      error(`${p.id}: ${msg.split('\n')[0]}`);
      set(p, { status: 'failed' }, msg.slice(0, 500));
      counts.failed += 1;
    }
  }
  if (changed) writeQueue(week, q);
  return counts;
}

async function main(): Promise<void> {
  if (flag('list-channels')) {
    await listChannels();
  } else {
    const weeks = onlyWeek ? [onlyWeek] : weekDirs();
    if (!weeks.length) console.log('no week folders in marketing/queue');
    const total = { posted: 0, failed: 0, skipped: 0 };
    for (const w of weeks) {
      console.log(`${w}${dryRun ? ' (dry run)' : ''}`);
      const c = await processWeek(w);
      total.posted += c.posted;
      total.failed += c.failed;
      total.skipped += c.skipped;
    }
    console.log(`done: posted ${total.posted}, failed ${total.failed}, skipped ${total.skipped} (now ${now.toISOString()})`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
