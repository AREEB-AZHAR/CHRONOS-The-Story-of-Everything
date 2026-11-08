import * as THREE from "three";
import type { TimelineEvent } from "@/data/timeline";

/* ============================================================
   CHRONOS — 4D spacetime tunnel engine
   - Camera sits at the centre; 30 era-cards spiral around it
   - Infinite looping scroll (never ends, wraps seamlessly)
   - Galaxy-like swirl + drift while scrolling
   - Click a card → it flies to you; glass panel shows its story
   ============================================================ */

const GAP = 26; // distance between era stations along the tunnel
const FOCUS_Z = -12; // where a card "docks" in front of the camera
const BEHIND = 24; // how far past the camera cards linger before wrapping
const CARD_W = 1.75;
const CARD_H = 1;

export interface SceneFrameState {
  /** interpolated years-ago */
  year: number;
  /** index of the era currently docking (nearest station) */
  focusIdx: number;
  /** 0..1 position within the full loop */
  loopProgress: number;
  /** |velocity| of travel (units/s) */
  speed: number;
}

export interface CosmicSceneCallbacks {
  onProgress?: (p: number) => void;
  onReady?: () => void;
  onFrame?: (s: SceneFrameState) => void;
  onEraChange?: (idx: number) => void;
  onSelect?: (idx: number | null) => void;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mod = (x: number, T: number) => ((x % T) + T) % T;

/* ---------------- card shader: rounded glass with glow border + sheen ---------------- */

const CARD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CARD_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uBorder;
  uniform float uDim;
  uniform float uOpacity;
  uniform float uSheen;
  uniform float uBlur;
  uniform vec3 uBorderCol;
  varying vec2 vUv;
  varying vec3 vViewPos;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  vec3 sampleCardTexture(sampler2D map, vec2 uv, float blur) {
    if (blur < 0.05) {
      return texture2D(map, uv).rgb;
    }
    // High-performance multi-tap bokeh blur for mysterious background timeline glimpse
    float r = blur * 0.009;
    vec3 col = texture2D(map, uv).rgb * 0.24;
    col += texture2D(map, uv + vec2( r,  0.0)).rgb * 0.11;
    col += texture2D(map, uv - vec2( r,  0.0)).rgb * 0.11;
    col += texture2D(map, uv + vec2(0.0,  r )).rgb * 0.11;
    col += texture2D(map, uv - vec2(0.0,  r )).rgb * 0.11;
    col += texture2D(map, uv + vec2( r * 0.72,  r * 0.72)).rgb * 0.08;
    col += texture2D(map, uv + vec2(-r * 0.72,  r * 0.72)).rgb * 0.08;
    col += texture2D(map, uv + vec2( r * 0.72, -r * 0.72)).rgb * 0.08;
    col += texture2D(map, uv + vec2(-r * 0.72, -r * 0.72)).rgb * 0.08;
    // Outer perimeter taps for pronounced, dreamy silhouette
    float r2 = r * 1.85;
    col += texture2D(map, uv + vec2( r2,  0.0)).rgb * 0.02;
    col += texture2D(map, uv - vec2( r2,  0.0)).rgb * 0.02;
    col += texture2D(map, uv + vec2(0.0,  r2)).rgb * 0.02;
    col += texture2D(map, uv - vec2(0.0, -r2)).rgb * 0.02;
    return col;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(${CARD_W.toFixed(2)}, 1.0);
    float d = roundedBox(p, vec2(${(CARD_W / 2).toFixed(3)}), 0.085);

    float aa = 0.014;
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    if (alpha < 0.01) discard;

    vec3 tex = sampleCardTexture(uMap, vUv, uBlur);
    // gentle top-light
    float grad = mix(1.06, 0.82, vUv.y);
    vec3 col = tex * uDim * grad;

    // animated glass sheen sweeping across
    float sx = (vUv.x + vUv.y) * 0.9 - mod(uTime * 0.22, 2.2);
    float sheen = smoothstep(0.0, 0.28, sx) * smoothstep(0.56, 0.28, sx);
    col += vec3(0.30, 0.34, 0.32) * sheen * uSheen;

    // glowing border
    float edgeW = 0.030;
    float borderMask = 1.0 - smoothstep(0.0, edgeW, -d);
    float pulse = 0.78 + 0.22 * sin(uTime * 2.4);
    col = mix(col, uBorderCol * pulse, borderMask * uBorder);

    // Atmospheric cosmic fog: distant background timelines melt into the void
    float viewDist = length(vViewPos);
    float fogFactor = smoothstep(45.0, 180.0, viewDist);
    vec3 fogColor = vec3(0.02, 0.015, 0.035);
    col = mix(col, fogColor, fogFactor * 0.82);

    // Fade opacity at extreme distance so cards never abruptly pop when entering view frustum
    float distFade = 1.0 - smoothstep(130.0, 220.0, viewDist);
    float finalAlpha = alpha * uOpacity * distFade;
    if (finalAlpha < 0.01) discard;

    gl_FragColor = vec4(col, finalAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ---------------- shard shader: infinite wrap + float, single draw call ---------------- */

const SHARD_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aAmp;
  attribute float aAlpha;
  attribute float aZoff;
  uniform float uScroll;
  uniform float uTime;
  uniform float uLoop;
  uniform float uBehind;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    vUv = uv;
    vAlpha = aAlpha;
    float z = mod(aZoff + uScroll + uBehind, uLoop) - uBehind;
    vec3 p = position;
    p.z = z;
    p.x += sin(uTime * aSpeed + aPhase) * aAmp;
    p.y += cos(uTime * aSpeed * 0.83 + aPhase * 1.31) * aAmp;
    p.z += sin(uTime * aSpeed * 0.61 + aPhase * 2.17) * aAmp * 0.6;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const SHARD_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uDim;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.01) discard;
    vec3 c = texture2D(uMap, vUv).rgb;
    gl_FragColor = vec4(c * uDim, vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ---------------- star shader with space warp hyperspace streak ---------------- */

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  varying vec3 vColor;
  varying float vWarp;
  uniform float uPR;
  uniform float uWarp;
  void main() {
    vColor = color;
    vWarp = uWarp;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Point size blooms and stretches in warp speed!
    gl_PointSize = aSize * uPR * (1.0 + uWarp * 2.8);
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vWarp;
  uniform float uOpacity;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    // In warp, elongate particles into motion streak lines along travel axis
    c.y *= (1.0 + vWarp * 2.4);
    float d = length(c);
    float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(vColor, vec3(0.85, 0.95, 1.0), vWarp * 0.7);
    gl_FragColor = vec4(col, a * uOpacity * (1.0 + vWarp * 0.6));
    #include <colorspace_fragment>
  }
`;

/* ============================================================ */

interface CardRig {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  station: number;
  angle: number;
  radius: number;
  yOff: number;
  baseScale: number;
  phase: number;
  // animated state
  dim: number;
  border: number;
  sheen: number;
  scale: number;
  blur: number;
  // selection tween
  free: boolean; // being selected/returning (wrap paused)
  returning: boolean;
}

export class CosmicScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private world = new THREE.Group();
  private timer = new THREE.Timer();

  private canvas: HTMLCanvasElement;
  private events: TimelineEvent[];
  private cb: CosmicSceneCallbacks;
  private loopT: number;

  private cards: CardRig[] = [];
  private cardMeshes: THREE.Mesh[] = [];
  private nebulas: { spr: THREE.Sprite; station: number }[] = [];
  private stars?: THREE.Points;
  private starsMat?: THREE.ShaderMaterial;
  private dust?: THREE.Points;
  private dustMat?: THREE.ShaderMaterial;
  private shardMesh?: THREE.Mesh;
  private shardMat?: THREE.ShaderMaterial;
  private glowSpr: THREE.Sprite;
  private titleSpr: THREE.Sprite;

  // scroll state
  private targetScroll = -64; // ambient start: Big Bang glowing far ahead in the void
  private scroll = -64;
  private velocity = 0;
  private lastInputAt = 0;
  private inputLocked = false;
  private begun = false;
  private dockedAt = -1; // when the stream last froze on a station (idle linger)

  // space warp hyperspace flight state
  private warpFlight = {
    active: false,
    startStation: 0,
    targetStation: 0,
    startScroll: 0,
    targetScroll: 0,
    startTime: 0,
    duration: 1.0,
    dir: 1,
  };
  private warpFactor = 0; // 0..1 smooth hyperspace warp factor
  private wheelAccum = 0;
  private wheelLastAt = 0;

  /**
   * Calculates dynamic space warp flight duration based on the real cosmic time gap (years)
   * between the source and destination epochs.
   * e.g. 5,000 years -> ~0.75s; 8.4 Billion years -> ~2.05s
   */
  private getEraWarpDuration(fromIdx: number, toIdx: number): number {
    const len = this.events.length;
    const a = this.events[mod(fromIdx, len)];
    const b = this.events[mod(toIdx, len)];
    if (!a || !b) return 0.9;
    const deltaYears = Math.abs(a.yearsAgo - b.yearsAgo);

    const logMin = 3.5; // log10(3,000 years)
    const logMax = 10.15; // log10(14 Billion years)
    const logVal = Math.log10(Math.max(deltaYears, 3000));
    const t = THREE.MathUtils.clamp((logVal - logMin) / (logMax - logMin), 0, 1);

    return THREE.MathUtils.lerp(0.75, 2.05, Math.pow(t, 0.85));
  }

  // focus / interaction
  private focusIdx = 0;
  private hoveredIdx = -1;
  private selectedIdx = -1;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-10, -10);
  private pointerInside = false;
  private downPos = { x: 0, y: 0, t: 0 };
  private dragging = false;
  private dragLastY = 0;

  // camera smoothing
  private lookCur = new THREE.Vector3(0, 0, -1);
  private mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  private rollCur = 0;

  // palette
  private bgCur = new THREE.Color("#050308");
  private bgTarget = new THREE.Color("#050308");

  // title sprite texture
  private titleCanvas = document.createElement("canvas");
  private titleTex: THREE.CanvasTexture;
  private titleIdx = -1;
  private titlePendingIdx = -1;
  private titleChangeAt = 0;

  private raf = 0;
  private disposed = false;
  private ready = false;
  private frameCount = 0;
  private lastEra = -1;
  // adaptive quality
  private fpsSamples: number[] = [];
  private qualityChecked = false;
  private prCap = 1.75; // pixel-ratio ceiling, lowered for weak GPUs
  private keyRepeatAt = 0;

  /**
   * Spacetime tunnel Z-coordinate:
   * When station k is docked, its Z is FOCUS_Z (-12).
   * Stations k+1, k+2, k+3 stretch deep into the forward corridor along negative Z (-38, -64, -90).
   * Stations that pass behind the camera wrap seamlessly at +BEHIND to the deep cosmic background (-756).
   */
  private getCardZ(station: number): number {
    return mod(this.scroll - station - BEHIND, this.loopT) - this.loopT + BEHIND;
  }

  constructor(canvas: HTMLCanvasElement, events: TimelineEvent[], cb: CosmicSceneCallbacks) {
    this.canvas = canvas;
    this.events = events;
    this.cb = cb;
    this.loopT = events.length * GAP;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 320);
    this.scene.fog = new THREE.Fog(0x050308, 40, 225);
    this.scene.background = this.bgCur.clone();
    this.scene.add(this.world);

    // glow sprite (focus highlight halo)
    this.glowSpr = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeRadialTexture("#ffffff", 256),
        color: new THREE.Color("#7dffc4"),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.glowSpr.scale.set(9, 6.2, 1);
    this.scene.add(this.glowSpr);

    // floating era title sprite
    this.titleCanvas.width = 1024;
    this.titleCanvas.height = 300;
    this.titleTex = new THREE.CanvasTexture(this.titleCanvas);
    this.titleTex.colorSpace = THREE.SRGBColorSpace;
    this.titleSpr = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.titleTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      })
    );
    this.titleSpr.scale.set(7.4, 2.17, 1);
    this.scene.add(this.titleSpr);

    this.buildStars();
    this.buildDust();
    this.buildNebulas();
    void this.loadAssets();

    this.bindEvents();
    this.timer.reset();
    this.loop();

    // redraw the floating title once webfonts are ready
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        this.titleIdx = -1;
      });
    }
  }

  /* ================= assets ================= */

  private async loadAssets() {
    const loader = new THREE.TextureLoader();
    const total = this.events.length;
    let done = 0;

    const loadOne = (url: string) =>
      new Promise<THREE.Texture | null>((resolve) => {
        loader.load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
            t.generateMipmaps = true;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            done++;
            this.cb.onProgress?.(done / total);
            resolve(t);
          },
          undefined,
          () => {
            done++;
            this.cb.onProgress?.(done / total);
            resolve(null); // keep going even if one image fails
          }
        );
      });

    // results stay aligned with events even when some fail
    const ordered = await Promise.all(this.events.map((e) => loadOne(e.image)));
    if (this.disposed) return;

    // Pre-upload all textures to GPU during loading screen to eliminate runtime scroll hitching
    ordered.forEach((tex) => {
      if (tex) {
        try {
          this.renderer.initTexture(tex);
        } catch {
          /* ignore */
        }
      }
    });

    this.buildCards(ordered);
    this.buildShards(ordered);

    // Warm up shader compilation ahead of time
    try {
      this.renderer.compile(this.scene, this.camera);
    } catch {
      /* ignore */
    }

    this.ready = true;
    this.cb.onReady?.();
  }

  /* ================= world building ================= */

  private buildCards(texs: (THREE.Texture | null | undefined)[]) {
    const rand = mulberry32(1337);
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);

    this.events.forEach((ev, i) => {
      // Alternating gallery along the spacetime corridor
      // Left/right staggered so future upcoming cards are always clearly visible down the sightline
      const side = i % 2 === 0 ? 1 : -1;
      const angle = (side > 0 ? 0.32 : Math.PI - 0.32) + Math.sin(i * 0.75) * 0.12;
      const radius = 4.3 + (i % 3 === 0 ? 0.35 : 0.0);
      const yOff = (side > 0 ? 0.3 : -0.3) + Math.sin(i * 0.6) * 0.4;
      const baseScale = 3.2 + (i % 2 === 0 ? 0.15 : 0.0);

      const tex = texs[i] ?? makePlaceholderTexture(ev.palette.nebula);
      const mat = new THREE.ShaderMaterial({
        vertexShader: CARD_VERT,
        fragmentShader: CARD_FRAG,
        transparent: true,
        uniforms: {
          uMap: { value: tex },
          uTime: { value: 0 },
          uBorder: { value: 0 },
          uDim: { value: 0.35 },
          uOpacity: { value: 1 },
          uSheen: { value: 0 },
          uBlur: { value: 3.8 },
          uBorderCol: { value: new THREE.Color(ev.palette.accent) },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.scale.setScalar(baseScale);
      this.world.add(mesh);
      this.cardMeshes.push(mesh);
      this.cards.push({
        mesh,
        mat,
        station: i * GAP,
        angle,
        radius,
        yOff,
        baseScale,
        phase: rand() * Math.PI * 2,
        dim: 0.35,
        border: 0,
        sheen: 0,
        blur: 3.8,
        scale: baseScale,
        free: false,
        returning: false,
      });
    });
  }

  private buildShards(texs: (THREE.Texture | null | undefined)[]) {
    // 4x? atlas: 6 cols x 5 rows over 1024px
    const COLS = 6,
      ROWS = 5;
    const cv = document.createElement("canvas");
    cv.width = 1024;
    cv.height = 1024;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cw = 1024 / COLS;
    const ch = 1024 / ROWS;
    texs.forEach((t, i) => {
      if (!t || !t.image) return;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      try {
        ctx.drawImage(t.image as CanvasImageSource, col * cw, row * ch, cw, ch);
      } catch {
        /* ignore */
      }
    });
    const atlas = new THREE.CanvasTexture(cv);
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.generateMipmaps = true;
    atlas.minFilter = THREE.LinearMipmapLinearFilter;
    try {
      this.renderer.initTexture(atlas);
    } catch {
      /* ignore */
    }

    const rand = mulberry32(4242);
    const COUNT = 150;
    const pos: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    const aPhase: number[] = [];
    const aSpeed: number[] = [];
    const aAmp: number[] = [];
    const aAlpha: number[] = [];
    const aZoff: number[] = [];

    for (let s = 0; s < COUNT; s++) {
      const ev = Math.floor(rand() * this.events.length);
      const station = ev * GAP + (rand() - 0.5) * GAP * 1.6;
      const ang = rand() * Math.PI * 2;
      const rad = 3.2 + rand() * 10.5;
      const cx = Math.cos(ang) * rad;
      const cy = Math.sin(ang) * rad * 0.75;
      const size = 0.22 + rand() * 0.85;
      const rot = rand() * Math.PI * 2;
      const ar = 0.55 + rand() * 0.5; // aspect
      const dx = Math.cos(rot) * size * ar;
      const dy = Math.sin(rot) * size * ar;
      const px = -Math.sin(rot) * size;
      const py = Math.cos(rot) * size;

      const v0 = [cx - dx + px, cy - dy + py];
      const v1 = [cx + dx + px, cy + dy + py];
      const v2 = [cx + dx - px, cy + dy - py];
      const v3 = [cx - dx - px, cy - dy - py];
      const base = pos.length / 3;
      pos.push(...v0, 0, ...v1, 0, ...v2, 0, ...v3, 0);

      // uv inside a random sub-rect of the cell
      const col = ev % COLS,
        row = Math.floor(ev / COLS);
      const u0 = col / COLS,
        v0u = 1 - (row + 1) / ROWS;
      const mx = 0.05 + rand() * 0.15;
      const my = 0.05 + rand() * 0.15;
      const su = (1 / COLS) * (1 - mx);
      const sv = (1 / ROWS) * (1 - my);
      const ox = u0 + (mx / 2) * (1 / COLS);
      const oy = v0u + (my / 2) * (1 / ROWS);
      uvs.push(ox, oy, ox + su, oy, ox + su, oy + sv, ox, oy + sv);

      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      aPhase.push(rand() * Math.PI * 2);
      aSpeed.push(0.25 + rand() * 0.5);
      aAmp.push(0.1 + rand() * 0.3);
      aAlpha.push(0.28 + rand() * 0.5);
      aZoff.push(-station);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(aPhase, 1));
    g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(aSpeed, 1));
    g.setAttribute("aAmp", new THREE.Float32BufferAttribute(aAmp, 1));
    g.setAttribute("aAlpha", new THREE.Float32BufferAttribute(aAlpha, 1));
    g.setAttribute("aZoff", new THREE.Float32BufferAttribute(aZoff, 1));

    this.shardMat = new THREE.ShaderMaterial({
      vertexShader: SHARD_VERT,
      fragmentShader: SHARD_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: atlas },
        uScroll: { value: 0 },
        uTime: { value: 0 },
        uLoop: { value: this.loopT },
        uBehind: { value: BEHIND },
        uDim: { value: 0.85 },
      },
    });
    this.shardMesh = new THREE.Mesh(g, this.shardMat);
    this.shardMesh.frustumCulled = false;
    this.world.add(this.shardMesh);
  }

  private buildStars() {
    const rand = mulberry32(99);
    const N = 4200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#bfe9ff"),
      new THREE.Color("#ffe3bd"),
      new THREE.Color("#dcc8ff"),
    ];
    for (let i = 0; i < N; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = 22 + Math.pow(rand(), 0.5) * 85;
      pos[i * 3] = Math.cos(ang) * rad;
      pos[i * 3 + 1] = Math.sin(ang) * rad;
      pos[i * 3 + 2] = -rand() * this.loopT;
      const c = palette[Math.floor(rand() * palette.length)];
      const b = 0.35 + rand() * 0.65;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
      size[i] = rand() < 0.85 ? 0.9 + rand() * 1.3 : 2.0 + rand() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

    this.starsMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uPR: { value: Math.min(window.devicePixelRatio, 1.75) },
        uOpacity: { value: 0.9 },
        uWarp: { value: 0 },
      },
    });
    this.stars = new THREE.Points(g, this.starsMat);
    this.stars.frustumCulled = false;
    this.world.add(this.stars);
  }

  private buildDust() {
    const rand = mulberry32(77);
    const N = 560;
    const T = 120;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const c = new THREE.Color("#aef2ff");
    for (let i = 0; i < N; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = 2.4 + Math.pow(rand(), 0.7) * 7.5;
      pos[i * 3] = Math.cos(ang) * rad;
      pos[i * 3 + 1] = Math.sin(ang) * rad;
      pos[i * 3 + 2] = -rand() * T;
      const b = 0.3 + rand() * 0.7;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
      size[i] = 0.7 + rand() * 1.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uPR: { value: Math.min(window.devicePixelRatio, 1.75) },
        uOpacity: { value: 0.55 },
        uWarp: { value: 0 },
      },
    });
    this.dust = new THREE.Points(g, this.dustMat);
    this.dust.frustumCulled = false;
    this.dust.userData.T = T;
    this.world.add(this.dust);
  }

  private buildNebulas() {
    const rand = mulberry32(2024);
    const tex = makeRadialTexture("#ffffff", 256);
    const COUNT = Math.floor(this.events.length * 0.7);
    for (let i = 0; i < COUNT; i++) {
      const ev = this.events[Math.floor(rand() * this.events.length)];
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          color: new THREE.Color(ev.palette.nebula),
          transparent: true,
          opacity: 0.05 + rand() * 0.075,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      const ang = rand() * Math.PI * 2;
      const rad = 16 + rand() * 30;
      const station = rand() * this.loopT;
      spr.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, -station);
      const s = 45 + rand() * 70;
      spr.scale.set(s, s * (0.7 + rand() * 0.6), 1);
      this.world.add(spr);
      this.nebulas.push({ spr, station });
    }
  }

  /* ================= input ================= */

  private onWheel = (e: WheelEvent) => {
    if (this.inputLocked) return;

    const now = performance.now();
    // Flush residual accumulator if gesture paused for > 350ms
    if (now - this.wheelLastAt > 350) {
      this.wheelAccum = 0;
    }
    this.wheelLastAt = now;
    this.lastInputAt = now;

    // Normalize delta across wheel modes (0 = pixels, 1 = lines, 2 = pages)
    const mult = e.deltaMode === 1 ? 24 : e.deltaMode === 2 ? 80 : 1;
    this.wheelAccum += e.deltaY * mult;

    // While in hyperspace warp, absorb trailing trackpad inertia; allow chaining past 60%
    if (this.warpFlight.active) {
      const elapsed = (now - this.warpFlight.startTime) / 1000;
      const progress = elapsed / Math.max(this.warpFlight.duration, 0.1);
      if (progress < 0.6) {
        this.wheelAccum = 0;
        return;
      }
    }

    const WHEEL_THRESHOLD = 36;
    if (Math.abs(this.wheelAccum) >= WHEEL_THRESHOLD) {
      const dir = Math.sign(this.wheelAccum);
      this.wheelAccum = 0; // reset accumulator immediately to prevent double-triggers
      this.stepSection(dir > 0 ? 1 : -1);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.pointerInside = true;
    this.mouse.x = this.pointer.x;
    this.mouse.y = this.pointer.y;

    if (this.dragging && !this.inputLocked) {
      const totalDy = e.clientY - this.downPos.y;
      const DRAG_THRESHOLD = 35;
      if (Math.abs(totalDy) >= DRAG_THRESHOLD) {
        const dir = totalDy < 0 ? 1 : -1;
        this.downPos.y = e.clientY; // reset drag anchor
        this.stepSection(dir);
      }
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    this.downPos = { x: e.clientX, y: e.clientY, t: performance.now() };
    this.dragLastY = e.clientY;
    this.dragging = true;
  };

  /** Raycast cards directly at given screen coords; returns index or -1 */
  private pickAt(clientX: number, clientY: number): number {
    if (!this.ready) return -1;
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const candidates: THREE.Mesh[] = [];
    for (let i = 0; i < this.cards.length; i++) {
      const rig = this.cards[i];
      const cz = this.getCardZ(rig.station);
      if (cz > -70 && cz < 4 && !rig.free) candidates.push(rig.mesh);
    }
    const hits = this.raycaster.intersectObjects(candidates, false);
    return hits.length ? this.cards.findIndex((r) => r.mesh === hits[0].object) : -1;
  }

  private onPointerUp = (e: PointerEvent) => {
    this.dragging = false;
    const dist = Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y);
    const dt = performance.now() - this.downPos.t;
    if (dist < 9 && dt < 1400) {
      // treat as click → pick directly at the release point (works for touch too)
      if (this.selectedIdx >= 0) {
        this.closeSelection();
        return;
      }
      const hit = this.pickAt(e.clientX, e.clientY);
      if (hit >= 0) {
        const curP = this.scroll - FOCUS_Z;
        const curStation = Math.round(curP / GAP);
        const curIdx = mod(curStation, this.events.length);
        if (hit === curIdx) {
          // Clicking the currently docked foreground card opens its details modal
          this.select(hit);
        } else {
          // Clicking an image in the background corridor initiates Space Warp to that era!
          this.jumpTo(hit);
        }
      }
    }
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (this.selectedIdx >= 0) this.closeSelection();
      return;
    }

    // If modal is active, allow pressing arrows to close and step seamlessly
    if (this.selectedIdx >= 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        this.closeSelection();
        this.stepSection(1);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        this.closeSelection();
        this.stepSection(-1);
        return;
      }
    }

    if (this.inputLocked) return;

    const isArrow =
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowLeft" ||
      e.key === "s" ||
      e.key === "S" ||
      e.key === "w" ||
      e.key === "W";

    if (isArrow) {
      const now = performance.now();
      // Throttle key repeat when held down: step deliberately once every 380ms
      // rather than spamming unbuffered events every 30ms!
      if (e.repeat) {
        if (now - this.keyRepeatAt < 380) {
          e.preventDefault();
          return;
        }
      }
      this.keyRepeatAt = now;
    }

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
      case "s":
      case "S":
        e.preventDefault();
        this.stepSection(1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
      case "w":
      case "W":
        e.preventDefault();
        this.stepSection(-1);
        break;
      case "PageDown":
        e.preventDefault();
        this.stepSection(3);
        break;
      case "PageUp":
        e.preventDefault();
        this.stepSection(-3);
        break;
      case "Home":
        e.preventDefault();
        this.jumpTo(0);
        break;
      case "End":
        e.preventDefault();
        this.jumpTo(this.events.length - 1);
        break;
      case " ":
        e.preventDefault();
        this.stepSection(1);
        break;
    }
  };

  private onKeyUp = (_e: KeyboardEvent) => {
    // Single-click / single-tap section stepping is handled completely by autonomous space warp.
    // Releasing the key does NOT cancel or snap back an active step.
  };

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    const pr = Math.min(window.devicePixelRatio, this.prCap);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.starsMat) this.starsMat.uniforms.uPR.value = pr;
    if (this.dustMat) this.dustMat.uniforms.uPR.value = pr;
  };

  private bindEvents() {
    window.addEventListener("wheel", this.onWheel, { passive: true });
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
  }

  /* ================= public api ================= */

  begin() {
    // cinematic opening burst that settles onto the Big Bang (arrival scroll = 0*GAP + FOCUS_Z)
    this.begun = true;
    this.targetScroll = FOCUS_Z + 3;
    this.lastInputAt = performance.now();
  }

  jumpTo(idx: number) {
    if (this.selectedIdx >= 0) this.closeSelection();
    const curP = this.scroll - FOCUS_Z;
    const curStation = curP / GAP;
    const curIdx = mod(Math.round(curStation), this.events.length);

    // Calculate shortest path around the loop
    let deltaStations = idx - curIdx;
    const half = this.events.length / 2;
    if (deltaStations > half) deltaStations -= this.events.length;
    if (deltaStations < -half) deltaStations += this.events.length;

    const targetStation = Math.round(curStation) + deltaStations;
    const duration = this.getEraWarpDuration(curIdx, idx);
    const goalScroll = targetStation * GAP + FOCUS_Z;

    this.warpFlight = {
      active: true,
      startStation: curStation,
      targetStation,
      startScroll: this.scroll,
      targetScroll: goalScroll,
      startTime: performance.now(),
      duration: Math.max(duration, 0.85),
      dir: deltaStations >= 0 ? 1 : -1,
    };

    this.targetScroll = goalScroll;
    this.lastInputAt = performance.now();
  }

  /** Step cleanly section-by-section along the cosmic timeline with single-click Space Warp */
  stepSection(dir: number) {
    if (!this.begun) {
      this.begin();
      return;
    }
    if (this.selectedIdx >= 0) {
      this.closeSelection();
    }

    // Determine current continuous station from camera position
    const curP = this.scroll - FOCUS_Z;
    const curStation = curP / GAP;

    // Target station:
    // If already in warp in the same direction, chain forward by one more station!
    let nextStation: number;
      if (this.warpFlight.active && Math.sign(this.warpFlight.dir) === Math.sign(dir)) {
        nextStation = this.warpFlight.targetStation + (dir > 0 ? 1 : -1);
      } else {
        nextStation = dir > 0 ? Math.floor(curStation + 0.05) + 1 : Math.ceil(curStation - 0.05) - 1;
      }

      const fromIdx = mod(Math.round(curStation), this.events.length);
      const toIdx = mod(nextStation, this.events.length);
      const duration = this.getEraWarpDuration(fromIdx, toIdx);
      const goalScroll = nextStation * GAP + FOCUS_Z;

      this.warpFlight = {
        active: true,
        startStation: curStation,
        targetStation: nextStation,
        startScroll: this.scroll,
        targetScroll: goalScroll,
        startTime: performance.now(),
        duration,
        dir: dir > 0 ? 1 : -1,
      };

      this.targetScroll = goalScroll;
      this.lastInputAt = performance.now();
    }

    select(idx: number) {
      if (this.selectedIdx === idx) return;
      this.selectedIdx = idx;
      this.inputLocked = true;
      const rig = this.cards[idx];
      if (rig) rig.free = true;
      this.cb.onSelect?.(idx);
    }

    closeSelection() {
      if (this.selectedIdx < 0) return;
      const rig = this.cards[this.selectedIdx];
      if (rig) rig.returning = true;
      this.selectedIdx = -1;
      this.cb.onSelect?.(null);
      // unlock shortly after the card starts flying home
      setTimeout(() => {
        this.inputLocked = false;
        this.lastInputAt = performance.now();
      }, 350);
    }

  /* ================= main loop ================= */

  private tmpV = new THREE.Vector3();
  private tmpV2 = new THREE.Vector3();
  private tmpV3 = new THREE.Vector3();
  private tmpColor = new THREE.Color();
  private static Z_AXIS = new THREE.Vector3(0, 0, 1);

  private loop = (timestamp?: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    this.timer.update(timestamp);
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const t = this.timer.getElapsed();
    this.frameCount++;

    /* ---- adaptive quality: one-time downgrade for weak GPUs ---- */
    if (!this.qualityChecked && t > 0.5) {
      if (dt > 0 && dt < 1) this.fpsSamples.push(1 / dt);
      if (t > 6 && this.fpsSamples.length > 30) {
        const avg = this.fpsSamples.reduce((s, v) => s + v, 0) / this.fpsSamples.length;
        if (avg < 32) {
          // weak GPU (or software rasterizer): cut resolution & particle counts
          this.prCap = 1;
          this.renderer.setPixelRatio(1);
          if (this.starsMat) this.starsMat.uniforms.uPR.value = 1;
          if (this.dustMat) this.dustMat.uniforms.uPR.value = 1;
          if (this.stars) this.stars.geometry.setDrawRange(0, 2600);
          this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        this.qualityChecked = true;
      }
    }

    /* ---- space warp active flight execution ---- */
    if (this.warpFlight.active) {
      const elapsed = (performance.now() - this.warpFlight.startTime) / 1000;
      const progress = Math.min(1.0, elapsed / Math.max(this.warpFlight.duration, 0.1));

      // Quintic S-curve warp profile: punchy acceleration -> hyper-speed cruise -> cushioned drop-out
      const ease =
        progress < 0.5
          ? 16 * Math.pow(progress, 5)
          : 1 - Math.pow(-2 * progress + 2, 5) / 2;

          const prevScroll = this.scroll;
          this.scroll =
            this.warpFlight.startScroll +
            (this.warpFlight.targetScroll - this.warpFlight.startScroll) * ease;
          this.targetScroll = this.scroll;

          // Peak warp factor is high in the middle of flight:
          const rawWarp = Math.sin(progress * Math.PI);
          this.warpFactor = Math.pow(rawWarp, 1.35);

          // Instantaneous warp velocity for effects
          const instV = (this.scroll - prevScroll) / Math.max(dt, 1e-4);
          this.velocity = instV;

          if (progress >= 1.0) {
            this.scroll = this.warpFlight.targetScroll;
            this.targetScroll = this.warpFlight.targetScroll;
            this.warpFlight.active = false;
            this.velocity = 0;
          }
      } else {
        // Warp factor decays smoothly to zero when not warping
        this.warpFactor += (0 - this.warpFactor) * 0.12;

        /* ---- idle auto-drift: the stream carries you, lingering at each station ---- */
        const idle = performance.now() - this.lastInputAt > 4000;
        if (idle && !this.inputLocked && this.selectedIdx < 0 && this.ready && this.begun) {
          const fDock = this.scroll - FOCUS_Z;
          const nearestDock = Math.round(fDock / GAP) * GAP;
          const docked = Math.abs(fDock - nearestDock) < 0.6;
          if (docked && this.dockedAt < 0) this.dockedAt = performance.now();
          if (!docked) this.dockedAt = -1;
          const lingered = this.dockedAt > 0 && performance.now() - this.dockedAt > 8000;
          if (!docked || lingered) this.targetScroll += 2.1 * dt;
        }

        /* ---- magnetic docking: gently settle onto the nearest station when scroll eases or pauses ---- */
        const timeSinceInput = performance.now() - this.lastInputAt;
        const pScroll = this.scroll - FOCUS_Z;
        const pDockOffset = mod(pScroll + GAP * 0.5, GAP) - GAP * 0.5;
        const distToStation = Math.abs(pDockOffset);

        if (
          this.ready &&
          !this.inputLocked &&
          this.selectedIdx < 0 &&
          this.begun &&
          timeSinceInput > 200 &&
          Math.abs(this.velocity) < 6.5
        ) {
          const nearestDock = Math.round(pScroll / GAP) * GAP;
          const deltaDock = nearestDock - pScroll;
          if (Math.abs(deltaDock) < GAP * 0.44) {
            const pull = Math.min(1.0, 5.0 * dt);
            const dockTarget = nearestDock + FOCUS_Z;
            this.targetScroll += (dockTarget - this.targetScroll) * pull;
          }
        }

        /* ---- smooth scroll + velocity with event section approach braking ---- */
        const pScrollNow = this.scroll - FOCUS_Z;
        const pDockOffsetNow = mod(pScrollNow + GAP * 0.5, GAP) - GAP * 0.5;
        const distToStationNow = Math.abs(pDockOffsetNow);
        const approachRadius = 8.5;
        const approachFactor = Math.max(0, 1 - distToStationNow / approachRadius);

        const lerpRate = THREE.MathUtils.lerp(14.0, 8.5, approachFactor);
        const lerpAlpha = 1 - Math.exp(-lerpRate * dt);
        const maxSpeed = THREE.MathUtils.lerp(50.0, 18.0, Math.pow(approachFactor, 1.2));
        const maxDelta = maxSpeed * dt;

        const prev = this.scroll;
        let step = (this.targetScroll - this.scroll) * lerpAlpha;
        step = THREE.MathUtils.clamp(step, -maxDelta, maxDelta);
        this.scroll += step;

        const instV = (this.scroll - prev) / Math.max(dt, 1e-4);
        this.velocity += (instV - this.velocity) * 0.16;
      }
      const speed = Math.abs(this.velocity);

      /* ---- galaxy swirl ---- */
      const swirl =
        t * 0.016 + mod(this.scroll, this.loopT) * 0.00042 + this.velocity * 0.00035;
      this.world.rotation.z = swirl;

      /* ---- focus determination: p = position in station space ---- */
      const p = this.scroll - FOCUS_Z; // card i docks exactly when p ≡ i*GAP
      const rawIdx = mod(Math.round(p / GAP), this.events.length);
      const focusProgress = mod(p, GAP) / GAP;
      const floorIdx = mod(Math.floor(p / GAP), this.events.length);
      const ceilIdx = (floorIdx + 1) % this.events.length;

      if (this.ready && rawIdx !== this.lastEra) {
        this.lastEra = rawIdx;
        this.cb.onEraChange?.(rawIdx);
      }

      /* ---- year interpolation (floor → ceil station) ---- */
      const a = this.events[floorIdx];
      const b = this.events[ceilIdx];
      const yearVal = a && b ? a.yearsAgo + (b.yearsAgo - a.yearsAgo) * focusProgress : (a?.yearsAgo ?? 0);

      /* ---- camera: head-turn toward focus card + parallax + banking ---- */
      this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.05;
      this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.05;
      let lookX = this.mouse.sx * 2.6;
      let lookY = -this.mouse.sy * 1.7;
      if (this.ready && this.cards.length) {
        const rig = this.cards[rawIdx];
        if (rig) {
          const cz = this.getCardZ(rig.station);
          if (cz > -60 && cz < BEHIND && this.selectedIdx < 0) {
            const wp = this.tmpV
              .set(Math.cos(rig.angle) * rig.radius, rig.yOff, cz)
              .applyAxisAngle(CosmicScene.Z_AXIS, swirl);
            lookX = lookX * 0.4 + wp.x * 0.38;
            lookY = lookY * 0.4 + wp.y * 0.38;
          }
        }
      }
      this.lookCur.x += (lookX - this.lookCur.x) * 0.045;
      this.lookCur.y += (lookY - this.lookCur.y) * 0.045;
      const rollTarget = THREE.MathUtils.clamp(this.velocity * 0.006, -0.16, 0.16);
      this.rollCur += (rollTarget - this.rollCur) * 0.05;
      this.camera.up.set(Math.sin(this.rollCur), Math.cos(this.rollCur), 0);
      // Look straight down the spacetime tunnel corridor (-40) so the entire avenue of future cards is visible
      this.camera.lookAt(this.lookCur.x * 0.4, this.lookCur.y * 0.4, -40);

        /* ---- space warp star uniforms, FOV distortion, and relativistic vibration ---- */
        if (this.starsMat) {
          this.starsMat.uniforms.uWarp.value = this.warpFactor;
        }
        if (this.dustMat) {
          this.dustMat.uniforms.uWarp.value = this.warpFactor;
        }

        // Dynamic FOV: Standard 68°, expanding outward to 94° in hyperspace warp!
        const warpFovTarget = 68 + this.warpFactor * 26 + Math.min(speed * 0.35, 10);
        if (Math.abs(this.camera.fov - warpFovTarget) > 0.05) {
          this.camera.fov += (warpFovTarget - this.camera.fov) * 0.14;
          this.camera.updateProjectionMatrix();
        }

        // Relativistic cockpit vibration during peak hyperspace cruise
        const warpShakeX = (Math.sin(t * 53.0) + Math.cos(t * 89.0)) * 0.06 * this.warpFactor;
        const warpShakeY = (Math.cos(t * 61.0) + Math.sin(t * 79.0)) * 0.05 * this.warpFactor;
        this.camera.position.x = warpShakeX;
        this.camera.position.y = warpShakeY;

        /* ---- hover raycast (throttled) ---- */
        if (this.ready && this.pointerInside && this.frameCount % 2 === 0 && this.selectedIdx < 0) {
          this.raycaster.setFromCamera(this.pointer, this.camera);
          const candidates: THREE.Mesh[] = [];
          for (let i = 0; i < this.cards.length; i++) {
            const rig = this.cards[i];
            const cz = this.getCardZ(rig.station);
            if (cz > -70 && cz < 4 && !rig.free) candidates.push(rig.mesh);
          }
          const hits = this.raycaster.intersectObjects(candidates, false);
          if (hits.length) {
            this.hoveredIdx = this.cards.findIndex((r) => r.mesh === hits[0].object);
          } else {
            this.hoveredIdx = -1;
          }
          this.canvas.style.cursor = this.hoveredIdx >= 0 ? "pointer" : "default";
        }
        if (this.selectedIdx >= 0) this.hoveredIdx = -1;

        /* ---- cards ---- */
        if (this.ready) {
          for (let i = 0; i < this.cards.length; i++) {
            const rig = this.cards[i];
            const isFocus = i === rawIdx && this.selectedIdx < 0;
            const isHover = i === this.hoveredIdx;
            const isSel = i === this.selectedIdx;

            const cz = this.getCardZ(rig.station);

            if (rig.free) {
              // ---- selected / returning: manual control ----
              if (isSel) {
                // bring it right up to the viewer
                const portrait = window.innerHeight > window.innerWidth;
                const dist = portrait ? 6.2 : 4.6;
                const side = portrait ? 0 : -1.15;
                this.camera.getWorldDirection(this.tmpV2);
                const target = this.tmpV3
                  .copy(this.camera.position)
                  .addScaledVector(this.tmpV2, dist);
                target.x += -this.tmpV2.z * side;
                target.y += portrait ? 1.35 : 0.12;
                target.z += this.tmpV2.x * side;
                // convert world → local (the galaxy group slowly rotates)
                this.world.updateMatrixWorld();
                this.world.worldToLocal(target);
                rig.mesh.position.lerp(target, 0.085);
                const targetScale = portrait ? 1.55 : 2.7;
                rig.scale += (targetScale - rig.scale) * 0.09;
                rig.mesh.scale.setScalar(rig.scale);
                rig.mesh.lookAt(this.camera.position);
                rig.dim += (1.15 - rig.dim) * 0.1;
                rig.border += (1.0 - rig.border) * 0.1;
                rig.sheen += (1.0 - rig.sheen) * 0.08;
                rig.blur += (0.0 - rig.blur) * 0.12;
              } else if (rig.returning) {
                // fly home
                const home = this.tmpV.set(Math.cos(rig.angle) * rig.radius, rig.yOff, cz);
                rig.mesh.position.lerp(home, 0.11);
                rig.scale += (rig.baseScale - rig.scale) * 0.11;
                rig.mesh.scale.setScalar(rig.scale);
                if (rig.mesh.position.distanceTo(home) < 0.12) {
                  rig.returning = false;
                  rig.free = false;
                }
                rig.dim += (0.75 - rig.dim) * 0.1;
                rig.border *= 0.9;
                rig.sheen *= 0.9;
                rig.blur += (3.8 - rig.blur) * 0.1;
              }
              rig.mesh.rotateZ(Math.sin(t * 0.5 + rig.phase) * 0.0035);
            } else {
              // ---- floating around the viewer, wrapping forever ----
              const bob = Math.sin(t * 0.42 + rig.phase) * 0.28;
              const sway = Math.cos(t * 0.3 + rig.phase * 1.7) * 0.2;
              rig.mesh.position.set(
                Math.cos(rig.angle) * rig.radius + sway,
                rig.yOff + bob,
                cz
              );
              rig.mesh.lookAt(this.camera.position);
              rig.mesh.rotateZ(Math.sin(t * 0.35 + rig.phase) * 0.05);

              // Continuous focus proximity based on exact distance to docking station (FOCUS_Z)
              const distToDock = Math.abs(cz - FOCUS_Z);
              const focusInfluence = 16.0; // units of focus capture zone
              const focusFactor = Math.max(0, 1.0 - Math.pow(distToDock / focusInfluence, 1.6));

              // When in background, blur is high (4.2), keeping other timelines soft & mysterious.
              // As a card comes into view towards dock, blur smoothly dissolves to 0.0!
              let tBlur = THREE.MathUtils.lerp(4.2, 0.0, Math.pow(focusFactor, 1.2));

              // Dynamic scale: background cards are subtle (0.90x), swelling to 1.20x at focus
              let tScale = rig.baseScale * (0.90 + 0.30 * focusFactor);

              // Luminance: background cards are softly dimmed (0.30) so they don't overpower,
              // glowing to full brilliance (1.05) when in focus
              let tDim = 0.30 + 0.75 * focusFactor;

              // Glowing border: swells organically as the card approaches the focus dock
              let tBorder = Math.pow(focusFactor, 1.5);
              let tSheen = 0.6 * Math.pow(focusFactor, 1.2);

              if (this.selectedIdx >= 0) {
                tDim = 0.08;
                tBorder = 0;
                tSheen = 0;
                tBlur = 4.2;
                tScale = rig.baseScale * 0.9;
              } else if (isHover) {
                tDim = Math.max(tDim, 0.98);
                tBorder = Math.max(tBorder, 0.85);
                tBlur = Math.min(tBlur, 0.3);
                tScale = Math.max(tScale, rig.baseScale * 1.12);
              }

              rig.dim += (tDim - rig.dim) * 0.08;
              rig.border += (tBorder - rig.border) * 0.09;
              rig.sheen += (tSheen - rig.sheen) * 0.08;
              rig.blur += (tBlur - rig.blur) * 0.09;
              rig.scale += (tScale - rig.scale) * 0.08;
              rig.mesh.scale.setScalar(rig.scale);
            }

            const u = rig.mat.uniforms;
            u.uTime.value = t;
            u.uDim.value = rig.dim;
            u.uBorder.value = rig.border;
            u.uSheen.value = rig.sheen;
            u.uBlur.value = rig.blur;
          }
        }

        /* ---- glow halo smoothly interpolates between current and approaching station (WORLD space) ---- */
        if (this.selectedIdx >= 0) {
          const glowRig = this.cards[this.selectedIdx];
          if (glowRig) {
            glowRig.mesh.getWorldPosition(this.tmpV2);
            this.camera.getWorldDirection(this.tmpV);
            const gTarget = this.tmpV3.copy(this.tmpV2).addScaledVector(this.tmpV, -0.7);
            this.glowSpr.position.lerp(gTarget, 0.12);
            const glowMat = this.glowSpr.material as THREE.SpriteMaterial;
            this.glowSpr.scale.set(9 * 1.5, 6.2 * 1.5, 1);
            glowMat.opacity += (0.35 - glowMat.opacity) * 0.08;
            const wantCol = this.tmpColor.set(this.events[this.selectedIdx]?.palette.accent ?? "#7dffc4");
            glowMat.color.lerp(wantCol, 0.05);
          }
        } else if (this.cards.length) {
          // Continuous floating station position: p = scroll - FOCUS_Z
          const stationCont = p / GAP;
          const sFloor = Math.floor(stationCont);
          const sCeil = sFloor + 1;
          const sFrac = THREE.MathUtils.smoothstep(stationCont - sFloor, 0.1, 0.9);
          const idxA = mod(sFloor, this.cards.length);
          const idxB = mod(sCeil, this.cards.length);
          const rigA = this.cards[idxA];
          const rigB = this.cards[idxB];
          if (rigA && rigB) {
            rigA.mesh.getWorldPosition(this.tmpV2);
            rigB.mesh.getWorldPosition(this.tmpV);
            this.tmpV2.lerp(this.tmpV, sFrac);
            this.camera.getWorldDirection(this.tmpV3);
            const gTarget = this.tmpV2.addScaledVector(this.tmpV3, -0.7);
            this.glowSpr.position.lerp(gTarget, 0.14);

            const glowMat = this.glowSpr.material as THREE.SpriteMaterial;
            const pulse = 0.18 + 0.08 * Math.sin(t * 2.2);
            this.glowSpr.scale.set(9, 6.2, 1);
            glowMat.opacity += (pulse - glowMat.opacity) * 0.08;

            const colA = this.tmpColor.set(this.events[idxA]?.palette.accent ?? "#7dffc4");
            const colB = new THREE.Color(this.events[idxB]?.palette.accent ?? "#7dffc4");
            colA.lerp(colB, sFrac);
            glowMat.color.lerp(colA, 0.08);
          }
        }

        // floating title (regenerate only when focus settles)
        if (this.ready && this.cards.length) {
          if (this.titleIdx !== rawIdx) {
            this.titlePendingIdx = rawIdx;
            this.titleChangeAt = performance.now();
            this.titleIdx = rawIdx;
          }
          if (
            this.titlePendingIdx >= 0 &&
            performance.now() - this.titleChangeAt > 140 &&
            (this.titleSpr.material as THREE.SpriteMaterial).map
          ) {
            this.drawTitle(this.titlePendingIdx);
            this.titlePendingIdx = -1;
          }
          const tr = this.cards[rawIdx];
          if (tr) {
            tr.mesh.getWorldPosition(this.tmpV2);
            const portrait = window.innerHeight > window.innerWidth;
            const tTarget = this.tmpV3.set(
              this.tmpV2.x * 0.82,
              this.tmpV2.y - (portrait ? 2.6 : 2.25),
              this.tmpV2.z + 0.6
            );
            this.titleSpr.position.lerp(tTarget, 0.1);
            const wantOpacity =
              this.selectedIdx >= 0
                ? 0
                : Math.exp(-Math.pow((this.tmpV2.z - FOCUS_Z) / 10, 2)) * 0.95;
            const m = this.titleSpr.material as THREE.SpriteMaterial;
            m.opacity += (wantOpacity - m.opacity) * 0.08;
          }
        }

        /* ---- starfield & dust wrap ---- */
        if (this.stars) {
          this.stars.position.z = mod(this.scroll, this.loopT);
        }
        if (this.dust) {
          const T = this.dust.userData.T as number;
          this.dust.position.z = mod(this.scroll, T);
          if (this.dustMat) {
            this.dustMat.uniforms.uOpacity.value = 0.35 + Math.min(speed * 0.004, 0.5);
          }
        }

        /* ---- shards ---- */
        if (this.shardMat) {
          this.shardMat.uniforms.uScroll.value = this.scroll;
          this.shardMat.uniforms.uTime.value = t;
          const targetDim = this.selectedIdx >= 0 ? 0.16 : 0.9;
          this.shardMat.uniforms.uDim.value +=
            (targetDim - this.shardMat.uniforms.uDim.value) * 0.06;
        }

        /* ---- nebulas wrap ---- */
        for (const n of this.nebulas) {
          n.spr.position.z = mod(this.scroll - n.station + BEHIND, this.loopT) - BEHIND;
        }

        /* ---- palette ambience ---- */
        const palA = this.events[floorIdx]?.palette;
        const palB = this.events[ceilIdx]?.palette;
        if (palA && palB) {
          this.bgTarget.set(palA.bg).lerp(new THREE.Color(palB.bg), focusProgress);
        }
        this.bgCur.lerp(this.bgTarget, 0.03);
        (this.scene.background as THREE.Color).copy(this.bgCur);
        (this.scene.fog as THREE.Fog).color.copy(this.bgCur);

        /* ---- report ---- */
        if (this.ready && this.frameCount % 2 === 0) {
          this.cb.onFrame?.({
            year: yearVal,
            focusIdx: rawIdx,
            loopProgress: mod(this.scroll, this.loopT) / this.loopT,
            speed,
          });
        }

        this.renderer.render(this.scene, this.camera);
      };

  /* ================= title sprite ================= */

  private drawTitle(idx: number) {
    const ev = this.events[idx];
    const ctx = this.titleCanvas.getContext("2d");
    if (!ctx || !ev) return;
    ctx.clearRect(0, 0, 1024, 300);
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 300 92px Fraunces, Georgia, serif";
    ctx.fillText(ev.title.toUpperCase(), 512, 128);
    ctx.shadowBlur = 12;
    ctx.font = "600 34px 'Space Mono', monospace";
    ctx.fillStyle = ev.palette.accent;
    ctx.fillText(`${ev.yearLabel.toUpperCase()}  ·  ${ev.category}`, 512, 208);
    this.titleTex.needsUpdate = true;
  }

  /* ================= teardown ================= */

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.timer.dispose();
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
    this.scene.traverse((o) => {
      const any = o as unknown as {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };
      any.geometry?.dispose?.();
      const m = any.material;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else m?.dispose?.();
    });
    this.renderer.dispose();
  }
}

/* ================= helpers ================= */

function makeRadialTexture(color: string, size: number): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.25, color + "cc");
  g.addColorStop(1, "#00000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePlaceholderTexture(color: string): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
