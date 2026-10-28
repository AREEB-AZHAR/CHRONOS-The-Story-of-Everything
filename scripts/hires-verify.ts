// Final verification: all 38 files, sharp metadata + assertions
import fs from "fs";
import sharp from "sharp";

const ERAS = ["bigbang","firstlight","firststars","galaxies","milkyway","sunborn","earthborn","firstocean","oxygen","cambrian","landfall","greatdying","dinosaurs","asteroid","mammals","humans","journeys","civilization","paleblue"];
const OUT = "/home/z/my-project/public/cosmos";

let fail = 0, totalKB = 0;
const rows: string[] = [];
for (const id of ERAS) {
  for (const [suffix, w, h] of [["", 2560, 1440], ["-m", 1280, 720]] as [string, number, number][]) {
    const f = `${OUT}/${id}${suffix}.webp`;
    try {
      const meta = await sharp(f).metadata();
      const kb = Math.round(fs.statSync(f).size / 1024);
      totalKB += kb;
      const ok = meta.format === "webp" && meta.width === w && meta.height === h;
      if (!ok) fail++;
      rows.push(`${ok ? "OK " : "FAIL"} ${id}${suffix}.webp ${meta.width}x${meta.height} ${meta.format} ${kb}KB`);
    } catch (e: any) {
      fail++;
      rows.push(`FAIL ${id}${suffix}.webp: ${e.message}`);
    }
  }
}
console.log(rows.join("\n"));
console.log(`\nTotal: ${ERAS.length * 2} files, ${(totalKB / 1024).toFixed(2)}MB, failures: ${fail}`);
if (fail > 0) process.exit(1);
