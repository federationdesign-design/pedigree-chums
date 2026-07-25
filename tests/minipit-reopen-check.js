// GUARD-005: mini pit layout must be identical on every open, and the in-pit UI
// squares must match the main pit's size formula.
// Bug class: layoutAspect frozen from the unmeasured aspect placeholder (1),
// which clamped to 0.85 instead of the real ~0.45 and packed the circles about
// half size. Which value you got was a race, so the first open looked right and
// every reopen came back shrunk.
// Main pit reference: BIG = 84 * SCALE, menu square = BIG * 1.2,
// SCALE = 0.67 at 768px and below. So 67.5px mobile, 100.8px desktop.
// Run with dev server up: node tests/minipit-reopen-check.js
const { chromium } = require('playwright');

const readLayout = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  if (!svg) return null;
  const radii = Array.from(svg.querySelectorAll('circle'))
    .slice(0, 4)
    .map((c) => +(+c.getAttribute('r')).toFixed(1));
  // the UI squares are the only rects painted yellow at this point. The inline
  // style is a CSS var, so match on the computed value, not the attribute text.
  const sq = Array.from(svg.querySelectorAll('rect')).find(
    (r) => getComputedStyle(r).fill === 'rgb(255, 210, 62)' && r.getAttribute('rx'),
  );
  let square = null;
  if (sq) {
    const b = sq.getBoundingClientRect();
    square = {
      px: Math.round(b.width),
      radiusRatio: +(parseFloat(sq.getAttribute('rx')) / parseFloat(sq.getAttribute('width'))).toFixed(2),
    };
  }
  return { radii, square };
};

(async () => {
  const b = await chromium.launch();
  const results = [];
  for (const vp of [{ width: 390, height: 844, want: 67.5 }, { width: 1280, height: 900, want: 100.8 }]) {
    const p = await b.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
    await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(6000);
    const opens = [];
    for (let i = 0; i < 3; i++) {
      await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click();
      await p.waitForTimeout(2800);
      opens.push(await p.evaluate(readLayout));
      await p.keyboard.press('Escape');
      await p.waitForTimeout(1000);
    }
    const first = JSON.stringify(opens[0] && opens[0].radii);
    const stable = opens.every((o) => o && JSON.stringify(o.radii) === first) && opens[0].radii[1] > 0;
    const sq = opens[0].square;
    const sized = !!sq && Math.abs(sq.px - vp.want) <= 2;
    const rounded = !!sq && Math.abs(sq.radiusRatio - 0.3) <= 0.01;
    console.log(`${vp.width}x${vp.height} radii:`, first, '| stable:', stable);
    console.log(`  square:`, JSON.stringify(sq), '| want', vp.want + 'px @0.3 ->', 'sized:', sized, 'rounded:', rounded);
    results.push(stable && sized && rounded && errs.length === 0);
    if (errs.length) console.log('  pageerrors:', errs.slice(0, 3));
    await p.close();
  }
  const pass = results.every(Boolean);
  console.log(pass ? 'PASS GUARD-005' : 'FAIL GUARD-005');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
