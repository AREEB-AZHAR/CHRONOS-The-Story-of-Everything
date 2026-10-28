/**
 * CHRONOS v3 — WebGL time-dive engine (three.js)
 * ------------------------------------------------
 * One full-screen canvas renders the entire journey (reliwebgl-style):
 *  - 19 era "slabs" (textured planes) spaced along a -Z corridor
 *  - the camera flies down the corridor: holds at each slab (it fills the
 *    screen), then accelerates THROUGH it toward the next era, which waits
 *    ahead as a small glowing window in spacetime
 *  - a recycled starfield rushes past the camera (radial streaks at warp)
 *  - near-field dust motes + procedural nebulae tinted per era
 *  - per-slab shader: cover-crop, Ken-Burns breathing, radial warp smear,
 *    filmic grade, extinction tint, window mask + rim glow when distant
 *
 * The DOM is used ONLY for text panels + HUD — the engine never touches
 * CSS filters or blend modes, so the whole frame costs a handful of quads.
 */
import * as THREE from "three";
import { EPOCHS, INTRO_END, OUTRO_START } from "./timeline";

/* ---------------- corridor geometry ---------------- */

const N = EPOCHS.length;
const SPACING = 60; // world units between era slabs
const HOLD_D = 26; // camera-to-slab distance while holding
const DOLLY_IN = 9; // slow push-in while holding
const PLANE_H = 35.2; // slab world height (~1.30x screen at hold)
const PLANE_ASPECT = 2.4; // wide enough for 21:9 screens
const PLANE_W = PLANE_H * PLANE_ASPECT;
const FOV_BASE = 55;
const FOV_WARP = 9;
const STAR_WRAP = 1700;
const FAR_FADE0 = 180; // slabs beyond this distance start fading (glow gates)
const FAR_FADE1 = 260;
const NEAR_FADE0 = 1.5; // slabs fade out as the camera crosses them
const NEAR_FADE1 = 10;
const WIN_NEAR = 34; // window-mask blend: fullscreen plate -> glowing gate
const WIN_FAR = 78;

