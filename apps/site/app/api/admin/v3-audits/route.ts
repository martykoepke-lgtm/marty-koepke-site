import { NextResponse, type NextRequest } from "next/server";
import {
  persistAuditV3,
  runAuditV3,
  type RunAuditV3Options,
  type Subject,
} from "@practical-informatics/avi";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  mode?: "snapshot" | "audit" | "monitoring";
  queryCount?: number;
  subject?: Partial<Subject> & {
    competitors?: CompetitorInput[];
  };
};

type CompetitorInput = { canonical_name?: string; aliases?: string[] } | string;

export async function POST(req: NextRequest) {
  const auth = authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const subjectResult = normalizeSubject(body.subject);
  if (!subjectResult.ok) {
    return NextResponse.json(
      { ok: false, error: subjectResult.error, field: subjectResult.field },
      { status: 400 }
    );
  }

  const mode = body.mode ?? "snapshot";
  const options: RunAuditV3Options = {
    mode,
    queryCount: body.queryCount ?? 4,
  };

  try {
    const audit = await runAuditV3(subjectResult.subject, options);
    const persisted = await persistAuditV3(audit);

    if (!persisted.ok) {
      console.error("[/api/admin/v3-audits] persistence failed", persisted.errors);
      return NextResponse.json(
        {
          ok: false,
          error: "V3 audit ran, but persistence failed.",
          auditId: audit.audit_id,
          scores: audit.public_scores,
          persist: persisted,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      auditId: audit.audit_id,
      subjectId: persisted.subject_id,
      mode: audit.mode,
      scores: audit.public_scores,
      outcomes: audit.outcomes,
      counts: {
        engineResponses: audit.engine_responses.length,
        extractions: audit.extracted.length,
        claims: audit.claims.length,
        sourceEvidence: audit.source_evidence.length,
        claimVerifications: audit.claim_verifications.length,
        errors: audit.errors.length,
      },
      reportPath: `/admin/v3-audits/${audit.audit_id}?secret=${auth.secret}`,
      persist: {
        steps: persisted.steps_persisted,
        errors: persisted.errors,
      },
    });
  } catch (e) {
    console.error("[/api/admin/v3-audits] fatal", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "V3 audit failed.",
      },
      { status: 500 }
    );
  }
}

function authorize(req: NextRequest):
  | { ok: true; secret: string }
  | { ok: false; status: number; error: string } {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return { ok: false, status: 500, error: "CRON_SECRET is not configured." };
  }

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerSecret = req.headers.get("x-admin-secret")?.trim();
  const querySecret = req.nextUrl.searchParams.get("secret")?.trim();
  const provided = bearer || headerSecret || querySecret;

  if (provided !== expected) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true, secret: expected };
}

function normalizeSubject(raw: Body["subject"]):
  | { ok: true; subject: Subject }
  | { ok: false; error: string; field: string } {
  if (!raw) return { ok: false, error: "subject is required", field: "subject" };
  if (!isNonEmpty(raw.canonical_name)) {
    return { ok: false, error: "subject.canonical_name is required", field: "canonical_name" };
  }
  if (!isNonEmpty(raw.url) || !isHttpUrl(raw.url)) {
    return { ok: false, error: "subject.url must be a valid http(s) URL", field: "url" };
  }
  if (!isNonEmpty(raw.industry)) {
    return { ok: false, error: "subject.industry is required", field: "industry" };
  }
  if (raw.subject_type !== "company" && raw.subject_type !== "personal_brand") {
    return {
      ok: false,
      error: "subject.subject_type must be company or personal_brand",
      field: "subject_type",
    };
  }

  return {
    ok: true,
    subject: {
      canonical_name: raw.canonical_name.trim(),
      aliases: normalizeStringArray(raw.aliases),
      industry: raw.industry.trim(),
      subject_type: raw.subject_type,
      url: normalizeUrl(raw.url),
      location: raw.location?.trim() || undefined,
      buyer_type: raw.buyer_type?.trim() || undefined,
      problem: raw.problem?.trim() || undefined,
      competitors: normalizeCompetitors(raw.competitors),
      known_differentiation_terms: normalizeStringArray(raw.known_differentiation_terms),
    },
  };
}

function normalizeCompetitors(input: CompetitorInput[] | undefined) {
  if (!Array.isArray(input)) return [];
  return input
    .map((competitor) => {
      if (typeof competitor === "string") {
        return competitor.trim() ? { canonical_name: competitor.trim(), aliases: [] } : null;
      }
      const name = competitor.canonical_name?.trim();
      if (!name) return null;
      return { canonical_name: name, aliases: normalizeStringArray(competitor.aliases) };
    })
    .filter((competitor): competitor is { canonical_name: string; aliases: string[] } => competitor !== null);
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value.trim() : `https://${value.trim()}`;
}
