"use client";

export function ReportActions() {
  return (
    <div className="mb-4 flex justify-end print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark"
      >
        Download report
      </button>
    </div>
  );
}
