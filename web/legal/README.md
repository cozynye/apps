# web/legal (P21)

Static support, privacy and terms pages for App Store Connect (privacy policy URL, support URL).
`pnpm legal:build` regenerates `public/` from `design/legal/*.md`.

Not deployed yet: needs the GitHub repo (P22) and Cozy's domain (`[DOMAIN]`). Publish `public/`
with GitHub Pages and point the domain at it; then `[PRIVACY URL]` = `https://[DOMAIN]/privacy.html`,
`[TERMS URL]` = `https://[DOMAIN]/terms.html`, support URL = `https://[DOMAIN]/`.
