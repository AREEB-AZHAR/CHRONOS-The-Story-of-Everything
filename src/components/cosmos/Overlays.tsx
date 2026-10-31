"use client";

import { EPOCHS } from "@/lib/cosmos/timeline";

type OverlayRefs = {
  introRef: React.RefObject<HTMLDivElement | null>;
  outroRef: React.RefObject<HTMLDivElement | null>;
  onRestart: () => void;
};

/** Film grain + vignette scrims — the cinema feel (static, compositor-cheap). */
export function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[15]">
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 62%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      {/* scrims for HUD legibility */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
      {/* film grain */}
      <div className="chronos-grain absolute -inset-[100px]" />
    </div>
  );
}

export function Intro({ introRef }: Pick<OverlayRefs, "introRef">) {
  return (
    <div
      ref={introRef}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6 pt-24 text-center will-change-transform md:pt-28"
      style={{ pointerEvents: "none" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber-200/70 md:text-xs">
        A photographic dive through 13.8 billion years
      </p>
      <h1 className="mt-4 font-display text-[clamp(3.4rem,13vw,10rem)] font-semibold uppercase leading-none tracking-[0.04em] text-[#ece9e2] [text-shadow:0_0_90px_rgba(244,169,69,0.4)]">
        Chronos
      </h1>
      <p className="mt-5 max-w-xl text-balance font-display text-base italic text-white/70 md:text-xl">
        Zoom into the fabric of spacetime itself — from the fireball of the Big
        Bang to the pale blue dot you call home. Every era is a real photograph
        you fall into.
      </p>
      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.4em] text-white/35 md:text-[11px]">
        {EPOCHS.length} worlds · 5 mass extinctions · 1 extraordinary planet
      </p>
    </div>
  );
}

export function Outro({ outroRef, onRestart }: Omit<OverlayRefs, "introRef">) {
  return (
    <div
      ref={outroRef}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6 pt-20 text-center will-change-transform md:pt-24"
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40 md:text-xs">
        End of transmission
      </p>
      <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.9rem,5.5vw,4.2rem)] font-semibold leading-[1.08] tracking-tight text-[#ece9e2]">
        Everything that has ever lived was made of stardust —{" "}
        <span className="italic text-amber-200">including you.</span>
      </h2>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
        {EPOCHS.length} worlds · 13.8 billion years · five mass extinctions survived ·
        one species now holds the pen. The next chapter is unwritten.
      </p>

      <button
        onClick={onRestart}
        className="pointer-events-auto mt-9 rounded-full border border-amber-300/40 bg-amber-300/10 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.35em] text-amber-200 transition-all duration-300 hover:scale-105 hover:bg-amber-300/20 hover:shadow-[0_0_40px_rgba(244,169,69,0.4)]"
      >
        ↑ Travel again
      </button>

      <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 md:text-[10px]">
        <span>Chronos — a 3D cinematic history of everything</span>
        <span>From the Big Bang to 2025 CE · Built with Z.ai</span>
      </footer>
    </div>
  );
}
