// GUARD-002: mini pit (Matter migration) - circles must drop under gravity and settle.
// Bug class: physics engine not stepping / bodies not syncing to render bridge.
// Run with dev server up: node tests/minipit-drop-check.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.getByRole('button', { name: 'View Old English Bulldog family tree' }).click();
  const pos = () => p.evaluate(() => {
    const svg = document.querySelector('[role="dialog"] svg');
    const c = svg && svg.querySelectorAll('circle')[1];
    const t = c && c.getAttribute('transform');
    const m = t && t.match(/-?[\d.]+/g);
    return m ? { x: +m[0], y: +m[1] } : null;
  });
  await p.waitForTimeout(2500); // entrance, pre-drop
  const a = await pos();
  await p.waitForTimeout(5100); // hold + drop + bounces
  const c1 = await pos();
  await p.waitForTimeout(2000);
  const c2 = await pos();
  const fell = a && c1 && (c1.y - a.y) > 50; // moved well down the stage
  const settled = c1 && c2 && Math.hypot(c2.x - c1.x, c2.y - c1.y) < 2; // near-still
  console.log('fell:', fell, '| settled:', settled, '| pageerrors:', errs.length ? errs : 'none');
  const pass = !!(fell && settled && errs.length === 0);
  console.log(pass ? 'PASS GUARD-002' : 'FAIL GUARD-002');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
