import Link from "next/link";
import Image from "next/image";
import { NAV, POLICIES, SITE, HOME } from "@/lib/content";
import { CONTACT_EMAIL, SOCIAL } from "@/lib/links";

export default function Footer() {
  return (
    <footer className="daizie-footer">
      <div className="cols">
        {/* Brand */}
        <div>
          <Image
            src="/images/brand-2026/marty-koepke.svg"
            alt="Marty Koepke"
            width={322}
            height={75}
            className="brand-logo"
            priority={false}
          />
          <p className="tagline">{SITE.tagline}</p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <h2>Pages</h2>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h2>Get in touch</h2>
          <ul>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li className="service-note">{SITE.serviceAreaText}</li>
            <li>
              <div className="socials">
                <a
                  href={SOCIAL.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
                <a
                  href={SOCIAL.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="disclaimer">{HOME.disclaimer}</p>

      {/* Copyright + policies */}
      <div className="bottom-row">
        <span>
          © {new Date().getFullYear()} {SITE.legalName}. {SITE.location}.
        </span>
        <ul>
          {POLICIES.map((p) => (
            <li key={p.href}>
              <Link href={p.href}>{p.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
