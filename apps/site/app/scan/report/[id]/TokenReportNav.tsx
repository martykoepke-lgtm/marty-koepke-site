import Link from "next/link";

export function TokenReportNav({
  reportId,
  token,
  active,
}: {
  reportId: string;
  token: string;
  active: "report" | "evidence" | "methodology";
}) {
  const suffix = token ? `?t=${encodeURIComponent(token)}` : "";
  const base = `/scan/report/${reportId}`;
  const tabs = [
    { key: "report", label: "Report", href: base },
    { key: "evidence", label: "Evidence", href: `${base}/evidence` },
    { key: "methodology", label: "Methodology", href: `${base}/methodology` },
  ];

  return (
    <nav className="mb-6 flex items-center justify-between rounded bg-forest-dark px-4 py-3">
      <div className="flex items-center gap-5 text-sm">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Link
              key={tab.href}
              href={`${tab.href}${suffix}`}
              className={
                isActive
                  ? "rounded bg-cream px-3 py-1.5 font-semibold text-forest"
                  : "rounded px-3 py-1.5 text-cream transition-colors hover:text-gold"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="hidden text-[11px] uppercase tracking-widest text-gold sm:block">
        Marty Koepke
      </div>
    </nav>
  );
}
