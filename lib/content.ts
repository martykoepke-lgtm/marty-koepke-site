/**
 * Single source of truth for all site copy.
 * Text is verbatim from the build handoff document. Components import
 * from here so copy is never hardcoded in JSX.
 */

export const SITE = {
  name: "Practical Informatics",
  legalName: "Practical Informatics LLC",
  url: "https://www.practicalinformatics.com",
  tagline: "Reclaim your time. Run a smarter business.",
  location: "Mokelumne Hill, California",
  foundingYear: 2024,
  foundingDate: "2024-08-13",
  caSosEntityNumber: "202463415854",
  serviceArea: ["Calaveras County", "Amador County", "Tuolumne County"],
  serviceAreaText: "Serving Calaveras, Amador, and Tuolumne counties",
} as const;

export type NavItem = {
  label: string;
  href: string;
  emphasized?: boolean;
};

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Assessment", href: "/time-back-assessment", emphasized: true },
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
      "Practical Informatics | Reclaim Your Time. Run a Smarter Business.",
    description:
      "Reclaim your time. Run a smarter foothills business. Practical Informatics helps small business owners in Calaveras, Amador, and Tuolumne counties map where time and revenue are going — then fix it with smarter workflows, the right tools, and AI where it actually fits.",
  },
  about: {
    title: "About Marty Koepke | Practical Informatics",
    description:
      "Marty Koepke (she/her), founder of Practical Informatics. Twenty years in healthcare informatics — now combining that experience with innovative AI to design and build custom applications for foothills small businesses.",
  },
  assessment: {
    title: "The Time Back Assessment | Practical Informatics",
    description:
      "An on-site assessment for foothills small businesses. We map where your information work is leaking time, then fix one quick win before we're done. $1,500.",
  },
  aiVisibility: {
    title: "The AI Visibility Index | Practical Informatics",
    description:
      "When AI is asked about your business, what does it say? The AI Visibility Index audits how findable your business is to ChatGPT, Claude, and Gemini — and shows you exactly where you're being missed. Free scan; full audit $497.",
  },
  blog: {
    title: "Notes from the Foothills | Practical Informatics",
    description:
      "Practical writing on information work, smarter processes, and reclaiming time for small business owners in the California foothills.",
  },
  contact: {
    title: "Contact | Practical Informatics",
    description:
      "Book a free 20-minute conversation about your business. Practical Informatics serves Calaveras, Amador, and Tuolumne counties.",
  },
} as const;

