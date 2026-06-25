import {
  AVI_V3_RUBRIC_VERSION,
  type V3OutcomeId,
  type V3ReadinessDriverId,
  type V3Tier,
} from './types';

export { AVI_V3_RUBRIC_VERSION };

export interface V3DriverDefinition {
  id: V3ReadinessDriverId;
  name: string;
  plain_question: string;
  description: string;
  weight: number;
  signals: string[];
}

export interface V3OutcomeDefinition {
  id: V3OutcomeId;
  name: string;
  plain_question: string;
  description: string;
}

export const V3_READINESS_DRIVER_DEFINITIONS: Record<
  V3ReadinessDriverId,
  V3DriverDefinition
> = {
  business_clarity: {
    id: 'business_clarity',
    name: 'Business Clarity',
    plain_question: 'Can AI tell what this business is and who it helps?',
    description:
      'Measures whether the business clearly explains who it is, what it does, who it serves, where it operates, and what it should be known for.',
    weight: 0.25,
    signals: [
      'official business name',
      'name consistency and aliases',
      'category clarity',
      'services and offers',
      'location or service area',
      'audience fit',
      'about/company explanation',
      'clear best-fit language',
    ],
  },
  source_support: {
    id: 'source_support',
    name: 'Source Support',
    plain_question: 'Is there enough evidence for AI to believe and repeat the right facts?',
    description:
      'Measures whether important claims about the business are supported by credible owned and third-party sources.',
    weight: 0.25,
    signals: [
      'website evidence',
      'Google Business Profile and directory consistency',
      'reviews',
      'articles, profiles, podcasts, awards, and citations',
      'case studies and testimonials',
      'consistency across sources',
      'independent corroboration',
    ],
  },
  ai_readability: {
    id: 'ai_readability',
    name: 'AI Readability',
    plain_question: 'Is the business easy for AI systems to read?',
    description:
      'Measures whether business information is easy for crawlers, search systems, and AI tools to parse.',
    weight: 0.2,
    signals: [
      'crawlability',
      'page structure',
      'clear headings',
      'internal links',
      'service pages',
      'FAQs',
      'schema and structured data',
      'robots and AI crawler access',
      'stable source URLs',
    ],
  },
  distinctive_point_of_view: {
    id: 'distinctive_point_of_view',
    name: 'Distinctive Point of View',
    plain_question: 'Does AI have a real reason to choose this business?',
    description:
      'Measures whether the business has a clear, supportable reason to be recommended instead of alternatives.',
    weight: 0.15,
    signals: [
      'unique method or framework',
      'clear specialization',
      'point of view',
      'differentiated claims',
      'evidence for the difference',
      'clear tradeoffs',
      'for/not-for language',
    ],
  },
  recommendation_fit: {
    id: 'recommendation_fit',
    name: 'Recommendation Fit',
    plain_question: 'Does AI know when this business is an appropriate recommendation?',
    description:
      'Measures whether it is clear when this business is the right choice, for whom, and under what conditions.',
    weight: 0.15,
    signals: [
      'ideal customer profile',
      'use cases',
      'problems solved',
      'buying situations',
      'budget or fit indicators when relevant',
      'contraindications or poor-fit cases',
      'competitor and alternative context',
    ],
  },
};

export const V3_OUTCOME_DEFINITIONS: Record<V3OutcomeId, V3OutcomeDefinition> = {
  visibility: {
    id: 'visibility',
    name: 'Visibility',
    plain_question: 'Does the business show up?',
    description: 'Measures whether AI mentions the business for relevant prompts.',
  },
  representation_accuracy: {
    id: 'representation_accuracy',
    name: 'Representation Accuracy',
    plain_question: 'Did AI get the basic facts right?',
    description: 'Measures whether AI describes the business correctly.',
  },
  claim_support: {
    id: 'claim_support',
    name: 'Claim Support',
    plain_question: 'Can we prove what AI said?',
    description: "Measures whether AI's claims about the business are backed by real sources.",
  },
  context_preservation: {
    id: 'context_preservation',
    name: 'Context Preservation',
    plain_question: 'Did AI keep the meaning, or did it blur the business into everyone else?',
    description: 'Measures whether AI preserves the nuance of what makes the business different.',
  },
  recommendation_quality: {
    id: 'recommendation_quality',
    name: 'Recommendation Quality',
    plain_question: 'Is the recommendation fair, useful, and grounded?',
    description:
      'Measures whether AI recommends the business for appropriate reasons and in right-fit situations.',
  },
  stability: {
    id: 'stability',
    name: 'Stability',
    plain_question: 'Is this improvement real, or just a one-time lucky answer?',
    description: 'Measures whether results hold up across prompts, engines, repetitions, and time.',
  },
};

export const V3_AI_BUSINESS_ACCURACY_WEIGHTS = {
  representation_accuracy: 0.3,
  claim_support: 0.25,
  context_preservation: 0.2,
  recommendation_quality: 0.15,
  stability: 0.1,
} as const;

export const V3_AI_VISIBILITY_WEIGHTS = {
  visibility: 0.7,
  stability: 0.3,
} as const;

export const V3_INDEX_WEIGHTS = {
  ai_business_accuracy_score: 0.45,
  ai_visibility_score: 0.3,
  ai_readiness_score: 0.25,
} as const;

export function v3TierFromIndex(index: number): V3Tier {
  if (index < 20) return 'Invisible';
  if (index < 40) return 'Overlooked';
  if (index < 60) return 'Emerging';
  if (index < 80) return 'Discoverable';
  return 'Agent-Ready';
}

