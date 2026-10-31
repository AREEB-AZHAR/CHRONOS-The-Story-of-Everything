"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface IntroProps {
  visible: boolean;
  progress: number; // 0..1
  ready: boolean;
  onBegin: () => void;
}

export default function Intro({ visible, progress, ready, onBegin }: IntroProps) {
  const pct = Math.round(progress * 100);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020107] px-6"
          exit={{ opacity: 0, scale: 1.06, filter: "blur(14px)" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.05] blur-[120px]" />
            <div className="absolute left-1/4 top-1/3 size-[40vmin] rounded-full bg-orange-500/[0.04] blur-[100px]" />
          </div>

          <motion.div
            className="relative flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative grid size-16 place-items-center">
              <span className="absolute inset-0 rounded-full border border-white/15" />
              <span className="spin-slow absolute inset-0 rounded-full border-t-2 border-emerald-300/90" />
              <span className="absolute inset-[26%] rounded-full border border-white/10" />
              <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_16px_4px_rgba(110,231,183,0.75)]" />
            </div>

            <h1 className="mt-8 font-mono text-xl font-bold tracking-[0.5em] text-white sm:text-2xl">
              CHRONOS
            </h1>
            <p className="mt-3 font-mono text-[10px] tracking-[0.4em] text-white/40">
              ATLAS OF EVERYTHING
            </p>

            <p className="mt-10 max-w-md font-display text-lg font-light italic leading-relaxed text-white/85 sm:text-xl">
              You are standing at the centre of spacetime.
            </p>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/55">
              Scroll to fall through 13.8 billion years — galaxies, extinctions,
              dinosaurs and dawn. Click any moment and it will come to you.
              The stream never ends.
            </p>

            {!ready ? (
              <div className="mt-12 flex w-64 flex-col items-center gap-3">
                <div className="relative h-px w-full overflow-hidden bg-white/12">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-300 to-teal-200 transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="font-mono text-[9px] tracking-[0.3em] text-white/40">
                  WEAVING SPACETIME · {pct}%
                </p>
              </div>
            ) : (
              <motion.button
                onClick={onBegin}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-pill group mt-12 flex items-center gap-3 !px-7 !py-3.5"
              >
                <span className="font-mono text-xs tracking-[0.35em] text-white">
                  ENTER THE STREAM
                </span>
                <ArrowRight className="size-4 text-emerald-300 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.button>
            )}
          </motion.div>

          <p className="absolute bottom-7 font-mono text-[8px] tracking-[0.3em] text-white/25">
            BEST WITH SOUND OFF · HEADPHONES OPTIONAL · WEBGL
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
