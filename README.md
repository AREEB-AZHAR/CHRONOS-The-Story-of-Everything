# CHRONOS — The Story of Everything

An interactive, cinematic 3D scroll-through-time web experience taking you on a journey through 13.8 billion years of cosmic history — from the **Big Bang** all the way to **Modern Civilization & The Space Age**.

---

## 🌌 Overview & Accomplishments

CHRONOS is an immersive timeline experience built using **Next.js 16**, **React 19**, **Three.js (r186+)**, and **Tailwind CSS v4**.

### Key Highlights & Recent Updates
- **Security & Git History Sanitization**:
  - Executed full repository security audit and history purification with `git-filter-repo`.
  - Purged all uncommitted/early environment configuration leaks (`.env`) from repository history.
  - Hardened `.gitignore` to guarantee local environment secrets and runtime files remain protected against accidental commits.
- **Direct Background Card Click Warp**: Clicking any distant background 3D card visible along the corridor sightline instantly engages hyperspace Space Warp directly to that timeline era! Clicking the docked foreground card opens its in-depth exploration sheet.
- **Mobile UI Experience & Readability Overhaul**:
  - **Zero Text Collisions**: The HUD bottom-left editorial block (`"01 / 30"`, `"The Big Bang"`, `"COSMIC ORIGIN · 13.8 BILLION YEARS AGO"`) and mobile navigation buttons cleanly fade out (`opacity-0 pointer-events-none`) when an era sheet opens, eliminating all visual overlap and text bleeding.
  - **Opaque Obsidian Glass Mobile Sheet**: Upgraded `InfoPanel` on mobile viewports with a rich, high-contrast dark space glass backdrop (`!bg-[#07040d]/96 backdrop-blur-2xl border-t border-white/20 shadow-[0_-24px_60px_rgba(0,0,0,0.95)]`), guaranteeing 100% legibility of all historical descriptions, key facts, and life summaries.
  - **Mobile Pull-Down Handle**: Added a top grab-handle indicator pill for intuitive touch dismissal.
  - **Refined Portrait 3D Card Framing**: In portrait viewports, the selected card is positioned at `target.y = 1.35` with scale `1.55`, perfectly framed in the upper mobile screen without clipping under the top navigation header.
- **Space Warp Default Scroll Experience**: The cinematic **Space Warp** is now the default navigation behavior across all inputs — mouse wheel, trackpad scrolling, touch swiping, and keyboard keys. Every deliberate scroll gesture launches you into hyperspace warp to the next or previous epoch with intelligent trackpad inertia bleeding.
- **Travel Time Scaled to Cosmic Time Distance**: The duration of your hyperspace warp flight directly reflects the real temporal chasm between epochs ($\Delta\text{years}$):
  - *Small historical jumps* (e.g. thousands of years in civilization): snappy $\approx 0.75\text{s}$ warp flash.
  - *Medium evolutionary steps* (e.g. tens to hundreds of millions of years): $\approx 1.1\text{s} - 1.4\text{s}$ warp flight.
  - *Colossal cosmic chasms* (e.g. **8.4 Billion years** between *Galaxies Assemble* and *The Sun Ignites*): epic $\approx 2.05\text{s}$ hyperspace plunge across the cosmic abyss.
- **Hyperspace Space Warp Visual FX**:
  - **Dynamic Relativistic FOV Expansion**: Camera FOV swells dynamically from $68^\circ$ up to $95^\circ$ during hyperspace cruise and snaps back cleanly on arrival.
  - **Relativistic Star Streaks**: In `STAR_VERT` and `STAR_FRAG`, particle points bloom and stretch vertically along the travel vector with an intense cyan-white hyper-luminescent sheen.
  - **Relativistic Cockpit Vibration**: Subtle micro-tremors (50–80Hz) proportional to the warp factor simulate high-velocity spacetime transit.
  - **Quintic S-Curve Motion Profile**: Punchy acceleration into hyperspace $\to$ hyper-velocity cruise $\to$ cushioned, pristine drop-out squarely at the destination era dock.
