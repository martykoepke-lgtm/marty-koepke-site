# Migration to a monorepo

**Owner:** Marty Koepke, Practical Informatics LLC
**Status:** Draft v0.1 — plan only, no files moved yet.
**Companion ADR:** D008 in `DECISIONS.md`.
**Audience:** Marty, and any future agent (Claude Code, contractor) running the move.
**Purpose:** Plain-English walkthrough of how this single Next.js repo becomes a pnpm + Turborepo monorepo with a marketing site, an internal operator console, and a shared AVI library. Every step, every tool, every config spelled out.

When this doc and `AVI_OPERATING_STANDARD.md` disagree about anything inside the AVI pipeline, the operating standard wins. This doc is about *where the files live*, not *what they do*.

---

## 1. What this changes

Today everything lives at the root of one Next.js app:

- The marketing site (homepage, about, time-back-assessment, contact, blog, policies)
- The customer-facing `/scan` flow (v1 AVI free check)
- The AVI v2 pipeline (`lib/avi/*-v2.ts`, agents, queries, subjects, scripts)
- The Supabase schema designs
- CLI runners that produce HTML/JSON reports to `audits/`

After this migration the repo has three top-level packages:

```
practical-informatics/
├── apps/
│   ├── site/        Marketing + customer-facing /scan. Public. Calm brand.
│   └── console/     Marty's internal operator app. Auth-gated. Different domain.
└── packages/
    └── avi/         AVI pipeline, agents, queries, subjects, schema, scripts.
```

The marketing site and the console **both depend on `packages/avi`** at the source level — there is no published package, no version bump, no separate release. `pnpm install` wires the symlinks.

## 2. Why

Three reasons, in order of weight:

1. **The AVI codebase is now bigger than the marketing site.** ~20 lib files, 50+ subject JSONs, ~10 scripts, a 10-table schema design, 5 agent role files. Treating it as "some code inside a marketing site" is wrong by surface area alone.
2. **The console doesn't belong in the marketing repo's bundle, auth perimeter, or visual language.** Calm cream-and-forest doesn't fit a dense operator dashboard. Public anonymous traffic doesn't share the same threat model as an admin app. Bundling them risks pulling admin code into the public bundle.
3. **Deploys are independent.** A bug in the audit pipeline can't take down `www.practicalinformatics.com`. A site copy edit doesn't redeploy the console. Two Vercel projects, one repo, one source of truth.

This is a refactor, not a feature change. Behavior of the live marketing site and the live `/scan` route stays identical end-to-end. If anything observable changes for a visitor, the migration is wrong.

## 3. Destination structure — full tree

This tree is mapped file-for-file against the actual current state of the repo as of 2026-06-17. Every existing source file has a destination. Decisions baked in are marked `← decision`; speak up to override before phase 2 starts.

