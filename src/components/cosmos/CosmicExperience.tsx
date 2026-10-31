"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TimeHUD from "./TimeHUD";
import GlassPanel from "./GlassPanel";
import { EPOCHS, EPOCH_COUNT as N } from "@/lib/cosmos/timeline";
import { epochDelta, epochMod, epochYearsAgo, formatYears } from "@/lib/cosmos/format";
import { OrbitEngine } from "@/lib/cosmos/engine-orbit";

/**
 * CHRONOS ∞ — the eternal time-ocean
 * -----------------------------------
 * You hang at the center of spacetime while every epoch drifts around you
 * on an endless ring. There is no scrollbar and no end:
 *  - wheel / drag / arrow keys push a virtual time cursor with momentum
 *  - an idle current always flows — the universe never stops moving
 *  - the ring wraps modulo the epoch count, so travel is literally infinite
 *  - clicking a photograph pulls it to your face and raises the glasswork
 *    window (animated shine) with that era's full story
 */

const IDLE_DRIFT = 0.005; // epochs per second when untouched
const WHEEL_GAIN = 0.0016; // epochs per wheel px
const DRAG_GAIN = 0.0048; // epochs per drag px

export default function CosmicExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<OrbitEngine | null>(null);

  // virtual time cursor
  const timeRef = useRef({ t: -0.9, target: -0.9, fling: 0 });

  // focus state machine
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const focusRef = useRef<number | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    focusRef.current = focusIdx;
  }, [focusIdx]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [introGone, setIntroGone] = useState(false);

  // HUD refs
  const yearValueRef = useRef<HTMLSpanElement | null>(null);
  const yearUnitRef = useRef<HTMLSpanElement | null>(null);
  const eraRef = useRef<HTMLSpanElement | null>(null);
  const warpRef = useRef<HTMLSpanElement | null>(null);
  const warpBarRef = useRef<HTMLDivElement | null>(null);

  /* ---------- engine lifecycle ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    let engine: OrbitEngine | null = null;
    try {
      engine = new OrbitEngine(canvas, isMobile);
      engineRef.current = engine;
    } catch (e) {
      console.warn("WebGL init failed", e);
      return;
    }
    // expose pick for diagnostics (dev only)
    if (engine && process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__chronosPick = (
        nx: number,
        ny: number
      ) => engine?.pick(nx, ny) ?? -1;
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

  /* ---------- focus helpers ---------- */
  const openFocus = useCallback((i: number) => {
    setIntroGone(true);
    setFocusIdx(i);
    engineRef.current?.setFocus(i);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setShowPanel(true), 470);
  }, []);

  const closeFocus = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    setShowPanel(false);
    engineRef.current?.setFocus(null);
    setFocusIdx(null);
  }, []);

  const jumpTo = useCallback((i: number) => {
    setIntroGone(true);
    const s = timeRef.current;
    s.target = s.t + epochDelta(i, s.t);
    s.fling = 0;
  }, []);

  /* ---------- input + the cinematic loop ---------- */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canParallax = window.matchMedia("(pointer: fine)").matches;

    let smxT = 0;
    let smyT = 0;
    let smx = 0;
    let smy = 0;
    let last = performance.now();
    let raf = 0;
    let lastActive = -1;
    let lastPickAt = 0;

    // drag state
    let dragging = false;
    let moved = false;
    let downX = 0;
    let downY = 0;
    let lastY = 0;
    let lastMoveT = 0;
    let dragVel = 0;

    const dom: Record<string, string> = {};
    const setText = (el: HTMLElement | null, val: string, key: string) => {
      if (!el || dom[key] === val) return;
      dom[key] = val;
      el.textContent = val;
    };
    const setStyle = (el: HTMLElement | null, prop: string, val: string, key: string) => {
      if (!el || dom[key] === val) return;
      dom[key] = val;
      (el.style as unknown as Record<string, string>)[prop] = val;
    };

    /* ----- wheel: the time current ----- */
    const onWheel = (e: WheelEvent) => {
      if (focusRef.current !== null) return; // the glass window scrolls itself
      e.preventDefault();
      setIntroGone(true);
      const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      timeRef.current.target += d * WHEEL_GAIN;
      timeRef.current.fling = 0;
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    /* ----- keys ----- */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFocus();
        return;
      }
      if (focusRef.current !== null) return;
      const s = timeRef.current;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        s.target += 0.8;
        s.fling = 0;
        setIntroGone(true);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        s.target -= 0.8;
        s.fling = 0;
        setIntroGone(true);
      }
    };
    window.addEventListener("keydown", onKey);

    /* ----- pointer: drag to drift, tap to open ----- */
    const canvas = canvasRef.current;
    const onDown = (e: PointerEvent) => {
      if (focusRef.current !== null) return;
      dragging = true;
      moved = false;
      downX = e.clientX;
      downY = e.clientY;
      lastY = e.clientY;
      lastMoveT = performance.now();
      dragVel = 0;
      if (canvas) canvas.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      // parallax targets
      if (canParallax && e.pointerType === "mouse") {
        smxT = (e.clientX / window.innerWidth) * 2 - 1;
        smyT = (e.clientY / window.innerHeight) * 2 - 1;
      }
      if (!dragging || focusRef.current !== null) return;
      const now = performance.now();
      const dy = e.clientY - lastY;
      const dtm = Math.max(8, now - lastMoveT);
      lastY = e.clientY;
      lastMoveT = now;
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 7) moved = true;
      if (moved) {
        setIntroGone(true);
        timeRef.current.target -= dy * DRAG_GAIN;
        dragVel = dragVel * 0.72 + (-dy * DRAG_GAIN) / (dtm / 1000) * 0.28;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (focusRef.current !== null) return;
      if (canvas) canvas.style.cursor = "";
      if (!dragging) return;
      dragging = false;
      if (moved) {
        // fling inertia
        timeRef.current.fling = Math.max(-3.2, Math.min(3.2, dragVel * 0.5));
      } else if (engineRef.current) {
        // tap → pick a memory (duration-agnostic: stillness means intent)
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = -(e.clientY / window.innerHeight) * 2 + 1;
        const hit = engineRef.current.pick(nx, ny);
        if (hit >= 0) openFocus(hit);
      }
      dragVel = 0;
    };

    if (canvas) {
      canvas.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    }

    /* ----- hover raycast (fine pointers) ----- */
    const onHoverMove = (e: MouseEvent) => {
      if (focusRef.current !== null || !engineRef.current) return;
      const now = performance.now();
      if (now - lastPickAt < 70) return;
      lastPickAt = now;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      const hit = engineRef.current.pick(nx, ny);
      engineRef.current.setHover(hit);
      if (canvas) canvas.style.cursor = hit >= 0 ? "pointer" : "grab";
    };
    if (canParallax) window.addEventListener("mousemove", onHoverMove, { passive: true });

    /* ----- the loop ----- */
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;

      const s = timeRef.current;
      const focused = focusRef.current !== null;

      // momentum + the idle current (the ocean never stops — but holds
      // perfectly still while your finger/mouse is down on a memory)
      if (!focused && !dragging) {
        s.target += s.fling * dt;
        s.fling *= Math.exp(-dt * 2.6);
        if (Math.abs(s.fling) < 0.004) s.fling = 0;
        if (!reduced) s.target += IDLE_DRIFT * dt;
      }

      // cinematic glide toward the target
      const k = reduced ? 1 : 1 - Math.exp(-dt * 4.6);
      s.t += (s.target - s.t) * k;
      if (Math.abs(s.target - s.t) < 0.0004) s.t = s.target;

      const gap = Math.abs(s.target - s.t);
      const speedN = Math.min(1, gap / 1.4);

      // smoothed parallax
      if (canParallax) {
        const pk = Math.min(1, dt * 3.2);
        smx += (smxT - smx) * pk;
        smy += (smyT - smy) * pk;
      }

      engineRef.current?.update(
        { time: s.t, speed: speedN, pointerX: smx, pointerY: smy, reduced },
        now
      );

      // ---- odometer ----
      const f = formatYears(epochYearsAgo(s.t));
      setText(yearValueRef.current, f.value, "yv");
      setText(yearUnitRef.current, f.unit, "yu");

      // ---- era chip + active memory ----
      const nearest = ((Math.round(epochMod(s.t)) % N) + N) % N;
      const dist = Math.abs(epochDelta(nearest, s.t));
      const holding = dist < 0.42;
      if (eraRef.current) {
        setText(eraRef.current, holding ? EPOCHS[nearest].era : "DRIFTING · THE STREAM", "era");
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

      // ---- flow meter ----
      const cFrac = Math.min(0.999, speedN);
      setText(warpRef.current, cFrac > 0.008 ? `${cFrac.toFixed(2)} c` : "ORBIT HOLD", "warp");
      if (warpBarRef.current) {
        setStyle(warpBarRef.current, "transform", `scaleX(${cFrac.toFixed(3)})`, "warpBar");
      }

      // ---- react state on change only ----
      if (nearest !== lastActive) {
        lastActive = nearest;
        setActiveIndex(nearest);
      }
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      if (canvas) {
        canvas.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      }
      if (canParallax) window.removeEventListener("mousemove", onHoverMove);
    };
  }, [openFocus, closeFocus]);

  const focusEpoch = focusIdx !== null ? EPOCHS[focusIdx] : null;

  return (
    <main className="bg-[#020107] text-foreground">
      {/* THE TIME-OCEAN — one fixed WebGL canvas */}
      <canvas
        ref={canvasRef}
        aria-label="An infinite 3D ocean of floating epoch photographs — drag to travel through time, click one to open its story"
        role="img"
        className="fixed inset-0 z-10 h-full w-full cursor-grab touch-none"
      />

      {/* film grain + vignette */}
      <div aria-hidden="true" className="chronos-grain pointer-events-none fixed inset-0 z-[14]" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[14]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.42) 100%)",
        }}
      />

      <TimeHUD
        activeIndex={activeIndex}
        focusActive={focusIdx !== null}
        yearValueRef={yearValueRef}
        yearUnitRef={yearUnitRef}
        eraRef={eraRef}
        warpRef={warpRef}
        warpBarRef={warpBarRef}
        onJump={jumpTo}
      />

      {/* intro — dissolves on first touch of the current */}
      <div
        aria-hidden={introGone}
        className={`pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center px-6 text-center transition-all duration-1000 ${
          introGone ? "opacity-0 blur-md" : "opacity-100"
        }`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 44% at 50% 50%, rgba(2,1,7,0.78) 0%, rgba(2,1,7,0.35) 55%, transparent 100%)",
          }}
        />
        <p className="relative font-mono text-[10px] uppercase tracking-[0.5em] text-white/45 md:text-xs">
          You are suspended in the stream of time
        </p>
        <h1 className="chronos-title-glow relative mt-4 text-5xl font-bold tracking-tight text-white md:text-7xl">
          CHRONOS&nbsp;∞
        </h1>
        <p className="relative mt-4 max-w-md font-mono text-[10px] uppercase leading-5 tracking-[0.3em] text-white/40 md:text-[11px]">
          13.8 billion years orbit you as floating memories
          <br />
          Scroll to drift · Click a memory to open its window
        </p>
      </div>

      {/* the glasswork window */}
      {showPanel && focusEpoch && (
        <GlassPanel
          epoch={focusEpoch}
          index={focusIdx ?? 0}
          total={N}
          onClose={closeFocus}
        />
      )}
    </main>
  );
}
