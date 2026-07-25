// GUARD-010: themed level background in the mini pit.
//   a) an era with artwork gets the background; it is off screen before START
//      and fully home after, and it sits BELOW the circles
//   b) an era without artwork is untouched (still the flat blue gradient)
//   c) the drawn ground and the physics agree: after the drop every circle
//      rests on the surface of the ground art at its own x, not on a flat line
//   d) the floor really is uneven, and higher on the right than the left
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
const LIFT = 10;

const readLevel = () => {
  const layer = document.querySelector('[class*="level"][aria-hidden="true"]');
  const bg = layer && layer.querySelector('img[src*="ancient-bg"]');
  const floor = layer && layer.querySelector('img[src*="ancient-floor"]');
  const svg = document.querySelector('[role="dialog"] svg');
  const st = svg && svg.parentElement.getBoundingClientRect();
  return {
    present: !!layer,
    hasBg: !!bg,
    // vertical position of the layer's box: parked is entirely below the fold,
    // home is flush with the top. Rotation inflates the box, so measure top,
    // not left.
    top: layer ? Math.round(layer.getBoundingClientRect().top) : null,
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

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000); // hydration: a click before this is a no-op
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click({ timeout: 60000 });
  await p.locator('[aria-label="Start"]').waitFor({ timeout: 15000 });

  // a) present but parked off screen before START
  const before = await p.evaluate(readLevel);
  const parked = before.present && before.hasBg && before.top >= before.vh;
  const behind = Number(before.layerZ) < Number(before.stageZ);

  await p.locator('[aria-label="Start"]').click({ force: true });
  await p.waitForTimeout(1200);
  const after = await p.evaluate(readLevel);
  const home = Math.abs(after.top) <= 1;

  // c + d) the drop, then where everything came to rest
  await p.waitForTimeout(6000);
  const circles = await p.evaluate(restingCircles);
  const st = after;
  const bandPx = st.stageW / ASPECT;
  const deepest = Math.max(...PROFILE);
  const surfaceAt = (x) => {
    const i = Math.min(PROFILE.length - 1, Math.max(0, Math.floor((x / st.stageW) * PROFILE.length)));
    // px above the stage bottom
    return LIFT + bandPx * (deepest - PROFILE[i]);
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
  await p2.locator('[aria-label="Start"]').waitFor({ timeout: 15000 });
  const other = await p2.evaluate(readLevel);
  const untouched = !other.present;

  console.log('before START: parked', parked, 'top', before.top, 'of', before.vh, '| under the stage:', behind, before.layerZ, 'vs', before.stageZ);
  console.log('after START: home', home, '| floor band', after.floorH, 'px, top at', after.floorTop);
  console.log('gaps to the drawn surface px:', JSON.stringify(gaps), '| landed', JSON.stringify(landed), '-> on surface:', onSurface, '| nothing sunk:', nothingSunk);
  console.log('surface rises to the right:', uneven, '| untouched era clean:', untouched, '| pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(parked && behind && home && onSurface && uneven && untouched && errs.length === 0);
  console.log(pass ? 'PASS GUARD-010' : 'FAIL GUARD-010');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
