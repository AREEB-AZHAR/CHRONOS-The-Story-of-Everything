// Download all candidate images from the manifest (parallel pool of 5)
import fs from "fs";

const manifest = JSON.parse(fs.readFileSync("/tmp/hires/manifest-download.json", "utf8"));
type Cand = { file: string; url: string; source: string; width: number; height: number; portrait: boolean };

const jobs: Cand[] = [];
for (const id of Object.keys(manifest)) for (const c of manifest[id]) jobs.push({ ...c, file: c.file + (c.url.match(/\.(jpe?g|png|webp)(\?|$)/i)?.[1]?.toLowerCase() === "png" ? ".png" : ".jpg") });

let done = 0, fail = 0;
const queue = [...jobs];
const workers = Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const j = queue.shift()!;
    try {
      const res = await fetch(j.url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20000) throw new Error("too small: " + buf.length);
      fs.writeFileSync(j.file, buf);
      done++;
      console.log(`OK  ${j.file} (${Math.round(buf.length / 1024)}KB)`);
    } catch (e: any) {
      fail++;
      console.log(`ERR ${j.file}: ${e.message}`);
    }
  }
});
await Promise.all(workers);
// update manifest with actual file paths
for (const id of Object.keys(manifest)) manifest[id] = manifest[id].map((c: Cand) => ({ ...c, file: c.file + (c.url.match(/\.(jpe?g|png|webp)(\?|$)/i)?.[1]?.toLowerCase() === "png" ? ".png" : ".jpg") }));
fs.writeFileSync("/tmp/hires/manifest-download.json", JSON.stringify(manifest, null, 2));
console.log(`\nDownloaded ${done}/${jobs.length}, failed ${fail}`);
