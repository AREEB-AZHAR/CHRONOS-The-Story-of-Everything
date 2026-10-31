/* Generates all cinematic epoch images for CHRONOS into public/cosmos */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public", "cosmos");
fs.mkdirSync(OUT, { recursive: true });

const STYLE =
  "cinematic sci-documentary concept art, epic scale, volumetric light, film grain, ultra detailed, dramatic lighting, no text, no watermark";

type Job = { name: string; prompt: string };

const jobs: Job[] = [
  { name: "bigbang", prompt: `The Big Bang, blinding white-orange singularity erupting into pure energy, radiating shockwaves of light and incandescent plasma across a black void, ${STYLE}` },
  { name: "firstlight", prompt: `Primordial universe cooling after the Big Bang, glowing ember-orange fog of hot plasma filling all of space, scattered sparks of light, first hydrogen atoms condensing, deep amber tones fading into darkness, ${STYLE}` },
  { name: "firststars", prompt: `The very first stars igniting in the cosmic dark ages, tiny brilliant blue-white starbursts scattered across an immense black void, faint violet cosmic web filaments connecting them, lonely and vast, ${STYLE}` },
  { name: "galaxies", prompt: `A young galaxy assembling in the early universe, chaotic swirl of newborn blue-white stars and glowing pink nebula clouds, brilliant quasar core blasting jets of light, distant young galaxies around, ${STYLE}` },
  { name: "milkyway", prompt: `Majestic barred spiral galaxy seen from above, sweeping luminous arms of stars, glowing golden core, wisps of nebulae and star clusters, deep black space, our Milky Way, ${STYLE}` },
  { name: "sunborn", prompt: `Protoplanetary disk around a newborn sun, swirling concentric rings of glowing dust and gas, small planets accreting from debris, warm amber and ember tones, ${STYLE}` },
  { name: "earthborn", prompt: `Molten young Earth struck by the protoplanet Theia, cataclysmic planetary collision, glowing rivers of lava across the surface, ring of fiery debris forming around the planet, dark space, ${STYLE}` },
  { name: "firstocean", prompt: `Early Earth with vast dark primordial oceans under a hazy orange methane sky, volcanic islands erupting, lightning storms over the water, steam rising, ${STYLE}` },
  { name: "firstlife", prompt: `Ancient shallow primordial sea with layered green-cyan bacterial mats and dome stromatolites, golden sunbeams piercing crystal clear water, oxygen bubbles rising, ${STYLE}` },
  { name: "oxygen", prompt: `Great Oxidation Event, rust red-tinted ocean waves meeting a pale toxic green sky, banded iron shoreline cliffs, dramatic storm clouds, world transforming, ${STYLE}` },
  { name: "cambrian", prompt: `Cambrian explosion undersea scene teeming with strange ancient creatures, trilobites crawling on the seabed, Anomalocaris swimming, jellyfish drifting, sunbeams through shallow water, riot of bizarre life, ${STYLE}` },
  { name: "landfall", prompt: `Devonian period landscape, first giant ferns and early trees, a lobe-finned fish like Tiktaalik crawling onto a muddy shore, misty swamp, dramatic golden light, ${STYLE}` },
  { name: "greatdying", prompt: `The Great Dying Permian extinction, scorched barren volcanic landscape, blood-red sky filled with ash, Siberian traps lava floods erupting, dead trees, devastation and ash fall, ominous, ${STYLE}` },
  { name: "dinosaurs", prompt: `Jurassic giants, massive long-necked sauropod dinosaur herd walking through a misty valley by a river, lush prehistoric vegetation, dramatic god rays, ${STYLE}` },
  { name: "asteroid", prompt: `A colossal asteroid blazing through the atmosphere toward Earth, glowing fiery impact trail splitting the sky, silhouettes of dinosaurs watching the apocalyptic descent, ${STYLE}` },
  { name: "mammals", prompt: `The age of mammals, woolly mammoths crossing a snowy tundra at dawn, a saber-toothed cat watching from a rock, small early primates in lush forest edge, ice age atmosphere, ${STYLE}` },
  { name: "humans", prompt: `Early humans gathered around a campfire on the African savanna at dusk, tribal hunters with spears, brilliant starry night sky above, warm firelight glow, ${STYLE}` },
  { name: "civilization", prompt: `Panorama of human civilization evolving, ancient stone pyramids and villages on the left transitioning to a glowing modern city skyline at night on the right, time transition concept, ${STYLE}` },
  { name: "paleblue", prompt: `Earth seen as a tiny pale blue dot from deep interstellar space, small fragile world suspended in an immense black void with faint stars, cosmic loneliness, ${STYLE}` },
];

const CONCURRENCY = 1;
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
      const res = await zai.images.generations.create({ prompt: job.prompt, size: "1440x720" });
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
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log("ALL DONE");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
