# V3 Migration Map

## Purpose

This map defines how the current AI Visibility codebase should move to V3.

V3 should be built as clean new files first. V1 and V2 files should be retired into `archive/legacy-v1-v2/` only after V3 is working, tested, and wired into the site and tool flows.

V3 source of truth:

- `AI_BUSINESS_ACCURACY_V3_RUBRIC.md`

## V3 North Star

Market doorway:

- AI Visibility
- GEO
- AEO

Framework:

- AI Business Accuracy

Promise:

- We help AI get your business right.

Safer offer language:

- We test whether AI systems can find, understand, cite, and recommend your business in right-fit situations.

## Current State Notes

The repository currently mixes V1, V2, and emerging V3 language.

Known issues:

- Public copy still references older AI Visibility framing.
- Free scan logic still uses legacy V1-style seven-dimension scoring.
- Paid V2 logic uses five readiness drivers plus a visibility outcome.
- V3 requires measured outcomes beyond visibility: representation accuracy, claim support, context preservation, recommendation quality, and stability.
- Supabase V2 schema is deployed, but claim-level V3 tables do not exist yet.
- The git worktree is dirty. Do not archive, delete, or rewrite legacy files until a safety branch or backup commit exists.

## File Buckets

### Bucket 1: Keep As Foundation

These files appear useful for V3 and should generally stay, though some imports or labels may change.

| File | V3 Decision | Notes |
| --- | --- | --- |
| `packages/avi/src/crawler-v2.ts` | Keep / adapt into V3 | Crawling remains necessary for readiness and source evidence. |
| `packages/avi/src/corroboration-v2.ts` | Keep / adapt into V3 | Corroboration maps into Source Support. |
| `packages/avi/src/engine-clients.ts` | Keep | Live AI engine calls remain needed for paid audits. |
| `packages/avi/src/llm.ts` | Keep | Shared LLM utility. |
| `packages/avi/src/llm-providers/*` | Keep | Provider clients remain useful. |
| `packages/avi/src/json-clean.ts` | Keep | Structured extraction still needs robust JSON cleanup. |
| `packages/avi/src/logging.ts` | Keep | Operational utility. |
| `packages/avi/src/rate-limit.ts` | Keep | Operational utility. |
| `packages/avi/src/supabase-client.ts` | Keep | Database connection utility. |
| `packages/avi/src/tavily.ts` | Keep | External research/source discovery utility if still used. |
| `packages/avi/src/turnstile.ts` | Keep | Site/free scan protection utility. |
| `packages/avi/src/email.ts` | Keep | Notification/report delivery utility. |
| `apps/site/components/ui/*` | Keep | General UI components. |
| `apps/site/components/layout/*` | Keep / update copy only | Layout remains useful. |
| `apps/site/components/motion/*` | Keep | Presentation utility. |
| `apps/site/app/api/cron/*` | Keep | Operational monitoring routes. |
| `apps/site/app/api/submissions/route.ts` | Keep | General form/submission route. |
| `apps/console/lib/supabase/*` | Keep | Console auth/data plumbing. |
| `apps/console/components/*` | Keep / adapt labels | Console UI likely remains useful. |

### Bucket 2: Rewrite As Clean V3

These should become new V3 files rather than patching old concepts repeatedly.

