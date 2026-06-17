"use client";

import { useEffect } from "react";
import { CONTACT_EMAIL } from "@/lib/links";

/**
 * GetTerms.io embed wrapper.
 *
 * Uses the snippet pattern from the GetTerms dashboard:
 *  - a <div class="getterms-document-embed"> placeholder per document
 *  - the loader script at gettermscdn.com/dist/js/embed.js
 *
 * The loader only scans the DOM once, on first load. With Next.js
 * client-side routing, navigating between policy pages mounts a new
 * embed div but the loader never re-scans, so the div stays empty.
 * The useEffect below removes any prior loader and re-inserts a fresh
 * one on every mount / slug change, forcing the GetTerms script to
 * re-execute and pick up the newly-mounted embed div.
 *
 * Both UUID and CDN can be overridden via env vars; defaults match the
 * Practical Informatics LLC account.
 */
const GETTERMS_UUID = process.env.NEXT_PUBLIC_GETTERMS_UUID ?? "0GN4I";
const GETTERMS_CDN =
  process.env.NEXT_PUBLIC_GETTERMS_CDN ?? "https://gettermscdn.com";
const SCRIPT_ID = "getterms-embed-js";

export default function GetTermsEmbed({
  document: slug,
  title,
}: {
  document: string;
  title: string;
}) {
  useEffect(() => {
    if (!GETTERMS_UUID || !slug) return;
    const old = document.getElementById(SCRIPT_ID);
    if (old) old.remove();
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = `${GETTERMS_CDN}/dist/js/embed.js`;
    s.async = true;
    document.body.appendChild(s);
  }, [slug]);

  if (!GETTERMS_UUID || !slug) {
    return (
      <div className="rounded-md border border-tan bg-cream-dim p-6 text-charcoal">
        <p className="leading-relaxed">
          The {title.toLowerCase()} for Practical Informatics LLC is being
          finalized. For questions in the meantime, please email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline decoration-gold underline-offset-4 hover:text-forest"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className="getterms-document-embed"
      data-getterms={GETTERMS_UUID}
      data-getterms-document={slug}
      data-getterms-lang="en-us"
      data-getterms-mode="direct"
      data-getterms-env={GETTERMS_CDN}
    />
  );
}