```
practical-informatics/                                  (repo root)
│
├── apps/
│   │
│   ├── site/                                           ← marketing + customer /scan
│   │   ├── app/
│   │   │   ├── about/page.tsx
│   │   │   ├── ai-visibility/                          ← AVI marketing pages (page.tsx, order/, results/)
│   │   │   ├── api/
│   │   │   │   ├── cron/                               ← Vercel cron jobs (ops monitor)
│   │   │   │   ├── scan/                               ← /scan free flow
│   │   │   │   └── submissions/                        ← legacy submissions handler
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── time-back-assessment/page.tsx
│   │   │   ├── scan/page.tsx
│   │   │   ├── privacy/, terms/, cookies/, acceptable-use/, returns/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                                (home)
│   │   │   ├── not-found.tsx
│   │   │   ├── robots.ts, sitemap.ts
│   │   │   ├── icon.png, apple-icon.png
│   │   │   └── (NO app/admin/ — moves to apps/console)
│   │   ├── components/
│   │   │   ├── ai-visibility/
│   │   │   │   ├── FreeScanFlow.tsx
│   │   │   │   └── ScanForm.tsx
│   │   │   ├── embeds/GetTermsEmbed.tsx
│   │   │   ├── layout/{Footer,Navbar,PolicyPage}.tsx
│   │   │   ├── modals/WorkModal.tsx
│   │   │   ├── motion/{Reveal,RouteTransition}.tsx
│   │   │   ├── sections/{BuiltThings,Faq,FinalCta,HeroBanner,ThePath}.tsx
│   │   │   └── ui/{Button,Icons,Section}.tsx
│   │   ├── content/
│   │   │   └── blog/                                   ← markdown posts (empty at launch)
│   │   ├── lib/
│   │   │   ├── blog.ts                                 ← markdown renderer
│   │   │   ├── content.ts                              ← all site copy
│   │   │   └── links.ts                                ← outbound CTAs
│   │   ├── public/
│   │   │   ├── AI-Visibility-Index-Rubric-and-Protocol.md
│   │   │   ├── AI-Visibility-Learning-and-Citation-Reference.md
│   │   │   ├── Practical-Informatics-Positioning-and-Comparison.md
│   │   │   ├── Practical-Informatics-Pricing-Structure.md
│   │   │   ├── favicon.ico
│   │   │   ├── googleefff2183f67c65a4.html             ← Search Console verification
│   │   │   ├── llms.txt
│   │   │   └── images/
│   │   │       ├── activiteez/, governiq/              ← case study screenshots
│   │   │       ├── headshot.jpg, hero-bg.jpg
│   │   │       └── logo-{horizontal,lockup,mark}.png
│   │   ├── brand-assets/                               ← was /images at repo root ← decision
│   │   │   ├── IMG_7668 (1).PNG
│   │   │   ├── New PI Long (1500 x 400 px).png
│   │   │   ├── No verbiage.png
│   │   │   └── Tree Squared Transparent.png
│   │   ├── next.config.ts
│   │   ├── tsconfig.json                               ← extends ../../tsconfig.base.json
│   │   └── package.json
│   │
│   └── console/                                        ← Marty's operator app (auth-gated)
│       ├── app/
│       │   ├── audits/[id]/page.tsx                    ← was app/admin/audits/[id]/page.tsx ← decision: /admin/ prefix dropped
│       │   ├── subjects/page.tsx                       ← phase-5 stub (lists subject JSONs)
│       │   ├── login/page.tsx                          ← phase-5 placeholder auth
│       │   ├── layout.tsx
│       │   ├── page.tsx                                (dashboard home)
│       │   └── globals.css
│       ├── components/                                 (empty at phase 5)
│       ├── lib/                                        (empty at phase 5)
│       ├── public/                                     (favicon only)
│       ├── middleware.ts                               ← placeholder auth wall (cookie + env-var password)
│       ├── next.config.ts
│       ├── tsconfig.json                               ← extends ../../tsconfig.base.json
│       └── package.json
│
├── packages/
│   │
│   └── avi/                                            ← the AVI pipeline, importable as @practical-informatics/avi
│       ├── src/
│       │   ├── index.ts                                ← public surface (runAudit, types, loadSubject, renderReport, freeScan, …)
│       │   ├── orchestrator-v2.ts
│       │   ├── crawler-v2.ts
│       │   ├── corroboration-v2.ts
│       │   ├── queries.ts
│       │   ├── engine-clients.ts
│       │   ├── extractor-v2.ts
│       │   ├── aggregator-v2.ts
│       │   ├── judge-v2.ts
│       │   ├── composite-v2.ts
│       │   ├── recommender-v2.ts
│       │   ├── render-v2.ts
│       │   ├── subject-loader.ts
│       │   ├── types.ts
│       │   ├── free-scan.ts
│       │   ├── json-clean.ts
│       │   ├── kit.ts                                  ← ConvertKit client
│       │   ├── rate-limit.ts                           ← Upstash wrapper
│       │   ├── turnstile.ts                            ← Cloudflare Turnstile wrapper
│       │   ├── email.ts
│       │   ├── tavily.ts
│       │   ├── logging.ts                              ← api_calls logger
│       │   ├── llm.ts                                  ← provider abstraction
│       │   ├── supabase-client.ts                      ← was /lib/supabase.ts (shared by site + console) ← decision
│       │   ├── llm-providers/
│       │   │   ├── anthropic.ts
│       │   │   ├── openai.ts
│       │   │   ├── gemini.ts
│       │   │   ├── perplexity.ts
│       │   │   └── types.ts
│       │   ├── email-templates/
│       │   │   └── free-scan-report.ts
│       │   ├── v1/                                     ← legacy v1 still serving /scan; isolated ← decision
│       │   │   ├── crawler.ts
│       │   │   ├── corroboration.ts
│       │   │   ├── query.ts
│       │   │   ├── extraction.ts
│       │   │   ├── aggregation.ts
│       │   │   ├── scoring.ts
│       │   │   └── recommendations.ts
│       │   └── SCAFFOLD-V2.md                          ← devdoc lives next to the code it describes
│       ├── agents/                                     ← role files (EXTRACTOR, DRIVER_JUDGE, RECOMMENDER, CROSS_JUDGE, README)
│       ├── queries/                                    ← prompt templates (UNIVERSAL.md, AI-VISIBILITY-SAAS.md, README.md)
│       ├── subjects/                                   ← 50+ subject JSONs + competitors/ subfolder
│       ├── supabase/
│       │   ├── SCHEMA_V2.md                            ← design doc
│       │   └── migrations/
│       │       ├── 0001_avi_schema.sql
│       │       ├── 0002_add_last_name_and_company.sql
│       │       ├── 0003_make_url_optional.sql
│       │       ├── 0004_api_calls.sql
│       │       ├── 0005_extend_for_v2_rubric.sql
│       │       ├── 0006_audit_query_responses.sql
│       │       ├── 0007_audit_dimension_scores.sql
│       │       ├── 0008_security_advisor_fixes.sql
│       │       ├── 0009_audit_recommendations.sql
│       │       ├── 0010_free_scan_fields.sql
│       │       └── 0011_avi_v2_schema.sql              ← APPLIED to Supabase (confirmed 2026-06-17)
│       ├── scripts/
│       │   ├── audit.mts                               ← single-subject CLI
│       │   ├── compare.mts                             ← cohort comparison
│       │   ├── run-audit.ts                            ← legacy runner
│       │   ├── audit-cleanup.ts
│       │   ├── audit-errors.ts
│       │   ├── audit-pdf.ts
│       │   ├── audit-recommend.ts
│       │   ├── audit-report.ts
│       │   ├── scan-pdf.ts
│       │   ├── smoke-crawler.mts
│       │   ├── smoke-test-spend-alert.mjs
│       │   ├── cross-category-analysis.mjs
│       │   └── probe-ai-bots.mjs
│       ├── tsconfig.json                               ← extends ../../tsconfig.base.json
│       └── package.json
│
├── business-docs/                                      ← was at repo root; lifted to its own folder ← decision
│   ├── AI-Visibility-Self-Assessment.pdf
│   ├── Consulting-Services-Agreement.docx
│   └── Terms_of_Service_Productized_v1.1.docx
│
├── archive/                                            ← stays at repo root (historical canon)
│   ├── AGENTS.md
│   ├── AVI_AGENT_DESIGN.md                             ← v1.0, superseded by AVI_OPERATING_STANDARD.md
│   ├── AVI_BUILD_PLAN.md
│   ├── AVI_CUSTOMER_FLOW.md
│   ├── AVI_FREE_FLOW.md                                ← old; current is /AVI_FLOW_FREE.md at root
│   ├── AVI_INDEX_REPORT.md
│   └── README.md
│
├── audits/                                             ← CLI output, GITIGNORED, stays at root
├── reports/                                            ← paid-run output, GITIGNORED, stays at root
│
├── .claude/                                            ← Claude Code config, stays at root
│   ├── launch.json
│   └── settings.local.json
│
├── .next/                                              ← GITIGNORED (Next build cache, will live under apps/site/.next)
├── node_modules/                                       ← GITIGNORED
│
├── CLAUDE.md                                           ← updated to reflect new paths
├── VISION.md                                           ← strategic north star
├── DECISIONS.md                                        ← ADRs (D008 logs this migration)
├── MIGRATION_TO_MONOREPO.md                            ← this file
│
├── AVI_OPERATING_STANDARD.md                           ← canon for packages/avi
├── AVI_FLOW_FREE.md                                    ← plain-English free-scan walkthrough
├── AVI_FLOW_PAID.md                                    ← plain-English paid-pipeline walkthrough
├── AVI_OPS_MONITOR.md                                  ← plain-English ops-monitor walkthrough
├── AVI_LITERATURE_CROSSMAP.md                          ← research evidence base
├── AVI_TOOLS.md                                        ← external services reference
├── case-study-ai-visibility-consultants.md             ← draft case study
│
├── README.md                                           ← minimal, points to apps and packages
│
├── package.json                                        ← root: pnpm workspaces + Turborepo + dev deps
├── pnpm-workspace.yaml                                 ← lists apps/* and packages/*
├── turbo.json                                          ← pipeline config (dev, build, lint, typecheck)
├── tsconfig.base.json                                  ← shared TS config inherited by all workspaces
│
├── .env.local                                          ← root, GITIGNORED, shared keys
├── .env.example                                        ← root, enumerates expected keys
└── .gitignore                                          ← audits/, reports/, *.tsbuildinfo, .next/, node_modules/, .env.local, .turbo/
```

