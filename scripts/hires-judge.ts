// VLM-judge candidates per era. Usage: bun run scripts/hires-judge.ts era1 era2 ...
import fs from "fs";
import { execFileSync } from "child_process";

const manifest = JSON.parse(fs.readFileSync("/tmp/hires/manifest-valid.json", "utf8"));

const ERAS: Record<string, { name: string; subject: string }> = {
  bigbang: { name: "the birth of the universe (Big Bang fireball)", subject: "a vast glowing cosmic nebula / fiery stellar nursery of golden-orange gas and dust clouds (Carina Nebula style)" },
  firstlight: { name: "the first light after the Big Bang (recombination)", subject: "the cosmic microwave background all-sky map with mottled golden-blue temperature ripples, OR a glowing primordial glow sky" },
  firststars: { name: "the first stars igniting", subject: "newborn stars igniting amid glowing gas filaments in a nebula (Orion Nebula protostars, Pillars of Creation)" },
  galaxies: { name: "the first galaxies assembling", subject: "colliding / interacting galaxies with tidal streams of stars and glowing gas" },
  milkyway: { name: "our Milky Way galaxy", subject: "the Milky Way galactic core / dense star field arching over a dark night landscape" },
  sunborn: { name: "the birth of the Sun", subject: "the Sun's glowing plasma surface or a dramatic solar flare in extreme ultraviolet" },
  earthborn: { name: "the infant Earth and the Moon-forming impact", subject: "planet Earth photographed together with the Moon from deep space" },
  firstocean: { name: "Earth's first oceans and first life", subject: "a deep-sea hydrothermal vent black smoker chimney venting dark mineral smoke on the seafloor" },
  oxygen: { name: "the Great Oxidation / Snowball Earth", subject: "a blue glacier ice cave / frozen icy landscape" },
  cambrian: { name: "the Cambrian explosion seas", subject: "trilobite or other Cambrian fossils shown in fine detail" },
  landfall: { name: "the Devonian — life storms the land", subject: "an ancient mossy forest of ferns and primeval woodland with fog and a stream" },
  greatdying: { name: "the End-Permian Great Dying extinction", subject: "volcanic fissure eruption, fresh lava fields, basaltic volcanic landscape" },
  dinosaurs: { name: "the age of dinosaurs", subject: "a dramatic dinosaur skeleton (T. rex) in a dark museum display" },
  asteroid: { name: "the K-Pg asteroid impact", subject: "a close-up asteroid surface in space (e.g. asteroid Bennu) OR a meteor fireball" },
  mammals: { name: "the age of mammals", subject: "elephants / large mammals in a misty golden-hour savanna" },
  humans: { name: "the dawn of humanity", subject: "acacia tree silhouette on African savanna at sunset" },
  journeys: { name: "Out of Africa — prehistoric cave art", subject: "Lascaux-style prehistoric cave paintings of animals in ochre on rock walls" },
  civilization: { name: "the rise of civilization to the digital age", subject: "Earth's city lights at night seen from space / orbit" },
  paleblue: { name: "today — Earth the pale blue dot", subject: "full-disk Earth from space (Blue Marble)" },
};

const eras = process.argv.slice(2);
if (!eras.length) { console.error("no eras given"); process.exit(1); }

// extract all strings from unknown JSON structure
function allStrings(o: any, acc: string[] = []): string[] {
  if (typeof o === "string") acc.push(o);
  else if (Array.isArray(o)) for (const x of o) allStrings(x, acc);
  else if (o && typeof o === "object") for (const k of Object.keys(o)) allStrings(o[k], acc);
  return acc;
}

for (const id of eras) {
  const cands = (manifest[id] || []).slice(0, 3);
  if (!cands.length) { console.log(`${id}: NO CANDIDATES`); continue; }
  const e = ERAS[id];
  const prompt = `These are ${cands.length} candidate background images (in order: ${cands.map((c: any, i: number) => `${i + 1} = ${c.file}`).join(", ")}) for a cinematic dark-theme website section about ${e.name}. For EACH image (call them 1..${cands.length} in the order given), give a JSON verdict with: sharpness (1-10, is it genuinely high-resolution and detailed when zoomed?), watermark (true if ANY visible watermark, logo, text overlay, timestamp, border or UI text), subject (does it depict: ${e.subject}?), mood (1-10 as a dark cinematic full-bleed website background). Output one JSON verdict per image on its own line, then a final line: WINNER: <number or NONE> - pick a winner ONLY if sharpness>=6 AND no watermark AND mood>=6 AND subject is correct.`;
  const args = ["-p", prompt];
  for (const c of cands) args.push("-i", c.file);
  const outFile = `/tmp/judges/judge-${id}.json`;
  args.push("-o", outFile);
  try {
    execFileSync("z-ai", ["vision", ...args], { timeout: 240000, stdio: ["ignore", "pipe", "pipe"] });
    const raw = fs.readFileSync(outFile, "utf8");
    let texts: string[] = [];
    try { texts = allStrings(JSON.parse(raw)); } catch { texts = [raw]; }
    const joined = texts.join("\n");
    const m = joined.match(/WINNER:\s*\**\s*([0-9]+|NONE)/i);
    const winner = m ? (m[1].toUpperCase() === "NONE" ? null : parseInt(m[1])) : null;
    fs.writeFileSync(`/tmp/judges/verdict-${id}.json`, JSON.stringify({ id, winner, files: cands.map((c: any) => c.file), raw: joined }, null, 2));
    console.log(`${id}: WINNER=${winner === null ? "NONE" : cands[winner - 1]?.file}`);
  } catch (err: any) {
    console.log(`${id}: VISION FAILED ${err.message}`);
  }
}