| New V3 File | Purpose | Source/Predecessor |
| --- | --- | --- |
| `packages/avi/src/v3/types.ts` | Canonical V3 types: drivers, outcomes, claims, source evidence, scores. | `packages/avi/src/types.ts` |
| `packages/avi/src/v3/rubric.ts` | V3 weights, labels, score definitions, public score math. | `AI_BUSINESS_ACCURACY_V3_RUBRIC.md`, `composite-v2.ts` |
| `packages/avi/src/v3/crawler.ts` | V3 wrapper/adaptation around crawl evidence. | `crawler-v2.ts` |
| `packages/avi/src/v3/corroboration.ts` | V3 Source Support evidence model. | `corroboration-v2.ts` |
| `packages/avi/src/v3/extractor.ts` | Extract mentions, citations, competitors, and atomic business claims. | `extractor-v2.ts` |
| `packages/avi/src/v3/claim-verifier.ts` | Classify each AI claim as supported, unsupported, contradicted, stale, ambiguous, or not verifiable. | New |
| `packages/avi/src/v3/source-evidence.ts` | Fetch/cache source excerpts and classify source type/support. | New |
| `packages/avi/src/v3/outcomes.ts` | Score visibility, representation accuracy, claim support, context preservation, recommendation quality, stability. | `aggregator-v2.ts` |
| `packages/avi/src/v3/readiness.ts` | Score five readiness drivers. | `judge-v2.ts`, V1 scoring |
| `packages/avi/src/v3/composite.ts` | AI Visibility Score, AI Readiness Score, AI Business Accuracy Score, AI Business Accuracy Index. | `composite-v2.ts` |
| `packages/avi/src/v3/recommender.ts` | V3 remediation roadmap. | `recommender-v2.ts` |
| `packages/avi/src/v3/synthesizer.ts` | V3 narrative report output. | `synthesize-v2.ts` |
| `packages/avi/src/v3/render.ts` | V3 report rendering. | `render-v2.ts` |
| `packages/avi/src/v3/orchestrator.ts` | Paid V3 audit pipeline. | `orchestrator-v2.ts` |
| `packages/avi/src/v3/free-scan.ts` | Readiness-only free scan with no unsupported live visibility claims. | `free-scan.ts` |
| `packages/avi/src/v3/persist.ts` | Persist V3 audits, claims, evidence, and outcomes. | `persist-audit.ts` |
| `packages/avi/supabase/migrations/0015_avi_v3_schema.sql` | V3 database additions. | New |
| `packages/avi/supabase/SCHEMA_V3.md` | Human-readable V3 schema documentation. | `SCHEMA_V2.md` |

### Bucket 3: Site Copy Rewrite

These should be updated after V3 product boundaries are represented in code and schema.

| File | V3 Decision | Notes |
| --- | --- | --- |
| `apps/site/lib/content.ts` | Rewrite V3 copy | Main public content source. Remove seven-dimension language. |
| `apps/site/app/ai-visibility/page.tsx` | Update to V3 positioning | Front door remains AI Visibility; framework becomes AI Business Accuracy. |
| `apps/site/components/ai-visibility/FreeScanFlow.tsx` | Update claims and UI labels | Free scan must be readiness-only unless live AI prompts are run. |
| `apps/site/components/ai-visibility/ScanForm.tsx` | Update field language | Intake should support Business Clarity, Source Support, POV, and Recommendation Fit. |
| `apps/site/app/ai-visibility/results/[id]/page.tsx` | Update report language | Results should separate readiness from measured outcomes. |
| `apps/site/app/ai-visibility/order/page.tsx` | Update paid offer | Paid offer should be the Daizie AI Visibility Assessment. |
| `apps/site/app/scan/page.tsx` | Review / consolidate | Avoid competing scan language if this overlaps free scan. |
| `apps/site/app/scan/report/[id]/page.tsx` | Review / consolidate | Ensure result framing matches V3. |
| `apps/site/public/AI-Visibility-Index-Rubric-and-Protocol.md` | Replace or archive | Public legacy rubric should not conflict with V3. |
| `apps/site/public/AI-Visibility-Learning-and-Citation-Reference.md` | Keep / update | Reference library can remain if V3-aligned. |
| `apps/site/public/llms.txt` | Update | Should describe V3 offer and canonical terminology. |

### Bucket 4: Console/Admin Adaptation

The console can be adapted after the V3 data model exists.