export type EngineFrame = {
  progress: number; // 0..1 through the whole journey
  warp: number; // 0..1 normalized scroll velocity
  pointerX: number; // -1..1 smoothed target (0 on touch)
  pointerY: number;
  reduced: boolean; // prefers-reduced-motion
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Era-space float position (0..N-1) for a journey progress value. */
function eraFloat(progress: number): number {
  const t = clamp01((progress - INTRO_END) / (OUTRO_START - INTRO_END));
  return t * (N - 1);
}

/* ---------------- shaders ---------------- */

const SLAB_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SLAB_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uHasMap;   // 1 once a texture is assigned
uniform float uMapFade;  // 0..1 texture fade-in
uniform float uAlpha;    // overall slab alpha (arrival / departure)
uniform float uWin;      // 0..1 distant-window mask ("gate in spacetime")
uniform float uWarp;     // 0..1 scroll velocity
uniform float uTime;     // seconds
uniform float uExtinct;  // extinction-era red grade
uniform float uHold;     // 0..1 Ken-Burns breathing amplitude
uniform float uSeed;
uniform vec3  uTint;
varying vec2 vUv;

const float TEX_A = 1.7777778;  // all era plates are exact 16:9
const float PLANE_A = ${PLANE_ASPECT.toFixed(4)};

void main() {
  // cover-crop the 16:9 plate onto the wider plane (center band)
  vec2 suv = vec2(vUv.x, 0.5 + (vUv.y - 0.5) * (TEX_A / PLANE_A));

  // Ken Burns breathing while holding at the era
  if (uHold > 0.001) {
    float t = uTime * 0.045 + uSeed * 12.0;
    vec2 drift = vec2(sin(t), cos(t * 0.8 + 1.7)) * 0.015 * uHold;
    float zoom = 1.0 + 0.03 * uHold * (0.5 + 0.5 * sin(t * 0.55));
    suv = (suv - 0.5) / zoom + 0.5 + drift;
  }
  suv = clamp(suv, vec2(0.0015), vec2(0.9985));

  vec3 col;
  if (uHasMap > 0.5) {
    vec2 c = suv - 0.5;
    float rad = length(c);
    float smear = uWarp * uWarp * 0.05 * rad;
    if (smear > 0.0006) {
      // radial warp smear (cheap 3-tap motion blur, only while moving fast)
      vec2 dir = c / max(rad, 1e-4);
      vec3 s0 = texture2D(uMap, suv - dir * smear).rgb;
      vec3 s1 = texture2D(uMap, suv).rgb;
      vec3 s2 = texture2D(uMap, suv + dir * smear).rgb;
      col = (s0 + s1 * 1.6 + s2) / 3.6;
    } else {
      col = texture2D(uMap, suv).rgb;
    }
  } else {
    // placeholder while the plate streams in: tinted deep-space gradient
    float g = length(vUv - vec2(0.5, 0.44));
    col = mix(uTint * 0.20 + vec3(0.02, 0.022, 0.038), vec3(0.006, 0.007, 0.014), smoothstep(0.0, 0.95, g));
  }

  // filmic grade: cheap polynomial S-curve (no pow), cool lift, era-tinted mids
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.55);
  col = col * 0.92 + vec3(0.012, 0.014, 0.024);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += uTint * (0.045 * lum + 0.012);

  // extinction eras bleed red
  col = mix(col, col * vec3(1.22, 0.60, 0.48) + vec3(0.055, 0.004, 0.0), uExtinct * 0.72);

  // in-slab vignette
  float vig = 1.0 - smoothstep(0.62, 1.34, length(vUv - 0.5) * 1.55);
  col *= mix(0.62, 1.0, vig);

  float alpha = uAlpha * mix(1.0, uMapFade, uHasMap);

  // distant slabs become soft glowing windows ("gates") floating in the void
  if (uWin > 0.001) {
    vec2 q = abs(vUv - 0.5) * 2.0;
    vec2 q2 = q * q;
    float sd = q2.x * q2.x * q.x + q2.y * q2.y * q.y; // |x|^5 + |y|^5 (no pow)
    float mask = 1.0 - smoothstep(0.55, 1.05, sd);
    alpha *= mix(1.0, mask, uWin);
    float rim = smoothstep(0.40, 1.02, sd) * (1.0 - smoothstep(1.05, 2.1, sd));
    col += uTint * rim * uWin * 1.5;
    col *= mix(1.0, 0.82 + 0.18 * mask, uWin);
  }

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aWarm;
attribute float aTw;
uniform float uTime;
uniform float uPR;    // device pixel ratio
uniform float uWarp;
uniform float uMaxPt;  // max point size px
varying float vA;
varying float vAng;
varying float vWarm;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / max(clip.w, 1e-4);
  vAng = atan(ndc.y, ndc.x);
  float tw = 0.72 + 0.28 * sin(uTime * (0.7 + aTw * 2.4) + aTw * 39.0);
  float dist = max(1.0, -mv.z);
  float ps = aSize * uPR * (240.0 / dist);
  gl_PointSize = clamp(ps * (1.0 + uWarp * 1.7), 0.0, uMaxPt);
  vA = tw * clamp(300.0 / dist, 0.04, 1.0);
  vWarm = aWarm;
  gl_Position = clip;
}
`;

const STAR_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uTint;
uniform float uWarp;
uniform float uAlphaMul;
uniform float uStreak;   // 0 = round dot (dust), 1 = radial streaks (stars)
varying float vA;
varying float vAng;
varying float vWarm;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float ca = cos(vAng), sa = sin(vAng);
  vec2 r = vec2(q.x * ca + q.y * sa, -q.x * sa + q.y * ca);
  float stretch = 1.0 + uWarp * 5.0 * uStreak;
  float d = (r.x * r.x) / stretch + (r.y * r.y) * (3.1 - 1.2 * uStreak * uWarp);
  float alpha = exp(-d * 3.3) * vA * uAlphaMul;
  vec3 col = mix(vec3(0.80, 0.87, 1.0), vec3(1.0, 0.84, 0.58), vWarm);
  col = mix(col, uTint, 0.32);
  gl_FragColor = vec4(col * (0.7 + uWarp * 0.7) * step(0.004, alpha), alpha);
}
`;

