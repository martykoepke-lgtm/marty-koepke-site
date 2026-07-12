/**
 * @practical-informatics/avi/client — browser-safe surface.
 *
 * Only pure functions and types live here. No Node-only SDKs (Anthropic,
 * OpenAI, Google GenAI, Supabase, Resend), no server-only modules, no
 * process.env access at module load. Client components import from this
 * subpath so they don't drag the LLM providers into the browser bundle.
 *
 * If you're adding something here, verify its transitive imports never
 * touch a Node-only package.
 */

export { getStartHereNudge } from './v3/start-here-nudges';
export type { StartHereCrawlerSignals } from './v3/start-here-nudges';
export { V3_READINESS_DRIVER_DEFINITIONS } from './v3/rubric';
export type { V3ReadinessDriverId } from './v3/types';