**Documentation stays at the repo root.** `VISION.md`, `DECISIONS.md`, `CLAUDE.md`, the AVI flow docs (FLOW_FREE, FLOW_PAID, OPS_MONITOR), the operating standard, the literature crossmap, and the tools reference govern the whole project. Moving them into `packages/avi/` would imply they only apply to the AVI code, which is wrong — they govern the company.

### 3.1 Decisions baked into this tree

Six decisions made by default. Override any by saying so before phase 2.

1. **`images/` at repo root → `apps/site/brand-assets/`.** Those 4 PNGs (long logo, transparent tree mark, photo, no-verbiage logo) are brand source files. The site consumes them; the console does not. They sit outside `public/` because they are upstream sources, not served assets.
2. **`reports/` and `audits/` stay at repo root, both gitignored.** Both are generated AVI output. Keeping them at root preserves existing CLI script paths (`./audits/<id>.json` resolves the same way after the move). Gitignoring stops 74+ JSONs from bloating the diff.
3. **Business docs → `business-docs/` at repo root, in git.** Keeps PDF and DOCX files versioned alongside the code but no longer mixed with `*.md` canon at the top level. Alternative considered: moving them out of git entirely (Drive, Dropbox); rejected for now since you may want history.
4. **Console URL drops `/admin/` prefix.** `app/admin/audits/[id]/page.tsx` becomes `apps/console/app/audits/[id]/page.tsx`. The console *is* the admin app; the prefix is redundant on a console-only domain.
5. **v1 AVI code goes into `packages/avi/src/v1/`.** The seven files without `-v2` suffix (`crawler.ts`, `corroboration.ts`, `query.ts`, `extraction.ts`, `aggregation.ts`, `scoring.ts`, `recommendations.ts`) still serve the live `/scan` route but are frozen. Isolating them in a `v1/` subfolder makes the freeze visible and gives a clean deletion target when `/scan` migrates to v2.
6. **`lib/supabase.ts` → `packages/avi/src/supabase-client.ts`.** The Supabase client is shared infrastructure: site uses it for the v1 `/scan` flow, console will use it for everything, and `packages/avi`'s `logging.ts` already depends on it. Centralizing it inside `packages/avi` keeps the dependency direction clean (apps depend on the package, not the reverse).

