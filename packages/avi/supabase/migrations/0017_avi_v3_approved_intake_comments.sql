-- AVI V3 approved intake alignment.
-- No new columns are required for the simplified client-facing form.
-- The approved labels map onto the existing V2 subject fields below.

comment on column public.subjects.canonical_name is
  'Client-facing label: Company name. The business name customers and AI systems should recognize.';
comment on column public.subjects.url is
  'Client-facing label: Website. The primary website or best page about the business.';
comment on column public.subjects.industry is
  'Client-facing label: What does it sell or do? Plain-language category or service description.';
comment on column public.subjects.subject_type is
  'Client-facing label: Business type. Company/organization or person/personal brand.';
comment on column public.subjects.location is
  'Client-facing label: Where does it serve customers? Geography, service area, or online.';
comment on column public.subjects.buyer_type is
  'Client-facing label: Who is it for? The customer, audience, or buyer type.';
comment on column public.subjects.problem is
  'Client-facing label: What should AI understand about it? Plain-language business context.';
comment on column public.subjects.aliases is
  'Client-facing label: Other names AI might see. Alternate names, abbreviations, or common variants.';
comment on column public.subjects.competitors is
  'Client-facing label: Competitors. Comparable businesses used for visibility and recommendation context.';
comment on column public.subjects.known_differentiation_terms is
  'Client-facing label: What makes it different? Specialties, methods, point of view, or signature phrases.';

comment on column public.audit_subjects_snapshot.canonical_name is
  'Frozen copy of Company name used for this audit.';
comment on column public.audit_subjects_snapshot.url is
  'Frozen copy of Website used for this audit.';
comment on column public.audit_subjects_snapshot.industry is
  'Frozen copy of What does it sell or do? used for this audit.';
comment on column public.audit_subjects_snapshot.subject_type is
  'Frozen copy of Business type used for this audit.';
comment on column public.audit_subjects_snapshot.location is
  'Frozen copy of Where does it serve customers? used for this audit.';
comment on column public.audit_subjects_snapshot.buyer_type is
  'Frozen copy of Who is it for? used for this audit.';
comment on column public.audit_subjects_snapshot.problem is
  'Frozen copy of What should AI understand about it? used for this audit.';
comment on column public.audit_subjects_snapshot.aliases is
  'Frozen copy of Other names AI might see used for this audit.';
comment on column public.audit_subjects_snapshot.competitors is
  'Frozen copy of Competitors used for this audit.';
comment on column public.audit_subjects_snapshot.known_differentiation_terms is
  'Frozen copy of What makes it different? used for this audit.';
