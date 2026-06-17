"use client";

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { ASSESSMENT } from "@/lib/content";
import { CloseIcon } from "@/components/ui/Icons";

/**
 * "The Path" — the five-step Time Back Assessment journey.
 *
 * Repurposes the old PULSE circuit interaction: a connecting line that
 * draws itself as the section enters view, nodes that illuminate in
 * sequence, and a layoutId morph from node → detail card on click.
 * Calm-toned (forest/gold, no neon), slow easing, fully reduced-motion safe.
 */

const EASE = [0.22, 0.61, 0.36, 1] as const;
const STEPS = ASSESSMENT.path;

export default function ThePath() {
  const [selected, setSelected] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const active = STEPS.find((s) => s.id === selected);

  const lineInitial = reduce ? { scaleX: 1 } : { scaleX: 0 };
  const lineVInitial = reduce ? { scaleY: 1 } : { scaleY: 0 };

  return (
    <div className="relative">
      {/* ===== Desktop: horizontal path ===== */}
      <div className="relative hidden md:block">
        {/* Connecting line that draws on view */}
        <motion.div
          aria-hidden="true"
          className="absolute left-[10%] right-[10%] top-7 h-px origin-left bg-tan"
          initial={lineInitial}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.4, ease: EASE }}
        />
        <motion.ol
          className="relative flex justify-between"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
          }}
        >
          {STEPS.map((step) => (
            <motion.li
              key={step.id}
              className="flex w-1/5 flex-col items-center px-2 text-center"
              variants={{
                hidden: reduce ? {} : { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: EASE },
                },
              }}
            >
              <motion.button
                layoutId={reduce ? undefined : `path-${step.id}`}
                type="button"
                onClick={() => setSelected(step.id)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-forest bg-cream font-serif text-lg text-forest transition-colors hover:bg-forest hover:text-cream"
                aria-label={`Step ${step.step}: ${step.title}`}
              >
                {step.step}
              </motion.button>
              <h3 className="mt-4 text-base text-forest">{step.short}</h3>
              <p className="mt-1 text-sm text-moss">
                Step {Number(step.step)} of 5
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>

      {/* ===== Mobile: vertical path ===== */}
      <div className="relative md:hidden">
        <motion.div
          aria-hidden="true"
          className="absolute bottom-7 left-7 top-7 w-px origin-top bg-tan"
          initial={lineVInitial}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.4, ease: EASE }}
        />
        <ol className="relative space-y-7">
          {STEPS.map((step) => (
            <li key={step.id} className="flex items-center gap-5">
              <motion.button
                layoutId={reduce ? undefined : `path-m-${step.id}`}
                type="button"
                onClick={() => setSelected(step.id)}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-forest bg-cream font-serif text-lg text-forest"
                aria-label={`Step ${step.step}: ${step.title}`}
              >
                {step.step}
              </motion.button>
              <div>
                <h3 className="text-base text-forest">{step.short}</h3>
                <p className="text-sm text-moss">Tap to read more</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-12 text-center text-sm text-moss">
        Select any step to see what it involves.
      </p>

      {/* ===== Detail card (morph from node) ===== */}
      <AnimatePresence>
        {active && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-forest/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelected(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                layoutId={reduce ? undefined : `path-${active.id}`}
                role="dialog"
                aria-modal="true"
                aria-label={active.title}
                className="relative w-full max-w-lg rounded-xl border border-tan bg-cream p-8"
                initial={reduce ? { opacity: 0 } : false}
                animate={reduce ? { opacity: 1 } : undefined}
                exit={reduce ? { opacity: 0 } : undefined}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <button
                  type="button"
                  className="absolute right-4 top-4 text-moss transition-colors hover:text-forest"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
                <p className="font-serif text-sm text-gold-dark">
                  Step {active.step} of 5
                </p>
                <h3 className="mt-2 text-2xl text-forest">{active.title}</h3>
                <p className="mt-4 leading-relaxed text-charcoal">
                  {active.detail}
                </p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
