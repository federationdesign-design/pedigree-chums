// Repeatable image optimiser for the pedigree-chums public assets.
//
// Why: the lineage pop-out (SVG <image>) and the pack pit (canvas drawImage)
// serve files straight from /public with no Next image optimisation, so the
// raw export weight is what every visitor downloads. This caps dimensions and
// recompresses in place, keeping the same filename and format so nothing in
// the data files breaks. Transparency on PNG sprites is preserved.
//
// Run from the repo root:
//   node scripts/optimize-images.mjs                 (optimises public/history/breeds)
//   DIR=public MAXW=520 node scripts/optimize-images.mjs   (e.g. the square sprites)
//   DRY=1 node scripts/optimize-images.mjs           (report only, writes nothing)
//
// Env knobs:
//   DIR   folder to walk, non-recursive            default public/history/breeds
//   MAXW  longest-edge cap in px (never upscales)   default 700
//   Q     JPEG / WebP quality 1-100                 default 80
//   SKIP  bytes under which a file is left alone     default 150000
//   DRY   set to 1 to preview without writing

import { readdirSync, statSync, renameSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const DIR = process.env.DIR || "public/history/breeds";
const MAXW = Number(process.env.MAXW || 700);
const Q = Number(process.env.Q || 80);
const SKIP = Number(process.env.SKIP || 150000);
const MATCH = process.env.MATCH || ""; // only touch filenames containing this substring
const DRY = process.env.DRY === "1";

const kb = (b) => (b / 1024).toFixed(0).padStart(5) + "kb";
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const files = readdirSync(DIR)
  .filter((f) => exts.has(extname(f).toLowerCase()))
  .filter((f) => !MATCH || f.includes(MATCH));
let before = 0, after = 0, touched = 0, skipped = 0;
const rows = [];

for (const name of files) {
  const path = join(DIR, name);
  const startBytes = statSync(path).size;
  before += startBytes;

  const ext = extname(name).toLowerCase();
  let meta;
  try {
    meta = await sharp(path).metadata();
  } catch {
    rows.push(`  skip (unreadable)  ${name}`);
    after += startBytes;
    skipped++;
    continue;
  }

  const big = Math.max(meta.width || 0, meta.height || 0) > MAXW;
  if (!big && startBytes < SKIP) {
    after += startBytes;
    skipped++;
    continue;
  }

  let pipeline = sharp(path).rotate(); // respect EXIF orientation, then bake it in
  if (big) pipeline = pipeline.resize({ width: MAXW, height: MAXW, fit: "inside", withoutEnlargement: true });

  if (ext === ".png") {
    // Sprites carry transparency and flat illustration colour; keep them lossless
    // (no palette quantisation, which can band). The resize alone is the win here.
    pipeline = pipeline.png({ compressionLevel: 9, effort: 10 });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: Q });
  } else if (ext === ".avif") {
    pipeline = pipeline.avif({ quality: Q });
  } else {
    // jpg / jpeg
    pipeline = pipeline.jpeg({ quality: Q, mozjpeg: true, progressive: true });
  }

  const out = await pipeline.toBuffer();

  // Never let "optimising" make a file bigger.
  if (out.length >= startBytes) {
    after += startBytes;
    skipped++;
    continue;
  }

  after += out.length;
  touched++;
  rows.push(`  ${kb(startBytes)} -> ${kb(out.length)}  ${name}`);

  if (!DRY) {
    const tmp = path + ".opt-tmp";
    await sharp(out).toFile(tmp);
    renameSync(tmp, path);
  }
}

rows.sort();
console.log(rows.join("\n"));
console.log("\n" + "-".repeat(48));
console.log(`dir        ${DIR}`);
console.log(`cap ${MAXW}px  quality ${Q}  ${DRY ? "(DRY RUN, nothing written)" : ""}`);
console.log(`files      ${files.length}  (optimised ${touched}, left alone ${skipped})`);
console.log(`before     ${kb(before)}`);
console.log(`after      ${kb(after)}`);
const saved = before - after;
console.log(`saved      ${kb(saved)}  (${((saved / before) * 100).toFixed(1)}% smaller)`);
