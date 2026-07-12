/**
 * Single source of truth for all site copy.
 * Text is verbatim from the build handoff document. Components import
 * from here so copy is never hardcoded in JSX.
 */

export const SITE = {
  name: "Marty Koepke",
  legalName: "Practical Informatics LLC",
  url: "https://www.martykoepke.com",
  tagline: "People · Process · Possibilities",
  location: "Mokelumne Hill, California",
  foundingYear: 2024,
  foundingDate: "2024-08-13",
  caSosEntityNumber: "202463415854",
  serviceArea: ["United States"],
  serviceAreaText: "Serving businesses across the United States",
} as const;

export type NavItem = {
  label: string;
  href: string;
  emphasized?: boolean;
};

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "AI visibility", href: "/ai-visibility", emphasized: true },
  { label: "AI governance", href: "/craizie" },
  { label: "About", href: "/about" },
  // Blog is intentionally hidden from nav until the first posts ship.
  // To re-enable, add: { label: "Blog", href: "/blog" }
  { label: "Contact", href: "/contact" },
];

/** Policy routes, also surfaced in the footer.
 *  GetTerms document slugs confirmed from the dashboard snippets. */
export const POLICIES: { label: string; href: string; gettermsSlug: string }[] = [
  { label: "Privacy", href: "/privacy", gettermsSlug: "privacy" },
  { label: "Terms", href: "/terms", gettermsSlug: "terms-of-service" },
  { label: "Cookies", href: "/cookies", gettermsSlug: "cookies" },
  { label: "Acceptable Use", href: "/acceptable-use", gettermsSlug: "acceptable-use" },
  { label: "Returns", href: "/returns", gettermsSlug: "return" },
];

export const META = {
  home: {
    title:
      "Marty Koepke | Applied AI for businesses that want to do this right.",
    description:
      "Marty Koepke is an applied AI consultant helping organizations and professionals adopt AI thoughtfully. Tools, assessments, and infrastructure — twenty years of informatics behind every recommendation.",
  },
  about: {
    title: "About Marty Koepke | Marty Koepke",
    description:
      "Marty Koepke (she/her). Twenty years in enterprise informatics, author of Between the Clicks. Applied AI consulting and custom software development for businesses adopting AI thoughtfully.",
  },
  aiVisibility: {
    title: "Daizie — AI visibility (AEO / GEO) for small business",
    description:
      "Daizie is an AI visibility service by informaticist Marty Koepke that helps founder-led service businesses show up accurately when ChatGPT, Claude, Perplexity, and Gemini describe, cite, and recommend them. Also known as AEO (answer engine optimization) or GEO (generative engine optimization).",
  },
  blog: {
    title: "Notes | Marty Koepke",
    description:
      "Practical writing on applied AI, AI visibility, and operational efficiency for businesses that want to do this right.",
  },
  contact: {
    title: "Contact | Marty Koepke",
    description:
      "Book a free 20-minute conversation about your business. Marty Koepke is an applied AI consultancy serving businesses across the United States.",
  },
} as const;

