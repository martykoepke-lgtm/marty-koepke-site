/**
 * HTML report renderer — single-page report from an Audit.
 * No JSON in the customer's face. Clean, readable, viewable in any browser.
 *
 * Output structure (per AVI_OPERATING_STANDARD.md §7 and rubric §B):
 *   1. Headline — composite, tier, one-sentence read
 *   2. Differentiation profile — D4 + named candidates
 *   3. Readiness profile — D1, D2, D3, D6 with findings
 *   4. Visibility outcome — D5 sub-metrics (paid only)
 *   5. Top fixes
 *   6. Methodology and limits
 */

import type { Audit, DimensionId } from './types';

const PALETTE = {
  bg: '#FAF6EE',
  bgDim: '#F2EBDC',
  forest: '#1F3A2E',
  forestDark: '#16291F',
  gold: '#C9A961',
  goldDark: '#A8893F',
  text: '#2C2A26',
  moss: '#5A6B5A',
  tan: '#D8CCB4',
};

const DIMENSION_NAMES: Record<DimensionId, string> = {
  D1: 'Entity Clarity & Consistency',
  D2: 'Third-Party Corroboration',
  D3: 'Machine-Readability & Structure',
  D4: 'Differentiation from Consensus',
  D6: 'Platform-Native Fit',
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  Invisible: 'AI engines do not surface this subject when buyers ask.',
  Overlooked: 'AI engines rarely surface this subject; competitors lead.',
  Emerging: 'Some visibility, mostly indirect; clear room to grow.',
  Discoverable: 'Solid mid-pack presence; consistently mentioned across queries.',
  'Agent-Ready': 'Dominant presence; the engines treat this as a primary source.',
};

