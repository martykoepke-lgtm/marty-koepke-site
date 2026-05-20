/**
 * Single source of truth for all site copy.
 * Text is verbatim from the build handoff document. Components import
 * from here so copy is never hardcoded in JSX.
 */

export const SITE = {
  name: "Practical Informatics",
  legalName: "Practical Informatics LLC",
  url: "https://www.practicalinformatics.com",
  tagline: "Smart AI for small businesses.",
  location: "Mokelumne Hill, California",
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
      "Practical Informatics | Smart AI for small businesses",
    description:
      "Practical Informatics brings smart AI to small businesses in Calaveras, Amador, and Tuolumne counties — without the AI-hype.",
  },
  about: {
    title: "About Marty Koepke | Practical Informatics",
    description:
      "Fifteen years inside health systems making complicated work simpler — now helping foothills small businesses do the same.",
  },
  assessment: {
    title: "The Time Back Assessment | Practical Informatics",
    description:
      "An on-site assessment for foothills small businesses. Identify where your time is going, fix one quick win before we're done. $1,500.",
  },
  blog: {
    title: "Notes from the Foothills | Practical Informatics",
    description:
      "Practical writing on AI, process, and reclaiming time for small business owners in the California foothills.",
  },
  contact: {
    title: "Contact | Practical Informatics",
    description:
      "Book a free 20-minute conversation about your business. Practical Informatics serves Calaveras, Amador, and Tuolumne counties.",
  },
} as const;

/* ===== HOME ===== */
export const HOME = {
  /** Two sentences. Mobile hero shows the first; sm+ shows both. */
  heroIntro: [
    "If you run a small business in the foothills and you're working too many hours on tasks that shouldn't take this long — you're in the right place.",
    "I help local business owners look at where their time is actually going, and use AI and smarter process to get some of it back.",
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
  differentiation: {
    eyebrow: "How I think about this",
    headline: "I'm not another AI guru. I'm here to fix the work.",
    body: 'Most "AI transformation" advice starts with the tool and works backwards to the problem. I work the other way around. I look at where information moves through your business — customer intake, data processing, day-to-day admin — and find what takes too long, what feels too manual, and what just plain annoys someone. Then we fix it. Sometimes the answer is AI. Often it\'s smarter process, a better tool, or maybe something custom that is made just for you. I\'ll tell you plainly which is which.',
    closing:
      "If the work wearing you out is information work, you're in the right place.",
  },
  whoIAm: [
    "Hi, I'm Marty.",
    "I spent fifteen years inside health systems figuring out why smart, hard-working people were spending half their day on busywork — or doing work completely manually — instead of doing what they were actually good at.",
    "My family moved to the foothills five years ago, and we absolutely love it. The people I want to serve now are my neighbors. This community helped train my two sons for futures of their own. It helped facilitate my oldest son's engagement. They cut my hair. I eat their amazing food.",
    "We all have gifts. Mine is standing between end users and the technology they need to use — and I know how to leverage AI.",
  ],
} as const;

/* ===== ABOUT ===== */
export const ABOUT = {
  heroHeadline:
    "Fifteen years inside health systems. Now serving the neighbors who serve us.",
  story: [
    "My family moved to the foothills five years ago, and we absolutely love it. The fifteen years before that I spent inside health systems, trying to figure out why smart, hard-working people were spending half their day on busywork — or doing work completely manually — instead of doing what they were actually good at.",
    "My background is in clinical informatics. Fifteen years helping health systems figure out where the work was getting stuck and how to make it flow better. The tools were different — electronic health records, clinical workflows, regulatory systems — but the problem was the same: smart people drowning in busywork because nobody had stopped to look at how the work actually moved.",
    "What I learned, over those fifteen years, is that almost no organization has actually mapped where its own time goes. We feel like we're drowning, blame ourselves, work longer hours, and don't step back to ask if the work is organized right in the first place. That's true in a health system. It's true in a winery, a contractor's shop, an accounting practice, a small law firm.",
    "What's changed in the last couple of years is what's possible to do about it. AI didn't make the pattern — the pattern's been there forever. But AI made a lot of the fixes much easier, if you know what to fix in the first place. Most of the “AI for small business” content out there skips that question. I don't.",
    "These are the people I want to serve. My neighbors. The community that helped train my two sons for futures of their own, that helped facilitate my oldest son's engagement, that cuts my hair, that feeds me their amazing food. I'm based in Mokelumne Hill, and I work with small businesses across Calaveras, Amador, and Tuolumne counties. We all have gifts. Mine is standing between end users and the technology they need to use — and I know how to leverage AI.",
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
    "Master of Health Administration. System Clinical Informaticist at CommonSpirit Health, working across 2,500+ ambulatory care facilities. Author of Between the Clicks: The Hidden Work of Healthcare Informatics. Lean Six Sigma Green Belt (Black Belt in progress). SAFe 6.0 Agilist. Certified Scrum Master.",
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
  heroSubhead:
    "A clear-eyed look at where your time is actually going — and a plain-English plan to get some of it back.",
  whatsDifferent: [
    "Most AI assessments happen on a Zoom call. This one happens in your business.",
    "I come on-site, watch how the work actually flows, listen more than I talk, and explicitly don't give recommendations in the moment — because the work deserves real thinking, not the first thing that comes to mind.",
    "You'll get the recommendations in writing, in a report I can stand behind. And before we're done, I'll roll up my sleeves and implement one of the quick wins with you — so you don't just have a plan, you have momentum.",
  ],
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
  headline: "Ready to see where your time is going?",
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

/* ===== BLOG ===== */
export const BLOG = {
  heading: "Notes from the foothills",
  comingSoon:
    "Practical writing on AI, process, and reclaiming time for small business owners — coming soon.",
} as const;
