"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StarfieldZoom from "./StarfieldZoom";
import DepthStage from "./DepthStage";
import TimeHUD from "./TimeHUD";
import { Atmosphere, Intro, Outro, OutroBackdrop } from "./Overlays";
import { EPOCHS, ANCHORS, INTRO_END, OUTRO_START, SPACING } from "@/lib/cosmos/timeline";
import { yearsAgoAt, formatYears, clamp, smoothstep } from "@/lib/cosmos/format";
import { hexToRgb, mixRgb, rgba, type EngineState } from "@/lib/cosmos/engine-state";
import {
  SLOT,
  LAYER_Z,
  LAYER_STATIC_BLUR,
  LAYER_BLUR_WEIGHT,
  TEXTURES,
  comp,
  sceneMotion,
  PANEL_Z,
  PERSPECTIVE,
} from "@/lib/cosmos/depth";

/**
 * CHRONOS 3D ENGINE
 * -----------------
 * Native scroll is only a *target*; a rAF loop glides a virtual cursor toward
 * it and flies a 3D camera through stacked image worlds. Each era is an
 * environment of depth layers (next-era ghost, hero plate, two blended
 * atmosphere textures, floating dust, glass text). Holding at an era dollies
 * the camera INTO it; between eras the camera accelerates THROUGH the world
 * while the next era rushes out of the void — a light-speed dive through time.
 *
 * Because CSS opacity/filter flatten preserve-3d subtrees, per-layer opacity
 * and blur are written individually every frame. No React re-renders occur
 * during the loop — all writes go straight to the DOM.
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

  // --- scene graph refs (written by the engine loop at 60fps) ---
  const worldRef = useRef<HTMLDivElement | null>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>(EPOCHS.map(() => null));
  const layerRefs = useRef<(HTMLDivElement | null)[][]>(
    EPOCHS.map(() => [null, null, null, null, null])
  );
  const panelRefs = useRef<(HTMLDivElement | null)[]>(EPOCHS.map(() => null));
  const letterTopRef = useRef<HTMLDivElement | null>(null);
  const letterBotRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  // per-scene panel layout centers (dx, dy from viewport center) for the
  // perspective counter-transform that keeps floating text readable
  const panelCenters = useRef<{ dx: number; dy: number }[]>(
    EPOCHS.map(() => ({ dx: 0, dy: 0 }))
  );

  // --- HUD refs ---
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

  // --- parent-owned register callbacks (React-compiler friendly) ---
  const registerWorld = useCallback((el: HTMLDivElement | null) => {
    worldRef.current = el;
  }, []);
  const registerScene = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      sceneRefs.current[i] = el;
    },
    []
  );
  const registerLayer = useCallback(
    (i: number, slot: number) => (el: HTMLDivElement | null) => {
      layerRefs.current[i][slot] = el;
    },
    []
  );
  const registerPanel = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      panelRefs.current[i] = el;
    },
    []
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stateRef.current.reducedMotion = reduced;

    let max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    // measure panel layout boxes (offset* = layout values, immune to transforms)
    const measurePanels = () => {
      for (let i = 0; i < EPOCHS.length; i++) {
        const el = panelRefs.current[i];
        if (!el) continue;
        panelCenters.current[i] = {
          dx: el.offsetLeft + el.offsetWidth / 2 - window.innerWidth / 2,
          dy: el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2,
        };
      }
    };
    measurePanels();

    const onResize = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      measurePanels();
    };
    window.addEventListener("resize", onResize);

    // per-slot base opacities (must mirror DepthStage's initial inline values)
    const baseOps: number[][] = EPOCHS.map((e) => {
      const tex = TEXTURES[e.id];
      return [0.16, 1, tex.midOpacity, tex.nearOpacity, 0.95];
    });

    // mouse parallax (fine pointers only)
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
      const accentList = EPOCHS.map((e) => hexToRgb(e.accent));
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

      // ---- mouse parallax on the whole world ----
      if (canParallax && worldRef.current) {
        const pk = Math.min(1, dt * 3.2);
        mx += (mxT - mx) * pk;
        my += (myT - my) * pk;
        worldRef.current.style.transform = `rotateY(${(mx * 2.4).toFixed(3)}deg) rotateX(${(-my * 1.8).toFixed(3)}deg)`;
      }

      // ---- cinematic letterbox slides in at warp ----
      const vNorm = Math.min(1, speed / (window.innerHeight * 0.075));
      if (letterTopRef.current) {
        letterTopRef.current.style.transform = `translateY(${((vNorm - 1) * 100).toFixed(1)}%)`;
      }
      if (letterBotRef.current) {
        letterBotRef.current.style.transform = `translateY(${((1 - vNorm) * 100).toFixed(1)}%)`;
      }
      // ---- hyperspace flash at the moment of era-crossing ----
      if (flashRef.current) {
        const flash = Math.max(0, vNorm - 0.72) * 0.28;
        flashRef.current.style.opacity = Math.min(0.16, flash).toFixed(3);
      }

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

      // ---- THE 3D CAMERA: fly through every mounted world ----
      for (let i = 0; i < EPOCHS.length; i++) {
        const root = sceneRefs.current[i];
        if (!root) continue;
        const phase = (progress - ANCHORS[i]) / SPACING;
        const m = sceneMotion(phase);
        if (!m.active) {
          if (root.style.visibility !== "hidden") {
            root.style.visibility = "hidden";
            root.style.opacity = "0";
          }
          continue;
        }
        root.style.visibility = "visible";
        root.style.opacity = "1";
        root.style.transform = `translate3d(0, 0, ${m.z.toFixed(1)}px) rotateX(${m.rotX.toFixed(2)}deg)`;

        const layers = layerRefs.current[i];
        if (layers) {
          for (let slot = 0; slot <= SLOT.DUST; slot++) {
            const el = layers[slot];
            if (!el) continue;
            el.style.opacity = (baseOps[i][slot] * m.opacity).toFixed(3);
            const totalBlur = LAYER_STATIC_BLUR[slot] + m.blur * LAYER_BLUR_WEIGHT[slot];
            el.style.filter = totalBlur > 0.05 ? `blur(${totalBlur.toFixed(2)}px)` : "none";
          }
          // hero plate: slow Ken Burns breathing on top of the camera dolly
          const main = layers[SLOT.MAIN];
          if (main) {
            const breathe = 1 + 0.032 * Math.sin(now * 0.00011 + i * 1.7);
            const baseScale = comp(LAYER_Z[SLOT.MAIN], 1.05);
            main.style.transform = `translateZ(${LAYER_Z[SLOT.MAIN]}px) scale(${(baseScale * breathe).toFixed(4)})`;
          }
        }
        const panel = panelRefs.current[i];
        if (panel) {
          // perspective counter-transform: keep the card's screen position
          // ~82% locked (readable) while still drifting with the world
          const zEff = Math.min(PANEL_Z + m.z, PERSPECTIVE * 0.9);
          const mm = PERSPECTIVE / Math.max(60, PERSPECTIVE - zEff);
          const c = panelCenters.current[i];
          const KEEP = 0.82;
          panel.style.transform =
            `translateZ(${PANEL_Z}px) ` +
            `translateX(${(-(mm - 1) * c.dx * KEEP).toFixed(1)}px) ` +
            `translateY(${(-(mm - 1) * c.dy * KEEP).toFixed(1)}px) ` +
            `scale(${(1 / mm).toFixed(4)})`;
          panel.style.opacity = m.panel.toFixed(3);
          // the inner card is scrollable — only while actually visible
          const card = panel.firstElementChild?.firstElementChild as HTMLElement | null;
          if (card) card.style.pointerEvents = m.panel > 0.45 ? "auto" : "none";
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
          const changed = next.size !== prev.size;
          if (changed) setTimeout(measurePanels, 60);
          return changed ? next : prev;
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

      {/* fixed cinematic layers */}
      <StarfieldZoom stateRef={stateRef} />
      <OutroBackdrop />
      <DepthStage
        mounted={mounted}
        registerWorld={registerWorld}
        registerScene={registerScene}
        registerLayer={registerLayer}
        registerPanel={registerPanel}
      />
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
        <div
          ref={flashRef}
          className="absolute inset-0 bg-white opacity-0 mix-blend-screen"
        />
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
