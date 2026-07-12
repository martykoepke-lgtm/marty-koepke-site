# AI Business Accuracy V3 Rubric

## V3 Source Of Truth

This document defines the V3 strategy, rubric, scoring model, and migration target for the AI Visibility product.

V3 should be built as a clean new layer. V1 and V2 files should be retired into `archive/` only after the V3 site, tool logic, reports, and Supabase schema are ready.

## Core Positioning

### Market Doorway

AI Visibility, GEO, and AEO are the front door. These are the terms prospects already use when they ask whether AI can find and recommend their business.

### Operating Framework

AI Business Accuracy is the framework. It measures whether AI systems find, understand, support, and recommend the business in right-fit situations.

### Core Promise

We help AI get your business right.

### Simple Explanation

We check whether AI can find your business, understand what you do, prove what it says, preserve what makes you different, and recommend you in appropriate situations.

## Primary V3 Question

When someone asks AI about your category, does AI find your business, understand it accurately, support what it says, and recommend you in right-fit situations?

## Scoring Layers

V3 has two scoring layers:

1. Readiness Drivers
2. Measured AI Outcomes

Readiness drivers explain whether the business has the right signals in place. Measured outcomes show what AI systems actually say.

Do not collapse readiness and outcomes into a single generic visibility score. Visibility matters, but visibility alone does not prove that AI got the business right.

## Readiness Drivers

### 1. Business Clarity

Business Clarity measures whether the business clearly explains who it is, what it does, who it serves, where it operates, and what it should be known for.

Plain-English question:

Can AI tell what this business is and who it helps?

Signals:

- Official business name
- Name consistency and aliases
- Category clarity
- Services and offers
- Location or service area
- Audience fit
- About/company explanation
- Clear best-fit language

### 2. Source Support

Source Support measures whether important claims about the business are supported by credible owned and third-party sources.

Plain-English question:

Is there enough evidence for AI to believe and repeat the right facts?

Signals:

- Website evidence
- Google Business Profile and directory consistency
- Reviews
- Articles, profiles, podcasts, awards, and citations
- Case studies and testimonials
- Consistency across sources
- Independent corroboration

### 3. AI Readability

AI Readability measures whether business information is easy for crawlers, search systems, and AI tools to parse.

Plain-English question:

Is the business easy for AI systems to read?

Signals:

- Crawlability
- Page structure
- Clear headings
- Internal links
- Service pages
- FAQs
- Schema and structured data
- Robots and AI crawler access
- Stable source URLs

### 4. Distinctive Point Of View

Distinctive Point Of View measures whether the business has a clear, supportable reason to be recommended instead of alternatives.

Plain-English question:

Does AI have a real reason to choose this business?

Signals:

- Unique method or framework
- Clear specialization
- Point of view
- Differentiated claims
- Evidence for the difference
- Clear tradeoffs
- For/not-for language

Important rule:

Disagreement is not a penalty. Unsupported, unclear, exaggerated, or context-collapsed disagreement is the risk. A strong, well-supported point of view can improve visibility and recommendation fit.

### 5. Recommendation Fit

Recommendation Fit measures whether it is clear when this business is the right choice, for whom, and under what conditions.

Plain-English question:

Does AI know when this business is an appropriate recommendation and when it is not?

Signals:

- Ideal customer profile
- Use cases
- Problems solved
- Buying situations
- Budget or fit indicators when relevant
- Contraindications or poor-fit cases
- Competitor and alternative context

## Measured AI Outcomes

### 1. Visibility

Visibility measures whether AI mentions the business for relevant prompts.

Plain-English question:

Does the business show up?

Metrics:

- Mention rate
- Citation rate
- Prominence
- Share of voice
- Competitor comparison

### 2. Representation Accuracy

Representation Accuracy measures whether AI describes the business correctly.

Plain-English question:

Did AI get the basic facts right?

Metrics:

- Correct name
- Correct category
- Correct services
- Correct location or service area
- Correct audience
- Correct positioning
- No invented facts

### 3. Claim Support

Claim Support measures whether AI's claims about the business are backed by real sources.

Plain-English question:

Can we prove what AI said?

Claim labels:

- Supported by owned source
- Supported by independent source
- Supported by multiple sources
- Unsupported
- Contradicted
- Stale
- Ambiguous
- Not verifiable

Important rule:

The tool should not claim that AI "knows" whether citations are trustworthy. The tool should classify whether sources are accessible, relevant, current, independent, and supportive of the specific claim.

### 4. Context Preservation

Context Preservation measures whether AI preserves the nuance of what makes the business different.

Plain-English question:

Did AI keep the meaning, or did it blur the business into everyone else?

Metrics:

- Method preserved
- Point of view preserved
- Tradeoffs preserved
- No misleading simplification
- No flattening into generic category language
- No misleading comparison

