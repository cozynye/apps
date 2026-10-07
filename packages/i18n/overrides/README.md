# i18n overrides

`design/i18n` is read-only input. Keys added or corrected during development live here and are
deep-merged over the design files by `pnpm design:sync` (output: `src/locales`).
Always change en, vi and th together; `pnpm i18n:check` enforces parity.
When the design files absorb a change, delete it here.
