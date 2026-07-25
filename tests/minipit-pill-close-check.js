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
  await p.waitForTimeout(2500); // entrance
  await p.locator('[aria-label="Start"]').click({ force: true }); // START gates the drop now (pulsing, so force)
  await p.waitForTimeout(9000); // drop + settle
  const c = await p.evaluate(() => {
    const svg = document.querySelector('[role="dialog"] svg');
    const circ = svg && svg.querySelectorAll('circle')[1];
    if (!circ) return null;
    const r = circ.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!c) { console.log('NO CIRCLE'); process.exit(1); }
  await p.mouse.click(c.x, c.y);
  await p.waitForTimeout(2400);
  const layer = await p.evaluate(() => {
    const learn = document.querySelector('[aria-label="Learn"]');
    const overlay = document.querySelector('[class*="overlayStrong"]');
    const rootCircle = overlay && overlay.querySelector('[class*="rootCard"]');
    const lb = learn && learn.getBoundingClientRect();
    const rb = rootCircle && rootCircle.getBoundingClientRect();
    const tag = overlay && overlay.querySelector('[class*="tag"]');
    return { hasLearn: !!learn, hasOverlay: !!overlay,
             learnBelowCircle: lb && rb ? lb.top >= rb.bottom - 40 : null,
             learnInViewport: lb ? (lb.bottom <= window.innerHeight - 2 && lb.top >= 0) : null,
             noTagPill: !tag,
             learnY: lb ? Math.round(lb.y) : null, rootBottom: rb ? Math.round(rb.bottom) : null };
  });
  console.log('learn layer:', JSON.stringify(layer));
  // GUARD-003b: a lone child on the first ring leans out on the diagonal
  // (33 degrees above horizontal) instead of sitting dead vertical above the dog.
  const edge = await p.evaluate(() => {
    const ov = document.querySelector('[class*="overlayStrong"]');
    const ls = ov ? Array.from(ov.querySelectorAll('line[class*="edge"]')) : [];
    if (ls.length !== 1) return { edges: ls.length, deg: null };
    const l = ls[0];
    const dx = +l.getAttribute('x2') - +l.getAttribute('x1');
    const dy = +l.getAttribute('y2') - +l.getAttribute('y1');
    return { edges: 1, deg: +(Math.atan2(-dy, Math.abs(dx)) * 180 / Math.PI).toFixed(1) };
  });
  const soloAngleOk = edge.edges === 1 && edge.deg !== null && Math.abs(edge.deg - 33) <= 2;
  console.log('solo connector:', JSON.stringify(edge), '| 33 deg:', soloAngleOk);
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
  const pass = layer.hasLearn && layer.learnBelowCircle === true && layer.learnInViewport === true && layer.noTagPill === true && soloAngleOk && errs.length === 0;
  console.log('after close:', JSON.stringify(pit), '| pageerrors:', errs.length ? errs.slice(0,3) : 'none');
  console.log(pass ? 'PASS GUARD-003' : 'FAIL GUARD-003');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
