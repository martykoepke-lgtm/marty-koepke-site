"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-forest px-4 py-2 font-medium text-cream transition-colors hover:bg-forest-dark"
    >
      Print / Save as PDF
    </button>
  );
}
