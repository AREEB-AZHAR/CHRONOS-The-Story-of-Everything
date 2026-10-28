"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TextLayer from "./TextLayer";
import TimeHUD from "./TimeHUD";
import { Atmosphere, Intro, Outro } from "./Overlays";
import { EPOCHS, ANCHORS, INTRO_END, OUTRO_START, SPACING } from "@/lib/cosmos/timeline";
import { yearsAgoAt, formatYears, clamp, smoothstep } from "@/lib/cosmos/format";
import { hexToRgb, mixRgb, rgba, type EngineState } from "@/lib/cosmos/engine-state";
import { ChronosEngine } from "@/lib/cosmos/engine3d";

/** 3-arg smoothstep over a range (format.ts's is the 1-arg classic form). */
const smoothRange = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

/**
 * CHRONOS 3D — WebGL time-dive (reliwebgl-style architecture)
 * ----------------------------------------------------------------
 * ONE fixed full-screen canvas renders every era as a 3D world you dive
 * into (engine3d.ts). Native scroll is only a *target*; a rAF loop glides
 * a virtual cursor toward it and drives the WebGL camera. The DOM carries
 * only the floating text panels + HUD — written per frame with transform /
 * opacity alone, so the whole experience stays on the GPU compositor.
 */

export default function CosmicExperience() {
  const stateRef = useRef<EngineState>({
    progress: 0,
    velocity: 0,
    speed: 0,
    accent: hexToRgb(EPOCHS[0].accent),
    accentCss: EPOCHS[0].accent,
    reducedMotion: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ChronosEngine | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>(EPOCHS.map(() => null));

  // --- HUD refs ---
  const yearValueRef = useRef<HTMLSpanElement | null>(null);
  const yearUnitRef = useRef<HTMLSpanElement | null>(null);
  const eraRef = useRef<HTMLSpanElement | null>(null);
  const warpRef = useRef<HTMLSpanElement | null>(null);
  const warpBarRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const outroRef = useRef<HTMLDivElement | null>(null);
  const letterTopRef = useRef<HTMLDivElement | null>(null);
  const letterBotRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0, 1, 2]));

  const jumpTo = useCallback((progress: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: progress * max, behavior: "smooth" });
  }, []);

  const restart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const registerPanel = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      panelRefs.current[i] = el;
    },
    []
  );

  /* ---------- WebGL engine lifecycle ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    let engine: ChronosEngine | null = null;
    try {
      engine = new ChronosEngine(canvas, isMobile);
      engineRef.current = engine;
    } catch (e) {
      // WebGL unavailable — the DOM journey (text, HUD) still works
      console.warn("WebGL init failed", e);
      return;
    }
    const onResize = () =>
      engine?.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  /* ---------- the cinematic loop ---------- */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stateRef.current.reducedMotion = reduced;

    let max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const onResize = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // mouse parallax targets (fine pointers only)
    let mxT = 0;
    let myT = 0;
    let mx = 0;
    let my = 0;
    const onMove = (e: MouseEvent) => {
      mxT = (e.clientX / window.innerWidth) * 2 - 1;
      myT = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const canParallax = window.matchMedia("(pointer: fine)").matches;
    if (canParallax) window.addEventListener("mousemove", onMove, { passive: true });

    const accentList = EPOCHS.map((e) => hexToRgb(e.accent));

    let cur = window.scrollY;
    let prevCur = cur;
    let last = performance.now();
    let raf = 0;
    let lastActive = -1;
    let hintHidden = false;
    // last-written DOM values to avoid redundant style/layout work
    const panelCache: number[][] = EPOCHS.map(() => [-1, -1]);
    const dom: Record<string, string> = {};
    const setStyle = (
      el: HTMLElement | null,
      prop: string,
      val: string,
      key?: string
    ) => {
      if (!el) return;
      const k = key ?? prop;
      if (dom[k] === val) return;
      dom[k] = val;
      (el.style as unknown as Record<string, string>)[prop] = val;
    };
    const setText = (el: HTMLElement | null, val: string, key: string) => {
      if (!el || dom[key] === val) return;
      dom[key] = val;
      el.textContent = val;
    };

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
      if (process.env.NODE_ENV !== "production") {
        const w = window as unknown as Record<string, number>;
        w.__chronosFrames = (w.__chronosFrames || 0) + 1;
        w.__chronosProgress = progress;
      }

      // ---- WebGL world ----
      if (canParallax) {
        const pk = Math.min(1, dt * 3.2);
        mx += (mxT - mx) * pk;
        my += (myT - my) * pk;
      } else {
        mx = 0;
        my = 0;
      }
      const warp = Math.min(1, speed / (window.innerHeight * 0.075));
      engineRef.current?.update({ progress, warp, pointerX: mx, pointerY: my, reduced }, now);

      // ---- era accent interpolation ----
      let ai = 0;
      while (ai < ANCHORS.length - 1 && ANCHORS[ai + 1] < progress) ai++;
      const a0 = ANCHORS[ai];
      const a1 = ANCHORS[Math.min(ai + 1, ANCHORS.length - 1)];
      const u = clamp((progress - a0) / Math.max(a1 - a0, 1e-6));
      const c = mixRgb(accentList[ai], accentList[Math.min(ai + 1, accentList.length - 1)], u);
      s.accent = c;
      s.accentCss = rgba(c, 1);

      // ---- odometer ----
      const f = formatYears(yearsAgoAt(progress));
      setText(yearValueRef.current, f.value, "yv");
      setText(yearUnitRef.current, f.unit, "yu");
      if (yearValueRef.current) {
        const ts = `0 2px 26px rgba(0,0,0,0.92), 0 0 ${18 + Math.min(70, speed)}px ${rgba(c, 0.32)}`;
        setStyle(yearValueRef.current, "textShadow", ts, "yts");
      }

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
        const eraText = holding
          ? EPOCHS[nearest].era
          : compact
            ? "IN TRANSIT"
            : "IN TRANSIT · LIGHT SPEED";
        setText(eraRef.current, eraText, "era");
        setStyle(
          eraRef.current,
          "color",
          holding ? EPOCHS[nearest].accent : "rgba(255,255,255,0.65)",
          "eraC"
        );
        setStyle(
          eraRef.current,
          "borderColor",
          holding ? `${EPOCHS[nearest].accent}66` : "rgba(255,255,255,0.1)",
          "eraB"
        );
      }

      // ---- warp meter ----
      const cFrac = Math.min(0.999, speed / (window.innerHeight * 0.085));
      setText(
        warpRef.current,
        cFrac > 0.006 ? `${cFrac.toFixed(2)} c` : "ORBIT HOLD",
        "warp"
      );
      if (warpRef.current) {
        const wc = cFrac > 0.6 ? "#fda4af" : "";
        setStyle(warpRef.current, "color", wc, "warpC");
      }
      if (warpBarRef.current) {
        setStyle(
          warpBarRef.current,
          "transform",
          `scaleX(${Math.min(1, cFrac).toFixed(3)})`,
          "warpBar"
        );
      }

      // ---- hairline progress ----
      if (barRef.current) {
        setStyle(barRef.current, "transform", `scaleX(${progress.toFixed(4)})`, "bar");
      }

      // ---- cinematic letterbox slides in at warp ----
      const vNorm = warp;
      if (letterTopRef.current) {
        setStyle(
          letterTopRef.current,
          "transform",
          `translateY(${((vNorm - 1) * 100).toFixed(1)}%)`,
          "lt"
        );
      }
      if (letterBotRef.current) {
        setStyle(
          letterBotRef.current,
          "transform",
          `translateY(${((1 - vNorm) * 100).toFixed(1)}%)`,
          "lb"
        );
      }
      if (flashRef.current) {
        const flash = Math.max(0, vNorm - 0.72) * 0.28;
        setStyle(flashRef.current, "opacity", Math.min(0.14, flash).toFixed(3), "fl");
      }

      // ---- intro ----
      if (introRef.current) {
        const o = 1 - smoothstep(progress / (INTRO_END * 0.8));
        setStyle(introRef.current, "opacity", o.toFixed(3), "inO");
        setStyle(
          introRef.current,
          "transform",
          `translate3d(0, ${((1 - o) * -46).toFixed(1)}px, 0) scale(${(1 + (1 - o) * 0.08).toFixed(4)})`,
          "inT"
        );
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
        setStyle(outroRef.current, "opacity", o.toFixed(3), "outO");
        setStyle(outroRef.current, "pointerEvents", o > 0.6 ? "auto" : "none", "outP");
        setStyle(
          outroRef.current,
          "transform",
          `translate3d(0, ${((1 - o) * 30).toFixed(1)}px, 0)`,
          "outT"
        );
      }

      // ---- floating text panels (transform/opacity only) ----
      // sweep ALL panels: the per-panel value cache makes hidden-writes
      // one-shot, and it guarantees no stale visible panel after rail jumps
      for (let i = 0; i < EPOCHS.length; i++) {
        const el = panelRefs.current[i];
        if (!el) continue;
        const phase = (progress - ANCHORS[i]) / SPACING;
        const alpha =
          smoothRange(-0.148, -0.102, phase) * (1 - smoothRange(0.102, 0.148, phase));
        const aR = Math.round(alpha * 100) / 100;
        if (Math.abs(aR - panelCache[i][0]) < 0.005) continue;
        panelCache[i][0] = aR;
        const vis = aR > 0.004;
        el.style.visibility = vis ? "visible" : "hidden";
        el.style.opacity = aR.toFixed(3);
        const y = (1 - alpha) * 28;
        const sc = 0.985 + 0.015 * alpha;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
        const card = el.firstElementChild?.firstElementChild as HTMLElement | null;
        if (card) card.style.pointerEvents = alpha > 0.45 ? "auto" : "none";
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
          return next.size !== prev.size ? next : prev;
        });
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (canParallax) window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <main className="bg-[#020107] text-foreground">
      {/* scroll track — the only in-flow element; defines journey length */}
      <div aria-hidden="true" className="h-[2600svh] w-full" />

      {/* THE 3D WORLD — one fixed WebGL canvas */}
      <canvas
        ref={canvasRef}
        aria-label="Cinematic 3D journey through 13.8 billion years"
        role="img"
        className="fixed inset-0 z-10 h-full w-full"
      />

      {/* floating readable text */}
      <TextLayer mounted={mounted} registerPanel={registerPanel} />

      {/* film grain + vignette scrims */}
      <Atmosphere />

      {/* warp letterbox + hyperspace flash */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[16]">
        <div
          ref={letterTopRef}
          className="absolute inset-x-0 top-0 h-[3.4vh] bg-black"
          style={{ transform: "translateY(-100%)" }}
        />
        <div
          ref={letterBotRef}
          className="absolute inset-x-0 bottom-0 h-[3.4vh] bg-black"
          style={{ transform: "translateY(100%)" }}
        />
        <div ref={flashRef} className="absolute inset-0 bg-white opacity-0" />
      </div>

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
