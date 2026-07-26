// GUARD-010: themed level background in the mini pit.
//   a) an era with artwork gets the background; it is off screen before START
//      and fully home after, and it sits BELOW the circles
//   b) an era without artwork is untouched (still the flat blue gradient)
//   c) the drawn ground and the physics agree: after the drop every circle
//      rests on the surface of the ground art at its own x, not on a flat line
//   d) the floor really is uneven, and higher on the right than the left
//   e) the seam: the level's clip edge and the LEARN wash's leading edge are
//      the same line, so the two states tile the screen instead of overlapping
//      or leaving a wedge. Checked at two viewport sizes.
// Run with dev server up: node tests/minipit-level-check.js
const { chromium } = require('playwright');

// the sampled surface, as a fraction of the strip's own height, from
// data/levelThemes.ts. Kept here deliberately: if the two drift, this fails.
const PROFILE = [
  0.0696, 0.1043, 0.0957, 0.0957, 0.087, 0.087, 0.0783, 0.0783,
  0.0696, 0.0696, 0.0609, 0.0609, 0.0522, 0.0522, 0.0435, 0.0435,
  0.0348, 0.0261, 0.0261, 0.0174, 0.0174, 0.0087, 0.0087, 0.0,
];
const ASPECT = 567.5 / 57.6;
// LEVEL_FLOOR_SHOW in BreedTree.tsx: 1 means the strip is drawn exactly as
// exported, its bottom edge on the bottom of the stage
const SHOW = 1;

const readLevel = () => {
  const layer = document.querySelector('[class*="level"][aria-hidden="true"]');
  const bg = layer && layer.querySelector('img[src*="ancient-bg"]');
  const floor = layer && layer.querySelector('img[src*="ancient-floor"]');
  const svg = document.querySelector('[role="dialog"] svg');
  const st = svg && svg.parentElement.getBoundingClientRect();
  return {
    present: !!layer,
    hasBg: !!bg,
    // the layer is fixed and full-screen; what moves is the clip. Parked shows
    // no pixels of it, home shows all of them.
    clipArea: layer ? (() => {
      const n = (getComputedStyle(layer).clipPath.match(/-?[\d.]+px/g) || []).map(parseFloat);
      if (n.length < 8) return null;
      let a = 0;
      for (let i = 0; i < 4; i++) {
        const [x1, y1] = [n[i * 2], n[i * 2 + 1]];
        const [x2, y2] = [n[((i + 1) % 4) * 2], n[((i + 1) % 4) * 2 + 1]];
        a += x1 * y2 - x2 * y1;
      }
      // how much of the viewport the clip actually admits
      const vw = window.innerWidth, vh = window.innerHeight;
      const inside = (x, y) => {
        const dx = n[2] - n[0], dy = n[3] - n[1];
        return (x - n[0]) * dy - (y - n[1]) * dx <= 0;
      };
      const corners = [[0, 0], [vw, 0], [vw, vh], [0, vh]].filter(([x, y]) => inside(x, y));
      return corners.length;
    })() : null,
    vh: window.innerHeight,
    floorTop: floor ? +floor.getBoundingClientRect().top.toFixed(1) : null,
    floorH: floor ? +floor.getBoundingClientRect().height.toFixed(1) : null,
    stageW: st ? +st.width.toFixed(1) : null,
    stageBottom: st ? +st.bottom.toFixed(1) : null,
    // z-order: the layer must paint under the stage
    layerZ: layer ? getComputedStyle(layer).zIndex : null,
    stageZ: svg ? getComputedStyle(svg.parentElement).zIndex : null,
  };
};

const restingCircles = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  return Array.from(svg.querySelectorAll('circle'))
    .slice(1)
    .map((c) => c.getBoundingClientRect())
    .filter((r) => r.width > 20)
    .map((r) => ({ cx: +(r.x + r.width / 2).toFixed(1), bottom: +r.bottom.toFixed(1) }));
};

