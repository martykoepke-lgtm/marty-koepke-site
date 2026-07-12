---
title: "The AI visibility rabbit hole (and why one Princeton paper isn't the whole story)"
date: 2026-07-12
description: "An ordinary payment processor search sent me into three weeks of research on how AI actually decides which businesses to recommend. Here's what surprised me most: the founding research is real, but it isn't the whole picture. AI treats different kinds of businesses differently."
---

I spent a good stretch of the last two years learning to build. Applications, tools, workflows I'd been thinking about for years but never had the skills to make. I got there. I shipped things I'm proud of.

Then I turned around and needed to run a business.

Which meant I needed to find a payment processor. And that ordinary Tuesday-afternoon errand is what sent me down the next rabbit hole.

## The search that broke my brain

Every merchant option I looked at seemed to charge painful fees. I wanted the one with the lowest per-transaction cost.

So I opened Claude and asked for recommendations. I got a list of three vendors. Fine.

A couple of hours later, in a brand-new chat, I asked again. Sanity check. Same three vendors. Solid list.

Then I got more specific:

> "What electronic payment system for my customers has the lowest percent charge per transaction?"

I fully expected the same three names. Maybe ranked differently. I got a completely different answer.

Same tool. Same topic. Different names.

That confused me enough to stop. I asked Claude why the answers were different. And that is when I started to really learn that AI does not work the way Google works. It is not looking up a list. It is putting an answer together, on the fly, based on what it thinks fits the exact question I asked.

Which meant — and this is the part that got me — the answer changes based on the question. Not just the words. The specificity. The framing. The context.

If AI is now how customers are searching for businesses, and AI is assembling answers this way, what does that mean for people trying to be found?

I lost interest in the payment processor pretty quickly.

## Three weeks in

I fell in. I read research papers. I ran tests across ChatGPT, Claude, Gemini, and Perplexity. I found conflicting numbers, marketing hype dressed up as data, and — underneath all of it — actual answers.

