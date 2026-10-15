/**
 * Uploads the composed store screenshots to App Store Connect through the official API, replacing
 * whatever is in each device well. Use when the web uploader rejects files: the API returns Apple's
 * exact validation error instead of a generic message.
 *
 * Usage:
 *   ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=./AuthKey_XXXX.p8 pnpm tsx scripts/asc-screenshots.ts <nuni|fourpop> [--dry-run]
 *
 * The .p8 key is Cozy's (App Manager role is enough); keep it outside git (ignored by *.p8).
 * Locales: en → en-GB (primary) + en-US, vi → vi, th → th.
 * Wells: iphone-6.3 → APP_IPHONE_61 (1206×2622), ipad → APP_IPAD_PRO_3GEN_129 (2064×2752).
 */
import { createHash, createPrivateKey, sign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const API = 'https://api.appstoreconnect.apple.com/v1';
const APP_IDS: Record<string, string> = { nuni: '6821789626', fourpop: '6821789911' };
const LOCALES: Record<string, string[]> = { en: ['en-GB', 'en-US'], vi: ['vi'], th: ['th'] };
const WELLS: Record<string, string> = { 'iphone-6.3': 'APP_IPHONE_61', ipad: 'APP_IPAD_PRO_3GEN_129' };

const app = process.argv[2] ?? '';
const APP_ID = APP_IDS[app];
const dryRun = process.argv.includes('--dry-run');
if (!APP_ID) throw new Error('usage: asc-screenshots.ts <nuni|fourpop> [--dry-run]');
const ASC_KEY_ID = process.env.ASC_KEY_ID ?? '';
const ASC_ISSUER_ID = process.env.ASC_ISSUER_ID ?? '';
const ASC_KEY_PATH = process.env.ASC_KEY_PATH ?? '';
if (!ASC_KEY_ID || !ASC_ISSUER_ID || !ASC_KEY_PATH) throw new Error('set ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH');

const b64url = (b: Buffer) => b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
function token(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' })));
  const payload = b64url(Buffer.from(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' })));
  const key = createPrivateKey(readFileSync(ASC_KEY_PATH, 'utf8'));
  const sig = sign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${header}.${payload}.${b64url(sig)}`;
}

async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}\n${text}`);
  return (text ? JSON.parse(text) : {}) as T;
}

async function versionId(): Promise<string> {
  const r = await api('GET', `/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=5`);
  const editable = r.data.find((v: any) => ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY'].includes(v.attributes.appStoreState));
  if (!editable) throw new Error(`no editable version: ${r.data.map((v: any) => `${v.attributes.versionString}=${v.attributes.appStoreState}`).join(', ')}`);
  console.log(`version ${editable.attributes.versionString} (${editable.attributes.appStoreState})`);
  return editable.id;
}

async function localizations(version: string): Promise<Map<string, string>> {
  const r = await api('GET', `/appStoreVersions/${version}/appStoreVersionLocalizations?limit=50`);
  return new Map(r.data.map((l: any) => [l.attributes.locale, l.id]));
}

async function screenshotSet(localization: string, displayType: string): Promise<string> {
  const r = await api('GET', `/appStoreVersionLocalizations/${localization}/appScreenshotSets?filter[screenshotDisplayType]=${displayType}`);
  if (r.data[0]) return r.data[0].id;
  const c = await api('POST', '/appScreenshotSets', {
    data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: displayType }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localization } } } },
  });
  return c.data.id;
}

async function clearSet(set: string) {
  const r = await api('GET', `/appScreenshotSets/${set}/appScreenshots?limit=50`);
  for (const s of r.data) await api('DELETE', `/appScreenshots/${s.id}`);
  if (r.data.length) console.log(`  removed ${r.data.length} existing`);
}

async function upload(set: string, file: string, fileName: string) {
  const bytes = readFileSync(file);
  const reserve = await api('POST', '/appScreenshots', {
    data: { type: 'appScreenshots', attributes: { fileName, fileSize: bytes.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set } } } },
  });
  const id: string = reserve.data.id;
  for (const op of reserve.data.attributes.uploadOperations) {
    const headers: Record<string, string> = {};
    for (const h of op.requestHeaders) headers[h.name] = h.value;
    const res = await fetch(op.url, { method: op.method, headers, body: bytes.subarray(op.offset, op.offset + op.length) });
    if (!res.ok) throw new Error(`upload chunk ${res.status}: ${await res.text()}`);
  }
  await api('PATCH', `/appScreenshots/${id}`, {
    data: { type: 'appScreenshots', id, attributes: { uploaded: true, sourceFileChecksum: createHash('md5').update(bytes).digest('hex') } },
  });
  for (let i = 0; i < 30; i += 1) {
    const s = await api('GET', `/appScreenshots/${id}`);
    const state = s.data.attributes.assetDeliveryState;
    if (state.state === 'COMPLETE') return;
    if (state.state === 'FAILED') throw new Error(`${fileName}: ${JSON.stringify(state.errors)}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.warn(`  ${fileName}: still processing`);
}

async function main() {
  const version = await versionId();
  const locs = await localizations(version);
  console.log(`localizations: ${[...locs.keys()].join(', ')}`);
  for (const [folder, ascLocales] of Object.entries(LOCALES)) {
    for (const [well, displayType] of Object.entries(WELLS)) {
      const dir = join(ROOT, 'docs/release/screenshots', app, well, folder);
      if (!existsSync(dir)) {
        console.warn(`skip ${well}/${folder} (no folder)`);
        continue;
      }
      for (const locale of ascLocales) {
        const loc = locs.get(locale);
        if (!loc) {
          console.warn(`skip ${locale}: not on this version`);
          continue;
        }
        console.log(`${locale} ${displayType} ← ${well}/${folder}`);
        if (dryRun) continue;
        const set = await screenshotSet(loc, displayType);
        await clearSet(set);
        for (let i = 1; i <= 6; i += 1) {
          const file = join(dir, `${i}.png`);
          if (!existsSync(file)) continue;
          await upload(set, file, `${app}-${well}-${folder}-${i}.png`);
          console.log(`  ${i}.png ok`);
        }
      }
    }
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
