/**
 * The Resend (transactional email) wrapper.
 *
 * Every email sent from the AVI system goes through `sendEmail()` here.
 * Like lib/avi/llm.ts, this is the single point where the underlying
 * SDK gets called — direct imports of `resend` outside this file are
 * banned by the ESLint rule (see task #24).
 *
 * Logs every send attempt (success or failure) to api_calls with
 * provider='resend'. Cost is hardcoded to 0 because Resend's free tier
 * covers 3,000 emails/month — well above projected volume. If you ever
 * cross the free tier, update `RESEND_COST_PER_EMAIL_USD` below and
 * the monitor will start tracking real cost.
 *
 * Read AVI_OPS_MONITOR.md §4.4 for the schema, §5 for the tool list.
 */

import { Resend } from "resend";
import { logApiCall, type ApiCallStatus } from "./logging";

let client: Resend | null = null;

function getClient(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "Missing RESEND_API_KEY — add it to .env.local (server-side only)."
    );
  }
  client = new Resend(key);
  return client;
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ??
  "Marty Koepke <hello@martykoepke.com>";

/**
 * Per-email cost in USD. Currently $0 because Resend's free tier covers
 * 3,000 emails/month and projected volume is ~5–20/month. If you ever
 * upgrade to a paid plan, set this to the per-email rate.
 */
const RESEND_COST_PER_EMAIL_USD = 0;

/**
 * Context attached to every logged Resend send.
 */
export type EmailCallContext = {
  endpoint:
    | "monitor_weekly_summary"
    | "monitor_alert"
    | "free_scan_report_delivery"
    | "transactional_email"
    | (string & {});
  submissionId?: string | null;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
};

export type SendEmailResult = {
  ok: boolean;
  /** Resend's message id on success. */
  id?: string;
  error?: string;
};

/**
 * Send one email via Resend. Always logs, never throws.
 *
 * Failure modes the wrapper handles:
 *   - RESEND_API_KEY missing → error response, logged with status="error"
 *   - Resend returns a typed error (e.g. invalid email, blocked recipient)
 *     → error response, logged
 *   - Network exception → caught, logged
 *
 * The caller checks `.ok` and decides what to do — for transactional
 * mail to the customer, that usually means writing a follow-up flag to
 * the submissions row and retrying out-of-band.
 */
export async function sendEmail(
  input: SendEmailInput,
  context: EmailCallContext
): Promise<SendEmailResult> {
  const startedAt = Date.now();
  let status: ApiCallStatus = "success";
  let errorMessage: string | null = null;
  let resendId: string | undefined;

  try {
    const resend = getClient();
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    });

    if (error) {
      status = "error";
      errorMessage = error.message ?? String(error);
    } else {
      resendId = data?.id;
    }
  } catch (e) {
    status = "error";
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  // Always log, success or failure.
  await logApiCall({
    provider: "resend",
    model: null,
    endpoint: context.endpoint,
    submission_id: context.submissionId ?? null,
    tokens_input: null,
    tokens_output: null,
    cost_estimated_usd: status === "success" ? RESEND_COST_PER_EMAIL_USD : 0,
    request_id: resendId ?? null,
    duration_ms: Date.now() - startedAt,
    status,
    error_message: errorMessage,
    ip: null,
  });

  return {
    ok: status === "success",
    id: resendId,
    error: errorMessage ?? undefined,
  };
}
