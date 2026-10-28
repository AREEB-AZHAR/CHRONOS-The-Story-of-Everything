"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { EPOCHS, type Epoch } from "@/lib/cosmos/timeline";
import { formatYears } from "@/lib/cosmos/format";
import {
  LAYER_Z,
  PERSPECTIVE,
  SLOT,
  TEXTURES,
  comp,
  makeDust,
} from "@/lib/cosmos/depth";

type Props = {
  mounted: Set<number>;
  registerWorld: (el: HTMLDivElement | null) => void;
  registerScene: (i: number) => (el: HTMLDivElement | null) => void;
  registerLayer: (i: number, slot: number) => (el: HTMLDivElement | null) => void;
  registerPanel: (i: number) => (el: HTMLDivElement | null) => void;
};

/* ------------------------------------------------------------------ */
/*  Floating glass text panel — the readable layer of the 3D world     */
/* ------------------------------------------------------------------ */

function EraPanel({ epoch }: { epoch: Epoch }) {
  const [expanded, setExpanded] = useState(false);
  const years = formatYears(epoch.yearsAgo);
  const readable =
    epoch.yearsAgo === 0 ? "TODAY — 2025 CE" : `${years.value} ${years.unit}`;

  return (
    <div className="chronos-float will-change-transform">
      <div
        data-panel-card="true"
        className="chronos-panel-scroll pointer-events-auto max-h-[46vh] overflow-y-auto rounded-2xl border border-white/12 bg-black/55 p-5 shadow-2xl backdrop-blur-md md:max-h-[82vh] md:p-7"
        style={{ boxShadow: `0 0 110px -28px ${epoch.accent}99` }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.3em] md:text-[10px]"
            style={{ borderColor: `${epoch.accent}66`, color: epoch.accent }}
          >
            {epoch.era}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/45 md:text-[10px]">
            {readable}
          </span>
        </div>

        <h2 className="mt-3 font-display text-[1.65rem] font-bold uppercase leading-[1.04] tracking-tight text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.8)] md:mt-4 md:text-4xl xl:text-[2.9rem]">
          {epoch.title}
        </h2>
        <p className="mt-2 font-display text-[13px] italic text-white/65 md:text-lg">
          {epoch.tagline}
        </p>

        <p
          className={`mt-3 text-[13px] leading-relaxed text-white/78 md:mt-4 md:text-[15px] ${
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

        <ul
          className={`mt-4 gap-2.5 ${expanded ? "grid" : "hidden"} md:grid`}
        >
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

/* ------------------------------------------------------------------ */
/*  One era = one 3D environment (5 depth layers + floating text)      */
/* ------------------------------------------------------------------ */

function SceneEnvironment({
  epoch,
  nextEpoch,
  registerLayer,
  registerPanel,
  priority,
}: {
  epoch: Epoch;
  nextEpoch: Epoch;
  registerLayer: Props["registerLayer"];
  registerPanel: Props["registerPanel"];
  priority: boolean;
}) {
  const tex = TEXTURES[epoch.id];
  const dust = useMemo(() => makeDust(epoch.index), [epoch.index]);

  const layerFrame = (slot: number, extra: number) =>
    ({
      transform: `translateZ(${LAYER_Z[slot]}px) scale(${comp(LAYER_Z[slot], extra).toFixed(4)})`,
    }) as const;

  return (
    <>
      {/* ── far: the NEXT era looming in the void (one universe, mixed eras) ── */}
      <div
        ref={registerLayer(epoch.index, SLOT.GHOST)}
        className="absolute inset-0 will-change-[transform,opacity,filter]"
        style={{
          ...layerFrame(SLOT.GHOST, 1.06),
          opacity: 0.16,
          filter: "blur(6px)",
        }}
      >
        <Image
          src={nextEpoch.image}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          className="object-cover"
          draggable={false}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[#020107]/55" aria-hidden="true" />
      </div>

      {/* ── hero: the era itself, full-bleed ── */}
      <div
        ref={registerLayer(epoch.index, SLOT.MAIN)}
        className="absolute inset-0 will-change-[transform,opacity,filter]"
        style={{ ...layerFrame(SLOT.MAIN, 1.05), opacity: 1 }}
      >
        <Image
          src={epoch.image}
          alt={`${epoch.title} — full-screen cinematic environment`}
          fill
          sizes="100vw"
          priority={priority}
          unoptimized
          className="object-cover"
          draggable={false}
        />
        {/* grading: readability + depth */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, rgba(2,1,7,0.62) 0%, rgba(2,1,7,0.18) 42%, rgba(2,1,7,0) 68%), linear-gradient(180deg, rgba(2,1,7,0.5) 0%, rgba(2,1,7,0) 32%, rgba(2,1,7,0) 52%, rgba(2,1,7,0.78) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 68% 62%, ${epoch.accent}14 0%, transparent 70%)`,
          }}
        />
        {epoch.kind === "extinction" && (
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 48%, rgba(122,12,10,0.30) 100%)",
            }}
          />
        )}
      </div>

      {/* ── mid atmosphere texture ── */}
      <div
        ref={registerLayer(epoch.index, SLOT.TEX_A)}
        className="absolute inset-0 will-change-[transform,opacity,filter]"
        style={{
          ...layerFrame(SLOT.TEX_A, 1.05),
          opacity: tex.midOpacity,
          mixBlendMode: tex.midBlend as React.CSSProperties["mixBlendMode"],
        }}
      >
        <Image src={tex.mid} alt="" fill sizes="100vw" unoptimized className="object-cover" draggable={false} aria-hidden="true" />
      </div>

      {/* ── near texture ── */}
      <div
        ref={registerLayer(epoch.index, SLOT.TEX_B)}
        className="absolute inset-0 will-change-[transform,opacity,filter]"
        style={{
          ...layerFrame(SLOT.TEX_B, 1.04),
          opacity: tex.nearOpacity,
          mixBlendMode: tex.nearBlend as React.CSSProperties["mixBlendMode"],
        }}
      >
        <Image src={tex.near} alt="" fill sizes="100vw" unoptimized className="object-cover" draggable={false} aria-hidden="true" />
      </div>

      {/* ── floating dust at various depths (pure 3D parallax) ── */}
      <div
        ref={registerLayer(epoch.index, SLOT.DUST)}
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d", opacity: 0.95 }}
        aria-hidden="true"
      >
        {dust.map((d, pi) => (
          <div
            key={pi}
            className={`absolute ${pi >= 5 ? "hidden md:block" : ""}`}
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              transform: `translateZ(${d.z}px)`,
            }}
          >
            <div
              className="chronos-drift h-full w-full rounded-full"
              style={{
                backgroundColor: `${epoch.accent}e6`,
                boxShadow: `0 0 ${d.size * 4}px ${epoch.accent}88`,
                filter: d.blur ? `blur(${d.blur}px)` : undefined,
                // @ts-expect-error CSS custom props
                "--dx": `${d.dx}px`,
                "--po": d.opacity,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── floating readable text, hovering inside the world ──
          The engine counter-transforms this card each frame so it stays
          screen-locked (readable) while the 3D world flies around it. */}
      <div
        ref={registerPanel(epoch.index)}
        className="pointer-events-none absolute inset-x-4 bottom-5 z-10 will-change-[transform,opacity] md:inset-x-auto md:bottom-auto md:left-12 md:top-1/2 md:w-[min(560px,44vw)] md:-translate-y-1/2"
      >
        <EraPanel epoch={epoch} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function DepthStage({
  mounted,
  registerWorld,
  registerScene,
  registerLayer,
  registerPanel,
}: Props) {
  return (
    <div
      aria-label="Immersive timeline environments"
      className="fixed inset-0 z-10 overflow-hidden"
      style={{ perspective: `${PERSPECTIVE}px`, perspectiveOrigin: "50% 50%" }}
    >
      <div
        ref={registerWorld}
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {EPOCHS.map((epoch) => {
          const i = epoch.index;
          const nextEpoch = EPOCHS[(i + 1) % EPOCHS.length];
          const isMounted = mounted.has(i);
          return (
            <section
              key={epoch.id}
              ref={registerScene(i)}
              aria-hidden={!isMounted}
              className="absolute inset-0 will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                opacity: 0,
                visibility: "hidden",
                pointerEvents: "none",
              }}
            >
              {isMounted ? (
                <SceneEnvironment
                  epoch={epoch}
                  nextEpoch={nextEpoch}
                  registerLayer={registerLayer}
                  registerPanel={registerPanel}
                  priority={i <= 2}
                />
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