## 4. What is NOT in scope for this migration

These are deliberately deferred to keep the change reversible:

- **No console features.** Phase 5 lands an `apps/console` shell with two stub pages (Subjects list, Audits viewer lifted from the existing `app/admin/`). Real features (Audit runner, Cohort comparison, Spend monitor, Verification panel) are separate work after the migration is verified.
- **No AVI behavior changes.** Same orchestrator, same prompts, same outputs. If `audits/*.json` from a smoke-test run differs from a pre-migration run on the same subject, the migration is wrong.
- **No marketing copy changes.** `lib/content.ts` moves; its contents don't.
- **No new auth.** The console scaffold uses a placeholder auth wall (a single env-var-protected cookie) until phase-5 follow-up work picks Supabase Auth vs. Clerk.
- **No schema work.** `0011_avi_v2_schema.sql` is already applied to the Supabase project (confirmed 2026-06-17). The migration moves the file with the rest of `supabase/`; it does not re-run, re-author, or re-design the schema.

## 5. Tooling choices

### 5.1 pnpm workspaces

pnpm is chosen over npm or yarn because:
- Native workspace support without extra config.
- Smaller node_modules footprint (content-addressed store) matters when there are three apps/packages.
- Vercel supports pnpm monorepos as a first-class case.

### 5.2 Turborepo

