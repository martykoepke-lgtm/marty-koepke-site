"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloseIcon, ArrowRightIcon } from "@/components/ui/Icons";

const EASE = [0.22, 0.61, 0.36, 1] as const;

export type Project = {
  id: string;
  name: string;
  blurb: string;
  description: string;
  images: readonly string[];
  launchUrl: string | null;
  launchLabel: string;
};

export default function WorkModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-forest/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
            <motion.div
              layoutId={reduce ? undefined : `work-${project.id}`}
              role="dialog"
              aria-modal="true"
              aria-label={project.name}
              className="relative w-full max-w-3xl rounded-xl border border-tan bg-cream p-6 sm:p-8"
              initial={reduce ? { opacity: 0 } : false}
              animate={reduce ? { opacity: 1 } : undefined}
              exit={reduce ? { opacity: 0 } : undefined}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <button
                type="button"
                className="absolute right-4 top-4 text-moss transition-colors hover:text-forest"
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>

              <h3 className="pr-10 text-2xl text-forest sm:text-3xl">
                {project.name}
              </h3>
              <p className="mt-2 text-moss">{project.blurb}</p>

              <p className="mt-5 leading-relaxed text-charcoal">
                {project.description}
              </p>

              {project.launchUrl && (
                <a
                  href={project.launchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-forest px-6 py-3 font-semibold text-cream transition-colors hover:bg-forest-dark"
                >
                  {project.launchLabel}
                  <ArrowRightIcon className="h-4 w-4" />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              )}

              {project.images.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {project.images.map((src, i) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block overflow-hidden rounded-md border border-tan bg-cream-dim"
                    >
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={src}
                          alt={`${project.name} — screenshot ${i + 1}`}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