### 5. Recommendation Quality

Recommendation Quality measures whether AI recommends the business for appropriate reasons and in right-fit situations.

Plain-English question:

If AI recommends this business, is the recommendation fair, useful, and grounded?

Metrics:

- Correct use case
- Correct customer fit
- Appropriate confidence level
- Correct comparison to alternatives
- No overclaiming
- No recommendation based on weak or wrong evidence

### 6. Stability

Stability measures whether results hold up across prompts, engines, repetitions, and time.

Plain-English question:

Is this improvement real, or just a one-time lucky answer?

Metrics:

- Prompt variation
- Engine variation
- Repeat-run variation
- Time-based changes
- Volatility
- Directional improvement after fixes

## Public Scores

V3 should expose three public-facing scores instead of one vague number.

### AI Visibility Score

Answers:

Are we showing up reliably?

Weighting:

- Visibility: 70%
- Stability: 30%

### AI Business Accuracy Score

Answers:

Is AI getting us right?

Weighting:

- Representation Accuracy: 30%
- Claim Support: 25%
- Context Preservation: 20%
- Recommendation Quality: 15%
- Stability: 10%

### AI Readiness Score

Answers:

Are we giving AI the right evidence to work with?

Weighting:

- Business Clarity: 25%
- Source Support: 25%
- AI Readability: 20%
- Distinctive Point Of View: 15%
- Recommendation Fit: 15%

## Primary V3 Composite

If the product needs one headline score, use the AI Business Accuracy Index.

Suggested weighting:

- AI Business Accuracy Score: 45%
- AI Visibility Score: 30%
- AI Readiness Score: 25%

This keeps visibility important, but does not allow visibility to overpower correctness.

## Free Vs Paid Boundary

### Free AI Visibility Check

The free scan should measure readiness unless it actually runs live AI prompts.

The free scan may say:

- Whether the business appears ready for AI systems to understand it
- Whether the website has clarity, source, readability, point-of-view, or recommendation-fit gaps
- What the most important next fixes are

The free scan should not say:

- That AI systems mention the business
- That AI systems recommend the business
- That citations support the business
- That hallucination risk has been fully assessed

Those claims require live AI testing and claim-level verification.

### Paid Daizie AI Visibility Assessment

The paid Assessment should measure both readiness and live outcomes. (Product name: "Daizie AI Visibility Assessment." Inside the Assessment, the AI Business Accuracy scoring framework is the mechanism — but the Assessment is the product, not the framework.)

The paid Assessment should include:

- Intake and business context
- Website and source review
- Live AI prompt testing
- Competitor comparison
- Claim extraction
- Citation and source review
- Claim support classification
- Representation accuracy scoring
- Context preservation scoring
- Recommendation quality scoring
- Stability checks when enough runs exist
- Prioritized remediation roadmap

## Supabase V3 Requirements

V3 requires database support for claim-level measurement and improvement tracking.

Recommended new tables:

- `audit_claims`
- `audit_claim_verifications`
- `audit_source_evidence`
- `audit_outcome_scores`
- `audit_prompt_variants` or equivalent prompt/run tracking
- `audit_stability_runs`

Recommended new outcome fields:

- visibility
- representation_accuracy
- claim_support
- context_preservation
- recommendation_quality
- stability
- ai_business_accuracy_index

## Tool V3 Requirements

The tool must move from:

Did AI mention the business?

To:

What did AI say, and was it correct?

Required capabilities:

- Extract atomic claims from AI responses
- Classify citations and source evidence
- Verify whether claims are supported, unsupported, contradicted, stale, ambiguous, or not verifiable
- Score accuracy and context, not just mention presence
- Track prompt, engine, repetition, and date for longitudinal measurement
- Produce reports that separate readiness from measured outcomes

## Site V3 Requirements

The site should use this hierarchy:

- Front door: AI Visibility
- Supporting tags: GEO, AEO, Generative Engine Optimization, Answer Engine Optimization
- Framework: AI Business Accuracy
- Promise: We help AI get your business right

Recommended hero:

AI Visibility for businesses that need AI to get them right.

Recommended subhead:

We test whether AI systems can find, understand, cite, and recommend your business in right-fit situations.

## Migration Rule

Build clean V3 files first. Do not rewrite V1 and V2 in place unless necessary.

Recommended migration sequence:

1. Create V3 rubric and operating standard.
2. Create V3 types, scoring, extraction, aggregation, and report files.
3. Create V3 Supabase migration.
4. Update site copy to V3 language.
5. Update app routes and imports to point at V3.
6. Verify free and paid flows.
7. Archive V1 and V2 files into `archive/legacy-v1-v2/`.
8. Clean branch history into one stable `main`.