Turborepo is chosen over Nx because:
- Lighter setup. Single `turbo.json` config, no generators.
- Built by Vercel; Vercel build hooks know about it.
- The pipeline this repo needs (`dev`, `build`, `lint`, `typecheck`) is exactly what Turborepo is good at.

If Turborepo proves to add more friction than value, falling back to plain pnpm workspaces is one config-file deletion away.

### 5.3 TypeScript project references

`packages/avi` exports its public surface from `src/index.ts`. `apps/site` and `apps/console` import via the workspace name (`@practical-informatics/avi`). No build step required at dev time — TypeScript resolves through workspace symlinks. A `tsc --build` only runs for type-check in CI.

### 5.4 The package name

`@practical-informatics/avi`. Scoped name keeps it private (never accidentally publishable to npm). The scope matches the org name.

## 6. Phase-by-phase steps

Each phase is one PR. Each phase ends with a verification step that must pass before the next phase starts.

### Phase 1 — Canon (this doc + ADR D008)

**What happens.** This file (`MIGRATION_TO_MONOREPO.md`) and a new ADR D008 in `DECISIONS.md` are written. Nothing else changes. Marty reads both and approves before phase 2 starts.

**Verification.** Marty's read.

### Phase 2 — Workspace skeleton

**What happens.**

1. At the repo root, create `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```
2. Create `apps/`, `packages/`, and empty subdirectories `apps/site`, `apps/console`, `packages/avi`.
3. Create root `package.json` with workspace devDependencies (`turbo`, `typescript`, `prettier`) and root scripts:
   ```json
   {
     "name": "practical-informatics",
     "private": true,
     "scripts": {
       "dev": "turbo run dev",
       "build": "turbo run build",
       "lint": "turbo run lint",
       "typecheck": "turbo run typecheck",
       "site:dev": "pnpm --filter site dev",
       "console:dev": "pnpm --filter console dev",
       "audit": "pnpm --filter @practical-informatics/avi audit"
     }
   }
   ```
4. Create `turbo.json` with the pipeline definition.
5. Create `tsconfig.base.json` with shared `compilerOptions` (target, module, paths to `@practical-informatics/avi`).
6. Update root `.gitignore` to ignore `audits/`, `node_modules/`, `.next/`, `.turbo/`, `.env.local`.

**No file moves yet.** Existing site code still works because nothing has moved.

**Verification.** `pnpm install` runs clean. `pnpm dev` does nothing (no apps wired yet) but exits 0.

### Phase 3 — Move marketing site to `apps/site/`

**What happens.**

1. Move these directories from root into `apps/site/`:
   - `app/` → `apps/site/app/`
   - `components/` → `apps/site/components/` (everything except files that already use v2 AVI lib — those move with the AVI package in phase 4)
   - `content/` → `apps/site/content/`
   - `lib/content.ts`, `lib/links.ts`, `lib/blog.ts` → `apps/site/lib/`
   - `public/` → `apps/site/public/`
   - `next.config.ts` → `apps/site/next.config.ts`