| File/Area | V3 Decision | Notes |
| --- | --- | --- |
| `apps/console/app/(authed)/audits/*` | Adapt to V3 | Display V3 scores, outcomes, claim support, source evidence. |
| `apps/console/app/(authed)/subjects/*` | Keep / adapt intake | Subject form should collect V3 business context. |
| `apps/console/components/RunAuditForm.tsx` | Adapt | Audit mode should distinguish free readiness vs paid V3 audit. |
| `apps/console/lib/data/*` | Adapt | Queries need V3 tables and views. |
| `apps/site/app/admin/audits/[id]/page.tsx` | Adapt or consolidate | Avoid separate admin display logic drifting from console. |

### Bucket 5: Archive After V3 Works

These should move to `archive/legacy-v1-v2/` only after V3 is wired and tested.

| File/Area | Archive Timing | Notes |
| --- | --- | --- |
| `packages/avi/src/v1/*` | Archive after V3 free scan works | V1 seven-dimension logic should no longer be active. |
| `packages/avi/subjects/v1/*` | Archive after test fixtures are replaced | Keep a small V3 fixture set elsewhere if needed. |
| `packages/avi/src/aggregator-v2.ts` | Archive after `v3/outcomes.ts` works | V2 visibility-only aggregation is insufficient for V3. |
| `packages/avi/src/composite-v2.ts` | Archive after `v3/composite.ts` works | V3 has three public scores plus composite index. |
| `packages/avi/src/extractor-v2.ts` | Archive after `v3/extractor.ts` and claim extraction work | V2 extraction does not fully support claim-level verification. |
| `packages/avi/src/judge-v2.ts` | Archive after `v3/readiness.ts` works | Driver labels/logic need V3 alignment. |
| `packages/avi/src/recommender-v2.ts` | Archive after `v3/recommender.ts` works | Recommendations need accuracy/hallucination-risk framing. |
| `packages/avi/src/render-v2.ts` | Archive after `v3/render.ts` works | Report output needs V3 structure. |
| `packages/avi/src/orchestrator-v2.ts` | Archive after `v3/orchestrator.ts` works | Pipeline entrypoint should become V3. |
| `packages/avi/src/synthesize-v2.ts` | Archive after `v3/synthesizer.ts` works | Narrative output needs V3 positioning. |
| `packages/avi/SCAFFOLD-V2.md` | Archive | Legacy implementation scaffold. |
| `packages/avi/supabase/SCHEMA_V2.md` | Archive after `SCHEMA_V3.md` exists | Keep for history only. |
| `AVI_FLOW_FREE.md` | Archive or rewrite | Free flow likely V1/V2. |
| `AVI_FLOW_PAID.md` | Archive or rewrite | Paid flow likely V1/V2. |
| `RUBRIC_OVERVIEW.md` | Archive or replace | Avoid conflicting rubric docs. |
| `AVI_OPERATING_STANDARD.md` | Rewrite as V3 or archive old copy | This may become the formal V3 operating standard. |
| `apps/site/public/AI-Visibility-Index-Rubric-and-Protocol.md` | Archive or replace | Public legacy artifact should not contradict V3. |

### Bucket 6: Do Not Touch Yet

These should remain untouched until core V3 is implemented.

| File/Area | Reason |
| --- | --- |
| `.env.local` | Contains secrets; do not expose or commit. |
| `package-lock.json` | Update only when dependency changes require it. |
| `apps/site/brand-assets/*` | Visual assets are unrelated to rubric migration. |
| `apps/site/public/images/*` | Unrelated site assets. |
| Legal pages in `apps/site/app/privacy`, `terms`, `returns`, `cookies`, `acceptable-use` | Update only if offer/legal claims change materially. |
| Existing Supabase migrations `0001` through `0014` | Do not rewrite historical migrations; add `0015_avi_v3_schema.sql`. |

## V3 Supabase Migration Requirements

Create:

- `packages/avi/supabase/migrations/0015_avi_v3_schema.sql`
- `packages/avi/supabase/SCHEMA_V3.md`

Recommended new tables:

