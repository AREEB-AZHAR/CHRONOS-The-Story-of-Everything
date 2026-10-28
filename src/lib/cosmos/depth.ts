/**
 * CHRONOS 3D — depth-stage configuration.
 *
 * Each era is a 3D environment built from stacked image planes at different
 * Z depths inside a perspective world. The camera (scroll) dollies INTO the
 * current era, then accelerates THROUGH it at light speed; the next era is
 * already waiting far in the distance and rushes toward the viewer.
 *
 * Because CSS `opacity` / `filter` on a preserve-3d element force it to
 * flatten, the engine animates opacity + blur on every LAYER individually
 * (leaves), never on the scene root.
 */

export const PERSPECTIVE = 1200;

/** Layer slot indices used by DepthStage + engine. */
export const SLOT = {
  GHOST: 0, // the NEXT era, looming far behind (mix of eras → one universe)
  MAIN: 1, // the era's hero image
  TEX_A: 2, // atmosphere texture (mid depth, blended)
  TEX_B: 3, // near texture (closest plane)
  DUST: 4, // floating accent particles
} as const;

export const LAYER_Z: Record<number, number> = {
  [SLOT.GHOST]: -780,
  [SLOT.MAIN]: -520,
  [SLOT.TEX_A]: -300,
  [SLOT.TEX_B]: -140,
  [SLOT.DUST]: 0, // individual particles carry their own z
};

export const PANEL_Z = 150;

/** Pre-compensated scale so a layer appears ~`extra`x viewport at its z. */
export const comp = (z: number, extra: number) =>
  (extra * (PERSPECTIVE - z)) / PERSPECTIVE;

export type EraTexture = {
  mid: string;
  near: string;
  midBlend: string;
  nearBlend: string;
  midOpacity: number;
  nearOpacity: number;
};

const T = "/cosmos";