/* ===== HOME ===== */
export const HOME = {
  /** Eyebrow above the hero H1 — replaces the geographic eyebrow. */
  heroEyebrow: "Applied AI Consultancy",
  /** Italic gold sub-tagline between H1 and CTAs. The positioning sentence. */
  heroPositioning:
    "Marty Koepke is an applied AI consultant. Twenty years of informatics behind every recommendation.",
  /** Trust strip below the hero CTAs. */
  heroTrust: [
    "20+ years informatics",
    "62-subject AI visibility study",
    "Author, Between the Clicks",
    "Applied AI · Custom software",
  ],
  /** The brand statement — verbatim from Marty. */
  brandStatement:
    "We partner with organizations and professionals who are the recognized experts in their own fields, providing the tools, assessments, and infrastructure that help them adopt AI thoughtfully and improve operational efficiency and AI visibility.",

  /** BLOCK 1 — AI Visibility (the lead, productized offer). */
  aviBlock: {
    eyebrow: "Lead offer",
    headline: "Does AI get your business right?",
    intro:
      "AI Visibility is the front door. AI Business Accuracy is the deeper work: checking whether AI can find, understand, cite, and recommend your business in right-fit situations.",
    tiers: [
      {
        name: "Free AI Readiness Check",
        price: "$0",
        note: "Readiness only",
        description:
          "A quick website-readiness score in plain English. URL-only, about 30 seconds.",
      },
      {
        name: "AI Business Accuracy Audit",
        price: "$895",
        note: "The paid product",
        description:
          "Four engines, eight buyer-question queries, every claim verified, you plotted next to two named competitors. Includes a 30-minute review call.",
      },
      {
        name: "Monthly Monitoring",
        price: "$149/mo",
        note: "After your Audit",
        description:
          "Your full Audit re-run every month, with a dashboard that tracks how your scores move over time. Email when each new report is ready.",
      },
    ],
    cta: { label: "See AI Visibility & Business Accuracy", href: "/ai-visibility" },
  },

  /** BLOCK 2  /** BLOCK 2 — Custom engagements (custom software + AI integrations). */
  customBlock: {
    eyebrow: "Custom engagements",
    headline: "Custom software and AI integrations.",
    intro:
      "For organizations that need software or AI integrations built for the way they actually work. Reach out to discuss scope.",
    cta: { label: "Contact us", href: "/contact" },
  },

  /** The "Complementary, not substitutive" principle — verbatim from Marty. */
  principle: {
    eyebrow: "How we work",
    headline: "Complementary, not substitutive.",
    body: "Our role is complementary, not substitutive. A physician remains the medical expert in her practice. An attorney remains the legal expert in his firm. A facility operator remains the operational expert in his business. We bring expertise in AI, software, and process design — and we leave the substantive professional judgment, licensed decision-making, and final implementation choices where they belong: with our clients.",
    weBring: [
      "AI expertise",
      "Software development",
      "Process design",
      "Measurement methodology",
    ],
    weNeverReplace: [
      "Your professional judgment",
      "Licensed decision-making",
      "Your domain expertise",
      "Final implementation choices",
    ],
  },

  /** Case study credibility marker. */
  caseStudy: {
    eyebrow: "Research",
    headline: "We audited 62 companies across 11 industries.",
    body: "Our AI visibility methodology was validated against 62 real businesses spanning healthcare, consulting, CRM, B2B SaaS, marketing agencies, insurance, and more. The findings shape every audit we run.",
  },

  /** Who-is-Marty homepage block (short). Long version lives on /about. */
  whoIAm: {
    eyebrow: "Who built this",
    headline: "Marty Koepke",
    paragraphs: [
      "Hi, I'm Marty.",
      "Twenty years inside enterprise systems, I watched brilliant people get buried under workflows and technology that weren't designed for the way they actually work. Now I help business owners do that same kind of fixing — with AI where it actually fits, and software where it makes a real difference.",
      "My gift is standing between people and the technology they need to use — and making sure AI gets implemented intelligently, when it actually fits.",
    ],
  },

  /** Forthcoming services — small text, one line. */

  /** Disclaimer — verbatim from Marty. Rendered in the footer. */
  disclaimer:
    "We do not provide medical, legal, or financial advice, and we do not substitute for our clients' professional or licensed expertise. We help our clients see clearly, decide thoughtfully, and implement effectively within their own domains.",
} as const;

