// GUARD-009: the mini pit difficulty slider.
//   a) it is on the start screen, down the left, default 5, and it goes when
//      START is pressed; it is absent on desktop, where the fill has no effect
//   b) the three pinned points: level 5 is the approved default, level 0 is
//      0.618x of it (a quarter under the old easiest), and at level 10 the
//      widest circle spans the pit, which is the stage less its 4-unit walls
//   c) changing it must NOT replay the entrance: START stays on screen and the
//      labels stay visible throughout (both are gated on `entered`)
//   d) after a change, START still drops the circles, so the physics is reading
//      the re-packed radii
// Run with dev server up: node tests/minipit-difficulty-check.js
const { chromium } = require('playwright');

const probe = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  const cs = svg ? Array.from(svg.querySelectorAll('circle')).slice(1) : [];
  const box = cs.length
    ? cs.map((c) => c.getBoundingClientRect()).reduce((a, r) => (r.width > a.width ? r : a))
    : null;
  const sl = document.querySelector('[role="slider"][aria-label="Difficulty"]');
  const labels = svg && Array.from(svg.querySelectorAll('g')).find((g) => g.querySelector(':scope > g > text tspan'));
  return {
    r: box ? +(box.width / 2).toFixed(2) : null,
    y: box ? Math.round(box.y) : null,
    stageW: svg ? +svg.parentElement.getBoundingClientRect().width.toFixed(1) : null,
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

  // it must use the room: from near the top edge down to the cap of the S in
  // START, rather than a guessed fraction that leaves a third of the pit empty
  const reach = await p.evaluate(() => {
    const st = document.querySelector('[role="dialog"] svg').parentElement.getBoundingClientRect();
    const sl = document.querySelector('[role="slider"][aria-label="Difficulty"]');
    const tx = document.querySelector('[aria-label="Start"] text');
    if (!sl || !tx) return null;
    const s2 = sl.getBoundingClientRect(), t2 = tx.getBoundingClientRect();
    return {
      topPct: +(((s2.top - st.top) / st.height) * 100).toFixed(0),
      heightPct: +((s2.height / st.height) * 100).toFixed(0),
      gapToS: Math.round(t2.top - s2.bottom),
    };
  });
  const fillsHeight = !!(reach && reach.topPct <= 12 && reach.heightPct >= 60 && Math.abs(reach.gapToS) <= 24);
  console.log('slider reach:', JSON.stringify(reach), '-> fills the height and meets START:', fillsHeight);

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

  // b) the pinned points. Level 10 fills the pit: the stage less the 4 svg-unit
  // wall inset each side, so 96% to 100% of the stage width is on spec and
  // anything wider would wedge the body between the walls.
  const ratioEasy = easy.r / base.r;
  const spanTop = (hard.r * 2) / hard.stageW;
  const mapping =
    base.level === 5 &&
    hard.level === 10 &&
    easy.level === 0 &&
    spanTop > 0.96 && spanTop <= 1.0 &&
    Math.abs(ratioEasy - 0.525 / 0.85) < 0.02;

  // and it must climb the whole way, never flatten off or step backwards
  const sweep = [];
  await track.focus();
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowDown');
  for (let i = 0; i <= 10; i++) {
    sweep.push((await p.evaluate(probe)).r);
    if (i < 10) await p.keyboard.press('ArrowUp');
    await p.waitForTimeout(60);
  }
  const monotonic = sweep.every((v, i) => i === 0 || v > sweep[i - 1]);

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
  console.log('mapping:', mapping, '| level 10 spans', (spanTop * 100).toFixed(1) + '% of the stage | level 0 ratio', ratioEasy.toFixed(3), '(want 0.618)');
  console.log('monotonic:', monotonic, JSON.stringify(sweep));
  console.log('drag tracked:', dragTracked, JSON.stringify(mid));
  console.log('no entrance replay:', noReplay, '| fell after START:', fell, '| slider cleared:', clearedOnStart);
  console.log('desktop hides slider:', deskClean, '| pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(mapping && monotonic && fillsHeight && dragTracked && noReplay && fell && clearedOnStart && deskClean && errs.length === 0);
  console.log(pass ? 'PASS GUARD-009' : 'FAIL GUARD-009');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
