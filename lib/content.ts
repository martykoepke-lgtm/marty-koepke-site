/**
 * Single source of truth for all site copy.
 * Components import from here so copy is never hardcoded in JSX.
 */

export const SITE = {
  name: "Practical Informatics",
  legalName: "Practical Informatics LLC",
  url: "https://www.practicalinformatics.com",
  tagline: "Become the answer when AI is asked about your business.",
  /** Generic location for legal entity; not headlined as a service constraint. */
  location: "California",
  foundingYear: 2024,
  foundingDate: "2024-08-13",
  caSosEntityNumber: "202463415854",
  /** Practical Informatics works with clients nationwide; AVI is delivered remotely. */
  serviceArea: ["United States"],
  serviceAreaText: "Working with established small businesses across the United States",
} as const;

export type NavItem = {
  label: string;
  href: string;
  emphasized?: boolean;
};

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "AI Visibility Index", href: "/ai-visibility-index", emphasized: true },
  // Blog is intentionally hidden from nav until the first posts ship.
  { label: "Contact", href: "/contact" },
];

/** Policy routes, also surfaced in the footer. */
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
      "Practical Informatics | Become the answer when AI is asked about your business.",
    description:
      "The AI Visibility Index audits how your business appears across ChatGPT, Claude, and Gemini — then shows you the top five things to fix. For established small professional-service firms whose buyers research before they decide.",
  },
  about: {
    title: "About Marty Koepke | Practical Informatics",
    description:
      "Marty Koepke (she/her), founder of Practical Informatics LLC. Twenty years in informatics, process improvement, and AI implementation. Author of Between the Clicks.",
  },
  avi: {
    title: "The AI Visibility Index | Practical Informatics",
    description:
      "Find out exactly what ChatGPT, Claude, and Gemini say about your business — and the top five things to fix. Six-dimension scorecard, live LLM tests, 30-minute walk-through call. $697.",
  },
  assessment: {
    title: "The Time Back Assessment | Practical Informatics",
    description:
      "A custom process and workflow assessment, available as a deeper engagement for clients who want more than the AI Visibility Index.",
  },
  blog: {
    title: "Notes | Practical Informatics",
    description:
      "Practical writing on AI visibility, process improvement, and helping small businesses become the answer when AI is asked.",
  },
  contact: {
    title: "Contact | Practical Informatics",
    description:
      "Book a free 20-minute conversation about your AI visibility or your business operations.",
  },
} as const;

