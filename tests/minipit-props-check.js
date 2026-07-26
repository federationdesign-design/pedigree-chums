// GUARD-012: the medieval props, stick and rock.
//   a) the beat: both arrive together, one second after the flag
//   b) both enter from above the visible stage, already falling
//   c) the rock is much heavier than the stick. A single shake turned out to be
//      one noisy sample, 93px against 11px on one run and 205 against 190 on the
//      next, because the distance is dominated by where a body happens to land.
//      So mass is asserted at the source, where it is exact, and the behaviour
//      that actually matters, the rock staying where it lands, is measured.
//   d) retirement: a prop marked gone does not come back in a later round,
//      while the ones still in play do. Set through the same session keys the
//      escape rule writes, so the contract is tested without needing a throw
// Run with dev server up: node tests/minipit-props-check.js
const { chromium } = require('playwright');
const fs = require('fs');

const OPEN = 'View Celtic Hound family tree';

const shot = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  if (!svg) return null;
  const st = svg.parentElement.getBoundingClientRect();
  const of = (n) => {
    const el = Array.from(svg.querySelectorAll('image')).find((i) => (i.getAttribute('href') || '').includes(n));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  return { top: st.top, ball: of('tennis-ball'), flag: of('uk-icon'), stick: of('stick.svg'), rock: of('rock.svg') };
};

const play = async (p) => {
  await p.waitForTimeout(7000); // hydration: a click before this is a no-op
  await p.getByRole('button', { name: OPEN }).click({ timeout: 60000 });
  await p.locator('[aria-label="Start"]').waitFor({ timeout: 30000 });
  await p.locator('[aria-label="Start"]').click({ force: true });
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await play(p);

  // a) beat. The clock runs from the first circle touching the floor, not from
  // START, so poll for the flag and time the props against that rather than
  // against the button press.
  const waitFor = async (key, limitMs) => {
    const t0 = Date.now();
    while (Date.now() - t0 < limitMs) {
      const s2 = await p.evaluate(shot);
      if (s2 && s2[key]) return { at: Date.now() - t0, shot: s2 };
      await p.waitForTimeout(120);
    }
    return null;
  };
  const flagSeen = await waitFor('flag', 20000);
  const propsClean = flagSeen && !flagSeen.shot.stick && !flagSeen.shot.rock;
  const stickSeen = await waitFor('stick', 6000);
  const atProps = await p.evaluate(shot);
  // one second after the flag, with slack for the poll interval and a frame or two
  const gap = stickSeen ? stickSeen.at : null;
  const beat = !!(flagSeen && propsClean && stickSeen && atProps.rock && gap < 2500);

  // b) entered from above: first sight of each is at or above the stage top
  const fromAbove = atProps.stick.y < atProps.top + 120 && atProps.rock.y < atProps.top + 200;

  // c) weight, read off the spec itself
  const src = fs.readFileSync('components/BreedTree/BreedTree.tsx', 'utf8');
  const densityOf = (kind) => {
    const m = src.match(new RegExp('kind === "' + kind + '" \\? \\{[^}]*density: ([0-9.]+)'));
    return m ? parseFloat(m[1]) : null;
  };
  const rockD = densityOf('rock'), stickD = densityOf('stick');
  const heavier = !!(rockD && stickD && rockD >= stickD * 5);
  const moved = (a, b2) => Math.hypot(b2.x - a.x, b2.y - a.y);
  await p.waitForTimeout(7000);

  // and the rock stays where it landed rather than rolling on. Sampled after a
  // longer settle: everything underneath it is still moving right after a shake.
  const rest3 = await p.evaluate(shot);
  await p.waitForTimeout(3000);
  const rest4 = await p.evaluate(shot);
  const rockSettled = moved(rest3.rock, rest4.rock) < 8;

  // d) retirement contract
  await p.evaluate(() => {
    sessionStorage.setItem('pc-minipit-stick-gone', '1');
    sessionStorage.setItem('pc-minipit-rock-gone', '1');
  });
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await play(p);
  await p.waitForTimeout(9000);
  const after = await p.evaluate(shot);
  const retired = !after.stick && !after.rock && !!after.ball;

  console.log('beat:', beat, '| props followed the flag by', gap, 'ms | entered from above:', fromAbove, JSON.stringify({ stick: Math.round(atProps.stick.y), rock: Math.round(atProps.rock.y), top: Math.round(atProps.top) }));
  console.log('density: rock', rockD, 'vs stick', stickD, '->', rockD && stickD ? (rockD / stickD).toFixed(0) + 'x heavier:' : 'unreadable:', heavier);
  console.log('rock drift once settled:', moved(rest3.rock, rest4.rock).toFixed(1), 'px ->', rockSettled, '| retired props stay gone:', retired, '| ball still comes:', !!after.ball);
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(beat && fromAbove && heavier && rockSettled && retired && errs.length === 0);
  console.log(pass ? 'PASS GUARD-012' : 'FAIL GUARD-012');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
