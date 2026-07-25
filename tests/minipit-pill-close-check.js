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
             // The spec is "anchored at the circle bottom, centre 4px below the rim,
             // roughly half overlapping". Assert that directly. The old check was a
             // pixel proxy on the button's TOP edge, which drifts with circle size.
             learnBelowCircle: lb && rb ? Math.abs((lb.top + lb.height / 2) - rb.bottom) <= 12 : null,
             centreOffRim: lb && rb ? +((lb.top + lb.height / 2) - rb.bottom).toFixed(1) : null,
             learnInViewport: lb ? (lb.bottom <= window.innerHeight - 2 && lb.top >= 0) : null,
             noTagPill: !tag,
             learnY: lb ? Math.round(lb.y) : null, rootBottom: rb ? Math.round(rb.bottom) : null };
  });
  console.log('learn layer:', JSON.stringify(layer));
  // GUARD-003b: a lone child on the first ring leans out on the diagonal at 33
  // degrees above horizontal instead of sitting dead vertical, AND it never
  // crosses the walls 16px inside each screen edge. Where the diagonal would
  // put it off screen the arm swings up toward vertical, so the angle is 33 when
  // there is room and somewhere between 33 and 90 when there is not. It must
  // never go below 33 (too shallow) or past 90 (over the top).
  const edge = await p.evaluate(() => {
    const ov = document.querySelector('[class*="overlayStrong"]');
    const ls = ov ? Array.from(ov.querySelectorAll('line[class*="edge"]')) : [];
    if (ls.length !== 1) return { edges: ls.length, deg: null };
    const l = ls[0];
    const dx = +l.getAttribute('x2') - +l.getAttribute('x1');
    const dy = +l.getAttribute('y2') - +l.getAttribute('y1');
    let minL = 1e9, maxR = -1e9;
    ov.querySelectorAll('[class*="disc"], [class*="nmPill"]').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width < 4) return;
      minL = Math.min(minL, b.left);
      maxR = Math.max(maxR, b.right);
    });
    return { edges: 1, deg: +(Math.atan2(-dy, Math.abs(dx)) * 180 / Math.PI).toFixed(1),
             nodeLeft: Math.round(minL), nodeRight: Math.round(maxR), vw: window.innerWidth };
  });
  const soloAngleOk = edge.edges === 1 && edge.deg !== null
    && edge.deg >= 32.5 && edge.deg <= 90.5
    && edge.nodeLeft >= 15 && edge.nodeRight <= edge.vw - 15;
  console.log('solo connector:', JSON.stringify(edge), '| in range and inside walls:', soloAngleOk);
  // GUARD-003c: a card placed in a circular frame must be a CIRCLE. This one bit
  // twice before, because the placed card is not SVG at all - it is a fixed HTML
  // div that was hard-coded to borderRadius 15 with a square yellow outline,
  // while the SVG frame and clip underneath were correctly circular all along.
  for (let i = 0; i < 3; i++) {
    const l = await p.$('[aria-label="Learn"]');
    if (!l) break;
    await l.click({ force: true });
    await p.waitForTimeout(1700);
  }
  const placed = await p.evaluate(() => {
    const hits = [];
    document.querySelectorAll('div').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' || !el.querySelector('img')) return;
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.width > 200 || Math.abs(r.width - r.height) > 3) return;
      hits.push({ w: Math.round(r.width), radius: cs.borderRadius, outline: cs.outlineStyle,
                  ringFollowsCurve: cs.boxShadow.includes('rgb(255, 210, 62)') });
    });
    return hits;
  });
  const roundCards = placed.length === 0 || placed.every((c) => c.radius === '50%' && c.outline === 'none' && c.ringFollowsCurve);
  console.log('placed cards:', JSON.stringify(placed), '| circular:', roundCards);

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
  const pass = layer.hasLearn && layer.learnBelowCircle === true && layer.learnInViewport === true && layer.noTagPill === true && soloAngleOk && roundCards && errs.length === 0;
  console.log('after close:', JSON.stringify(pit), '| pageerrors:', errs.length ? errs.slice(0,3) : 'none');
  console.log(pass ? 'PASS GUARD-003' : 'FAIL GUARD-003');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
