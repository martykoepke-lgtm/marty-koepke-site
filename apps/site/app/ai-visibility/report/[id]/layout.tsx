import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Report stack layout — wraps Report, Evidence, and Methodology pages with the
 * immersive tree-background visual treatment and a shared navigation strip.
 *
 * Access is gated by audit UUID unguessability for now. Real per-customer
 * access tokens land when the paid customer flow ships.
 */
export default async function ReportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="report-workspace">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <ReportNav auditId={id} />
        {children}
      </div>
    </div>
  );
}

function ReportNav({ auditId }: { auditId: string }) {
  const base = `/ai-visibility/report/${auditId}`;
  return (
    <nav className="mb-6 flex items-center justify-between rounded bg-forest-dark px-4 py-3">
      <div className="flex items-center gap-5 text-sm">
        <Link
          href={base}
          className="text-cream hover:text-gold transition-colors"
        >
          Report
        </Link>
        <Link
          href={`${base}/evidence`}
          className="text-cream hover:text-gold transition-colors"
        >
          Evidence
        </Link>
        <Link
          href={`${base}/methodology`}
          className="text-cream hover:text-gold transition-colors"
        >
          Methodology
        </Link>
      </div>
      <div className="text-[11px] uppercase tracking-widest text-gold">
        Marty Koepke
      </div>
    </nav>
  );
}
