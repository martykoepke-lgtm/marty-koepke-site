import Link from "next/link";
import Section from "@/components/ui/Section";
import { ArrowRightIcon } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <Section width="narrow" className="text-center">
      <p className="font-serif text-sm uppercase tracking-wide text-gold-dark">
        404
      </p>
      <h1 className="mt-3 text-4xl text-forest sm:text-5xl">
        This path doesn&apos;t lead anywhere.
      </h1>
      <p className="mx-auto mt-5 max-w-md text-lg text-moss">
        The page you were looking for isn&apos;t here. Let&apos;s get you back
        to something useful.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-forest px-7 py-3.5 font-medium text-cream transition-colors hover:bg-forest-dark"
      >
        Back to home
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </Section>
  );
}
