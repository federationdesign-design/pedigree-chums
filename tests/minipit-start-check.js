// GUARD-004: mini pit intro. Three bug classes fixed together:
//   a) nothing may fall before START is pressed (no auto-drop timer)
//   b) the yellow % badges must not move between the entrance and the drop
//      (they used to render from a stale view, appear up-left, then snap right)
//   c) every breed label must sit inside its own circle at any name length
// Run with dev server up: node tests/minipit-start-check.js
const { chromium } = require('playwright');

const probe = () => ({
  // first depth-1 circle transform, in viewBox units
  circle: (() => {
    const svg = document.querySelector('[role="dialog"] svg');
    const c = svg && svg.querySelectorAll('circle')[1];
    const m = c && (c.getAttribute('transform') || '').match(/-?[\d.]+/g);
    return m ? { x: +m[0], y: +m[1] } : null;
  })(),
  // yellow badge chips, on-screen centres
  badges: (() => {
    const svg = document.querySelector('[role="dialog"] svg');
    if (!svg) return [];
    const gs = Array.from(svg.querySelectorAll('g')).filter((g) => {
      const c = g.firstElementChild;
      return c && c.tagName === 'circle' && (c.getAttribute('style') || '').includes('255, 210, 62');
    });
    return gs.map((g) => {
      const r = g.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
  })(),
  hasStart: !!document.querySelector('[aria-label="Play"]'),
});

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000); // cold compile headroom
  await p.getByRole('button', { name: 'View Old English Bulldog family tree' }).click();

  await p.waitForTimeout(2600); // entrance done
  const s1 = await p.evaluate(probe);
  await p.waitForTimeout(4000); // well past the old 2s auto-drop
  const s2 = await p.evaluate(probe);

  // a) still hanging, START still offered
  const inert = s1.circle && s2.circle && Math.hypot(s2.circle.x - s1.circle.x, s2.circle.y - s1.circle.y) < 2;
  const startShown = s1.hasStart && s2.hasStart;

  // b) badges pinned in place across the whole pre-drop window
  const badgesSteady =
    s1.badges.length > 0 &&
    s1.badges.length === s2.badges.length &&
    s1.badges.every((b1, i) => Math.hypot(s2.badges[i].x - b1.x, s2.badges[i].y - b1.y) < 2);

  // c) labels contained: every corner of each label box inside its circle
  const labels = await p.evaluate(() => {
    const svg = document.querySelector('[role="dialog"] svg');
    if (!svg) return null;
    const gs = svg.querySelectorAll('g');
    let circlesG = null;
    let labelsG = null;
    for (const g of gs) {
      if (!circlesG && g.querySelector(':scope > circle')) circlesG = g;
      if (!labelsG && g.querySelector(':scope > g > text tspan')) labelsG = g;
    }
    if (!circlesG || !labelsG) return null;
    const out = [];
    Array.from(labelsG.children).forEach((lg, i) => {
      const t = lg.querySelector('text');
      const c = circlesG.children[i];
      if (!t || !c || lg.style.display === 'none') return;
      // the true rotated ink box, not its axis-aligned bounds: take the four
      // getBBox corners through the element's own screen matrix
      const tm = t.getScreenCTM();
      const cm = c.getScreenCTM();
      if (!tm || !cm) return;
      const bb = t.getBBox();
      if (bb.width === 0) return;
      const cx = cm.e;
      const cy = cm.f;
      const r = parseFloat(c.getAttribute('r')) * Math.hypot(cm.a, cm.b);
      if (!r) return;
      let worst = 0;
      for (const x of [bb.x, bb.x + bb.width]) {
        for (const y of [bb.y, bb.y + bb.height]) {
          const px = tm.a * x + tm.c * y + tm.e;
          const py = tm.b * x + tm.d * y + tm.f;
          worst = Math.max(worst, Math.hypot(px - cx, py - cy) / r);
        }
      }
      out.push({ text: t.textContent, lines: t.querySelectorAll('tspan').length, fill: +worst.toFixed(2) });
    });
    return out;
  });

  const contained = !!labels && labels.length > 0 && labels.every((l) => l.fill <= 1);

  // START actually starts it
  await p.locator('[aria-label="Play"]').click({ force: true }); // pulses, so force
  await p.waitForTimeout(3000);
  const s3 = await p.evaluate(probe);
  const fell = s2.circle && s3.circle && s3.circle.y - s2.circle.y > 50;
  const startGone = !s3.hasStart;

  console.log('inert before START:', inert, '| START shown:', startShown);
  console.log('badges steady:', badgesSteady, JSON.stringify(s1.badges), '->', JSON.stringify(s2.badges));
  console.log('labels:', JSON.stringify(labels));
  console.log('fell after START:', fell, '| START cleared:', startGone, '| pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(inert && startShown && badgesSteady && contained && fell && startGone && errs.length === 0);
  console.log(pass ? 'PASS GUARD-004' : 'FAIL GUARD-004');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
