/**
 * i18n parity check (CI): every namespace must have the same keys in en/vi/th,
 * the same {{placeholders}} per key, and arrays of the same length. Exits 1 on any mismatch.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = join(import.meta.dirname, '../src/locales');
const NAMESPACES = ['common', 'nuni', 'fourpop'];
const LANGS = ['en', 'vi', 'th'] as const;

type Json = string | Json[] | { [key: string]: Json };

function flatten(value: Json, prefix = '', out = new Map<string, Json>()) {
  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, value);
  }
  return out;
}

const placeholders = (v: Json) =>
  JSON.stringify([...JSON.stringify(v).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort());

const errors: string[] = [];
for (const ns of NAMESPACES) {
  const files = Object.fromEntries(
    LANGS.map((lang) => [
      lang,
      flatten(JSON.parse(readFileSync(join(LOCALES, ns, `${lang}.json`), 'utf8')) as Json),
    ]),
  ) as Record<(typeof LANGS)[number], Map<string, Json>>;
  const en = files.en;
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    const other = files[lang];
    for (const key of en.keys()) {
      if (!other.has(key)) {
        errors.push(`${ns}/${lang}: missing ${key}`);
        continue;
      }
      const a = en.get(key)!;
      const b = other.get(key)!;
      if (placeholders(a) !== placeholders(b)) {
        errors.push(`${ns}/${lang}: placeholders differ for ${key}`);
      }
      if (Array.isArray(a) !== Array.isArray(b) || (Array.isArray(a) && Array.isArray(b) && a.length !== b.length)) {
        errors.push(`${ns}/${lang}: array shape differs for ${key}`);
      }
      if (typeof b === 'string' && b.trim() === '') errors.push(`${ns}/${lang}: empty ${key}`);
    }
    for (const key of other.keys()) {
      if (!en.has(key)) errors.push(`${ns}/${lang}: extra ${key} (not in en)`);
    }
  }
  console.log(`${ns}: ${en.size} keys`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`i18n check failed: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log('i18n check passed');
