// GUARD-008: the start screen offers START and LEARN, and LEARN is a separate
// mode that never arms the pit.
//   a) LEARN sits right and high, START sits left and low
//   b) hovering LEARN slides the pink wash partway in (desktop preview)
//   c) choosing LEARN brings the wash fully in, opens the blue box, hides both
//      words, and leaves the pit completely inert
//   d) the wash blends in 'overlay', so dogs and chrome tint rather than vanish
//   e) closing the blue box returns to the start screen with both words back
// Run with dev server up: node tests/minipit-learn-check.js
const { chromium } = require('playwright');

const readScreen = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  const out = { vw: window.innerWidth, vh: window.innerHeight };
  if (svg) {
    svg.querySelectorAll('text').forEach((t) => {
      if (t.textContent !== 'START' && t.textContent !== 'LEARN') return;
      const r = t.getBoundingClientRect();
      out[t.textContent] = { left: Math.round(r.left), right: Math.round(r.right), midY: Math.round(r.y + r.height / 2) };
    });
    const c1 = svg.querySelectorAll('circle')[1];
    const m = c1 && (c1.getAttribute('transform') || '').match(/-?[\d.]+/g);
    out.circleY = m ? Math.round(+m[1]) : null;
    out.toys = Array.from(svg.querySelectorAll('image'))
      .filter((i) => /tennis-ball|uk-icon/.test(i.getAttribute('href') || '')).length;
  }
  const wash = document.querySelector('[class*="learnWash"]');
  out.wash = wash ? { peek: wash.className.includes('WashPeek'), on: wash.className.includes('WashOn'),
                      blend: getComputedStyle(wash).mixBlendMode, hits: getComputedStyle(wash).pointerEvents } : null;
  const aside = document.querySelector('[class*="asideDocked"]');
  out.boxOpen = !!aside && getComputedStyle(aside).display !== 'none';
  return out;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000);
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click();
  await p.waitForTimeout(2800);

  const s0 = await p.evaluate(readScreen);
  // a) LEARN hugs the right and sits above centre; START hugs the left, below
  const placed = !!(s0.LEARN && s0.START
    && s0.LEARN.right >= s0.vw - 30 && s0.LEARN.midY < s0.vh * 0.45
    && s0.START.left <= 30 && s0.START.midY > s0.vh * 0.55);

  // b) hover preview
  await p.locator('[aria-label="Learn about these breeds"]').hover({ force: true });
  await p.waitForTimeout(700);
  const s1 = await p.evaluate(readScreen);
  const peeked = !!(s1.wash && s1.wash.peek && !s1.wash.on);

  // c) choose LEARN
  await p.locator('[aria-label="Learn about these breeds"]').click({ force: true });
  await p.waitForTimeout(1000);
  const s2 = await p.evaluate(readScreen);
  const entered = !!(s2.wash && s2.wash.on && s2.boxOpen && !s2.START && !s2.LEARN);
  const blendOk = !!(s2.wash && s2.wash.blend === 'overlay' && s2.wash.hits === 'none');

  // and the pit stays completely inert, well past every drop beat
  await p.waitForTimeout(8000);
  const s3 = await p.evaluate(readScreen);
  const inert = s3.toys === 0 && s2.circleY !== null && Math.abs(s3.circleY - s2.circleY) < 3;

  // e) closing the box returns to the start screen
  await p.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('[class*="asideDocked"] button'));
    const x = btns.find((b2) => /close/i.test(b2.getAttribute('aria-label') || '') || /^[×✕x]$/i.test((b2.textContent || '').trim()));
    if (x) x.click();
  });
  await p.waitForTimeout(900);
  const s4 = await p.evaluate(readScreen);
  const returned = !!(s4.START && s4.LEARN && !s4.boxOpen);

  console.log('placement:', JSON.stringify({ LEARN: s0.LEARN, START: s0.START }), '| ok:', placed);
  console.log('hover peek:', peeked, '| entered learn:', entered, '| blend:', blendOk);
  console.log('pit inert:', inert, JSON.stringify({ toys: s3.toys, circleY: s3.circleY }), '| returned:', returned);

  const pass = !!(placed && peeked && entered && blendOk && inert && returned && errs.length === 0);
  if (errs.length) console.log('pageerrors:', errs.slice(0, 3));
  console.log(pass ? 'PASS GUARD-008' : 'FAIL GUARD-008');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
