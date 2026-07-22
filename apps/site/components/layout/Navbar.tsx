"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/content";
import { MenuIcon, CloseIcon } from "@/components/ui/Icons";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The Daizie surfaces render their own pill-nav header, so suppress the
  // shared Marty Koepke chrome on those routes.
  const isDaizieRoute =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/work" ||
    pathname.startsWith("/work/") ||
    pathname === "/resources" ||
    pathname.startsWith("/resources/") ||
    pathname === "/craizie" ||
    pathname.startsWith("/craizie/") ||
    pathname === "/ai-visibility" ||
    pathname.startsWith("/ai-visibility/") ||
    pathname === "/scan" ||
    pathname.startsWith("/scan/") ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/");
  if (isDaizieRoute) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-sage-light/60 bg-white/92 backdrop-blur-md"
          : "border-b border-transparent bg-white/85 backdrop-blur-sm"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
      >
        <Link
          href="/"
          aria-label="Marty Koepke — home"
          className="shrink-0 flex flex-col items-start leading-tight"
        >
          <span className="font-serif text-xl md:text-2xl font-semibold tracking-[0.14em] uppercase text-forest-dark">
            Marty Koepke
          </span>
          <span
            aria-hidden
            className="mt-1 h-[2px] w-8 rounded-full bg-gold"
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            if (item.emphasized) {
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-dark"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm transition-colors hover:text-forest ${
                    active
                      ? "text-forest underline decoration-gold decoration-2 underline-offset-8"
                      : "text-moss"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          className="text-forest md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <CloseIcon className="h-7 w-7" />
          ) : (
            <MenuIcon className="h-7 w-7" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-tan/60 bg-cream md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-2">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block py-3 text-base ${
                      item.emphasized
                        ? "font-medium text-forest"
                        : active
                          ? "text-forest"
                          : "text-moss"
                    }`}
                  >
                    {item.label}
                    {item.emphasized && (
                      <span className="ml-2 align-middle text-xs uppercase tracking-wide text-gold-dark">
                        Start here
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
