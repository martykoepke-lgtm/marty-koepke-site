/**
 * Inngest client — background job queue for long-running tasks.
 *
 * The paid Daizie AI Visibility Assessment runs 8 queries × 4 engines =
 * 32 live AI responses, plus corroboration + claim verification. A full
 * run takes 8–15 minutes, which is longer than any Vercel serverless
 * function can hold (Pro caps at 300s). Inngest handles the audit run
 * as a background function with no request-cycle timeout.
 *
 * Events dispatched by the console reach this client, which forwards
 * them to Inngest's platform (or to the local dev server during
 * development). The webhook route at /api/inngest receives Inngest's
 * callback when it's time to actually execute a function.
 *
 * Env vars:
 *   INNGEST_EVENT_KEY   — for dispatching events from server actions
 *   INNGEST_SIGNING_KEY — for validating incoming webhook signatures
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "daizie-console",
  name: "Daizie Operator Console",
});

/** All event names + their payload shapes. Adding a new event? Add its
 *  type here so dispatchers and handlers stay in sync. */
export type Events = {
  "avi/audit.run.requested": {
    data: AuditRunRequested;
  };
};

export type AuditRunRequested = {
  /** The subject UUID from the `subjects` table. */
  subjectId: string;
  /** Snapshot of the subject metadata as submitted from the run form.
   *  Overrides anything currently on the subject row so a one-off tweak
   *  on the form doesn't require editing the subject first. */
  subject: {
    canonical_name: string;
    aliases: string[];
    industry: string;
    subject_type: "company" | "personal_brand";
    url: string;
    location?: string;
    buyer_type?: string;
    problem?: string;
    competitors: Array<{
      canonical_name: string;
      aliases: string[];
      url?: string;
    }>;
    known_differentiation_terms: string[];
  };
  /** "free" for free scan, "audit" for paid V3 assessment. */
  mode: "free" | "audit";
  /** For the paid path, how many buyer-question queries to run. */
  queryCount: number;
};
