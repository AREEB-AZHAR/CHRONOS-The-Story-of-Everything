# CHRONOS — The Story of Everything

An interactive, cinematic 3D scroll-through-time web experience taking you on a journey through 13.8 billion years of cosmic history — from the **Big Bang** all the way to **Modern Civilization & The Pale Blue Dot**.

---

## 🌌 Overview & Accomplishments

CHRONOS is an immersive timeline experience built using **Next.js 16**, **React 19**, **Three.js**, and **Tailwind CSS v4**.

### Key Highlights & Features
- **Cinematic 3D Scroll Track**: Custom frame-rate independent `requestAnimationFrame` lerp-smoothed navigation through 19 cosmic epoch stops.
- **Logarithmic Time Progression**: Deep time smoothly compresses billions of eons while slowing down into recent millennia and human history.
- **Starfield & Warp Tunnel**: Dynamic starfield that responds to scroll velocity with relativistic warp speed effects.
- **Extinction Event Memorials**: Dedicated visual highlights marking the Earth's "Big Five" mass extinctions and current Anthropocene context.
- **3D Depth & Atmosphere Compositing**: Multilayered visual assets, nebulae, particles, and interactive HUD tracking elapsed time and cosmic velocity.

---

## 📸 Screenshots & Visuals

> [!NOTE]
> Screenshots will be added here once captured.

To capture screenshots:
1. Start the development server (`npx next dev`).
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Capture full-screen snapshots of:
   - **The Intro / Big Bang Arrival**
   - **Mid-Cosmos 3D Journey (e.g., Solar System / Earth formation)**
   - **The Final Epoch (Pale Blue Dot / Modern Humanity)**
4. Place screenshots into `public/screenshots/` and link them here.

---

## 🚀 Prerequisites & Local Setup

### 1. Requirements
- **Node.js**: `v20.x` or `v24.x` (Recommended: Node `v24.11.1` or higher)
- **Package Manager**: `npm` (v10+), `pnpm`, or `bun` (v1.2+)
- **Operating System**: Windows, macOS, or Linux

> [!IMPORTANT]
> **Do I need to install Next.js manually?**
> **No.** Next.js is already included as a project dependency in `package.json` and resides inside `node_modules`. You do not need to install Next.js globally. All you need is Node.js (or Bun) installed on your computer.

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
  *(Note: The default `npm run dev` script contains Unix pipe commands `2>&1 | tee dev.log` which can fail on native Windows shells. Running `npx next dev` directly avoids shell pipe issues).*

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
│   └── cosmos/              # 19 epoch high-resolution assets & textures
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   ├── layout.tsx       # Root HTML layout and viewport settings
│   │   ├── page.tsx         # Main entry page rendering CosmicExperience
│   │   └── globals.css      # Tailwind v4 styles and custom animation utilities
│   ├── components/
│   │   ├── cosmos/          # Cosmic experience components
│   │   │   ├── CosmicExperience.tsx  # Core orchestrator and render loop
│   │   │   ├── TimeHUD.tsx           # Floating HUD, time odometer, velocity meter
│   │   │   ├── TextLayer.tsx         # Narrative text panels per epoch
│   │   │   └── Overlays.tsx          # Vignette, grain, and transit overlays
│   │   └── ui/              # shadcn/ui primitives (dialog, button, slider, etc.)
│   ├── lib/
│   │   ├── cosmos/          # Timeline data, formatters, and math engines
│   │   │   ├── timeline.ts  # Epoch data (13.8B yrs to present)
│   │   │   ├── format.ts    # Logarithmic date formatters
│   │   │   └── engine3d.ts  # 3D canvas and perspective engine
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

