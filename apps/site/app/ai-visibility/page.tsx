import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Faq from "@/components/sections/Faq";
import { META, AVI, SITE } from "@/lib/content";
import { BOOK_CALL_HREF, resolveTierCta } from "@/lib/links";

export const metadata: Metadata = {
  title: META.aiVisibility.title,
  description: META.aiVisibility.description,
  alternates: { canonical: "/ai-visibility" },
  openGraph: {
    title: META.aiVisibility.title,
    description: META.aiVisibility.description,
    url: `${SITE.url}/ai-visibility`,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AVI.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Daizie AI Visibility Assessment",
  provider: { "@id": `${SITE.url}/#org` },
  description: META.aiVisibility.description,
  offers: [
    {
      "@type": "Offer",
      name: "Free Daizie Readiness Check",
      price: "0",
      priceCurrency: "USD",
      description:
        "Readiness-only website scan with a master-key presence check and top 2-3 findings.",
    },
    {
      "@type": "Offer",
      name: "Daizie AI Visibility Assessment",
      price: "895",
      priceCurrency: "USD",
      description:
        "Full measurement protocol: four engines, every claim verified, plotted against two named competitors. Includes a 30-minute review call.",
    },
    {
      "@type": "Offer",
      name: "Daizie Monthly Monitoring",
      price: "149",
      priceCurrency: "USD",
      description:
        "Full Assessment re-run every month, dashboard, trends across all 11 measurements. Available after the Assessment.",
    },
  ],
};

export default function AiVisibilityPage() {
  const freeOffer = AVI.compareOffers.find((o) => o.id === "free")!;
  const paidOffer = AVI.compareOffers.find((o) => o.id === "paid")!;

  return (
    <div className="daizie-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <DaizieHeader />

      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane daizie-hero-pane">
            <div className="daizie-product-lockup">
              <Image
                src="/images/brand-2026/daizie-mark.png"
                alt=""
                width={420}
                height={420}
                priority
              />
              <span className="lockup-text">
                <span className="lockup-name">Daizie</span>
                <span className="lockup-tag">AI visibility, made clear</span>
              </span>
            </div>
            <p className="daizie-eyebrow">{AVI.heroEyebrow}</p>
            <h1>{AVI.heroHeadline}</h1>
            <p className="daizie-italic-tag">{AVI.subTagline}</p>
            <p className="daizie-lede">{AVI.heroSubhead}</p>
            <div className="daizie-actions">
              <Link
                className="daizie-btn primary"
                href={AVI.heroPrimaryCta.href}
              >
                {AVI.heroPrimaryCta.label} →
              </Link>
              <a className="plain-link" href={AVI.heroSecondaryCta.href}>
                {AVI.heroSecondaryCta.label}
              </a>
            </div>
            <div className="daizie-trust">
              {AVI.heroTrust.map((item, i) => (
                <span
                  key={i}
                  className={i <= 1 ? "emph" : undefined}
                >
                  {item}
                  {i < AVI.heroTrust.length - 1 && (
                    <span aria-hidden="true"> · </span>
                  )}
                </span>
              ))}
            </div>
          </article>
        </Reveal>

        {/* ── Two offers at a glance (Free vs Paid) ─────────────────────── */}
        <Reveal>
          <article className="daizie-pane center" id="compare">
            <p className="daizie-eyebrow">{AVI.compareEyebrow}</p>
            <h2>{AVI.compareHeadline}</h2>
            <p className="daizie-lede">{AVI.compareSubhead}</p>
            <div className="daizie-tiers">
              {[freeOffer, paidOffer].map((offer) => {
                const href = resolveTierCta(offer.cta.href);
                return (
                  <div
                    key={offer.id}
                    className={`daizie-tier${offer.featured ? " featured" : ""}`}
                  >
                    {offer.featured && (
                      <span className="ribbon">Most chosen</span>
                    )}
                    <h3>{offer.name}</h3>
                    <p className="price" style={{ marginTop: 10 }}>
                      {offer.price}
                    </p>
                    <p style={{ fontSize: ".78rem", opacity: 0.75, marginTop: 2 }}>
                      {offer.priceNote}
                    </p>
                    <p
                      style={{
                        marginTop: 16,
                        fontStyle: "italic",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                      }}
                    >
                      {offer.tagline}
                    </p>
                    <ul>
                      {offer.whatYouGet.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    <div className="tier-cta">
                      <Link
                        className={`daizie-btn ${offer.featured ? "primary" : "ghost"}`}
                        href={href}
                        style={{ display: "flex", width: "100%" }}
                      >
                        {offer.cta.label} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 24, fontStyle: "italic", opacity: 0.8, fontSize: ".92rem" }}>
              {AVI.compareFootnote}{" "}
              <a
                className="plain-link"
                href={BOOK_CALL_HREF}
              >
                Book a free 20-minute conversation →
              </a>
            </p>
          </article>
        </Reveal>

        {/* ── Robust crosswalk ─────────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <div className="center">
              <p className="daizie-eyebrow">{AVI.crosswalkEyebrow}</p>
              <h2>{AVI.crosswalkHeadline}</h2>
              <p className="daizie-lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
                {AVI.crosswalkSubhead}
              </p>
            </div>
            <div className="daizie-crosswalk">
              <div className="cw-head">
                <div />
                <div>
                  <p>Free Readiness Check</p>
                  <p>$0 · instant</p>
                </div>
                <div>
                  <p>AI Visibility Assessment</p>
                  <p>$895 · 24–48 hrs</p>
                </div>
              </div>
              <RevealGroup>
                {AVI.crosswalkRows.map((row) => (
                  <RevealItem key={row.dimension} className="cw-row">
                    <div className="cw-dim">{row.dimension}</div>
                    <p>
                      <span className="cw-mobile-label">Free</span>
                      {row.free}
                    </p>
                    <p>
                      <span className="cw-mobile-label">Assessment</span>
                      {row.paid}
                    </p>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </article>
        </Reveal>

        {/* ── Audience-lane story ──────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <div className="center">
              <p className="daizie-eyebrow">{AVI.audienceLanesEyebrow}</p>
              <h2>{AVI.audienceLanesHeadline}</h2>
              <p className="daizie-lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
                {AVI.audienceLanesSubhead}
              </p>
            </div>
            <div className="daizie-lanes">
              {AVI.audienceLanes.map((lane) => (
                <div key={lane.id} className="daizie-lane">
                  <p className="daizie-eyebrow" style={{ marginBottom: 6 }}>
                    Lane
                  </p>
                  <h3>{lane.label}</h3>
                  <p className="lane-sub">{lane.subLabel}</p>
                  <p
                    style={{
                      color: "var(--dz-forest)",
                      fontSize: ".78rem",
                      fontWeight: 700,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    The profiles that matter
                  </p>
                  <ul>
                    {lane.keys.map((k) => (
                      <li key={k.name}>
                        <strong>{k.name}</strong>
                        <span>{k.why}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="lane-note">{lane.queryStyle}</p>
                </div>
              ))}
            </div>
            <p
              className="center"
              style={{
                marginTop: 22,
                fontStyle: "italic",
                fontSize: ".95rem",
                opacity: 0.8,
              }}
            >
              {AVI.audienceLanesFootnote}
            </p>
          </article>
        </Reveal>

        {/* ── What we measure — the five readiness drivers ─────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <div className="center">
              <p className="daizie-eyebrow">{AVI.dimensionsEyebrow}</p>
              <h2>{AVI.dimensionsHeadline}</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 18,
                marginTop: 30,
              }}
            >
              {AVI.dimensions.map((d) => (
                <div
                  key={d.name}
                  style={{
                    padding: 24,
                    border: "1px solid var(--dz-line)",
                    borderRadius: 20,
                    background: "rgba(255,255,255,.55)",
                  }}
                >
                  <h3 style={{ fontSize: "1.15rem", marginBottom: 8 }}>
                    {d.name}
                  </h3>
                  <p style={{ fontSize: ".92rem", lineHeight: 1.6 }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        {/* ── Inside the paid Assessment ───────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <div className="center">
              <p className="daizie-eyebrow">{AVI.insideAssessmentEyebrow}</p>
              <h2>{AVI.insideAssessmentHeadline}</h2>
              <p className="daizie-lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
                {AVI.insideAssessmentSubhead}
              </p>
            </div>
            <div className="daizie-cards-3">
              {AVI.insideAssessmentCards.map((card) => (
                <div key={card.title}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: ".93rem", lineHeight: 1.65 }}>
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="center"
              style={{
                marginTop: 24,
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              ✓ {AVI.insideAssessmentIncluded}
            </p>
          </article>
        </Reveal>

        {/* ── Who this is for / isn't for ──────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <div className="daizie-cards-2">
              <div>
                <h3>{AVI.forYouHeadline}</h3>
                <p style={{ marginTop: 12, lineHeight: 1.65 }}>{AVI.forYou}</p>
              </div>
              <div>
                <h3>{AVI.notForYouHeadline}</h3>
                <p style={{ marginTop: 12, lineHeight: 1.65 }}>
                  {AVI.notForYou}
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        {/* ── Monthly Monitoring callout ───────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane center">
            <p className="daizie-eyebrow">{AVI.monitoringEyebrow}</p>
            <h2>{AVI.monitoringHeadline}</h2>
            <p className="daizie-lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
              {AVI.monitoringBody}
            </p>
            <div className="daizie-actions">
              <Link
                className="daizie-btn ghost"
                href={resolveTierCta(AVI.monitoringCta.href)}
              >
                {AVI.monitoringCta.label} →
              </Link>
            </div>
          </article>
        </Reveal>

        {/* ── About Marty ──────────────────────────────────────────────── */}
        <Reveal>
          <article
            className="daizie-pane"
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: 40,
              alignItems: "center",
            }}
          >
            <Image
              src="/images/headshot.jpg"
              alt="Marty Koepke"
              width={220}
              height={280}
              style={{
                width: 220,
                height: 280,
                objectFit: "cover",
                borderRadius: "110px 110px 24px 24px",
                border: "5px solid rgba(255,255,255,.72)",
              }}
            />
            <div>
              <p className="daizie-eyebrow">{AVI.aboutMartyEyebrow}</p>
              <h2>{AVI.aboutMartyHeadline}</h2>
              {AVI.aboutMartyBody.map((p, i) => (
                <p
                  key={i}
                  style={{
                    marginTop: 14,
                    lineHeight: 1.7,
                    fontSize: "1rem",
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
          </article>
        </Reveal>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <h2 style={{ marginBottom: 24 }}>Frequently asked questions</h2>
            <Faq items={AVI.faq} />
          </article>
        </Reveal>

        {/* ── Secondary CTA (forest pane) ──────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane forest center">
            <h2>{AVI.secondaryCta.headline}</h2>
            <p
              className="daizie-lede"
              style={{
                marginLeft: "auto",
                marginRight: "auto",
                color: "rgba(250,246,238,.85)",
              }}
            >
              {AVI.secondaryCta.body}
            </p>
            <div className="daizie-actions">
              <a className="daizie-btn light" href={BOOK_CALL_HREF}>
                Schedule a free 20-minute conversation →
              </a>
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
