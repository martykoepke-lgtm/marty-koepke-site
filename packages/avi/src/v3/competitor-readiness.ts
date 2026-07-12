/**
 * V3.1 competitor readiness pass.
 *
 * Lightweight per-competitor readiness extraction. For each named competitor
 * that supplied a URL, crawl the public site and run the 5-driver readiness
 * extraction. No live AI queries, no corroboration search — just the crawl +
 * extraction needed to plot the competitor on the Readiness × Visibility
 * quadrant.
 */

import { crawl } from '../crawler-v2';
import type {
  AuditError,
  CrawlerEvidence,
  EvidencePackage,
  Subject,
} from '../types';
import { scoreReadinessV3 } from './readiness';
import type { V3CompetitorReadinessRow, V3ReadinessScore } from './types';

export type { V3CompetitorReadinessRow };

export interface V3CompetitorReadinessInput {
  subjectIndustry: string;
  competitors: Array<{ canonical_name: string; aliases: string[]; url?: string }>;
}

export async function runCompetitorReadinessPass(
  input: V3CompetitorReadinessInput
): Promise<V3CompetitorReadinessRow[]> {
  const out: V3CompetitorReadinessRow[] = [];
  for (const competitor of input.competitors) {
    if (!competitor.url) {
      out.push({
        canonical_name: competitor.canonical_name,
        url: '',
        readiness_score: null,
        driver_scores: [],
        crawled_at: null,
        errors: [
          {
            step: 'competitor_readiness',
            message: 'no URL supplied — skipped',
            fatal: false,
          },
        ],
      });
      continue;
    }

    const errors: AuditError[] = [];
    let crawler: CrawlerEvidence | null = null;
    try {
      crawler = await crawl(
        competitor.url,
        input.subjectIndustry,
        competitor.canonical_name
      );
    } catch (e) {
      errors.push({
        step: 'competitor_readiness',
        message: `crawl failed: ${errMessage(e)}`,
        fatal: false,
      });
    }

    if (!crawler) {
      out.push({
        canonical_name: competitor.canonical_name,
        url: competitor.url,
        readiness_score: null,
        driver_scores: [],
        crawled_at: null,
        errors,
      });
      continue;
    }

    const competitorSubject: Subject = {
      canonical_name: competitor.canonical_name,
      aliases: competitor.aliases ?? [],
      industry: input.subjectIndustry,
      subject_type: 'company',
      url: competitor.url,
    };
    const evidencePackage: EvidencePackage = {
      crawler,
      corroboration: {
        general_search: [],
        platform_filtered: [],
      },
    };

    let driver_scores: V3ReadinessScore[] = [];
    try {
      driver_scores = await scoreReadinessV3(competitorSubject, evidencePackage);
    } catch (e) {
      errors.push({
        step: 'competitor_readiness',
        message: `readiness scoring failed: ${errMessage(e)}`,
        fatal: false,
      });
    }

    out.push({
      canonical_name: competitor.canonical_name,
      url: competitor.url,
      readiness_score: aggregateReadiness(driver_scores),
      driver_scores,
      crawled_at: new Date().toISOString(),
      errors,
    });
  }
  return out;
}

const DRIVER_WEIGHTS: Record<string, number> = {
  business_clarity: 0.25,
  source_support: 0.25,
  ai_readability: 0.2,
  distinctive_point_of_view: 0.15,
  recommendation_fit: 0.15,
};

function aggregateReadiness(scores: V3ReadinessScore[]): number | null {
  const scored = scores.filter(
    (s): s is V3ReadinessScore & { score: number } => typeof s.score === 'number'
  );
  if (scored.length === 0) return null;
  const totalWeight = scored.reduce(
    (sum, s) => sum + (DRIVER_WEIGHTS[s.driver_id] ?? 0),
    0
  );
  if (totalWeight === 0) return null;
  const weighted = scored.reduce(
    (sum, s) => sum + (s.score / 5) * (DRIVER_WEIGHTS[s.driver_id] ?? 0),
    0
  );
  return Math.round((weighted / totalWeight) * 1000) / 10;
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
