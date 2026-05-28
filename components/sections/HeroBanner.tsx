"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SITE, HOME } from "@/lib/content";
import { BOOK_CALL_HREF } from "@/lib/links";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Home hero. Foothills landscape photo with slow parallax + a forest
 * gradient wash on the left so the cream type reads cleanly against the
 * dark side of the image, with the sun-side oak left visible on the
 * right. Eyebrow → "Smart AI for small businesses." h1 → intro line →
 * primary (cream-on-forest) + secondary (outlined cream-on-photo) CTAs.
 * Subtle breathing gold sun-glow that matches the sun in the photo.
 * Fully reduced-motion safe.
 */
export default function HeroBanner() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <section
      ref={ref}
      aria-label="Practical Informatics — become the answer when AI is asked about your business"
      className="relative w-full overflow-hidden bg-forest"
      style={{ height: "min(90vh, 820px)", minHeight: "560px" }}
    >
      {/* Background landscape with subtle parallax drift */}
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y, scale: 1.06 }}
      >
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "70% 50%" }}
        />
      </motion.div>

      {/* Forest gradient on the left — lifts the cream type off the
          photo and keeps the sun-side oak visible on the right. */}
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

      {/* Upper-left content */}
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <motion.div
            className="max-w-2xl text-cream"
            initial={reduce ? false : "hidden"}
            animate={reduce ? undefined : "visible"}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12, delayChildren: 0.15 },
              },
            }}
          >
            <Fade>
              <p className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                {HOME.heroEyebrow}
              </p>
            </Fade>
            <Fade>
              <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
                {SITE.tagline}
              </h1>
            </Fade>
            <Fade>
              <p className="mt-4 max-w-xl font-serif text-lg italic leading-relaxed text-gold sm:text-xl">
                {HOME.subTagline}
              </p>
            </Fade>
            <Fade>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/85 sm:text-xl">
                {HOME.heroIntro[0]}
                <span className="hidden sm:inline"> {HOME.heroIntro[1]}</span>
              </p>
            </Fade>
            <Fade>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/ai-visibility-index" variant="onForest">
                  See the AI Visibility Index
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
                <Button href={BOOK_CALL_HREF} variant="onPhoto">
                  Book a free 20-minute call
                </Button>
              </div>
            </Fade>
            <Fade>
              <div className="mt-7 max-w-xl border-t border-cream/15 pt-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-cream/55 sm:text-xs">
                  {HOME.heroTrust.map((item, i) => (
                    <span key={i}>
                      {i <= 1 ? (
                        <span className="text-gold/85">{item}</span>
                      ) : (
                        item
                      )}
                      {i < HOME.heroTrust.length - 1 && (
                        <span className="mx-2 text-cream/30">·</span>
                      )}
                    </span>
                  ))}
                </p>
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