// Both halves cannot be shown at once in the UI, so the wash is put into its
// peek declaration inline, measured through the matrix the browser computes for
// it, and put back. The transition has to be killed first or the computed value
// is whatever the tween happens to be holding.
const seamLines = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const wash = document.querySelector('[class*="learnWash"]');
  const level = document.querySelector('[class*="level"][aria-hidden="true"]');
  if (!wash || !level) return null;
  const had = wash.style.transform, hadT = wash.style.transition;
  wash.style.transition = 'none';
  wash.style.transform = 'rotate(-18deg) translate3d(46%, -22%, 0)';
  void wash.offsetWidth;
  const m = new DOMMatrix(getComputedStyle(wash).transform);
  const Wp = wash.offsetWidth, Hp = wash.offsetHeight;
  const ox = Wp / 2, oy = Hp / 2;
  const map = (x, y) => {
    const q = m.transformPoint(new DOMPoint(x - ox, y - oy));
    return { x: q.x + ox - 0.6 * vw, y: q.y + oy - 0.6 * vh };
  };
  const w1 = map(0, 0), w2 = map(0, Hp);
  wash.style.transform = had;
  wash.style.transition = hadT;
  const raw = (getComputedStyle(level).clipPath.match(/-?[\d.]+px/g) || []).map(parseFloat);
  if (raw.length < 4) return null;
  const l1 = { x: raw[0], y: raw[1] }, l2 = { x: raw[2], y: raw[3] };
  const ang = (a, b) => (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
  const dist = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / Math.hypot(dx, dy);
  };
  return {
    washAngle: +ang(w1, w2).toFixed(2),
    levelAngle: +ang(l1, l2).toFixed(2),
    gap: Math.max(dist(l1, w1, w2), dist(l2, w1, w2)),
  };
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000); // hydration: a click before this is a no-op
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click({ timeout: 60000 });
  await p.locator('[aria-label="Play"]').waitFor({ timeout: 15000 });

  // a) present but parked off screen before START
  const before = await p.evaluate(readLevel);
  const parked = before.present && before.hasBg && before.clipArea === 0;
  const behind = Number(before.layerZ) < Number(before.stageZ);

  // e) the seam, at a tall viewport and a wide one
  const seams = [];
  for (const size of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await p.setViewportSize(size);
    await p.waitForTimeout(700);
    // A resize drops the hover, and the clip is a 560ms transition, so a naive
    // read catches either the parked state or a tween. Hover, wait for the clip
    // to stop moving, and only accept a reading that is actually at the seam;
    // retry the hover if it did not take.
    let reading = null;
    for (let attempt = 0; attempt < 4 && !reading; attempt++) {
      await p.locator('[aria-label="Play"]').hover({ force: true });
      let last = null;
      for (let i = 0; i < 20; i++) {
        const now = await p.evaluate(() => getComputedStyle(document.querySelector('[class*="level"][aria-hidden="true"]')).clipPath);
        if (last === now) break;
        last = now;
        await p.waitForTimeout(150);
      }
      const r = await p.evaluate(seamLines);
      if (r && r.gap < 50) reading = r; // anything larger means it never peeked
      else await p.mouse.move(2, 2);
    }
    seams.push({ size: size.width + 'x' + size.height, ...(reading || { gap: null }) });
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(700);
  const seamOk = seams.length === 2 && seams.every(
    (s) => s && s.gap < 2 && Math.abs(s.washAngle - s.levelAngle) < 0.1
  );

  await p.locator('[aria-label="Play"]').click({ force: true });
  await p.waitForTimeout(1200);
  const after = await p.evaluate(readLevel);
  const home = after.clipArea === 4;

  // c + d) the drop, then where everything came to rest
  await p.waitForTimeout(6000);
  const circles = await p.evaluate(restingCircles);
  const st = after;
  const bandPx = st.stageW / ASPECT;
  const surfaceAt = (x) => {
    const i = Math.min(PROFILE.length - 1, Math.max(0, Math.floor((x / st.stageW) * PROFILE.length)));
    // px above the stage bottom
    return bandPx * (SHOW - PROFILE[i]);
  };
  // Every circle in the SVG is measured, but only the top-level ones are
  // physics bodies; the nested ones ride inside their parents well above the
  // floor. So: nothing anywhere may sink through the drawn surface, and the
  // ones that came to rest on it must be sitting on it, not hovering.
  const gaps = circles.map((c) => +(st.stageBottom - c.bottom - surfaceAt(c.cx)).toFixed(1));
  const nothingSunk = gaps.every((g) => g > -6);
  const landed = gaps.filter((g) => g < 60);
  const onSurface = nothingSunk && landed.length >= 2 && landed.every((g) => g < 12);

  const uneven = surfaceAt(st.stageW * 0.9) - surfaceAt(st.stageW * 0.1) > 2;

  // b) an era with no artwork keeps the plain gradient
  const p2 = await b.newPage({ viewport: { width: 390, height: 844 } });
  p2.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p2.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(7000);
  await p2.getByRole('button', { name: 'View Old English Bulldog family tree' }).click({ timeout: 60000 });
  await p2.locator('[aria-label="Play"]').waitFor({ timeout: 15000 });
  const other = await p2.evaluate(readLevel);
  const untouched = !other.present;

  console.log('before START: parked', parked, '(corners admitted', before.clipArea + ')', '| under the stage:', behind, before.layerZ, 'vs', before.stageZ);
  console.log('after START: covers all', home, '| floor band', after.floorH, 'px, top at', after.floorTop);
  console.log('gaps to the drawn surface px:', JSON.stringify(gaps), '| landed', JSON.stringify(landed), '-> on surface:', onSurface, '| nothing sunk:', nothingSunk);
  console.log('seam:', seamOk, JSON.stringify(seams));
  console.log('surface rises to the right:', uneven, '| untouched era clean:', untouched, '| pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(parked && behind && home && seamOk && onSurface && uneven && untouched && errs.length === 0);
  console.log(pass ? 'PASS GUARD-010' : 'FAIL GUARD-010');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