/* ===== ABOUT ===== */
export const ABOUT = {
  heroHeadline:
    "Twenty years inside enterprise systems. Now an applied AI consultancy.",
  story: [
    "For fifteen-plus years I've worked inside enterprise health systems — watching brilliant people get buried under workflows and technology that weren't designed for the way they actually work. The tools vary — electronic health records, clinical workflows, regulatory systems — but the diagnosis is always the same.",
    "What I learned, over those years, is that almost no organization has actually mapped where its own time goes. We feel like we're drowning, blame ourselves, work longer hours, and don't step back to ask if the work is organized right in the first place. That's true in a health system. It's true in a winery, a contractor's shop, an accounting practice, a small law firm.",
    "What's changed in the last couple of years is what's possible to do about it. AI didn't make the pattern — the pattern's been there forever. But AI made a lot of the fixes much easier, if you know what to fix in the first place. Most of the “AI for small business” content out there skips that question. I don't.",
    "I want to help business owners avoid spending their best hours on work that shouldn't take this long. I'm based in Mokelumne Hill, California, and I serve small and mid-sized businesses across the United States. We all have gifts. Mine is standing between people and the technology they need to use — and making sure AI gets implemented intelligently, when it actually fits.",
  ],
  principles: [
    {
      headline: "Process before tools",
      body: "Most “AI problems” are actually process problems wearing a costume. I look at how the work flows before I recommend any technology — sometimes the answer is AI, sometimes it's a smarter process and no AI at all.",
    },
    {
      headline: "AI only where it belongs",
      body: "AI is a tool, not a religion. I use it where it's genuinely the right answer, and I'll tell you plainly when it isn't.",
    },
    {
      headline: "Complementary, not substitutive",
      body: "Your professional judgment stays yours. Your domain expertise stays yours. I bring AI, software, and process design — and leave the substantive decisions where they belong: with you.",
    },
    {
      headline: "Plain language, every time",
      body: "No jargon, no buzzwords, no hundred-page reports nobody reads. If I can't explain a recommendation to you in plain English, it isn't a recommendation worth making.",
    },
  ],
  credentials:
    "Twenty years in healthcare, fifteen-plus driving enterprise-wide digital transformation. Master of Health Administration (Ashford University). System Clinical Informaticist at CommonSpirit Health, working across 2,500+ ambulatory care facilities. Author of Between the Clicks: The Hidden Work of Healthcare Informatics. Lean Six Sigma Black Belt. Lean Six Sigma Green Belt. Certified SAFe 6.0 Agilist. Scrum Master. Epic Clinical Informaticist Certification.",
  recentWork:
    "Recent enterprise work includes enabling Notable RPA implementation across 350 clinics — reducing patient check-in from 10 to 2 minutes and generating $26M+ in annual labor savings; piloting Abridge AI ambient documentation with 222 providers (14.7% documentation time reduction); and leading quality measure initiatives that drove a 42% improvement in Medicare Annual Wellness Visits ($1.3M revenue lift). The methods that worked at enterprise scale are the same methods I bring to applied AI work for small and mid-sized businesses today.",
  /** Structured background data for the visually appealing Background section.
   *  Bio statement, stat cards, and credentials chips. */
  backgroundEyebrow: "Background",
  backgroundHeadline: "Enterprise-scale informatics. Applied AI consultancy.",
  backgroundIntro:
    "System Clinical Informaticist at CommonSpirit Health, working across 2,500+ ambulatory care facilities. Author of Between the Clicks: The Hidden Work of Healthcare Informatics. Twenty years in healthcare, fifteen-plus driving enterprise-wide digital transformation across multiple states and EHR platforms.",
  outcomeStats: [
    {
      value: "$26M+",
      label: "Annual labor savings",
      context: "Notable RPA · 350+ clinics",
    },
    {
      value: "14.7%",
      label: "Documentation time cut",
      context: "Abridge AI · 222 providers",
    },
    {
      value: "42%",
      label: "Medicare AWV lift",
      context: "$1.3M revenue increase",
    },
    {
      value: "20yr",
      label: "Informatics experience",
      context: "Enterprise + applied AI",
    },
  ],
  credentialsChips: [
    "Master of Health Administration",
    "Lean Six Sigma Black Belt",
    "Lean Six Sigma Green Belt",
    "SAFe 6.0 Agilist",
    "Certified Scrum Master",
    "Epic Clinical Informaticist",
  ],
  built: [
    {
      id: "ehr-governance",
      name: "EHR Governance Assistant",
      subtitle: "Process navigator and AI assistant for EHR governance",
      blurb:
        "An intuitive process navigator that breaks down each governance stage into clear steps, combined with an AI assistant that provides real-time guidance through the governance process.",
      description:
        "A working prototype for the everyday decisions that shape an EHR over time — build approvals, change requests, governance votes, and the policy choices that usually get lost between meetings. The navigator walks teams through each stage and the assistant answers questions in plain language as they go. Designed and shipped end to end.",
      tags: ["React", "AI Integration", "Process Design"] as readonly string[],
      images: [],
      launchUrl: "https://sophiav2.vercel.app/",
      launchLabel: "Launch demo",
    },
    {
      id: "governiq",
      name: "GovernIQ",
      subtitle: "Governance and decision-tracking, built from a real workflow",
      blurb:
        "A complete operating surface for governance work — incoming requests captured, routed through the right approvers, tracked over time, and turned into the audit trail nobody usually has.",
      description:
        "Built from a real workflow at scale, GovernIQ replaces the email chains and spreadsheets that most governance teams live in. Requests come in, get classified, route to the right decider, and leave a clean record everyone can point to later. Designed and shipped end to end.",
      tags: ["React", "Workflow Design", "Audit & Compliance"] as readonly string[],
      images: [
        "/images/governiq/Screenshot 2025-11-28 200134.png",
        "/images/governiq/Screenshot 2025-11-28 200224.png",
        "/images/governiq/Screenshot 2025-11-30 100848.png",
        "/images/governiq/Screenshot 2025-11-30 100902.png",
        "/images/governiq/Screenshot 2025-11-30 101040.png",
      ],
      launchUrl: null as string | null,
      launchLabel: "Launch demo",
    },
  ],
} as const;


