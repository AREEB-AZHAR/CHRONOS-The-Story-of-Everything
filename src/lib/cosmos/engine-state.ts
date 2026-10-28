/** Shared mutable state read by render layers (canvas, HUD) each frame. */
export type EngineState = {
  progress: number; // 0..1 through the whole journey
  velocity: number; // smoothed px per 60fps-frame (signed)
  speed: number; // |velocity|
  accent: [number, number, number]; // current era accent (rgb)
  accentCss: string;
  reducedMotion: boolean;
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
