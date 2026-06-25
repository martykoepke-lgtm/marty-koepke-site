# AVI literature cross-map

**Purpose:** Compare independent published work on AI retrieval, ranking, and citation against `AVI_OPERATING_STANDARD.md`. Three columns: where the article and the standard **agree**, where the standard is **unique** to our work, and where the article exposes **gaps** in the standard.

**How to use this doc:** Each article gets its own section. When a gap surfaces, log it as an open question in §10 of the operating standard (or escalate to a new ADR if it's structural). When alignment is strong, cite the article in customer-facing copy as third-party support for our framing.

---

## Article 1 — Pedro Dias, "How LLMs and RAG Systems Retrieve, Rank, and Cite Content" (2026-05-22)

Scope: descriptive overview of RAG architecture — vector embeddings, hybrid retrieval, query transformation, re-ranking, rationale-based selection, citation attribution, information gain, structured data, and the downstream effect on traffic. Cites Anthropic contextual retrieval, DeepMind GopherCite, Google's Information Gain patent (US20200349181A1), Pew, Gartner.

### 1.1 Concept-by-concept map

| Article concept | Standard section | Verdict | Note |
|---|---|---|---|
| Semantic embeddings replace keyword matching | §3.5.1 D3 *Machine-Readability & Structure* | **Aligned (indirect)** | We don't score embeddings; we score the upstream signal — clean structure that produces clean embeddings. |
| Hybrid retrieval (semantic + BM25 via Reciprocal Rank Fusion); exact terms still matter | §3.5.1 D3, D1 | **Gap** | Standard doesn't explicitly reward presence of exact brand names, model numbers, technical identifiers. Worth a sub-criterion under D3 or a D1 sub-score. |
| ANN approximation introduces retrieval variability | §3.3 "Replayability" rule | **Tension** | Standard claims same input → same output. Article notes the engines under audit are *themselves* nondeterministic. Our replayability holds for our own LLM roles (Extractor, Judge, Recommender); it cannot hold for the engines we query. Standard should distinguish the two. |
| Query transformation (Decomposition, HyDE, LREM) | §6.2 paid query grid | **Gap** | Our query grid uses raw buyer-style queries. Engines may transform them before retrieving. Worth a note in the query-grid design: a query the user types ≠ what the engine searches with. May require including transformed variants. |
| Re-ranking with ~0.75 confidence threshold; sub-threshold candidates discarded | §3.5.2 Visibility sub-metrics | **Gap (subtle)** | Presence/Citation are binary in our model. Article reminds us: a page can be retrieved but cut at re-ranking. We measure the final state (cited or not), so this is observed, not modeled. But the standard could note this gating step exists when explaining why D3 (chunk-friendly structure) matters. |
| Rationale-based selection; Anthropic's contextual retrieval (35–67% chunk failure reduction) | §3.5.1 D3 | **Aligned (indirect)** | Validates the bet on D3. Could be cited in the rubric file as evidence for D3's weight. |
| Cite-while-writing vs cite-after-writing; GopherCite returns nothing rather than unsupported answers | §4 Refusal Catalog #1, #2 | **Strongly aligned** | Our "never invent a citation" and "insufficient_evidence is always valid" map directly to cite-while-writing and the GopherCite refusal pattern. Strongest citation hook for the operating standard. |
| Verification and correction step after generation | §5 Verification Protocol | **Aligned (different layer)** | Article: post-generation citation verification inside the RAG system. Ours: spot check, determinism, cross-judge after the audit completes. Same idea, different layer of the stack. |
| Engines may classify citation behavior differently (cite-after vs cite-while) | Extractor role | **Gap** | Extractor parses the engine's output but doesn't classify which citation mode the engine used. Adding this would help interpret why a mention happened without a citation, or vice versa. |
| Information gain as a selection signal (Google patent US20200349181A1) | §3.5.1 D4 *Information-Gain / Original-Data Signal* | **Strongly aligned (direct lineage)** | D4's name and concept come from this patent. Standard could cite the patent number explicitly. |
| Source reliability estimation; uncorroborated outlier claims down-weighted | §3.5.1 D2 *Third-Party Corroboration* | **Aligned (partial)** | D2 measures *presence* of corroboration. Article describes a related but distinct mechanism: claims without corroboration get *down-weighted*. We reward corroboration; we don't flag outlier claims that hurt the subject. Sub-criterion gap. |
| Knowledge graphs verify claims and identify authoritative sources | §3.5.1 D1 *Entity Clarity* | **Aligned (implicit)** | D1 anchor 5 mentions "knowledge-panel-ready" and sameAs links. Could be more explicit about Wikidata / KG presence as a top-of-scale criterion. |
| Schema markup's role in RAG is unproven (Nogami & Tannenbaum) | §3.5.1 D3 | **Aligned** | Standard treats schema as *one signal among others*, consistent with the article's "conservative position." We don't overweight it. |
| Engine divergence (~11% domain overlap); different sourcing per engine | §3.5.1 D6 *Platform-Native Fit* | **Strongly aligned** | D6 is the structured operationalization of this divergence — match the subject's platform presence to the engines their buyers actually use. |
| Chunk-level extraction, not whole pages | §3.5.1 D3 | **Aligned (implicit)** | D3 favors "direct-answer passages," "good headings + some direct-answer passages." Could be sharpened: each chunk should stand alone semantically. |
| 1% CTR on AI citations (Pew); 25% drop in search by 2026 (Gartner) | VISION §1 — "the shift we're built on" | **Strongly aligned** | These data points support the strategic frame, not the operating standard directly. Cite in customer-facing copy. |
| "Selection rate" as the emerging metric (vs CTR) | §3.5.2 Visibility (Presence, Citation, Share-of-Voice, Prominence) | **Aligned (different vocabulary)** | Our four sub-metrics decompose what the article calls selection rate. Worth a one-line glossary entry mapping the term. |
| Citation verification: do cited URLs resolve? | Extractor role | **Gap** | Extractor parses cited URLs from engine responses but the standard doesn't mandate verifying that those URLs are live, point to the claimed source, and weren't hallucinated by the engine. Should be a step in Extractor. |
| Measurement-data caution; ANN-driven nondeterminism limits AI visibility tracking | §3 universal rules | **Gap** | Standard claims replayability and determinism without acknowledging that the *engines under audit* are themselves nondeterministic — same prompt to ChatGPT today and tomorrow may give different responses. Need a paragraph explicitly distinguishing *our* determinism (Extractor, Judge, Recommender) from *engine* nondeterminism (Query runner). The paid Visibility protocol's "3 reps per query" already implicitly compensates, but the standard never says why. |

### 1.2 Where the standard is unique

The article is descriptive: how RAG systems retrieve and cite. The operating standard is operational: how to build a *measurement instrument* against those systems and govern the AI doing the measuring. Five things in our doc have no analogue in the article:

1. **The "aggregator, not assessor" principle.** Article treats RAG synthesis as legitimate. Standard draws a hard line: AI describes observed evidence, humans/code do assessment.
2. **The driver/outcome split (X side vs Y side).** Article only covers the Y side (how engines retrieve and cite). Our five drivers + outcome model is unique to a measurement instrument.
3. **Anchored 0–5 scales with locked weights and a versioned composite formula.** Article has no rubric. Ours is the instrument.
4. **The refusal catalog as a contract enforced by schema validation.** Article describes citation modes; we enforce them as bright lines the LLM cannot cross.
5. **Cross-judge verification using a second vendor.** Article describes single-system post-generation verification. Our QA pattern of independent-model spot checks is structurally different and stronger for a paid audit context.

### 1.3 Gaps that should change the standard

Not all gaps are worth acting on. These four are.

1. **Distinguish our determinism from engine nondeterminism.** Add to §3.5 (universal rules) a paragraph: "Replayability applies to LLM roles inside our pipeline (Extractor, Judge, Recommender), not to the engines under audit. The Query Runner records engine nondeterminism via the 3-reps-per-query protocol; the audit reports the central tendency, not a single response." This closes the most important honesty gap.

2. **Add a citation-verification step to the Extractor role.** Every URL the engine cites must be fetched and verified (resolves, content matches the claim). Hallucinated citations are a known failure mode; we should detect them.

3. **Reward exact-term presence in D3 or D1.** Hybrid retrieval means brand names, product names, and technical identifiers in clean form on the subject's site help retrieval. Add a sub-criterion: "subject's canonical name and primary product/service names appear in `<h1>`, `<title>`, and structured-data identifier fields."

4. **Mention uncorroborated-outlier-claim risk under D2.** Currently D2 only rewards corroboration. The article notes engines may *down-weight* sources that make outlier claims without corroboration. The free check should flag uncorroborated bold claims on the subject's site as a Readiness risk, not just an absence of corroboration.

### 1.4 What to cite from this article

Three places the article should appear in our customer-facing or canon documents:

- **VISION §1** — Pew "1% CTR" and Gartner "25% drop by 2026" support the strategic frame.
- **Rubric file (D4 anchored scale)** — cite Google's Information Gain patent (US20200349181A1) as the primary source.
- **Rubric file (D3 anchored scale)** — cite Anthropic's contextual retrieval result (35–67% chunk failure reduction) as evidence for why structured, chunk-friendly content matters.

---

## Article 2 — Aggarwal et al., "GEO: Generative Engine Optimization" (arXiv 2311.09735)

Scope: peer-reviewed empirical study. The authors define GEO as a black-box framework for boosting source visibility inside generative-engine responses (BingChat, Perplexity, Google SGE). They build a 10,000-query benchmark (GEO-bench) across 25 domains, test 9 content-modification methods, and measure two impression metrics (Position-Adjusted Word Count + a 7-sub-metric Subjective Impression). Strongest reported result: up to **+40% visibility on the custom engine** and **+37% on Perplexity** from adding citations, quotations, and statistics. Validated on Perplexity.ai. Notable for what *didn't* work as much as what did.

### 2.1 What the paper actually tested

The 9 methods, ranked roughly by measured effect on Position-Adjusted Word Count (PAWC) over baseline 19.3 on GEO-bench:

| Method | Custom GE PAWC | Subjective Imp. | Verdict |
|---|---|---|---|
| Quotation Addition | 27.2 | 24.7 | **Best single method** |
| Statistics Addition | 25.2 | 23.7 | Top tier; on Perplexity, +37% SI |
| Fluency Optimization | 24.7 | 21.9 | Strong stylistic gain |
| Cite Sources | 24.6 | 21.9 | Force-multiplier in combinations |
| Technical Terms | 22.7 | 21.4 | Modest |
| Easy-to-Understand | 22.0 | 20.5 | Modest |
| Authoritative tone | 21.3 | 22.9 | "No significant improvement"; GEs robust to it |
| Unique Words | 20.5 | 20.4 | Essentially null |
| Keyword Stuffing | **17.7** | 20.2 | **Hurts** PAWC; on Perplexity, −10% vs baseline |

Best pair: Fluency Optimization + Statistics Addition → **35.8%** average improvement. Cite Sources averaged **+31.4%** when combined with other methods, despite being weaker alone.

### 2.2 Concept-by-concept map

| Paper concept / finding | Standard section | Verdict | Note |
|---|---|---|---|
| Top three methods are Cite Sources, Quotation Addition, Statistics Addition (+30–40% visibility) | §3.5.1 D4 *Information-Gain / Original-Data Signal* | **Strongly aligned (direct evidence)** | The single strongest empirical citation for D4's weight (0.25). |
| Stylistic methods (Fluency Optimization, Easy-to-Understand) boost 15–30% | §3.5.1 D3 *Machine-Readability & Structure* | **Strongly aligned (direct evidence)** | Validates D3 at weight 0.15. Could argue for raising the weight. |
| Keyword Stuffing hurts (−10% on Perplexity PAWC) | §3.5.1 D3 anchored scale | **Gap (penalty missing)** | D3 doesn't currently penalize keyword stuffing. Add a low-band criterion: "evidence of keyword stuffing (unnatural repetition, density > X) caps D3 at 2." |
| Authoritative tone produces "no significant improvement" | §4 Refusal Catalog #7 (banned superlatives) | **Aligned** | Our voice rules already ban "best-in-class" style. Paper provides empirical support: it doesn't work even when it tries. |
| GEO-bench query mix: 80% informational, 10% transactional, 10% navigational; 25 domains | §6.2 Paid Visibility Check query grid | **Gap** | Standard specifies "10–20 queries × 4–5 engines × 3 reps" without query-type composition. Adopt the 80/10/10 split as a default; document deviations per subject. |
| Position-Adjusted Word Count — exponentially decaying weight by citation position | §3.5.2 Prominence sub-metric | **Aligned (different curve)** | We use fixed bands (top=1.0, middle=0.5, late=0.25, not_named=0). Paper's exponential decay is a more granular alternative; ours is more interpretable. No change needed unless calibration data shows our bands distort. |
| Subjective Impression = 7 LLM-judged sub-metrics (relevance, influence, uniqueness, subjective position, subjective count, click likelihood, diversity) | §3.5.2 Visibility sub-metrics | **Partial overlap** | Paper's "uniqueness" maps to D4. "Relevance + influence" partially overlaps Citation. "Diversity" has no analogue in ours and isn't well-defined for a single-subject audit, so safe to skip. |
| Lower-ranked pages gain the most: rank-5 sources saw +115.1% from Cite Sources, +99.7% from Quotation, +97.9% from Statistics | VISION §1–2 (small-player window) | **Strongly aligned (strategic support)** | This is the single best citation for the "once-in-a-decade window for small players" frame. Use in VISION and customer copy. |
| Rank-1 pages can LOSE visibility from GEO methods (Cite Sources −30.3% at rank 1) | Recommender role | **Gap** | Recommender doesn't currently consider the subject's current visibility level. Add rank-aware logic: recommendations differ for "invisible" subjects vs already-cited subjects. |
| Domain-specific effectiveness: Statistics → Law/Government; Cite Sources → Factual; Quotation → People & Society | Recommender role | **Gap** | Recommender should weight prescription by the subject's industry. Add domain-aware logic using the paper's Table 3 as the starting prior. |
| Combinations beat single strategies (Fluency + Statistics = +35.8%; Cite Sources averages +31.4% in combinations) | §7 code organization (Recommender) | **Aligned (implicit)** | Our top-N recommendations are already meant to be combined fixes. Worth making explicit: recommendations should be designed to compound, not duplicate. |
| Cite Sources hurts Subjective Impression on Perplexity (19.0 vs 24.7 baseline) even while helping PAWC | §3.5.1 D6 *Platform-Native Fit*, Recommender | **Aligned (supports D6)** | Empirical evidence that what works on one engine may hurt on another — directly supports D6 as a structural dimension. |
| Generative engines value "not only content but also information presentation" | §3.5.1 D3 | **Aligned** | Two-axis evidence: substance (D4) and presentation (D3) both matter. Validates the rubric's split. |
| Authors explicitly state they did NOT measure how GEO methods affect classical search rankings | §5 Verification Protocol | **Gap (acknowledged limitation)** | Our standard should acknowledge the same: improving AVI may have unknown downstream effects on Google ranking. Add to §10 open questions. |
| GEO is black-box: methods are stylistic/content rewrites by an LLM, no engine-internal knowledge | §1 principle | **Aligned** | Same posture: measure observable surfaces, don't claim knowledge of engine internals. |
| Metric design principles: (1) relevance to creators, (2) explainability, (3) comprehensibility to non-experts | §3 universal rules | **Aligned (philosophical)** | Our rules are stricter — anchored, versioned, replayable — but the philosophy matches: numbers must be defensible to non-engineers. |

### 2.3 Where the standard is unique

Five things our standard does that the paper does not:

1. **Driver/outcome split.** Paper measures outcome (impression) under content modifications. We model the *upstream causes* (5 drivers) and the *outcome* (Visibility) as separate sub-indexes with a causal hypothesis: improve drivers → outcome rises. Paper doesn't structure the X side.
2. **Locked anchored scales with refusal apparatus.** Paper uses GPT-4 for tagging and LLM-as-judge Subjective Impression scoring without our refusal catalog, evidence-pointer requirement, or "insufficient_evidence" fallback. Our judge is more constrained.
3. **Per-subject corroboration as a structural property.** Paper treats "Cite Sources" as a tactic the subject performs. We treat third-party corroboration (D2) as a structural property of the subject's web presence — a different unit of analysis.
4. **Platform-Native Fit (D6).** Paper notes engine divergence empirically (Perplexity Cite Sources divergence) but doesn't structure it. D6 makes it scorable.
5. **Versioned rubric, replayability, cross-judge.** Paper experiments are one-shot academic studies. Our standard is built for repeated commercial audits with `AVI_RUBRIC_VERSION` stamping and a second-vendor cross-check. Different durability requirements.

### 2.4 Gaps that should change the standard

Six action items, in priority order. Higher priority than Article 1's gaps because they come from empirical evidence, not a descriptive overview.

1. **Adopt the 80/10/10 query mix in §6.2.** The paper validates this distribution across 10,000 queries. Set as the default for the paid Visibility query grid; document deviations per subject category.
2. **Add a keyword-stuffing penalty to D3.** Currently D3 only rewards presence of good structure. The paper provides empirical evidence (−10% on Perplexity) that keyword stuffing actively hurts. Add a low-band cap: "any evidence of keyword stuffing caps this dimension at 2."
3. **Make the Recommender domain-aware.** Use the paper's Table 3 priors: prescribe Statistics for legal/government/opinion subjects; Cite Sources for factual-claim-heavy sites; Quotations for people-and-society subjects. Document the prior, log when the subject's industry overrides the default.
4. **Make the Recommender rank-aware.** A subject with high current Visibility (rank-1-equivalent) should receive different recommendations than an invisible subject. Specifically: do not recommend Cite Sources, Quotation, or Statistics additions to subjects already at the top of cross-engine citations — the paper shows these can *reduce* visibility for top sources (Cite Sources −30.3% at rank 1).
5. **Expand the Recommender's refusal list with paper's negative findings.** Never recommend keyword stuffing, "make your tone more authoritative," or "add unique synonyms." These either don't work or actively hurt. Should be hard-coded refusals, not just defaults.
6. **Acknowledge the SEO-ranking unknown.** The paper explicitly notes they did not measure whether GEO methods affect classical Google rank. Add to §10: "Improving AVI may have unknown downstream effects on Google organic rank. Pending evidence, the recommendations assume no harm. Subjects already ranking #1 organically should consider this risk in the walkthrough call."

### 2.5 What to cite from this paper

Four citations to wire into customer-facing copy and canon docs:

- **VISION §1 / §2** — the rank-5 +115% finding is the strongest single empirical citation for the small-player window. Specific quote: *"Cite Sources method led to a substantial 115.1% increase in visibility for websites ranked fifth in SERP."*
- **Rubric D4 anchored scale** — cite Aggarwal et al. (2024), *"top-performing methods, Cite Sources, Quotation Addition, and Statistics Addition, achieved a relative improvement of 30-40% on the Position-Adjusted Word Count metric."* Pair with Google's Information Gain patent (cited from Article 1) for the strongest evidence stack on a single dimension in the rubric.
- **Rubric D3 anchored scale** — cite the 15–30% stylistic-method finding for fluency/readability impact. Pair with Anthropic's contextual retrieval result (from Article 1) for a two-source evidence stack.
- **Recommender system prompt** — cite the paper's negative findings (keyword stuffing −10%, authoritative tone null) when explaining to the Recommender why those tactics are refused.

### 2.6 Synthesis with Article 1 (Dias)

The two articles disagree on one surface and agree on three:

- **Disagreement on exact-term keywords.** Dias: hybrid retrieval (BM25 alongside semantic) means brand names and exact product names still matter. Aggarwal: keyword stuffing hurts. **Resolution:** these aren't contradictory. *Including* canonical brand/product names naturally is Dias's point; *stuffing* beyond natural use is Aggarwal's. Our D3 sub-criterion should be "canonical exact terms present in `<h1>`, `<title>`, and schema identifiers" with a low-band cap for stuffing. Both gaps from both articles fold into one sub-criterion.
- **Agreement on information gain as the core selection signal.** Dias cites Google's patent; Aggarwal proves it empirically (+30–40%). D4 has the strongest evidence base of any dimension in the rubric.
- **Agreement on engine divergence.** Both articles support D6 with different evidence (Dias: ~11% domain overlap; Aggarwal: Cite Sources helps PAWC but hurts SI on Perplexity).
- **Agreement on structure / chunk-friendly content.** Dias: chunk-level extraction. Aggarwal: fluency optimization +15–30%. Both support D3.

The combined evidence base strengthens the case for the six-dim rubric, with D4 as the highest-leverage driver and D2/D3/D6 well-supported. D1 (Entity Clarity) is supported indirectly by Dias's entity-recognition discussion; neither paper measures it as a leading variable, so D1's weight remains a starting hypothesis.

---

## Article 3 — Google, "Determining Information Gain Subsequent to Identifying a User Interest" (US Patent Application US20200349181A1)

Scope: the primary source we and the prior two articles have been citing for "information gain." Reading it directly narrows what the patent actually claims and changes one entry in our rubric.

### 3.1 What the patent actually describes

Per-user, per-session **de-duplication** of documents presented by a search engine or automated assistant:

1. Identify a first set of documents on a topic that the user has *already consumed* (viewed, listened to, had read aloud by TTS).
2. Identify a second set of new documents on the same topic that the user has not consumed.
3. Score each new document's *information gain relative to the first set* using an ML model — input is semantic vectors / embeddings of both sets; output is a 0–1 score where 0 means "no new information" and 1 means "all new information."
4. Rerank, demote, or completely exclude new documents based on that score.

The ML model is trained on subjective human labels: *"Was this document redundant given what you already read?"* (paragraphs 0049–0050). The motivating use case is voice assistants and TTS contexts, where redundant audio output is especially costly (paragraph 0033).

### 3.2 What the patent does NOT directly claim

Three things our literature stack has been implying that the patent text does not directly support:

1. A **global, content-intrinsic "originality score"** for documents independent of user state. The patent's mechanism is *comparative* (this document vs. what the user already read).
2. That **original data on a single page, in isolation**, will be preferred for citation in a cold query (no prior user reading history).
3. That **statistics, citations, and quotations** are the levers that drive this. (Those are Aggarwal's empirical findings, not the patent's mechanism.)

The patent does support the broader principle — engines aggregate across sources, filter for non-redundancy, and may exclude redundant sources entirely (paragraph 0059).

### 3.3 Concept-by-concept map

| Patent concept | Standard section | Verdict | Note |
|---|---|---|---|
| Per-user de-duplication via subjective human-labeled training data | §3.5.1 D4 *Information-Gain / Original-Data Signal* | **Partially aligned (over-extended)** | We named D4 after this patent but our use is broader. Patent describes a session-aware filter; we use the term for a content-intrinsic property. See §3.5 below for proposed reframe. |
| Documents scored 0–1 for information gain relative to already-consumed set | §3.5.2 Visibility sub-metrics | **Aligned (different layer)** | We aggregate cold-query outcomes; patent operates on session-aware outcomes. Compatible but distinct. |
| Documents may be excluded entirely if information gain is zero (paragraph 0059) | §3.5.1 D4 | **Strongly aligned** | Strongest direct support for the principle that engines filter for non-redundancy. Worth citing verbatim in the D4 anchored scale. |
| Semantic vectors / embeddings used to compare documents (paragraphs 0009, 0052–0053) | §3.5.1 D3 *Machine-Readability & Structure* | **Aligned (indirect)** | The patent's mechanism assumes embedding-friendly content. Reinforces D3's relevance to D4: poor structure → poor embeddings → poor information-gain scoring. |
| Per-session memory of what the user has consumed (paragraphs 0042–0043) | §6.2 Paid Visibility Check query grid | **Gap** | Our query grid measures cold-query behavior (each query is independent). Patent describes session-aware reranking. We do not measure subject standing in deep-session contexts. Worth a limitation note in §10. |
| Particularly relevant for TTS / voice-assistant contexts (paragraph 0033) | §3.5.1 D6 *Platform-Native Fit* | **Aligned (indirect)** | Voice assistants are one of the engines we audit. Patent justifies why voice surfaces are especially likely to filter redundant sources. Worth mentioning in D6's anchored scale. |
| Training labels generated by humans reading documents and rating redundancy (paragraphs 0049–0050) | §5 Verification Protocol | **Aligned (methodological)** | Same posture as our anchored scales and our cross-judge protocol — calibrated against human judgment. Reinforces the legitimacy of the LLM-as-judge approach when properly bounded. |

### 3.4 Where the standard is unique

The patent describes an engine-side mechanism. Our standard is a measurement and operating discipline for a content-side auditor. Five things in our standard with no patent analogue:

1. The driver/outcome split.
2. Anchored 0–5 scales for subject-side properties.
3. The refusal catalog enforced by schema validation.
4. Cross-judge verification using a second vendor.
5. The free-vs-paid product structure with versioned rubric stamping.

### 3.5 Gaps that should change the standard

Two changes worth making, both small but meaningful for honesty.

1. **Rename D4 to "Differentiation from consensus" (or similar) and rewrite its operational definition.** The current name implies a property of a page in isolation. The patent's mechanism is comparative — non-redundancy relative to other sources on the same topic. Aggarwal's evidence (citations, statistics, quotations) supports the same idea: content that adds something to the topic-level pool gets selected. Recommended wording for the rubric file:
   > **D4 — Differentiation from Consensus.** Measures whether the subject's content adds non-redundant information to the topic-level pool that AI engines aggregate across sources. *Why it matters:* engines filter for complementary sources and exclude redundant ones (US Patent US20200349181A1); empirical evidence shows citations, statistics, and quotations are the most effective levers (Aggarwal et al. 2024). *How to measure:* sample key pages; for each, ask whether the content adds original data, named sources, or distinctive perspective beyond consensus restatement.
2. **Add a deep-session limitation to §10.** Our standard measures cold-query behavior. The patent describes session-aware reranking: a subject's standing in deep-session results (when a user has read multiple sources first) may differ. We do not measure this. Add to §10 open questions: *"AVI measures cold-query visibility. Deep-session visibility — where the engine has memory of what the user has already consumed — is not measured. Per US20200349181A1, deep-session standing may favor sources that complement what was already shown rather than rank-1 sources from a cold query."*

### 3.6 What to cite from this article — and the correction

This is the correction. The evidence stack on D4 should now read:

- **The patent (US20200349181A1)** → cite for the *principle* that engines filter for non-redundancy and may exclude redundant sources entirely. Specifically paragraph 0059. Do not cite for tactics or for global originality claims.
- **Aggarwal et al. 2024 GEO paper** → cite for the *measured tactics* (citations, statistics, quotations → +30–40%). This is where the rubber meets the road.
- **Dias 2026** → cite as secondary synthesis; not the primary source for either claim.

Previously we (and the secondhand literature) conflated the patent's principle with Aggarwal's tactics. The patent is the *why* (engines filter for non-redundancy); Aggarwal is the *how* (here are the specific moves that work). Keeping them distinct makes the citation chain stronger and the rubric more defensible to a skeptical client.

### 3.7 Synthesis with Articles 1 and 2

Reading the patent directly tightens the synthesis from §2.6:

- **D4's evidence base** is the strongest in the rubric, but with a refined story: patent (principle) + Aggarwal (tactics) + Dias (synthesis). The story now matches the source material.
- **D3's evidence base** is unchanged: Dias on chunk-level extraction + Aggarwal's 15–30% fluency/readability gain. The patent reinforces D3 indirectly by relying on embeddings.
- **D6's evidence base** gains one citation: the patent specifically highlights TTS/voice-assistant contexts as the place this mechanism matters most. Voice surfaces are one of D6's "platform-native" surfaces.
- **D1, D2 unchanged.**
- **One new acknowledged gap:** cold-query vs deep-session distinction. Worth surfacing in customer-facing copy as part of the "what this measurement doesn't tell you" appendix proposed earlier.

---

## Article 4 — Third-party platform sourcing: combined academic and industry evidence stack

Scope: this entry is a *synthesis*, not a single article. It captures the evidence trail that LLM engines do not primarily cite the subject's own website — they cite third-party platforms (Wikipedia, Reddit, YouTube, LinkedIn, Quora, Yelp, TripAdvisor, etc.). This evidence is what justifies our D2 (Third-Party Corroboration) and D6 (Platform-Native Fit) dimensions and is the strongest case against any rubric design that only scores the subject's own site.

Reason this is one entry instead of many: no single peer-reviewed paper says "here's exactly how each commercial LLM weights each platform." That paper doesn't exist because the engines are black boxes and the weights are proprietary. The evidence is necessarily indirect, so the case is built from multiple sources triangulated.

### 4.1 The evidence stack

**Academic / arxiv (peer-reviewed-adjacent):**

| Source | Finding |
|---|---|
| Liu et al., "Evaluating Verifiability in Generative Search Engines" (arxiv 2304.09848) | Across Bing Chat, NeevaAI, Perplexity, YouChat: only 51.5% of statements fully supported by citations (recall); only 74.5% of citations supported the statement (precision). Perplexity highest recall (68.7%); Bing Chat highest precision (89.5%). |
| Vidgen et al., "Generative AI Search Engines as Arbiters of Public Knowledge" (arxiv 2405.14034) | Academic audit framing AI search engines as gatekeepers of which sources count as authoritative. |
| Shah & Bender, "Search Engines Post-ChatGPT" (arxiv 2402.11707) | Theoretical and empirical concerns about reliability of AI search as a knowledge surface. |
| "Wikipedia in the Era of LLMs: Evolution and Risks" (arxiv 2503.02879) | Wikipedia's outsized role in LLM behavior; engines depend disproportionately on Wikipedia's structure. |
| Onweller et al., "Cited but Not Verified" (arxiv 2605.06635, 2026) | Tested 14 LLMs. Even strongest frontier models achieve only 39–77% factual accuracy in citations, despite link validity >94% and topical relevance >80%. Scaling tool calls from 2 to 150 drops factual accuracy by ~42%. Directly relevant to Extractor URL verification — the URL working and being topically relevant is not the same as it supporting the claim. |
| "Source Coverage and Citation Bias in LLM-based vs Traditional Search" (arxiv 2512.09483) | Comparison of citation distributions across LLM search and traditional engines. |

**Industry research (rigorous but not peer-reviewed):**

| Source | Finding |
|---|---|
| Tow Center (Columbia Journalism Review), 2025 | 1,600 queries tested. AI search engines fail to retrieve correct information >60% overall; Perplexity lowest at 37%. |
| Semrush, June 2025 | 150,000 AI citations across 5,000 keywords. Distribution: Reddit 40.1%, Wikipedia 26.3%, YouTube 23.5%. |
| Conductor (late 2025) | Reddit overall citation frequency dropped ~50%, but sole-source citations rose 31%. Pattern is concentrating. |
| Profound, Aug 2024–June 2025 | 680M citations. ChatGPT → Wikipedia (7.8%) dominant; Google AI Overviews → Reddit (2.2%) leading; Perplexity → Reddit (6.6%) heavy. TLD: .com 80%, .org 11%. |
| ALM Corp | ChatGPT cites from the first third of source content 44% of the time. |

**Contractual evidence (the firmest breadcrumb — not behavioral, but contractual):**

| Source | Finding |
|---|---|
| Google–Reddit licensing | ~$60M/year publicly reported; Reddit data feeds Google AI surfaces. |
| OpenAI–Reddit licensing | Separate agreement; comparable structure. |
| Wikimedia Foundation enterprise licensing | Deals with Microsoft, Meta, Amazon, Perplexity, Mistral. Wikidata feeds AI semantic layers directly. |
| Reddit v. Anthropic lawsuit (2024) | Allegations of 100k+ unauthorized scraping access attempts. Even contested access implies value of the source. |

When AI companies pay nine-figure sums for access to specific platforms, that platform is part of the sourcing pipeline. This is the most defensible breadcrumb available.

### 4.2 Concept-by-concept map

| Evidence concept | Standard section | Verdict | Note |
|---|---|---|---|
| LLM engines cite third-party platforms heavily, not just subject's own site | §3.5.1 D2 *Third-Party Corroboration* | **Strongly aligned (validates weight increase)** | D2 at 0.20 is likely undervalued. Evidence stack supports raising to 0.25. |
| Engine-specific platform preferences (ChatGPT→Wikipedia, GAIO→Reddit/Quora, Perplexity→Reddit/Yelp) | §3.5.1 D6 *Platform-Native Fit* | **Strongly aligned (validates structural existence)** | D6 needs a per-engine sub-table specifying which platforms feed which engines. Currently D6 is abstract; the evidence lets us make it concrete. |
| Citation hallucination 11–57% across deployed models | Extractor role (`agents/EXTRACTOR.md`) | **Aligned (validates URL verification)** | Every cited URL must be verified to resolve and support the claim. The post-extractor verification step in EXTRACTOR.md is justified by this finding. |
| Cross-engine domain overlap is only ~11% | §3.5.1 D6 | **Strongly aligned** | Reinforces D6 — engines diverge sharply in what they cite. Single-engine optimization is a category error. |
| Wikimedia/Reddit licensing deals | VISION + §3.5.1 D2 | **Aligned (strategic)** | Cite in customer-facing copy as the firmest evidence that platform presence is contractually relevant, not behavioral guesswork. |
| ChatGPT cites first third of source content 44% of the time | §3.5.1 D3 | **Aligned (operationalizable)** | D3 anchored scale should reward placing differentiated content above the fold / in the first third of pages. |
| 51.5% citation recall, 74.5% precision (Liu et al.) | §5 Verification Protocol | **Aligned (justifies cross-judge)** | Engines themselves are unreliable citers. Our cross-judge protocol is the right posture for handling this in our own measurement. |

### 4.3 Where the standard is unique

The literature stack here is *descriptive* — it documents what AI engines do. None of these sources prescribe a measurement instrument for a subject's exposure to that landscape. Our standard's contribution stays unique on the same five axes from prior articles (driver/outcome split, anchored scales, refusal catalog, cross-judge verification, versioned rubric). No change to that list.

### 4.4 Gaps that should change the standard

Three changes worth making.

1. **Raise D2's weight from 0.20 to 0.25; lower D1 from 0.20 to 0.15.** Evidence stack consistently shows third-party platforms as primary citation sources, not corroborating signals. D1 (Entity Clarity) remains a precondition but is upstream of D2's payoff — engines need the entity to be identifiable before they can cite corroboration about it. Revised weights:
   - D1: 0.15
   - D2: 0.25
   - D3: 0.15
   - D4: 0.30
   - D6: 0.15
   - Total: 1.00
2. **Add an engine-platform mapping table to D6.** Make D6's anchored scale concrete instead of abstract. The three engines we audit are ChatGPT, Claude (Anthropic), and Perplexity. Google/Gemini is excluded due to rate-limit issues in prior testing; Profound's Google AI Overviews data is retained as evidence of engine divergence but not used as an audit target. Per-engine favored platforms:
   - **ChatGPT** favors: Wikipedia, Forbes, G2, Reuters, established news (authoritative knowledge, encyclopedic)
   - **Claude (Anthropic)** favors: academic and government sources, vendor-neutral analyst coverage (Gartner-style), niche SaaS/practitioner blogs, technical documentation. ~63% of citations to niche specialist content; only ~7% to mainstream news. Live retrieval via Brave Search.
   - **Perplexity** favors: Reddit, YouTube, Gartner, Yelp, TripAdvisor (community-heavy, peer-driven)
   - Subject's score = presence on the platforms that feed *the buyer's most likely engines*.
3. **Add a D3 sub-criterion for above-the-fold differentiation.** ALM Corp's finding (44% of ChatGPT citations from the first third of content) implies that lead-with-your-differentiation is structurally rewarded. Sub-criterion: D3 caps at band 3 if the page's distinctive content (D4 evidence pointers) appears below the first third of the page.

### 4.5 What to cite from this article — and the limit

- **VISION §1 / §2** — Wikimedia/Reddit licensing deals as the firmest evidence that platform presence is contractually relevant.
- **Rubric D2 anchored scale** — Semrush distribution (Reddit 40.1%, Wikipedia 26.3%, YouTube 23.5%) as the strongest empirical citation for D2's weight.
- **Rubric D6 anchored scale** — Profound's per-engine breakdown (ChatGPT vs GAIO vs Perplexity citation patterns) as evidence for engine-specific platform mapping. **For Claude (Anthropic), cite the secondary industry analyses listed in §4.7** since Profound did not measure Claude directly.
- **Rubric D3 anchored scale** — ALM Corp's 44% / first third finding as evidence for the above-the-fold sub-criterion.
- **Extractor role refusal block** — Onweller et al. (2026), "Cited but Not Verified" (arxiv 2605.06635). Frontier LLMs achieve only 39–77% factual accuracy in their citations even though links work and topical relevance is high. Justification for URL verification AND content-supports-claim verification — URL working alone is insufficient.
- **Operating standard §5.3 cross-judge** — Liu et al. (arxiv 2304.09848) 51.5% recall / 74.5% precision as justification for a second-vendor check.

**The honest limit:** no peer-reviewed paper isolates exactly how each commercial LLM weights each platform. That paper would have to come from inside the AI companies or from very expensive black-box auditing. Until it exists, the evidence is necessarily triangulated from industry audits + licensing deals + behavioral measurements.

### 4.6 Synthesis with Articles 1, 2, 3

This article reshapes the rubric's center of gravity:

- **D4 (Differentiation from Consensus)** stays at 0.30 — strongest single evidence base across all four articles.
- **D2 (Third-Party Corroboration)** rises to 0.25 — second-strongest evidence base after Article 4 lands.
- **D1, D3, D6** absorb the rebalance at 0.15 each. D1 drops because evidence for it is principle-based, not measured. D3 and D6 stay where they are because each has direct empirical support (Aggarwal's 15–30% for D3; Profound + Semrush for D6).
- **The rubric is no longer subject-website-centric.** Articles 1–3 implied this; Article 4 makes it explicit. The subject's own site is one input among several; third-party platforms and engine-specific platform fit carry more weight.

**One philosophical move this enables.** The customer conversation can now honestly say: *"AI engines mostly cite Wikipedia, Reddit, YouTube, and a handful of other platforms — not your website directly. Your visibility depends as much on how you appear on those platforms as on what your site looks like. We measure both."* This is the AVI's strongest differentiation against any tool that only crawls the subject's site.

### 4.7 Sources for Claude (Anthropic) sourcing patterns

Profound's empirical dataset measured ChatGPT, Google AI Overviews, and Perplexity but not Claude. The Claude-specific sourcing pattern in §4.4 #2 is drawn from the following industry analyses. None are peer-reviewed; they are practitioner observations and direct examination of Claude's behavior. Triangulated they are consistent with each other and with the broader principle of engine divergence.

- [How to Get Cited in Claude: Anthropic's Sourcing Pattern Explained (Stridec)](https://stridec.com/blog/how-to-get-cited-in-claude/)
- [Claude SEO: How to Get Cited by Claude AI (Erlin.ai)](https://www.erlin.ai/blog/claude-seo)
- [How Claude Picks Sources: A Technical Breakdown (Oltre.ai)](https://www.oltre.ai/blog/how-claude-picks-sources-technical-breakdown-claude-citations/)
- [Claude AI Optimization: Get Cited by Anthropic (Oltre.ai)](https://www.oltre.ai/blog/claude-ai-optimization/)
- [The AI Labs Citation Share Index 2026 (Everything-PR)](https://everything-pr.com/ai-labs-citation-share-index-2026)
- [Claude AI Optimization: How to Get Cited in Claude Search (Stackmatix)](https://www.stackmatix.com/blog/claude-ai-optimization)

When better evidence emerges (a peer-reviewed Claude citation study, an Anthropic-published source-weighting paper, or a Profound-style empirical dataset that includes Claude), upgrade the citations in §4.4 #2 and demote these to a footnote.

---

## Article 5 — *(to be added)*

When the next article arrives, append the same six sub-sections: methods tested (if empirical), concept-by-concept map, where unique, gaps to act on, what to cite, synthesis with prior articles.



