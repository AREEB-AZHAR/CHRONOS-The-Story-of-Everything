// Finalize winners: copy to /tmp/hires/{id}-src* + build attribution manifest
import fs from "fs";

// winner file + source + dims (from manifest-valid.json / fallback judging)
const valid = JSON.parse(fs.readFileSync("/tmp/hires/manifest-valid.json", "utf8"));
const pick = (id: string, idx: number) => valid[id].find((c: any) => c.idx === idx);

const WINNERS: Record<string, { file: string; source: string; width: number; height: number; note?: string }> = {
  bigbang: { ...pick("bigbang", 0) },
  firstlight: { ...pick("firstlight", 1) },
  firststars: { ...pick("firststars", 0) }, // VLM runner-up, chosen per >=2000px hard rule (ESA/Webb 3840x2160; VLM winner idx1 was 1889px, both passed all criteria)
  galaxies: { ...pick("galaxies", 1) },
  milkyway: { ...pick("milkyway", 0) },
  sunborn: { ...pick("sunborn", 1) },
  earthborn: { ...pick("earthborn", 1) },
  firstocean: { ...pick("firstocean", 1) },
  oxygen: { ...pick("oxygen", 1) },
  cambrian: { ...pick("cambrian", 1) },
  landfall: { ...pick("landfall", 1) },
  greatdying: { ...pick("greatdying", 0) },
  dinosaurs: { ...pick("dinosaurs", 0) },
  asteroid: { ...pick("asteroid", 2) },
  mammals: { ...pick("mammals", 2) },
  humans: { ...pick("humans", 1) },
  journeys: { ...pick("journeys", 0) },
  civilization: { ...pick("civilization", 0) },
  paleblue: { file: "/tmp/hires/paleblue-f1.jpg", source: "hdqwalls", width: 4845, height: 2725, note: "fallback query winner (ISS/Earth-from-space)" },
};

const manifest: any = {};
for (const id of Object.keys(WINNERS)) {
  const w = WINNERS[id];
  const ext = w.file.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase() ?? "jpg";
  const dst = `/tmp/hires/${id}-src.${ext}`;
  fs.copyFileSync(w.file, dst);
  manifest[id] = { src: dst, source: w.source, width: w.width, height: w.height, origin: w.file, note: w.note ?? "", real: w.file.startsWith("/tmp/hires/") && !w.file.includes("manifest") ? "real photo (web search)" : "real photo (web search)" };
  console.log(`${id}: ${dst} <- ${w.file} (${w.width}x${w.height}, ${w.source})`);
}
fs.writeFileSync("/tmp/hires/winners.json", JSON.stringify(manifest, null, 2));
console.log("\nWinners finalized: " + Object.keys(manifest).length);
