// The blue (rare) dogs' accessory faces, 25 September 2026 (owner).
// Turns the 72 cut-out PNGs (sheets 2 to 7 x 12 accessories, named
// blue_expr{2-7}_{accessory}.png) into WebP files the game reads, at
// public/faces/rare/{sheet}_{accessory}.webp, and makes public/rare7.webp, the
// new squinting face, from sheet 4's plain face.
// Stops without writing anything if any of the 72 files is missing.
//   node scripts/blue-faces.mjs ~/Downloads/blue_dog_faces_cut
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const ACC = ["plain", "monocle", "glasses", "eyepatch", "bandana", "flower", "headband", "earring_plaster", "red_collar", "blue_neckerchief", "green_collar", "bowtie"];
const src = process.argv[2];
if (!src) { console.error("usage: node scripts/blue-faces.mjs <folder>"); process.exit(1); }
const want = [];
for (let e = 2; e <= 7; e++) for (const a of ACC) want.push([e, a, join(src, `blue_expr${e}_${a}.png`)]);
const missing = want.filter(([, , p]) => !existsSync(p));
if (missing.length) { console.error("missing " + missing.length + " files, e.g. " + missing.slice(0, 3).map((m) => m[2]).join(", ")); process.exit(1); }
const out = "public/faces/rare";
mkdirSync(out, { recursive: true });
for (const [e, a, p] of want) await sharp(p).resize(450, 450).webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile(join(out, `${e}_${a}.webp`));
// The tight-cropped plain squinting face, matching how the other rare faces are cut.
await sharp(join(src, "blue_expr4_plain.png")).trim().webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile("public/rare7.webp");
console.log("wrote 72 faces to " + out + " and public/rare7.webp");
