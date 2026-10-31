"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, MousePointer2, Keyboard, Hand, Info } from "lucide-react";
import { TIMELINE } from "@/data/timeline";

interface ErasDrawerProps {
  open: boolean;
  currentIdx: number;
  onJump: (idx: number) => void;
  onClose: () => void;
}

export default function ErasDrawer({ open, currentIdx, onJump, onClose }: ErasDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col rounded-l-3xl sm:rounded-l-[2rem]"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 210, damping: 28 }}
          >
            <span className="sheen pointer-events-none absolute inset-0 z-10" aria-hidden />
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <p className="font-mono text-[9px] tracking-[0.35em] text-emerald-300/90">
                  NAVIGATION
                </p>
                <h3 className="mt-1 font-display text-2xl font-light italic text-white">
                  All thirty moments
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close eras"
                className="glass-pill grid size-9 place-items-center transition-transform hover:scale-110"
              >
                <X className="size-4 text-white/80" />
              </button>
            </div>

            <div className="cosmos-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              {TIMELINE.map((ev) => {
                const active = ev.index - 1 === currentIdx;
                return (
                  <button
                    key={ev.id}
                    onClick={() => {
                      onJump(ev.index - 1);
                      onClose();
                    }}
                    className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${
                      active ? "bg-white/[0.09]" : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className="font-mono text-[10px] tabular-nums tracking-widest"
                      style={{ color: active ? ev.palette.accent : "rgba(255,255,255,0.35)" }}
                    >
                      {String(ev.index).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-display text-[15px] ${
                          active ? "italic text-white" : "text-white/75 group-hover:text-white"
                        }`}
                      >
                        {ev.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[9px] tracking-[0.18em] text-white/35">
                        {ev.yearLabel.toUpperCase()}
                      </span>
                    </span>
                    {ev.category === "MASS EXTINCTION" && (
                      <span className="rounded border border-rose-300/25 bg-rose-400/10 px-1.5 py-0.5 font-mono text-[8px] tracking-widest text-rose-200/90">
                        EXTINCTION
                      </span>
                    )}
                    <ArrowUpRight className="size-3.5 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-300" />
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <MousePointer2 className="size-3.5 text-white/40" />
                  <p className="font-mono text-[8px] tracking-[0.15em] text-white/35">CLICK CARD</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Hand className="size-3.5 text-white/40" />
                  <p className="font-mono text-[8px] tracking-[0.15em] text-white/35">DRAG / SCROLL</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Keyboard className="size-3.5 text-white/40" />
                  <p className="font-mono text-[8px] tracking-[0.15em] text-white/35">↑ ↓ KEYS</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ================= About modal ================= */

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel relative w-full max-w-lg overflow-hidden rounded-3xl p-8"
            initial={{ scale: 0.92, y: 20, filter: "blur(8px)" }}
            animate={{ scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ scale: 0.95, y: 10, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sheen pointer-events-none absolute inset-0 z-10" aria-hidden />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Info className="size-4 text-emerald-300" />
                <h3 className="font-display text-2xl font-light italic text-white">
                  About this atlas
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close about"
                className="glass-pill grid size-9 place-items-center transition-transform hover:scale-110"
              >
                <X className="size-4 text-white/80" />
              </button>
            </div>
            <div className="mt-5 space-y-4 text-[13.5px] leading-relaxed text-white/75">
              <p>
                <span className="text-white">CHRONOS</span> places you at the exact
                centre of a four-dimensional stream. Thirty worlds — from the first
                light of the Big Bang to the present day — orbit around you in an
                endless loop. Five mass extinctions, two revolutions and one
                extraordinarily lucky planet, rendered as a living galaxy of moments.
              </p>
              <p>
                Every image is original AI-painted artwork; every fact is drawn from
                our best current science. The years between events are real — when the
                counter races, that is the true gulf of deep time passing by.
              </p>
              <ul className="space-y-2 font-mono text-[11px] tracking-[0.12em] text-white/55">
                <li>· SCROLL, DRAG or ARROW KEYS — travel through time</li>
                <li>· CLICK ANY CARD — it flies to you with its story</li>
                <li>· ESC — release a moment back into the stream</li>
                <li>· STOP SCROLLING — the stream docks you at the nearest era</li>
              </ul>
              <p className="font-display italic text-white/60">
                “The cosmos is within us. We are made of star-stuff.” — Carl Sagan
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
