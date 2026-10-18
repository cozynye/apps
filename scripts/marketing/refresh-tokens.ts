/**
 * Refreshes the long-lived Meta tokens (Threads, Instagram; 60-day life, refreshable once older than 24 h) and stores
 * them back into GitHub Secrets when GH_ADMIN_TOKEN (fine-grained PAT with Secrets write) is available.
 * Without it, prints what to update by hand. Runs monthly from marketing-refresh.yml.
 *   pnpm marketing:refresh-tokens [--dry-run]
 */
import { spawnSync } from 'node:child_process';

import { BRANDS } from '../../packages/marketing/src';
import { accounts, error, fetchJson, flag, loadDotenv, mask, readEnv, warn } from './lib';

loadDotenv();
const dryRun = flag('dry-run');
const cfg = accounts();
const repo = process.env.GITHUB_REPOSITORY ?? 'cozynye/apps';
const admin = process.env.GH_ADMIN_TOKEN;

type Refresh = { access_token: string; expires_in: number };
const ENDPOINT = {
  threads: (t: string) => `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(t)}`,
  instagram: (t: string) => `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(t)}`,
};

async function main(): Promise<void> {
  let failures = 0;
  for (const brand of BRANDS) {
    for (const channel of ['threads', 'instagram'] as const) {
      const envName = cfg.brands[brand]?.channels[channel]?.tokenEnv;
      if (!envName) continue;
      const token = readEnv(envName);
      if (!token) {
        warn(`${envName} not set; skipping`);
        continue;
      }
      if (dryRun) {
        console.log(`would refresh ${envName} (${mask(token)}) via ${channel}`);
        continue;
      }
      try {
        const r = await fetchJson<Refresh>(ENDPOINT[channel](token));
        const days = Math.round(r.expires_in / 86_400);
        if (admin) {
          const res = spawnSync('gh', ['secret', 'set', envName, '-R', repo, '--body', r.access_token], { env: { ...process.env, GH_TOKEN: admin }, encoding: 'utf8' });
          if (res.status !== 0) throw new Error(`gh secret set ${envName}: ${res.stderr}`);
          console.log(`refreshed ${envName}: valid ${days} days, secret updated`);
        } else {
          console.log(`refreshed ${envName}: valid ${days} days — no GH_ADMIN_TOKEN, update the secret by hand: gh secret set ${envName} -R ${repo}`);
          console.log(`  new token ${mask(r.access_token)} (printed masked; rerun with GH_ADMIN_TOKEN to store automatically)`);
        }
      } catch (e) {
        failures += 1;
        error(`${envName}: ${(e as Error).message.split('\n')[0]}`);
      }
    }
  }
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
