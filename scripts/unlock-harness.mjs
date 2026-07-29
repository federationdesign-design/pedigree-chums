// Unlock harness. Measurement only, changes nothing.
//
// THE HARNESS LESSON, from the handover. A harness was built three times and
// was wrong three times, in ways that gave confident, precise, useless numbers:
//
//   1. It ran the RAW pack layout. The app then runs relayoutMobile, which turns
//      a wide cluster 90 degrees, tilts a pair, and scales. Gravity is not
//      rotation invariant, so the turn is the whole reason circles stack.
//   2. It modelled the ROOT and its children. The root is hidden. The circles
//      you hover are depth 1 and the ones that move are depth 2.
//   3. The sideways impulse had the SAME SIGN for both circles, so they never
//      separated.
//
// This one does all three properly: real tree, real pack, real relayoutMobile
// including the turn and the tilt, and a depth-1 node as the parent.
//
// HOW TO RUN. The data files are TypeScript, so transpile them to CJS first:
//
//   mkdir -p /tmp/lh
//   cp data/lineage.ts data/lineageArchive.ts data/breeds.ts data/lineageNames.ts data/uk-breeds.ts /tmp/lh/
//   ./node_modules/.bin/tsc /tmp/lh/*.ts --outDir /tmp/lh --module commonjs --target es2020 --skipLibCheck --esModuleInterop
//   LINEAGE_JS=/tmp/lh/lineage.js UK_JS=/tmp/lh/uk-breeds.js node scripts/unlock-harness.mjs
//
// WHAT IT FOUND, 29 July, 86 cases across all 90 mini pit levels at difficulty 5:
//
//   children | spread median | rest median | rest worst
//   2        | 0.13s         | 4.72s       | 6.85s
//   3        | 0.02s         | 5.92s       | 9.23s
//   4        | 0.02s         | 3.12s       | 9.68s
//
// The backlog said three-circle levels take about 2.8s to spread against 0.45s
// for pairs, and that leaning the fan harder for odd counts would fix it. That
// is wrong. Three circles spread INSTANTLY, faster than pairs, because the pack
// already offsets them horizontally so they start shoulder to shoulder. What is
// slower is coming to REST, and it is 5.92s against 4.72s, about 25%. The dial
// for that is UNLOCK_DRAG, not UNLOCK_SIDE.
//
// THREE METRICS WERE TRIED. The first two were useless and it is worth knowing why:
//   1. Overlap. The relaxation pass separates circles every frame, so overlap is
//      always about zero and this reports separation on frame one.
//   2. Gap. Gravity holds the circles in contact inside the ring, so daylight
//      never opens and this reports that nothing ever separates.
//   3. Sideways distance. The fan slides a stack, it does not open a gap. This
//      is the only one that measures what the fan actually does.

import { pack, hierarchy } from "d3-hierarchy";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const LINEAGE_JS = process.env.LINEAGE_JS || "/tmp/r3/lineage.js";
const UK_JS = process.env.UK_JS || "/tmp/r3/uk-breeds.js";
const { getLineage } = require(LINEAGE_JS);
let levelNames = [];
try {
  const U = require(UK_JS);
  levelNames = (U.ukBreeds || U.default || []).map((b) => b.name);
} catch {
  levelNames = [];
}

// ---------------------------------------------------------------- constants
// Copied verbatim from components/BreedTree/BreedTree.tsx. If any of these move
// in the source, this file lies. Re-check before trusting a number.
const SIZE = 760;
const PAD = 1.4;
const DIFF_SPAN = 1.21;
const PIT_SHRINK = 2.1;
const PIT_SPAN = DIFF_SPAN * PIT_SHRINK;
const DIFF_INSET = 16;
const DIFF_FLOOR_VU = (SIZE / (567.5 / 57.6)) * (1 - 0.1043);
const DIFF_DROP = 0.04;
const DIFF_RING = 0.045;
const DIFF_TILT_DEG = 12.5;
const CLUSTER_DROP = 0.05;
const DIFF_STOP_0 = 0.25;
const DIFF_STOP_5 = 0.575;
const DIFF_STOP_10 = 0.92;
const DIFF_DEFAULT = 5;

const UNLOCK_G = 5.0;
const UNLOCK_BOUNCE = 0.28;
const UNLOCK_DRAG = 1.3;
const UNLOCK_RIM = 0.85;
const UNLOCK_POP = 0.45;
const UNLOCK_SIDE = 1.3;
const UNLOCK_ITER = 12;
const UNLOCK_REST = 0.0006;
const REST_SECONDS = 0.4; // unlockFrame calls it asleep past this

