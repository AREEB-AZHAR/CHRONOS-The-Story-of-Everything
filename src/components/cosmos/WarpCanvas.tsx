"use client";

import { useEffect, useRef } from "react";
import type { EngineState } from "@/lib/cosmos/engine-state";
import { rgba } from "@/lib/cosmos/engine-state";

type Star = {
  x: number; // 0..1
  y: number; // 0..1
  z: number; // 0..1 depth (1 = near)
  tw: number; // twinkle phase
};

/**
 * The warp engine: a canvas starfield whose stars streak vertically in
 * response to scroll velocity — the sensation of falling through time at
 * the speed of light. Nebulae are tinted by the current era accent.
 */
export default function WarpCanvas({ stateRef }: { stateRef: React.MutableRefObject<EngineState> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let raf = 0;
    let last = performance.now();

    const seed = () => {
      const count = Math.min(720, Math.floor((width * height) / 3200));
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let t = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      const s = stateRef.current;
      const [r, g, b] = s.accent;
      const speed = reduced ? 0 : s.speed; // px/frame

      // ---- background ----
      ctx.fillStyle = "#020107";
      ctx.fillRect(0, 0, width, height);

      // ---- era nebulae ----
      const blob = (
        cx: number,
        cy: number,
        rad: number,
        color: string
      ) => {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      };
      const wob = speed / 60;
      blob(
        width * (0.22 + 0.05 * Math.sin(t * 0.13)),
        height * (0.3 + 0.06 * Math.cos(t * 0.11)) + wob * 8,
        Math.max(width, height) * 0.55,
        rgba([r, g, b], 0.07)
      );
      blob(
        width * (0.78 + 0.04 * Math.cos(t * 0.09)),
        height * (0.72 + 0.05 * Math.sin(t * 0.07)) - wob * 6,
        Math.max(width, height) * 0.5,
        rgba([r, g, b], 0.05)
      );
      blob(
        width * 0.5,
        height * (1.05 + 0.04 * Math.sin(t * 0.05)),
        Math.max(width, height) * 0.6,
        "rgba(120, 60, 160, 0.05)"
      );

      // ---- stars ----
      const baseDrift = 0.02; // gentle idle drift (px/frame)
      for (const star of stars) {
        star.tw += dt * (0.5 + star.z);
        const v = baseDrift + speed * (0.15 + star.z * star.z * 1.6);
        star.y += (v * dt * 60) / height;
        if (star.y > 1.02) {
          star.y = -0.02;
          star.x = Math.random();
        }
        if (star.y < -0.05) star.y = 1.02;

        const px = star.x * width;
        const py = star.y * height;
        const twinkle = 0.55 + 0.45 * Math.sin(star.tw);
        const alpha = (0.18 + star.z * 0.65) * twinkle;
        const size = 0.4 + star.z * 1.5;

        // streak length grows with speed — the warp effect
        const streak = Math.min(height * 0.35, v * (2 + star.z * 5));

        if (streak > size * 2) {
          const grad = ctx.createLinearGradient(px, py, px, py - streak);
          const cr = Math.round(180 + star.z * 75);
          const cg = Math.round(180 + star.z * 70);
          const cb = 255;
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
          grad.addColorStop(1, rgba([r, g, b], 0));
          ctx.strokeStyle = grad;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - streak);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${Math.round(200 + star.z * 55)},${Math.round(
            200 + star.z * 50
          )},255,${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- warp glow when at speed ----
      if (speed > 18) {
        const glow = Math.min(0.16, (speed - 18) / 400);
        blob(width / 2, height * 0.5, Math.max(width, height) * 0.7, rgba([r, g, b], glow));
      }
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
