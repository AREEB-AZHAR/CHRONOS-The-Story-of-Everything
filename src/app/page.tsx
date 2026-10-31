"use client";

import dynamic from "next/dynamic";

const CosmosExperience = dynamic(() => import("@/components/cosmos/CosmosExperience"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-[#020107]">
      <p className="font-mono text-[10px] tracking-[0.4em] text-white/40">
        CHRONOS · LOADING
      </p>
    </div>
  ),
});

export default function Home() {
  return <CosmosExperience />;
}
