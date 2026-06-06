# AI Visibility — Learning & Citation Reference

*A working reference for Practical Informatics. Everything here is something you should be able to explain in plain English AND cite to a source. Links go to the primary or strongest available source so you can verify the details yourself.*

**How to use this:** Read top to bottom once to build the mental model. After that, treat it as a citation lookup — when you make a claim in a post, a report, or a video, pull the matching source from here. A note on source quality: weight peer-reviewed and primary sources (arXiv, Google's own docs, Anthropic's own engineering) above vendor blogs, and when vendors disagree, *say so* — the disagreement is usually the real story.

---

## 1. The mechanism — how AI search actually selects content

This is the "nature and architecture of LLMs" layer. The one-sentence version: **AI search does not rank pages; it retrieves and assembles passages.** Understand this and most tactics become obvious.

- **What happens under the hood:** A user query and your content are both converted into high-dimensional vector embeddings. Retrieval is a geometry problem — the system selects the passages whose vectors sit closest to the query's vector in meaning-space, not by keyword match. This is Retrieval-Augmented Generation (RAG).
  - Plain explainer of retrieve → rank → cite: **Stan Ventures — How LLMs and RAG Systems Retrieve, Rank, and Cite Content** — https://www.stanventures.com/news/how-llms-and-rag-systems-retrieve-rank-and-cite-content-6385/
  - Ranking factors mapped to each stage of the pipeline: **LLM Retrieval Ranking Factors** — https://khalidseo.com/llm-retrieval-ranking-factors/
  - AEO-oriented walkthrough of query fan-out and passage retrieval: **Discovered Labs — How does LLM retrieval work for AI search** — https://discoveredlabs.com/blog/how-does-llm-retrieval-work-for-ai-search-aeo-guide

- **Why duplicate/consensus content gets dropped:** Retrieval favors *complementary* information. If one source already covers the definition, the system reaches for a different source with examples, statistics, or nuance — and filters out content that merely repeats the consensus. This is why original data wins.
  - **Visively — LLM/RAG retrieval & ranking** — https://visively.com/kb/ai/llm-rag-retrieval-ranking

- **Why entities matter (your "person/company as an entity" thesis):** Systems use knowledge graphs to recognize entities, verify claims, and identify authoritative sources. Consistent, recognizable entity signals across the web raise trust.
  - Same Visively and Khalid SEO pages above cover entity salience.

- **Primary sources worth reading in full:**
  - **Retrieval-Augmented Generation for Large Language Models: A Survey** (Gao et al., arXiv) — the academic survey of RAG architectures — https://arxiv.org/abs/2312.10997
  - **Anthropic — Introducing Contextual Retrieval** — primary-source engineering showing that adding chunk-specific context cut retrieval-failure rates substantially; credible and on-brand for a Claude builder — https://www.anthropic.com/news/contextual-retrieval

---

## 2. The founding research — GEO (your anchor citation)

If you cite one thing, cite this. It is the first peer-reviewed academic framework for the field.

- **The paper:** Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande — *"GEO: Generative Engine Optimization."* Presented at ACM SIGKDD (KDD) 2024.
  - arXiv (full PDF): **https://arxiv.org/abs/2311.09735**
  - Princeton publication record: **https://collaborate.princeton.edu/en/publications/geo-generative-engine-optimization/**

- **The findings you'll quote most** (all from the GEO study; the summary below is a useful secondary digest):
  - Adding **statistics** improved visibility ~**41%**; adding **quotations** ~**28%**; **citing external sources** improved visibility ~**115%** for lower-ranked content.
  - **Lower-ranked pages (≈ position 5) benefit most**; position-1 pages barely moved. This is the evidence that small players can win in AI search.
  - It introduced **GEO-bench** (10,000 queries) and three metrics: **impression score** (position-weighted share of your source in the answer), **citation recall**, and **citation precision**.
  - Digest with the numbers laid out: **What GEO Research Actually Says** — https://sunilpratapsingh.com/guides/geo/what-research-says-about-generative-engine-optimization
  - Methodology deep-dive: **UltraScout — The Princeton Research That Defined GEO** — https://ultrascout.ai/article/princeton-research-geo-deep-dive

---

## 3. Cross-engine citation behavior — the "native platform" evidence

This is the science under the idea that different people/brands should lean into different platforms. Each AI engine pulls from *different* source platforms, and the divergence is large.

- **The divergence:** Only ~**11%** of domains are cited by both ChatGPT and Perplexity for the same query, and ~**71%** of all cited sources appear on only one platform. Rough source-preference pattern: ChatGPT → Wikipedia, Perplexity → Reddit, Google AI Overviews → YouTube, Claude → blogs.
  - **ZipTie — How Different AI Platforms Cite the Same Source Differently** — https://ziptie.dev/blog/how-different-ai-platforms-cite-the-same-source-differently/

