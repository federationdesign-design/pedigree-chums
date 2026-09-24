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
//   EXCLUDE_FROM  comma list of source files; any picture of DIR named in them is
//                 left alone (24 September 2026, for the pictures the history page
//                 shows large)
//   ONLY_FROM     comma list of source files; ONLY pictures named in them are touched
//   MATCH_RE      a regular expression; only file names it matches are touched
//   PALETTE       set to 1 to squeeze PNGs to a reduced colour palette (quality Q),
//                 not lossless. For flat cartoon art it is invisible and about a
//                 third of the size (the mini pit's dog faces, 24 September 2026:
//                 6.3MB to 2.1MB, checked side by side). Not for photographs.
//
// The dog faces, 24 September 2026 (owner), same size, same names, squeezed:
//   DIR=public MAXW=10000 SKIP=0 Q=90 PALETTE=1 MATCH_RE='^(very-common|common|uncommon|rare|extreme-rare)[0-9]*[BC]?[.]png$' node scripts/optimize-images.mjs
//
// The ancestor pictures, 24 September 2026 (owner: 500px wide, still sharp on a
// phone), in two passes so the history page's large pictures keep their size:
//   MAXW=500 SKIP=0 EXCLUDE_FROM=data/historySections.ts,app/britains-dog-history-2/sections.ts node scripts/optimize-images.mjs
//   MAXW=1000 SKIP=0 ONLY_FROM=data/historySections.ts,app/britains-dog-history-2/sections.ts node scripts/optimize-images.mjs

import { readdirSync, statSync, renameSync, readFileSync } from "node:fs";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

const DIR = process.env.DIR || "public/history/breeds";
const MAXW = Number(process.env.MAXW || 700);
const Q = Number(process.env.Q || 80);
const SKIP = Number(process.env.SKIP || 150000);
const MATCH = process.env.MATCH || ""; // only touch filenames containing this substring
const MATCH_RE = process.env.MATCH_RE ? new RegExp(process.env.MATCH_RE) : null;
const PALETTE = process.env.PALETTE === "1";
const DRY = process.env.DRY === "1";
// The picture names each listed source file mentions under DIR.
const namesIn = (list) => {
  const out = new Set();
  const dirName = basename(DIR);
  for (const f of (list || "").split(",").map((x) => x.trim()).filter(Boolean)) {
    const text = readFileSync(f, "utf8");
    const re = new RegExp(`/${dirName}/([^"'\\s)]+\\.(?:jpg|jpeg|png|webp|avif))`, "gi");
    for (const m of text.matchAll(re)) out.add(decodeURI(m[1]));
  }
  return out;
};
const EXCLUDE = namesIn(process.env.EXCLUDE_FROM);
const ONLY = process.env.ONLY_FROM ? namesIn(process.env.ONLY_FROM) : null;

const kb = (b) => (b / 1024).toFixed(0).padStart(5) + "kb";
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const files = readdirSync(DIR)
  .filter((f) => exts.has(extname(f).toLowerCase()))
  .filter((f) => !MATCH || f.includes(MATCH))
  .filter((f) => !MATCH_RE || MATCH_RE.test(f))
  .filter((f) => !EXCLUDE.has(f))
  .filter((f) => !ONLY || ONLY.has(f));
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
    pipeline = PALETTE
      ? pipeline.png({ palette: true, quality: Q, compressionLevel: 9, effort: 10 })
      : pipeline.png({ compressionLevel: 9, effort: 10 });
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
