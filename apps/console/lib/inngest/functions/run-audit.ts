/**
 * Inngest function — runs the paid Daizie AI Visibility Assessment.
 *
 * Triggered by the `avi/audit.run.requested` event dispatched from the
 * console's run-form server action. Executes runAuditV3 + persistAuditV3
 * end-to-end with no serverless timeout constraint (Inngest gives us
 * up to 15 min on free, unlimited on paid).
 *
 * On success: the audit row is persisted; the console's /audits list
 * picks it up on next page load. Marty's subject detail page shows a
 * "running" banner while an audit is in flight; refreshing reveals the
 * completed audit.
 */

import {
  persistAudit,
  persistAuditV3,
  runAudit,
  runAuditV3,
} from "@practical-informatics/avi";
import { inngest } from "../client";

export const runAuditFunction = inngest.createFunction(
  {
    id: "avi-run-audit",
    name: "Run Daizie AI Visibility Assessment",
    triggers: [{ event: "avi/audit.run.requested" }],
    // Cap concurrency at 2 so we don't accidentally rack up engine
    // spend if the queue backs up. Adjust when the paid flow ships.
    concurrency: { limit: 2 },
    retries: 0,
  },
  async ({ event, step, logger }: {
    event: { data: import("../client").AuditRunRequested };
    step: { run<T>(id: string, fn: () => Promise<T>): Promise<T> };
    logger: { info: (msg: string) => void };
  }) => {
    const { subjectId, subject, mode, queryCount } = event.data;

    logger.info(
      `[inngest/run-audit] starting subject=${subject.canonical_name} mode=${mode} queryCount=${queryCount}`
    );

    if (mode === "audit") {
      const audit = await step.run("run-audit-v3", () =>
        runAuditV3(subject, { mode: "audit", queryCount })
      );

      logger.info(
        `[inngest/run-audit] runAuditV3 complete audit_id=${audit.audit_id} tier=${audit.public_scores.tier} errors=${audit.errors.length}`
      );

      const persist = await step.run("persist-audit-v3", () =>
        persistAuditV3(audit)
      );

      logger.info(
        `[inngest/run-audit] persistAuditV3 ok=${persist.ok} steps=${persist.steps_persisted.join(",")} errors=${persist.errors.length}`
      );

      return {
        subjectId,
        auditId: audit.audit_id,
        tier: audit.public_scores.tier,
        persisted: persist.ok,
      };
    }

    // Free path — mirror of the console's older synchronous behavior,
    // used when a queued free scan is requested from the console rather
    // than from the marketing /api/scan handler.
    const audit = await step.run("run-audit", () =>
      runAudit(subject, { mode: "free" })
    );

    logger.info(
      `[inngest/run-audit] runAudit(free) complete audit_id=${audit.audit_id} composite=${audit.composite.composite} errors=${audit.errors.length}`
    );

    const persist = await step.run("persist-audit", () => persistAudit(audit));

    logger.info(
      `[inngest/run-audit] persistAudit ok=${persist.ok} steps=${persist.steps_persisted.join(",")} errors=${persist.errors.length}`
    );

    return {
      subjectId,
      auditId: audit.audit_id,
      composite: audit.composite.composite,
      persisted: persist.ok,
    };
  }
);
