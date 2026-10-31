/**
 * CHRONOS timeline data — every major stop on the journey from the Big Bang to Today.
 * yearsAgo is expressed in years before 2025 CE (positive = in the past).
 */

export type EpochKind = "cosmic" | "event" | "life" | "extinction" | "human";

export type ExtinctionEntry = {
  name: string;
  yearsAgo: number;
  note: string;
};

export type Fact = { label: string; text: string };

export type Epoch = {
  id: string;
  index: number;
  title: string;
  tagline: string;
  era: string;
  kind: EpochKind;
  yearsAgo: number;
  image: string;
  accent: string; // hex accent for glow / HUD
  body: string;
  facts: Fact[];
  extinctions?: ExtinctionEntry[];
};

export const ACCENTS: Record<EpochKind, string> = {
  cosmic: "#f4a945",
  event: "#e8e2d4",
  life: "#4fd1a5",
  extinction: "#ff5a4e",
  human: "#c490e8",
};

export const EPOCHS: Epoch[] = [
  {
    id: "bigbang",
    index: 0,
    title: "The Big Bang",
    tagline: "Every story ever told begins with a single, silent burst of light.",
    era: "PLANCK ERA",
    kind: "cosmic",
    yearsAgo: 13_800_000_000,
    image: "/cosmos/bigbang.webp",
    accent: ACCENTS.cosmic,
    body: "In a fraction of a second smaller than an atom, space, time, matter and energy were born. The universe did not explode into empty space — space itself began expanding everywhere at once, hotter and denser than anything since. Physics as we know it crystallized out of pure energy: first gravity, then the strong nuclear force, then the rest.",
    facts: [
      { label: "T+0", text: "Time itself begins — no 'before', no 'outside'" },
      { label: "T+10⁻³⁶ s", text: "Cosmic inflation stretches space faster than light" },
      { label: "T+3 minutes", text: "First atomic nuclei forged: hydrogen & helium" },
    ],
  },
  {
    id: "firstlight",
    index: 1,
    title: "First Light",
    tagline: "A fog of fire cools, and the universe finally becomes transparent.",
    era: "RECOMBINATION",
    kind: "cosmic",
    yearsAgo: 13_799_660_000,
    image: "/cosmos/firstlight.webp",
    accent: ACCENTS.cosmic,
    body: "For 380,000 years the young cosmos was an opaque soup of electrons and nuclei — light could not travel. Then the universe cooled enough for electrons to settle into orbit: the first true atoms. In that instant the fog lifted, and light streamed free. We still see it today, stretched into a faint microwave hum, as the Cosmic Microwave Background.",
    facts: [
      { label: "380,000 years", text: "After the Big Bang — the oldest light in existence" },
      { label: "CMB", text: "That afterglow still fills every cubic centimeter around you" },
      { label: "Darkness falls", text: "A 100-million-year 'dark age' begins — no stars yet" },
    ],
  },
  {
    id: "firststars",
    index: 2,
    title: "The First Stars",
    tagline: "In the long night, gravity kindles the first suns.",
    era: "COSMIC DAWN",
    kind: "cosmic",
    yearsAgo: 13_400_000_000,
    image: "/cosmos/firststars.webp",
    accent: ACCENTS.cosmic,
    body: "Dark matter quietly sculpted invisible filaments through the void, pulling cold hydrogen into dense knots. Somewhere in that darkness, a ball of gas grew so heavy that its core ignited — the first star flared, then thousands more. These giants burned fast and died violently, forging the first carbon, oxygen and iron, and seeding the universe with chemistry.",
    facts: [
      { label: "Population III", text: "Primordial giants up to 100× the Sun's mass" },
      { label: "Stellar forges", text: "Every heavy atom in your body was born inside a star" },
      { label: "Supernovae", text: "First stars exploded, scattering new elements into space" },
    ],
  },
  {
    id: "galaxies",
    index: 3,
    title: "Galaxies Assemble",
    tagline: "Islands of stars merge into great spinning cities.",
    era: "GALACTIC YOUTH",
    kind: "cosmic",
    yearsAgo: 13_100_000_000,
    image: "/cosmos/galaxies.webp",
    accent: ACCENTS.cosmic,
    body: "Star clusters collided and merged, growing into the first galaxies — small, chaotic and ferociously bright. Their central black holes fed hungrily, blazing as quasars visible across the universe. Collisions and mergers became the normal way of growth: the cosmos turned into a slow-motion demolition derby of proto-galactic fragments.",
    facts: [
      { label: "Quasars", text: "Feeding supermassive black holes outshine entire galaxies" },
      { label: "JWST's finds", text: "Mature galaxies appear surprisingly early in cosmic history" },
      { label: "Mergers", text: "Galaxies grow by devouring their neighbors" },
    ],
  },
  {
    id: "milkyway",
    index: 4,
    title: "The Milky Way",
    tagline: "Our own island of 400 billion suns takes shape.",
    era: "HOME GALAXY",
    kind: "cosmic",
    yearsAgo: 12_000_000_000,
    image: "/cosmos/milkyway.webp",
    accent: ACCENTS.cosmic,
    body: "Through billions of years of mergers, our galaxy settled into a graceful barred spiral. Globular clusters older than Earth still orbit its halo — witnesses from the very first generations of stars. One ordinary suburb of one ordinary arm, the Orion Spur, would one day matter very much to us.",
    facts: [
      { label: "400 billion", text: "Stars in the Milky Way, give or take a hundred billion" },
      { label: "Oldest stars", text: "Some halo stars are ~13.6 billion years old" },
      { label: "One rotation", text: "A 'galactic year' takes ~230 million Earth years" },
    ],
  },
  {
    id: "sunborn",
    index: 5,
    title: "The Sun Ignites",
    tagline: "A cloud collapses, and a new star switches on.",
    era: "SOLAR NEBULA",
    kind: "event",
    yearsAgo: 4_600_000_000,
    image: "/cosmos/sunborn.webp",
    accent: ACCENTS.event,
    body: "A shockwave — perhaps from a nearby supernova — triggered the collapse of a cold molecular cloud. 99.8% of the mass fell into the center and ignited as our Sun; the leftover spinning disk of dust and ice clumped into planets. For its first 100 million years the young Sun raged with flares, while its planets were still being assembled from rubble.",
    facts: [
      { label: "99.8%", text: "Of the system's mass became the Sun — planets got the crumbs" },
      { label: "8 planets", text: "Accreted from the leftover disk in ~100 million years" },
      { label: "Jupiter first", text: "The giant planets formed before the rocky inner worlds" },
    ],
  },
  {
    id: "earthmoon",
    index: 6,
    title: "Earth & the Moon",
    tagline: "A titanic collision forges our world — and gives it a companion.",
    era: "HADEAN EON",
    kind: "event",
    yearsAgo: 4_540_000_000,
    image: "/cosmos/earthborn.webp",
    accent: ACCENTS.event,
    body: "Earth accreted as a molten ball of rock under constant bombardment. Then a Mars-sized protoplanet — Theia — slammed into it at an oblique angle, vaporizing both crusts. The debris ring condensed into the Moon. Our newly iron-hearted planet had a magnetic shield, an ocean of magma, and skies glowing red with impact flashes.",
    facts: [
      { label: "Theia impact", text: "A Mars-sized world hit Earth ~4.5 billion years ago" },
      { label: "Moon from debris", text: "The Moon condensed from the vaporized wreckage" },
      { label: "Hadean hell", text: "'Hell-like' eon: magma seas, meteors, 1,000°C surfaces" },
    ],
  },
  {
    id: "firstocean",
    index: 7,
    title: "Oceans & First Life",
    tagline: "Steam becomes sea, chemistry becomes biology.",
    era: "ARCHEAN EON",
    kind: "life",
    yearsAgo: 3_800_000_000,
    image: "/cosmos/firstocean.webp",
    accent: ACCENTS.life,
    body: "As the bombardment eased, water vapor condensed into the first rains that fell for millennia — filling the ocean basins. In hydrothermal vents or warm tidal pools, molecules began copying themselves. LUCA — the Last Universal Common Ancestor — appeared: a single cell from which every living thing on Earth, from sequoia to blue whale to you, is descended.",
    facts: [
      { label: "LUCA", text: "One ancestor unites all life ever discovered on Earth" },
      { label: "3.5 billion years", text: "Stromatolite fossils record the earliest microbial reefs" },
      { label: "No oxygen yet", text: "Early life ate iron, sulfur and hydrogen instead" },
    ],
  },
  {
    id: "oxygen",
    index: 8,
    title: "The Great Oxidation",
    tagline: "Tiny microbes poison the planet — and save it.",
    era: "PROTEROZOIC",
    kind: "event",
    yearsAgo: 2_400_000_000,
    image: "/cosmos/oxygen.webp",
    accent: ACCENTS.life,
    body: "Cyanobacteria learned photosynthesis and began exhaling oxygen — a corrosive waste gas that triggered Earth's first mass extinction, wiping out most anaerobic microbes. Iron in the oceans rusted and rained down as banded iron cliffs. Twice, methane collapses plunged the planet into 'Snowball Earth', frozen from pole to pole. Catastrophe, repeatedly — and each time the door opened a little wider for complex life.",
    facts: [
      { label: "Rust in the sea", text: "Banded iron formations are fossilized oxygen" },
      { label: "Snowball Earth", text: "Glaciers reached the equator at least twice" },
      { label: "First mass extinction", text: "Oxygen was lethal to Earth's original inhabitants" },
    ],
  },
  {
    id: "cambrian",
    index: 9,
    title: "The Cambrian Explosion",
    tagline: "In a geological blink, life invents almost every body plan.",
    era: "PALEOZOIC ERA",
    kind: "life",
    yearsAgo: 538_000_000,
    image: "/cosmos/cambrian.webp",
    accent: ACCENTS.life,
    body: "After billions of years of microbes, the seas suddenly bloomed with animals: eyes, shells, jaws, predators, prey. Within ~25 million years nearly every major animal phylum appears in the fossil record. Trilobites scuttled across the seabed for the next 270 million years; the first vertebrates — tiny jawless fish — would become our own branch of the tree.",
    facts: [
      { label: "538 MYA", text: "Almost all animal phyla appear in ~25 million years" },
      { label: "First eyes", text: "Vision triggers an evolutionary arms race" },
      { label: "Big Five begins", text: "444 MYA: Ordovician–Silurian extinction, ~85% of species lost" },
    ],
  },
  {
    id: "landfall",
    index: 10,
    title: "Life Storms the Land",
    tagline: "Fish learn to breathe air; forests swallow the continents.",
    era: "DEVONIAN",
    kind: "life",
    yearsAgo: 385_000_000,
    image: "/cosmos/landfall.webp",
    accent: ACCENTS.life,
    body: "Plants crept ashore first, followed by arthropods, then lobe-finned fish like Tiktaalik — half-fish, half-amphibian — hauling themselves onto muddy banks. Forests of giant ferns and 30-meter club mosses greened the continents and pumped oxygen skyward. Insects took flight. Then the Late Devonian extinction struck, killing ~75% of species — but four-legged land pioneers survived to inherit the world.",
    facts: [
      { label: "Tiktaalik", text: "375 MYA: the 'fishapod' link between sea and land" },
      { label: "First forests", text: "Devonian woods cooled the planet and coined coal" },
      { label: "Big Five #2", text: "372 MYA: Late Devonian extinction, ~75% of species lost" },
    ],
  },
  {
    id: "greatdying",
    index: 11,
    title: "The Great Dying",
    tagline: "The closest life ever came to ending — forever.",
    era: "END-PERMIAN",
    kind: "extinction",
    yearsAgo: 252_000_000,
    image: "/cosmos/greatdying.webp",
    accent: ACCENTS.extinction,
    body: "Siberia ripped open with lava floods that burned for a million years. Acid rain, greenhouse heat and suffocating anoxia swept the oceans. It remains the worst catastrophe in Earth's history: ~96% of marine species and ~70% of land vertebrates vanished. Trilobites — survivors of 270 million years — were erased. The world took 10 million years to recover, and evolution dealt a new hand.",
    facts: [
      { label: "252 MYA", text: "Siberian Traps erupt across millions of km²" },
      { label: "96% marine", text: "And 70% of land vertebrate species extinguished" },
      { label: "Big Five #3", text: "The most severe of all mass extinctions" },
    ],
    extinctions: [
      { name: "Trilobites", yearsAgo: 252_000_000, note: "270 million years of survival, ended" },
      { name: "Gorgonopsids", yearsAgo: 252_000_000, note: "Saber-toothed synapsid apex predators" },
      { name: "~96% of marine species", yearsAgo: 252_000_000, note: "Rugose corals, eurypterids, fusulinid forams" },
    ],
  },
  {
    id: "dinosaurs",
    index: 12,
    title: "Age of Dinosaurs",
    tagline: "After disaster, giants rule the Earth for 165 million years.",
    era: "MESOZOIC ERA",
    kind: "life",
    yearsAgo: 230_000_000,
    image: "/cosmos/dinosaurs.webp",
    accent: ACCENTS.life,
    body: "From the wreckage crawled the archosaurs — and among them, dinosaurs. They diversified into the largest land animals ever to walk: Argentinosaurus at 35 meters, T. rex with a bite of six tonnes, Quetzalcoatlus towering like a giraffe on wings. The first birds took to the air; flowers invented a partnership with pollinating insects. Another extinction at 201 MYA cleared the last competitors, and dinosaurs owned the planet.",
    facts: [
      { label: "165 million years", text: "Dinosaurs dominated for longer than mammals have existed" },
      { label: "Big Five #4", text: "201 MYA: Triassic–Jurassic extinction clears the stage" },
      { label: "Birds", text: "Are living dinosaurs — descendants of feathered theropods" },
    ],
  },
  {
    id: "asteroid",
    index: 13,
    title: "The Asteroid",
    tagline: "A 10-kilometer rock ends an era in a single afternoon.",
    era: "K–PG BOUNDARY",
    kind: "extinction",
    yearsAgo: 66_000_000,
    image: "/cosmos/asteroid.webp",
    accent: ACCENTS.extinction,
    body: "At 60,000 times the energy of every nuclear stockpile combined, an asteroid struck shallow seas at Chicxulub, Mexico. Fires rained from the sky, tsunamis a kilometer high raced across oceans, and a shroud of dust froze out the sun. Within months, ~75% of all species were gone. Every non-avian dinosaur, pterosaur, mosasaur and ammonite — vanished. Small burrowing mammals, birds and crocodilians endured in the ash.",
    facts: [
      { label: "Chicxulub", text: "180-km crater still lies beneath the Yucatán" },
      { label: "Impact winter", text: "Sunlight dropped ~90%; photosynthesis collapsed" },
      { label: "Big Five #5", text: "66 MYA: ~75% of species lost, 3/4 of life erased" },
    ],
    extinctions: [
      { name: "Non-avian dinosaurs", yearsAgo: 66_000_000, note: "T. rex, Triceratops, sauropods — all gone" },
      { name: "Pterosaurs", yearsAgo: 66_000_000, note: "The great flying reptiles" },
      { name: "Ammonites", yearsAgo: 66_000_000, note: "300 million years of spiral-shelled drifters" },
      { name: "Mosasaurs & plesiosaurs", yearsAgo: 66_000_000, note: "Sea-monster reptiles of Cretaceous seas" },
    ],
  },
  {
    id: "mammals",
    index: 14,
    title: "Age of Mammals",
    tagline: "Small, warm, clever — the survivors inherit the Earth.",
    era: "CENOZOIC ERA",
    kind: "life",
    yearsAgo: 50_000_000,
    image: "/cosmos/mammals.webp",
    accent: ACCENTS.life,
    body: "With the giants gone, mammals exploded into every niche: whales returned to the sea, bats conquered the night sky, elephants and their kin grew immense. Grasslands spread, apes swung into the trees, and ice sheets began to pulse across the poles. Among the small primates of the African canopy, one lineage was quietly growing a larger brain.",
    facts: [
      { label: "50 MYA", text: "Whales walk back into the ocean on four legs" },
      { label: "2.6 MYA", text: "Ice ages begin sculpting the modern world" },
      { label: "Primates", text: "Eyes forward, hands free — brains before brawn" },
    ],
  },
  {
    id: "humans",
    index: 15,
    title: "Dawn of Humanity",
    tagline: "A savanna ape stands up — and starts asking questions.",
    era: "PLEISTOCENE",
    kind: "human",
    yearsAgo: 7_000_000,
    image: "/cosmos/humans.webp",
    accent: ACCENTS.human,
    body: "Seven million years ago, a population of African apes took to two legs. Australopithecus left footprints in volcanic ash; Homo erectus tamed fire and walked out of Africa. Neanderthals thrived in Ice Age Europe. Then, around 300,000 years ago, Homo sapiens appeared — storytelling, tool-making, star-gazing us. Every non-African human alive today descends from a small band that left Africa ~70,000 years ago.",
    facts: [
      { label: "7 MYA", text: "Hominins split from the chimpanzee lineage" },
      { label: "1 MYA", text: "Fire is tamed — cooking, warmth, night, conversation" },
      { label: "300,000 YA", text: "Homo sapiens emerges in Africa" },
    ],
  },
  {
    id: "journeys",
    index: 16,
    title: "Out of Africa",
    tagline: "Ice bridges, ocean crossings, and the first farms.",
    era: "STONE AGE",
    kind: "human",
    yearsAgo: 70_000,
    image: "/cosmos/journeys.webp",
    accent: ACCENTS.human,
    body: "Humans painted the first art in caves, crossed to Australia by boat 50,000 years ago, and walked into the Americas across Beringia. As the last ice age ended, an extraordinary idea took root: instead of chasing food, grow it. Agriculture fed villages, villages became cities, and for the first time a species began changing the planet on purpose.",
    facts: [
      { label: "45,000 YA", text: "Cave art in Sulawesi — among the oldest figurative painting" },
      { label: "12,000 YA", text: "Agriculture begins; wheat, rice and maize reshaped the land" },
      { label: "5,000 YA", text: "Writing is invented in Mesopotamia — history begins" },
    ],
  },
  {
    id: "civilization",
    index: 17,
    title: "Civilizations Rise",
    tagline: "From mud-brick cities to the Moon — in 5,000 quick years.",
    era: "RECORDED HISTORY",
    kind: "human",
    yearsAgo: 5_000,
    image: "/cosmos/civilization.webp",
    accent: ACCENTS.human,
    body: "Pyramids rose along the Nile; philosophy bloomed in Athens; empires rose and fell like tides. The printing press multiplied ideas, the steam engine rewrote energy, and in a single century the world went from horse carts to flight, radios, antibiotics, computers. In 1969, a human walked on the Moon — and looked back. Thirteen point eight billion years of physics and evolution had produced eyes that could finally see where they came from.",
    facts: [
      { label: "121 years", text: "From the first powered flight to the Moon: 66 years" },
      { label: "1945 → now", text: "Digital age: computing, genomes, the internet, AI" },
      { label: "8 billion", text: "Humans now alive — one species, one planet" },
    ],
  },
  {
    id: "paleblue",
    index: 18,
    title: "You Are Here",
    tagline: "A pale blue dot, still writing its story.",
    era: "HOLOCENE — TODAY",
    kind: "human",
    yearsAgo: 0,
    image: "/cosmos/paleblue.webp",
    accent: ACCENTS.human,
    body: "Thirteen point eight billion years of stardust, fire, water and evolution led to this moment: you, reading these words, made of atoms forged in dead stars. But the story is unfinished. We are living through the sixth mass extinction — the first caused by a species that knows better. The dodo, the passenger pigeon, the thylacine, the baiji… each was once a thread 3.8 billion years in the weaving. What happens in the next chapter is, for the first time, our choice.",
    facts: [
      { label: "One species", text: "Now steers the fate of millions of others" },
      { label: "Sixth extinction", text: "Species vanishing 100–1,000× the natural rate" },
      { label: "The choice", text: "Curiosity made us; wisdom will decide what we become" },
    ],
    extinctions: [
      { name: "Woolly mammoth", yearsAgo: 4_000, note: "Last holdouts on Wrangel Island, Siberia" },
      { name: "Dodo", yearsAgo: 344, note: "1681 CE — gone within a century of discovery" },
      { name: "Great auk", yearsAgo: 181, note: "1844 CE — hunted for its feathers" },
      { name: "Passenger pigeon", yearsAgo: 111, note: "1914 CE — billions once darkened the sky" },
      { name: "Thylacine", yearsAgo: 89, note: "1936 CE — the Tasmanian tiger" },
      { name: "Baiji dolphin", yearsAgo: 19, note: "2006 CE — declared functionally extinct" },
    ],
  },
];

/** Anchor progress for each epoch (0..1 of total scroll) */
export const INTRO_END = 0.055;
export const OUTRO_START = 0.958;
export const ANCHORS: number[] = EPOCHS.map(
  (_, i) => INTRO_END + (i / (EPOCHS.length - 1)) * (OUTRO_START - INTRO_END)
);

export const SPACING = (OUTRO_START - INTRO_END) / (EPOCHS.length - 1);
