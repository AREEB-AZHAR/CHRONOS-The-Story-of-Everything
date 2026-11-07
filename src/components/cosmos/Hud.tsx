"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimelineEvent } from "@/data/timeline";
import { TIMELINE, TOTAL_EVENTS } from "@/data/timeline";

export interface HudRefProps {
  yearBigRef: React.RefObject<HTMLSpanElement | null>;
  yearUnitRef: React.RefObject<HTMLSpanElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
}

export function formatYear(ya: number): { big: string; unit: string } {
  if (ya >= 1_000_000_000) {
    const v = ya / 1_000_000_000;
    return { big: v.toFixed(2), unit: "BILLION YEARS AGO" };
  }
  if (ya >= 1_000_000) {
    return { big: Math.round(ya / 1_000_000).toLocaleString(), unit: "MILLION YEARS AGO" };
  }
  if (ya >= 10_000) {
    return { big: Math.round(ya).toLocaleString(), unit: "YEARS AGO" };
  }
  if (ya >= 2_027) {
    return { big: (2026 - Math.round(ya)).toLocaleString(), unit: "BCE" };
  }
  if (ya >= 1) {
    return { big: (2026 - Math.round(ya)).toLocaleString(), unit: "CE" };
  }
  return { big: "2026", unit: "PRESENT DAY" };
}

interface HudProps {
  era: TimelineEvent;
  yearBigRef: React.RefObject<HTMLSpanElement | null>;
  yearUnitRef: React.RefObject<HTMLSpanElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  /** true while a moment is selected — fades the mobile year block behind the sheet */
  selectionActive: boolean;
  onOpenEras: () => void;
  onOpenAbout: () => void;
  onBackToStart: () => void;
}

