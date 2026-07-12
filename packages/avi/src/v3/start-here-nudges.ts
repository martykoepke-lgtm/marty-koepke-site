/**
 * "Start here" nudges for the free readiness report.
 *
 * Deterministic lookup — one nudge per driver, keyed on the score band
 * (weak / strong) and, for AI Readability, on the actual crawler signals
 * (which schemas are present).
 *
 * Voice rules for this file:
 *   - Written for any small-to-medium business owner. Not consultants,
 *     not healthcare, not any single archetype. Coaches, SaaS founders,
 *     agencies, retail owners, service businesses.
 *   - Diagnose first, then a specific next step.
 *   - Plain English. Name schema by its formal name so the reader can
 *     hand it to a web person or Google it — but wrap it in normal words.
 *   - Where the mechanism is a real "aha," include one clause explaining
 *     why the fix works. No fabricated statistics.
 *
 * Shown on both the on-screen /scan result and the tokenized report so
 * the customer sees identical guidance in both surfaces.
 */

import type { V3ReadinessDriverId } from './types';

const STRONG_THRESHOLD = 3.0;

/** Minimal crawler-signal shape this module reads. */
export interface StartHereCrawlerSignals {
  organizationSchemaPresent?: boolean;
  personSchemaPresent?: boolean;
  faqSchemaPresent?: boolean;
  serviceSchemaPresent?: boolean;
  llmsTxtPresent?: boolean;
  robotsTxtPresent?: boolean;
}

/**
 * Return the "Start here" nudge for a single driver.
 *
 * Business rules:
 *   - Every driver returns a nudge — even 4.5s (there's always something
 *     to sharpen).
 *   - Score <= 3.0 → weak-band nudge (fix what's missing).
 *   - Score  > 3.0 → strong-band nudge (sharpen what's there).
 *   - AI Readability specifically branches on the crawler signal set:
 *     the nudge names the next-most-impactful thing to add.
 */
export function getStartHereNudge(
  driverId: V3ReadinessDriverId,
  score: number | null,
  crawler?: StartHereCrawlerSignals | null
): string {
  const s = typeof score === 'number' ? score : 0;
  const isStrong = s > STRONG_THRESHOLD;

  switch (driverId) {
    case 'business_clarity':
      return isStrong
        ? "Your positioning is clear — good. Tighten it further: make sure the same one-sentence description appears verbatim in your homepage hero, your page title, the description that shows up in Google search results, and the 'about' details your site sends to search engines. AI systems cross-reference these; when they match, extraction confidence goes up."
        : "Your homepage tells the whole story, but AI needs one clear sentence at the top. Add one line to your hero: what you do, who you help, and when you're the right fit. Then use that same sentence in your page title, the description that shows up in Google search results, and the 'about' details your site sends to search engines.";

    case 'source_support':
      return isStrong
        ? "You've got some evidence in place — good. Now pick the three claims you most want AI to repeat and make sure each one has a specific proof sitting next to it — a screenshot, a testimonial with a real name, a review count, a certification, or a source link. AI weighs claims by the evidence next to them, not by how confidently they're worded."
        : "Your most important claims don't have proof sitting next to them. Pick the three claims you most want AI to repeat — like '20 years in business,' 'family-owned since 1998,' or 'trusted by 500 local customers' — and put a specific proof inside the same section as the claim: a photo, a testimonial, a certification, a review count, or a link to the source.";

    case 'ai_readability':
      return aiReadabilityNudge(crawler);

    case 'distinctive_point_of_view':
      return isStrong
        ? "You have distinctive language on the page — good. Sharpen it: give what you do a memorable name — a signature approach, a promise, a specialty — and use that same name consistently on your homepage, About, and service pages. AI systems preserve distinctive language when it's repeated across pages; they flatten it when it appears once."
        : "Nothing on your site tells AI why to recommend you over the next business offering the same service. Name what makes you different — a specific approach, a promise you keep, a niche you own, or a way you work that others don't — and say why it matters to the customer.";

    case 'recommendation_fit':
      return isStrong
        ? "You have some fit signals on the page — good. Sharpen them by adding four short micro-sections on your service page: 'Best for,' 'Common situations we see,' 'Not a fit for,' and 'Choose us when.' The clearer the conditions, the better AI matches you to the right buyers — and the fewer wrong-fit inquiries land in your inbox."
        : "Your site doesn't tell AI when you're the right recommendation or when you're not. Add a short 'Best for' section on your service page — the kinds of customers you serve, the situations you're built for, the jobs you specialize in — and a matching 'Not a fit for' line. AI trusts businesses that draw their own boundaries; sites that name their limits get recommended more accurately, not less.";
  }
}

/**
 * AI Readability branches on the actual schemas the crawler found.
 * We name the single next-most-impactful gap so the customer knows exactly
 * where to start.
 */
function aiReadabilityNudge(crawler?: StartHereCrawlerSignals | null): string {
  const faq = !!crawler?.faqSchemaPresent;
  const service = !!crawler?.serviceSchemaPresent;
  const llms = !!crawler?.llmsTxtPresent;

  if (!faq) {
    return "Your site doesn't have an FAQ section that AI can read as structured data. Add a Frequently Asked Questions section covering the 5–8 questions people ask before hiring you or buying from you — and mark it up as 'FAQPage schema.' Generative models pull Q&A blocks directly from marked-up FAQs, which is why it's the single highest-leverage schema change. If you use Squarespace, Wix, Shopify, or WordPress, your platform has a plugin or built-in setting for this.";
  }
  if (!service) {
    return "Your FAQ schema is present — good. Next, add 'Service schema' to your primary offer page with an Offer block naming the price. Service schema is what AI reads to decide whether your offer matches a buyer's search intent — no schema, and AI has to infer from body copy, which is noisier and less reliable.";
  }
  if (!llms) {
    return "Your core schemas are in place — good. Now drop a plain-text file called `llms.txt` at the root of your domain listing your key pages, in the order you want AI to prioritize them. It's the AI-specific equivalent of a sitemap: it tells AI crawlers which pages you want them reading first.";
  }
  return "Your core structure is in place — Organization, Person, FAQPage, Service schemas, plus `llms.txt`. The next-highest-leverage move: check that each schema's content actually matches what's visible on the page. Mismatches confuse AI more than missing structure does — AI treats a contradiction between schema and visible copy as a signal that the schema might be wrong.";
}