export function renderReport(audit: Audit): string {
  const s = audit.subject;
  const c = audit.composite;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>AVI Report — ${escapeHtml(s.canonical_name)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${baseStyles()}</style>
</head>
<body>
<main>
  ${headline(audit)}
  ${differentiationProfile(audit)}
  ${readinessProfile(audit)}
  ${audit.mode === 'paid' ? visibilityOutcomeSection(audit) : freeUpsellSection()}
  ${topFixes(audit)}
  ${methodologyAndLimits(audit)}
</main>
</body>
</html>`;
}

function baseStyles(): string {
  return `
* { box-sizing: border-box; }
html { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: ${PALETTE.text}; }
body { margin: 0; background: ${PALETTE.bg}; }
main { max-width: 880px; margin: 0 auto; padding: 60px 32px; line-height: 1.6; }
h1, h2, h3 { color: ${PALETTE.forest}; font-family: Georgia, "Times New Roman", serif; font-weight: 400; line-height: 1.2; }
h1 { font-size: 2.6rem; margin: 0 0 12px; }
h2 { font-size: 1.6rem; margin: 56px 0 16px; padding-bottom: 8px; border-bottom: 1px solid ${PALETTE.tan}; }
h3 { font-size: 1.2rem; margin: 32px 0 12px; }
p { margin: 0 0 16px; }
.subhead { color: ${PALETTE.moss}; font-size: 1.1rem; margin: 0 0 32px; }
.tier-pill { display: inline-block; padding: 6px 16px; background: ${PALETTE.gold}; color: ${PALETTE.forestDark}; border-radius: 999px; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.02em; }
.composite { font-size: 4rem; color: ${PALETTE.forest}; font-family: Georgia, serif; line-height: 1; margin: 24px 0 0; }
.composite-label { color: ${PALETTE.moss}; font-size: 0.9rem; letter-spacing: 0.08em; text-transform: uppercase; }
.dim-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.dim-table th, .dim-table td { text-align: left; padding: 12px 12px 12px 0; border-bottom: 1px solid ${PALETTE.tan}; vertical-align: top; }
.dim-table th { color: ${PALETTE.moss}; font-weight: 500; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
.bar { display: inline-block; width: 100%; max-width: 240px; height: 12px; background: ${PALETTE.bgDim}; border-radius: 6px; overflow: hidden; vertical-align: middle; }
.bar-fill { display: block; height: 100%; background: ${PALETTE.forest}; }
.bar-fill.high { background: ${PALETTE.forest}; }
.bar-fill.mid { background: ${PALETTE.goldDark}; }
.bar-fill.low { background: ${PALETTE.gold}; opacity: 0.6; }
.score-cell { white-space: nowrap; font-weight: 600; color: ${PALETTE.forest}; }
.fix { background: ${PALETTE.bgDim}; padding: 20px 24px; margin: 12px 0; border-left: 4px solid ${PALETTE.gold}; border-radius: 4px; }
.fix h4 { margin: 0 0 8px; color: ${PALETTE.forest}; }
.fix .gap { color: ${PALETTE.moss}; font-size: 0.95rem; margin: 0 0 8px; }
.candidate { padding: 12px 16px; margin: 8px 0; background: ${PALETTE.bg}; border: 1px solid ${PALETTE.tan}; border-radius: 4px; }
.methodology { background: ${PALETTE.bgDim}; padding: 24px; border-radius: 4px; font-size: 0.95rem; }
.methodology dt { font-weight: 600; color: ${PALETTE.forest}; margin-top: 8px; }
.methodology dd { margin: 4px 0 0; }
.limitation { color: ${PALETTE.moss}; font-style: italic; font-size: 0.92rem; padding: 6px 0; }
footer { margin-top: 80px; padding-top: 24px; border-top: 1px solid ${PALETTE.tan}; font-size: 0.85rem; color: ${PALETTE.moss}; }
`;
}

function headline(audit: Audit): string {
  const s = audit.subject;
  const c = audit.composite;
  return `
<section>
  <h1>${escapeHtml(s.canonical_name)}</h1>
  <p class="subhead">${escapeHtml(s.industry)}${s.location ? ' · ' + escapeHtml(s.location) : ''}</p>
  <p class="composite-label">AI Visibility Index</p>
  <p class="composite">${formatNumber(c.composite)} <span style="font-size: 1.2rem; color: ${PALETTE.moss};">/ 100</span></p>
  <p style="margin: 16px 0 8px;"><span class="tier-pill">${escapeHtml(c.tier)}</span></p>
  <p>${escapeHtml(TIER_DESCRIPTIONS[c.tier] ?? '')}</p>
</section>`;
}

function differentiationProfile(audit: Audit): string {
  const d4 = audit.driver_scores.find((d) => d.dimension_id === 'D4');
  const candidates = audit.recommendations.differentiation_candidates_observed ?? [];
  const suggestions = audit.recommendations.differentiation_candidates_suggested ?? [];
  return `
<section>
  <h2>Your differentiation profile</h2>
  <p>This is the question that drives AI selection: what does this subject know, have, or say that the category's consensus does not? D4 measures it directly.</p>
  ${dimensionRow(d4)}
  ${
    candidates.length > 0
      ? `<h3>Differentiation candidates we observed</h3>
${candidates.map((c) => `<div class="candidate"><strong>${escapeHtml(c.name)}</strong><br/>${escapeHtml(c.description)}</div>`).join('')}`
      : ''
  }
  ${
    suggestions.length > 0
      ? `<h3>Questions to ask yourself</h3>
${suggestions.map((s) => `<div class="candidate"><strong>${escapeHtml(s.question)}</strong><br/><em>${escapeHtml(s.rationale)}</em></div>`).join('')}`
      : ''
  }
</section>`;
}

function readinessProfile(audit: Audit): string {
  const others = audit.driver_scores.filter((d) => d.dimension_id !== 'D4');
  return `
<section>
  <h2>Your readiness profile</h2>
  <p>Five drivers measure whether you are <em>built</em> to be found. D4 leads above; the rest follow here.</p>
  <table class="dim-table">
    <thead><tr><th>Dimension</th><th>Score</th><th>Strength</th><th>Finding</th></tr></thead>
    <tbody>
      ${others.map(dimensionTableRow).join('')}
    </tbody>
  </table>
</section>`;
}

function dimensionRow(score: any): string {
  if (!score) return '';
  const name = DIMENSION_NAMES[score.dimension_id as DimensionId];
  const isInsufficient = score.band === 'insufficient_evidence';
  const band = isInsufficient ? '—' : String(score.band);
  const pct = isInsufficient ? 0 : (Number(score.band) / 5) * 100;
  const cls = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  return `
<div style="background: ${PALETTE.bgDim}; padding: 24px; border-radius: 4px; margin: 12px 0 24px;">
  <p style="display: flex; align-items: center; gap: 16px; margin: 0 0 12px;">
    <strong style="color: ${PALETTE.forest}; font-size: 1.1rem;">${escapeHtml(name)}</strong>
    <span class="score-cell">${band} / 5</span>
  </p>
  <span class="bar"><span class="bar-fill ${cls}" style="width: ${pct}%;"></span></span>
  <p style="margin: 16px 0 0;">${escapeHtml(score.justification ?? '')}</p>
</div>`;
}

function dimensionTableRow(score: any): string {
  const name = DIMENSION_NAMES[score.dimension_id as DimensionId];
  const isInsufficient = score.band === 'insufficient_evidence';
  const band = isInsufficient ? '—' : String(score.band);
  const pct = isInsufficient ? 0 : (Number(score.band) / 5) * 100;
  const cls = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  return `
<tr>
  <td><strong>${escapeHtml(name)}</strong><br/><small style="color: ${PALETTE.moss};">${score.dimension_id}</small></td>
  <td class="score-cell">${band} / 5</td>
  <td><span class="bar"><span class="bar-fill ${cls}" style="width: ${pct}%;"></span></span></td>
  <td>${escapeHtml(score.justification ?? '')}</td>
</tr>`;
}

function visibilityOutcomeSection(audit: Audit): string {
  if (!audit.visibility_outcome) return '';
  const v = audit.visibility_outcome;
  const vis = (v.composite * 100).toFixed(1);
  return `
<section>
  <h2>Your visibility outcome</h2>
  <p>What the engines <em>actually</em> said when buyers asked. ${audit.protocol.total_calls} query calls across ${audit.protocol.engines.length} engines.</p>
  <table class="dim-table">
    <thead><tr><th>Sub-metric</th><th>Score</th><th>Strength</th></tr></thead>
    <tbody>
      ${subMetricRow('Presence', v.presence, 'Mentioned at all')}
      ${subMetricRow('Citation', v.citation, 'Mentioned with a verified URL')}
      ${subMetricRow('Share-of-Voice', v.share_of_voice, 'Mentioned vs. competitors')}
      ${subMetricRow('Prominence', v.prominence, 'Position in the response')}
      <tr><td><strong>Visibility composite</strong></td><td class="score-cell">${vis} / 100</td><td></td></tr>
    </tbody>
  </table>
</section>`;
}

function subMetricRow(name: string, value: number, hint: string): string {
  const pct = value * 100;
  const cls = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  return `<tr><td><strong>${escapeHtml(name)}</strong><br/><small style="color: ${PALETTE.moss};">${escapeHtml(hint)}</small></td><td class="score-cell">${pct.toFixed(1)}%</td><td><span class="bar"><span class="bar-fill ${cls}" style="width: ${pct}%;"></span></span></td></tr>`;
}

function freeUpsellSection(): string {
  return `
<section>
  <h2>What this free check did NOT measure</h2>
  <p>This Readiness check evaluates whether the subject is <em>built</em> to be found by AI engines. It does not measure whether the subject is <em>actually</em> being found, because that requires live cross-engine queries.</p>
  <p>The paid AI Visibility Index runs live queries across ChatGPT, Claude, Perplexity, and Gemini, measures Presence, Citation, Share-of-Voice, and Prominence, and produces the headline visibility number.</p>
</section>`;
}

function topFixes(audit: Audit): string {
  const fixes = audit.recommendations.fixes ?? [];
  return `
<section>
  <h2>Top ${fixes.length} ${fixes.length === 1 ? 'fix' : 'fixes'}</h2>
  <p>Ranked by impact-per-hour. Each fix addresses a specific scored gap and surfaces a specific differentiation candidate. Framed as <em>what to do differently</em>, not what to do more of.</p>
  ${
    audit.recommendations.rank_aware_note
      ? `<p class="limitation">Note: ${escapeHtml(audit.recommendations.rank_aware_note)}</p>`
      : ''
  }
  ${fixes.map(fixCard).join('')}
</section>`;
}

function fixCard(fix: any): string {
  return `
<div class="fix">
  <h4>#${fix.rank} · ${escapeHtml(fix.framed_as ?? '')}</h4>
  <p class="gap"><strong>Dimension:</strong> ${fix.dimension_id} · <strong>Impact:</strong> ${fix.impact_estimate}</p>
  <p><strong>The gap:</strong> ${escapeHtml(fix.gap ?? '')}</p>
  <p><strong>What to do:</strong> ${escapeHtml(fix.tactic ?? '')}</p>
  <p style="color: ${PALETTE.moss}; font-size: 0.95rem;"><strong>Why this:</strong> ${escapeHtml(fix.rationale ?? '')}</p>
</div>`;
}

function methodologyAndLimits(audit: Audit): string {
  const errors = audit.errors ?? [];
  return `
<section>
  <h2>Methodology and limits</h2>
  <div class="methodology">
    <dl>
      <dt>Rubric version</dt>
      <dd>${escapeHtml(audit.rubric_version)} — evidence-anchored, citation footnotes in <code>public/AI-Visibility-Index-Rubric-and-Protocol.md</code></dd>
      <dt>Mode</dt>
      <dd>${audit.mode === 'paid' ? 'Paid AI Visibility Index' : 'Free AI Readiness Check'}</dd>
      ${
        audit.mode === 'paid'
          ? `<dt>Query protocol</dt>
      <dd>${audit.protocol.query_grid.length} queries × ${audit.protocol.engines.length} engines × ${audit.protocol.reps_per_pair} rep = ${audit.protocol.total_calls} query calls. Engines: ${audit.protocol.engines.join(', ')}. Query mix: 80/10/10 informational/transactional/navigational per Aggarwal 2024.</dd>`
          : `<dt>Query protocol</dt><dd>None — free Readiness check uses public crawl + corroboration only.</dd>`
      }
      <dt>Judge model</dt>
      <dd>Claude Sonnet, temperature 0, JSON mode, schema-validated output. One LLM call per dimension.</dd>
      <dt>Cross-judge</dt>
      <dd>Not run on this audit. (Cross-judge runs on QA-flagged audits per the operating standard §5.3.)</dd>
    </dl>
    <h3>What this audit does NOT measure</h3>
    <p class="limitation">Deep-session visibility — engines may rerank based on what the user already read. This audit measures cold queries only (per US Patent US20200349181A1).</p>
    <p class="limitation">Exploratory search behavior — per Alexander et al. (ORCAS-I, 2022), 36% of informational queries are exploratory (amorphous user goals) and require session context. Cold-query testing does not measure that fraction.</p>
    <p class="limitation">Information-scent click-through — per Pirolli & Card (1999), users' actual click decisions depend on snippet/metadata quality. This audit measures whether scent signals exist (D3 metadata-scent sub-criterion); it does not measure actual click-through rates from AI surfaces.</p>
    <p class="limitation">Classical Google rank effects of these recommendations are unmeasured (per Aggarwal 2024).</p>
    <p class="limitation">Single rep per query/engine pair: results are a snapshot, not a stable measurement. Engines are nondeterministic.</p>
    <p class="limitation">Query-intent ambiguity — per Alexander et al. and Liu et al., 25–40% of short queries are intrinsically ambiguous without session context; our 4-query test set includes some ambiguous queries (e.g., "Is [SUBJECT] reputable?") whose engine responses may not isolate a single intent cleanly.</p>
    ${errors.length > 0 ? `<h3>Audit-time errors logged</h3>${errors.map((e) => `<p class="limitation">${escapeHtml(e.step)}: ${escapeHtml(e.message)}</p>`).join('')}` : ''}
  </div>
  <footer>
    Audit ID: <code>${escapeHtml(audit.audit_id)}</code> · Generated ${escapeHtml(audit.created_at)} · Marty Koepke
  </footer>
</section>`;
}

/* ------------- Comparison renderer ------------- */

export function renderComparison(audits: Audit[]): string {
  const sorted = [...audits].sort((a, b) => b.composite.composite - a.composite.composite);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>AVI Comparison — ${audits.length} subjects</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${baseStyles()}
.comp-table th { padding: 12px 8px; }
.comp-table td { padding: 12px 8px; vertical-align: top; }
.comp-table tr:nth-child(even) { background: ${PALETTE.bgDim}; }
.dim-cell { text-align: center; min-width: 60px; }
.url-cell { color: ${PALETTE.moss}; font-size: 0.85rem; }
</style>
</head>
<body>
<main>
  <h1>AVI comparison</h1>
  <p class="subhead">${audits.length} subjects · rubric ${escapeHtml(audits[0]?.rubric_version ?? '')}</p>
  <p>Ordered by composite AI Visibility Index score (highest first). Each row links to the full report.</p>
  <table class="dim-table comp-table">
    <thead>
      <tr>
        <th>Subject</th>
        <th>Tier</th>
        <th>Composite</th>
        <th class="dim-cell">D1</th>
        <th class="dim-cell">D2</th>
        <th class="dim-cell">D3</th>
        <th class="dim-cell">D4</th>
        <th class="dim-cell">D6</th>
        ${sorted[0]?.visibility_outcome ? '<th>Visibility</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${sorted.map(comparisonRow).join('')}
    </tbody>
  </table>
  <h2>How to read this</h2>
  <p>D4 (Differentiation from Consensus) carries the highest weight in the rubric (0.30). Subjects scoring low on D4 typically rank lower in the composite even when D1 and D3 are strong. This is the patent mechanism (US20200349181A1) operationalized: engines select sources that add information to the pool, not sources that restate consensus.</p>
  <p>The visibility column shows what each subject's <em>own</em> AI-engine surface looks like. Subjects that sell AI visibility tools but score poorly on visibility themselves are interesting data points.</p>
  <h2>Methodology and limits</h2>
  <p>Same as in each individual report. Each subject was audited under rubric <code>${escapeHtml(audits[0]?.rubric_version ?? '')}</code>. Engines: ChatGPT, Claude (Anthropic), Perplexity, Gemini. Query protocol: 4 queries × 4 engines × 1 rep = 16 calls per subject.</p>
  <footer>Generated by Marty Koepke · ${new Date().toISOString()}</footer>
</main>
</body>
</html>`;
}

function comparisonRow(audit: Audit): string {
  const driverByDim: Record<string, any> = {};
  audit.driver_scores.forEach((d) => (driverByDim[d.dimension_id] = d));
  function band(id: string): string {
    const d = driverByDim[id];
    if (!d) return '—';
    return d.band === 'insufficient_evidence' ? '—' : String(d.band);
  }
  const vis = audit.visibility_outcome ? (audit.visibility_outcome.composite * 100).toFixed(0) : null;
  return `
<tr>
  <td><strong>${escapeHtml(audit.subject.canonical_name)}</strong><br/><span class="url-cell">${escapeHtml(audit.subject.url)}</span></td>
  <td><span class="tier-pill" style="font-size: 0.8rem; padding: 4px 10px;">${escapeHtml(audit.composite.tier)}</span></td>
  <td class="score-cell">${formatNumber(audit.composite.composite)}</td>
  <td class="dim-cell">${band('D1')}</td>
  <td class="dim-cell">${band('D2')}</td>
  <td class="dim-cell">${band('D3')}</td>
  <td class="dim-cell"><strong>${band('D4')}</strong></td>
  <td class="dim-cell">${band('D6')}</td>
  ${vis !== null ? `<td class="score-cell">${vis}</td>` : ''}
</tr>`;
}

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNumber(n: number): string {
  return n.toFixed(1);
}
