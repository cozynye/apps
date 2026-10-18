/** Shared I/O helpers for scripts/marketing (env, config files, queue files, HTTP). Pure logic lives in packages/marketing. */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { App, Brand, Channel, Locale, Queue } from '../../packages/marketing/src';
import { isWeekId, parseQueue, queueSchema } from '../../packages/marketing/src';

export const ROOT = join(import.meta.dirname, '../..');
export const MARKETING = join(ROOT, 'marketing');
export const QUEUE = join(MARKETING, 'queue');
export const DESIGN = join(ROOT, 'design');

/** Env lookup by name (secret names come from marketing/accounts.json). Node scripts only, never app code. */
const ENV: Record<string, string | undefined> = process.env;
export const readEnv = (name: string): string | undefined => ENV[name];

/** Loads .env for local runs (CI uses GitHub Secrets). Never overrides variables already set. */
export function loadDotenv(): void {
  const p = join(ROOT, '.env');
  if (!existsSync(p)) return;
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(raw.trim());
    if (m && ENV[m[1]!] === undefined) ENV[m[1]!] = m[2]!.replace(/^"(.*)"$/, '$1');
  }
}

export type ChannelConfig = { tokenEnv?: string; via?: 'buffer'; channelIdEnv?: string; manual?: boolean };
export type Accounts = {
  assetBaseUrl: string;
  brands: Record<Brand, { app: App; locale: Locale; handle: string; channels: Partial<Record<Channel, ChannelConfig>> }>;
  buffer: { apiKeyEnv: string };
  pexels: { apiKeyEnv: string };
};
export type Links = { providerToken: string; androidWaitlist: string; landing: Record<App, string> };

const json = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
export const accounts = (): Accounts => json<Accounts>(join(MARKETING, 'accounts.json'));
export const links = (): Links => json<Links>(join(MARKETING, 'links.json'));

/** Queue folders that are real ISO weeks (skips _example). */
export function weekDirs(): string[] {
  if (!existsSync(QUEUE)) return [];
  return readdirSync(QUEUE).filter(isWeekId).sort();
}

export const queueFile = (week: string) => join(QUEUE, week, 'posts.json');

export function readQueue(week: string, { lenient = false } = {}): Queue {
  const data = json<unknown>(queueFile(week));
  return lenient ? queueSchema.parse(data) : parseQueue(data);
}

export function writeQueue(week: string, q: Queue): void {
  mkdirSync(join(QUEUE, week), { recursive: true });
  writeFileSync(queueFile(week), `${JSON.stringify(q, null, 2)}\n`);
}

export const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
export const flag = (name: string): boolean => process.argv.includes(`--${name}`);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const mask = (s: string) => (s.length > 10 ? `${s.slice(0, 4)}…${s.slice(-4)}` : '••••');

export function env(name: string): string {
  const v = readEnv(name);
  if (!v) throw new Error(`missing env ${name} (see docs/marketing/CHECKLIST.md)`);
  return v;
}

/** fetch + JSON with the response body in the error message (Meta and Buffer put the useful part there). */
export async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url.replace(/access_token=[^&]+/, 'access_token=…')} → ${res.status}\n${text.slice(0, 600)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

/** Meta Graph-style POST: form-encoded params + access_token. */
export function graphPost<T = any>(url: string, params: Record<string, string>, token: string): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token });
  return fetchJson<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
}

export function graphGet<T = any>(url: string, params: Record<string, string>, token: string): Promise<T> {
  const q = new URLSearchParams({ ...params, access_token: token });
  return fetchJson<T>(`${url}?${q}`);
}

/** GitHub Actions log annotations degrade to plain lines locally. */
export const warn = (msg: string) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `warning: ${msg}`);
export const error = (msg: string) => console.log(process.env.GITHUB_ACTIONS ? `::error::${msg}` : `error: ${msg}`);
