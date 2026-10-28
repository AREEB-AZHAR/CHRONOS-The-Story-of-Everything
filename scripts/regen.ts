/* Regenerates bad epoch images: AI generation first, image-search fallback */
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const OUT = path.join(process.cwd(), "public", "cosmos");
const IS_DIR = "/tmp/is2";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IS_DIR, { recursive: true });

const STYLE =
  "cinematic sci-documentary concept art, epic scale, volumetric light, film grain, ultra detailed, dramatic lighting, no text, no watermark";

type Job = { name: string; genPrompt: string; searchQuery: string };

const jobs: Job[] = [
  {
    name: "bigbang",
    genPrompt: `The Big Bang, blinding white-orange singularity erupting into pure energy, radiating shockwaves of light and incandescent plasma across a black void, ${STYLE}`,
    searchQuery: "abstract bright explosion of orange light and energy bursting in dark space",
  },
  {
    name: "firstlight",
    genPrompt: `Primordial universe cooling after the Big Bang, glowing ember-orange fog of hot plasma filling all of space, scattered sparks of light, deep amber tones fading into darkness, ${STYLE}`,
    searchQuery: "glowing orange and red nebula fog of hot glowing gas filling deep space",
  },
  {
    name: "galaxies",
    genPrompt: `A young spiral galaxy forming in the early universe, chaotic swirl of newborn blue-white stars and glowing pink nebula clouds, distant young galaxies around, ${STYLE}`,
    searchQuery: "Hubble deep field photograph thousands of distant galaxies in dark sky",
  },
  {
    name: "firstocean",
    genPrompt: `Early Earth with vast dark primordial oceans under a hazy orange methane sky, volcanic islands erupting, lightning storms over the water, steam rising, ${STYLE}`,
    searchQuery: "dramatic volcanic islands rising from dark ocean under stormy orange sky painting",
  },
  {
    name: "firstlife",
    genPrompt: `Ancient shallow primordial sea with layered green-cyan bacterial mats and dome stromatolites, golden sunbeams piercing crystal clear water, oxygen bubbles rising, ${STYLE}`,
    searchQuery: "stromatolites in shallow clear turquoise water Shark Bay Australia",
  },
  {
    name: "landfall",
    genPrompt: `Devonian period landscape, first giant ferns and early trees, a lobe-finned fish like Tiktaalik crawling onto a muddy shore, misty swamp, dramatic golden light, ${STYLE}`,
    searchQuery: "prehistoric Devonian period swamp forest with giant ferns and early tetrapod creature illustration",
  },
  {
    name: "greatdying",
    genPrompt: `The Great Dying Permian extinction, scorched barren volcanic landscape, blood-red sky filled with ash, lava floods erupting, dead trees, devastation, ominous, no people, ${STYLE}`,
    searchQuery: "erupting volcano with glowing lava field under red apocalyptic sky landscape",
  },
  {
    name: "dinosaurs",
    genPrompt: `Jurassic giants, massive long-necked sauropod dinosaur herd walking through a misty valley by a river, lush prehistoric vegetation, dramatic god rays, ${STYLE}`,
    searchQuery: "sauropod dinosaur herd crossing river in prehistoric jungle digital painting",
  },
  {
    name: "mammals",
    genPrompt: `The age of mammals, woolly mammoths crossing a snowy tundra at dawn, saber-toothed cat watching from a rock, ice age atmosphere, ${STYLE}`,
    searchQuery: "woolly mammoth herd walking through snowy ice age landscape painting",
  },
  {
    name: "civilization",
    genPrompt: `Panorama of human civilization evolving, ancient stone pyramids on the left transitioning to a glowing modern city skyline at night on the right, time transition concept, ${STYLE}`,
    searchQuery: "modern city skyline glowing at night with illuminated skyscrapers panorama",
  },
  {
    name: "paleblue",
    genPrompt: `Earth seen as a tiny pale blue dot from deep interstellar space, small fragile world suspended in an immense black void with faint stars, cosmic loneliness, absolutely no text no letters no words no typography, ${STYLE}`,
    searchQuery: "full Earth disk seen from space blue marble on black background",
  },
];

async function toWebp(buf: Buffer, dst: string) {
  await sharp(buf)
    .resize(1440, 720, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toFile(dst);
}

async function tryGen(zai: Awaited<ReturnType<typeof ZAI.create>>, job: Job, dst: string) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await zai.images.generations.create({
        prompt: job.genPrompt,
        size: "1440x704",
      });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("empty response");
      const buf = Buffer.from(b64, "base64");
      // keep full quality generated image (already 1440x720)
      fs.writeFileSync(dst, buf);
      await sharp(dst).webp({ quality: 85 }).toFile(dst + ".tmp");
      fs.renameSync(dst + ".tmp", dst);
      console.log(`GEN OK ${job.name}`);
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      console.log(`gen attempt ${attempt} failed for ${job.name}: ${msg.slice(0, 90)}`);
      await new Promise((r) => setTimeout(r, msg.includes("429") ? 25000 * Math.min(attempt, 3) : 2000));
    }
  }
  return false;
}

async function trySearch(job: Job, dst: string) {
  const jsonPath = path.join(IS_DIR, `${job.name}.json`);
  try {
    execSync(
      `z-ai image-search -q "${job.searchQuery.replace(/"/g, "")}" --count 6 --no-rank --gl us -o "${jsonPath}"`,
      { stdio: "ignore", timeout: 150000 }
    );
  } catch {
    console.log(`search failed ${job.name}`);
    return false;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const hits: Array<{ original_url?: string; original_width?: string; original_height?: string }> =
      parsed?.results ?? [];
    const scored = hits
      .filter((h) => h.original_url)
      .map((h) => {
        const w = parseInt(h.original_width || "0", 10) || 0;
        const hgt = parseInt(h.original_height || "0", 10) || 0;
        const ratio = hgt > 0 ? w / hgt : 0;
        const score = Math.min(w, 2400) + ratio * 400 - (ratio < 1.1 ? 2500 : 0);
        return { url: h.original_url!, score };
      })
      .sort((a, b) => b.score - a.score);
    for (const cand of scored.slice(0, 4)) {
      try {
        const res = await fetch(cand.url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 8000) throw new Error("too small");
        await toWebp(buf, dst);
        console.log(`SEARCH OK ${job.name}`);
        return true;
      } catch {
        continue;
      }
    }
  } catch (e) {
    console.log(`search parse failed ${job.name}: ${(e as Error).message}`);
  }
  return false;
}

async function main() {
  const zai = await ZAI.create();
  for (const job of jobs) {
    const dst = path.join(OUT, `${job.name}.webp`);
    if (fs.existsSync(dst) && fs.statSync(dst).size > 10000) {
      console.log(`skip ${job.name}`);
      continue;
    }
    const ok = await tryGen(zai, job, dst);
    if (!ok) {
      console.log(`falling back to search for ${job.name}`);
      await trySearch(job, dst);
    }
  }
  console.log("REGEN ALL DONE");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
