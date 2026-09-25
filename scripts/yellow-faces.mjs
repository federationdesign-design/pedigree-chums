// The yellow (common) dogs' accessory faces, 25 September 2026 (owner).
// Turns the 144 cut-out PNGs (sheets 1 to 6 x 24 accessories, named
// yellow_expr{1-6}_{accessory}.png) into WebP files the game reads, at
// public/faces/common/{sheet}_{accessory}.webp.
// Stops without writing anything if any of the 144 files is missing.
//   node scripts/yellow-faces.mjs ~/Downloads/yellow_dog_faces_cut
// A skin tone, 25 September 2026: give its file prefix and tone name, and it
// writes to public/faces/common-{tone} instead.
//   node scripts/yellow-faces.mjs ~/Downloads/bright_dog_faces_cut bright bright
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const ACC = [
  "plain", "monocle", "glasses", "eyepatch", "bandana_red", "flower",
  "headband_blue", "earring_plaster", "collar_blue_bone", "neckerchief_green", "collar_red_tag", "bowtie_yellow",
  "headband_green", "bandana_blue", "collar_teal_bone", "neckerchief_magenta", "collar_teal_tag", "bowtie_blue",
  "headband_red", "bandana_navy", "collar_red_bone", "neckerchief_blue", "collar_green_tag", "bowtie_pink",
];
const src = process.argv[2];
const prefix = process.argv[3] || "yellow";
const tone = process.argv[4] || "";
if (!src) { console.error("usage: node scripts/yellow-faces.mjs <folder>"); process.exit(1); }
const want = [];
for (let e = 1; e <= 6; e++) for (const a of ACC) want.push([e, a, join(src, `${prefix}_expr${e}_${a}.png`)]);
const missing = want.filter(([, , p]) => !existsSync(p));
if (missing.length) { console.error("missing " + missing.length + " files, e.g. " + missing.slice(0, 3).map((m) => m[2]).join(", ")); process.exit(1); }
const out = "public/faces/common" + (tone ? "-" + tone : "");
mkdirSync(out, { recursive: true });
for (const [e, a, p] of want) await sharp(p).resize(450, 450).webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile(join(out, `${e}_${a}.webp`));
console.log("wrote 144 faces to " + out);
