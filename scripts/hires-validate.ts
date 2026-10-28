// Validate candidates with sharp: loadable, real dims, real width >= 1600
import fs from "fs";
import sharp from "sharp";

const manifest = JSON.parse(fs.readFileSync("/tmp/hires/manifest-download.json", "utf8"));
const valid: any = {};
const rejected: string[] = [];

for (const id of Object.keys(manifest)) {
  valid[id] = [];
  for (const c of manifest[id]) {
    try {
      const meta = await sharp(c.file).metadata();
      if ((meta.width ?? 0) >= 1600 && (meta.width ?? 0) >= (meta.height ?? 0)) {
        valid[id].push({ ...c, realWidth: meta.width, realHeight: meta.height, format: meta.format });
      } else {
        rejected.push(`${id} ${c.file}: ${meta.width}x${meta.height} (below rules)`);
      }
    } catch (e: any) {
      rejected.push(`${id} ${c.file}: CORRUPT ${e.message}`);
    }
  }
  valid[id] = valid[id].sort((a, b) => b.realWidth - a.realWidth).slice(0, 4);
}
fs.writeFileSync("/tmp/hires/manifest-valid.json", JSON.stringify(valid, null, 2));
console.log("=== VALID CANDIDATES ===");
for (const id of Object.keys(valid)) console.log(`${id}: ${valid[id].map((c) => `${c.realWidth}x${c.realHeight}(${c.idx})`).join(" ") || "NONE"}`);
console.log("\n=== REJECTED ===\n" + rejected.join("\n"));
