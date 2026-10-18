/** Validates a week's queue and prints every issue. Usage: pnpm tsx scripts/marketing/validate.ts --week 2026-W44 */
import { queueIssues, utcToIct } from '../../packages/marketing/src';
import { arg, readQueue } from './lib';

const week = arg('week');
if (!week) throw new Error('usage: validate.ts --week 2026-W44');
const q = readQueue(week, { lenient: true });
const issues = queueIssues(q);
for (const i of issues) console.log(`✗ ${i.id}: ${i.message}`);
const byBrand = new Map<string, number>();
for (const p of q.posts) byBrand.set(`${p.brand}/${p.channel}`, (byBrand.get(`${p.brand}/${p.channel}`) ?? 0) + 1);
console.log(`\n${week}: ${q.posts.length} posts`);
for (const [k, n] of [...byBrand].sort()) console.log(`  ${k}: ${n}`);
console.log('\nschedule (ICT):');
for (const p of [...q.posts].sort((a, b) => a.publishAt.localeCompare(b.publishAt))) console.log(`  ${utcToIct(p.publishAt)}  ${p.id}  [${p.status}]`);
if (issues.length) {
  console.log(`\n${issues.length} issue(s)`);
  process.exit(1);
}
console.log('\nvalid');