/* ===== SHARED FINAL CTA (Home + About) ===== */
export const FINAL_CTA = {
  headline: "Ready to see what AI knows about your business?",
  body: "A free 20-minute conversation is the first step. No pitch, no pressure — just a real conversation about your business and what an AI Visibility Index might surface for you.",
} as const;

/* ===== CONTACT ===== */
export const CONTACT = {
  heroHeadline: "Let's talk.",
  heroSubhead:
    "The best first step is a free 20-minute conversation about your business.",
  serviceAreaTitle: "Where I work",
  serviceArea:
    "Marty Koepke is based in Mokelumne Hill, California, and serves small and mid-sized businesses across the United States.",
} as const;

/* ===== AI VISIBILITY INDEX ===== */
export const AVI = {
  /** Hero — one clear promise, one primary CTA to the free check. */
  heroEyebrow: "AI Visibility",
  heroHeadline: "Be found. Be understood. Be represented accurately.",
  /** Italic gold sub-tagline between H1 and subhead. */
  subTagline: "AI is your new introduction. Make sure it gets you right.",
  heroSubhead:
    "Daizie is an AI visibility service by informaticist Marty Koepke that helps founder-led service businesses show up accurately when ChatGPT, Claude, Perplexity, and Gemini describe, cite, and recommend them. Also called AEO or GEO — same discipline, different name.",
  /** Primary CTA and the anchor for the secondary "see the paid offer" link. */
  heroPrimaryCta: {
    label: "Get your free readiness check",
    href: "/scan",
  },
  heroSecondaryCta: {
    label: "See what's in the paid Assessment",
    href: "#compare",
  },
  /** Trust strip below the hero CTAs. Concrete proof of method. */
  heroTrust: [
    "Live AI testing for paid audits",
    "Five readiness drivers",
    "Quantified, prioritized fixes",
    "Built by an enterprise informaticist",
  ],

  /* ---------- Two offers at a glance ---------- */
  /** Section anchor: id="compare". Side-by-side Free vs Paid cards. */
  compareEyebrow: "Two ways in",
  compareHeadline: "Free or full.",
  compareSubhead:
    "Both start with your website. The free check tells you how ready you are. The paid Assessment tells you how AI is actually representing you.",
  compareOffers: [
    {
      id: "free",
      name: "Free Daizie Readiness Check",
      price: "$0",
      priceNote: "30 seconds. No email required.",
      tagline: "A fast, honest read on whether your website gives AI clear signals.",
      whatYouGet: [
        "Your AI Readiness Score across five drivers",
        "A quick check on the profiles AI reads for your business type",
        "Your two or three biggest gaps, in plain English",
        "A clear next step, whether that's fixing your site or booking the Assessment",
      ],
      cta: {
        label: "Run the free check",
        href: "/scan",
        variant: "ghost" as const,
      },
      featured: false,
    },
    {
      id: "paid",
      name: "Daizie AI Visibility Assessment",
      price: "$895",
      priceNote: "One-time. Delivered in 24–48 hours.",
      tagline:
        "The full protocol: live AI testing on four engines, every claim verified, and a plan tuned to your business type.",
      whatYouGet: [
        "Four AI engines tested: ChatGPT, Claude, Perplexity, Gemini",
        "Eight buyer-question queries; 32 live AI responses captured and saved",
        "Every factual AI claim about your business verified against your real sources",
        "Quadrant chart plotting you against two competitors you name",
        "Three readiness fixes and three accuracy fixes, separated and prioritized",
        "30-minute review call with Marty",
      ],
      cta: {
        label: "Book the Assessment",
        href: "BOOK_CALL",
        variant: "primary" as const,
      },
      featured: true,
    },
  ],
  /** Small line below the comparison, above the crosswalk section. */
  compareFootnote:
    "Prefer to talk before you buy? Book a free 20-minute conversation — no pressure.",

  /* ---------- Robust crosswalk ---------- */
  crosswalkEyebrow: "The detail",
  crosswalkHeadline: "What actually changes when you upgrade.",
  crosswalkSubhead:
    "Same starting point, very different job. Here's the honest crosswalk — what each tier measures, what it can and can't claim, and what you walk away with.",
  crosswalkRows: [
    {
      dimension: "What we look at",
      free: "Your website and the profiles AI reads for your business type.",
      paid:
        "Your website, those profiles, plus what live AI systems actually say when your prospects ask.",
    },
    {
      dimension: "How we measure",
      free: "A 30-second automated scan against the five readiness drivers.",
      paid:
        "Live queries to four AI engines; every response captured; every factual claim verified against your real sources.",
    },
    {
      dimension: "AI engines tested",
      free: "None — the free check does not run live AI.",
      paid: "ChatGPT, Claude, Perplexity, Gemini.",
    },
    {
      dimension: "Live AI responses captured",
      free: "0",
      paid: "32 responses (8 queries × 4 engines).",
    },
    {
      dimension: "Claim verification",
      free: "Not included. The free check cannot tell you if AI is misrepresenting your business.",
      paid:
        "Every factual claim labeled supported, unsupported, contradicted, stale, ambiguous, or not verifiable — with source excerpts.",
    },
    {
      dimension: "Competitor comparison",
      free: "Not included.",
      paid:
        "Two named competitors plotted on a Readiness × Visibility quadrant against you, on the same eight queries.",
    },
    {
      dimension: "What you're allowed to honestly claim from the result",
      free:
        "That your website is or isn't ready for AI to understand you, and what the biggest gaps are.",
      paid:
        "Everything the free check says, plus: whether AI mentions you, recommends you, gets your facts right, and how you stack up against competitors.",
    },
    {
      dimension: "Deliverable",
      free: "An on-screen report with your score, master-key check, and top gaps.",
      paid:
        "A three-page artifact — Report, Evidence Ledger, Methodology page — plus a 30-minute review call with Marty.",
    },
    {
      dimension: "Turnaround",
      free: "Instant. About 30 seconds.",
      paid: "24–48 hours after intake, plus your review call.",
    },
    {
      dimension: "Best for",
      free: "Anyone curious. A first look before deciding what to invest in.",
      paid:
        "A defensible baseline before you spend on AI-visibility work, and a real plan you can act on.",
    },
  ],

  /* ---------- Audience-lane story ---------- */
  audienceLanesEyebrow: "How AI treats different businesses",
  audienceLanesHeadline:
    "AI doesn't answer for a local plumber the way it answers for an online consultant.",
  audienceLanesSubhead:
    "The Assessment tunes queries and scoring for your type. This is the research that decides which profiles matter for you — and which don't.",
  audienceLanes: [
    {
      id: "local",
      label: "Local & brick-and-mortar",
      subLabel:
        "Plumbers, restaurants, dentists, salons, retail, home services, medical practices.",
      keys: [
        {
          name: "Google Business Profile",
          why: "Feeds Gemini, Google AI Overviews, and Claude's places lookup.",
        },
        {
          name: "Bing Places",
          why: "Feeds ChatGPT and Microsoft Copilot local answers.",
        },
        {
          name: "Yelp",
          why: "Feeds Perplexity local citations and now ChatGPT (via a 2026 licensing deal).",
        },
      ],
      queryStyle:
        "AI answers this business type with prompts like \"recommend a [category] in [city].\" The Assessment runs those.",
    },
    {
      id: "online_b2b",
      label: "Online consultants, coaches, and agencies",
      subLabel:
        "Fractional executives, marketing agencies, B2B consultants, coaches, professional services delivered remotely.",
      keys: [
        {
          name: "LinkedIn (company + founder)",
          why: "The #1 cited domain for professional queries across every major AI engine.",
        },
        {
          name: "One vertical directory",
          why: "Clutch, G2, Capterra, Avvo, Super Lawyers — whichever one your category actually uses.",
        },
        {
          name: "Current-year listicles",
          why: "88% of AI citations for B2B categories point to third-party \"best [X] 2026\" articles.",
        },
      ],
      queryStyle:
        "AI answers this business type with prompts like \"best [category] for [ICP].\" The Assessment runs those.",
    },
  ],
  audienceLanesFootnote:
    "At intake, you tell us which lane you're in. The Assessment picks the right queries and grades the right signals — no generic average.",

  /* ---------- Inside the paid Assessment ---------- */
  insideAssessmentEyebrow: "What's inside the $895 Assessment",
  insideAssessmentHeadline: "A three-page artifact you can act on.",
  insideAssessmentSubhead:
    "Not a hundred-page report. Three pages that matter — plus every piece of evidence behind them, so you can verify anything and re-run it yourself.",
  insideAssessmentCards: [
    {
      title: "The Report",
      body:
        "Your three public scores — AI Visibility, AI Readiness, AI Business Accuracy — and the composite Business Accuracy Index. Three readiness fixes and three accuracy fixes, separated and prioritized for your business type.",
      icon: "layers",
    },
    {
      title: "The Evidence Ledger",
      body:
        "Every one of the 32 AI responses we captured. Every factual claim we extracted. Every source we checked. Nothing hidden. If you want to re-run it yourself, you can.",
      icon: "search",
    },
    {
      title: "The Methodology page",
      body:
        "How the scoring works, cited to the research it came from. So you can defend the number, share it with your team, or hand it to your web person.",
      icon: "fingerprint",
    },
  ],
  insideAssessmentIncluded:
    "Also included: a 30-minute review call with Marty to walk through what matters most for your business — not everything at once.",

  /* ---------- Monthly Monitoring — small callout ---------- */
  monitoringEyebrow: "After the Assessment",
  monitoringHeadline: "Watch your visibility move over time.",
  monitoringBody:
    "Monthly Monitoring re-runs your full Assessment every month for $149/month. Dashboard of every monthly run, trends across all eleven measurements, and an email when each new report is ready. Two named competitors tracked monthly, one swap allowed per quarter. Available only after your first Assessment.",
  monitoringCta: {
    label: "Ask Marty about Monthly Monitoring",
    href: "BOOK_CALL",
  },

  /** The problem framing - short, visceral, true. */
  problem: [
    "Your customers are increasingly asking AI instead of Google. Best [your industry] near me. Who should I call for [the work you do]? Is [your business] reputable? The answer they get shapes who they trust.",
    "For most small businesses, that answer may skip them, flatten what makes them different, or say something outdated, confused, or quietly wrong.",
    "Our process measures both sides: whether AI can find you, and whether AI is getting the business right. Then it tells you what to fix first.",
  ],

  /** The readiness drivers. */
  dimensionsEyebrow: "What gets measured",
  dimensionsHeadline: "Five readiness drivers. Clearer AI answers.",
  dimensions: [
    {
      icon: "fingerprint",
      name: "Business Clarity",
      body: "Can AI tell who you are, what you do, who you serve, where you work, and what you should be known for?",
    },
    {
      icon: "network",
      name: "Source Support",
      body: "Are the important claims about your business backed by your website, reviews, directories, profiles, articles, or other credible sources?",
    },
    {
      icon: "code",
      name: "AI Readability",
      body: "Is your website structured so crawlers and AI systems can read your pages, services, FAQs, schema, and source material?",
    },
    {
      icon: "search",
      name: "Distinctive Point of View",
      body: "Do you have a clear, supportable reason to be recommended instead of alternatives?",
    },
    {
      icon: "layers",
      name: "Recommendation Fit",
      body: "Is it clear when your business is the appropriate choice, who it is best for, and when it is not the right fit?",
    },
  ],

  /** Org-level section - the brand context before the pricing pitch. */
  orgSection: {
    eyebrow: "How we work",
    headline: "Complementary, not substitutive.",
    bodyParagraphs: [
      "Marty Koepke partners with organizations and professionals who are the recognized experts in their own fields, providing the tools, assessments, and infrastructure that help them adopt AI thoughtfully and improve operational efficiency and AI visibility.",
      "Our role is complementary, not substitutive. A physician remains the medical expert in her practice. An attorney remains the legal expert in his firm. A facility operator remains the operational expert in his business. We bring expertise in AI, software, and process design - and we leave the substantive professional judgment, licensed decision-making, and final implementation choices where they belong: with our clients.",
    ],
    weBring: [
      "AI expertise",
      "Software development",
      "Process design",
      "Measurement methodology",
    ],
    weNeverReplace: [
      "Your professional judgment",
      "Licensed decision-making",
      "Your domain expertise",
      "Final implementation choices",
    ],
  },

  /** Pricing tiers visible on the landing page. */
  pricingEyebrow: "Choose your starting point",
  pricingHeadline: "Three ways in.",
  tiers: [
    {
      id: "scan",
      name: "Free AI Readiness Check",
      price: "$0",
      priceNote: "Live now - no email required",
      tagline: "A fast readiness-only preview.",
      includes: [
        "Website-readiness scan in plain English",
        "Checks business clarity, source support, AI readability, point of view, and recommendation fit",
        "Top 2-3 obvious gaps",
        "No claim that live AI systems recommend you unless live prompts are run",
      ],
      cta: "Run the free check",
      ctaTarget: "SCAN",
      featured: false,
    },
    {
      id: "core-audit",
      name: "AI Business Accuracy Audit",
      price: "$895",
      priceNote: "The paid product",
      tagline: "The full measurement protocol — four engines, every claim verified, two named competitors plotted.",
      includes: [
        "Four AI engines tested: ChatGPT, Claude, Perplexity, Gemini",
        "Eight buyer-question queries, 32 live AI responses captured",
        "Every factual claim AI makes about you verified against your real sources",
        "Quadrant chart placing you against two competitors you name",
        "Three readiness fixes and three accuracy fixes, separated",
        "30-minute review call with Marty to walk through what matters most",
      ],
      cta: "Book the Audit",
      ctaTarget: "BOOK_CALL",
      featured: true,
    },
    {
      id: "monitoring",
      name: "Monthly Monitoring",
      price: "$149/mo",
      priceNote: "After your Audit",
      tagline: "Your full Audit, re-run every month, with a dashboard that tracks your movement over time.",
      includes: [
        "Full audit re-run every month — same four engines, same protocol",
        "A dashboard with all your monthly Audits in one place",
        "Trends view tracking your movement across all 11 measurements",
        "Email when each new report is ready",
        "Same two competitors tracked monthly, with one swap allowed per quarter",
        "Manage your subscription anytime",
      ],
      cta: "Talk to Marty",
      ctaTarget: "BOOK_CALL",
      featured: false,
    },
  ],

  /** What makes this different from generic SEO / AEO tools. */
  differentEyebrow: "Why this is different",
  differentHeadline: "Visibility is only the first question.",
  differentBody: [
    "Most AI SEO tools focus on whether you show up. That matters, but it is not enough.",
    "AI Business Accuracy asks the next questions: Did AI understand you? Did it support what it said? Did it preserve what makes you different? Did it recommend you in right-fit situations?",
    "That is the useful work: not just getting mentioned, but helping AI get your business right.",
  ],

  /** Who this is for / not for. */
  forYouHeadline: "Who this is for",
  forYou:
    "Small business owners with a website who suspect they are being skipped, misunderstood, or flattened when customers ask AI instead of Google. Solo experts, local services, consultancies, professional practices, and founder-led B2B businesses.",
  notForYouHeadline: "Who it isn't for",
  notForYou:
    "Businesses without a public website yet. Anyone hoping for a guaranteed AI ranking. Anyone who wants implementation work before the diagnosis is clear.",

  /** Trust block - Marty's credibility in this specific work. */
  aboutMartyEyebrow: "Who built this",
  aboutMartyHeadline: "Built by an enterprise informaticist who needed it for her own consultancy.",
  aboutMartyBody: [
    "I'm Marty Koepke. Twenty years in enterprise informatics, fifteen-plus driving digital transformation across multi-state systems. System Clinical Informaticist at CommonSpirit Health. Author of Between the Clicks: The Hidden Work of Healthcare Informatics.",
    "I built this because I ran the analysis on my own consultancy and was startled by what AI did not know about me - even though I have a book, an enterprise career, and a documented public history.",
    "The methodology is designed to be auditable: readiness drivers, measured AI outcomes, source support, and plain-English recommendations.",
  ],

  /** FAQ - answers the real objections. */
  faq: [
    {
      q: "What is AI visibility (also called AEO or GEO)?",
      a: "AI visibility is how well your business shows up when someone asks an AI system a question. It's the same discipline whether you call it AI visibility, AEO (answer engine optimization), or GEO (generative engine optimization) — different names for the same work. Daizie is an AI visibility service by informaticist Marty Koepke that helps founder-led service businesses show up accurately when ChatGPT, Claude, Perplexity, and Gemini describe, cite, and recommend them.",
    },
    {
      q: "Is Daizie the same as SEO?",
      a: "No. SEO optimizes for how Google ranks pages in a list of blue links. AI visibility (AEO/GEO) optimizes for how AI systems describe, cite, and recommend your business inside a generated answer — where there is no list, and often no click. Some SEO fundamentals still help, but the measurement is different. Daizie tests what AI actually says about you across four engines, not what page it ranks on.",
    },
    {
      q: "Which AI systems does Daizie test?",
      a: "The four consumer-scale AI systems your prospects are most likely to ask: ChatGPT (OpenAI), Claude (Anthropic), Perplexity, and Gemini (Google). Every paid Assessment runs eight buyer-question queries against each engine — 32 live responses in total — and every factual claim any engine makes about your business is verified against your real sources.",
    },
    {
      q: "How long does the free Readiness Check take?",
      a: "About 30 seconds. The free check reads your website and does a quick presence check on the profiles AI reads for your business type (Google Business Profile / Bing Places / Yelp for local; LinkedIn / one vertical directory / listicles for online B2B). It reports readiness only. It does not claim that live AI systems mention or recommend you — those are live-outcome claims that require the paid Assessment.",
    },
    {
      q: "What's the difference between the free check and the $895 Assessment?",
      a: "The free check tells you if your website is ready for AI to understand you. The paid Daizie AI Visibility Assessment tells you whether AI is actually doing it. We run 32 live queries across ChatGPT, Claude, Perplexity, and Gemini, verify every factual claim AI makes against your real sources, and plot you against two competitors you name. Two different questions — see the crosswalk above.",
    },
    {
      q: "Why does it matter what type of business I am?",
      a: "AI systems pull local recommendations from Google Business Profile, Bing Places, and Yelp — but almost never for online consultants or agencies. Those queries pull from LinkedIn, vertical directories like Clutch or G2 or Avvo, and current-year 'best of' listicles. If the tool doesn't know which lane you're in, it grades you on signals that don't matter for your business. The Assessment tunes queries and scoring for your type at intake.",
    },
    {
      q: "What does Monthly Monitoring include?",
      a: "After your first Assessment, Monthly Monitoring re-runs the full protocol every month for $149/month. You get a dashboard with all your monthly runs, a trends view tracking your movement across all 11 measurements, and an email when each new report is ready. Two named competitors tracked monthly, with one swap allowed per quarter.",
    },
    {
      q: "Will this guarantee AI recommends my business?",
      a: "No. No one can honestly guarantee that. The goal is to improve the evidence AI systems can use, reduce misrepresentation risk, and measure whether visibility and accuracy improve over time.",
    },
    {
      q: "Is this just SEO with a new name?",
      a: "No. Traditional SEO focuses on ranking in search results. This work focuses on how AI systems represent your business in answers: whether they find you, describe you accurately, support claims, preserve context, and recommend you in appropriate situations. Some SEO foundations still matter, but the measurement is different.",
    },
    {
      q: "Do you keep my data private?",
      a: "Yes. We do not sell, share, or train on your submission data. The AI queries we run are public-style business questions, and your report is treated as client work.",
    },
    {
      q: "I'd rather just talk to you first.",
      a: "That's fine. Book a free 20-minute conversation. We'll talk about your business and whether the free check, the Assessment, or ongoing monitoring is the right next step for you.",
    },
  ],

  /** Secondary CTA at the bottom of the page, for talk-first folks. */
  secondaryCta: {
    headline: "Prefer to talk first?",
    body: "Book a free 20-minute conversation. We'll talk about your business and what AI Visibility and Business Accuracy might surface for you.",
  },
} as const;

/* ===== BLOG ===== */
export const BLOG = {
  heading: "Notes",
  comingSoon:
    "Practical writing on AI, process, and reclaiming time for small business owners — coming soon.",
} as const;