/* ===== HOME ===== */
export const HOME = {
  /** Sub-tagline sits between the H1 and the intro paragraph in the hero.
   *  Carries the AI signal above the fold without dethroning the main tagline. */
  subTagline: "Smarter work, smarter tools, AI where it actually fits.",
  /** Trust strip below the hero CTAs. Concrete, scale-anchored credentials.
   *  Distinguishes between (a) AI-powered tools Marty has personally built
   *  and shipped (capabilities, not unknown product names) and (b) the
   *  vendor AI rollouts he led at enterprise scale (named products). */
  heroTrust: [
    "AI-powered tools designed & shipped",
    "Enterprise informatics strategy: Abridge, Notable",
    "Multi-state, multi-EHR",
    "$26M+ saved",
  ],
  /** Two sentences. Mobile hero shows the first; sm+ shows both. */
  heroIntro: [
    "If you run a small business in the California foothills and you're working too many hours on tasks that shouldn't take this long — you're in the right place.",
    "I help foothills businesses get a handle on the work that's eating your time and revenue — smarter workflows, the right tools, and AI where it actually fits.",
  ],
  problem: [
    "Most small business owners I meet are working fifty or sixty hours a week, and spending half of that time on tasks they shouldn't have to do themselves. Copying information between systems. Answering the same email for the hundredth time. Chasing the same details over and over. Keeping track of things by memory because no tool quite fits.",
    "The hard part isn't the work itself. It's that nobody has stepped back to look at how the work flows in the first place. Once you do — once you actually map where the time goes — most of it turns out to be fixable.",
  ],
  whatIDo: [
    {
      icon: "pin",
      headline: "I come on-site",
      body: "A 90-minute visit in your business, watching how the work actually happens. No recommendations on the day — just listening, observing, and learning.",
    },
    {
      icon: "lightbulb",
      headline: "I do the thinking",
      body: "A written Time Back Report, delivered within seven business days, with the patterns I observed and a prioritized plan to fix them.",
    },
    {
      icon: "check",
      headline: "I implement one fix",
      body: "Before we're done, we'll roll up our sleeves and get one quick win in place — so you don't just have a plan, you have momentum.",
    },
  ],
  /** A simple scrollable list of concrete AI work. Subtitle frames the
   *  whole list as one umbrella claim; the list items prove it with
   *  specific capabilities. Each line starts with a clean verb. */
  whereAIFits: {
    eyebrow: "AI Integration",
    headline: "What I've actually done with AI.",
    subtitle: "I combine years of experience with innovative AI to design and build custom applications that solve real problems.",
    list: [
      "Led enterprise informatics strategy for Abridge and Notable — system integration design and market readiness across multiple states and EHR platforms.",
      "Designed and built custom web applications using AI — taking real business problems from sketch to shipped, working software.",
      "Designed and shipped AI-powered conversational guides (chatbots) that walk users through complex multi-step processes in plain language.",
      "Built classification and routing intelligence embedded in real business workflows.",
      "Designed voice-first AI capture systems — spoken input flows through speech-to-text into an AI extraction layer that codifies free narrative into typed, queryable records. Replaces the manual data entry that kills most tracking workflows.",
      "Use AI in client delivery — analyzing patterns from on-site observation, drafting your report. Judgment stays mine.",
    ],
  },
  differentiation: {
    eyebrow: "How I think about this",
    headline: "I fix the work, not just the technology.",
    body: "Most “AI transformation” advice starts with the tool and works backward to the problem. I work the other way. I look at where information moves through your business — customer intake, data, day-to-day admin, the tracking nobody quite keeps up with — and find what takes too long, what feels too manual, and what just plain annoys someone. Then we fix it. Sometimes the answer is AI. Often it’s a smarter process, a better tool, or something custom made just for you. I’ll tell you plainly which is which.",
    closing:
      "If the work wearing you out is information work, you're in the right place.",
  },
  whoIAm: [
    "Hi, I'm Marty.",
    "For fifteen years inside health systems I watched brilliant people get buried under workflows and technology that weren't designed for the way they actually work. I helped fix that there. Now I'm helping local business owners do the same.",
    "My family moved to the foothills five years ago, and we absolutely love it. The people I want to serve now are my neighbors. This community helped train my two sons for futures of their own. It helped facilitate my oldest son's engagement. They cut my hair. I eat their amazing food.",
    "We all have gifts. Mine is standing between people and the technology they need to use — and making sure AI gets implemented intelligently, when it actually fits.",
  ],
} as const;

