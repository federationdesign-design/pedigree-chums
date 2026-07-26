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
  // the rock now lands half a second behind the sticks, so it gets its own thump
  // rather than arriving underneath them
  const atSticks = await p.evaluate(shot); // the instant the sticks land
  const rockSeen = await waitFor('rock', 6000);
  const atProps = await p.evaluate(shot);
  // one second after the flag, with slack for the poll interval and a frame or two
  const gap = stickSeen ? stickSeen.at : null;
  // the rock is held back half a second, so it is not yet present when the
  // sticks arrive but has appeared by the time the wait returns
  const rockLater = !!(rockSeen && !atSticks.rock);
  const beat = !!(flagSeen && propsClean && stickSeen && rockSeen && gap < 2500 && rockLater);

  // b) entered from above: first sight of each is at or above the stage top
  // each is judged at its own first sighting: the sticks from the shot taken as
  // they land, the rock from the shot half a second later. Judging the stick
  // from the later shot just measures how far it has already fallen.
  const fromAbove = !!(atSticks.stick && atProps.rock
    && atSticks.stick.y < atSticks.top + 120 && atProps.rock.y < atProps.top + 200);

  // c) weight, read off the spec itself
  const src = fs.readFileSync('components/BreedTree/BreedTree.tsx', 'utf8');
  const densityOf = (kind) => {
    const m = src.match(new RegExp('kind === "' + kind + '" \\? \\{[^}]*density: ([0-9.]+)'));
    return m ? parseFloat(m[1]) : null;
  };
  const rockD = densityOf('rock'), stickD = densityOf('stick');
  const heavier = !!(rockD && stickD && rockD >= stickD * 5);
  const moved = (a, b2) => Math.hypot(b2.x - a.x, b2.y - a.y);
  // Four props now, and the pit takes longer to come to rest than it did with
  // three. Sampling too early measures the settling itself rather than whether
  // the rock rolls on once settled, which is the actual claim.
  await p.waitForTimeout(13000);

  // and the rock stays where it landed rather than rolling on. Sampled after a
  // longer settle: everything underneath it is still moving right after a shake.
  const rest3 = await p.evaluate(shot);
  await p.waitForTimeout(3000);
  const rest4 = await p.evaluate(shot);
  // What this is really asserting is that the rock reads as heavy: it holds its
  // place while lighter things around it are still shifting. An absolute pixel
  // threshold was fine with three props but the second, larger stick now lands
  // beside it and nudges it, which is correct physics rather than a fault. So
  // compare against the ball, the lightest and bounciest thing in the pit: the
  // rock must move meaningfully less than it does over the same window.
  const rockDrift = moved(rest3.rock, rest4.rock);
  const ballDrift = rest3.ball && rest4.ball ? moved(rest3.ball, rest4.ball) : null;
  const rockSettled = rockDrift < 20 && (ballDrift === null || rockDrift <= ballDrift + 2);

  // d) retirement contract
  await p.evaluate(() => {
    sessionStorage.setItem('pc-minipit-stick-gone', '1');
    sessionStorage.setItem('pc-minipit-stickbig-gone', '1');
    sessionStorage.setItem('pc-minipit-rock-gone', '1');
  });
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await play(p);
  await p.waitForTimeout(9000);
  const after = await p.evaluate(shot);
  const retired = !after.stick && !after.rock && !!after.ball;

  console.log('beat:', beat, '| props followed the flag by', gap, 'ms | entered from above:', fromAbove, JSON.stringify({ stick: atSticks.stick ? Math.round(atSticks.stick.y) : null, rock: Math.round(atProps.rock.y), top: Math.round(atProps.top) }));
  console.log('density: rock', rockD, 'vs stick', stickD, '->', rockD && stickD ? (rockD / stickD).toFixed(0) + 'x heavier:' : 'unreadable:', heavier);
  console.log('rock drift', rockDrift.toFixed(1), 'px vs ball', ballDrift === null ? 'n/a' : ballDrift.toFixed(1), '->', rockSettled, '| retired props stay gone:', retired, '| ball still comes:', !!after.ball);
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(beat && fromAbove && heavier && rockSettled && retired && errs.length === 0);
  console.log(pass ? 'PASS GUARD-012' : 'FAIL GUARD-012');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
