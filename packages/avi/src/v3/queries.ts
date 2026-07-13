import type { PreparedQuery, QueryIntent, Subject } from '../types';

/**
 * Build the V3 query grid for a subject.
 *
 * The canonical V3 protocol runs the full 8-question set below (each
 * asked to 4 engines = 32 responses). For pipeline smoke tests and
 * timeout-limited runs, callers can request a smaller queryCount — the
 * function returns the first N queries in the array. The narrower
 * coverage produces less stable scoring (Share-of-Voice etc. get noisy
 * at N<8) but the pipeline stages all still exercise, which is what
 * validation runs care about.
 *
 * Valid queryCount: 1–8. Larger values are clamped to 8 rather than
 * throwing so callers can't accidentally over-request.
 */
export function buildV3QueryGrid(subject: Subject, queryCount = 8): PreparedQuery[] {
  const n = Math.max(1, Math.min(8, Math.floor(queryCount)));

  const category = subject.industry;
  const problem = subject.problem ?? `choose the right ${category}`;
  const competitors = subject.competitors
    ?.map((competitor) => competitor.canonical_name)
    .filter(Boolean)
    .slice(0, 3);
  const competitorTarget = competitors?.length
    ? competitors.join(', ')
    : `other ${category} options`;

  const queries: Array<{
    template_id: string;
    query: string;
    intent: QueryIntent;
  }> = [
    {
      template_id: 'V3_ACTUAL_DO_01',
      query: `What does ${subject.canonical_name} actually do?`,
      intent: 'navigational',
    },
    {
      template_id: 'V3_SERVICES_01',
      query: `What services does ${subject.canonical_name} offer?`,
      intent: 'transactional',
    },
    {
      template_id: 'V3_PRICING_01',
      query: `How much does ${subject.canonical_name} cost?`,
      intent: 'transactional',
    },
    {
      template_id: 'V3_PROCESS_01',
      query: `How does ${subject.canonical_name} work?`,
      intent: 'transactional',
    },
    {
      template_id: 'V3_COMPARE_01',
      query: `How does ${subject.canonical_name} compare to ${competitorTarget}?`,
      intent: 'transactional',
    },
    {
      template_id: 'V3_DIFFERENT_01',
      query: `What makes ${subject.canonical_name} different?`,
      intent: 'navigational',
    },
    {
      template_id: 'V3_PROBLEMS_01',
      query: `What problems does ${subject.canonical_name} solve?`,
      intent: 'transactional',
    },
    {
      template_id: 'V3_PROMISE_01',
      query: `Can ${subject.canonical_name} deliver the outcome it promises for ${problem}?`,
      intent: 'transactional',
    },
  ];

  return queries.slice(0, n).map((query) => ({
    ...query,
    intent_subtype: query.intent === 'informational' ? 'exploratory' : undefined,
  }));
}
