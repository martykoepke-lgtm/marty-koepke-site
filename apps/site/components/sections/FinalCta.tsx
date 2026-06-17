import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { FINAL_CTA } from "@/lib/content";
import { BOOK_CALL_HREF, BOOK_CALL_LABEL } from "@/lib/links";

/** Calm forest-green closing section shared by Home, About, Assessment. */
export default function FinalCta({
  headline = FINAL_CTA.headline,
  body = FINAL_CTA.body,
}: {
  headline?: string;
  body?: string;
}) {
  return (
    <Section tone="forest" width="narrow" className="text-center">
      <Reveal>
        <h2 className="text-3xl sm:text-4xl">{headline}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-cream/80">{body}</p>
        <div className="mt-9">
          <Button href={BOOK_CALL_HREF} variant="onForest">
            {BOOK_CALL_LABEL}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
