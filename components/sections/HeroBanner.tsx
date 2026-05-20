"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SITE, HOME } from "@/lib/content";
import { BOOK_CALL_HREF, BOOK_CALL_LABEL } from "@/lib/links";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Home hero. A calm golden-hour foothills photo with the headline and
 * primary CTA both placed above the fold. Constrained height so a typical
 * phone or laptop viewer never has to scroll to find "schedule a call."
 * Motion is restrained: a slow background drift and a breathing gold
 * sun-glow. Fully reduced-motion safe.
 */
export default function HeroBanner() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Practical Informatics — smart AI for small businesses"
      className="relative w-full overflow-hidden bg-forest"
      style={{ height: "min(90vh, 820px)", minHeight: "560px" }}
    >
      {/* Background photo */}
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.06 }}
        animate={reduce ? undefined : { scale: 1.0 }}
        transition={{ duration: 14, ease: EASE }}
      >
        <Image
          src="/images/hero-bg.jpg"
          alt="A great oak overlooking the rolling Calaveras County foothills at golden hour."
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "70% 50%" }}
        />
      </motion.div>

      {/* Forest gradient overlay for text legibility on the left */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-forest/85 via-forest/55 to-transparent"
      />
      {/* Soft bottom fade to ease into the next section */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream/40"
      />

      {/* Breathing gold sun-glow on the right (matches the photo's sun) */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(28% 38% at 75% 38%, rgba(201,169,97,0.28), transparent 70%)",
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <motion.div
            className="max-w-2xl text-cream"
            initial={reduce ? false : "hidden"}
            animate={reduce ? undefined : "visible"}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
            }}
          >
            <Fade>
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold">
                Calaveras · Amador · Tuolumne
              </p>
            </Fade>
            <Fade>
              <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
                {SITE.tagline}
              </h1>
            </Fade>
            <Fade>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85 sm:text-xl">
                {HOME.heroIntro[0]}
                <span className="hidden sm:inline"> {HOME.heroIntro[1]}</span>
              </p>
            </Fade>
            <Fade>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href={BOOK_CALL_HREF} variant="onForest">
                  {BOOK_CALL_LABEL}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
                <Button href="/time-back-assessment" variant="onPhoto">
                  See how it works
                </Button>
              </div>
            </Fade>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
