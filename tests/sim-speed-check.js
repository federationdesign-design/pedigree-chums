// GUARD-001: physics sim speed must be 1.00x wall clock on any display.
// Bug class: Matter.Runner ticked per-rAF with delta clamped >=16.666ms,
// running the pit at 2x on 120Hz screens. Fixed by fixedTimestep.ts.
// Run: start dev server, then `node tests/sim-speed-check.js`. PASS = 0.95-1.05.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:3000/?simdebug=1', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(13000); // entrance + drops + warm-up
  const txt = await p.locator('text=sim speed').textContent().catch(() => null);
  const r = txt ? parseFloat(txt.replace('sim speed x', '')) : NaN;
  const pass = r >= 0.95 && r <= 1.05 && errs.length === 0;
  console.log((pass ? 'PASS' : 'FAIL') + ' GUARD-001 sim-speed: ' + txt + (errs.length ? ' | pageerrors: ' + errs.join('; ') : ''));
  await b.close();
  process.exit(pass ? 0 : 1);
})();
