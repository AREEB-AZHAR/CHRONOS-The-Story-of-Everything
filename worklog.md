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
