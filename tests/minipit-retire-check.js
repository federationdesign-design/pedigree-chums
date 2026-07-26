// GUARD-007: mini pit, things that should not come back, and the info pair.
//   a) the Union Jack is retired for the session once its message is opened,
//      so later rounds drop the ball only
//   b) the tennis ball is retired once the player throws it clear of the top,
//      the main pit rule: released with real upward speed, then exits the stage.
//      A ball merely bounced up by physics must NOT count
//   c) the info square and the blue box are one on/off pair: opening the box
//      takes the square out of the pit, closing the box puts it back
// Run with dev server up: node tests/minipit-retire-check.js
const { chromium } = require('playwright');

const toys = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  if (!svg) return [];
  return Array.from(svg.querySelectorAll('image'))
    .filter((i) => /tennis-ball|uk-icon/.test(i.getAttribute('href') || ''))
    .map((i) => ({
      kind: /uk-icon/.test(i.getAttribute('href')) ? 'flag' : 'ball',
      shown: (i.closest('g').style.display || '') !== 'none' && i.getBoundingClientRect().width > 1,
    }))
    .filter((t) => t.shown)
    .map((t) => t.kind)
    .sort();
};
const centreOf = (re) => {
  const svg = document.querySelector('[role="dialog"] svg');
  const i = Array.from(svg.querySelectorAll('image')).find((x) => re.test(x.getAttribute('href') || ''));
  if (!i) return null;
  const r = i.getBoundingClientRect();
  return r.width < 1 ? null : { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

  const round = async (breed) => {
    await p.getByRole('button', { name: 'View ' + breed + ' family tree' }).click();
    await p.waitForTimeout(2700);
    const s = await p.$('[aria-label="Play"]');
    if (s) await s.click({ force: true });
    await p.waitForTimeout(12000);
    return p.evaluate(toys);
  };
  const close = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(1300); };

  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000);

  const r1 = await round('Celtic Hound');
  const bothFirst = r1.join(',') === 'ball,flag';

  // c) info square and blue box are an on/off pair
  const descVisible = () => p.evaluate(() => {
    const svg = document.querySelector('[role="dialog"] svg');
    const gs = Array.from(svg.querySelectorAll('g'));
    // the info square is the navy-icon square carrying the org-chart glyph
    const g = gs.find((x) => x.querySelector('rect') && x.querySelector('path[d*="M12 6v4"]'));
    if (!g) return null;
    return (g.style.display || '') !== 'none';
  });
  const beforeOpen = await descVisible();
  // a real click, not a synthetic PointerEvent: startDrag calls
  // setPointerCapture, which needs a genuine pointer id
  await p.locator('path[d*="M12 6v4"]').click({ force: true });
  await p.waitForTimeout(800);
  const whileOpen = await descVisible();
  const boxOpen = await p.evaluate(() => !!document.querySelector('[class*="asideDocked"]')
    && getComputedStyle(document.querySelector('[class*="asideDocked"]')).display !== 'none');
  console.log('info square before open:', beforeOpen, '| while box open:', whileOpen, '| box showing:', boxOpen);
  const pairOk = beforeOpen === true && whileOpen === false && boxOpen === true;

  // a) retire the flag by reading its message
  // The flag rolls, and a tap that lands mid-bounce is read as a drag rather
  // than a tap. Retrying alone was not enough: wait for the flag to come to
  // rest first, then click the element, and only then retry.
  const flagStill = async () => {
    let last = null;
    for (let i = 0; i < 24; i++) { // up to ~6s
      const el = await p.$('image[href*="uk-icon"]');
      if (!el) return null;
      const b = await el.boundingBox();
      if (b && last && Math.hypot(b.x - last.x, b.y - last.y) < 1.5) return el;
      last = b;
      await p.waitForTimeout(250);
    }
    return await p.$('image[href*="uk-icon"]');
  };
  for (let attempt = 0; attempt < 6; attempt++) {
    const already = await p.$('[aria-label="Got it"]');
    if (already) break;
    const flagEl = await flagStill();
    if (!flagEl) break;
    await flagEl.click({ force: true });
    await p.waitForTimeout(700);
  }
  const tick = await p.$('[aria-label="Got it"]');
  if (tick) { await tick.click(); await p.waitForTimeout(700); }
  const flagKey = await p.evaluate(() => sessionStorage.getItem('pc-minipit-flag-seen'));
  await close();

  const r2 = await round('Celtic Heeler');
  const flagRetired = r2.join(',') === 'ball';
  await close();

  // b) retire the ball by throwing it out of the top
  await round('Celtic Hound');
  // the ball is bouncy, so re-read its centre immediately before each attempt
  for (let attempt = 0; attempt < 3; attempt++) {
    const done = await p.evaluate(() => sessionStorage.getItem('pc-minipit-ball-gone') === '1');
    if (done) break;
    const ball = await p.evaluate(centreOf, /tennis-ball/);
    if (!ball) break;
    await p.mouse.move(ball.x, ball.y);
    await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(ball.x, ball.y - i * 55); await p.waitForTimeout(16); }
    await p.mouse.up();
    await p.waitForTimeout(2500);
  }
  const ballKey = await p.evaluate(() => sessionStorage.getItem('pc-minipit-ball-gone'));
  await close();

  const r3 = await round('Celtic Heeler');
  const bothRetired = r3.length === 0;

  console.log('round 1:', JSON.stringify(r1), '| round 2:', JSON.stringify(r2), '| round 3:', JSON.stringify(r3));
  console.log('flag key:', flagKey, '| ball key:', ballKey);
  console.log('both first:', bothFirst, '| flag retired:', flagRetired, '| both retired:', bothRetired, '| info pair:', pairOk);

  const pass = !!(bothFirst && pairOk && flagKey === '1' && flagRetired
    && ballKey === '1' && bothRetired && errs.length === 0);
  if (errs.length) console.log('pageerrors:', errs.slice(0, 3));
  console.log(pass ? 'PASS GUARD-007' : 'FAIL GUARD-007');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
