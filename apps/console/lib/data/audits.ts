import { supabaseAdmin } from "@practical-informatics/avi";

export type RecentAudit = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  tier: string | null;
  query_count: number | null;
  engine_count: number | null;
  errors: unknown;
};

export async function getRecentCompletedAuditForSubjectUrl(
  url: string | undefined,
  minutes = 60
): Promise<RecentAudit | null> {
  if (!url) return null;

  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const supabase = supabaseAdmin();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("url", url)
    .maybeSingle();

  if (!subject?.id) return null;

  const { data } = await supabase
    .from("audits_v2")
    .select("id,started_at,completed_at,status,tier,query_count,engine_count,errors")
    .eq("subject_id", subject.id)
    .eq("mode", "paid")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as RecentAudit | null) ?? null;
}
