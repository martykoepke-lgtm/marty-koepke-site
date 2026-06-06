import type { Metadata } from "next";
import ScanForm from "@/components/ai-visibility/ScanForm";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Order Your AI Visibility Index | Practical Informatics",
  description:
    "Order your AI Visibility Index — a six-dimension audit of how AI sees your business, delivered in 3 business days.",
  alternates: { canonical: "/ai-visibility/order" },
  openGraph: {
    title: "Order Your AI Visibility Index | Practical Informatics",
    description:
      "Order your AI Visibility Index. Six dimensions, real LLM queries, delivered in 3 business days.",
    url: `${SITE.url}/ai-visibility/order`,
  },
};

export default function OrderPage() {
  return (
    <Section tone="cream" width="narrow">
      <Reveal>
        <div className="text-center">
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            Order Your AI Visibility Index
          </p>
          <h1 className="mt-3 text-4xl text-forest sm:text-5xl">
            A few questions, then we get to work.
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-moss">
            So we can run the right queries against ChatGPT, Claude, and Gemini
            and benchmark you against the right competitors. Three business days
            from submission to your report.
          </p>
        </div>
      </Reveal>

      <div className="mt-12">
        <ScanForm />
      </div>
    </Section>
  );
}
