import { AVI_V3_RUBRIC_VERSION } from './rubric';
import type {
  V3AccuracyFix,
  V3AccuracyRecommenderOutput,
  V3Claim,
  V3ClaimSupportLabel,
  V3ClaimType,
  V3ClaimVerification,
} from './types';

const FAILURE_LABELS: ReadonlySet<V3ClaimSupportLabel> = new Set([
  'unsupported',
  'contradicted',
  'ai_misrepresentation',
  'stale',
]);

export interface V3AccuracyRecommendInput {
  claims: V3Claim[];
  claimVerifications: V3ClaimVerification[];
}

export function accuracyRecommendV3(
  input: V3AccuracyRecommendInput
): V3AccuracyRecommenderOutput {
  const claimsById = new Map(input.claims.map((claim) => [claim.id, claim]));

  type Failure = { verification: V3ClaimVerification; claim: V3Claim };
  const failures: Failure[] = [];
  for (const verification of input.claimVerifications) {
    if (!FAILURE_LABELS.has(verification.label)) continue;
    const claim = claimsById.get(verification.claim_id);
    if (!claim) continue;
    failures.push({ verification, claim });
  }

  const buckets = new Map<V3ClaimType, Failure[]>();
  for (const failure of failures) {
    const bucket = buckets.get(failure.claim.claim_type) ?? [];
    bucket.push(failure);
    buckets.set(failure.claim.claim_type, bucket);
  }

  const ranked = [...buckets.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  const fixes: V3AccuracyFix[] = ranked.map(([claim_type, group], index) => {
    const dominant = dominantLabel(group);
    return {
      rank: (index + 1) as 1 | 2 | 3,
      claim_type,
      dominant_failure: dominant,
      affected_claim_count: group.length,
      gap: gapFor(claim_type, dominant, group.length),
      tactic: tacticFor(claim_type, dominant),
      framed_as: framedAsFor(claim_type),
    };
  });

  return {
    fixes,
    rubric_version: AVI_V3_RUBRIC_VERSION,
  };
}

function dominantLabel(
  group: Array<{ verification: V3ClaimVerification }>
): V3ClaimSupportLabel {
  const counts = new Map<V3ClaimSupportLabel, number>();
  for (const failure of group) {
    counts.set(
      failure.verification.label,
      (counts.get(failure.verification.label) ?? 0) + 1
    );
  }
  let bestLabel: V3ClaimSupportLabel = 'unsupported';
  let bestCount = -1;
  for (const [label, count] of counts) {
    if (count > bestCount) {
      bestLabel = label;
      bestCount = count;
    }
  }
  return bestLabel;
}

function gapFor(
  claim_type: V3ClaimType,
  label: V3ClaimSupportLabel,
  count: number
): string {
  const noun = claimTypeNoun(claim_type);
  const subject = count === 1 ? 'claim was' : 'claims were';
  switch (label) {
    case 'contradicted':
      return `${count} ${noun} ${subject} contradicted by your own sources.`;
    case 'ai_misrepresentation':
      return `${count} ${noun} ${subject} something AI invented — your site doesn't say it.`;
    case 'unsupported':
      return `${count} ${noun} ${count === 1 ? 'claim had' : 'claims had'} no source backing them up.`;
    case 'stale':
      return `${count} ${noun} ${count === 1 ? 'claim cited' : 'claims cited'} outdated information.`;
    default:
      return `${count} ${noun} ${subject} unverifiable.`;
  }
}

function tacticFor(claim_type: V3ClaimType, label: V3ClaimSupportLabel): string {
  switch (claim_type) {
    case 'location':
      return 'Correct the location across your site and Google Business Profile. Remove or update any third-party listing that still carries the wrong one.';
    case 'service':
      return label === 'ai_misrepresentation'
        ? 'Name the services you actually offer in clear language on a dedicated services page. Disambiguate from any partner or affiliated business AI may be conflating with yours.'
        : 'Add a concise services page that names each service, who it\'s for, and one piece of supporting evidence per service.';
    case 'identity':
      return 'Lock the business name, legal entity, and aliases consistently across your homepage, About page, and primary third-party profiles.';
    case 'category':
      return 'State your category in plain English on the homepage above the fold — the exact phrase a buyer would use.';
    case 'credential':
      return 'Surface current credentials, certifications, and affiliations with a date or year. Remove or update anything that no longer holds.';
    case 'audience':
      return 'Write one clear "who we\'re for" sentence on the homepage. Name the audience and the situation the business is built for.';
    case 'pricing':
      return 'Add pricing context — a starting price, a range, or "we publish pricing on consultation" — so AI has something to cite.';
    case 'comparison':
      return 'Add a short "how we compare" or "alternatives" section so AI has your own framing to draw on, not just competitor pages.';
    case 'recommendation':
      return 'Add explicit best-fit and not-fit language so AI knows when to recommend you and when to recommend someone else.';
    case 'other':
      return 'Strengthen the source evidence behind the specific claims AI is making about the business.';
  }
}

function framedAsFor(claim_type: V3ClaimType): string {
  switch (claim_type) {
    case 'location':
      return 'Stop AI from getting where you operate wrong.';
    case 'service':
      return 'Stop AI from inventing or confusing your services.';
    case 'identity':
      return 'Make sure AI is talking about the right business.';
    case 'category':
      return 'Help AI describe you in the language your buyer is using.';
    case 'credential':
      return 'Keep AI citing current credentials, not stale ones.';
    case 'audience':
      return 'Tell AI who the business is for.';
    case 'pricing':
      return 'Give AI a price signal it can cite honestly.';
    case 'comparison':
      return 'Take ownership of how AI compares you.';
    case 'recommendation':
      return 'Help AI recommend you in right-fit situations only.';
    case 'other':
      return 'Tighten the evidence behind what AI is saying.';
  }
}

function claimTypeNoun(claim_type: V3ClaimType): string {
  return claim_type === 'other' ? 'unverified' : claim_type;
}
