"use client";

import { useState } from "react";
import { EPOCHS, type Epoch } from "@/lib/cosmos/timeline";
import { formatYears } from "@/lib/cosmos/format";

/* ------------------------------------------------------------------ */
/*  Floating readable text — the only DOM inside the 3D journey.       */
/*  The engine writes opacity/transform on the outer wrapper each     */
/*  frame; the inner card carries the idle bob + content.             */
/* ------------------------------------------------------------------ */

function EraPanel({ epoch }: { epoch: Epoch }) {
  const [expanded, setExpanded] = useState(false);
  const years = formatYears(epoch.yearsAgo);
  const readable =
    epoch.yearsAgo === 0 ? "TODAY — 2025 CE" : `${years.value} ${years.unit}`;

  return (
    <div className="chronos-float">
      <div
        data-panel-card="true"
        className="chronos-panel-scroll pointer-events-auto relative max-h-[46vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#070a12]/68 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md md:max-h-[78vh] md:p-7"
        style={{ boxShadow: `0 0 120px -30px ${epoch.accent}80, 0 30px 80px -20px rgba(0,0,0,0.9)` }}
      >
        {/* ghost numeral — editorial depth */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-7 right-2 select-none font-display text-[5.5rem] font-light italic leading-none text-white/[0.06] md:-top-10 md:text-[7.5rem]"
        >
          {String(epoch.index + 1).padStart(2, "0")}
        </span>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.3em] md:text-[10px]"
            style={{ borderColor: `${epoch.accent}59`, color: epoch.accent }}
          >
            {epoch.era}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/45 md:text-[10px]">
            {readable}
          </span>
        </div>

        <h2 className="mt-3 font-display text-[1.9rem] font-semibold leading-[1.05] tracking-tight text-[#ece9e2] [text-shadow:0_2px_34px_rgba(0,0,0,0.85)] md:mt-4 md:text-[2.6rem] xl:text-[3rem]">
          {epoch.title}
        </h2>
        <p className="mt-2 font-display text-[13px] italic text-white/65 md:text-base">
          {epoch.tagline}
        </p>

        <p
          className={`mt-3 text-[13px] leading-relaxed text-white/80 md:mt-4 md:text-[15px] ${
            expanded ? "" : "line-clamp-3 md:line-clamp-none"
          }`}
        >
          {epoch.body}
        </p>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="pointer-events-auto mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white md:hidden"
          aria-expanded={expanded}
        >
          {expanded ? "− Collapse" : "+ Read more"}
        </button>

        <ul className={`mt-4 gap-2.5 ${expanded ? "grid" : "hidden"} md:grid`}>
          {epoch.facts.map((f) => (
            <li key={f.label} className="flex items-baseline gap-3 text-[13px] md:text-sm">
              <span
                className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider md:w-28 md:text-[11px]"
                style={{ color: epoch.accent }}
              >
                {f.label}
              </span>
              <span className="text-white/72">{f.text}</span>
            </li>
          ))}
        </ul>

        {epoch.extinctions?.length ? (
          <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-red-400/90 md:text-[10px]">
              Extinction memorial — species lost
            </p>
            <ul className={`mt-3 gap-3 ${expanded ? "grid" : "hidden"} md:grid`}>
              {epoch.extinctions.map((ex) => (
                <li key={ex.name} className="flex items-baseline gap-3 text-sm">
                  <span className="shrink-0 font-semibold text-red-300">{ex.name}</span>
                  <span className="h-px flex-1 self-center bg-red-500/20" aria-hidden="true" />
                  <span className="text-right text-xs text-white/55">{ex.note}</span>
                </li>
              ))}
            </ul>
            <ul className={`mt-2 flex flex-wrap gap-1.5 ${expanded ? "hidden" : "flex"} md:hidden`}>
              {epoch.extinctions.slice(0, 4).map((ex) => (
                <li
                  key={ex.name}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200"
                >
                  {ex.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  mounted: Set<number>;
  registerPanel: (i: number) => (el: HTMLDivElement | null) => void;
};

export default function TextLayer({ mounted, registerPanel }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[25] select-none">
      {EPOCHS.map((epoch) => {
        const i = epoch.index;
        const isMounted = mounted.has(i);
        return (
          <div
            key={epoch.id}
            ref={registerPanel(i)}
            aria-hidden={!isMounted}
            className="absolute inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] will-change-[transform,opacity] md:inset-x-auto md:bottom-auto md:left-8 md:top-[13vh] md:w-[min(34rem,42vw)] lg:left-12"
            style={{ visibility: "hidden", opacity: 0 }}
          >
            {isMounted ? <EraPanel epoch={epoch} /> : null}
          </div>
        );
      })}
    </div>
  );
}
