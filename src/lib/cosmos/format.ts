/**
 * Time utilities: logarithmic interpolation of "years ago" between epoch anchors,
 * and cinematic formatting of the year readout.
 */
import { ANCHORS, EPOCHS } from "./timeline";

/** Linear interpolation */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Clamp helper */
export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Smoothstep easing */
export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/**
 * Interpolate years-ago at a given progress (0..1).
 * Between epochs we travel in log10-space so eons whip past at light speed
 * while recent history slows down — the odometer effect.
 */
export function yearsAgoAt(progress: number): number {
  const p = clamp(progress);
  const last = ANCHORS.length - 1;

  if (p <= 0) return EPOCHS[0].yearsAgo;
  if (p >= 1) return 0;

  // find surrounding anchors
  let i = 0;
  while (i < last && ANCHORS[i + 1] < p) i++;
  const a0 = ANCHORS[i];
  const a1 = ANCHORS[Math.min(i + 1, last)];
  const span = Math.max(a1 - a0, 1e-6);
  const u = clamp((p - a0) / span);

  const y0 = EPOCHS[i].yearsAgo;
  const y1 = EPOCHS[Math.min(i + 1, last)].yearsAgo;

  if (y1 >= y0) return y0; // should never happen (yearsAgo decreases)

  // Logarithmic travel when the gap is cosmic; linear when it's human-scale
  const LOG_THRESHOLD = 20_000;
  if (y0 > LOG_THRESHOLD && y1 > LOG_THRESHOLD) {
    const logY = lerp(Math.log10(y0), Math.log10(y1), u);
    return Math.pow(10, logY);
  }
  return Math.round(lerp(y0, y1, u));
}

/** Format the giant odometer readout */
export function formatYears(yearsAgo: number): { value: string; unit: string } {
  if (yearsAgo >= 1_000_000_000) {
    const b = yearsAgo / 1_000_000_000;
    return { value: b >= 10 ? b.toFixed(2) : b.toFixed(3), unit: "BILLION YEARS AGO" };
  }
  if (yearsAgo >= 1_000_000) {
    const m = yearsAgo / 1_000_000;
    return { value: m >= 100 ? m.toFixed(0) : m.toFixed(1), unit: "MILLION YEARS AGO" };
  }
  if (yearsAgo >= 10_000) {
    return { value: Math.round(yearsAgo).toLocaleString("en-US"), unit: "YEARS AGO" };
  }
  // Calendar era
  const now = 2025;
  const year = now - Math.round(yearsAgo);
  if (year > 0) {
    return { value: year.toLocaleString("en-US"), unit: "CE" };
  }
  const bce = 1 - year; // no year zero
  return { value: bce.toLocaleString("en-US"), unit: "BCE" };
}

export const TODAY_YEAR = 2025;