const pitBox = (FW, FH) => ({
  w: (FW - DIFF_INSET) * PIT_SPAN,
  restY: (FH / 2 - DIFF_FLOOR_VU - FH * DIFF_DROP) * PIT_SPAN,
});
function diffScale(base, fit, level) {
  if (level === null) return base;
  const l = Math.min(Math.max(level, 0), 10);
  const a = DIFF_STOP_0, b = DIFF_STOP_5, c = DIFF_STOP_10;
  const f = l <= 5 ? a + (l / 5) * (b - a) : b + ((l - 5) / 5) * (c - b);
  return fit * f;
}

// ------------------------------------------------------- relayoutMobile port
// Verbatim from the source. The turn and the tilt are the whole point.
function relayoutMobile(nodes, aspect, level, tilt) {
  const root = nodes[0];
  const kids = root.children ?? [];
  const n = kids.length;
  if (n < 1) return;
  const FW = SIZE;
  const FH = SIZE / Math.min(Math.max(aspect, 0.42), 0.95);
  const ox = root.x, oy = root.y;
  const pts = nodes.map((d) => ({ d, x: d.x - ox, y: d.y - oy }));
  if (n === 1) {
    const pit = pitBox(FW, FH);
    const s = diffScale(
      Math.min(FW * 0.5, FH * 0.46) / kids[0].r,
      pit.w / (2 * kids[0].r * (1 + DIFF_RING)),
      level
    );
    const shift1 = level === null ? 0 : pit.restY - kids[0].r * s;
    pts.forEach((p) => { p.d.x = p.x * s; p.d.y = p.y * s + shift1; p.d.r = p.d.r * s; });
    root.x = 0; root.y = 0; root.r = FW / (2 * PAD);
    return;
  }
  const d1 = pts.filter((p) => p.d.depth === 1);
  const w0 = Math.max(...d1.map((p) => p.x)) - Math.min(...d1.map((p) => p.x));
  const h0 = Math.max(...d1.map((p) => p.y)) - Math.min(...d1.map((p) => p.y));
  if (w0 > h0) pts.forEach((p) => { const t = p.x; p.x = p.y; p.y = -t; });
  if (level !== null && n === 2 && tilt) {
    const t = (tilt * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
    pts.forEach((p) => { const nx = p.x * cs - p.y * sn; p.y = p.x * sn + p.y * cs; p.x = nx; });
  }
  const minX = Math.min(...d1.map((p) => p.x - p.d.r));
  const maxX = Math.max(...d1.map((p) => p.x + p.d.r));
  const minY = Math.min(...d1.map((p) => p.y - p.d.r));
  const maxY = Math.max(...d1.map((p) => p.y + p.d.r));
  const bw = maxX - minX, bh = maxY - minY;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const M = 20;
  const pit = pitBox(FW, FH);
  const scale = diffScale(
    Math.min((FH - M) / bh, (FW * 1.12) / bw),
    pit.w / (bw * (1 + DIFF_RING)),
    level
  );
  const bottomAfter = (maxY - cy) * scale;
  let drop;
  if (level === null) {
    const halfH = FH / 2;
    const slack = Math.max(0, halfH - M / 2 - bottomAfter);
    drop = Math.min(FH * CLUSTER_DROP, slack);
  } else {
    drop = Math.min(0, pit.restY - bottomAfter);
  }
  pts.forEach((p) => {
    p.d.x = (p.x - cx) * scale;
    p.d.y = (p.y - cy) * scale + drop;
    p.d.r = p.d.r * scale;
  });
  root.x = 0; root.y = 0; root.r = FW / (2 * PAD);
}

// ------------------------------------------------------------- the unlock
function unlockStart(P) {
  const shownKids = (P.children ?? []).filter((n) => !(n.parent && n.data.name === n.parent.data.name));
  const byHeight = [...shownKids].sort((a, b) => a.y - b.y);
  const mid = (byHeight.length - 1) / 2;
  return shownKids.map((n) => {
    const dx = n.x - P.x, dy = n.y - P.y;
    const len = Math.hypot(dx, dy) || 1;
    const sp = UNLOCK_POP * P.r;
    const lean = byHeight.length < 2 ? 0 : (byHeight.indexOf(n) - mid) / Math.max(mid, 0.5);
    return {
      n, ox: 0, oy: 0, px: 0, py: 0,
      vx: (dx / len) * sp - lean * UNLOCK_SIDE * P.r,
      vy: (dy / len) * sp - sp * 0.35,
    };
  });
}

function unlockStep(kids, P, dt) {
  const damp = Math.max(0, 1 - UNLOCK_DRAG * dt);
  for (const kd of kids) {
    kd.px = kd.ox; kd.py = kd.oy;
    kd.vy += UNLOCK_G * P.r * dt;
    kd.vx *= damp; kd.vy *= damp;
    kd.ox += kd.vx * dt; kd.oy += kd.vy * dt;
  }
  for (let it = 0; it < UNLOCK_ITER; it++) {
    for (const kd of kids) {
      const cx = kd.n.x + kd.ox - P.x;
      const cy = kd.n.y + kd.oy - P.y;
      const maxD = P.r - kd.n.r;
      const d = Math.hypot(cx, cy);
      if (d > maxD && d > 0) {
        const nx = cx / d, ny = cy / d;
        kd.ox -= (d - maxD) * nx;
        kd.oy -= (d - maxD) * ny;
        if (it === 0) {
          const vn = kd.vx * nx + kd.vy * ny;
          if (vn > 0) {
            kd.vx -= (1 + UNLOCK_BOUNCE) * vn * nx;
            kd.vy -= (1 + UNLOCK_BOUNCE) * vn * ny;
          }
          kd.vx *= UNLOCK_RIM; kd.vy *= UNLOCK_RIM;
        }
      }
    }
    for (let a = 0; a < kids.length; a++) {
      for (let b = a + 1; b < kids.length; b++) {
        const A = kids[a], B = kids[b];
        const dx = (B.n.x + B.ox) - (A.n.x + A.ox);
        const dy = (B.n.y + B.oy) - (A.n.y + A.oy);
        const d = Math.hypot(dx, dy);
        const min = A.n.r + B.n.r;
        if (d >= min || d === 0) continue;
        const nx = dx / d, ny = dy / d, push = (min - d) / 2;
        A.ox -= nx * push; A.oy -= ny * push;
        B.ox += nx * push; B.oy += ny * push;
        if (it === 0) {
          const rvn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rvn < 0) {
            const j2 = -(1 + UNLOCK_BOUNCE) * rvn / 2;
            A.vx -= j2 * nx; A.vy -= j2 * ny;
            B.vx += j2 * nx; B.vy += j2 * ny;
          }
        }
      }
    }
  }
  let moved = 0;
  for (const kd of kids) moved = Math.max(moved, Math.hypot(kd.ox - kd.px, kd.oy - kd.py));
  return moved;
}

