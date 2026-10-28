# Project Worklog

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Plan "CHRONOS — The Story of Everything" — cinematic scroll-through-time website (Big Bang → Today's Earth)

Work Log:
- Inspected project scaffold (Next.js 16 + Tailwind 4 + shadcn/ui), confirmed no conflicting work
- Loaded image-generation skill (z-ai SDK + CLI)
- Designed architecture: fixed cinematic stage + tall scroll track; custom rAF engine (lerp-smoothed progress, logarithmic time interpolation, velocity-driven warp), canvas starfield, fixed HUD with live year counter

Stage Summary:
- 19 epoch stops planned: Big Bang, Inflation/First Light, First Stars, First Galaxies, Milky Way, Sun Ignites, Earth & Moon, Oceans & First Life, Great Oxidation, Cambrian Explosion, Life Storms the Land (Devonian), The Great Dying (Permian), Age of Dinosaurs, K-Pg Asteroid, Age of Mammals, Dawn of Humanity, Out of Africa→Agriculture, Civilizations→Digital, Pale Blue Dot (Holocene extinctions)
- Big Five extinctions + Holocene/human-caused extinctions embedded as red "memorial" panels
- ~19 AI images to be generated into /public/cosmos (1440x720 → webp q80)
- Files: src/lib/cosmos/{timeline,format}.ts, src/components/cosmos/{CosmicExperience,WarpCanvas,EpochStage,TimeHUD,Overlays}.tsx, page.tsx, layout.tsx, globals.css

---
Task ID: 2
Agent: Z.ai Code (main)
Task: Build & ship CHRONOS — cinematic scroll-through-time website (Big Bang → Today's Earth)

Work Log:
- Built custom scroll engine (CosmicExperience.tsx): native scroll = target, rAF loop glides a virtual cursor via frame-rate-independent lerp; 26-viewport scroll track; all visuals are fixed layers driven by DOM mutations for frame-perfect sync
- Logarithmic time mapping: years interpolated in log10-space between epoch anchors so eons whip past and recent history slows — light-speed odometer effect (format.ts)
- WarpCanvas: ~700-star canvas field, streaks scale with scroll velocity, era-tinted nebulae, warp glow at high speed, DPR-aware, reduced-motion fallback
- EpochStage: 19 stops (Big Bang → You Are Here), crossfade + parallax slide + Ken Burns settle + motion blur driven per-frame; extinction memorial panels (Big Five + Holocene); progressive image mounting (±2 stops)
- TimeHUD: live year counter (value/unit + glow + velocity blur), era chip (holding vs "IN TRANSIT · LIGHT SPEED"), warp meter in c-units, hairline progress, clickable 19-dot progress rail (a11y-fixed), stop counter
- Intro/outro overlays with restart loop; film grain, vignette, letterbox scrims; sticky footer in outro respecting safe-area
- Images: 19 visuals — AI-generated (z-ai SDK, 1440x704→webp q85) + curated image-search fallbacks (NASA/ESO-style), all 1440x720 webp, 2.7MB total; scripts/{gen-images,fetch-images.sh,download-images,regen,optimize-images}.ts
- Fixed along the way: React Compiler ref-mutation lint (parent-owned register callbacks), image-gen 429 rate limits (patient backoff pipeline), size multiple-of-32 API constraint, Next image cache staleness (unoptimized), earthborn.webp filename mismatch, rail aria-hidden a11y bug, card/odometer overlap on short viewports, mobile HUD wrapping
- Verified end-to-end with agent-browser: intro, transit blurs, 5+ stops desktop & mobile, rail jumps, restart button, all 19 images 200, zero console errors / failed requests in fresh session; lint clean

Stage Summary:
- Shipped: / route = full cinematic experience; engine files in src/lib/cosmos + src/components/cosmos; images in public/cosmos
- Key decisions: native-scroll-as-target lerp engine (no virtual scroll lib), log-time odometer, unoptimized pre-sized webp images
- Status: DONE — browser-verified interactive, lint clean, dev server 200s

---
Task ID: 3
Agent: Z.ai Code (main)
Task: Rebuild CHRONOS as a 3D dive-through — full-bleed background environments, camera zooming INTO spacetime (no 2D side panels / vertical slides), floating readable text, mixed-image environments per era

Work Log:
- Generated 6 atmosphere overlay textures via z-ai SDK (tex-nebula/embers/caustics/mist/clouds/lightglow, 1440x704 → webp q80, scripts/gen-textures.ts); hit size-must-be-multiple-of-32 error with 1440x720, fixed to 704
- Built src/lib/cosmos/depth.ts: perspective constant, per-era texture composites (blend modes + opacities), layer Z geometry with scale compensation (comp()), sceneMotion(phase) — ARRIVE (z -2100→0, blur 15→0, fade-in) / HOLD (dolly 0→+200) / DEPART (accelerate to +1350, fade+blur out), deterministic mulberry32 dust fields
- Built DepthStage.tsx: each era = 3D environment of 5 depth layers — ghost of NEXT era far behind (mixes eras into one universe), full-bleed hero plate, 2 blended atmosphere textures, accent dust particles at z 40..190, floating glass text panel; preserve-3d throughout; gradient grading + red vignette for extinction eras
- Built StarfieldZoom.tsx: true 3D starfield — stars rush TOWARD the camera, radially projected streaks (hyperspace), idle drift, era-tinted nebulae, warp tunnel glow, DPR-aware, reduced-motion fallback
- Rewrote CosmicExperience.tsx engine: per-layer opacity/blur writes (CSS opacity/filter flatten preserve-3d — never applied to scene roots), mouse parallax world rotation, warp letterbox bars + hyperspace flash, panel perspective counter-transform (measured layout offsets; 82% screen-locked so text stays readable while world flies), Ken Burns breathing on hero plates
- Panel fixes found in browser: root opacity stayed 0 (engine now writes it), off-center cards pushed off-screen by perspective dolly (counter-transform fix), memorial buried below scroll fold (card scrollable + pointer-events only while visible), intro/outro odometer overlap (top padding)
- Mobile verified (390x844): bottom-sheet panels, Read more expand, dust trimmed; desktop verified at 6+ stops; 19-stop sweep: 0 broken images; console clean; lint clean

Stage Summary:
- Shipped CHRONOS 3D: full-bleed layered 3D environments, camera dives INTO each era and accelerates through it at light speed between eras, radial warp starfield, floating glass panels with extinction memorials
- Files: src/lib/cosmos/depth.ts (new), src/components/cosmos/{DepthStage,StarfieldZoom}.tsx (new), CosmicExperience.tsx (rewritten), TimeHUD/Overlays (copy + padding fixes), globals.css (float/drift/scrollbar keyframes); deleted EpochStage.tsx, WarpCanvas.tsx
- Status: DONE — browser-verified desktop + mobile, lint clean, all assets 200

---
Task ID: 4-a
Agent: general-purpose subagent
Task: High-res era imagery pipeline — replace all 19 era backgrounds with genuinely high-res, photorealistic, cinematic imagery (real photos preferred)

Work Log:
- Ran z-ai image-search for all 19 eras (primary query per era; searches were fast, 4-60s each), parsed JSON with bun (strip log lines, take substring from first "{")
- Hard candidate rules applied via scripts/hires-fetch-candidates.ts + hires-validate.ts: original width >=1600px (prefer >=2000), width>=height, real sharp metadata >=1600w; downloaded 62/62 candidates OK from OSS URLs
- VLM-judged each era's top 3 candidates in ONE z-ai vision call (sharpness / watermark / subject / mood, WINNER line parsed) — scripts/hires-judge.ts; 18/19 eras picked a real-photo winner on the primary query
- paleblue primary returned only "Earth limb" (VLM: NONE on strict full-disk criteria); ran fallback query "Earth horizon from space station ISS photograph high resolution", downloaded 3 more (WallpaperCat 2309px, hdqwalls 4845px, Quartz 1920px) and re-judged together with the 4588px limb shot — winner: hdqwalls 4845x2725 Earth-from-space
- Era winners (id — source — original res): bigbang — NASA Science — 2000x1158; firstlight — European Space Agency — 2160x1080; firststars — ESA/Webb — 3840x2160 (VLM runner-up at 1889px also passed; picked >=2000px per hard rule); galaxies — Eso.org — 3375x3362; milkyway — Wallpaper Abyss — 3840x2160; sunborn — The Wire Science — 2560x1609; earthborn — TIME — 2048x2048 (Earthrise-style Earth+Moon); firstocean — NOAA Ocean Exploration — 1920x1080 (black smoker); oxygen — Nordical Iceland — 2560x1709 (blue ice cave); cambrian — Wallpaper Abyss — 1600x1200 (trilobite fossil); landfall — Wide Open Spaces — 2500x1668; greatdying — Nordic Visitor — 1920x1080 (fissure eruption); dinosaurs — The Mercury News — 5472x3648 (T. rex mount); asteroid — Phys.org — 1920x1080; mammals — Adventure.com — 3000x1996 (misty savanna elephants); humans — Unsplash — 3000x1997 (acacia sunset); journeys — Don's Maps — 5190x2425 (Lascaux); civilization — NASA Science — 4128x2752 (night lights); paleblue — hdqwalls — 4845x2725
- Finalized winners to /tmp/hires/{id}-src + attribution manifest (/tmp/hires/winners.json); scripts/hires-finalize.ts
- scripts/hires-optimize.ts (sharp): 19 sources -> public/cosmos/{id}.webp (resize 2560x1440 cover/attention, webp q86) + {id}-m.webp (1280x720 cover/attention, q80) — 38 files overwritten in place; journeys.webp is NEW
- Verification scripts/hires-verify.ts: all 38 files OK (2560x1440 / 1280x720 webp, 0 failures, 12.50MB total); VLM spot-check of 5 riskiest finals (galaxies, earthborn, landfall, cambrian, paleblue) — all open, sharp, subject-correct, watermark-free, OVERALL: PASS
- Added public/cosmos/CREDITS.md (era -> source table + "imagery: public web search results, used for a demo experience" note); tex-*.webp and firstlife.webp untouched; no src/ changes

Stage Summary:
- ALL 19 eras got real photography (search-sourced at 1600-5472px original width) — zero AI-generation fallbacks needed
- 1 fallback query used: paleblue (primary gave only limb shots / VLM NONE); everything else passed on primary query
- Final state: 38 verified webp files (19 x 2 sizes) in public/cosmos, from 2000px+ sources for 16/19 eras (firstocean 1920, greatdying 1920, asteroid 1920, cambrian 1600 are the smallest); total 12.5MB; CREDITS.md written; ready for pipeline stage 4-b

---
Task ID: 4-b + 5
Agent: Z.ai Code (main)
Task: Rebuild CHRONOS as a reliwebgl-style WebGL time-dive (fix blur + lag) — engine, panels, editorial restyle; full browser verification

Work Log:
- Studied reference reliwebgl.com (agent-browser + VLM): architecture = single fixed three.js canvas + 460vh scroll track + sticky screen, DOM text on top, photoreal DOF scenes, editorial serif type — adopted all of it
- Proved current lag root cause: 25 fullscreen DOM layers with per-frame CSS blur/blend/preserve-3d (A/B test on port 3005 via git worktree: old p95 spikes 400-600ms)
- Installed three.js r186; built src/lib/cosmos/engine3d.ts (~700 lines): 19 era slabs (planes, PLANE 35.2x84.5) along a -Z corridor (spacing 60), camera path hold(±0.14 segment)→smootherstep transit→hold, FOV 55+9·warp, mouse-parallax rotation, recycled 1400-star field with radial streaks, 90 dust motes, 18 procedural fbm nebulae, per-slab shader (cover-crop, Ken Burns, warp 3-tap smear, polynomial S-curve grade, extinction red, window mask+rim glow making distant eras "gates in spacetime"), progressive texture window ±3/±5 dispose, soft-GPU detection (SwiftShader/lavapipe) → -m textures, reduced particles, 0.8 render scale, idle frame-skip
- Rewrote CosmicExperience.tsx: rAF loop drives engine + guarded DOM writes (setStyle/setText value cache — zero redundant mutations); TextLayer.tsx (fixed floating glass panels, engine-written transform/opacity, no counter-transform gymnastics); Overlays restyled (Fraunces serif #ece9e2, removed OutroBackdrop — engine renders final plate); layout.tsx Fraunces+Space_Mono; TimeHUD dark text-shadow halo; deleted DepthStage/StarfieldZoom/depth.ts + tex-*.webp
- Bugs found & fixed via browser: (1) GLSL precision mismatch uWarp mediump-vs-highp → program link fail, black canvas; (2) sign inversion on slab/nebula distance (d = slabZ-camZ) → all plates invisible; (3) panel alpha used 1-arg smoothstep with 3 args → alpha always 0, panels never visible (3-arg smoothRange helper); (4) stale visible panels after rail jumps (sweep all 19 with value cache)
- Verification: shader-link clean, 7-point visual sweep VLM-rated 9-10/10 (intro/Big Bang/transit/Sun/Dinosaurs/Asteroid/Earth outro); panel sweep — exactly one correct panel per era anchor (0,2,9,11,13,18 spot-checked, titles match); rail jump → single panel, no stale; mobile 390x844: 61fps, bottom-sheet panels readable; A/B: new engine ~3x lower p95 than old DOM-3D in identical software-GL conditions (real GPUs: scene = ~25 draw calls, trivial); lint clean; zero console errors

Stage Summary:
- Shipped CHRONOS v3: one WebGL canvas flies a camera THROUGH 19 photographic era plates — next era visible ahead as a glowing spacetime gate, light-speed warp between, floating readable panels; all 19 backgrounds are real high-res photography (2560x1440) from Task 4-a
- Files: engine3d.ts (new), CosmicExperience.tsx/TextLayer.tsx/Overlays.tsx (rewritten), layout.tsx (Fraunces), TimeHUD.tsx (shadow), globals.css (pruned); deleted depth.ts/DepthStage/StarfieldZoom
- Status: DONE — browser-verified end-to-end desktop+mobile, lint clean, worklog appended
