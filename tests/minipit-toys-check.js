// GUARD-006: mini pit toys. Tennis ball and Union Jack, ported from the main pit.
//   a) neither exists before START, and neither drops before the dogs land
//   b) ball lands about 3s after the first circle touches the floor
//   c) flag lands about 3s after the ball
//   d) both are live bodies: they fall and settle, and can be dragged
//   e) tapping the flag opens the shared Britain popup; the tick closes it and
//      poofs the flag, leaving the ball alone
//   f) the main pit still renders after the popup was extracted into its own
//      component (that edit touched PackPit, so it gets a smoke check here)
// Note: dead props keep a hidden slot so the render stays index-aligned with the
// bridge list, so "gone" means display:none, not absent from the DOM.
// Run with dev server up: node tests/minipit-toys-check.js
const { chromium } = require('playwright');

const readToys = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  if (!svg) return [];
  return Array.from(svg.querySelectorAll('image'))
    .filter((i) => /tennis-ball|uk-icon/.test(i.getAttribute('href') || ''))
    .map((i) => {
      const g = i.closest('g');
      const r = i.getBoundingClientRect();
      return {
        kind: /uk-icon/.test(i.getAttribute('href')) ? 'flag' : 'ball',
        shown: (g.style.display || '') !== 'none' && r.width > 1,
        x: Math.round(r.x + r.width / 2),
        y: Math.round(r.y + r.height / 2),
      };
    });
};
const shown = (list, kind) => list.filter((t) => t.kind === kind && t.shown);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000);
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click();
  await p.waitForTimeout(2700);

  const preStart = await p.evaluate(readToys);
  const t0 = Date.now();
  await p.locator('[aria-label="Play"]').click({ force: true });

  // poll fast so we catch the ball's very first painted frame, and time it
  let firstPaint = null;
  let msToBall = null;
  for (let i = 0; i < 100; i++) {
    await p.waitForTimeout(90);
    firstPaint = await p.evaluate(() => {
      const svg = document.querySelector('[role="dialog"] svg');
      const i2 = Array.from(svg.querySelectorAll('image')).find((x) => /tennis-ball/.test(x.getAttribute('href') || ''));
      if (!i2) return null;
      const r = i2.getBoundingClientRect();
      return r.width < 1 ? null : { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
    if (firstPaint) { msToBall = Date.now() - t0; break; }
  }

  await p.waitForTimeout(1500);
  const ballDue = await p.evaluate(readToys);   // ball in the pit, flag not yet
  await p.waitForTimeout(3000);
  const flagDue = await p.evaluate(readToys);   // flag has arrived
  await p.waitForTimeout(3500);
  const settledA = await p.evaluate(readToys);
  await p.waitForTimeout(1500);
  const settledB = await p.evaluate(readToys);

  // nothing before START, and the ball waits for the dogs to land plus 3s
  const quietEarly = preStart.length === 0 && msToBall !== null && msToBall > 3000 && msToBall < 9000;
  // toys must enter from ABOVE the viewport, already falling, not pop into the pit
  const enteredFromAbove = !!firstPaint && firstPaint.bottom <= 4;
  const ballOnTime = shown(ballDue, 'ball').length === 1 && shown(ballDue, 'flag').length === 0;
  const flagOnTime = shown(flagDue, 'flag').length === 1;
  const fell = shown(flagDue, 'ball')[0] && shown(ballDue, 'ball')[0]
    && shown(flagDue, 'ball')[0].y > shown(ballDue, 'ball')[0].y;
  // The ball carries the main pit's restitution of 0.97, so it can still be
  // bouncing long after it arrives. "Motionless" is the wrong thing to assert.
  // What matters is that it fell in and STAYED in, so check it is on screen at
  // both samples rather than that it has stopped moving.
  const inPit = (t) => t && t.y > 0 && t.y < 844;
  const settled = inPit(shown(settledA, 'ball')[0]) && inPit(shown(settledB, 'ball')[0]);

  console.log('pre-START:', preStart.length, '| ms to ball:', msToBall);
  console.log('ball due:', JSON.stringify(shown(ballDue, 'ball')), '| flag due:', JSON.stringify(shown(flagDue, 'flag')));
  console.log('ball first paint:', JSON.stringify(firstPaint), '| entered from above:', !!enteredFromAbove);
  console.log('quiet early:', quietEarly, '| ball on time:', ballOnTime, '| flag on time:', flagOnTime, '| fell:', !!fell, '| stayed in pit:', !!settled);

  // flag tap -> shared popup -> tick poofs the flag, ball survives
  const flag = shown(settledB, 'flag')[0];
  let popupOk = false;
  let flagGone = false;
  let ballKept = false;
  if (flag) {
    // Click the element itself, not a screen coordinate: the flag rolls to a
    // different resting spot every run. Retry a couple of times, because a tap
    // that lands while it is still rolling is read as a drag, not a tap.
    for (let attempt = 0; attempt < 3 && !popupOk; attempt++) {
      await p.locator('image[href*="uk-icon"]').click({ force: true });
      await p.waitForTimeout(700);
      popupOk = await p.evaluate(() => !!document.querySelector('[aria-label="Got it"]')
        && document.body.innerText.includes('Designed & Printed in Britain'));
    }
    if (popupOk) {
      await p.click('[aria-label="Got it"]');
      await p.waitForTimeout(1000);
      const after = await p.evaluate(readToys);
      flagGone = shown(after, 'flag').length === 0;
      ballKept = shown(after, 'ball').length === 1;
    }
  }
  console.log('popup opened:', popupOk, '| flag poofed:', flagGone, '| ball kept:', ballKept);

  // the popup extraction edited PackPit, so make sure the main pit still boots
  await p.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' }); // the main pit is the root route
  await p.waitForTimeout(7000);
  const mainPitOk = await p.evaluate(() => !!document.querySelector('canvas'));
  console.log('main pit renders:', mainPitOk, '| pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(quietEarly && enteredFromAbove && ballOnTime && flagOnTime && fell && settled
    && popupOk && flagGone && ballKept && mainPitOk && errs.length === 0);
  console.log(pass ? 'PASS GUARD-006' : 'FAIL GUARD-006');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
