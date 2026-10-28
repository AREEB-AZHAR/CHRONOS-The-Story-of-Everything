/* Downloads best search hit per epoch and converts to 1440x720 webp */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const IS_DIR = "/tmp/is";
const OUT = path.join(process.cwd(), "public", "cosmos");
fs.mkdirSync(OUT, { recursive: true });

type Hit = {
  original_url?: string;
  original_width?: string;
  original_height?: string;
};

async function processOne(name: string) {
  const dst = path.join(OUT, `${name}.webp`);
  if (fs.existsSync(dst) && fs.statSync(dst).size > 10000) {
    console.log(`skip ${name}`);
    return;
  }
  const jsonPath = path.join(IS_DIR, `${name}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.log(`NOJSON ${name}`);
    return;
  }
  let hits: Hit[] = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    hits = parsed?.results ?? [];
  } catch {
    console.log(`BADJSON ${name}`);
    return;
  }
  const scored = hits
    .filter((h) => h.original_url)
    .map((h) => {
      const w = parseInt(h.original_width || "0", 10) || 0;
      const hgt = parseInt(h.original_height || "0", 10) || 0;
      // prefer wide, high-res landscape images
      const ratio = hgt > 0 ? w / hgt : 0;
      const score = Math.min(w, 2400) + ratio * 400 - (ratio < 1.1 ? 2500 : 0);
      return { url: h.original_url!, w, score };
    })
    .sort((a, b) => b.score - a.score);

  for (const cand of scored.slice(0, 4)) {
    try {
      const res = await fetch(cand.url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 8000) throw new Error("too small");
      await sharp(buf)
        .resize(1440, 720, { fit: "cover", position: "attention" })
        .webp({ quality: 82 })
        .toFile(dst);
      console.log(`OK ${name} (${Math.round(buf.length / 1024)}KB, w=${cand.w})`);
      return;
    } catch (e) {
      console.log(`  retry ${name}: ${(e as Error).message}`);
    }
  }
  console.log(`FAILED ${name}`);
}

async function main() {
  const names = fs
    .readFileSync(path.join(process.cwd(), "scripts", "search-queries.txt"), "utf8")
    .split("\n")
    .map((l) => l.split("|")[0].trim())
    .filter(Boolean);
  for (const n of names) {
    await processOne(n);
  }
  console.log("DOWNLOAD ALL DONE");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
