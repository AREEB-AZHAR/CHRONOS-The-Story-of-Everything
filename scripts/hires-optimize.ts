// Optimize winners -> public/cosmos/{id}.webp (2560x1440 q86) + {id}-m.webp (1280x720 q80)
import fs from "fs";
import sharp from "sharp";

const winners = JSON.parse(fs.readFileSync("/tmp/hires/winners.json", "utf8"));
const OUT = "/home/z/my-project/public/cosmos";

let done = 0;
for (const id of Object.keys(winners)) {
  const src = winners[id].src;
  const big = `${OUT}/${id}.webp`;
  const mid = `${OUT}/${id}-m.webp`;
  await sharp(src).resize(2560, 1440, { fit: "cover", position: "attention" }).webp({ quality: 86 }).toFile(big);
  await sharp(src).resize(1280, 720, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(mid);
  const kb = (f: string) => Math.round(fs.statSync(f).size / 1024);
  console.log(`${id}: ${kb(big)}KB + ${kb(mid)}KB`);
  done++;
}
console.log(`\n${done} eras -> ${done * 2} files written to ${OUT}`);
