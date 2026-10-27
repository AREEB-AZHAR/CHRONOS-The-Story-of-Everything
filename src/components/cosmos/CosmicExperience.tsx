"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WarpCanvas from "./WarpCanvas";
import EpochStage from "./EpochStage";
import TimeHUD from "./TimeHUD";
import { Atmosphere, Intro, Outro, OutroBackdrop } from "./Overlays";
import { EPOCHS, ANCHORS, INTRO_END, OUTRO_START, SPACING } from "@/lib/cosmos/timeline";
import { yearsAgoAt, formatYears, clamp, smoothstep } from "@/lib/cosmos/format";
import { hexToRgb, mixRgb, rgba, type EngineState } from "@/lib/cosmos/engine-state";

/**
 * CHRONOS ENGINE
 * --------------
 * A custom cinematic scroll engine. Native scroll position is only a *target*;
 * a rAF loop glides a virtual cursor toward it (critically-damped lerp), maps
 * position to logarithmic cosmic time, and drives every visual layer — the
 * warp canvas, the year odometer, the era readout, and per-epoch crossfades —
 * directly through the DOM for frame-perfect sync.
 *
 * The scroll track is 26 viewport-heights tall; everything visible is fixed.
 */
const TOTAL_SCREENS = 26;

export default function CosmicExperience() {
  const stateRef = useRef<EngineState>({
    progress: 0,
    velocity: 0,
    speed: 0,
    accent: hexToRgb(EPOCHS[0].accent),
    accentCss: EPOCHS[0].accent,
    reducedMotion: false,
  });

  const trackRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>(EPOCHS.map(() => null));
  const imageRefs = useRef<(HTMLDivElement | null)[]>(EPOCHS.map(() => null));

  // HUD refs — written directly by the engine loop (no React re-render at 60fps)
  const yearValueRef = useRef<HTMLSpanElement | null>(null);
  const yearUnitRef = useRef<HTMLSpanElement | null>(null);
  const eraRef = useRef<HTMLSpanElement | null>(null);
  const warpRef = useRef<HTMLSpanElement | null>(null);
  const warpBarRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const outroRef = useRef<HTMLDivElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0, 1, 2]));

  const jumpTo = useCallback((progress: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: progress * max, behavior: "smooth" });
  }, []);

  const restart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const registerSection = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      sectionRefs.current[index] = el;
    },
    []
  );
  const registerImage = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      imageRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stateRef.current.reducedMotion = reduced;

    let max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const onResize = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const accentList = EPOCHS.map((e) => hexToRgb(e.accent));

    let cur = window.scrollY;
    let prevCur = cur;
    let last = performance.now();
    let raf = 0;
    let lastActive = -1;
    let hintHidden = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // ---- virtual cursor glide (the cinematic smoothing) ----
      const target = Math.min(window.scrollY, max);
      const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
      cur += (target - cur) * k;
      if (Math.abs(target - cur) < 0.15) cur = target;
      const velocity = (cur - prevCur) / Math.max(dt, 1e-4) / 60; // px per 60fps frame
      prevCur = cur;
      const speed = Math.abs(velocity);

      const progress = clamp(cur / max);
      const s = stateRef.current;
      s.progress = progress;
      s.velocity = velocity;
      s.speed = speed;

      // ---- era accent interpolation ----
      let ai = 0;
      while (ai < ANCHORS.length - 1 && ANCHORS[ai + 1] < progress) ai++;
      const a0 = ANCHORS[ai];
      const a1 = ANCHORS[Math.min(ai + 1, ANCHORS.length - 1)];
      const u = clamp((progress - a0) / Math.max(a1 - a0, 1e-6));
      const c = mixRgb(
        accentList[ai],
        accentList[Math.min(ai + 1, accentList.length - 1)],
        u
      );
      s.accent = c;
      s.accentCss = rgba(c, 1);

      // ---- odometer ----
      const yearsAgo = yearsAgoAt(progress);
      const f = formatYears(yearsAgo);
      if (yearValueRef.current) {
        yearValueRef.current.textContent = f.value;
        const blur = Math.min(2.6, speed / 55);
        yearValueRef.current.style.filter = blur > 0.35 ? `blur(${blur.toFixed(2)}px)` : "none";
        yearValueRef.current.style.textShadow = `0 0 ${18 + Math.min(70, speed)}px ${rgba(c, 0.35)}`;
        yearValueRef.current.style.color = "rgba(255,255,255,0.96)";
      }
      if (yearUnitRef.current) yearUnitRef.current.textContent = f.unit;

      // ---- era chip + active stop ----
      let nearest = 0;
      let nd = Infinity;
      for (let i = 0; i < ANCHORS.length; i++) {
        const d = Math.abs(progress - ANCHORS[i]);
        if (d < nd) {
          nd = d;
          nearest = i;
        }
      }
      if (eraRef.current) {
        const atStart = progress < INTRO_END * 0.8 && nearest === 0;
        const atEnd = progress > OUTRO_START + 0.02 && nearest === EPOCHS.length - 1;
        const holding = nd < SPACING * 0.3 || atStart || atEnd;
        const compact = window.innerWidth < 640;
        eraRef.current.textContent = holding
          ? EPOCHS[nearest].era
          : compact
            ? "IN TRANSIT"
            : "IN TRANSIT · LIGHT SPEED";
        eraRef.current.style.color = holding ? EPOCHS[nearest].accent : "rgba(255,255,255,0.65)";
        eraRef.current.style.borderColor = holding
          ? `${EPOCHS[nearest].accent}66`
          : "rgba(255,255,255,0.1)";
      }

      // ---- warp meter ----
      const cFrac = Math.min(0.999, speed / (window.innerHeight * 0.085));
      if (warpRef.current) {
        warpRef.current.textContent = cFrac > 0.006 ? `${cFrac.toFixed(2)} c` : "ORBIT HOLD";
        warpRef.current.style.color = cFrac > 0.6 ? "#fda4af" : undefined;
      }
      if (warpBarRef.current) {
        warpBarRef.current.style.transform = `scaleX(${Math.min(1, cFrac).toFixed(3)})`;
      }

      // ---- hairline progress ----
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;

      // ---- intro ----
      if (introRef.current) {
        const o = 1 - smoothstep(progress / (INTRO_END * 0.8));
        introRef.current.style.opacity = o.toFixed(3);
        introRef.current.style.transform = `translate3d(0, ${((1 - o) * -46).toFixed(1)}px, 0) scale(${(1 + (1 - o) * 0.08).toFixed(4)})`;
      }

      // ---- scroll hint ----
      const hintEl = document.getElementById("scroll-hint");
      if (hintEl) {
        if (!hintHidden && progress > 0.018) {
          hintEl.style.opacity = "0";
          hintHidden = true;
        } else if (hintHidden && progress <= 0.012) {
          hintEl.style.opacity = "1";
          hintHidden = false;
        }
      }

      // ---- outro ----
      if (outroRef.current) {
        const o = smoothstep((progress - OUTRO_START) / 0.03);
        outroRef.current.style.opacity = o.toFixed(3);
        outroRef.current.style.pointerEvents = o > 0.6 ? "auto" : "none";
        outroRef.current.style.transform = `translate3d(0, ${((1 - o) * 30).toFixed(1)}px, 0)`;
      }
      const backdrop = document.getElementById("outro-backdrop");
      if (backdrop) {
        backdrop.style.opacity = smoothstep((progress - (OUTRO_START - 0.012)) / 0.04).toFixed(3);
      }

      // ---- epoch crossfades ----
      const visWindow = SPACING * 0.62;
      for (let i = 0; i < EPOCHS.length; i++) {
        const el = sectionRefs.current[i];
        if (!el) continue;
        const dp = progress - ANCHORS[i];
        const dist = Math.abs(dp);
        if (dist > visWindow * 1.2) {
          if (el.style.opacity !== "0") {
            el.style.opacity = "0";
            el.style.filter = "none";
          }
          continue;
        }
        const vis = smoothstep(1 - dist / visWindow);
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `translate3d(0, ${((-dp / visWindow) * 110).toFixed(1)}px, 0)`;
        const blur = (1 - vis) * 9;
        el.style.filter = blur > 0.35 ? `blur(${blur.toFixed(1)}px)` : "none";
        const img = imageRefs.current[i];
        if (img) {
          const sc = 1.09 - vis * 0.09;
          img.style.transform = `scale(${sc.toFixed(4)})`;
        }
      }

      // ---- react state (only on stop change) ----
      if (nearest !== lastActive) {
        lastActive = nearest;
        setActiveIndex(nearest);
        setMounted((prev) => {
          const next = new Set(prev);
          for (let d = -2; d <= 2; d++) {
            const i = nearest + d;
            if (i >= 0 && i < EPOCHS.length) next.add(i);
          }
          return next.size === prev.size ? prev : next;
        });
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <main className="bg-[#020107] text-foreground">
      {/* scroll track — the only in-flow element; defines journey length */}
      <div
        ref={trackRef}
        aria-hidden="true"
        className="h-[2600svh] w-full"
      />

      {/* fixed cinematic layers */}
      <WarpCanvas stateRef={stateRef} />
      <OutroBackdrop />
      <EpochStage registerSection={registerSection} registerImage={registerImage} mounted={mounted} />
      <Atmosphere />
      <TimeHUD
        activeIndex={activeIndex}
        yearValueRef={yearValueRef}
        yearUnitRef={yearUnitRef}
        eraRef={eraRef}
        warpRef={warpRef}
        warpBarRef={warpBarRef}
        barRef={barRef}
        onJump={jumpTo}
      />
      <Intro introRef={introRef} />
      <Outro outroRef={outroRef} onRestart={restart} />
    </main>
  );
}
