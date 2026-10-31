import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";

const SRC = "cosmos-raw";
const DST = "public/cosmos";
await mkdir(DST, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith(".png"));
for (const f of files) {
  const out = f.replace(".png", ".jpg");
  await sharp(`${SRC}/${f}`)
    .resize({ width: 1152, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(`${DST}/${out}`);
  console.log("ok", out);
}
console.log("DONE", files.length, "images");