- **Single-Click & Touch Navigation**: Single tap on arrow keys or touch swipe immediately transports you without having to hold any keys.
- **Physical 3D Spacetime Corridor Flight**: Fixed the tunnel wrapping mathematics (`getCardZ()`). Upcoming event cards ($k+1, k+2, k+3\dots$) are positioned directly down the corridor sightline along the negative $Z$-axis ($-38, -64, -90$), physically gliding forward from deep cosmic space.
- **Mysterious Background Card Blur (No Spoilers)**: Upcoming 3D cards render with multi-tap GLSL bokeh blur (`uBlur = 4.2`) and atmospheric cosmic fog, keeping their details blurred until they fly into primary focus.
- **Sleek, Minimalist Cinematic HUD**: Free of intrusive preview boxes, presenting an uncluttered widescreen viewport into deep space.
- **Continuous Event Arrival & Organic Emergence**: Replaced abrupt card pop-in with continuous Gaussian focus proximity. Approaching era cards smoothly bloom, swell in scale (`0.90x` to `1.20x`), awaken in luminance, and illuminate into crisp focus without sudden state jumps.
- **Cinematic Video Landing Page**: The intro screen (`Intro.tsx`) features a looping high-definition cosmic particle video background (`/cosmos/space-bg.mp4`), multilayered radial vignettes, celestial astrolabe motion, and instant keyboard launch via `Space`, `Enter`, or `↓`.
- **Bespoke Chronos Celestial Logo (`public/logo.svg`)**: Custom-crafted vector insignia featuring intertwined armillary orbits, a luminous singularity core, and 12 epoch celestial dials.
- **30 Cosmic Epochs**: Spanning the Big Bang, First Stars, Galaxy Formation, Solar Ignition, Earth & Moon, Origin of Life, the Great Oxidation, Cambrian Explosion, Dinosaur Era, Chicxulub Extinction, Mammals, Hominins, Ice Age, Civilizations, and the Space Age.
- **Zero-Jank GPU Pre-Upload**: All epoch textures are pre-allocated and mipmapped on the GPU during the initial loading phase (`renderer.initTexture`), completely eliminating frame drops when new cards cross the view frustum.
- **Modern Three.js Engine (`THREE.Timer`)**: Powered by Three.js r186+ `THREE.Timer` architecture for rock-solid delta timing across tab visibility changes and high-refresh-rate displays.

---

## 📸 Screenshots & Visuals

> [!NOTE]
> Screenshots can be added to `public/screenshots/`.

To capture screenshots:
1. Start the development server (`npx next dev -p 3000`).
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Capture full-screen snapshots of:
   - **The Intro / Big Bang Arrival**
   - **Mid-Cosmos 3D Journey (e.g., Solar System / Earth formation)**
   - **The Final Epoch (Space Age / Modern Humanity)**
4. Place screenshots into `public/screenshots/` and link them here.

---

## 🚀 Prerequisites & Local Setup

### 1. Requirements
- **Node.js**: `v20.x` or `v24.x` (Recommended: Node `v24.11.1` or higher)
- **Package Manager**: `npm` (v10+), `pnpm`, or `bun` (v1.2+)
- **Operating System**: Windows, macOS, or Linux

> [!IMPORTANT]
> **Do I need to install Next.js globally?**
> **No.** Next.js is already included as a project dependency in `package.json` and resides inside `node_modules`. All you need is Node.js (or Bun) installed on your computer.

---

### 2. Installation & Quick Start

#### Step 1: Clone or Open the Repository
```bash
git clone https://github.com/AREEB-AZHAR/CHRONOS-The-Story-of-Everything.git
cd CHRONOS-The-Story-of-Everything
```

#### Step 2: Install Dependencies
If `node_modules` is not already installed:
```bash
npm install
# or
bun install
```

#### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

#### Step 4: Generate Database Client (Prisma)
```bash
npx prisma generate
```

#### Step 5: Start the Development Server

- **On Windows (PowerShell / Command Prompt)**:
  ```powershell
  npx next dev -p 3000
  ```
  *(Note: Running `npx next dev` directly avoids shell pipe issues with Unix `tee` commands).*

- **On macOS / Linux / WSL / Bun**:
  ```bash
  bun run dev
  # or
  npm run dev
  ```

#### Step 6: Open in Browser
Visit [http://localhost:3000](http://localhost:3000) to view the timeline.

---

## 🏗️ Architecture & Project Structure

```text
├── public/
│   └── cosmos/              # 30 epoch high-resolution visual plates & assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   ├── layout.tsx       # Root HTML layout and viewport settings
│   │   ├── page.tsx         # Main entry page rendering CosmosExperience
│   │   └── globals.css      # Tailwind v4 styles and custom animation utilities
│   ├── components/
│   │   ├── cosmos/          # Cosmic experience components
│   │   │   ├── CosmicScene.ts       # Three.js 3D engine, timer, and render loop
│   │   │   ├── CosmosExperience.tsx # React container and HUD glue
│   │   │   ├── Hud.tsx              # Floating HUD, time odometer, era name
│   │   │   ├── InfoPanel.tsx        # Glass overlay modal for selected epoch
│   │   │   ├── ErasDrawer.tsx       # 30-epoch navigation drawer
│   │   │   └── Intro.tsx            # Cinematic intro overlay
│   │   └── ui/              # shadcn/ui primitives (dialog, button, slider, etc.)
│   ├── data/
│   │   └── timeline.ts      # 30 cosmic epochs (13.8B years ago to present)
│   ├── lib/
│   │   ├── cosmos/          # Timeline math and formatters
│   │   └── utils.ts         # Utility functions
├── prisma/
│   └── schema.prisma        # SQLite schema definition
├── package.json             # Scripts and dependencies
└── next.config.ts           # Next.js configuration
```

---

## 🛠️ Build & Production Deployment

To build a standalone production bundle:
```bash
npx next build
```
To run the production build:
```bash
npm run start
# or
node .next/standalone/server.js
```
