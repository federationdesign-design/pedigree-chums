// GUARD-003: learn layer - Learn button renders ABOVE the circle, and closing
// the layer drops the breed's name pill into the pit as a live physics body.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0,200)));
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000); // cold compile headroom
  await p.getByRole('button', { name: 'View Old English Bulldog family tree' }).click();
  await p.waitForTimeout(9000); // entrance + drop + settle
  const c = await p.evaluate(() => {
    const svg = document.querySelector('[role="dialog"] svg');
    const circ = svg && svg.querySelectorAll('circle')[1];
    if (!circ) return null;
    const r = circ.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!c) { console.log('NO CIRCLE'); process.exit(1); }
  await p.mouse.click(c.x, c.y);
  await p.waitForTimeout(1800);
  const layer = await p.evaluate(() => {
    const learn = document.querySelector('[aria-label="Learn"]');
    const overlay = document.querySelector('[class*="overlayStrong"]');
    const rootCircle = overlay && overlay.querySelector('[class*="rootCard"]');
    const lb = learn && learn.getBoundingClientRect();
    const rb = rootCircle && rootCircle.getBoundingClientRect();
    const tag = overlay && overlay.querySelector('[class*="tag"]');
    const tb = tag && tag.getBoundingClientRect();
    return { hasLearn: !!learn, hasOverlay: !!overlay,
             learnOverlapsRim: lb && rb ? (lb.top < rb.top && lb.bottom > rb.top) : null,
             pillAboveLearn: tb && lb ? tb.bottom <= lb.top + 6 : null,
             learnY: lb ? Math.round(lb.y) : null, rootTop: rb ? Math.round(rb.y) : null };
  });
  console.log('learn layer:', JSON.stringify(layer));
  await p.evaluate(() => {
    const overlay = document.querySelector('[class*="overlayStrong"]');
    const x = overlay && overlay.querySelector('button[class*="close"]');
    if (x) x.click();
  });
  await p.waitForTimeout(2500);
  const pit = await p.evaluate(() => {
    const svg = document.querySelector('[role="dialog"] svg');
    const texts = svg ? Array.from(svg.querySelectorAll('text')).map(t => t.textContent) : [];
    const navyRects = svg ? Array.from(svg.querySelectorAll('rect')).filter(r => (r.getAttribute('style') || '').includes('rgb(10, 58, 87)') || (r.style && r.style.fill === 'rgb(10, 58, 87)')).length : 0;
    return { navyRects, hasNamePillText: texts.includes('Old English Bulldog') };
  });
  const pass = layer.hasLearn && layer.learnOverlapsRim === true && layer.pillAboveLearn === true && pit.navyRects >= 1 && errs.length === 0;
  console.log('after close:', JSON.stringify(pit), '| pageerrors:', errs.length ? errs.slice(0,3) : 'none');
  console.log(pass ? 'PASS GUARD-003' : 'FAIL GUARD-003');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
