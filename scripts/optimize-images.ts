/* Converts PNGs in public/cosmos to webp q80 and removes the originals */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public", "cosmos");

async function main() {
  const files = fs.readdirSync(OUT).filter((f) => f.endsWith(".png"));
  for (const f of files) {
    const src = path.join(OUT, f);
    const dst = path.join(OUT, f.replace(/\.png$/, ".webp"));
    await sharp(src).webp({ quality: 80 }).toFile(dst);
    fs.unlinkSync(src);
    console.log(`webp ${f}`);
  }
  console.log("OPTIMIZE DONE");
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
