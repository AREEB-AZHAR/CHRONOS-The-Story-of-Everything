/* Generates atmosphere overlay textures for CHRONOS 3D into public/cosmos */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public", "cosmos");
fs.mkdirSync(OUT, { recursive: true });

const STYLE =
  "atmospheric overlay texture, mostly pure black background, subtle and moody, cinematic, ultra detailed, no text, no watermark";

type Job = { name: string; prompt: string };

const jobs: Job[] = [
  { name: "tex-nebula", prompt: `Vast wisps of dark interstellar nebula dust, faint teal and warm amber glows buried deep in black space, ethereal cosmic fog, ${STYLE}` },
  { name: "tex-embers", prompt: `Countless tiny glowing embers and sparks floating upward through pure black darkness, orange gold fire particles with soft bokeh defocus, sparse, ${STYLE}` },
  { name: "tex-caustics", prompt: `Underwater sunlight caustics rippling across dark deep water, soft turquoise light webs on a near-black sea, ${STYLE}` },
  { name: "tex-mist", prompt: `Drifting tendrils of pale ground fog and smoke over a pure black void, soft grey-white mist, low contrast, ${STYLE}` },
  { name: "tex-clouds", prompt: `Dark dramatic storm clouds lit from within by faint warm amber light against a deep black night sky, moody, ${STYLE}` },
  { name: "tex-lightglow", prompt: `Warm golden bokeh orbs and soft lantern glows floating in pure black darkness, defocused night city lights, sparse, ${STYLE}` },
];

let idx = 0;
let done = 0;

async function runOne(zai: Awaited<ReturnType<typeof ZAI.create>>, job: Job) {
  const outPath = path.join(OUT, `${job.name}.png`);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
    console.log(`skip ${job.name}`);
    return;
  }
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const res = await zai.images.generations.create({ prompt: job.prompt, size: "1440x704" });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("empty response");
      fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
      done++;
      console.log(`[${done}/${jobs.length}] OK ${job.name}`);
      return;
    } catch (e) {
      const msg = (e as Error).message;
      console.log(`attempt ${attempt} failed for ${job.name}: ${msg.slice(0, 120)}`);
      const is429 = msg.includes("429");
      await new Promise((r) => setTimeout(r, is429 ? 30000 * Math.min(attempt, 3) : 3000 * attempt));
    }
  }
  console.log(`FAILED ${job.name}`);
}

async function main() {
  const zai = await ZAI.create();
  async function worker() {
    while (idx < jobs.length) {
      const job = jobs[idx++];
      await runOne(zai, job);
    }
  }
  await Promise.all(Array.from({ length: 1 }, worker));
  console.log("ALL DONE");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
