import type { Subject, Synthesis } from '../types';
import { AVI_V3_RUBRIC_VERSION } from './rubric';
import type { V3PublicScores } from './types';

export function synthesizeV3(subject: Subject, scores: V3PublicScores): Synthesis {
  return {
    headline: `${subject.canonical_name}: AI Business Accuracy ${scores.ai_business_accuracy_index}/100`,
    body:
      `This V3 audit measures whether AI can find, understand, support, and recommend ${subject.canonical_name} in sensible situations. ` +
      `AI Readiness is ${scores.ai_readiness_score}/100, AI Visibility is ${scores.ai_visibility_score}/100, and AI Business Accuracy is ${scores.ai_business_accuracy_score}/100. ` +
      `The overall AI Business Accuracy Index is ${scores.ai_business_accuracy_index}/100 (${scores.tier}).`,
    rubric_version: AVI_V3_RUBRIC_VERSION,
    generated_at: new Date().toISOString(),
    synthesizer_model: 'deterministic-v3',
  };
}