- **Large-scale citation data:**
  - **Profound** analyzed ~30M citations (and a 680M dataset) Aug 2024–June 2025; found ChatGPT concentrates on Wikipedia, while Google AI Overviews and Perplexity lean Reddit — **https://www.tryprofound.com/blog/ai-platform-citation-patterns**
  - **Search Engine Land / Semrush** — AI engines cite Reddit, YouTube, and LinkedIn heavily; platform preferences shift quickly over time — https://searchengineland.com/ai-search-engines-cite-reddit-youtube-and-linkedin-most-study-473138
  - Short summary of the Wikipedia-vs-Reddit split: **Search Engine Roundtable** — https://www.seroundtable.com/chatgpt-google-aio-sources-39578.html

- **Passage-level, not page-level (important nuance):** ~**67.8%** of sources cited in Google AI Overviews don't rank in Google's top 10 for that query — because LLMs select passages, not pages.
  - **Surfer — How LLM citations work** — https://surferseo.com/blog/llm-citations/

---

## 4. The contextual nuance — your trust differentiator

The "Reddit dominates everything" headline is only half true, and saying so out loud is what separates you from the hype sellers.

- For **objective/transactional** queries (pricing, specs, availability), brand-controlled sources dominate — one analysis found first-party sites and listings accounted for ~**86%** of citations, with Reddit dropping to ~**2%** once intent and location were considered. Community platforms win **opinion/discovery** queries; brand-controlled sources win **factual** ones.
  - Documented in the Surfer piece above (citing the Yext analysis): https://surferseo.com/blog/llm-citations/

**Teaching takeaway:** AI visibility is *contextual* (depends on query type) and *non-static* (shifts over time). Never promise certainty.

---

## 5. The local / entity layer — Google Business Profile

A concrete, verifiable rule set that matters for your local foothills buyers.

- **Eligibility (official):** Only businesses that make face-to-face contact with customers qualify. A purely online business with no location customers can visit — and where you don't visit them — is **not eligible**.
  - **Google Business Profile Help — eligibility** — https://support.google.com/business/answer/7039811
- **The loophole:** Service-area businesses (you travel to customers, or meet at neutral locations) **do** qualify and can hide the address. Virtual offices / PO boxes / unstaffed co-working addresses do **not** qualify.
  - **Google — Guidelines for representing your business** — https://support.google.com/business/answer/3038177

---

## 6. The market landscape — who you're up against

Context for positioning, pricing, and "where competitors fall short."

- **The money & the leader:** The AI-visibility tools market raised $300M+ between summer 2025 and spring 2026; Profound leads at a ~$1B valuation with Fortune 500 clients.
  - **Surmado — Best AI Visibility Tools 2026** — https://www.surmado.com/blog/best-ai-visibility-tools-2026
- **Tool pricing tiers** (these are *measurement dashboards*, not done-for-you services): entry ~$29/mo (Otterly), mid ~€89–€199/mo (Peec), enterprise $399–$1,500+/mo (Profound).
  - **Alhena — AI Brand Visibility Tracking Tools** — https://alhena.ai/blog/ai-brand-visibility-tracking-tools/
  - **Averi — Honest tracker review** — https://www.averi.ai/how-to/ai-search-visibility-trackers-2026-honest-tool-review
  - **ZipTie — Best AI Visibility Tools** — https://ziptie.dev/blog/best-ai-visibility-tools-for-brands/
- **What the tools already do** (so you don't claim it as differentiation): e.g., Otterly does domain/URL audits across 25+ factors plus a Brand Visibility Index across six platforms.
  - **Insites — 8 best GEO auditing tools** — https://insites.com/the-8-best-ai-visibility-and-geo-auditing-tools-for-digital-marketing-agencies
- **Service / agency pricing** (your actual category): GEO-as-a-service retainers run ~$500–$2,000/mo (small) and $2,000–$10,000/mo (independent engagement). AI-SEO agencies: small/local ~$1,000–$5,000/mo; be wary of sub-$1,000 "thin automated" offers.
  - **Visiblie — Offer GEO as a Service** — https://www.visiblie.com/blog/ai-visibility-for-agencies
  - **Searchbloom — Best AI SEO companies + pricing** — https://www.searchbloom.com/strategy/best-ai-seo-agency-companies-services-usa/

**Where they fall short (your opening):** the dashboards measure but don't remediate; the agencies are generalists who speak marketing-jargon, focus on the website, and have no niche or trust anchor. Translation + remediation + niche trust is the gap.

---

## 7. The "go deep" shortlist

If you only have time to read four things in full:
1. The GEO paper — https://arxiv.org/abs/2311.09735
2. Anthropic, Contextual Retrieval — https://www.anthropic.com/news/contextual-retrieval
3. Profound's citation-patterns study — https://www.tryprofound.com/blog/ai-platform-citation-patterns
4. Google's GBP eligibility page — https://support.google.com/business/answer/7039811

---

*Sources are current as of May 2026. This is a fast-moving field — platform behaviors and tool pricing shift, so re-verify figures before publishing them, and date every claim you make.*
