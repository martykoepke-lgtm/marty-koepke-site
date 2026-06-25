/**
 * Single source of truth for all site copy.
 * Text is verbatim from the build handoff document. Components import
 * from here so copy is never hardcoded in JSX.
 */

export const SITE = {
  name: "Practical Informatics",
  legalName: "Practical Informatics LLC",
  url: "https://www.practicalinformatics.com",
  tagline: "Applied AI for businesses that want to do this right.",
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
  { label: "About", href: "/about" },
  { label: "AI Visibility", href: "/ai-visibility", emphasized: true },
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
      "Practical Informatics | Applied AI for businesses that want to do this right.",
    description:
      "Practical Informatics LLC is an applied AI consultancy led by Marty Koepke. We provide tools, assessments, and infrastructure that help organizations and professionals adopt AI thoughtfully and improve operational efficiency and AI visibility.",
  },
  about: {
    title: "About Marty Koepke | Practical Informatics",
    description:
      "Marty Koepke (she/her), founder of Practical Informatics LLC. Twenty years in informatics, author of Between the Clicks. Applied AI consulting and custom software development for businesses adopting AI thoughtfully.",
  },
  assessment: {
    title: "The Time Back Assessment | Practical Informatics",
    description:
      "An assessment that maps where your information work is leaking time, then fixes one quick win before we're done. Coming soon as part of the operational AI assessments lineup.",
  },
  aiVisibility: {
    title: "AI Visibility & Business Accuracy | Practical Informatics",
    description:
      "Does AI get your business right? Practical Informatics measures whether AI systems can find, understand, cite, and recommend your business in right-fit situations.",
  },
  blog: {
    title: "Notes | Practical Informatics",
    description:
      "Practical writing on applied AI, AI visibility, and operational efficiency for businesses that want to do this right.",
  },
  contact: {
    title: "Contact | Practical Informatics",
    description:
      "Book a free 20-minute conversation about your business. Practical Informatics is an applied AI consultancy serving businesses across the United States.",
  },
} as const;