/** Per-era composite: two extra textures blended over the hero image. */
export const TEXTURES: Record<string, EraTexture> = {
  bigbang: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-embers.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.5, nearOpacity: 0.42 },
  firstlight: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-embers.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.45, nearOpacity: 0.35 },
  firststars: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-lightglow.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.5, nearOpacity: 0.3 },
  galaxies: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-lightglow.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.55, nearOpacity: 0.28 },
  milkyway: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-lightglow.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.5, nearOpacity: 0.25 },
  sunborn: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-embers.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.45, nearOpacity: 0.35 },
  earthmoon: { mid: `${T}/tex-embers.webp`, near: `${T}/tex-nebula.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.5, nearOpacity: 0.3 },
  firstocean: { mid: `${T}/tex-clouds.webp`, near: `${T}/tex-mist.webp`, midBlend: "soft-light", nearBlend: "screen", midOpacity: 0.55, nearOpacity: 0.35 },
  firstlife: { mid: `${T}/tex-caustics.webp`, near: `${T}/tex-mist.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.5, nearOpacity: 0.3 },
  oxygen: { mid: `${T}/tex-clouds.webp`, near: `${T}/tex-mist.webp`, midBlend: "soft-light", nearBlend: "screen", midOpacity: 0.55, nearOpacity: 0.3 },
  cambrian: { mid: `${T}/tex-caustics.webp`, near: `${T}/tex-mist.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.55, nearOpacity: 0.3 },
  landfall: { mid: `${T}/tex-mist.webp`, near: `${T}/tex-caustics.webp`, midBlend: "screen", nearBlend: "soft-light", midOpacity: 0.5, nearOpacity: 0.28 },
  greatdying: { mid: `${T}/tex-embers.webp`, near: `${T}/tex-clouds.webp`, midBlend: "screen", nearBlend: "soft-light", midOpacity: 0.55, nearOpacity: 0.35 },
  dinosaurs: { mid: `${T}/tex-mist.webp`, near: `${T}/tex-clouds.webp`, midBlend: "screen", nearBlend: "soft-light", midOpacity: 0.5, nearOpacity: 0.32 },
  asteroid: { mid: `${T}/tex-embers.webp`, near: `${T}/tex-clouds.webp`, midBlend: "screen", nearBlend: "soft-light", midOpacity: 0.55, nearOpacity: 0.38 },
  mammals: { mid: `${T}/tex-mist.webp`, near: `${T}/tex-clouds.webp`, midBlend: "screen", nearBlend: "soft-light", midOpacity: 0.45, nearOpacity: 0.3 },
  humans: { mid: `${T}/tex-lightglow.webp`, near: `${T}/tex-mist.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.45, nearOpacity: 0.3 },
  journeys: { mid: `${T}/tex-mist.webp`, near: `${T}/tex-lightglow.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.4, nearOpacity: 0.32 },
  civilization: { mid: `${T}/tex-lightglow.webp`, near: `${T}/tex-clouds.webp`, midBlend: "screen", nearBlend: "soft-light", midOpacity: 0.5, nearOpacity: 0.3 },
  paleblue: { mid: `${T}/tex-nebula.webp`, near: `${T}/tex-lightglow.webp`, midBlend: "screen", nearBlend: "screen", midOpacity: 0.4, nearOpacity: 0.22 },
};

/** Static per-slot blur (px) added to any dynamic motion blur. */
export const LAYER_STATIC_BLUR: Record<number, number> = {
  [SLOT.GHOST]: 6,
  [SLOT.MAIN]: 0,
  [SLOT.TEX_A]: 0,
  [SLOT.TEX_B]: 0,
  [SLOT.DUST]: 0,
};

/** How much of the scene's motion blur hits each layer (near layers blur less). */
export const LAYER_BLUR_WEIGHT: Record<number, number> = {
  [SLOT.GHOST]: 0.4,
  [SLOT.MAIN]: 1,
  [SLOT.TEX_A]: 0.7,
  [SLOT.TEX_B]: 0.5,
  [SLOT.DUST]: 0,
};

/* ---------- easing ---------- */

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

const ss = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/* ---------- motion ---------- */

const Z_DEEP = -2100; // where the next era waits in the void
const Z_PUSH = 200; // slow dolly-in while holding at an era
const Z_OUT = 1350; // fly-through endpoint (fades out long before)

export type SceneMotion = {
  z: number; // camera-relative translateZ for the scene root
  opacity: number; // 0..1 (applied to every layer)
  blur: number; // px motion blur (applied per-layer with weights)
  rotX: number; // slight plane tilt during transit (3D drama)
  panel: number; // floating text panel opacity
  active: boolean;
};

/**
 * Map a scene's phase (progress - anchor, in SPACING units) to its 3D state.
 *  phase [-1..0)  → ARRIVE: rush from deep space toward the camera
 *  phase [0..0.3) → HOLD:   slow cinematic dolly INTO the world
 *  phase [0.3..0.74) → DEPART: accelerate THROUGH the world at light speed
 */
export function sceneMotion(phase: number): SceneMotion {
  if (phase < -1 || phase > 0.74) {
    return { z: 0, opacity: 0, blur: 0, rotX: 0, panel: 0, active: false };
  }

  if (phase <= 0) {
    const u = 1 + phase; // 0..1
    const e = easeOutCubic(u);
    return {
      z: Z_DEEP * (1 - e),
      opacity: ss(u / 0.5),
      blur: 15 * (1 - e),
      rotX: 4 * (1 - e),
      panel: ss((u - 0.72) / 0.28),
      active: true,
    };
  }

  let z: number;
  if (phase < 0.3) {
    z = Z_PUSH * easeInOutSine(phase / 0.3);
  } else {
    const v = (phase - 0.3) / 0.42;
    z = Z_PUSH + (Z_OUT - Z_PUSH) * easeInCubic(v);
  }

  return {
    z,
    opacity: 1 - ss((phase - 0.46) / 0.18),
    blur: phase < 0.3 ? 0 : 11 * ss((phase - 0.3) / 0.25),
    rotX: phase < 0.3 ? 0 : -5 * ss((phase - 0.3) / 0.3),
    panel: 1 - ss((phase - 0.26) / 0.1),
    active: true,
  };
}

/* ---------- deterministic particles ---------- */

/** Seeded PRNG so SSR and client render identical particle fields. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DustSpec = {
  left: number; // %
  top: number; // %
  size: number; // px
  z: number; // translateZ px (40..190)
  dx: number; // drift span px
  duration: number; // s
  delay: number; // s (negative to desync)
  opacity: number;
  blur: number;
};

export function makeDust(index: number, count = 11): DustSpec[] {
  const rnd = mulberry32(index * 99991 + 7);
  return Array.from({ length: count }, () => {
    return {
      left: 4 + rnd() * 92,
      top: 8 + rnd() * 84,
      z: 40 + rnd() * 150,
      dx: (rnd() * 2 - 1) * 26,
      duration: 7 + rnd() * 9,
      delay: -rnd() * 16,
      opacity: 0.35 + rnd() * 0.5,
      blur: rnd() < 0.4 ? 1.5 : 0,
      size: 1.5 + rnd() * 3.5,
    };
  });
}
