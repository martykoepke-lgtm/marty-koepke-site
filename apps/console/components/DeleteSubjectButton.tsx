"use client";

export function DeleteSubjectButton({
  businessName,
}: {
  businessName: string;
}) {
  return (
    <button
      type="submit"
      className="w-full px-3 py-2 rounded-md text-sm font-medium border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
      onClick={(event) => {
        const ok = window.confirm(
          `Delete ${businessName}? This removes it from the active business list. Past audit reports stay in history.`
        );
        if (!ok) event.preventDefault();
      }}
    >
      Delete business
    </button>
  );
}