/* ===== HOME ===== */
export const HOME = {
  /** Eyebrow above the hero H1 — replaces the geographic eyebrow. */
  heroEyebrow: "Applied AI Consultancy",
  /** Italic gold sub-tagline between H1 and CTAs. The positioning sentence. */
  heroPositioning:
    "Practical Informatics LLC is an applied AI consultancy led by Marty Koepke.",
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
        name: "AI Visibility Snapshot",
        price: "$495",
        note: "Entry paid review",
        description:
          "A focused review of whether AI can find, understand, and describe your business, with a short fix list and walkthrough.",
      },
      {
        name: "AI Business Accuracy Audit",
        price: "$1,950",
        note: "Core offer",
        description:
          "A deeper audit of visibility, accuracy, claim support, context preservation, and recommendation fit.",
      },
      {
        name: "Monthly Monitoring",
        price: "$500/mo",
        note: "After a Snapshot or Audit",
        description:
          "A light monthly watch on AI visibility and accuracy drift, with trend notes and recommended next actions.",
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
  forthcoming: "Time Back Assessments or AI opportunity assessments — coming soon!",

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

/* ===== TIME BACK ASSESSMENT ===== */
export const ASSESSMENT = {
  heroHeadline: "The Time Back Assessment",
  /** Sub-tagline — italic gold treatment, between H1 and subhead.
   *  Carries AI signal above the fold on this page too. */
  subTagline: "On-site observation. AI-fluent analysis. A report you can act on.",
  heroSubhead:
    "A clear-eyed look at where your time and revenue are actually going — and a plain-English plan to get some of both back.",
  /** Trust strip below the hero CTA — same AI-credibility pattern as home.
   *  Capability-led for own builds, named products for enterprise rollouts. */
  heroTrust: [
    "20+ years informatics",
    "AI-powered tools designed & shipped",
    "Enterprise informatics strategy: Abridge, Notable",
    "$26M+ saved",
  ],
  whatsDifferent: [
    "Most AI assessments happen on a Zoom call. This one happens in your business.",
    "I come on-site, watch how the work actually flows, listen more than I talk, and explicitly don't give recommendations in the moment — because the work deserves real thinking, not the first thing that comes to mind.",
    "You'll get the recommendations in writing, in a report I can stand behind. And before we're done, I'll roll up my sleeves and implement one of the quick wins with you — so you don't just have a plan, you have momentum.",
  ],
  notLocal: {
    heading: "What if I'm not local?",
    body: "The on-site visit is the heart of this offer, but it isn't the only way I work. I take on a limited number of remote and hybrid engagements when the work fits the format. Send a note anyway — tell me about your business and we'll figure out together whether this is right for you and what shape it takes.",
  },
  reportBullets: [
    "The 3–5 biggest time leaks I observed, named in plain language",
    "For each one: what's causing it, what it's costing you, and what to do about it",
    "A prioritized list of quick wins — things implementable in under a day each",
    "A short “Bigger Opportunities” section — deeper changes worth a separate conversation",
    "Specific tool recommendations where relevant, with honest notes on whether AI is actually the right answer",
  ],
  /* The Path — the 5-step client journey (repurposed PULSE interaction) */
  path: [
    {
      id: "conversation",
      step: "01",
      title: "A free 20-minute fit conversation",
      short: "Free fit call",
      detail:
        "We'll talk for twenty minutes about your business and figure out together whether the assessment is the right next step. No pitch, no pressure.",
    },
    {
      id: "onsite",
      step: "02",
      title: "A 90-minute on-site visit",
      short: "On-site visit",
      detail:
        "I'll meet you and any key team members, watch the work happen, ask questions, and capture our conversation with an AI notetaking tool so I can focus on listening rather than scribbling notes. I'll be in observation mode — no recommendations on the day. I'll tell you what I'm seeing only after I've had time to think about all of it together.",
    },
    {
      id: "report",
      step: "03",
      title: "A written Time Back Report, within 7 business days",
      short: "Time Back Report",
      detail:
        "The report includes the 3–5 biggest time leaks I observed named in plain language; for each one, what's causing it, what it's costing you, and what to do about it; a prioritized list of quick wins implementable in under a day each; a short “Bigger Opportunities” section for deeper changes worth a separate conversation; and specific tool recommendations where relevant, with honest notes on whether AI is actually the right answer.",
    },
    {
      id: "followup",
      step: "04",
      title: "A 30-minute follow-up call",
      short: "Follow-up call",
      detail:
        "We walk through the report together, answer questions, and pick which quick win we'll implement.",
    },
    {
      id: "quickwin",
      step: "05",
      title: "One implemented quick win",
      short: "Quick win, built",
      detail:
        "Up to 3 hours of my time, hands-on, getting one real thing built or configured in your business. I'll also give you a short written walkthrough of what we built, so you and your team can use it confidently after I leave.",
    },
  ],
  cost: {
    headline: "$1,500 flat. Includes everything above.",
  },
  forYou:
    "Owners of small businesses (typically 1–25 employees) who feel like they're working more hours than the business should require — and who want a partner who'll do the thinking with them, not just hand them a report and walk away.",
  notForYou:
    "Owners looking for someone to just install AI tools without examining the underlying process. Businesses where leadership isn't open to changing how things are done. Anyone who wants the work done remotely — this one is on-site, in your business, by design.",
  noteOnAI: [
    "I use AI throughout this work. To help analyze what I observe. To draft your report. To handle the parts of the work that AI is actually good at.",
    "The reason I tell you this is because part of what you're hiring me for is the judgment about which parts of your business AI should touch and which parts it shouldn't. I won't recommend it where it doesn't belong. I will use it where it does.",
  ],
  faq: [
    {
      q: "How long does the whole thing take from start to finish?",
      a: "About four weeks. One week to schedule the on-site, seven business days for me to deliver the report, then a 30-minute follow-up call and the quick win implementation within two weeks after that.",
    },
    {
      q: "What if I'm not local to Northern California?",
      a: "Reach out anyway — we can talk about it. The on-site format is the heart of this offer, so a remote version isn't equivalent, but I can occasionally make exceptions for businesses that justify the travel.",
    },
    {
      q: "What if I don't see a quick win I want to implement?",
      a: "That happens rarely, but it happens. If the best opportunities in your business are all bigger than a 3-hour fix, I'll credit that time toward the first phase of a larger engagement if you choose to move forward, or you can use it as an extended advisory call to map out the implementation plan together.",
    },
    {
      q: "Do you sign NDAs?",
      a: "Yes, if you'd like one. I have a simple mutual NDA I can send you, or I'm happy to sign yours.",
    },
    {
      q: "What does the on-site visit actually look like?",
      a: "Mostly me watching, asking questions, and listening. I'll want to see how new work comes in, how it moves through your business, where it gets stuck, and how things get tracked. I'll talk with you and any key team members, but the visit isn't a formal interview — it's closer to a working shadow day.",
    },
    {
      q: "Will the recording be private?",
      a: "Yes. The AI notetaking tool I use is HIPAA-compliant and SOC2 certified, and recordings are used only to produce your report. I'll ask for your explicit consent before starting any recording. If you'd prefer no recording, I'll take notes the old-fashioned way.",
    },
    {
      q: "What happens if the assessment doesn't go well?",
      a: "If you read the report and feel it doesn't deliver what I promised, tell me. I'll refund part or all of the fee. I'd rather have a refunded client who tells the truth about their experience than a frustrated client who never says anything.",
    },
    {
      q: "How do I prepare for the on-site?",
      a: "You don't need to. The whole point of the on-site is to see your business as it actually runs, not as a curated version. Don't clean up, don't prepare slides, don't pull together documentation. Just go about your day and let me observe.",
    },
  ],
  finalCta:
    "If this sounds like a fit, the next step is a free 20-minute conversation. We'll talk about your business and figure out together whether the assessment is right for you.",
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
    "Practical Informatics is based in Mokelumne Hill, California, and serves small and mid-sized businesses across the United States.",
} as const;

/* ===== AI VISIBILITY INDEX ===== */
export const AVI = {
  /** Hero - the load-bearing question. */
  heroEyebrow: "AI Visibility + AI Business Accuracy",
  heroHeadline: "We help AI get your business right.",
  /** Italic gold sub-tagline between H1 and subhead. */
  subTagline: "AI Visibility is the doorway. AI Business Accuracy is the framework.",
  heroSubhead:
    "ChatGPT, Claude, Perplexity, and Gemini are answering questions about your industry right now. We test whether AI can find, understand, cite, and recommend your business in right-fit situations.",
  /** Trust strip below the hero CTAs. Concrete proof of method. */
  heroTrust: [
    "Live AI testing for paid audits",
    "Five readiness drivers",
    "Quantified, prioritized fixes",
    "Built by an enterprise informaticist",
  ],

  /** The problem framing - short, visceral, true. */
  problem: [
    "Your customers are increasingly asking AI instead of Google. Best [your industry] near me. Who should I call for [the work you do]? Is [your business] reputable? The answer they get shapes who they trust.",
    "For most small businesses, that answer may skip them, flatten what makes them different, or say something outdated, confused, or quietly wrong.",
    "Our process measures both sides: whether AI can find you, and whether AI is getting the business right. Then it tells you what to fix first.",
  ],

  /** The V3 readiness drivers. */
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
      "Practical Informatics LLC partners with organizations and professionals who are the recognized experts in their own fields. We provide the tools, assessments, and infrastructure that help them adopt AI thoughtfully and improve operational efficiency and AI visibility.",
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
  pricingHeadline: "Five ways in.",
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
      id: "snapshot",
      name: "AI Visibility Snapshot",
      price: "$495",
      priceNote: "Focused paid review",
      tagline: "A practical first look at how AI understands your business.",
      includes: [
        "Focused live AI visibility review",
        "Business accuracy and obvious misrepresentation checks",
        "Light competitor and source gap review",
        "Short fix list ranked by practical next step",
        "Walkthrough call with Marty",
      ],
      cta: "Get the Snapshot",
      ctaTarget: "STRIPE_LINK_REPORT",
      featured: true,
    },
    {
      id: "core-audit",
      name: "AI Business Accuracy Audit",
      price: "$1,950",
      priceNote: "Core audit",
      tagline: "The full measurement protocol for AI visibility and accuracy.",
      includes: [
        "Readiness drivers plus measured AI outcomes",
        "Live AI testing across the agreed prompt set",
        "Representation accuracy and claim-support review",
        "Context preservation and recommendation-fit assessment",
        "Prioritized remediation roadmap",
      ],
      cta: "Book a fit call",
      ctaTarget: "BOOK_CALL",
      featured: false,
    },
    {
      id: "implementation",
      name: "Implementation Planning",
      price: "Scoped after audit",
      priceNote: "Not sold before diagnosis",
      tagline: "We define what to fix before offering an implementation sprint.",
      includes: [
        "Translate audit findings into a work plan",
        "Identify which fixes belong to site copy, schema, source support, or positioning",
        "Separate quick wins from larger content or authority work",
        "Quote an implementation sprint only after scope is known",
      ],
      cta: "Talk through implementation",
      ctaTarget: "BOOK_CALL",
      featured: false,
    },
    {
      id: "monitoring",
      name: "Monthly Monitoring",
      price: "$500/mo",
      priceNote: "After a Snapshot or Audit",
      tagline: "Track whether AI visibility and business accuracy are drifting or improving.",
      includes: [
        "Monthly rerun of a lightweight prompt set",
        "Visibility and accuracy drift notes",
        "Citation/source changes worth watching",
        "Competitor movement highlights",
        "Monthly action note; optional quarterly deep re-measure if needed",
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
      q: "Is this AI Visibility, GEO, or AEO?",
      a: "AI Visibility, GEO, and AEO are the doorway. AI Business Accuracy is the framework behind this service. We measure whether AI can find your business, understand it, support what it says, and recommend it in right-fit situations.",
    },
    {
      q: "How long does the free Readiness Check take?",
      a: "About 30 seconds. The free check reads your website and looks for readiness signals: business clarity, source support, AI readability, distinctive point of view, and recommendation fit. It does not claim that live AI systems recommend you unless live prompts are actually run.",
    },
    {
      q: "What is in the $495 AI Visibility Snapshot?",
      a: "The Snapshot is a focused paid review. It gives you a practical first look at whether AI can find, understand, and describe your business, plus obvious source gaps, misrepresentation risks, and a short prioritized fix list.",
    },
    {
      q: "What is different about the $1,950 AI Business Accuracy Audit?",
      a: "The Core Audit is the full protocol. It measures readiness drivers and live AI outcomes: visibility, representation accuracy, claim support, context preservation, recommendation quality, and stability where enough runs exist. It is the right choice when you need a defensible baseline and a serious remediation roadmap.",
    },
    {
      q: "Why not sell an implementation sprint immediately?",
      a: "Because we should not quote implementation before we know what needs fixing. Some businesses need copy cleanup. Some need schema. Some need source support, directories, reviews, citations, or sharper positioning. The audit defines the work before a sprint is scoped.",
    },
    {
      q: "What does Monthly Monitoring include?",
      a: "Monthly Monitoring is a lighter recurring check for $500/month after a Snapshot or Audit. It reruns a focused prompt set, watches for visibility or accuracy drift, notes citation/source changes, flags competitor movement, and gives you a short monthly action note.",
    },
    {
      q: "How is monthly monitoring different from quarterly re-measure?",
      a: "Monthly monitoring is a lightweight pulse check. A quarterly re-measure is a deeper audit-style rerun using the fuller protocol to compare progress against the original baseline. For now, the clean offer is $500/month monitoring, with a quarterly deep re-measure treated as an optional add-on when a client needs it.",
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
      q: "I would rather just talk to you first.",
      a: "That is fine. Book a free 20-minute conversation. We can talk about your business and whether the free check, Snapshot, Core Audit, monitoring, or future implementation work is the right next step.",
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
