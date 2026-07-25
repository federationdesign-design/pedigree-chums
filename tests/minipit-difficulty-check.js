// GUARD-009: the mini pit difficulty slider.
//   a) it is on the start screen, down the left, default 5, and it goes when
//      START is pressed; it is absent on desktop, where the fill has no effect
//   b) the mapping is the spec: fill = 0.70 + level/10 * 0.30, so level 10 is
//      1.176x the default radius and level 0 is 0.824x
//   c) changing it must NOT replay the entrance: START stays on screen and the
//      labels stay visible throughout (both are gated on `entered`)
//   d) after a change, START still drops the circles, so the physics is reading
//      the re-packed radii
// Run with dev server up: node tests/minipit-difficulty-check.js
const { chromium } = require('playwright');

const probe = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  const c = svg && svg.querySelectorAll('circle')[1];
  const box = c && c.getBoundingClientRect();
  const sl = document.querySelector('[role="slider"][aria-label="Difficulty"]');
  const labels = svg && Array.from(svg.querySelectorAll('g')).find((g) => g.querySelector(':scope > g > text tspan'));
  return {
    r: box ? +(box.width / 2).toFixed(2) : null,
    y: box ? Math.round(box.y) : null,
    level: sl ? +sl.getAttribute('aria-valuenow') : null,
    hasSlider: !!sl,
    hasStart: !!document.querySelector('[aria-label="Start"]'),
    labelsOn: labels ? labels.style.opacity !== '0' : false,
  };
};

const openPit = async (p) => {
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000); // cold compile headroom
  await p.getByRole('button', { name: 'View Old English Bulldog family tree' }).click();
  await p.waitForTimeout(2600); // entrance done
};

(async () => {
  const b = await chromium.launch();
  const errs = [];

  // ---- mobile ----
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await openPit(p);

  const base = await p.evaluate(probe);

  // keyboard: five presses up from the default reaches 10 (hardest, biggest)
  const track = p.locator('[role="slider"][aria-label="Difficulty"]');
  await track.focus();
  for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowUp');
  await p.waitForTimeout(120);
  const hard = await p.evaluate(probe);

  // pointer: one continuous drag from the top of the track to the bottom must
  // track the whole way to 0. A re-pack used to unmount the control mid-drag,
  // which dropped the pointer capture and froze it after a single step.
  const bb = await track.boundingBox();
  const cx = bb.x + bb.width / 2;
  await p.mouse.move(cx, bb.y + 2);
  await p.mouse.down();
  const mid = [];
  for (let i = 1; i <= 8; i++) {
    await p.mouse.move(cx, bb.y + (bb.height - 4) * (i / 8));
    await p.waitForTimeout(40);
    mid.push((await p.evaluate(probe)).level);
  }
  await p.mouse.up();
  await p.waitForTimeout(120);
  const easy = await p.evaluate(probe);
  const dragTracked = new Set(mid).size >= 4; // it followed, it did not stick

  // b) mapping, measured against the level-5 default
  const ratioHard = hard.r / base.r;
  const ratioEasy = easy.r / base.r;
  const mapping =
    base.level === 5 &&
    hard.level === 10 &&
    easy.level === 0 &&
    Math.abs(ratioHard - 1.0 / 0.85) < 0.02 &&
    Math.abs(ratioEasy - 0.7 / 0.85) < 0.02;

  // c) no entrance replay at any point
  const noReplay =
    base.hasStart && hard.hasStart && easy.hasStart &&
    base.labelsOn && hard.labelsOn && easy.labelsOn;

  // back to a middle setting, then play
  await track.focus();
  for (let i = 0; i < 7; i++) await p.keyboard.press('ArrowUp');
  await p.waitForTimeout(120);
  const seven = await p.evaluate(probe);
  await p.locator('[aria-label="Start"]').click({ force: true });
  await p.waitForTimeout(3000);
  const played = await p.evaluate(probe);

  const fell = played.y - seven.y > 50;
  const clearedOnStart = !played.hasSlider && !played.hasStart;

  // ---- desktop: no slider, because the fill never reaches the layout ----
  const d = await b.newPage({ viewport: { width: 1280, height: 900 } });
  d.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await openPit(d);
  const desk = await d.evaluate(probe);
  const deskClean = desk.hasStart && !desk.hasSlider;

  console.log('default:', base.level, 'r', base.r, '| 10:', hard.level, 'r', hard.r, '| 0:', easy.level, 'r', easy.r);
  console.log('mapping:', mapping, '| ratios', ratioHard.toFixed(3), ratioEasy.toFixed(3), '(want 1.176 / 0.824)');
  console.log('drag tracked:', dragTracked, JSON.stringify(mid));
  console.log('no entrance replay:', noReplay, '| fell after START:', fell, '| slider cleared:', clearedOnStart);
  console.log('desktop hides slider:', deskClean, '| pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(mapping && dragTracked && noReplay && fell && clearedOnStart && deskClean && errs.length === 0);
  console.log(pass ? 'PASS GUARD-009' : 'FAIL GUARD-009');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
