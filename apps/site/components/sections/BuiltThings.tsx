"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ABOUT } from "@/lib/content";
import WorkModal, { type Project } from "@/components/modals/WorkModal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

export default function BuiltThings() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const selected = ABOUT.built.find((p) => p.id === selectedId) as
    | Project
    | undefined;

  return (
    <>
      <RevealGroup className="grid gap-8 md:grid-cols-2">
        {ABOUT.built.map((proj) => (
          <RevealItem key={proj.id}>
            <motion.button
              layoutId={reduce ? undefined : `work-${proj.id}`}
              type="button"
              onClick={() => setSelectedId(proj.id)}
              className="group flex h-full w-full flex-col rounded-lg border border-tan bg-cream p-7 text-left transition-colors hover:border-forest"
              aria-haspopup="dialog"
              aria-label={`${proj.name} — see more`}
            >
              <h3 className="font-serif text-2xl text-forest">{proj.name}</h3>
              <p className="mt-2 text-moss italic">{proj.subtitle}</p>

              <p className="mt-5 leading-relaxed text-charcoal">
                {proj.blurb}
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {proj.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-tan bg-cream-dim px-3 py-1 text-xs font-medium uppercase tracking-wide text-moss"
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
                View Demo
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          </RevealItem>
        ))}
      </RevealGroup>

      <WorkModal
        project={selected ?? null}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
