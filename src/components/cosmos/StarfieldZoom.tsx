"use client";

import { useEffect, useRef } from "react";
import type { EngineState } from "@/lib/cosmos/engine-state";
import { rgba } from "@/lib/cosmos/engine-state";

type Star = {
  x: number; // world-space offset from screen center at z=1
  y: number;
  z: number; // depth units (camera at 0, far = ~8)
  tw: number; // twinkle phase
};

/**
 * The warp engine v2 — a TRUE 3D starfield. Stars live in depth space and
 * rush TOWARD the camera, projected radially: idle = slow drift through the
 * void, scroll velocity = hyperspace. Streaks radiate outward from the
 * vanishing point, so the viewer feels they are ZOOMING into spacetime.
 * Era-tinted nebulae + a warp tunnel-glow sell the speed of light.
 */
export default function StarfieldZoom({ stateRef }: { stateRef: React.MutableRefObject<EngineState> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let focal = 800;
    let dpr = 1;
    let stars: Star[] = [];
    let raf = 0;
    let last = performance.now();
    let t = 0;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const spawn = (far?: number): Star => {
      const z = far ?? 6.2 + Math.random() * 1.8;
      // sample a screen position (with margin), back-project to world coords at depth z
      const sx = Math.random() * width * 1.3 - width * 0.15;
      const sy = Math.random() * height * 1.3 - height * 0.15;
      const k = z / focal;
      return {
        x: (sx - width / 2) * k,
        y: (sy - height / 2) * k,
        z,
        tw: Math.random() * Math.PI * 2,
      };
    };

    const seed = () => {
      const count = Math.min(640, Math.floor((width * height) / 3300));
      stars = Array.from({ length: count }, () => spawn(0.15 + Math.random() * 7.5));
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      focal = height * 0.85;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    resize();
    window.addEventListener("resize", resize);

    const blob = (cx: number, cy: number, rad: number, color: string) => {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      const s = stateRef.current;
      const [r, g, b] = s.accent;
      const speed = reduced ? 0 : s.speed; // px per 60fps frame
      const vNorm = Math.min(1.7, speed / (window.innerHeight * 0.07));

      // ---- background ----
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#020107";
      ctx.fillRect(0, 0, width, height);

      // ---- era nebulae ----
      blob(
        width * (0.24 + 0.05 * Math.sin(t * 0.13)),
        height * (0.32 + 0.06 * Math.cos(t * 0.11)),
        Math.max(width, height) * 0.55,
        rgba([r, g, b], 0.075)
      );
      blob(
        width * (0.78 + 0.04 * Math.cos(t * 0.09)),
        height * (0.7 + 0.05 * Math.sin(t * 0.07)),
        Math.max(width, height) * 0.5,
        rgba([r, g, b], 0.055)
      );
      blob(
        width * 0.5,
        height * (1.06 + 0.04 * Math.sin(t * 0.05)),
        Math.max(width, height) * 0.6,
        "rgba(120, 60, 160, 0.05)"
      );

      // ---- warp tunnel glow ----
      if (vNorm > 0.42) {
        const glow = Math.min(0.2, (vNorm - 0.42) * 0.32);
        blob(width / 2, height / 2, Math.max(width, height) * 0.72, rgba([r, g, b], glow));
      }

      // ---- stars rushing toward the camera ----
      ctx.globalCompositeOperation = "lighter";
      const cx = width / 2;
      const cy = height / 2;
      const v = (0.0024 + vNorm * 0.17) * dt * 60; // z-units per frame
      const streaking = vNorm > 0.13;
      // streak tint: white core warmed by the era accent
      const sr = Math.round(205 + (r - 205) * 0.4);
      const sg = Math.round(210 + (g - 210) * 0.4);
      const sb = Math.round(235 + (b - 235) * 0.4);

      for (const star of stars) {
        star.tw += dt * 2.2;
        star.z -= v;
        if (star.z <= 0.07) {
          Object.assign(star, spawn());
          continue;
        }
        const k = focal / star.z;
        const sx = cx + star.x * k;
        const sy = cy + star.y * k;
        if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) {
          Object.assign(star, spawn());
          continue;
        }

        const size = Math.max(0.35, Math.min(3.4, 3.4 / star.z));
        const twinkle = 0.72 + 0.28 * Math.sin(star.tw);
        const alpha = Math.max(0, Math.min(1, 1.32 - star.z / 6.5)) * 0.9 * twinkle;

        if (streaking) {
          // radial streak: from where the star was a few frames ago
          const zPrev = star.z + v * (6 + vNorm * 30);
          const k2 = focal / zPrev;
          ctx.strokeStyle = `rgba(${sr},${sg},${sb},${Math.min(0.85, alpha * (0.45 + vNorm * 0.5)).toFixed(3)})`;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(cx + star.x * k2, cy + star.y * k2);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${sr},${sg},${sb},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [stateRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full"
    />
  );
}