export default function Hud({
  era,
  yearBigRef,
  yearUnitRef,
  progressBarRef,
  selectionActive,
  onOpenEras,
  onOpenAbout,
  onBackToStart,
}: HudProps) {
  const idxRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (idxRef.current) {
      idxRef.current.textContent = String(era.index).padStart(2, "0");
    }
  }, [era.index]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* vignette for cinema feel */}
      <div className="vignette absolute inset-0" />

      {/* ============ top bar ============ */}
      <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-7">
        {/* logo */}
        <div className="flex items-center gap-3">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-emerald-400/40 p-0.5 shadow-[0_0_12px_rgba(52,211,153,0.35)]">
            <img src="/logo.svg" alt="CHRONOS Logo" className="size-full" />
          </div>
          <div className="leading-none">
            <p className="font-mono text-sm font-bold tracking-[0.35em] text-white">CHRONOS</p>
            <p className="mt-1 font-mono text-[9px] tracking-[0.3em] text-white/40">
              ATLAS OF EVERYTHING
            </p>
          </div>
        </div>

        {/* meta — hidden on small screens */}
        <div className="mt-1 hidden items-start gap-12 md:flex">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
              Currently
            </p>
            <p className="mt-1.5 font-mono text-xs tracking-wider text-white/90">
              {era.title}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
              Position
            </p>
            <p className="mt-1.5 font-mono text-xs tracking-wider text-white/90">
              Centre of Spacetime
            </p>
          </div>
        </div>

        {/* nav status */}
        <nav className="pointer-events-auto mt-1 hidden items-center gap-5 sm:flex">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
            Navigation
          </span>
          <button
            onClick={onOpenEras}
            className="font-mono text-xs tracking-wider text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Eras
          </button>
          <button
            onClick={onOpenAbout}
            className="font-mono text-xs tracking-wider text-white/60 transition-colors hover:text-white"
          >
            About
          </button>
        </nav>

        {/* mobile nav */}
        <div className="pointer-events-auto flex items-center gap-4 sm:hidden">
          <button
            onClick={onOpenEras}
            className="glass-pill px-3 py-1.5 font-mono text-[10px] tracking-widest text-emerald-300"
          >
            ERAS
          </button>
          <button
            onClick={onOpenAbout}
            className="glass-pill px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70"
          >
            ABOUT
          </button>
        </div>
      </header>

      {/* ============ bottom-left editorial block ============ */}
      {(() => {
        const prevIdx = (era.index - 1 + TOTAL_EVENTS) % TOTAL_EVENTS;
        const nextIdx = (era.index + 1) % TOTAL_EVENTS;
        const prevEra = TIMELINE[prevIdx];
        const nextEra = TIMELINE[nextIdx];

        return (
          <div className="absolute bottom-24 left-5 max-w-[76vw] sm:bottom-8 sm:left-7 sm:max-w-md pointer-events-auto">
            {/* Subtle blurred glimpse of surrounding timelines */}
            <div className="mb-2.5 flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] text-white/35">
              {prevEra && (
                <span className="flex items-center gap-1 opacity-60 filter blur-[1px] select-none transition-all">
                  <span className="text-[8px] text-emerald-400/50">‹</span>
                  <span className="max-w-[85px] truncate sm:max-w-[110px]">{prevEra.title}</span>
                </span>
              )}
              <span className="text-white/20">|</span>
              <span className="font-semibold text-emerald-300/90 tracking-[0.28em]">
                <span ref={idxRef} /> / {TOTAL_EVENTS}
              </span>
              <span className="text-white/20">|</span>
              {nextEra && (
                <span className="flex items-center gap-1 opacity-60 filter blur-[1.2px] select-none transition-all">
                  <span className="max-w-[85px] truncate sm:max-w-[110px]">{nextEra.title}</span>
                  <span className="text-[8px] text-cyan-400/50">›</span>
                </span>
              )}
            </div>

            {/* Active Era Editorial: Smooth cross-dissolve & blur resolution */}
            <AnimatePresence mode="wait">
              <motion.div
                key={era.id}
                initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="era-title font-display text-3xl font-light italic leading-tight text-white sm:text-4xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]">
                  {era.title}
                </h2>
                <div className="mt-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-white/50">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-950/30 px-2 py-0.5 text-emerald-300/90">
                    {era.category}
                  </span>
                  <span>·</span>
                  <span>{era.yearLabel.toUpperCase()}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })()}

      {/* ============ bottom-right: Future Horizons & Controls ============ */}
      <div className="absolute bottom-24 right-5 hidden flex-col items-end gap-3 sm:bottom-8 sm:right-7 sm:flex pointer-events-auto">
        {/* Approaching Future Horizons preview in the background (blurred) */}
        <div className="flex flex-col items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-md">
          <p className="font-mono text-[8px] tracking-[0.3em] text-white/40 uppercase">
            Approaching Horizons
          </p>
          <div className="flex items-center gap-2 mt-1">
            {/* Next epoch +1 (blurred glimpse) */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 filter blur-[1px] select-none transition-all">
              <span className="font-mono text-[9px] text-emerald-300/80">+{1}</span>
              <div className="flex flex-col text-right">
                <span className="font-mono text-[10px] text-white/80 max-w-[110px] truncate">{TIMELINE[(era.index + 1) % TOTAL_EVENTS]?.title}</span>
                <span className="font-mono text-[8px] text-white/40">{TIMELINE[(era.index + 1) % TOTAL_EVENTS]?.yearLabel}</span>
              </div>
            </div>
            {/* Next epoch +2 (deeper blur) */}
            <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.015] px-2.5 py-1.5 filter blur-[2px] select-none transition-all">
              <span className="font-mono text-[9px] text-cyan-300/60">+{2}</span>
              <div className="flex flex-col text-right">
                <span className="font-mono text-[10px] text-white/60 max-w-[100px] truncate">{TIMELINE[(era.index + 2) % TOTAL_EVENTS]?.title}</span>
                <span className="font-mono text-[8px] text-white/30">{TIMELINE[(era.index + 2) % TOTAL_EVENTS]?.yearLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={onBackToStart} className="glass-pill group flex items-center gap-2.5">
          <span className="grid size-5 place-items-center rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="rotate-180">
              <path d="M1 0.5L7 4L1 7.5V0.5Z" fill="white" />
            </svg>
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/85">
            BACK TO THE BIG BANG
          </span>
        </button>
        <p className="font-mono text-[9px] tracking-[0.2em] text-white/30">
          SCROLL · ↑ ↓ KEYS · CLICK A MOMENT
        </p>
      </div>

      {/* ============ bottom-centre: year counter ============ */}
      <div
        className={`absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 px-4 transition-opacity duration-500 sm:bottom-7 sm:opacity-100 ${
          selectionActive ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-baseline gap-2.5">
          <span
            ref={yearBigRef}
            className="year-counter font-mono text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl"
          >
            13.80
          </span>
          <span
            ref={yearUnitRef}
            className="font-mono text-[10px] tracking-[0.3em] text-emerald-300/90 sm:text-xs"
          >
            BILLION YEARS AGO
          </span>
        </div>
        {/* loop progress */}
        <div className="relative h-px w-48 overflow-hidden rounded bg-white/12 sm:w-64">
          <div
            ref={progressBarRef}
            className="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-emerald-300 to-teal-200 shadow-[0_0_8px_rgba(110,231,183,0.9)]"
          />
        </div>
        <p className="font-mono text-[8px] tracking-[0.35em] text-white/30">
          THE LOOP · BIG BANG → NOW → BIG BANG
          <span className="sm:hidden"> · TAP A MOMENT</span>
        </p>
      </div>
    </div>
  );
}
