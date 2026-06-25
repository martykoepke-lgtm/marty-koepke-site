/**
 * V3 extractor layer.
 *
 * Reuses the V2 extractor for mention/citation/competitor fields, then adds
 * a bounded atomic-claim extraction pass. The claim extractor observes only
 * the engine response text. It does not verify, judge, or recommend.
 */

import { randomUUID } from 'node:crypto';

import { extract as extractV2, verifyCitations } from '../extractor-v2';
import { cleanJson } from '../json-clean';
import { llmCall } from '../llm';
import type { EngineResponse, ExtractorOutput, Subject } from '../types';
import type { V3Claim } from './types';

const CLAIM_EXTRACTOR_PROMPT = `You are the V3 Claim Extractor for AI Business Accuracy.

Your only job is to extract atomic claims made about the subject from one AI
engine response. You do not judge whether the claims are true. You do not
verify sources. You do not summarize.

Use ONLY the response text and supplied subject metadata.

Return strict JSON only:
{
  "claims": [
    {
      "claim_text": string,
      "claim_type": "identity" | "category" | "service" | "location" | "audience" | "credential" | "pricing" | "comparison" | "recommendation" | "other",
      "source_response_excerpt": string,
      "confidence": number
    }
  ]
}

Rules:
1. Extract only claims about the audited subject.
2. Each claim must be atomic: one fact or recommendation reason per item.
3. Do not extract generic statements about the category.
4. Do not extract competitor claims unless they directly compare to the subject.
5. Do not invent claims or infer missing details.
6. Do not extract speculative advice, brainstorming, or hypothetical "could/should/may" statements.
7. Do not extract claims about what the user should build, price, consider, or include.
8. If the subject is not mentioned, return {"claims":[]}.`;

export interface V3ExtractionResult {
  extraction: ExtractorOutput;
  verified_extraction: ExtractorOutput;
  claims: V3Claim[];
}

export async function extractV3(
  response: EngineResponse,
  subject: Subject
): Promise<V3ExtractionResult> {
  const extraction = await extractV2(response, subject);
  const verified_extraction = await verifyCitations(extraction, subject);
  const claims = await extractClaims(response, subject, extraction.mentioned);
  return { extraction, verified_extraction, claims };
}

async function extractClaims(
  response: EngineResponse,
  subject: Subject,
  mentioned: boolean
): Promise<V3Claim[]> {
  if (!mentioned || response.error || !response.raw_response.trim()) return [];

  const prompt = `${CLAIM_EXTRACTOR_PROMPT}

SUBJECT:
- canonical_name: ${JSON.stringify(subject.canonical_name)}
- aliases: ${JSON.stringify(subject.aliases ?? [])}
- industry: ${JSON.stringify(subject.industry)}

QUERY:
${JSON.stringify(response.query)}

RAW RESPONSE:
"""
${response.raw_response.slice(0, 6000)}
"""`;

  const llmResponse = await llmCall(
    'openai',
    prompt,
    { endpoint: 'v3_claim_extract', submissionId: null, ip: null },
    { maxTokens: 1200 }
  );

  if (!llmResponse.ok || !llmResponse.text) return [];

  try {
    const parsed = JSON.parse(cleanJson(llmResponse.text));
    if (!Array.isArray(parsed.claims)) return [];
    return parsed.claims
      .filter((claim: any) => typeof claim?.claim_text === 'string')
      .slice(0, 12)
      .map((claim: any) => ({
        id: randomUUID(),
        claim_text: claim.claim_text,
        claim_type: isClaimType(claim.claim_type) ? claim.claim_type : 'other',
        subject_name: subject.canonical_name,
        source_response_excerpt:
          typeof claim.source_response_excerpt === 'string'
            ? claim.source_response_excerpt.slice(0, 1000)
            : undefined,
        confidence:
          typeof claim.confidence === 'number'
            ? Math.max(0, Math.min(1, claim.confidence))
            : undefined,
      }));
  } catch {
    return [];
  }
}

function isClaimType(value: unknown): value is V3Claim['claim_type'] {
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
    'other',
  ].includes(String(value));
}
