-- Distinguish ordinary unsupported claims from AI hallucinations about the
-- business itself. Example: an AI answer invents a service line the business
-- does not claim to offer.

alter table public.audit_claim_verifications
  drop constraint if exists audit_claim_verifications_label_check;

alter table public.audit_claim_verifications
  add constraint audit_claim_verifications_label_check
  check (
    label in (
      'supported_by_owned_source',
      'supported_by_independent_source',
      'supported_by_multiple_sources',
      'ai_misrepresentation',
      'unsupported',
      'contradicted',
      'stale',
      'ambiguous',
      'not_verifiable'
    )
  );

comment on column public.audit_claim_verifications.label is
  'Verification label. ai_misrepresentation means an AI answer invented or assigned a business-specific claim that available evidence did not support.';
