"use client";

import { ANCHORS, EPOCHS } from "@/lib/cosmos/timeline";

type Props = {
  activeIndex: number;
  yearValueRef: React.RefObject<HTMLSpanElement | null>;
  yearUnitRef: React.RefObject<HTMLSpanElement | null>;
  eraRef: React.RefObject<HTMLSpanElement | null>;
  warpRef: React.RefObject<HTMLSpanElement | null>;
  warpBarRef: React.RefObject<HTMLDivElement | null>;
  barRef: React.RefObject<HTMLDivElement | null>;
  onJump: (progress: number) => void;
};

/**
 * Fixed cinematic HUD: the light-speed year odometer, era readout,
 * warp meter and the vertical progress rail of stops.
 */
export default function TimeHUD({
  activeIndex,
  yearValueRef,
  yearUnitRef,
  eraRef,
  warpRef,
  warpBarRef,
  barRef,
  onJump,
}: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* top hairline progress */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/5" aria-hidden="true">
        <div
          ref={barRef}
          className="h-full origin-left bg-amber-300/80"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* top bar */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-3 py-3 md:px-8 md:py-5">
        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.3em] text-white/45 md:text-[11px]">
          CHRONOS
          <span className="ml-2 hidden text-white/25 sm:inline">· The Story of Everything</span>
        </span>
        <span
          ref={eraRef}
          className="max-w-[46vw] truncate rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 backdrop-blur-sm md:text-[10px] md:tracking-[0.3em]"
        >
          PLANCK ERA
        </span>
        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.25em] text-white/45 md:text-[11px] md:tracking-[0.3em]">
          Stop{" "}
          <span className="text-white/85">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="text-white/30"> / {EPOCHS.length}</span>
        </span>
      </header>

      {/* the odometer */}
      <div
        aria-live="off"
        className="absolute inset-x-0 top-14 flex flex-col items-center md:top-20"
      >
        <span
          ref={yearValueRef}
          className="font-mono text-[clamp(1.6rem,6vw,3.6rem)] font-bold leading-none tracking-tight text-white"
          style={{ textShadow: "0 2px 26px rgba(0,0,0,0.92), 0 0 30px rgba(244,169,69,0.35)" }}
        >
          13.80
        </span>
        <span
          ref={yearUnitRef}
          className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-white/55 md:text-xs"
        >
          BILLION YEARS AGO
        </span>
      </div>

      {/* warp meter */}
      <div className="absolute bottom-5 left-4 md:bottom-8 md:left-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">
          Dive velocity
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            ref={warpRef}
            className="font-mono text-sm font-semibold text-amber-200/90 md:text-base"
          >
            0.00 c
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10 md:w-36" aria-hidden="true">
            <div
              ref={warpBarRef}
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-amber-400/70 to-rose-400/90"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>

      {/* progress rail — desktop */}
      <nav
        aria-label="Timeline stops"
        className="pointer-events-auto absolute right-6 top-1/2 hidden h-[46vh] -translate-y-1/2 md:block"
      >
        <div className="relative h-full w-px">
          <span
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12"
            aria-hidden="true"
          />
          {ANCHORS.map((a, i) => (
            <button
              key={EPOCHS[i].id}
              onClick={() => onJump(a)}
              title={`${EPOCHS[i].title} — ${EPOCHS[i].era}`}
              aria-label={`Jump to ${EPOCHS[i].title}`}
              className="group absolute -left-[7px] flex h-4 w-4 items-center justify-center"
              style={{ top: `${a * 100}%`, transform: "translateY(-50%)" }}
            >
              <span
                className={`block rounded-full transition-all duration-500 ${
                  i === activeIndex ? "h-3 w-3" : "h-1.5 w-1.5 group-hover:h-2.5 group-hover:w-2.5"
                }`}
                style={{
                  backgroundColor:
                    i === activeIndex ? EPOCHS[i].accent : "rgba(255,255,255,0.35)",
                  boxShadow: i === activeIndex ? `0 0 18px ${EPOCHS[i].accent}` : "none",
                }}
              />
            </button>
          ))}
        </div>
      </nav>

      {/* scroll hint — bottom center, fades via engine when journey starts */}
      <div
        className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 transition-opacity duration-700"
        id="scroll-hint"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">
          Scroll to dive into time
        </span>
        <span className="chronos-bounce text-white/60" aria-hidden="true">
          ↓
        </span>
      </div>
    </div>
  );
}