- `audit_claims`
- `audit_claim_verifications`
- `audit_source_evidence`
- `audit_outcome_scores`
- `audit_prompt_variants`
- `audit_stability_runs`

Recommended extensions to existing tables:

- Add prompt grouping and repetition metadata to engine responses, or normalize it through `audit_prompt_variants`.
- Preserve existing V2 tables during migration to avoid breaking old audits.
- Add V3 views only after table shape is stable.

Outcome fields:

- `visibility`
- `representation_accuracy`
- `claim_support`
- `context_preservation`
- `recommendation_quality`
- `stability`
- `ai_visibility_score`
- `ai_readiness_score`
- `ai_business_accuracy_score`
- `ai_business_accuracy_index`

Claim verification labels:

- `supported_by_owned_source`
- `supported_by_independent_source`
- `supported_by_multiple_sources`
- `unsupported`
- `contradicted`
- `stale`
- `ambiguous`
- `not_verifiable`

## V3 Implementation Order

### Phase 0: Safety

1. Confirm current branch and dirty worktree.
2. Create a safety branch before moving or archiving files.
3. Do not delete or archive user-created work until V3 is functional.

### Phase 1: Canonical Docs

1. Keep `AI_BUSINESS_ACCURACY_V3_RUBRIC.md` as source of truth.
2. Create or rewrite a V3 operating standard.
3. Create V3 intake requirements.
4. Create V3 report outline.

### Phase 2: V3 Types And Scoring

1. Add `packages/avi/src/v3/types.ts`.
2. Add `packages/avi/src/v3/rubric.ts`.
3. Add `packages/avi/src/v3/composite.ts`.
4. Add focused tests if the repo test setup supports them.

### Phase 3: Claim And Evidence Layer

1. Add claim extraction.
2. Add source evidence handling.
3. Add claim verification.
4. Add support labels and confidence logic.

### Phase 4: V3 Outcomes

1. Add measured outcome scoring.
2. Add readiness scoring.
3. Add recommendation roadmap generation.
4. Add synthesis/report rendering.

### Phase 5: Supabase

1. Add V3 schema migration.
2. Add V3 schema documentation.
3. Update persistence.
4. Verify read/write behavior against staging or approved Supabase target.

### Phase 6: App Wiring

1. Update package exports.
2. Update free scan route to use V3 readiness-only logic.
3. Update paid audit route/orchestrator to use V3.
4. Update console/admin pages to display V3 scores.

### Phase 7: Site Content

1. Update hero and AI Visibility page copy.
2. Update free scan copy.
3. Update paid offer copy.
4. Update public rubric/reference docs.
5. Update `llms.txt`.

### Phase 8: Verification

1. Typecheck.
2. Build site.
3. Run free scan locally.
4. Run paid audit in a safe/staging mode.
5. Verify Supabase persistence.
6. Review the report language for overclaims.

### Phase 9: Archive Legacy

After V3 works:

1. Create `archive/legacy-v1-v2/`.
2. Move V1 files.
3. Move V2 files no longer imported.
4. Move legacy docs.
5. Verify no imports point to archived files.
6. Run typecheck/build again.

### Phase 10: GitHub Cleanup

1. Commit V3 docs.
2. Commit V3 code.
3. Commit V3 Supabase migration.
4. Commit site copy.
5. Commit legacy archive.
6. Merge to one clean `main` after verification.

## Definition Of Done

V3 is ready when:

- The site says AI Visibility is the doorway and AI Business Accuracy is the framework.
- No public page claims seven dimensions.
- Free scan only claims readiness unless live prompts are actually run.
- Paid audit measures live outcomes beyond visibility.
- Claims from AI responses are stored and verified.
- Source evidence is stored separately from AI response text.
- Reports separate visibility, readiness, and business accuracy.
- Supabase has V3 schema support.
- Legacy V1/V2 files are archived.
- Typecheck and build pass.
- The `main` branch has one coherent V3 product.

