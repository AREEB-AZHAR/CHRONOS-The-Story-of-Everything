/**
 * Generates 30 high-resolution cinematic era images in parallel batches.
 * Output: /home/z/my-project/cosmos-raw/<id>.png
 */
import { spawn } from 'child_process';
import { mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const OUT_DIR = '/home/z/my-project/cosmos-raw';
mkdirSync(OUT_DIR, { recursive: true });

const STYLE = 'cinematic wide shot, ultra detailed, dramatic volumetric lighting, deep black background, high contrast, 8k quality, professional photography';

interface EraDef {
  id: string;
  prompt: string;
}

const ERAS: EraDef[] = [
  { id: '01-bigbang', prompt: 'The Big Bang: a blinding flash of creation, an expanding sphere of white-hot plasma and golden light bursting from a single point into infinite black void, streams of primordial energy and particles radiating outward' },
  { id: '02-firststars', prompt: 'Cosmic dawn, the very first stars igniting in the early universe, colossal blue-white giant stars burning fiercely in darkness surrounded by glowing teal and crimson nebula clouds, star formation region' },
  { id: '03-galaxies', prompt: 'A majestic spiral galaxy assembling in the early universe, rotating disk of billions of newborn stars, glowing golden core, swirling arms of violet and magenta star clouds in deep cosmic void' },
  { id: '04-sun', prompt: 'Birth of the Sun: a newborn yellow star igniting at the centre of a swirling protoplanetary disk of dust and gas, glowing orange accretion disk with forming planetesimals, dramatic solar flares' },
  { id: '05-earth', prompt: 'Newborn planet Earth 4.5 billion years ago, a molten world covered in oceans of glowing magma, rivers of lava, asteroids and debris raining down, volcanic surface seen from low orbit' },
  { id: '06-moon', prompt: 'The giant-impact hypothesis: the proto-planet Theia colliding with young Earth, cataclysmic explosion of molten debris and glowing fragments blasting into space, moon forming from the ring of fire' },
  { id: '07-life', prompt: 'Origin of life in primordial seas: smoking hydrothermal vents on a dark volcanic seafloor, glowing amber chemoluminescent molecules, stromatolites, first single-celled organisms shimmering in murky teal water' },
  { id: '08-oxygen', prompt: 'The Great Oxidation Event: ancient rust-red oceans turning turquoise as cyanobacteria exhale oxygen, banded iron formations, hazy orange atmosphere above a toxic ancient sea' },
  { id: '09-cells', prompt: 'The first complex eukaryote cells drifting in ancient ocean water, translucent glowing microscopic organisms with a visible nucleus and organelles, golden-green sunlight filtering down through dark water, macro photography' },
  { id: '10-snowball', prompt: 'Snowball Earth: the entire planet frozen under global ice sheets seen from space, white ice covering continents and oceans, pale distant sun low on the horizon, jagged ice shards on a frozen dead sea' },
  { id: '11-cambrian', prompt: 'The Cambrian explosion seafloor teeming with alien life: trilobites, the predator anomalocaris, opabinia, wiwaxia and hallucigenia, vibrant strange creatures in a clear shallow turquoise sea with dancing sunbeams' },
  { id: '12-ordovician', prompt: 'The Ordovician mass extinction: advancing glaciers freezing ancient shallow seas, graptolites and trilobites perishing in cooling grey-green water, sea ice creeping over a dying reef, pale fading light' },
  { id: '13-land', prompt: 'Life conquers land: giant primitive horsetail ferns and mosses colonising barren volcanic ground, an early tetrapod fish-amphibian pulling itself out of shallow water onto wet mud, misty primeval dawn' },
  { id: '14-devonian', prompt: 'The Late Devonian crisis: dying coral reefs and the armoured placoderm fish dunkleosteus drifting through oxygen-poor murky green water, retreating shallow seas, ominous fading light, silent underwater scene' },
  { id: '15-carboniferous', prompt: 'A Carboniferous forest: giant dragonfly meganeura with 70cm wingspan, enormous fern trees and scale trees, a two-metre millipede arthropleura crossing the forest floor, hazy humid golden air, oxygen-rich green world' },
  { id: '16-greatdying', prompt: 'The Permian-Triassic Great Dying: apocalyptic volcanic hellscape of the Siberian Traps, red glowing lava fissures tearing across scorched dead land, ash-choked dark red sky, a lone dying lystrosaurus, acid-red ocean' },
  { id: '17-dinosaurs-rise', prompt: 'Dawn of the dinosaurs in the early Triassic: the first dinosaurs eoraptor and herrerasaurus hunting in lush green fern valleys, conifer trees, dramatic morning light breaking through storm clouds after the great extinction' },
  { id: '18-jurassic', prompt: 'Jurassic giants: an enormous brachiosaurus feeding on the tall conifer canopy beside a great river, an archaeopteryx gliding overhead, golden light across a grand misty vista' },
  { id: '19-cretaceous', prompt: 'The Cretaceous world in bloom: the first flowering plants, magnolias and colourful blossoms, a sail-backed spinosaurus wading through a river, butterflies, lush tropical landscape in warm humid light' },
  { id: '20-chicxulub', prompt: 'The last day of the dinosaurs: a city-sized asteroid blazing through a dark apocalyptic sky toward Earth, a terrified tyrannosaurus rex and triceratops below, impact fireball and shockwave on the horizon, doom' },
  { id: '21-mammals', prompt: 'Mammals inherit the Earth after the dinosaurs: small early horses, the uintatherium and early whale ancestors in a lush green world, birds flying over the first modern forests, hopeful morning light' },
  { id: '22-grasslands', prompt: 'The rise of grasslands in the Miocene: a vast golden savanna with grazing early horses and antelope, apes watching from the woodland edge, towering clouds above an enormous sky, warm African light' },
  { id: '23-hominins', prompt: 'Lucy, an australopithecus afarensis, walking upright across the ancient African savanna at dawn, her family group behind her, acacia trees and a distant volcano, golden rim light' },
  { id: '24-sapiens', prompt: 'Early homo sapiens gathered at night around a fire inside a cave, torchlight flickering on painted walls with hand stencils and running animals, intimate warm firelight against the dark' },
  { id: '25-iceage', prompt: 'Ice Age giants: a woolly mammoth herd crossing a snowy tundra, a smilodon sabre-tooth watching from a ridge, glaciers and frozen peaks behind, a subtle aurora in the twilight sky' },
  { id: '26-agriculture', prompt: 'The agricultural revolution: neolithic people harvesting the first wheat fields at golden sunset, a mudbrick village, goats and granaries beside a great river valley, abundance and the beginning of civilisation' },
  { id: '27-civilizations', prompt: 'The first civilisations: an ancient Mesopotamian ziggurat city at dusk, ten thousand torches, the Euphrates river with boats, clay tablets, bronze and gold, epic wide shot' },
  { id: '28-industrial', prompt: 'The industrial revolution: Victorian iron bridges and smoking factory chimneys, a steam train crossing a tall viaduct, gas-lit cobblestone streets below, dramatic amber smog and low sun' },
  { id: '29-spaceage', prompt: 'The space age: an Apollo astronaut standing on the lunar surface beside the lander, Earth rising in the pitch black sky, the boot print in grey regolith, harsh brilliant sunlight' },
  { id: '30-modern', prompt: 'Modern Earth from orbit at night: glowing networks of city lights spreading across continents, the thin blue rim of the atmosphere, satellites and orbital data streams above a beautiful fragile blue marble' },
];

function genImage(era: EraDef): Promise<boolean> {
  return new Promise((resolve) => {
    const out = join(OUT_DIR, `${era.id}.png`);
    if (existsSync(out) && statSync(out).size > 100000) {
      console.log(`[skip] ${era.id} already exists`);
      resolve(true);
      return;
    }
    const proc = spawn('z-ai', ['image', '-p', `${era.prompt}, ${STYLE}`, '-o', out, '-s', '1344x768'], {
      stdio: 'ignore',
    });
    proc.on('close', (code) => {
      const ok = code === 0 && existsSync(out) && statSync(out).size > 100000;
      console.log(`[${ok ? 'ok' : 'FAIL'}] ${era.id} (exit ${code})`);
      resolve(ok);
    });
    proc.on('error', (e) => {
      console.log(`[err] ${era.id}: ${e.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const failed: EraDef[] = [];
  const BATCH = 3;
  // First pass in batches of 6
  for (let i = 0; i < ERAS.length; i += BATCH) {
    const batch = ERAS.slice(i, i + BATCH);
    console.log(`--- batch ${i / BATCH + 1}/${Math.ceil(ERAS.length / BATCH)}: ${batch.map((b) => b.id).join(', ')}`);
    const results = await Promise.all(batch.map(genImage));
    batch.forEach((era, idx) => {
      if (!results[idx]) failed.push(era);
    });
  }
  // Retry failures once, sequentially
  if (failed.length) {
    console.log(`--- retrying ${failed.length} failures`);
    for (const era of failed) {
      if (existsSync(join(OUT_DIR, `${era.id}.png`))) {
        // partial file, remove first
        const { unlinkSync } = await import('fs');
        try { unlinkSync(join(OUT_DIR, `${era.id}.png`)); } catch {}
      }
      const ok = await genImage(era);
      if (!ok) console.log(`[GIVE-UP] ${era.id}`);
    }
  }
  console.log('=== DONE ===');
}

main();