The foundational research turns out to be a 2024 Princeton paper called *GEO: Generative Engine Optimization*, presented at ACM SIGKDD. The team — Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, and Deshpande — built the first benchmark for AI-answer visibility (they call it GEO-bench) and tested nine kinds of content changes on the same source pages. A few of those changes moved the needle a lot. Adding cited statistics, quoting authoritative sources, and using precise, technical language raised what they call "impression score" by up to 41% on the same underlying query. ([Aggarwal et al., 2024 — arXiv](https://arxiv.org/abs/2311.09735))

Read that again: same page, same question, plain rewrite of the content — up to 41% more visibility inside AI answers. That is a real result from real researchers, not a marketing pitch.

That paper is the anchor of a field that basically didn't exist two years ago. Two acronyms circle it — **GEO** (Generative Engine Optimization) and **AEO** (Answer Engine Optimization). Same idea, slightly different framing. Getting AI to recommend you, accurately, when a real buyer asks a real question.

The Princeton team gave the field its first working framework. It is the starting line.

## Where the Princeton paper stops

Here is what surprised me most. Princeton studied the mechanics — what content edits move AI answers — but it did not answer the question a small business owner actually has:

> If I'm a coffee shop, and my neighbor is a SaaS company, and the woman down the street is a life coach — do we all do the same things? Or different things?

The follow-up research is clear. Different things.

Different AI engines pull from different corners of the internet. When ZipTie compared where ChatGPT and Perplexity sourced their answers, they found only about 11% of domains showed up in both. Roughly 71% appeared on only one platform or the other. ([ZipTie — cross-platform citation analysis](https://ziptie.dev/blog/ai-platforms-cite-differently/))

Profound analyzed roughly 30 million citations from a 680-million-record dataset across August 2024 through June 2025. The pattern held: each engine has its favorites. ChatGPT leans on Wikipedia and brand-owned sources. Perplexity leans on Reddit and community discussion. Google's AI Overviews pull heavily from YouTube. Claude leans on long-form blogs and independent publications. ([Search Engine Land — where AI engines cite from](https://searchengineland.com/ai-engines-cite-reddit-youtube-linkedin-most-449876))

And Yext found something even more useful for us. **The mix depends on what kind of question the buyer asked.** Factual queries — "what does this company do," "how much does this cost," "where is it located" — get answered mostly from brand-controlled sources like your website and Wikipedia. That's about 86% of the citations. Opinion queries — "which one is best," "who should I hire," "is this any good" — flip almost entirely the other way, to Reddit, YouTube reviews, and community threads. ([Surfer — how LLM citations work](https://surferseo.com/blog/llm-citations/))

Sit with that for a second.

If you run a coffee shop, most of your buyer's questions are opinion questions. *Best latte in town. Cutest brunch spot. Good place to bring a first date.* That means Google Business Profile, Yelp reviews, Reddit threads about your city, and a couple of local blog mentions do more for you than a perfectly-tuned website.

If you run a SaaS company, most of your buyer's questions are comparison questions. *Best CRM for a two-person team. Cheapest scheduling software with a good API.* That means G2, Capterra, comparison articles, and clean, factual pages on your own site do more for you than pouring energy into Reddit.

If you're a coach or consultant, most of your buyer's questions are advice questions. *How do I switch careers. What does executive coaching actually cost. Do I need a bookkeeper yet.* That means long-form blog posts, LinkedIn, podcast interviews, and being genuinely quoted somewhere reputable do more for you than a Google Business Profile you can't even qualify for.

Same underlying research. Three completely different playbooks.

## What this means for you

Two years ago, being found online meant one thing. Rank on Google. Ten blue links. If you had SEO budget and an agency, you played. If you didn't, you mostly didn't.

That world is not gone. But it is shrinking. Google is now showing an AI-written answer at the top of roughly 25% of US desktop searches. In healthcare, that jumps to nearly half. ([Semrush — AI Overviews coverage data](https://www.semrush.com/blog/ai-overviews-study/)) And when someone lands on your site from an AI recommendation instead of a normal Google search, the traffic converts several times better — the AI has already pre-sold them. Gartner projects traditional search volume will fall roughly 25% by the end of this year. ([Gartner press release, 2024](https://www.gartner.com/en/newsroom/press-releases/2024-02-19-gartner-predicts-search-engine-volume-will-drop-25-percent-by-2026-due-to-ai-chatbots-and-other-virtual-agents))

That is not "search is dead." That is "a quarter of the front door you're used to is closing, and it is opening somewhere new."

Here is the part that is genuinely good news. Google rewards big. Big backlink profiles, big ad budgets, big domain authority. AI does not work that way. AI is looking for the most useful, most specific, most trustworthy answer to a particular question. A solo bookkeeper with three good, specific articles about self-employed taxes can genuinely beat Intuit in an AI answer. That was nearly impossible on Google. It is very possible now.

The catch is that "the most useful answer" looks different depending on what your buyer is asking. And what your buyer is asking depends on what kind of business you run.

## Two tests you can do in a minute

Before I write the next post, do these. They will turn everything I just said from theoretical to something you can feel.

**One. Ask AI about your kind of business.** Open ChatGPT, Claude, or Perplexity. Start a fresh chat. Ask a question the way one of your customers would. Not "best [your job] near me." A full sentence. *"I need [what you do]. I'm in [your city, or my situation is X]. Who should I look at?"* Notice: does it name specific businesses? Which ones? Are you one of them?

**Two. Ask AI about you by name.** New chat. Type: *"What can you tell me about [your business name]?"* You will get one of three answers. It knows you and describes you correctly. It knows you but describes you wrong. Or it has no idea who you are. All three are useful. They tell you exactly where you're starting from.

Write down what you got. You'll want that baseline later.

## What's next

Over the next few posts I'm going to walk through the three playbooks — local, services, and product — one at a time. And I'm going to do something a little unusual for this space. I'm going to run these strategies on my own business, in public, and show you the results. What worked. What didn't. What surprised me. Numbers, screenshots, and honest reports.

I am not an SEO expert. I am not a marketer. I am a business owner who wants to be found. I think you do too.

More soon.

— Marty

---

*Sources referenced in this post: Aggarwal et al., "GEO: Generative Engine Optimization," ACM SIGKDD 2024 ([arXiv:2311.09735](https://arxiv.org/abs/2311.09735)); ZipTie cross-platform citation analysis; Profound AI Platform Citation Patterns study; Search Engine Land coverage of engine citation preferences; Surfer analysis of LLM citation behavior including Yext factual-vs-opinion split; Semrush AI Overviews coverage data; Gartner search-volume forecast, February 2024.*
