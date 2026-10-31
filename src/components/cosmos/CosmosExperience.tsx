"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CosmicScene, type SceneFrameState } from "./CosmicScene";
import Hud, { formatYear } from "./Hud";
import InfoPanel from "./InfoPanel";
import Intro from "./Intro";
import ErasDrawer, { AboutModal } from "./ErasDrawer";
import { TIMELINE } from "@/data/timeline";

export default function CosmosExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CosmicScene | null>(null);

  // per-frame DOM refs (no react re-render while scrolling)
  const yearBigRef = useRef<HTMLSpanElement>(null);
  const yearUnitRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [eraIdx, setEraIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [erasOpen, setErasOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new CosmicScene(canvasRef.current, TIMELINE, {
      onProgress: (p) => setProgress(p),
      onReady: () => setReady(true),
      onFrame: (s: SceneFrameState) => {
        const f = formatYear(s.year);
        if (yearBigRef.current) yearBigRef.current.textContent = f.big;
        if (yearUnitRef.current) yearUnitRef.current.textContent = f.unit;
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${(s.loopProgress * 100).toFixed(2)}%`;
        }
      },
      onEraChange: (idx) => setEraIdx(idx),
      onSelect: (idx) => setSelectedIdx(idx),
    });
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const handleBegin = useCallback(() => {
    sceneRef.current?.begin();
    setIntroVisible(false);
  }, []);

  const handleJump = useCallback((idx: number) => {
    sceneRef.current?.jumpTo(idx);
  }, []);

  const handleClosePanel = useCallback(() => {
    sceneRef.current?.closeSelection();
  }, []);

  const era = TIMELINE[eraIdx] ?? TIMELINE[0];
  const selected = selectedIdx !== null ? TIMELINE[selectedIdx] : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020107]">
      {/* 3D spacetime */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Interactive 3D timeline of the universe. Scroll to travel, click cards for details."
      />

      {/* HUD */}
      {!introVisible && (
        <Hud
          era={era}
          yearBigRef={yearBigRef}
          yearUnitRef={yearUnitRef}
          progressBarRef={progressBarRef}
          selectionActive={selectedIdx !== null}
          onOpenEras={() => setErasOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
          onBackToStart={() => handleJump(0)}
        />
      )}

      {/* glass info window */}
      <InfoPanel event={selected} onClose={handleClosePanel} />

      {/* eras drawer + about */}
      <ErasDrawer
        open={erasOpen}
        currentIdx={eraIdx}
        onJump={handleJump}
        onClose={() => setErasOpen(false)}
      />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* intro overlay */}
      <Intro visible={introVisible} progress={progress} ready={ready} onBegin={handleBegin} />
    </div>
  );
}
