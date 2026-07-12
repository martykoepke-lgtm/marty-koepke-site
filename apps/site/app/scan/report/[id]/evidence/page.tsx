import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";
import { TokenReportNav } from "../TokenReportNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type SubmissionRow = {
  id: string;
  url: string | null;
  company_name: string | null;
  access_token: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  crawler_output: CrawlerSnapshot | null;
  scoring_output: ScoringSnapshot | null;
  created_at: string;
};

type CrawlerSnapshot = {
  reachable?: boolean;
  title?: string;
  metaDescription?: string;
  organizationSchemaPresent?: boolean;
  personSchemaPresent?: boolean;
  faqSchemaPresent?: boolean;
  serviceSchemaPresent?: boolean;
  llmsTxtPresent?: boolean;
  robotsTxtPresent?: boolean;
  sameAsLinks?: string[];
  schemaTypes?: string[];
  founderLikelyNamed?: boolean;
  pricingLikelyVisible?: boolean;
};

type ScoringSnapshot = {
  corroboration?: {
    wikidataPresent?: boolean;
    wikidataUrl?: string;
    linkedinPresent?: boolean;
    linkedinUrl?: string;
    totalCorroboratingDomains?: number;
    degraded?: boolean;
    mentions?: Array<{
      url: string;
      title: string;
      domain: string;
      snippet: string;
    }>;
  };
};

async function loadEvidence(submissionId: string, token: string) {
  const supabase = supabaseAdmin();
  const { data: submission } = await supabase
    .from("submissions")
    .select("id, url, company_name, access_token, created_at")
    .eq("id", submissionId)
    .maybeSingle<SubmissionRow>();
  if (!submission || submission.access_token !== token || isExpired(submission.created_at)) {
    return null;
  }

  const { data: audit } = await supabase
    .from("audits")
    .select("id, crawler_output, scoring_output, created_at")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AuditRow>();
  if (!audit) return null;
  return { submission, audit };
}

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  if (!t) notFound();

  const data = await loadEvidence(id, t);
  if (!data) notFound();

  const crawler = data.audit.crawler_output;
  const corroboration = data.audit.scoring_output?.corroboration ?? null;
  const signals = [
    ["Organization schema", crawler?.organizationSchemaPresent],
    ["Person schema", crawler?.personSchemaPresent],
    ["FAQPage schema", crawler?.faqSchemaPresent],
    ["Service schema", crawler?.serviceSchemaPresent],
    ["llms.txt", crawler?.llmsTxtPresent],
    ["robots.txt", crawler?.robotsTxtPresent],
    ["Founder named", crawler?.founderLikelyNamed],
    ["Pricing visible", crawler?.pricingLikelyVisible],
  ] as const;

  return (
    <main className="report-workspace min-h-screen pb-24">
      <article className="mx-auto max-w-5xl px-5 pt-10 pb-12 sm:px-8 lg:pt-14">
        <TokenReportNav reportId={id} token={t} active="evidence" />
        <header className="rounded-lg bg-forest-dark p-5">
          <div className="text-[11px] uppercase tracking-widest text-gold">
            Evidence
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-cream sm:text-4xl">
            Site and source signals
          </h1>
          <p className="mt-2 text-sm text-tan">
            Evidence used by this free readiness check for {friendlyDomain(data.submission.url)}.
          </p>
        </header>

        <section className="mt-8 rounded-lg bg-forest-dark p-6">
          <h2 className="text-2xl font-semibold text-cream">What we read on the site</h2>
          <p className="mt-2 text-sm leading-relaxed text-tan">
            These are public crawlability, structure, and entity signals visible
            during the free scan.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {signals.map(([label, present]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 rounded border border-tan/35 bg-forest/60 px-4 py-3 text-sm"
              >
                <span className="text-cream">{label}</span>
                <span className={present ? "text-gold" : "text-tan"}>
                  {present ? "yes" : "no"}
                </span>
              </li>
            ))}
          </ul>
          {crawler?.title && (
            <p className="mt-5 text-sm text-tan">
              <span className="font-semibold text-cream">Page title: </span>
              {crawler.title}
            </p>
          )}
          {crawler?.metaDescription && (
            <p className="mt-2 text-sm text-tan">
              <span className="font-semibold text-cream">Meta description: </span>
              {crawler.metaDescription}
            </p>
          )}
          {crawler?.schemaTypes && crawler.schemaTypes.length > 0 && (
            <p className="mt-2 text-sm text-tan">
              <span className="font-semibold text-cream">JSON-LD types: </span>
              {crawler.schemaTypes.join(", ")}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-lg bg-forest-dark p-6">
          <h2 className="text-2xl font-semibold text-cream">What corroborated the entity</h2>
          <p className="mt-2 text-sm leading-relaxed text-tan">
            We found {corroboration?.totalCorroboratingDomains ?? 0} corroborating
            domain{corroboration?.totalCorroboratingDomains === 1 ? "" : "s"}.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <EvidenceLink label="LinkedIn" found={corroboration?.linkedinPresent} url={corroboration?.linkedinUrl} />
            <EvidenceLink label="Wikidata" found={corroboration?.wikidataPresent} url={corroboration?.wikidataUrl} />
          </div>
          {corroboration?.mentions && corroboration.mentions.length > 0 && (
            <ul className="mt-6 space-y-4">
              {corroboration.mentions.slice(0, 6).map((mention) => (
                <li key={mention.url} className="rounded border border-tan/35 bg-forest/60 p-4">
                  <a href={mention.url} className="font-semibold text-cream underline decoration-gold underline-offset-4 hover:text-gold">
                    {mention.title || mention.domain}
                  </a>
                  <span className="ml-2 text-xs text-tan">({mention.domain})</span>
                  {mention.snippet && (
                    <p className="mt-2 text-sm leading-relaxed text-tan">{mention.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  );
}

function EvidenceLink({ label, found, url }: { label: string; found?: boolean; url?: string }) {
  return (
    <div className="rounded border border-tan/35 bg-forest/60 p-4 text-sm">
      <p className="font-semibold text-cream">{label}</p>
      {found && url ? (
        <a href={url} className="mt-2 block break-all text-tan underline decoration-gold underline-offset-4 hover:text-gold">
          {url}
        </a>
      ) : (
        <p className="mt-2 text-tan">not found</p>
      )}
    </div>
  );
}

function friendlyDomain(url: string | null): string {
  if (!url) return "your site";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created > REPORT_TOKEN_TTL_MS;
}
