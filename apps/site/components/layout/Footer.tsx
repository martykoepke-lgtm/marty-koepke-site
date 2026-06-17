import Link from "next/link";
import Image from "next/image";
import { NAV, POLICIES, SITE, HOME } from "@/lib/content";
import { CONTACT_EMAIL, SOCIAL, MARTYKOEPKE_URL } from "@/lib/links";

export default function Footer() {
  return (
    <footer className="bg-forest px-6 py-16 text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
        {/* Brand */}
        <div>
          {/* Long horizontal lockup on a cream plate so the dark-green
              wordmark stays legible against the forest-green footer. */}
          <span className="inline-block rounded-md bg-cream p-4">
            <Image
              src="/images/logo-horizontal.png"
              alt="Practical Informatics LLC"
              width={1500}
              height={400}
              className="h-24 w-auto"
            />
          </span>
          <p className="mt-5 max-w-xs text-cream/80">{SITE.tagline}</p>
          <p className="mt-4 max-w-xs text-sm text-cream/60">
            For Marty&apos;s separate work in writing and speaking, visit{" "}
            <a
              href={MARTYKOEPKE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-gold underline-offset-4 hover:text-gold"
            >
              martykoepke.com
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            .
          </p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
            Pages
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-cream/80 transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
            Get in touch
          </h2>
          <ul className="mt-4 space-y-2.5 text-cream/80">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="transition-colors hover:text-gold"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>{SITE.serviceAreaText}</li>
            <li className="flex gap-4 pt-1">
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
              >
                Facebook
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
              >
                LinkedIn
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimer — verbatim from Marty's positioning. */}
      <div className="mx-auto mt-14 max-w-6xl border-t border-cream/15 pt-6">
        <p className="text-xs leading-relaxed text-cream/55">
          {HOME.disclaimer}
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-4 border-t border-cream/15 pt-6 text-sm text-cream/55 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.legalName}. {SITE.location}.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {POLICIES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="transition-colors hover:text-gold"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
