// Horizontally flips named images in public/history/breeds so the dogs face the
// other way in the circles and the horizontal sliders.
//
//   node scripts/flip-images.mjs            flips every file in LIST
//   DRY=1 node scripts/flip-images.mjs      reports, writes nothing
//   MATCH=terrier node scripts/flip-images.mjs   only LIST files matching (case-insensitive)
//
// Encode settings mirror optimize-images.mjs so a flip does not re-compress to a
// different quality. Flipping is lossy on a JPEG: it is one extra generation.
//
// The files below are SHARED. Flipping one changes every node that uses it.
// Agreed with Steve on 18 August 2026: that is the intent, all uses flip together.
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const DIR = join(ROOT, "public/history/breeds");
const Q = Number(process.env.Q || 80);
const DRY = !!process.env.DRY;
const MATCH = process.env.MATCH || "";

const LIST = [
  "ancient-british-mastiff-type.jpg",
  "ancient-celtic-scent-hound.jpg",
  "ancient-livestock-dog.jpg",
  "medieval-corgi.jpg",
  "medieval-shepherds-dog.jpg",
  "Medieval-Scottish-Deerhound.jpg",
  "rache.jpg",
  "Old-English-Bulldog.jpg",
  "skye-terrier-photo.webp",
  "english-foxhound.jpg",
  "otterhound-photo.jpg",
  "bearded-collie-photo.jpg",
  "dandie-dinmont-terrier-photo.jpeg",
  "cur-dog.jpg",
  "long-dog-photo.jpg",
  "tweed-water-spaniel.jpg",
  "manchester-terrior.jpg",
  "field-spaniel-photo.jpg",
  "Toy-Trawler-Spaniel.jpg",
  "Norfolk-Spaniel.jpg",
  "norfolk-spaniel-painting.jpg",
  "Curly-Coated-Retriever-photo.jpg",
  "flatcoated_retriever-photo.jpg",
  "english-white-terrier-painting.jpg",
  "Bullmastiff-photo.jpg",
  "lakeland-terrier-photo.jpg",
  "irish-terrier-photo.jpg",
  "soft-coated--wheaten-terrier-photo.jpg",
  "lancashire-heelers-photo.jpg",
  "Welsh_Corgi_Cardigan-photo.jpg",
  "norwich-terrier-photo.jpg",
  "Dumfriesshire-Hound.jpg",
  "Norfolk-Terrier-photo.jpg",
];

const kb = (n) => `${Math.round(n / 1024)}kb`;
const files = LIST.filter(
  (f) => !MATCH || f.toLowerCase().includes(MATCH.toLowerCase())
);

let done = 0, missing = 0, failed = 0;
const rows = [];

for (const name of files) {
  const path = join(DIR, name);

  // Case matters on Vercel's Linux build even though macOS ignores it, so a
  // name that is wrong here would silently 404 in production. Fail loudly.
  if (!existsSync(path)) {
    rows.push(`  MISSING            ${name}`);
    missing++;
    continue;
  }

  const startBytes = statSync(path).size;
  const ext = extname(name).toLowerCase();

  try {
    let pipeline = sharp(path).rotate().flop(); // flop = horizontal mirror

    if (ext === ".png") {
      pipeline = pipeline.png({ compressionLevel: 9, effort: 10 });
    } else if (ext === ".webp") {
      pipeline = pipeline.webp({ quality: Q });
    } else if (ext === ".avif") {
      pipeline = pipeline.avif({ quality: Q });
    } else {
      pipeline = pipeline.jpeg({ quality: Q, mozjpeg: true, progressive: true });
    }

    const out = await pipeline.toBuffer();
    rows.push(`  ${kb(startBytes).padStart(7)} -> ${kb(out.length).padStart(7)}  ${name}`);
    done++;

    if (!DRY) {
      const tmp = path + ".flip-tmp";
      writeFileSync(tmp, out);
      const check = statSync(tmp).size;
      if (check < 1024) {
        unlinkSync(tmp);
        throw new Error("output suspiciously small, left original alone");
      }
      writeFileSync(path, readFileSync(tmp));
      unlinkSync(tmp);
    }
  } catch (err) {
    rows.push(`  FAILED             ${name}  (${err.message})`);
    failed++;
  }
}

console.log(rows.join("\n"));
console.log("------------------------------------------------");
console.log(`dir        public/history/breeds`);
console.log(`quality    ${Q}${DRY ? "  (DRY RUN, nothing written)" : ""}`);
console.log(`listed     ${files.length} of ${LIST.length}`);
console.log(`flipped    ${done}`);
if (missing) console.log(`MISSING    ${missing}   <<< check the filename case`);
if (failed) console.log(`FAILED     ${failed}`);
console.log("");
console.log("Re-running flips them BACK. This script is not idempotent.");
