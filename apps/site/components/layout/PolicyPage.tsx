import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import GetTermsEmbed from "@/components/embeds/GetTermsEmbed";

/**
 * Shared shell for the four policy routes. Calm cream layout, serif h1,
 * narrow reading column, and a GetTerms embed in the body.
 */
export default function PolicyPage({
  title,
  intro,
  gettermsSlug,
}: {
  title: string;
  intro?: string;
  gettermsSlug: string;
}) {
  return (
    <Section tone="cream" width="narrow">
      <Reveal>
        <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
          Practical Informatics LLC
        </p>
        <h1 className="mt-3 text-4xl text-forest sm:text-5xl">{title}</h1>
        {intro && (
          <p className="mt-5 max-w-2xl text-lg text-moss">{intro}</p>
        )}
      </Reveal>

      <Reveal className="mt-10">
        <article className="prose-policy">
          <GetTermsEmbed document={gettermsSlug} title={title} />
        </article>
      </Reveal>
    </Section>
  );
}
