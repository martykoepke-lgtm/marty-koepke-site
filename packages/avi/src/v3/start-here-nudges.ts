/**
 * "Start here" nudges for the free readiness report.
 *
 * Deterministic lookup — one nudge per driver, keyed on the score band
 * (weak / strong) and, for AI Readability, on the actual crawler signals
 * (which schemas are present). Written in Marty's voice: diagnose first,
 * name a specific next step. Plain English. Never generic.
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
        ? "Your positioning is clear — good. Tighten it further: make sure the same sentence appears verbatim in your homepage hero, page title, meta description, and Organization schema description so AI has one canonical version to extract."
        : "Your homepage tells the whole story, but AI needs one clear sentence at the top. Add a positioning line to your hero: what you do, who you help, when you're the right fit. Then repeat the same wording in your page title, meta description, and Organization schema description.";

    case 'source_support':
      return isStrong
        ? "You've got some evidence in place — good. Now audit the three claims you most want AI to repeat and make sure each has a source link, quote, or named example within a couple of paragraphs, so AI reads them together instead of guessing."
        : "Your important claims don't have evidence sitting next to them. Pick your three most-repeated claims — like '20 years of informatics' or 'four engines tested' — and put a specific proof inside the same section as the claim: a screenshot, a testimonial, a credential, or a source link.";

    case 'ai_readability':
      return aiReadabilityNudge(crawler);

    case 'distinctive_point_of_view':
      return isStrong
        ? "You have distinctive language on the page — good. Sharpen it by giving your method a memorable label and using that same name consistently across your homepage, About, and service pages so AI can preserve it verbatim."
        : "Nothing on your site tells AI why to recommend you over the next consultant doing similar work. Name your method — a framework, a principle you follow, or a distinctive tradeoff — and explain what makes it produce a better outcome for the buyer.";

    case 'recommendation_fit':
      return isStrong
        ? "You have some fit signals on the page — good. Sharpen them by adding four explicit micro-sections: 'Best for,' 'Common triggers,' 'Not a fit for,' and 'Choose this when.' The clearer the conditions, the better AI targets the right buyers to you."
        : "Your site doesn't tell AI when you're the right recommendation or when you're not. Add a short 'Best for / Not a fit for' section on your service page. Name industries, company stages, or situations that signal fit — and say clearly when you're not the right fit.";
  }
}

/**
 * AI Readability branches on the actual schemas the crawler found.
 * We name the single next-most-impactful gap so the customer knows exactly
 * where to start, rather than a generic "add more schema" note.
 */
function aiReadabilityNudge(crawler?: StartHereCrawlerSignals | null): string {
  const faq = !!crawler?.faqSchemaPresent;
  const service = !!crawler?.serviceSchemaPresent;
  const llms = !!crawler?.llmsTxtPresent;

  if (!faq) {
    return "Your site doesn't have FAQPage schema. Add a JSON-LD FAQPage block to your FAQ section covering the top 5–8 questions buyers ask before hiring you. It's the highest-leverage schema for AI answers.";
  }
  if (!service) {
    return "Your FAQ schema is present — good. Now add Service schema to your primary offer page with an Offer entry naming the price. That's the second-most-important schema for AI recommendations.";
  }
  if (!llms) {
    return "Your core schemas are in place — good. Drop a plain-text `llms.txt` at the root of your domain listing your key pages so AI crawlers know which pages you want them reading first.";
  }
  return "Your core structure is in place — Organization, Person, FAQPage, Service schemas plus `llms.txt`. Now check that each schema's content actually matches what's visible on the page. Mismatch confuses AI more than missing structure does.";
}
