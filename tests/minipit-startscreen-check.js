// GUARD-011: the start screen is a start screen, not a half-live pit.
//   a) shake, slow motion and the info square are not offered before START.
//      The info square is now gone from the pit altogether: it opens the blue
//      box, which is reading rather than playing, and the blue box is reached
//      through the LEARN word on the start screen instead. So it must be absent
//      during a round too, not only before one.
//      because none of them can do anything yet
//   b) the close X stays, so there is always a way out
//   c) the circles are frozen: a tap does not drill in, does not highlight, and
//      above all does not fall through to the background and shut the pit
//   d) all of it arrives the moment START is pressed
//   e) hovering a word makes that word answer
// Run with dev server up: node tests/minipit-startscreen-check.js
const { chromium } = require('playwright');

const probe = () => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return { dialogOpen: false };
  const svg = dlg.querySelector('svg');
  const circles = Array.from(svg.querySelectorAll('circle'))
    .slice(1)
    .filter((c) => c.getBoundingClientRect().width > 20);
  const first = circles[0] ? circles[0].getBoundingClientRect() : null;
  const word = (label) => {
    const g = document.querySelector(`[aria-label="${label}"]`);
    const t = g && g.querySelector('text');
    return t ? Math.round(parseFloat(getComputedStyle(t).fontSize)) : null;
  };
  return {
    dialogOpen: true,
    start: !!document.querySelector('[aria-label="Start"]'),
    shake: !!document.querySelector('[aria-label="Shake the pit"]'),
    slowmo: !!document.querySelector('[aria-label="Slow motion"], [aria-label="Normal speed"]'),
    close: !!dlg.querySelector('g[style*="cursor: pointer"] line'),
    info: !!dlg.querySelector('path[d*="M12 6v4"]'),
    startSize: word('Start'),
    learnSize: word('Learn about these breeds'),
    circle: first
      ? {
          x: Math.round(first.x + first.width / 2),
          y: Math.round(first.y + first.height / 2),
          r: Math.round(first.width / 2),
        }
      : null,
  };
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000); // hydration: a click before this is a no-op
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click({ timeout: 60000 });
  await p.locator('[aria-label="Start"]').waitFor({ timeout: 30000 });
  await p.waitForTimeout(400);

  const before = await p.evaluate(probe);
  const bareStart = before.start && !before.shake && !before.slowmo && !before.info;
  const wayOut = before.close === true;

  // c) a tap on a circle must change nothing, and must not shut the pit
  await p.mouse.click(before.circle.x, before.circle.y);
  await p.waitForTimeout(900);
  const tapped = await p.evaluate(probe);
  const inert =
    tapped.dialogOpen &&
    tapped.start &&
    Math.abs(tapped.circle.r - before.circle.r) < 2 &&
    Math.abs(tapped.circle.y - before.circle.y) < 2;

  // e) the word answers to the pointer
  await p.locator('[aria-label="Start"]').hover({ force: true });
  await p.waitForTimeout(400);
  const hovered = await p.evaluate(probe);
  const wordAnswers =
    hovered.startSize > before.startSize && hovered.learnSize === before.learnSize;

  // d) everything arrives with the round
  await p.locator('[aria-label="Start"]').click({ force: true });
  await p.waitForTimeout(2500);
  const running = await p.evaluate(probe);
  // shake and slow motion arrive with the round; the info square never does
  const armed = !running.start && running.shake && running.slowmo && !running.info && running.close;

  console.log('start screen bare:', bareStart, JSON.stringify({ shake: before.shake, slowmo: before.slowmo, info: before.info }));
  console.log('way out kept:', wayOut, '| circles inert:', inert);
  console.log('word answers to hover:', wordAnswers, before.startSize, '->', hovered.startSize, '(learn unchanged at', hovered.learnSize + ')');
  console.log('armed once running (info stays out):', armed, JSON.stringify({ shake: running.shake, slowmo: running.slowmo, info: running.info, close: running.close }));
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(bareStart && wayOut && inert && wordAnswers && armed && errs.length === 0);
  console.log(pass ? 'PASS GUARD-011' : 'FAIL GUARD-011');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
