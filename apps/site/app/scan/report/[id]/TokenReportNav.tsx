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
  ] as const;

  return (
    <nav className="daizie-scan-result">
      <div className="result-nav">
        <div className="tabs">
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <Link
                key={tab.href}
                href={`${tab.href}${suffix}`}
                className={isActive ? "active" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <span className="brand-tag">Daizie</span>
      </div>
    </nav>
  );
}
