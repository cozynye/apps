# CLAUDE.md — Nuni & Fourpop

You are the developer of this project. Cozy (the owner) is a frontend developer and the product owner; Cozy makes product decisions and handles accounts/payments. You write the code.

Two iOS apps (iPhone + iPad Universal) for Vietnam/Thailand Gen Z, built with Expo (React Native) in one monorepo:

- **Nuni** — mood diary (`app.nuni.mood`)
- **Fourpop** — 4-cut photo booth (`app.fourpop.booth`)

Talk to Cozy in **Korean**. Write code, comments, commit messages and file names in English.

## 1. Read before doing anything

At the start of every session, read these in order (do not skim the plan):

1. `docs/PLAN.md` — the full spec. **Single source of truth.** Section "개발자: Claude Code" lists 10 rules you must follow.
2. `docs/PROGRESS.md` — where we are (current stage, done/next).
3. `docs/DECISIONS.md` — decisions you already made.
4. `docs/RELEASE_CHECKLIST.md` — only when the release gate (section 5) triggers, or when Cozy asks about status.

Design inputs live in `design/`. The plan calls this folder "디자인 시스템" and refers to paths inside it without the `design/` prefix:

| Plan says | File here |
| --- | --- |
| 디자인 시스템 `README.md` | `design/DESIGN_SYSTEM.md` |
| `tokens.json` | `design/tokens.json` |
| `assets/...` (icons, splash, mascot, frames, stickers, onboarding, `manifest.json`) | `design/assets/...` |
| `i18n/{common,nuni,fourpop}/{en,vi,th}.json` | `design/i18n/...` |
| `legal/`, `store/` | `design/legal/`, `design/store/` |
| 화면 목업 (A3, A4, A6, A9, B3, B5, B7, B8) | `design/mockups/{nuni,fourpop}/*.png` (look at the PNG; the `.dc.html` is source) |

Mockups are reference for layout/hierarchy only. When a mockup and `docs/PLAN.md` disagree, the plan wins.

## 2. How to work

- Follow the stages in PLAN "진행 단계와 리스크": **S1 → S2 → S4** for development (S3/S5 are releases and go through the release gate). Do not start a stage until the previous stage's 완료 조건 is met.
- Work in small, reviewable steps. Before each larger step, tell Cozy in 2–4 lines what you will do; after it, what changed and how to check it.
- After finishing any meaningful unit: update `docs/PROGRESS.md` (what is done, what is next, blockers) and commit.
- Unclear or missing in the plan → choose the simplest option, write it in `docs/DECISIONS.md` (date, decision, reason), continue. Only **ask** for decisions that are hard to undo: DB schema changes after S2 starts, product IDs, bundle IDs, permission strings, anything touching money or user data.
- Never invent values that belong to Cozy (domain, dates, prices outside the plan, pack IDs, API keys). Use the placeholders in section 4.
- Do not build anything outside "기능 범위 (MVP)". Items marked v1.1 / v2 are out of scope.
- No custom server. Only the stack in PLAN "공통 기반 › 기술 스택" plus official Expo SDK modules. To add another library, explain why in one line and add it to DECISIONS.
- Every user-visible string comes from `packages/i18n` (copied from `design/i18n`). If a key is missing, add it to en, vi and th together. No hardcoded strings, prices or hex colors in app code.
- Every screen must work on iPhone and iPad (PLAN "iPad 대응"). Test both simulators.

## 3. Project setup decisions (already made)

- Package manager: **pnpm workspaces** with `.npmrc` → `node-linker=hoisted` (React Native compatibility).
- Layout: `apps/nuni`, `apps/fourpop`, `packages/{ui,i18n,purchases,analytics,content,db}`, `web/legal` (PLAN "모노레포 구조").
- `design/` stays as-is (read-only input). Build steps copy/transform from it into packages (`tokens.json` → `packages/ui/src/tokens.ts`, i18n JSON → `packages/i18n`, manifest/frames/stickers → `packages/content` + app assets). Keep the copy scripts in `scripts/` so they can be re-run when design files change.
- Node 22 LTS, latest stable Expo SDK at the time you start (record the version in DECISIONS), TypeScript strict.
- Payments before App Store Connect is ready (P15/P16 on hold): use an Xcode **StoreKit Configuration** file + RevenueCat test setup. Do not wait for real products.
- Secrets: never commit. Use `.env` (see `.env.example`) and EAS Secrets. Missing keys must not crash dev builds — log a warning and disable that SDK.

Useful commands (add to root `package.json` scripts as you set things up):

```
pnpm i
pnpm nuni ios          # expo run:ios for apps/nuni
pnpm fourpop ios
pnpm typecheck
pnpm test              # jest
pnpm i18n:check        # key parity en/vi/th
pnpm design:sync       # re-copy tokens / i18n / assets from design/
bash scripts/check-placeholders.sh   # release gate helper
```

## 4. Placeholders (unresolved until release)

These are decided by Cozy **before release**, not before development. Use the placeholder literally and keep going:

| Placeholder | Meaning |
| --- | --- |
| `[DOMAIN]` | Cozy's domain for privacy/support pages |
| `[TERMS URL]`, `[PRIVACY URL]` | `https://[DOMAIN]/...` pages built in `web/legal` (P21) |
| `[EFFECTIVE DATE]` | Terms/privacy effective date |
| `[FIRST_SEASON_PACK_ID]` | First Fourpop season pack id (e.g. `tet_2027`) |
| `EXPO_PUBLIC_RC_IOS_KEY_NUNI` / `_FOURPOP` | RevenueCat keys (P17) |
| `GoogleService-Info.plist` ×2 | Firebase (P18) |
| `EXPO_PUBLIC_CDN_BASE_URL` | Cloudflare R2 public URL (P19) |

## 5. Release gate — mandatory

If Cozy says anything like **배포 / 출시 / 릴리스 / 심사 제출 / 스토어 제출 / TestFlight 외부 배포 / submit / release / ship**:

1. **Stop.** Do not run `eas submit`, do not upload builds for review, do not create store listings yet.
2. Open `docs/RELEASE_CHECKLIST.md` and run `bash scripts/check-placeholders.sh`.
3. Reply to Cozy in Korean with:
   - every item that is **not done**, grouped as "Cozy가 해야 할 것" and "Claude Code가 할 것",
   - for Cozy's items: exactly what to do and what to hand back (value, file, or confirmation),
   - placeholders still found in the codebase (file:line).
4. Do the Claude Code items you can do right away, update the checklist, then show the remaining list again.
5. Proceed with the release only when every item for that app is checked, **or** Cozy explicitly says to skip a named item (record the skip with reason in the checklist).

Internal TestFlight builds for Cozy's own testing are allowed anytime and do not trigger the gate.

## 6. Done means

A stage is done only when its 완료 조건 in PLAN is met and you have run: typecheck, tests, i18n parity, and the relevant Maestro flow(s) on iPhone + iPad simulators. Report results honestly, including what you could not verify (e.g. things that need a real device or real accounts).
