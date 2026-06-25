import type { Subject } from '../types';
import type {
  V3Claim,
  V3ClaimSupportLabel,
  V3ClaimVerification,
  V3SourceEvidence,
} from './types';

export function classifyClaimSupport(opts: {
  claim: V3Claim;
  evidence: V3SourceEvidence[];
  subject?: Subject;
  now?: string;
}): V3ClaimVerification {
  const prohibitedMatch = matchConfiguredClaim(
    opts.claim.claim_text,
    opts.subject?.prohibited_claims
  );
  if (prohibitedMatch) {
    return {
      claim_id: opts.claim.id,
      label: 'contradicted',
      rationale: `The claim conflicts with something the business says AI should not say: "${prohibitedMatch}".`,
      verifier: 'code',
      verified_at: opts.now ?? new Date().toISOString(),
    };
  }

  const supportingSources = opts.evidence.filter((source) =>
    sourceSupportsClaim(opts.claim.claim_text, source)
  );

  const label: V3ClaimSupportLabel =
    supportingSources.length > 1
      ? 'supported_by_multiple_sources'
      : supportingSources.length === 1
        ? supportingSources[0].source_type === 'owned_site'
          ? 'supported_by_owned_source'
          : 'supported_by_independent_source'
        : opts.evidence.length > 0
          ? isBusinessRepresentationClaim(opts.claim)
            ? 'ai_misrepresentation'
            : 'unsupported'
          : 'not_verifiable';

  const source = supportingSources[0];
  return {
    claim_id: opts.claim.id,
    label,
    source_url: source?.url,
    source_type: source?.source_type,
    evidence_quote: source?.excerpt,
    rationale: rationaleFor(label),
    verifier: 'code',
    verified_at: opts.now ?? new Date().toISOString(),
  };
}

export function sourceSupportsClaim(claimText: string, source: V3SourceEvidence): boolean {
  if (!source.excerpt) return false;
  if (source.mentions_subject === false) return false;

  const claimTerms = significantTerms(claimText);
  if (claimTerms.length === 0) return false;

  const sourceText = source.excerpt.toLowerCase();
  const matched = claimTerms.filter((term) => sourceText.includes(term)).length;
  return matched / claimTerms.length >= 0.45;
}

function significantTerms(text: string): string[] {
  const stop = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'into',
    'business',
    'company',
    'service',
    'services',
  ]);
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((term) => term.length >= 4 && !stop.has(term))
    )
  ).slice(0, 12);
}

function matchConfiguredClaim(claimText: string, configured?: string[]): string | null {
  if (!configured?.length) return null;
  const claimTerms = significantTerms(claimText);
  if (claimTerms.length === 0) return null;

  for (const candidate of configured) {
    const candidateTerms = significantTerms(candidate);
    if (candidateTerms.length === 0) continue;
    const overlap = candidateTerms.filter((term) => claimTerms.includes(term)).length;
    if (overlap / candidateTerms.length >= 0.6) return candidate;
  }
  return null;
}

function rationaleFor(label: V3ClaimSupportLabel): string {
  switch (label) {
    case 'supported_by_owned_source':
      return 'The claim is supported by an owned source excerpt.';
    case 'supported_by_independent_source':
      return 'The claim is supported by an independent source excerpt.';
    case 'supported_by_multiple_sources':
      return 'The claim is supported by multiple source excerpts.';
    case 'ai_misrepresentation':
      return 'AI invented or assigned a business-specific claim that available sources did not support.';
    case 'unsupported':
      return 'Available evidence did not support the specific claim.';
    case 'contradicted':
      return 'Available evidence contradicts the specific claim.';
    case 'stale':
      return 'Available evidence appears stale for the specific claim.';
    case 'ambiguous':
      return 'Available evidence is ambiguous for the specific claim.';
    case 'not_verifiable':
      return 'No suitable evidence was available to verify the specific claim.';
  }
}

function isBusinessRepresentationClaim(claim: V3Claim): boolean {
  return [
    'identity',
    'category',
    'service',
    'location',
    'audience',
    'credential',
    'pricing',
    'comparison',
    'recommendation',
  ].includes(claim.claim_type);
}
