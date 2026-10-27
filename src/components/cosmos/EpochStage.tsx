"use client";

import Image from "next/image";
import { EPOCHS, type Epoch } from "@/lib/cosmos/timeline";
import { formatYears } from "@/lib/cosmos/format";

type Props = {
  registerSection: (index: number) => (el: HTMLElement | null) => void;
  registerImage: (index: number) => (el: HTMLDivElement | null) => void;
  mounted: Set<number>;
};

function ExtinctionPanel({ epoch }: { epoch: Epoch }) {
  if (!epoch.extinctions?.length) return null;
  return (
    <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-400/90">
        Extinction memorial — species lost
      </p>
      <ul className="mt-3 hidden gap-3 md:grid">
        {epoch.extinctions.map((ex) => (
          <li key={ex.name} className="flex items-baseline gap-3 text-sm">
            <span className="shrink-0 font-semibold text-red-300">{ex.name}</span>
            <span className="h-px flex-1 self-center bg-red-500/20" aria-hidden="true" />
            <span className="text-right text-xs text-white/55">{ex.note}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-2 flex flex-wrap gap-1.5 md:hidden">
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
  );
}

function EpochCard({
  epoch,
  registerImage,
}: {
  epoch: Epoch;
  registerImage: (index: number) => (el: HTMLDivElement | null) => void;
}) {
  const years = formatYears(epoch.yearsAgo);
  const readable =
    epoch.yearsAgo === 0 ? "TODAY — 2025 CE" : `${years.value} ${years.unit}`;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-4 px-5 py-14 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-8 lg:py-0">
      {/* Visual */}
      <div className="relative">
        <div
          className="relative h-[24vh] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] ring-1 ring-white/10 will-change-transform md:h-[32vh]"
          style={{ boxShadow: `0 0 90px -18px ${epoch.accent}55` }}
          ref={registerImage(epoch.index)}
        >
          <Image
            src={epoch.image}
            alt={`${epoch.title} — cinematic illustration`}
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            priority={epoch.index <= 2}
            unoptimized
            className="object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(2,1,7,0.12) 0%, rgba(2,1,7,0) 40%, rgba(2,1,7,0.45) 100%)",
            }}
            aria-hidden="true"
          />
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/85 backdrop-blur-sm">
            {readable}
          </span>
        </div>
      </div>

      {/* Copy */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ borderColor: `${epoch.accent}66`, color: epoch.accent }}
          >
            {epoch.era}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            Stop {String(epoch.index + 1).padStart(2, "0")} / {EPOCHS.length}
          </span>
        </div>

        <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight text-white md:mt-4 md:text-5xl lg:text-6xl">
          {epoch.title}
        </h2>
        <p className="mt-2 font-display text-base italic text-white/60 md:text-lg">
          {epoch.tagline}
        </p>

        <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/75 md:mt-4 md:text-[15px]">
          {epoch.body}
        </p>

        {/* Facts — desktop */}
        <ul className="mt-5 hidden gap-2.5 md:grid">
          {epoch.facts.map((f) => (
            <li key={f.label} className="flex items-baseline gap-3 text-sm">
              <span
                className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-wider"
                style={{ color: epoch.accent }}
              >
                {f.label}
              </span>
              <span className="text-white/70">{f.text}</span>
            </li>
          ))}
        </ul>

        <ExtinctionPanel epoch={epoch} />
      </div>
    </div>
  );
}

export default function EpochStage({ registerSection, registerImage, mounted }: Props) {
  return (
    <div
      aria-label="Journey stops"
      className="fixed inset-0 z-10 flex items-center justify-center"
    >
      {EPOCHS.map((epoch) => {
        const isMounted = mounted.has(epoch.index);
        return (
          <section
            key={epoch.id}
            ref={registerSection(epoch.index)}
            aria-hidden={!isMounted}
            className="absolute inset-0 flex items-center justify-center px-0 pt-16 will-change-transform md:pt-24"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            {isMounted ? (
              <EpochCard epoch={epoch} registerImage={registerImage} />
            ) : (
              <div className="mx-auto hidden w-full max-w-6xl grid-cols-[1.05fr_1fr] gap-12 px-8 md:grid">
                <div className="aspect-[2/1] w-full rounded-2xl bg-white/[0.03]" />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
