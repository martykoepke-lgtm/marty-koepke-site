"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", description: "Overview" },
  { href: "/subjects", label: "Subjects", description: "Audit targets" },
  { href: "/audits", label: "Audits", description: "Run history" },
  { href: "/compare", label: "Compare", description: "Analytics + cohort grid" },
  { href: "/submissions", label: "Submissions", description: "Free scans" },
  { href: "/spend", label: "Spend", description: "Cost monitor" },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-sidebar/92 border-r border-white/10 flex flex-col text-paper backdrop-blur-xl shadow-[12px_0_40px_rgba(0,0,0,0.16)]">
      <div className="px-5 py-6">
        <div className="text-base font-semibold text-paper tracking-tight leading-tight">
          Marty Koepke
          <span className="text-gold text-xs font-medium ml-1.5 align-top">LLC</span>
        </div>
        <div className="text-xs text-paper/60 mt-1">Operator console</div>
        <div className="gold-accent mt-3" />
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col gap-0.5 px-3 py-2 rounded-md transition-colors relative",
                isActive
                  ? "bg-white/12 text-paper border border-gold/35 shadow-sm"
                  : "text-paper/76 border border-transparent hover:bg-white/8 hover:text-paper",
              ].join(" ")}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-gold rounded-r"
                  aria-hidden
                />
              )}
              <span className="text-sm font-medium">{item.label}</span>
              <span
                className={[
                  "text-xs",
                  isActive ? "text-paper/68" : "text-paper/48",
                ].join(" ")}
              >
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        {userEmail && (
          <div className="px-2 mb-2">
            <div className="text-[10px] text-paper/45 uppercase tracking-wider font-medium">
              Signed in
            </div>
            <div className="text-xs text-paper/80 mt-0.5 truncate">
              {userEmail}
            </div>
          </div>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-3 py-1.5 rounded-md text-xs text-paper/55 hover:text-paper hover:bg-paper/10 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
