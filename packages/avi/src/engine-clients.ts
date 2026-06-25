/**
 * Engine clients — thin wrappers around llm.ts for querying the audited engines
 * (ChatGPT, Claude, Perplexity, Gemini) as SUBJECTS of measurement, not as workers.
 *
 * Each call sends a buyer-style query to the engine and captures the raw response.
 * The Extractor parses what comes back.
 */

import { llmCall } from './llm';
import type { Engine, EngineResponse, PreparedQuery } from './types';

const PROVIDER_BY_ENGINE: Record<Engine, 'openai' | 'anthropic' | 'perplexity' | 'gemini'> = {
  chatgpt: 'openai',
  claude: 'anthropic',
  perplexity: 'perplexity',
  gemini: 'gemini',
};

export async function queryEngine(query: PreparedQuery, engine: Engine): Promise<EngineResponse> {
  const provider = PROVIDER_BY_ENGINE[engine];
  const captured_at = new Date().toISOString();

  const llmResponse = await llmCall(
    provider,
    query.query,
    { endpoint: 'paid_pipeline_query', submissionId: null, ip: null },
    { maxTokens: 1500 }
  );

  if (!llmResponse.ok) {
    return {
      template_id: query.template_id,
      query: query.query,
      engine,
      raw_response: '',
      captured_at,
      error: llmResponse.error ?? 'unknown error',
    };
  }

  return {
    template_id: query.template_id,
    query: query.query,
    engine,
    raw_response: llmResponse.text ?? '',
    captured_at,
  };
}

export async function runQueryGrid(
  queries: PreparedQuery[],
  engines: Engine[]
): Promise<EngineResponse[]> {
  const out: EngineResponse[] = [];
  for (const q of queries) {
    const responses = await Promise.all(engines.map((e) => queryEngine(q, e)));
    out.push(...responses);
  }
  return out;
}