/* ===== ABOUT ===== */
export const ABOUT = {
  heroHeadline:
    "Twenty years inside health systems. Now serving the foothills.",
  story: [
    "My family moved to the foothills five years ago, and we absolutely love it. For fifteen-plus years I've worked inside health systems — watching brilliant people get buried under workflows and technology that weren't designed for the way they actually work. The tools vary — electronic health records, clinical workflows, regulatory systems — but the diagnosis is always the same.",
    "What I learned, over those years, is that almost no organization has actually mapped where its own time goes. We feel like we're drowning, blame ourselves, work longer hours, and don't step back to ask if the work is organized right in the first place. That's true in a health system. It's true in a winery, a contractor's shop, an accounting practice, a small law firm.",
    "What's changed in the last couple of years is what's possible to do about it. AI didn't make the pattern — the pattern's been there forever. But AI made a lot of the fixes much easier, if you know what to fix in the first place. Most of the “AI for small business” content out there skips that question. I don't.",
    "These are the people I want to serve. My neighbors. The community that helped train my two sons for futures of their own, that helped facilitate my oldest son's engagement, that cuts my hair, that feeds me their amazing food. I'm based in Mokelumne Hill, and I work with small businesses across Calaveras, Amador, and Tuolumne counties. We all have gifts. Mine is standing between people and the technology they need to use — and making sure AI gets implemented intelligently, when it actually fits.",
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
      headline: "Local first, always",
      body: "I come on-site. I shake your hand. I watch the work happen. The foothills run on trust and proximity, and remote consulting can't replace that.",
    },
    {
      headline: "Plain language, every time",
      body: "No jargon, no buzzwords, no hundred-page reports nobody reads. If I can't explain a recommendation to you in plain English, it isn't a recommendation worth making.",
    },
  ],
  credentials:
    "Twenty years in healthcare, fifteen-plus driving enterprise-wide digital transformation. Master of Health Administration (Ashford University). System Clinical Informaticist at CommonSpirit Health, working across 2,500+ ambulatory care facilities. Author of Between the Clicks: The Hidden Work of Healthcare Informatics. Lean Six Sigma Black Belt. Lean Six Sigma Green Belt. Certified SAFe 6.0 Agilist. Scrum Master. Epic Clinical Informaticist Certification.",
  recentWork:
    "Recent enterprise work includes enabling Notable RPA implementation across 350 clinics — reducing patient check-in from 10 to 2 minutes and generating $26M+ in annual labor savings; piloting Abridge AI ambient documentation with 222 providers (14.7% documentation time reduction); and leading quality measure initiatives that drove a 42% improvement in Medicare Annual Wellness Visits ($1.3M revenue lift). The methods that worked at enterprise scale are the same methods I bring to foothills small businesses — only smaller, more personal, and on your premises.",
  /** Structured background data for the visually appealing Background section.
   *  Bio statement, stat cards, and credentials chips. */
  backgroundEyebrow: "Background",
  backgroundHeadline: "Enterprise-scale informatics. Foothills-scale practice.",
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
      label: "Healthcare informatics",
      context: "Enterprise + foothills",
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
    "Owners of small businesses (typically 1–25 employees) in Calaveras, Amador, or Tuolumne counties who feel like they're working more hours than the business should require — and who want a partner who'll do the thinking with them, not just hand them a report and walk away.",
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
      q: "What if I'm outside Calaveras, Amador, or Tuolumne counties?",
      a: "Reach out anyway — we can talk about it. The on-site format is the heart of this offer, so a remote version isn't equivalent, but I can occasionally make exceptions for businesses in the broader region.",
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
  headline: "Ready to see where your time and revenue are going?",
  body: "A free 20-minute conversation is the first step. No pitch, no pressure — just a real conversation about your business and whether the Time Back Assessment is the right next step.",
} as const;

/* ===== CONTACT ===== */
export const CONTACT = {
  heroHeadline: "Let's talk.",
  heroSubhead:
    "The best first step is a free 20-minute conversation about your business.",
  serviceAreaTitle: "Where I work",
  serviceArea:
    "Practical Informatics is based in Mokelumne Hill and serves small businesses across Calaveras, Amador, and Tuolumne counties. For businesses outside this area, reach out anyway — we can talk about it.",
} as const;