/* ===== HOME ===== */
export const HOME = {
  /** Sub-tagline sits between the H1 and the intro paragraph in the hero. */
  subTagline:
    "Find out what ChatGPT, Claude, and Gemini are saying about you — and fix it before your buyers ask.",
  /** Hero eyebrow — replaces the old geographic locator. */
  heroEyebrow: "AI Visibility · For Established Small Businesses",
  /** Trust strip below the hero CTAs. Generic professional credentials, no employer-specific references. */
  heroTrust: [
    "20+ years informatics",
    "Process improvement, LSS Black Belt",
    "AI-powered tools designed & shipped",
    "Author, Between the Clicks",
  ],
  /** Two sentences. Mobile hero shows the first; sm+ shows both. */
  heroIntro: [
    "When your buyers ask ChatGPT, Claude, or Gemini for a recommendation in your category, you're either named — or you're not.",
    "The AI Visibility Index is a six-dimension audit of how AI sees your business, with the top five things you can do to change the answer.",
  ],
  problem: [
    "Something quietly changed in the last 18 months: a meaningful share of your buyers stopped Googling and started asking an AI agent — ChatGPT, Claude, Gemini, Perplexity — for recommendations in your category. They never click through to your site. They never appear in your analytics. The AI either named you or it didn't, and you have no idea which.",
    "By every credible measure, 70-plus percent of B2B buyers now research vendors using AI. Consumers do the same for restaurants, travel, services, almost everything. The discovery layer moved, and most established small businesses haven't noticed because the change is invisible inside Google Analytics.",
    "The good news: the fixes are mostly mechanical. The hard part isn't the work — it's knowing what AI is saying about you in the first place, and which fixes will actually move the needle.",
  ],
  whatIDo: [
    {
      icon: "pin",
      headline: "I scan",
      body: "I crawl your site, run live queries against Claude, ChatGPT, and Gemini — three times each — and capture exactly what they say about you, your category, and your competition.",
    },
    {
      icon: "lightbulb",
      headline: "I score",
      body: "A six-dimension AI Visibility Index scorecard, plus a 10-page report with your top five prioritized fixes — ranked by impact per hour of effort, not alphabetical.",
    },
    {
      icon: "check",
      headline: "I walk you through it",
      body: "A 30-minute call to explain what AI is saying, why it's saying it, what to fix first, and what it'll move. Plain English. No SEO theater. Decisions you can act on.",
    },
  ],
  /** "What gets measured" — the 6 dimensions of the AVI. Replaces the old AI-integration list. */
  whereAIFits: {
    eyebrow: "What gets measured",
    headline: "Six dimensions that decide whether AI recommends your business.",
    subtitle:
      "Each dimension scored against your live web presence and what three LLMs actually say about you. Six numbers, one total score, a tier, and the top five things to fix.",
    list: [
      "Founder credibility — whether AI knows who runs your business, what your background is, and why buyers should trust you.",
      "Live AI test — real queries run against Claude, ChatGPT, and Gemini, three runs each, capturing what they actually said.",
      "Entity clarity — whether AI knows exactly who and where you are, with no confusion against similarly-named businesses.",
      "Methodology depth — whether your approach, framework, or service has a name and a defensible explanation an AI can repeat.",
      "Structured data — whether your site speaks the machine-readable language (schema, llms.txt, robots.txt) that LLMs use to index you.",
      "Agent and citation graph — whether the broader web (third-party mentions, directory listings, structured profiles) reinforces what your site says.",
    ],
  },
  differentiation: {
    eyebrow: "How I think about this",
    headline: "Built by an operator, not by a SaaS dashboard.",
    body:
      "Most AI visibility tools are dashboards built by SEO firms that bolted on a 'GEO module' last year. They give you a score, dump 50 issues on you, and walk away. I'm a 20-year informatics operator who built this from the inside — because I needed it for my own business first. The audit you get is the same one I designed for myself. I do the audit, I do the call, and I help you decide what to fix first. No auto-generated 50-item lists. No SEO theater. Just the top five things that actually move the score.",
    closing:
      "If you want a real audit by someone who built it for themselves first, you're in the right place.",
  },
  whoIAm: [
    "Hi, I'm Marty.",
    "For twenty years I've worked at the intersection of operations, technology, and people — helping organizations figure out where the work breaks down and how to fix it intelligently. Most of that has been in healthcare informatics, the most complex information environment that exists.",
    "I built the AI Visibility Index because I needed it for my own business first. AI is now the discovery channel I can't see in my analytics. Before I asked anyone else to trust my findings about their business, I had to figure out what AI was saying about mine. Then I productized it.",
    "We all have gifts. Mine is standing between people and the technology they need to use — and making sure it's working for them, not the other way around.",
  ],
} as const;