2. Create `apps/site/package.json` with `next`, `react`, `framer-motion`, `tailwindcss` deps and a `dev`/`build`/`start`/`lint` script.
3. Create `apps/site/tsconfig.json` extending `tsconfig.base.json`.
4. Leave `lib/avi/` and `app/api/scan/` at the root for now. Phase 3 does NOT touch the AVI code or its consumers.
5. The `/scan` route still imports from `lib/avi/*` via the **temporary path alias** `@/lib/avi/*` defined in `apps/site/tsconfig.json` pointing back to the repo root. This is the "keep `/scan` green during the move" trick. Phase 4 removes this alias.

**Verification.**

- `pnpm site:dev` starts the marketing site on `http://localhost:3000`.
- Manual smoke test: home, about, time-back-assessment, contact, blog (empty state), `/scan` form submits and returns a result.
- `pnpm --filter site build` produces a successful production build.
- Lighthouse score on home is within ±5 of pre-migration baseline (catch accidental asset path breaks).

### Phase 4 — Extract `packages/avi/`

**What happens.**

1. Create `packages/avi/package.json`:
   ```json
   {
     "name": "@practical-informatics/avi",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "scripts": {
       "audit": "tsx scripts/audit.mts",
       "compare": "tsx scripts/compare.mts",
       "typecheck": "tsc --noEmit"
     },
     "dependencies": {
       "@anthropic-ai/sdk": "…",
       "openai": "…",
       "@google/generative-ai": "…",
       "@supabase/supabase-js": "…",
       "tsx": "…",
       "zod": "…"
     }
   }
   ```
2. Move from repo root into `packages/avi/`:
   - All of `lib/avi/` → `packages/avi/src/` (flat — drop the `lib/` layer)
   - `agents/` → `packages/avi/agents/`
   - `queries/` → `packages/avi/queries/`
   - `subjects/` → `packages/avi/subjects/`
   - `supabase/` → `packages/avi/supabase/`
   - All `scripts/audit*.ts`, `scripts/run-audit*.ts`, `scripts/compare*.mts`, `scripts/smoke-*.mts`, `scripts/probe-*.mjs` → `packages/avi/scripts/`
