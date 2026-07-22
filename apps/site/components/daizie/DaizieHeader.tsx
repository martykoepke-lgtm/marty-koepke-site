"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/content";

export default function DaizieHeader() {
  const pathname = usePathname();
  return (
    <header className="daizie-header" role="banner">
      <Link href="/" className="brand" aria-label="Marty Koepke — home">
        <Image
          src="/images/brand-2026/marty-koepke-favicon.png"
          alt=""
          width={92}
          height={92}
          priority
        />
        <span className="lockup-text">
          <span className="lockup-name">Marty Koepke</span>
          <span className="lockup-tag">Useful · Trustworthy · Human</span>
        </span>
      </Link>
      <nav aria-label="Primary">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
