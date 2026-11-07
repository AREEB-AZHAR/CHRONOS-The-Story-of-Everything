# CHRONOS — The Story of Everything

An interactive, cinematic 3D scroll-through-time web experience taking you on a journey through 13.8 billion years of cosmic history — from the **Big Bang** all the way to **Modern Civilization & The Space Age**.

---

## 🌌 Overview & Accomplishments

CHRONOS is an immersive timeline experience built using **Next.js 16**, **React 19**, **Three.js (r186+)**, and **Tailwind CSS v4**.

### Key Highlights & Recent Updates
- **Continuous Event Arrival & Organic Emergence**: Replaced abrupt, discrete card pop-in with continuous Gaussian focus proximity. Approaching era cards smoothly bloom, swell in scale (`0.92x` to `1.20x`), awaken in luminance, and illuminate into crisp focus without sudden state jumps.
- **Atmospheric Depth-of-Field (DoF) & Blurred Timeline Glimpses**: Background timeline cards are rendered with custom GLSL multi-tap LOD depth blur and cosmic distance fog. Denser, distant epochs remain visible as soft, mysterious cosmic silhouettes without prematurely exposing their contents until they travel into primary focus.
- **Cinematic Cross-Blur Editorial Panel**: The bottom-left HUD event panel now transitions via Framer Motion blur-dissolves (`blur(10px) → blur(0px)`), featuring frosted blurred glimpses of preceding and upcoming timeline epochs (`‹ Previous | Active | Next ›`).
- **Section-by-Section Keyboard Navigation**: Pressing `↓` (Arrow Down / `S`) or `↑` (Arrow Up / `W`) smoothly steps section-by-section through the 30 timeline eras, landing squarely and accurately at each station dock. Also supports `PageDown`/`PageUp` multi-era jumps and `Home`/`End`.
- **Intelligent Approach Braking & Magnetic Detents**: When scrolling with mouse wheel or touchpad, dynamic resistance and velocity cushioning activate as a new event section approaches. Rapid gestures can no longer uncontrollably blow past eras. When scrolling pauses, magnetic capture gently guides the camera into the exact dock.
- **Cinematic Video Landing Page**: The intro screen (`Intro.tsx`) features a looping high-definition cosmic particle video background (`/cosmos/space-bg.mp4`), multilayered radial vignettes, celestial astrolabe motion, and instant keyboard launch via `Space`, `Enter`, or `↓`.
- **Bespoke Chronos Celestial Logo (`public/logo.svg`)**: Custom-crafted vector insignia featuring intertwined armillary orbits, a luminous singularity core, and 12 epoch celestial dials.
- **30 Cosmic Epochs**: Spanning the Big Bang, First Stars, Galaxy Formation, Solar Ignition, Earth & Moon, Origin of Life, the Great Oxidation, Cambrian Explosion, Dinosaur Era, Chicxulub Extinction, Mammals, Hominins, Ice Age, Civilizations, and the Space Age.
- **Cinematic 3D Corridor**: Custom frame-rate independent `requestAnimationFrame` lerp-smoothed navigation through 30 3D card stations with dynamic swirling, depth blur, and floating glass narrative panels.
- **Zero-Jank GPU Pre-Upload**: All epoch textures are pre-allocated and mipmapped on the GPU during the initial loading phase (`renderer.initTexture`), completely eliminating the 40ms frame drops when new cards cross the view frustum.
- **Modern Three.js Engine (`THREE.Timer`)**: Migrated to the modern Three.js r186+ `THREE.Timer` architecture for rock-solid delta timing across tab visibility changes and high-refresh-rate displays.

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