3. Write `packages/avi/src/index.ts` — the public surface. Exports:
   - `runAudit`, `RunAuditOptions` from `orchestrator-v2.ts`
   - `loadSubject` from `subject-loader.ts`
   - `renderReport` from `render-v2.ts`
   - All types from `types.ts`
   - `freeScan` from `free-scan.ts` (the v1 `/scan` flow's entry point)
   - Anything else `app/api/scan/route.ts` currently imports
4. Update `apps/site/app/api/scan/route.ts` (and any other site code that imports AVI) to import from `@practical-informatics/avi` instead of the temporary alias.
5. Remove the temporary `@/lib/avi/*` alias from `apps/site/tsconfig.json`.
6. Delete the now-empty `lib/avi/` and `agents/` and `queries/` and `subjects/` and `supabase/` and `scripts/audit*` from the repo root.

**Verification.**

- `pnpm install` resolves the workspace symlink. `apps/site/node_modules/@practical-informatics/avi` exists and points to `packages/avi/`.
- `pnpm site:dev` still works. `/scan` form still produces a free scan result identical to phase-3 output for the same input.
- `pnpm audit subjects/practicalinformatics.json --mode=free` (run from `packages/avi/`) produces an audit JSON whose composite score matches a pre-migration baseline within 1 decimal place. Any difference means a path is broken somewhere.
- `pnpm typecheck` runs clean across the workspace.

### Phase 5 — Scaffold `apps/console/`

**What happens.**

1. Create a fresh Next.js 15 (App Router) app in `apps/console/` using `pnpm create next-app` with TypeScript, Tailwind, no eslint preset (use root's).
2. Add `@practical-informatics/avi` to `apps/console/package.json` dependencies.
3. Add a single placeholder auth wall: `apps/console/middleware.ts` checks `request.cookies.get('console_token')?.value === process.env.CONSOLE_PASSWORD` and redirects to `/login` otherwise. `/login` is a plain form that sets the cookie if the password matches. This is **explicitly a placeholder** — it gets replaced with real auth in a follow-up.
4. Add one stub page: `apps/console/app/subjects/page.tsx` that lists the subject JSONs by importing `loadAllSubjects` from `@practical-informatics/avi`. Hardcoded table, no styling beyond Tailwind defaults. This proves the workspace import works end-to-end.
5. Add `apps/console/tsconfig.json`, `apps/console/next.config.ts`, etc.

**Verification.**

- `pnpm console:dev` starts on `http://localhost:3001`.
- The Subjects page lists every JSON in `packages/avi/subjects/`.
- The auth wall blocks an unauthenticated request.

### Phase 6 — Deploy split

**What happens.**

1. In Vercel, create a second project (`practical-informatics-console`) pointed at the same GitHub repo, with the **root directory** set to `apps/console`. The existing project is reconfigured to set its root directory to `apps/site`.
2. Custom domain `console.practicalinformatics.com` added to the console project (Marty does the DNS in Cloudflare; the Vercel UI shows the records needed).
3. Environment variables: the site project keeps its existing keys. The console project gets the same AVI keys plus `CONSOLE_PASSWORD`.
4. Push to `main`. Both projects build. Both projects deploy. Both URLs serve.

**Verification.**

- `https://www.practicalinformatics.com` serves the marketing site unchanged.
- `https://console.practicalinformatics.com` serves the console; without the cookie it redirects to `/login`.
- A push that only touches `apps/site/` redeploys the site project but not the console project (Turborepo's `--filter` and Vercel's "Ignored Build Step" together enforce this).

## 7. Keeping `/scan` green during the move

The `/scan` route is live on production. Phase 3 keeps it working via the temporary path alias. Phase 4 replaces the alias with the workspace import. Between phase 3 and phase 4 — at most a single PR — `/scan` is wired through a path alias rather than a workspace import. That is acceptable transient state.

To verify nothing breaks during the transition:

1. **Pre-migration baseline.** Before phase 3, run `/scan` against three known URLs (the Practical Informatics homepage, one foothills winery, one healthcare site) and save the JSON results.
2. **After phase 3.** Re-run the same three. Diff JSON. Any difference outside known nondeterminism (timestamps, audit IDs) means a path is wrong.
3. **After phase 4.** Same diff. Same standard.

## 8. Rollback plan

The migration is reversible at every phase boundary. Each phase is one PR. To roll back, revert the PR.

- Rollback from phase 2: delete `pnpm-workspace.yaml`, `turbo.json`, the empty `apps/` and `packages/` dirs, the root `package.json` changes. Site keeps running because no source moved.
- Rollback from phase 3: revert the move PR. The directories slide back to root.
- Rollback from phase 4: revert the move PR. The path alias is restored. `lib/avi/` is back at root.
- Rollback from phase 5: delete `apps/console/`. Nothing else depends on it.
- Rollback from phase 6: in Vercel, delete the console project. The site project keeps running.

No phase commits both the structural move and a behavior change. That is the invariant — a refactor changes structure, not behavior, per the refactor skill cardinal rule.

## 9. Open questions

These do not block phase 1. They get answered before the phase that depends on them.

1. **Console auth — Supabase Auth or Clerk?** Decided before the phase-5 follow-up work that replaces the placeholder. The placeholder in phase 5 is just a cookie + env-var password.
2. **`subjects/` source of truth — files or DB?** Today they are JSON files in source control under `packages/avi/subjects/`. Now that the v2 schema is applied, the `subjects` table is the eventual source of truth and the JSONs become a one-way export for seeding. The migration ships files first; DB-backed Subjects management is a console feature, not part of the move.
3. **Where does the Claude Code memory directory live?** It is outside the repo (`~/.claude/projects/…`) and the migration does not touch it. The path references inside `MEMORY.md` entries may need updating after phase 4 if any entry hardcodes paths under `lib/avi/` — flag during the phase 4 PR.
4. **`reports/` vs `audits/` — keep both or consolidate?** Both hold the same shape of AVI output. The migration keeps both at the repo root and gitignores them. A separate cleanup pass can collapse them after the move; sequencing collapse with the move would conflate "refactor" with "behavior change."

---

*See `DECISIONS.md` ADR D008 for why this migration is happening at all. See `AVI_OPERATING_STANDARD.md` for what the moved AVI code is allowed to do.*