// Worst overlap between any pair, as a fraction of the smaller radius.
//
// EPS matters more than it looks. The relaxation pass leaves a residue of the
// order of 1e-12 on every frame, so a bare `overlap > 0` test never reads clean
// and the separation time it reports is the moment the arithmetic noise dies
// down, not the moment you can see daylight. The first run of this harness said
// two-circle levels never came apart AND that their peak overlap was zero, which
// cannot both be true. 1e-6 of a radius is far below a pixel on any screen.
const EPS = 1e-6;
function worstOverlap(kids) {
  let w = 0;
  for (let a = 0; a < kids.length; a++) {
    for (let b = a + 1; b < kids.length; b++) {
      const A = kids[a], B = kids[b];
      const d = Math.hypot((B.n.x + B.ox) - (A.n.x + A.ox), (B.n.y + B.oy) - (A.n.y + A.oy));
      const min = A.n.r + B.n.r;
      if (d < min) {
        const rel = (min - d) / Math.min(A.n.r, B.n.r);
        if (rel > EPS) w = Math.max(w, rel);
      }
    }
  }
  return w;
}

// The tightest GAP between any pair, as a fraction of the smaller radius.
//
// This, not overlap, is what "come apart" means. The relaxation pass pushes
// overlapping circles off each other on every single frame, so overlap is
// always about zero and a zero-overlap test reports separation on frame one
// whatever the circles are doing. What a person sees is daylight opening up.
// SPREAD is the width of daylight that counts as apart: a tenth of the smaller
// circle's radius.
const SPREAD = 1.0;
// SIDEWAYS is the one that actually answers the question. Two circles inside a
// ring are packed one above the other, and gravity holds them in contact for as
// long as you watch, so neither an overlap test nor a gap test ever reports
// anything useful. What the fan does is slide a stack SIDEWAYS: the highest
// circle one way, the lowest the other. So spread is the horizontal distance
// between the pair, in units of the smaller radius, and 1.0 means they are
// roughly shoulder to shoulder rather than stacked.
function widestSideways(kids) {
  let w = 0;
  for (let a = 0; a < kids.length; a++) {
    for (let b = a + 1; b < kids.length; b++) {
      const A = kids[a], B = kids[b];
      const dx = Math.abs((B.n.x + B.ox) - (A.n.x + A.ox));
      w = Math.max(w, dx / Math.min(A.n.r, B.n.r));
    }
  }
  return w;
}
function tightestGap(kids) {
  let g = Infinity;
  for (let a = 0; a < kids.length; a++) {
    for (let b = a + 1; b < kids.length; b++) {
      const A = kids[a], B = kids[b];
      const d = Math.hypot((B.n.x + B.ox) - (A.n.x + A.ox), (B.n.y + B.oy) - (A.n.y + A.oy));
      g = Math.min(g, (d - (A.n.r + B.n.r)) / Math.min(A.n.r, B.n.r));
    }
  }
  return g === Infinity ? 0 : g;
}

