-- AVI V3 compatibility patch for projects that already ran 0015 before the
-- V3 constraint relaxations were added.

alter table public.audits_v2
  drop constraint if exists audits_v2_mode_check;

alter table public.audits_v2
  add constraint audits_v2_mode_check
  check (mode in ('free', 'paid', 'snapshot', 'audit', 'monitoring'));

alter table public.audit_driver_scores
  drop constraint if exists audit_driver_scores_dimension_id_check;

alter table public.audit_driver_scores
  alter column weight drop not null;

alter table public.audit_driver_scores
  add constraint audit_driver_scores_dimension_id_check
  check (
    dimension_id in (
      'D1',
      'D2',
      'D3',
      'D4',
      'D6',
      'business_clarity',
      'source_support',
      'ai_readability',
      'distinctive_point_of_view',
      'recommendation_fit'
    )
  );
