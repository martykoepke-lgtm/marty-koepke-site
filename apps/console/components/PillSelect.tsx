"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Native-select pill that updates the URL search params on change.
 * Keeps the rest of the Compare page server-rendered.
 */
export function PillSelect({
  param,
  current,
  options,
}: {
  param: string;
  current?: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const search = useSearchParams();

  return (
    <select
      name={param}
      defaultValue={current ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(search.toString());
        if (e.target.value) {
          next.set(param, e.target.value);
        } else {
          next.delete(param);
        }
        router.push(`?${next.toString()}`);
      }}
      className="bg-paper border border-rule-strong rounded-md px-2 py-1 text-xs hover:border-forest cursor-pointer text-charcoal"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
