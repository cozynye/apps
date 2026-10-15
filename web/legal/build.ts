/**
 * Builds the static legal/support site (P21) into web/legal/public for GitHub Pages:
 * index.html (support), privacy.html, terms.html. Body text comes from design/legal (same as the
 * in-app A13/B13 screens, effective date via scripts/legal-patches.json). The site lives at
 * https://cozynye.github.io/apps/ (GitHub Pages, .github/workflows/pages.yml).
 * Run: pnpm legal:build
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import MarkdownIt from 'markdown-it';

import { legalMarkdown } from '../../scripts/legal';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(import.meta.dirname, 'public');
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

const tokens = JSON.parse(readFileSync(join(ROOT, 'design/tokens.json'), 'utf8')) as {
  color: { tokens: { name: string; value: { light: string; dark: string } }[] };
};
const color = (name: string) => tokens.color.tokens.find((t) => t.name === name)!.value;
const vars = (scheme: 'light' | 'dark') =>
  ['surface-0', 'surface-1', 'ink', 'ink-muted', 'line', 'nuni-deep']
    .map((n) => `--${n}: ${color(n)[scheme]};`)
    .join(' ');

function page(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Nuni & Fourpop</title>
<style>
  :root { ${vars('light')} color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { :root { ${vars('dark')} } }
  body { margin: 0; background: var(--surface-1); color: var(--ink);
    font: 16px/1.6 "Be Vietnam Pro", system-ui, -apple-system, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  nav { display: flex; gap: 16px; margin-bottom: 24px; font-size: 14px; }
  a { color: var(--nuni-deep); }
  h1 { font-size: 28px; line-height: 1.25; }
  h2 { font-size: 20px; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { border: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
  footer { margin-top: 48px; color: var(--ink-muted); font-size: 14px; }
</style>
</head>
<body>
<main>
<nav><a href="./">Support</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Use</a></nav>
${bodyHtml}
<footer>Chagyung · Seoul, Republic of Korea · <a href="mailto:nunicozy@gmail.com">nunicozy@gmail.com</a></footer>
</main>
</body>
</html>
`;
}

const support = `# Support

Nuni (mood diary) and Fourpop (photo booth) are made by Chagyung, an independent developer.

## Contact

Email **nunicozy@gmail.com**. Please include the app name, your iPhone or iPad model and iOS version.

## Restore purchases

There are no accounts. After reinstalling or on a new device, open the app and tap
**Settings › Restore purchases** (also on the Premium screen) while signed in with the same Apple ID.

## Cancel a subscription

Subscriptions are managed by Apple: **Settings › your name › Subscriptions** on your iPhone or iPad.

## Your data

Diary entries and photo strips stay on your device (and in your own iCloud if you turn on backup).
See the [Privacy Policy](privacy.html).
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), page('Support', md.render(support)));
for (const doc of ['privacy', 'terms'] as const) {
  const source = legalMarkdown(doc);
  const title = doc === 'privacy' ? 'Privacy Policy' : 'Terms of Use';
  writeFileSync(join(OUT, `${doc}.html`), page(title, md.render(source)));
}
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`web/legal: wrote ${OUT}`);
