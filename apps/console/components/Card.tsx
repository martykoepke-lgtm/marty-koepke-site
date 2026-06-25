export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-white/70 bg-paper rounded-md p-4 text-charcoal shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <div className="text-xs text-muted uppercase tracking-wider font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold text-forest-dark mt-1.5 tracking-tight">
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </Card>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "forest" | "gold" | "muted";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-cream-dim text-charcoal border-rule-strong",
    forest: "bg-forest/10 text-forest-dark border-forest/20",
    gold: "bg-gold/15 text-gold-dark border-gold/30",
    muted: "bg-paper-dim text-muted border-rule",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
