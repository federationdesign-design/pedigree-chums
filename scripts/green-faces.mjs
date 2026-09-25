// The green (uncommon) dogs' accessory faces, 25 September 2026 (owner).
// Turns the 84 cut-out PNGs (7 expressions x 12 accessories, named
// green_expr{1-7}_{accessory}.png) into WebP files the game reads, at
// public/faces/uncommon/{expression}_{accessory}.webp, and makes
// public/uncommon7.webp, the new laughing face, from expression 4's plain face.
// Stops without writing anything if any of the 84 files is missing.
//   node scripts/green-faces.mjs ~/Downloads/green_dog_faces_cut
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const ACC = ["plain", "monocle", "glasses", "eyepatch", "bandana", "flower", "headband", "earring_plaster", "red_collar", "blue_neckerchief", "green_collar", "moustache_bowtie"];
const src = process.argv[2];
if (!src) { console.error("usage: node scripts/green-faces.mjs <folder>"); process.exit(1); }
const want = [];
for (let e = 1; e <= 7; e++) for (const a of ACC) want.push([e, a, join(src, `green_expr${e}_${a}.png`)]);
const missing = want.filter(([, , p]) => !existsSync(p));
if (missing.length) { console.error("missing " + missing.length + " files, e.g. " + missing.slice(0, 3).map((m) => m[2]).join(", ")); process.exit(1); }
const out = "public/faces/uncommon";
mkdirSync(out, { recursive: true });
for (const [e, a, p] of want) await sharp(p).resize(450, 450).webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile(join(out, `${e}_${a}.webp`));
// The tight-cropped plain laughing face, matching how the other uncommon faces are cut.
await sharp(join(src, "green_expr4_plain.png")).trim().webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile("public/uncommon7.webp");
console.log("wrote 84 faces to " + out + " and public/uncommon7.webp");
