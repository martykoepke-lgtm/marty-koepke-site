# AVI V3 Supabase Schema

V3 keeps the deployed V2 tables and adds claim-level measurement for AI Business Accuracy.

## Existing Base

- `subjects`
- `audits_v2`
- `audit_engine_responses`
- `audit_extracted`
- `audit_visibility_outcomes`
- `audit_driver_scores`
- `audit_v2_recommendations`

## New V3 Tables

### `audit_source_evidence`

Stores fetched source material used to verify AI claims.

Key fields:

- `audit_id`
- `url`
- `source_type`
- `fetch_status`
- `title`
- `excerpt`
- `mentions_subject`
- `content_hash`

### `audit_claims`

Stores atomic claims extracted from AI responses.

Key fields:

- `audit_id`
- `engine_response_id`
- `claim_text`
- `claim_type`
- `subject_name`
- `source_response_excerpt`
- `confidence`

### `audit_claim_verifications`

Stores support classification for each claim.

Allowed labels:

- `supported_by_owned_source`
- `supported_by_independent_source`
- `supported_by_multiple_sources`
- `ai_misrepresentation`
- `unsupported`
- `contradicted`
- `stale`
- `ambiguous`
- `not_verifiable`

### `audit_prompt_variants`

Stores prompt grouping, variants, engines, and repetitions so monitoring and re-measurement can compare like with like.

### `audit_outcome_scores`

Stores V3 measured outcomes and public scores:

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
- `tier`

### `audit_stability_runs`

Stores stability summaries across prompts, engines, repetitions, and time.

## Existing Table Extensions

`subjects` and `audit_subjects_snapshot` already contain the approved simplified
intake fields. V3 uses plain-language labels in the app while preserving the
existing database columns:

- Company name -> `canonical_name`
- Website -> `url`
- What does it sell or do? -> `industry`
- Business type -> `subject_type`
- Where does it serve customers? -> `location`
- Who is it for? -> `buyer_type`
- What should AI understand about it? -> `problem`
- Other names AI might see -> `aliases`
- Competitors -> `competitors`
- What makes it different? -> `known_differentiation_terms`

No additional subject-intake columns are required for the approved visual form.
`audit_subjects_snapshot` freezes these same fields per audit so historical
reports do not change when a business is edited later.

`audit_engine_responses` gains:

- `query_group_id`
- `prompt_variant_id`
- `rep_index`

These fields let V3 compare results across a stable prompt set without rewriting the existing response table.
