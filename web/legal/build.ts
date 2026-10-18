/**
 * Builds the static site for GitHub Pages into web/legal/public:
 *   index.html (support), privacy.html, terms.html (P21) — body text from design/legal, same as the in-app A13/B13 screens
 *   nuni.html, fourpop.html — app landing pages (vi/th/en) with App Store campaign links (marketing/links.json)
 *   m/<ISO week>/assets/*.jpg — rendered social images from marketing/queue, fetched by Threads/Instagram/Buffer when publishing
 * Lives at https://cozynye.github.io/apps/ (.github/workflows/pages.yml). Run: pnpm legal:build
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import MarkdownIt from 'markdown-it';

import { campaignLink } from '../../packages/marketing/src/links';
import { isWeekId } from '../../packages/marketing/src/week';
import { legalMarkdown } from '../../scripts/legal';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(import.meta.dirname, 'public');
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

const tokens = JSON.parse(readFileSync(join(ROOT, 'design/tokens.json'), 'utf8')) as {
  color: { tokens: { name: string; value: { light: string; dark: string } }[] };
};
const color = (name: string) => tokens.color.tokens.find((t) => t.name === name)!.value;
const vars = (scheme: 'light' | 'dark') =>
  ['surface-0', 'surface-1', 'ink', 'ink-muted', 'line', 'nuni-deep', 'nuni-primary', 'nuni-soft', 'fourpop-deep', 'fourpop-primary', 'fourpop-soft']
    .map((n) => `--${n}: ${color(n)[scheme]};`)
    .join(' ');

type App = 'nuni' | 'fourpop';
type Locale = 'vi' | 'th' | 'en';
const links = JSON.parse(readFileSync(join(ROOT, 'marketing/links.json'), 'utf8')) as { providerToken: string; androidWaitlist: string };

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
    font: 16px/1.6 "Be Vietnam Pro", "Prompt", system-ui, -apple-system, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  nav { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; font-size: 14px; }
  a { color: var(--nuni-deep); }
  h1 { font-size: 28px; line-height: 1.25; }
  h2 { font-size: 20px; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { border: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
  footer { margin-top: 48px; color: var(--ink-muted); font-size: 14px; }
  .hero { padding: 28px 24px; border-radius: 20px; margin: 0 0 24px; }
  .hero.nuni { background: var(--nuni-soft); }
  .hero.fourpop { background: var(--fourpop-soft); }
  .hero h1 { margin: 0 0 4px; }
  .hero .sub { font-weight: 600; margin: 0 0 12px; }
  .hero p { margin: 0 0 12px; }
  .hero ul { margin: 0 0 16px; padding-left: 20px; }
  .badge { display: inline-block; background: #1f1f24; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 12px; font-weight: 600; }
  .meta { color: var(--ink-muted); font-size: 14px; margin-top: 12px; }
  .apps { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @media (min-width: 560px) { .apps { grid-template-columns: 1fr 1fr; } }
  .card { border: 1px solid var(--line); background: var(--surface-0); border-radius: 16px; padding: 16px; }
  .card h3 { margin: 0 0 6px; }
</style>
</head>
<body>
<main>
<nav><a href="./">Support</a><a href="nuni.html">Nuni</a><a href="fourpop.html">Fourpop</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Use</a></nav>
${bodyHtml}
<footer>Chagyung · Seoul, Republic of Korea · <a href="mailto:nunicozy@gmail.com">nunicozy@gmail.com</a></footer>
</main>
</body>
</html>
`;
}

/** Store copy per locale from docs/release/store-<app>.md (single source with App Store Connect). */
function storeCopy(app: App, locale: Locale): { name: string; subtitle: string; promo: string; captions: string[] } {
  const doc = readFileSync(join(ROOT, `docs/release/store-${app}.md`), 'utf8');
  const section = doc.split(/^## /m).find((s) => s.startsWith(`${locale}\n`));
  if (!section) throw new Error(`store-${app}.md: no ${locale} section`);
  const field = (label: string) => {
    const m = new RegExp(`^- \\*\\*${label}\\*\\*: (.+)$`, 'm').exec(section);
    if (!m) throw new Error(`store-${app}.md ${locale}: missing ${label}`);
    return m[1]!.trim();
  };
  const capLine = section.split('\n').find((l) => l.includes('Screenshot captions')) ?? '';
  const captions = [...capLine.matchAll(/\d+ "([^"]+)"/g)].map((m) => m[1]!);
  return { name: field('Name'), subtitle: field('Subtitle'), promo: field('Promotional text'), captions };
}

const T: Record<Locale, { download: string; meta: string; android: string }> = {
  vi: { download: 'Tải trên App Store', meta: 'Miễn phí · Không quảng cáo · iPhone và iPad · Việt Nam và Thái Lan', android: 'Dùng Android? Đăng ký nhận tin khi có bản Android' },
  th: { download: 'ดาวน์โหลดบน App Store', meta: 'ฟรี · ไม่มีโฆษณา · iPhone และ iPad · เวียดนามและไทย', android: 'ใช้ Android? ลงชื่อรับแจ้งเมื่อมีเวอร์ชัน Android' },
  en: { download: 'Download on the App Store', meta: 'Free · No ads · iPhone and iPad · Vietnam and Thailand', android: 'On Android? Get notified when it arrives' },
};

function landing(app: App): string {
  const sections = (['vi', 'th', 'en'] as Locale[])
    .map((locale) => {
      const c = storeCopy(app, locale);
      const link = campaignLink({ app, providerToken: links.providerToken, ct: `landing_${app}` });
      const android = links.androidWaitlist ? `<p class="meta"><a href="${escape(links.androidWaitlist)}">${T[locale].android}</a></p>` : '';
      return `<section class="hero ${app}" lang="${locale}">
<h1>${escape(c.name)}</h1>
<p class="sub">${escape(c.subtitle)}</p>
<p>${escape(c.promo)}</p>
<ul>${c.captions.map((x) => `<li>${escape(x)}</li>`).join('')}</ul>
<a class="badge" href="${link}">${T[locale].download}</a>
<p class="meta">${T[locale].meta}</p>
${android}
</section>`;
    })
    .join('\n');
  return page(storeCopy(app, 'en').name, sections);
}

const support = `# Support

Nuni (mood diary) and Fourpop (photo booth) are made by Chagyung, an independent developer.
App pages: [Nuni](nuni.html) · [Fourpop](fourpop.html)

## Contact

Email **nunicozy@gmail.com**. Please include the app name, your iPhone or iPad model and iOS version.

## Purchases

This version has no in-app purchases or subscriptions. Everything in the apps is free.

## Your data

Diary entries and photo strips stay on your device (and in your own iCloud if you turn on backup).
See the [Privacy Policy](privacy.html).
`;

/** Rendered social images: marketing/queue/<week>/assets → public/m/<week>/assets/ (public URLs for Threads/Instagram/Buffer). */
function copyMarketingAssets(): number {
  const queue = join(ROOT, 'marketing/queue');
  if (!existsSync(queue)) return 0;
  let n = 0;
  for (const week of readdirSync(queue).filter(isWeekId)) {
    const assets = join(queue, week, 'assets');
    if (!existsSync(assets)) continue;
    cpSync(assets, join(OUT, 'm', week, 'assets'), { recursive: true });
    n += readdirSync(assets).length;
  }
  return n;
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), page('Support', md.render(support)));
for (const doc of ['privacy', 'terms'] as const) {
  const source = legalMarkdown(doc);
  const title = doc === 'privacy' ? 'Privacy Policy' : 'Terms of Use';
  writeFileSync(join(OUT, `${doc}.html`), page(title, md.render(source)));
}
for (const app of ['nuni', 'fourpop'] as App[]) writeFileSync(join(OUT, `${app}.html`), landing(app));
const copied = copyMarketingAssets();
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`web/legal: wrote ${OUT} (landing pages + ${copied} marketing asset(s))`);
