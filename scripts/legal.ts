import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

type Patch = { find: string; replace: string };

/** design/legal/<doc>-en.md with scripts/legal-patches.json applied (used by app and web/legal). */
export function legalMarkdown(doc: 'terms' | 'privacy'): string {
  const patches = (JSON.parse(readFileSync(join(ROOT, 'scripts/legal-patches.json'), 'utf8')) as Record<string, Patch[]>)[doc] ?? [];
  let md = readFileSync(join(ROOT, 'design/legal', `${doc}-en.md`), 'utf8');
  for (const { find, replace } of patches) {
    const count = md.split(find).length - 1;
    if (count !== 1) throw new Error(`legal patch for ${doc} matched ${count} times: ${find.slice(0, 60)}`);
    md = md.replace(find, replace);
  }
  return md;
}