function run(levelName, opts = {}) {
  const { aspect = 0.5, level = DIFF_DEFAULT, tilt = DIFF_TILT_DEG, dt = 1 / 60, maxS = 12 } = opts;
  const root = getLineage(levelName);
  if (!root) return null;
  const h = hierarchy(root).sum((d) => d.value ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const nodes = pack().size([SIZE, SIZE]).padding(8)(h).descendants();
  relayoutMobile(nodes, aspect, level, tilt);

  const out = [];
  for (const P of nodes.filter((n) => n.depth === 1)) {
    const kids = unlockStart(P);
    if (kids.length < 2) continue;
    let t = 0, still = 0, apart = null, rest = null, peak = worstOverlap(kids);
    while (t < maxS) {
      const moved = unlockStep(kids, P, dt);
      t += dt;
      const ov = worstOverlap(kids);
      peak = Math.max(peak, ov);
      const side = widestSideways(kids);
      if (apart === null && side >= SPREAD) apart = t;
      if (apart !== null && side < SPREAD) apart = null; // must STAY apart
      still = moved < UNLOCK_REST * P.r ? still + dt : 0;
      if (still > REST_SECONDS && rest === null) { rest = t; break; }
    }
    out.push({
      level: levelName, parent: P.data.name, n: kids.length,
      R: +P.r.toFixed(1),
      apart: apart === null ? null : +apart.toFixed(2),
      rest: rest === null ? null : +rest.toFixed(2),
      peakOverlap: +peak.toFixed(4),
    });
  }
  return out;
}

// ------------------------------------------------------------------ report
const names = levelNames.length ? levelNames : ["Celtic Hound", "Celtic Heeler"];
const byCount = new Map();
for (const nm of names) {
  let rows;
  try { rows = run(nm); } catch { continue; }
  if (!rows) continue;
  for (const r of rows) {
    if (!byCount.has(r.n)) byCount.set(r.n, []);
    byCount.get(r.n).push(r);
  }
}

console.log("Unlock settling times. Real tree, real pack, relayoutMobile applied, depth-1 parent.");
console.log("aspect 0.5, difficulty " + DIFF_DEFAULT + ", tilt " + DIFF_TILT_DEG + ", dt 1/60, cap 12s.\n");
console.log("children | cases | spread median | spread worst | rest median | rest worst | peak overlap");
console.log("---------|-------|--------------|-------------|-------------|------------|-------------");
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
for (const k of [...byCount.keys()].sort()) {
  const rows = byCount.get(k);
  const ap = rows.map((r) => r.apart).filter((v) => v !== null);
  const re = rows.map((r) => r.rest).filter((v) => v !== null);
  const ov = rows.map((r) => r.peakOverlap);
  console.log(
    String(k).padEnd(9) + "| " + String(rows.length).padEnd(6) +
    "| " + String(med(ap) ?? "none").padEnd(13) +
    "| " + String(ap.length ? Math.max(...ap) : "none").padEnd(12) +
    "| " + String(med(re) ?? "none").padEnd(12) +
    "| " + String(re.length ? Math.max(...re) : "none").padEnd(11) +
    "| " + Math.max(...ov).toFixed(4)
  );
}
// The ones that actually feel slow. Rest, not spread, is what a person waits for.
const all = [];
for (const k of byCount.keys()) all.push(...byCount.get(k));
const slow = all.filter((r) => r.rest !== null).sort((a, b) => b.rest - a.rest).slice(0, 8);
console.log("\nSlowest to come to rest:");
for (const r of slow) console.log("  " + r.rest.toFixed(2) + "s  " + r.level + " > " + r.parent + "  (" + r.n + " children)");

const never = [];
for (const k of byCount.keys()) for (const r of byCount.get(k)) if (r.apart === null) never.push(r);
if (never.length) {
  console.log("\nNEVER SLID SHOULDER TO SHOULDER within the cap:");
  for (const r of never.slice(0, 10)) console.log("  " + r.level + " > " + r.parent + " (" + r.n + " children)");
}