/* ===== AI VISIBILITY INDEX ===== */
export const AVI = {
  /** Hero — the load-bearing question. */
  heroEyebrow: "The AI Visibility Index",
  heroHeadline: "When AI is asked about your business, what does it say?",
  /** Italic gold sub-tagline between H1 and subhead. */
  subTagline: "Six dimensions. Real LLM queries. One clear number.",
  heroSubhead:
    "ChatGPT, Claude, and Gemini are answering questions about your industry right now. The AI Visibility Index shows you exactly what they're saying — and where you're being missed.",
  /** Trust strip below the hero CTAs. Concrete proof of method. */
  heroTrust: [
    "Live queries across 4 AI systems",
    "Six-dimension scoring rubric",
    "Quantified, prioritized fixes",
    "Built by an enterprise informaticist",
  ],

  /** The problem framing — short, visceral, true. */
  problem: [
    "Your customers are increasingly asking AI instead of Google. “Best [your industry] near me.” “Who should I call for [the work you do]?” “Is [your business] reputable?” The answer they get is the answer that wins them.",
    "For most small businesses, that answer doesn't include you — or worse, it's outdated, confused, or quietly wrong. You don't see it happen. You only see fewer inbound calls than the quality of your work should produce.",
    "The AI Visibility Index measures exactly what's happening, in plain numbers, with quoted evidence. Then it tells you what to fix first.",
  ],

  /** The six dimensions — approachable language, not jargon. */
  dimensionsEyebrow: "What gets measured",
  dimensionsHeadline: "Six dimensions, weighted for your stage of business.",
  dimensions: [
    {
      icon: "user",
      name: "Founder Credibility",
      body: "How findable your background, credentials, and published work are — the human evidence AI uses to decide whether to recommend you.",
    },
    {
      icon: "search",
      name: "Live AI Test",
      body: "What ChatGPT, Claude, and Gemini actually say when asked about your business. Quoted in your report.",
    },
    {
      icon: "fingerprint",
      name: "Entity Clarity",
      body: "Whether AI can tell you apart from similar-named people, businesses, and look-alike domains. Most small businesses are bleeding here.",
    },
    {
      icon: "layers",
      name: "Methodology Depth",
      body: "Whether your offer, pricing, and approach are extractable in plain language — not buried in marketing copy.",
    },
    {
      icon: "code",
      name: "Structured Data",
      body: "The machine-readable layer (schema.org, llms.txt, FAQ markup) that lets AI quote you accurately instead of guessing.",
    },
    {
      icon: "network",
      name: "Agent + Citation Graph",
      body: "Where you appear across the web that AI is reading — directories, references, agent permissions, citations.",
    },
  ],

  /** Pricing tiers visible on the landing page. */
  pricingEyebrow: "Choose your starting point",
  pricingHeadline: "Two ways in.",
  tiers: [
    // Free Scan tier hidden until the lightweight /scan page is built.
    // Restore this block when /scan is live with the URL-only quick scan.
    // {
    //   id: "scan",
    //   name: "Free AI Visibility Scan",
    //   price: "$0",
    //   priceNote: "No card required",
    //   tagline: "A preliminary score in ~10 seconds.",
    //   includes: [
    //     "Real scan of your website if you have one (schema, llms.txt, robots.txt, surface signals)",
    //     "Works without a URL too — we'll still check AI search visibility for your category",
    //     "A preliminary AVI score (0–100) and tier",
    //     "2–3 of the most obvious findings, in plain language",
    //   ],
    //   cta: "Run my free scan",
    //   ctaTarget: "/scan",
    //   featured: false,
    // },
    {
      id: "report",
      name: "AI Visibility Report",
      price: "$497",
      priceNote: "Delivered within 24 hours",
      tagline: "The full audit, plus a 30-minute walk-through call.",
      includes: [
        "Live queries against ChatGPT, Claude, and Gemini — quoted in your report",
        "Side-by-side comparison with two competitors AI is recommending instead of you",
        "All six dimensions scored, with explanations",
        "Top 10 prioritized fixes with effort + impact estimates",
        "Your projected 60-day score if you implement",
        "A 30-minute walk-through call with Marty",
      ],
      cta: "Get the full report",
      ctaTarget: "STRIPE_LINK_REPORT", // wired to env var
      featured: true,
    },
    {
      id: "sprint",
      name: "Agentic Readiness Sprint",
      price: "$2,997",
      priceNote: "Two-week implementation · 60-day re-scan included",
      tagline: "Want it done for you? Every fix in your report, implemented.",
      includes: [
        "Site credentials updated, founder dossier built, Person + Service + FAQ schema written",
        "Google Business Profile set up and optimized",
        "llms.txt and robots.txt configured for AI crawlers",
        "Amazon Author Central, Wikidata, and citation cleanup",
        "A 60-day re-scan to measure the actual AVI movement",
        "A 30-minute walk-through call when it's complete",
      ],
      cta: "Book a 20-min fit call",
      ctaTarget: "BOOK_CALL", // book a call first — Sprint isn't a self-serve purchase
      featured: false,
    },
  ],

  /** What makes this different from generic SEO / AEO tools. */
  differentEyebrow: "Why this is different",
  differentHeadline: "The live AI test changes everything.",
  differentBody: [
    "Most “AI SEO” tools check whether your structured data is well-formed. That's table stakes — necessary but not sufficient.",
    "The AI Visibility Index runs real queries against the actual AI systems your customers are using, captures what they say about you (or fail to say), and quotes it back to you. You don't have to take my word for what AI thinks — you see it.",
    "That moment — reading what ChatGPT actually returned when asked about you — is the moment the work becomes obvious.",
  ],

  /** Who this is for / not for. */
  forYouHeadline: "Who this is for",
  forYou:
    "Small business owners with a website who suspect they're being skipped over when customers ask AI instead of Google. Solo experts, local services, consultancies, professional practices, founder-led B2B. Especially valuable if your category has clear local or niche positioning that should be a moat — but AI doesn't yet know it.",
  notForYouHeadline: "Who it isn't for",
  notForYou:
    "Businesses without a public website yet. Anyone hoping for a magic-bullet ranking score with no work attached — the report is the diagnosis, not the cure. Anyone who wants to argue the methodology before seeing the data.",

  /** Trust block — Marty's credibility in this specific work. */
  aboutMartyEyebrow: "Who built this",
  aboutMartyHeadline: "Built by an enterprise informaticist who needed it for her own foothills business.",
  aboutMartyBody: [
    "I'm Marty Koepke. Twenty years in healthcare informatics, fifteen-plus driving enterprise-wide digital transformation across multi-state health systems. System Clinical Informaticist at CommonSpirit Health. Author of Between the Clicks: The Hidden Work of Healthcare Informatics.",
    "I built the AI Visibility Index because I ran the analysis on my own consulting practice and was startled by what AI didn't know about me — even though I have a book, an enterprise career, and a documented public history. If it was hard for me, it's harder for the small businesses I serve.",
    "The methodology in this report is the same one I use on my own work. Same rubric, same queries, same prioritization formula.",
  ],

  /** FAQ — answers the real objections. */
  faq: [
    {
      q: "How long does the free scan actually take?",
      a: "About 10 seconds. The scan fetches your homepage and checks a few specific things — your structured data, your llms.txt and robots.txt, whether your founder is named, whether your offer is clearly priced. You get the preliminary score, the tier you fall into, and 2–3 of the most obvious findings on the spot.",
    },
    {
      q: "What's in the $497 report that's not in the free scan?",
      a: "The live AI test — real queries run against ChatGPT, Claude, and Gemini, with the answers quoted directly. A side-by-side comparison with two competitors AI is recommending instead of you. All six dimensions scored with explanations. The top 10 prioritized fixes with effort and impact estimates. Your projected 60-day score. And a 30-minute walk-through call with me.",
    },
    {
      q: "Why $497? What am I actually paying for?",
      a: "You're paying for two things you can't get cheaply elsewhere: the live AI queries (each audit costs me real money in API fees across four AI providers) and the judgment that ranks the fixes by what will actually move your score. A typical SEO audit is $2,500–5,000 and doesn't include any of this. I've priced this to be the smallest reasonable bet on the question.",
    },
    {
      q: "What's the Sprint, and how is it different from the Report?",
      a: "The Report is the diagnosis — what's wrong, why it matters, what to do about it. The Sprint is the cure — I implement every fix in your report over two weeks. Schema, llms.txt, Google Business Profile, founder dossier, structured data, citation building. Plus a 60-day re-scan to measure the lift. $2,997 includes everything.",
    },
    {
      q: "Do you do refunds?",
      a: "Yes. If you read the report and feel it doesn't deliver what I promised, tell me. I'll refund part or all of the fee. I'd rather have a refunded client who tells the truth than a frustrated one who never says anything.",
    },
    {
      q: "Does this work for my industry?",
      a: "Yes, if AI is being asked about your industry at all. The AVI rubric works for solo experts, local services, consultancies, professional practices, e-commerce, and founder-led B2B. The dimensions and weights adjust by archetype, so a brand-new solo practice and a 10-year multi-location firm are graded on the right curve for each.",
    },
    {
      q: "Is this just SEO with a new name?",
      a: "No. Traditional SEO is about ranking in Google's results. The AI Visibility Index is about being correctly understood and recommended when customers use AI assistants — ChatGPT, Claude, Gemini — instead of Google. They draw on different signals: live queries, structured data, citation graphs, agent permissions. Some overlap with classical SEO, much doesn't.",
    },
    {
      q: "Do you keep my data private?",
      a: "Yes. Your submission stores your email and URL. We never sell, share, or train on your data. The AI queries we run are public-style questions (“tell me about [your business]”) — the same kind anyone could run. See our privacy policy for the full picture.",
    },
    {
      q: "I'd rather just talk to you first.",
      a: "Sure. Book a free 20-minute conversation — link below. We can talk about your business and whether the Report or the Sprint is the right next step. No pitch, no pressure.",
    },
  ],

  /** Secondary CTA at the bottom of the page, for talk-first folks. */
  secondaryCta: {
    headline: "Prefer to talk first?",
    body: "Book a free 20-minute conversation. We'll talk about your business and what the AVI might surface for you.",
  },
} as const;

/* ===== BLOG ===== */
export const BLOG = {
  heading: "Notes from the foothills",
  comingSoon:
    "Practical writing on AI, process, and reclaiming time for small business owners — coming soon.",
} as const;
