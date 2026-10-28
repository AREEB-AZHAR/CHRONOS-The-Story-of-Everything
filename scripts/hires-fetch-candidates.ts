// Parse search results, filter by size rules, download top candidates
import fs from "fs";

const ERAS = ["bigbang","firstlight","firststars","galaxies","milkyway","sunborn","earthborn","firstocean","oxygen","cambrian","landfall","greatdying","dinosaurs","asteroid","mammals","humans","journeys","civilization","paleblue"];

const px = (s: any) => parseInt(String(s ?? "0").replace(/px.*/, "")) || 0;

const manifest: any = {};

for (const id of ERAS) {
  const raw = fs.readFileSync(`/tmp/hires/search-${id}.json`, "utf8");
  const d = JSON.parse(raw.slice(raw.indexOf("{")));
  const results = d.results || [];
  // candidates meeting hard rule: original width >= 1600, landscape/square
  const good = results.filter((r: any) => px(r.original_width) >= 1600 && px(r.original_width) >= px(r.original_height));
  const portrait = results.filter((r: any) => px(r.original_width) >= 1600 && px(r.original_width) < px(r.original_height));
  // prefer >=2000 first, then by width desc
  good.sort((a: any, b: any) => px(b.original_width) - px(a.original_width));
  const picks = good.slice(0, 4);
  const usePortrait = picks.length === 0;
  if (usePortrait && portrait.length) picks.push(...portrait.slice(0, 3));
  manifest[id] = picks.map((r: any, k: number) => ({
    idx: k,
    file: `/tmp/hires/${id}-${k}`,
    url: r.original_url,
    source: r.source,
    width: px(r.original_width),
    height: px(r.original_height),
    portrait: usePortrait,
  }));
  console.log(`${id}: ${picks.length} candidates -> ${picks.map((p: any) => `${p.width}x${p.height}`).join(", ")}`);
}
fs.writeFileSync("/tmp/hires/manifest-download.json", JSON.stringify(manifest, null, 2));