/* ===== ABOUT ===== */
export const ABOUT = {
  heroHeadline:
    "Twenty years in informatics. Now helping small businesses get found by AI.",
  story: [
    "For fifteen-plus years I've worked inside health systems — the most complex information environment that exists — watching brilliant people get buried under workflows and technology that weren't designed for the way they actually work. The tools vary, but the diagnosis is always the same.",
    "What I learned, over those years, is that almost no organization has actually mapped where its own time and attention go. We feel like we're drowning, blame ourselves, work longer hours, and don't step back to ask if the work is organized right in the first place. That's true in a health system. It's true in a consulting practice, an agency, a SaaS startup, a brick-and-mortar shop.",
    "What's changed in the last couple of years is two things. First, AI made many of the fixes much easier — if you know what to fix in the first place. Second, AI itself became a discovery layer: your buyers are asking ChatGPT and Claude for recommendations about who to call, and you have no idea what they're hearing. The first is an internal problem; the second is an external one.",
    "Practical Informatics exists at the intersection of those two things. The AI Visibility Index is the flagship product — a focused, productized audit that tells you exactly what AI is saying about your business and the top five things to do about it. Built by someone who built it for themselves first.",
  ],
  principles: [
    {
      headline: "Process before tools",
      body: "Most 'AI problems' are actually process problems wearing a costume. I look at how things flow before I recommend any technology — sometimes the answer is AI, sometimes it's a smarter process and no AI at all.",
    },
    {
      headline: "AI only where it belongs",
      body: "AI is a tool, not a religion. I use it where it's genuinely the right answer, and I'll tell you plainly when it isn't.",
    },
    {
      headline: "Top five, not top fifty",
      body: "A 50-item fix list isn't actionable; it's overwhelming. The audit surfaces what I find, but the recommendations are the five highest-leverage moves. Do those first, then come back.",
    },
    {
      headline: "Plain language, every time",
      body: "No jargon, no buzzwords, no 100-page reports nobody reads. If I can't explain a recommendation to you in plain English, it isn't a recommendation worth making.",
    },
  ],
  credentials:
    "Twenty years in healthcare informatics. Fifteen-plus driving enterprise-wide digital transformation across multiple states and EHR platforms. Master of Health Administration (Ashford University). Author of Between the Clicks: The Hidden Work of Healthcare Informatics. Lean Six Sigma Black Belt. Lean Six Sigma Green Belt. Certified SAFe 6.0 Agilist. Scrum Master. Epic Clinical Informaticist Certification.",
  recentWork:
    "Recent enterprise informatics work spans front-office automation, ambient AI documentation, and clinical quality measure programs — driving measurable operational gains across multiple states and EHR platforms. The methods that worked at enterprise scale are the same methods I bring to small business work — only smaller, more personal, faster.",
  backgroundEyebrow: "Background",
  backgroundHeadline: "Enterprise-scale informatics. Small-business practice.",
  backgroundIntro:
    "Twenty years in healthcare informatics. Fifteen-plus driving enterprise-wide digital transformation across multiple states and EHR platforms. Author of Between the Clicks: The Hidden Work of Healthcare Informatics. The methods that worked at enterprise scale are the same ones that work for small businesses — scaled down, made personal, made fast.",
  outcomeStats: [
    {
      value: "20+ yrs",
      label: "Informatics",
      context: "Healthcare and enterprise",
    },
    {
      value: "Multi-state",
      label: "Enterprise scale",
      context: "Across EHR platforms",
    },
    {
      value: "End-to-end",
      label: "AI apps shipped",
      context: "Designed, built, deployed",
    },
    {
      value: "LSS-BB",
      label: "Process improvement",
      context: "Six Sigma Black Belt",
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

/* ===== AI VISIBILITY INDEX (flagship product) ===== */
export const AVI = {
  heroHeadline: "The AI Visibility Index",
  subTagline:
    "Find out what ChatGPT, Claude, and Gemini are saying about your business.",
  heroSubhead:
    "A six-dimension audit of how AI sees your business — with the top five things you can do to change the answer. Delivered in five business days.",
  heroTrust: [
    "Live LLM tests across Claude, ChatGPT, Gemini",
    "Six-dimension scorecard",
    "Top-5 prioritized fix list",
    "30-minute walk-through call",
  ],
  whatItIs: [
    "The AI Visibility Index (AVI) is a full audit of how AI agents — ChatGPT, Claude, and Gemini — describe your business when your buyers ask about you, your category, or your competition.",
    "It's the discovery channel you can't see in Google Analytics. When a prospective customer asks ChatGPT 'who should I call for X?,' you're either named or you're not. If you're not, you've lost a lead you never knew existed.",
    "The audit surfaces what AI is saying, what it's getting wrong, what it's missing — and exactly what to do about it, in priority order, with effort estimates.",
  ],
  whatsDifferent: [
    "Most AI visibility tools are dashboards built by SEO firms that bolted on a 'GEO module' last year. They give you a score, dump 50 issues on you, and walk away.",
    "The AVI is delivered by a person — me — who reads the actual LLM responses, makes a judgement call on which fixes will actually move the score, and walks you through it on a real call.",
    "Five business days from purchase to delivery. Then a 30-minute call. Then you decide what to do — fix it yourself, hand it to your team, or have me implement the top five for you in the Implementation Sprint.",
  ],
  dimensions: [
    {
      title: "Founder credibility",
      body: "Whether AI knows who runs your business, what your background is, and why buyers should trust you. Person schema, sameAs links, published work, verifiable credentials.",
    },
    {
      title: "Live AI test",
      body: "Real queries run against Claude, ChatGPT, and Gemini — three runs each — capturing exactly what they said about your business and your competition.",
    },
    {
      title: "Entity clarity",
      body: "Whether AI knows exactly who and where you are. No confusion against similarly-named businesses. Consistent NAP across the web. Clean disambiguation.",
    },
    {
      title: "Methodology depth",
      body: "Whether your approach, framework, or service has a name AI can recognize. Named methodology, transparent pricing, who-it's-for content, defensible explanation.",
    },
    {
      title: "Structured data",
      body: "Whether your site speaks the machine-readable language LLMs use. Organization schema, Person schema, Service schema, FAQPage, llms.txt, validated JSON-LD.",
    },
    {
      title: "Agent and citation graph",
      body: "Whether the broader web reinforces what your site says. Robots.txt agent permissions, third-party mentions, directory listings, external profile cross-links.",
    },
  ],
  whatYouGet: [
    "A 10-page AVI Report (PDF + hosted URL) with your score, your tier, and your top five prioritized fixes",
    "Live LLM tests — Claude, ChatGPT, Gemini, three runs each — with the actual text each model produced about your business",
    "A six-dimension scorecard with a radar chart and a one-line plain-English assessment of each",
    "A top-five fix list, prioritized by impact-per-hour-of-effort, with what to do and why it matters",
    "A projected post-fix score showing what 60 days of focused work moves you to",
    "A 30-minute walk-through call to explain the findings, answer questions, and pick what to fix first",
  ],
  cost: {
    headline: "$697 flat. Includes everything above.",
    sub: "Delivered in five business days. Want it done for you instead of done-with-you? The Implementation Sprint is $3,997 — two weeks, top five fixes shipped, plus a 60-day re-scan.",
  },
  forYou:
    "Established small professional-service firms — coaches, consultants, agencies, SaaS, brick-and-mortar businesses where buyers research before they decide. Typically $500K–$10M in revenue, with at least some marketing budget. If your buyers Google or ChatGPT you before they call you, this is for you.",
  notForYou:
    "Pre-revenue businesses without a real web presence. Hobbyist projects. Businesses whose customers find them entirely via walk-in or word-of-mouth (most local trades, neighborhood retail). AI-native solopreneurs already running their own LLM testing — you don't need me.",
  noteOnAI: [
    "I use AI throughout this work — to query the LLMs themselves, to help analyze responses, to help draft your report.",
    "The reason I tell you this is because part of what you're hiring me for is the judgement about what to surface, what to prioritize, and what's worth your time to fix. I won't recommend a fix unless I can explain why it moves the score. The judgement stays mine.",
  ],
  faq: [
    {
      q: "What's actually in the report?",
      a: "Ten pages: your AVI score on the cover, a one-page executive summary, two pages of live LLM test results with the actual text from Claude, ChatGPT, and Gemini, a six-dimension scorecard, and three pages of the top five prioritized fixes. Then a one-page projected-score visual and a brief methodology note. No filler.",
    },
    {
      q: "Why three LLMs and not just one?",
      a: "Because they disagree. Claude might know you; ChatGPT might not. Reporting on a single model gives you a noisy, partial picture. Running each query against three models, three runs each, gives a real signal — and tells you exactly which platforms need work.",
    },
    {
      q: "How long does the audit take to deliver?",
      a: "Five business days from purchase to delivery. The walk-through call is usually scheduled within two weeks after.",
    },
    {
      q: "Why only top five fixes? Don't you find more issues than that?",
      a: "Yes — usually 15 to 25. But a 50-fix list isn't useful; it's overwhelming. The top five are the ones with the highest impact-per-hour-of-effort. Do those, then come back for the next five. The full prioritized list is in the report appendix.",
    },
    {
      q: "Do I have to fix any of this myself?",
      a: "No, but you can. The report is plain English. If you have a web developer or marketing team, they can execute most of it. If you'd rather have it done for you, the Implementation Sprint is $3,997 — two weeks, top five fixes shipped, with a 60-day re-scan.",
    },
    {
      q: "What if my business has almost no online presence?",
      a: "Then you'll score low, and the report will reflect that honestly. The top-five list shifts toward foundational work — a canonical About page, structured data, building an entity graph from scratch. You still get a real plan with a real starting point.",
    },
    {
      q: "Will the score change month to month?",
      a: "Yes. LLMs are stochastic and the web updates constantly. We run each query three times to give you a real signal, but variance is real. Most clients see a 25–40 point lift in 60 days if they execute the top five fixes.",
    },
    {
      q: "Do you sign NDAs?",
      a: "Yes. I have a simple mutual NDA, or I'm happy to sign yours.",
    },
  ],
  finalCta:
    "Want to know what AI is saying about your business? The next step is a free 20-minute conversation. We'll talk about your business and figure out together whether the AVI is the right fit.",
} as const;

/* ===== TIME BACK ASSESSMENT (kept accessible; not in main nav) =====
 *  This is a deeper custom engagement available to clients who want
 *  more than the AVI. The page still works at /time-back-assessment
 *  for direct links and for clients who specifically request it. */
export const ASSESSMENT = {
  heroHeadline: "The Time Back Assessment",
  subTagline: "On-site observation. AI-fluent analysis. A report you can act on.",
  heroSubhead:
    "A clear-eyed look at where your time and revenue are actually going — and a plain-English plan to get some of both back. A deeper engagement than the AI Visibility Index, available for clients who want it.",
  heroTrust: [
    "20+ years informatics",
    "AI-powered tools designed & shipped",
    "Process improvement, LSS Black Belt",
    "Custom engagement",
  ],
  whatsDifferent: [
    "Most AI assessments happen on a Zoom call. This one happens in your business.",
    "I come on-site, watch how the work actually flows, listen more than I talk, and explicitly don't give recommendations in the moment — because the work deserves real thinking, not the first thing that comes to mind.",
    "You'll get the recommendations in writing, in a report I can stand behind. And before we're done, I'll roll up my sleeves and implement one of the quick wins with you — so you don't just have a plan, you have momentum.",
  ],
  notLocal: {
    heading: "Where I work",
    body: "The on-site visit is the heart of this engagement, but I take on a limited number of remote and hybrid versions when the work fits the format. Send a note — tell me about your business and we'll figure out together whether this is right for you and what shape it takes.",
  },
  reportBullets: [
    "The 3–5 biggest time leaks I observed, named in plain language",
    "For each one: what's causing it, what it's costing you, and what to do about it",
    "A prioritized list of quick wins — things implementable in under a day each",
    "A short 'Bigger Opportunities' section — deeper changes worth a separate conversation",
    "Specific tool recommendations where relevant, with honest notes on whether AI is actually the right answer",
  ],
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
      title: "A 90-minute on-site or deep virtual visit",
      short: "Deep observation",
      detail:
        "I'll meet you and any key team members, watch the work happen, ask questions, and capture our conversation with an AI notetaking tool so I can focus on listening rather than scribbling notes. I'll be in observation mode — no recommendations on the day. I'll tell you what I'm seeing only after I've had time to think about all of it together.",
    },
    {
      id: "report",
      step: "03",
      title: "A written Time Back Report, within 7 business days",
      short: "Time Back Report",
      detail:
        "The report includes the 3–5 biggest time leaks I observed named in plain language; for each one, what's causing it, what it's costing you, and what to do about it; a prioritized list of quick wins implementable in under a day each; a short 'Bigger Opportunities' section for deeper changes worth a separate conversation; and specific tool recommendations where relevant, with honest notes on whether AI is actually the right answer.",
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
    "Established small business owners who feel like they're working more hours than the business should require — and who want a partner who'll do the thinking with them, not just hand them a report and walk away. Available as a custom engagement on top of the AI Visibility Index.",
  notForYou:
    "Owners looking for someone to just install AI tools without examining the underlying process. Businesses where leadership isn't open to changing how things are done.",
  noteOnAI: [
    "I use AI throughout this work. To help analyze what I observe. To draft your report. To handle the parts of the work that AI is actually good at.",
    "The reason I tell you this is because part of what you're hiring me for is the judgment about which parts of your business AI should touch and which parts it shouldn't. I won't recommend it where it doesn't belong. I will use it where it does.",
  ],
  faq: [
    {
      q: "How long does the whole thing take from start to finish?",
      a: "About four weeks. One week to schedule the visit, seven business days for me to deliver the report, then a 30-minute follow-up call and the quick win implementation within two weeks after that.",
    },
    {
      q: "Is this on-site or remote?",
      a: "On-site is the original format and works best. I take on a limited number of remote and hybrid versions when the work fits the format. Reach out and we'll figure out together what shape this takes for your business.",
    },
    {
      q: "What if I don't see a quick win I want to implement?",
      a: "That happens rarely, but it happens. If the best opportunities are all bigger than a 3-hour fix, I'll credit that time toward a larger engagement if you move forward, or you can use it as an extended advisory call to map out the implementation plan together.",
    },
    {
      q: "Do you sign NDAs?",
      a: "Yes. I have a simple mutual NDA I can send you, or I'm happy to sign yours.",
    },
    {
      q: "How does this relate to the AI Visibility Index?",
      a: "The AVI is the productized, focused product — outward-facing, $697, five business days. The Time Back Assessment is the deeper, custom engagement — inward-facing, $1,500, four-week timeline. Many clients start with the AVI and add the Time Back when they want the full operational picture.",
    },
  ],
  finalCta:
    "If this sounds like a fit, the next step is a free 20-minute conversation. We'll talk about your business and figure out together whether the assessment is right for you.",
} as const;

/* ===== SHARED FINAL CTA ===== */
export const FINAL_CTA = {
  headline: "Want to know what AI is saying about your business?",
  body: "A free 20-minute conversation is the easiest first step. No pitch, no pressure — just a real conversation about your business and whether the AI Visibility Index is the right fit.",
} as const;

/* ===== CONTACT ===== */
export const CONTACT = {
  heroHeadline: "Let's talk.",
  heroSubhead:
    "The best first step is a free 20-minute conversation about your business.",
  serviceAreaTitle: "Where I work",
  serviceArea:
    "Practical Informatics works with established small businesses nationwide. The AI Visibility Index is delivered remotely; the Time Back Assessment is offered on-site or remote depending on fit. I'm based in California; clients are everywhere.",
} as const;

/* ===== BLOG ===== */
export const BLOG = {
  heading: "Notes",
  comingSoon:
    "Practical writing on AI visibility, process improvement, and what's actually working — coming soon.",
} as const;
