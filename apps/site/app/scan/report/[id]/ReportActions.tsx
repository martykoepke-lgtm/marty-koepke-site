"use client";

export function ReportActions() {
  return (
    <div className="daizie-actions print:hidden" style={{ justifyContent: "flex-end", marginBottom: 4 }}>
      <button
        type="button"
        onClick={() => window.print()}
        className="daizie-btn ghost"
      >
        Download report (Save as PDF)
      </button>
    </div>
  );
}
