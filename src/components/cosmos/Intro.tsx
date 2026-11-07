"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Compass, Orbit } from "lucide-react";
import Image from "next/image";

interface IntroProps {
  visible: boolean;
  progress: number; // 0..1
  ready: boolean;
  onBegin: () => void;
}

export default function Intro({ visible, progress, ready, onBegin }: IntroProps) {
  const pct = Math.round(progress * 100);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Allow pressing Enter, Space, or ArrowDown to begin once loaded
  useEffect(() => {
    if (!visible || !ready) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        onBegin();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, ready, onBegin]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#020107] px-6 py-8 sm:py-12 select-none"
          exit={{ opacity: 0, scale: 1.05, filter: "blur(18px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ================= Background Video Layer ================= */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-50 contrast-125 brightness-90 filter"
            >
              <source src="/cosmos/space-bg.mp4" type="video/mp4" />
            </video>

            {/* Cinematic Multilayer Vignette & Cosmic Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020107] via-transparent to-[#020107]/80" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,1,7,0.35)_0%,rgba(2,1,7,0.8)_65%,rgba(2,1,7,0.98)_100%)]" />

            {/* Ambient Cosmic Halos */}
            <div className="absolute left-1/2 top-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[140px]" />
            <div className="absolute left-1/3 top-1/4 size-[45vmin] rounded-full bg-cyan-500/[0.06] blur-[110px]" />
            <div className="absolute right-1/4 bottom-1/4 size-[50vmin] rounded-full bg-purple-600/[0.06] blur-[130px]" />
          </div>

          {/* ================= Top Bar: Branding & Coordinates ================= */}
          <motion.header
            className="relative z-10 flex w-full max-w-5xl items-center justify-between border-b border-white/[0.08] pb-4"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3">
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-emerald-400/40 p-0.5 shadow-[0_0_12px_rgba(52,211,153,0.35)]">
                <Image src="/logo.svg" alt="CHRONOS Logo" width={28} height={28} className="size-full" />
              </div>
              <div>
                <span className="font-mono text-[11px] font-bold tracking-[0.35em] text-white">CHRONOS</span>
                <span className="ml-2 font-mono text-[9px] tracking-[0.25em] text-emerald-400/70">v2.0 · 4D</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-6 font-mono text-[9px] tracking-[0.3em] text-white/40">
              <span className="flex items-center gap-1.5">
                <Orbit className="size-3 text-emerald-400/60" />
                30 CELESTIAL STATIONS
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Compass className="size-3 text-cyan-400/60" />
                13.8 BILLION YEARS
              </span>
            </div>
          </motion.header>

          {/* ================= Center Hero Narrative ================= */}
          <motion.main
            className="relative z-10 flex max-w-2xl flex-col items-center text-center my-auto"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Celestial Astrolabe Core */}
            <div className="relative mb-6 grid size-20 place-items-center">
              <span className="absolute inset-0 rounded-full border border-white/15" />
              <span className="spin-slow absolute inset-0 rounded-full border-t-2 border-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.4)]" />
              <span className="absolute inset-[22%] rounded-full border border-white/10" />
              <div className="relative size-10 overflow-hidden rounded-full border border-white/20 p-1">
                <Image src="/logo.svg" alt="Chronos Mark" width={40} height={40} className="size-full" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-950/30 px-3.5 py-1 text-[10px] font-mono tracking-[0.3em] text-emerald-300 backdrop-blur-md">
              <Sparkles className="size-3" />
              <span>ATLAS OF SPACETIME</span>
            </div>

            <h1 className="mt-5 font-mono text-2xl font-bold tracking-[0.45em] text-white sm:text-4xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              CHRONOS
            </h1>

            <p className="mt-4 max-w-lg font-display text-xl font-light italic leading-relaxed text-white/90 sm:text-2xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              You are standing at the centre of spacetime.
            </p>

            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-white/65 sm:text-[14px]">
              Thirty cosmic eras spiral around you in an infinite 4D tunnel.
              From the Big Bang and the birth of first stars, through five mass extinctions,
              dinosaurs, and humanity — travel across 13.8 billion years.
            </p>

            {/* Navigation Tips Pill */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] tracking-[0.18em] text-white/50">
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1">
                ↑ ↓ KEYS · PREV / NEXT SECTION
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1">
                SCROLL · SMOOTH DETENT BRAKE
              </span>
            </div>

            {/* Interactive Launch Button or Loading Bar */}
            {!ready ? (
              <div className="mt-10 flex w-72 flex-col items-center gap-3">
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 transition-[width] duration-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="font-mono text-[9px] tracking-[0.35em] text-white/45">
                  PRE-HEATING GPU MATRICES · {pct}%
                </p>
              </div>
            ) : (
              <motion.button
                onClick={onBegin}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="group relative mt-10 inline-flex items-center gap-3.5 overflow-hidden rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 px-8 py-3.5 shadow-[0_0_30px_rgba(16,185,129,0.35)] backdrop-blur-md transition-all duration-300 hover:border-emerald-300 hover:shadow-[0_0_45px_rgba(52,211,153,0.6)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
                <span className="font-mono text-xs font-semibold tracking-[0.35em] text-white">
                  ENTER THE STREAM
                </span>
                <ArrowRight className="size-4 text-emerald-300 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.button>
            )}
          </motion.main>

          {/* ================= Bottom Bar Footer ================= */}
          <motion.footer
            className="relative z-10 flex w-full max-w-5xl items-center justify-between border-t border-white/[0.08] pt-4 font-mono text-[9px] tracking-[0.25em] text-white/35"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span>INFINITE 4D WEBGL ENGINE</span>
            <span>PRESS SPACE OR CLICK TO ENTER</span>
            <span className="hidden sm:inline">HIGH-PRECISION COSMIC ATLAS</span>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
