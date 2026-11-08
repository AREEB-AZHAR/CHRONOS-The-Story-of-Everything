"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Skull, Lightbulb } from "lucide-react";
import type { TimelineEvent } from "@/data/timeline";

interface InfoPanelProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

export default function InfoPanel({ event, onClose }: InfoPanelProps) {
  // close on Escape is handled by the scene; keep keyboard access here too
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* click-catcher to close (don't block the 3D card on the left) */}
          <motion.button
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-20 cursor-default"
          />

          <motion.aside
            key={event.id}
            role="dialog"
            aria-label={`${event.title} information`}
            initial={{ opacity: 0, y: 36, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.9 }}
            className="glass-panel fixed z-30 flex flex-col overflow-hidden
                       right-0 bottom-0 left-0 max-h-[60dvh] rounded-t-3xl
                       !bg-[#07040d]/96 sm:!bg-transparent backdrop-blur-2xl
                       border-t border-white/20 shadow-[0_-24px_60px_rgba(0,0,0,0.95)]
                       sm:top-1/2 sm:bottom-auto sm:left-auto sm:right-7 sm:w-[420px]
                       sm:max-h-[82vh] sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-white/16"
          >
            {/* mobile drag handle */}
            <div className="mx-auto mt-3 h-1 w-11 shrink-0 rounded-full bg-white/30 sm:hidden" />

            {/* moving animated shine */}
            <span className="sheen pointer-events-none absolute inset-0 z-10" aria-hidden />
            {/* top edge highlight */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
              aria-hidden
            />

            {/* header */}
            <div className="relative flex items-start justify-between gap-4 p-5 pt-3 pb-0 sm:p-7 sm:pb-0">
              <div>
                <span
                  className="chip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.22em]"
                  style={{
                    color: event.palette.accent,
                    borderColor: `${event.palette.accent}55`,
                    background: `${event.palette.nebula}14`,
                  }}
                >
                  <Sparkles className="size-2.5" />
                  {event.category}
                </span>
                <h3 className="mt-3 font-display text-2xl font-light italic leading-tight text-white sm:text-[1.7rem]">
                  {event.title}
                </h3>
                <p className="mt-1.5 font-mono text-[10px] tracking-[0.25em] text-white/50">
                  {event.yearLabel.toUpperCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="glass-pill grid size-9 shrink-0 place-items-center transition-transform hover:scale-110 active:scale-95"
              >
                <X className="size-4 text-white/80" />
              </button>
            </div>

            {/* body — scrollable */}
            <div className="cosmos-scroll relative min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:px-7 sm:pb-7">
              <p className="font-display text-[15px] leading-relaxed text-white/85">
                {event.description}
              </p>

              <div className="mt-5">
                <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-emerald-300/90">
                  <Lightbulb className="size-3" /> KEY FACTS
                </p>
                <ul className="mt-3 space-y-2.5">
                  {event.facts.map((f, i) => (
                    <li key={i} className="fact flex gap-3 text-[13px] leading-snug text-white/70">
                      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-emerald-300/80 shadow-[0_0_6px_rgba(110,231,183,0.8)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {event.lostForever && (
                <div className="mt-5">
                  <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-rose-300/90">
                    <Skull className="size-3" /> LOST FOREVER
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.lostForever.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[11px] text-rose-100/90"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.notableLife && (
                <div className="mt-5">
                  <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-teal-300/90">
                    <Sparkles className="size-3" /> LIFE OF THE ERA
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.notableLife.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-teal-300/20 bg-teal-400/10 px-2.5 py-1 text-[11px] text-teal-50/90"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