const NEBULA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const NEBULA_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uFade;
uniform float uSeed;
uniform vec3 uColA;
uniform vec3 uColB;
varying vec2 vUv;
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vUv * 2.8 + vec2(uSeed * 13.1, uSeed * 7.7);
  float t = uTime * 0.018 * (0.6 + uSeed);
  float n = fbm(p + vec2(t, -t * 0.7));
  float mask = smoothstep(0.3, 0.72, 1.0 - length(vUv - 0.5) * 1.7);
  vec3 col = mix(uColA, uColB, 0.5 + 0.5 * n);
  float a = pow(max(n - 0.30, 0.0), 1.55) * 1.7 * mask * uFade;
  gl_FragColor = vec4(col * a, a);
}
`;

/* ---------------- engine ---------------- */

type TexState = {
  status: 0 | 1 | 2; // 0 idle, 1 loading, 2 ready
  tex: THREE.Texture | null;
};

export class ChronosEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private slabs: THREE.Mesh[] = [];
  private slabU: Record<string, THREE.IUniform>[] = [];
  private texStates: TexState[] = EPOCHS.map(() => ({ status: 0, tex: null }));
  private loader = new THREE.TextureLoader();
  private isMobile: boolean;
  private clock0 = 0;
  private lastT = 0;
  private px = 0;
  private py = 0;
  private roll = 0;
  private fov = FOV_BASE;
  private lost = false;

  private stars!: THREE.Points;
  private starPos!: Float32Array;
  private motes!: THREE.Points;
  private motePos!: Float32Array;
  private nebulae: { mesh: THREE.Mesh; u: Record<string, THREE.IUniform>; gap: number }[] = [];
  private accent = new THREE.Color(EPOCHS[0].accent);
  private softGPU = false;
  private skipRender = false;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
    this.isMobile = isMobile;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x020107, 1);
    this.camera = new THREE.PerspectiveCamera(FOV_BASE, 1, 0.1, 700);

    // Detect software GL (SwiftShader / lavapipe / basic renderers): gracefully
    // reduce particle counts + DPR so even GPU-less machines stay smooth.
    try {
      const gl = this.renderer.getContext();
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const r = dbg
        ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      this.softGPU = /swiftshader|software|llvmpipe|lavapipe|basic render/i.test(r);
    } catch {
      this.softGPU = false;
    }

    this.buildSlabs();
    this.buildStars();
    this.buildMotes();
    this.buildNebulae();

    canvas.addEventListener("webglcontextlost", this.onLost, false);
    canvas.addEventListener("webglcontextrestored", this.onRestored, false);
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };
  private onRestored = () => {
    this.lost = false;
  };

  private texPath(i: number) {
    const p = EPOCHS[i].image;
    // software GL machines use the light mobile plates (4x smaller uploads)
    return this.isMobile || this.softGPU
      ? p.replace(".webp", "-m.webp")
      : p;
  }

  /* ---------- scene construction ---------- */

  private buildSlabs() {
    const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
    for (let i = 0; i < N; i++) {
      const e = EPOCHS[i];
      const u: Record<string, THREE.IUniform> = {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uMapFade: { value: 0 },
        uAlpha: { value: 0 },
        uWin: { value: 0 },
        uWarp: { value: 0 },
        uTime: { value: 0 },
        uExtinct: { value: e.kind === "extinction" ? 1 : 0 },
        uHold: { value: 0 },
        uSeed: { value: ((i * 137) % 97) / 97 },
        uTint: { value: new THREE.Color(e.accent) },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: SLAB_VERT,
        fragmentShader: SLAB_FRAG,
        uniforms: u,
        transparent: true,
        depthWrite: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -i * SPACING;
      mesh.frustumCulled = true;
      mesh.renderOrder = 0;
      this.scene.add(mesh);
      this.slabs.push(mesh);
      this.slabU.push(u);
    }
  }

  private pointField(
    count: number,
    rMin: number,
    rMax: number,
    zFrom: number,
    zTo: number,
    sizeMin: number,
    sizeMax: number
  ) {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const warm = new Float32Array(count);
    const tw = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      // bias density toward the corridor axis (sqrt for area-uniform annulus)
      const r = Math.sqrt(rMin * rMin + Math.random() * (rMax * rMax - rMin * rMin));
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = zFrom + Math.random() * (zTo - zFrom);
      size[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
      warm[i] = Math.random() < 0.28 ? 0.6 + Math.random() * 0.4 : Math.random() * 0.2;
      tw[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    const pa = new THREE.BufferAttribute(pos, 3);
    pa.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", pa);
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aWarm", new THREE.BufferAttribute(warm, 1));
    g.setAttribute("aTw", new THREE.BufferAttribute(tw, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -500), 3000);
    return { g, pos };
  }

  private makePoints(
    g: THREE.BufferGeometry,
    tint: THREE.Color,
    alphaMul: number,
    streak: number
  ) {
    const u: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uPR: { value: 1 },
      uWarp: { value: 0 },
      uTint: { value: tint },
      uAlphaMul: { value: alphaMul },
      uStreak: { value: streak },
      uMaxPt: { value: this.softGPU ? 26 : 96 },
    };
    const m = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    pts.renderOrder = 2;
    this.scene.add(pts);
    return { pts, u };
  }

  private buildStars() {
    const count = this.softGPU ? 620 : 1400;
    const { g, pos } = this.pointField(count, 12, 115, -1500, 180, 0.9, 2.6);
    this.starPos = pos;
    const tint = new THREE.Color(EPOCHS[0].accent);
    this.stars = this.makePoints(g, tint, 1, 1).pts;
    (this.stars.material as THREE.ShaderMaterial).uniforms.uTint.value = tint;
  }

  private buildMotes() {
    const count = this.softGPU ? 40 : 90;
    const { g, pos } = this.pointField(count, 1.2, 13, -30, 4, 0.6, 1.6);
    this.motePos = pos;
    const tint = new THREE.Color(EPOCHS[0].accent);
    const { pts, u } = this.makePoints(g, tint, 0.5, 0);
    this.motes = pts;
    (this.motes.material as THREE.ShaderMaterial).uniforms.uTint.value = tint;
    void u;
  }

  private buildNebulae() {
    const geo = new THREE.PlaneGeometry(46, 24);
    for (let gap = 0; gap < N - 1; gap++) {
      const u: Record<string, THREE.IUniform> = {
        uTime: { value: 0 },
        uFade: { value: 0 },
        uSeed: { value: (gap * 61) % 31 / 31 },
        uColA: { value: new THREE.Color(EPOCHS[gap].accent) },
        uColB: { value: new THREE.Color(EPOCHS[gap + 1].accent) },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERT,
        fragmentShader: NEBULA_FRAG,
        uniforms: u,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // two drift layers per gap for depth
      mesh.position.set(
        (gap % 2 === 0 ? -1 : 1) * (9 + (gap % 5)),
        (gap % 3 - 1) * 7,
        -gap * SPACING - SPACING * 0.5 - (gap % 2) * 12
      );
      mesh.renderOrder = 1;
      mesh.frustumCulled = true;
      this.scene.add(mesh);
      this.nebulae.push({ mesh, u, gap });
    }
  }

  /* ---------- texture window (progressive load ±3, dispose ±5) ---------- */

  private requestTex(i: number) {
    const st = this.texStates[i];
    if (st.status !== 0) return;
    st.status = 1;
    this.loader.load(
      this.texPath(i),
      (tex) => {
        // ignore if we moved on / got disposed meanwhile
        if (this.texStates[i].status === 0) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 1;
        this.texStates[i].tex = tex;
        this.texStates[i].status = 2;
        this.slabU[i].uMap.value = tex;
        this.slabU[i].uHasMap.value = 1;
        // uMapFade animates toward 1 in update()
      },
      undefined,
      () => {
        this.texStates[i].status = 0; // allow retry later
      }
    );
  }

  private disposeTex(i: number) {
    const st = this.texStates[i];
    if (st.status === 0) return;
    st.tex?.dispose();
    st.tex = null;
    st.status = 0;
    this.slabU[i].uHasMap.value = 0;
    this.slabU[i].uMapFade.value = 0;
    this.slabU[i].uMap.value = null;
  }

  private updateTexWindow(active: number) {
    const lo = Math.max(0, active - 1);
    const hi = Math.min(N - 1, active + 3);
    for (let i = lo; i <= hi; i++) this.requestTex(i);
    for (let i = 0; i < N; i++) {
      if (i < active - 5 || i > active + 5) this.disposeTex(i);
    }
  }

  /* ---------- camera path ---------- */

  /** Camera z at era-space float f (piecewise hold / transit, C1-continuous). */
  private camZAt(f: number, outroT: number): number {
    if (f <= 0) return HOLD_D;
    const i = Math.min(N - 2, Math.floor(f));
    const r = f - i;
    const HOLD = 0.14;
    const holdI = -i * SPACING + HOLD_D;
    const holdNext = -(i + 1) * SPACING + HOLD_D;
    let z: number;
    if (r < HOLD) {
      // slow push-in while holding at era i
      z = holdI - DOLLY_IN * easeInOutSine(r / HOLD);
    } else if (r < 1 - HOLD) {
      // transit: accelerate through the world, decelerate into next era
      const t = smootherstep((r - HOLD) / (1 - 2 * HOLD));
      z = (holdI - DOLLY_IN) * (1 - t) + holdNext * t;
    } else {
      // arrived and resting at era i+1
      z = holdNext;
    }
    if (outroT > 0) {
      // final landing: keep pushing gently into the last plate
      z -= 10 * easeInOutSine(outroT);
    }
    return z;
  }

  /* ---------- per-frame update ---------- */

  update(frame: EngineFrame, nowMs: number) {
    if (this.lost) return;
    const t0 = this.clock0 || (this.clock0 = nowMs);
    const time = (nowMs - t0) / 1000;
    const dt = Math.min(0.05, this.lastT ? (nowMs - this.lastT) / 1000 : 0.016);
    this.lastT = nowMs;

    const f = eraFloat(frame.progress);
    const outroT = smoothstep(0, 1, (frame.progress - OUTRO_START) / (1 - OUTRO_START));
    const camZ = this.camZAt(f, outroT);
    const warp = frame.reduced ? 0 : Math.min(1, frame.warp);

    // software-GL: while resting (no warp), render every other frame — ambient
    // drift is slow enough that this is invisible but halves the CPU load
    if (this.softGPU && warp < 0.015) {
      this.skipRender = !this.skipRender;
      if (this.skipRender) return;
    } else {
      this.skipRender = false;
    }

    // pointer parallax + idle sway + cinematic roll
    const pk = Math.min(1, dt * 2.6);
    this.px += (frame.pointerX - this.px) * pk;
    this.py += (frame.pointerY - this.py) * pk;
    this.roll += ((frame.pointerX * 0.5 - 0.5) * warp * 0.028 - this.roll) * Math.min(1, dt * 2);
    const swayY = frame.reduced ? 0 : Math.sin(time * 0.16) * 0.35;
    const swayX = frame.reduced ? 0 : Math.cos(time * 0.11) * 0.28;
    this.camera.position.set(swayX, swayY, camZ);
    this.camera.rotation.set(this.py * 0.045, -this.px * 0.05, this.roll);

    // FOV widens with velocity (the lens "breathes" at warp)
    const fovT = FOV_BASE + FOV_WARP * warp;
    if (Math.abs(fovT - this.fov) > 0.03) {
      this.fov = fovT;
      this.camera.fov = fovT;
      this.camera.updateProjectionMatrix();
    }

    // accent (era tint) flows to stars / motes / nebulae
    const aiF = Math.min(N - 1, Math.max(0, f));
    const ai = Math.round(aiF);
    const nF = Math.min(N - 1, ai + 1);
    const mixT = smoothstep(0, 1, (aiF - Math.floor(aiF)) / 0.6) * (ai < N - 1 ? 1 : 0);
    this.accent.set(EPOCHS[ai].accent).lerp(new THREE.Color(EPOCHS[nF].accent), mixT);

    // ---- slabs ----
    this.updateTexWindow(ai);
    for (let i = 0; i < N; i++) {
      const slabZ = -i * SPACING;
      const d = camZ - slabZ; // distance AHEAD of the camera (camera looks down -z)
      let alpha = 1 - smoothstep(FAR_FADE0, FAR_FADE1, d);
      alpha *= smoothstep(NEAR_FADE0, NEAR_FADE1, d); // fade as we cross it
      const u = this.slabU[i];
      const vis = alpha > 0.004;
      this.slabs[i].visible = vis;
      if (!vis) continue;
      u.uAlpha.value = alpha;
      u.uWin.value = smoothstep(WIN_NEAR, WIN_FAR, d);
      u.uWarp.value = warp;
      u.uTime.value = time;
      u.uHold.value = 1 - smoothstep(0.10, 0.17, Math.abs(aiF - i));
      // texture fade-in
      const st = this.texStates[i];
      if (st.status === 2 && u.uMapFade.value < 1) {
        u.uMapFade.value = Math.min(1, u.uMapFade.value + dt * 1.4);
      }
    }

    // ---- stars: recycle around the camera ----
    const starU = (this.stars.material as THREE.ShaderMaterial).uniforms;
    starU.uTime.value = time;
    starU.uWarp.value = warp;
    starU.uTint.value = this.accent;
    starU.uPR.value = this.renderer.getPixelRatio();
    const sp = this.starPos;
    for (let i = 0; i < sp.length; i += 3) {
      if (sp[i + 2] > camZ + 70) sp[i + 2] -= STAR_WRAP;
      else if (sp[i + 2] < camZ - STAR_WRAP + 250) sp[i + 2] += STAR_WRAP;
    }
    (this.stars.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

    // ---- dust motes: a shallow band drifting in front of the camera ----
    const moteU = (this.motes.material as THREE.ShaderMaterial).uniforms;
    moteU.uTime.value = time;
    moteU.uWarp.value = 0;
    moteU.uTint.value = this.accent;
    moteU.uPR.value = this.renderer.getPixelRatio();
    const mp = this.motePos;
    for (let i = 0; i < mp.length; i += 3) {
      if (camZ - mp[i + 2] < 0.5) {
        mp[i + 2] = camZ - 2 - Math.random() * 26;
        const a = Math.random() * Math.PI * 2;
        const r = 1.2 + Math.random() * 11;
        mp[i] = Math.cos(a) * r;
        mp[i + 1] = Math.sin(a) * r;
      }
    }
    (this.motes.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

    // ---- nebulae: tinted fbm veils drifting in the transit gaps ----
    for (const nb of this.nebulae) {
      const dz = camZ - nb.mesh.position.z; // distance ahead
      const vis = dz > 24 && dz < 260;
      nb.mesh.visible = vis;
      if (!vis) continue;
      nb.u.uTime.value = time;
      // fade bell: strongest mid-gap, gone near holds
      const near = smoothstep(24, 70, dz) * (1 - smoothstep(150, 260, dz));
      nb.u.uFade.value = near * 0.85;
      nb.u.uColA.value = this.accent;
      nb.u.uColB.value = new THREE.Color(EPOCHS[Math.min(N - 1, nb.gap + 1)].accent);
    }

    this.renderer.render(this.scene, this.camera);
  }

  /* ---------- lifecycle ---------- */

  resize(w: number, h: number, dpr: number) {
    // software GL: render at reduced scale (fill cost ~ pixels); real GPUs full quality
    const maxPix = this.softGPU ? 1_250_000 : 4_600_000;
    const raw = Math.min(dpr, this.isMobile ? 2 : 1.6, this.softGPU ? 0.8 : 2);
    const px = Math.min(raw, Math.sqrt(maxPix / Math.max(1, w * h)));
    this.renderer.setPixelRatio(px);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    for (let i = 0; i < N; i++) this.disposeTex(i);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as THREE.Points).material as THREE.Material | undefined;
      if (mat) mat.dispose();
    });
    this.renderer.dispose();
  }
}
