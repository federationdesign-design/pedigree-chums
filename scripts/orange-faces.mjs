// The orange (very common) dogs' accessory faces, 25 September 2026 (owner).
// Turns the 180 cut-out PNGs (sheets 1 to 6 x 30 accessories, named
// orange_expr{1-6}_{accessory}.png) into WebP files the game reads, at
// public/faces/veryCommon/{sheet}_{accessory}.webp, and makes public/common7.webp,
// the new eyes-shut face, from sheet 3's plain face.
// Stops without writing anything if any of the 180 files is missing.
//   node scripts/orange-faces.mjs ~/Downloads/orange_dog_faces_cut
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const ACC = [
  "plain", "monocle", "glasses", "eyepatch", "bandana_red", "flower",
  "headband_red", "earring_plaster", "collar_red_bone", "neckerchief_green", "collar_green_tag", "moustache_bowtie_yellow",
  "headband_green", "sunglasses", "collar_cyan_bone", "neckerchief_pink", "sunglasses_round", "bandana_blue",
  "bandana_lightblue", "bandana_green", "collar_purple_bone", "neckerchief_cyan", "collar_blue_tag", "moustache_bowtie_pink",
  "bandana_yellow", "bandana_purple", "collar_magenta_bone", "neckerchief_blue", "collar_orange_tag", "moustache_bowtie_blue",
];
const src = process.argv[2];
if (!src) { console.error("usage: node scripts/orange-faces.mjs <folder>"); process.exit(1); }
const want = [];
for (let e = 1; e <= 6; e++) for (const a of ACC) want.push([e, a, join(src, `orange_expr${e}_${a}.png`)]);
const missing = want.filter(([, , p]) => !existsSync(p));
if (missing.length) { console.error("missing " + missing.length + " files, e.g. " + missing.slice(0, 3).map((m) => m[2]).join(", ")); process.exit(1); }
const out = "public/faces/veryCommon";
mkdirSync(out, { recursive: true });
for (const [e, a, p] of want) await sharp(p).resize(450, 450).webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile(join(out, `${e}_${a}.webp`));
await sharp(join(src, "orange_expr3_plain.png")).trim().webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile("public/common7.webp");
console.log("wrote 180 faces to " + out + " and public/common7.webp");
