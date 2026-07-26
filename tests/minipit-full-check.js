// GUARD-015: the pit can tell it is full even with only two dogs in it.
//
// "Full" used to mean five settled bodies reaching the top zone, a count taken
// from the main pit, which always holds dozens of cards. Half the mini pit trees
// hold two or three circles, so on those the count could never be met: at the
// hardest difficulty the pit was visibly stuffed, the count sat at 2, and the
// round simply never ended. The rule now measures how much of the pit's WIDTH is
// blocked, merging overlapping spans so two circles side by side are not counted
// twice.
//
//   a) Celtic Hound, two dogs, difficulty 10: the pit fills, the countdown runs
//   b) the same tree at the default difficulty: it does not, so an ordinary
//      round is still won or lost on play rather than on a timer
//
// Celtic Hound is the case that matters: two circles, and at level 10 each one
// spans nearly the full width, so together they block the pit outright.
//
// Run with dev server up: node tests/minipit-full-check.js
const { chromium } = require('playwright');

const countdownShowing = () => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  // The countdown is a bare div appended to the stage with a very distinctive
  // signature: z-index 200 and a font size in the region of 5rem to 12rem.
  // Matching on the text alone caught the score and the circle counter, both of
  // which can read "0", and reported a countdown 15ms into the round.
  const hit = Array.from(dlg.querySelectorAll('div')).find((d) => {
    if (d.children.length) return false;
    const cs = getComputedStyle(d);
    if (cs.zIndex !== '200') return false;
    if (parseFloat(cs.fontSize) < 60) return false;
    const t = (d.textContent || '').trim();
    return /^(10|[0-9]|GAME OVER)$/.test(t);
  });
  return hit ? (hit.textContent || '').trim() : null;
};

const openAt = async (p, level) => {
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000); // hydration: a click before this is a no-op
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click({ timeout: 60000 });
  await p.locator('[aria-label="Play"]').waitFor({ timeout: 30000 });
  // set the difficulty from the keyboard: deterministic, unlike dragging
  const track = p.locator('[role="slider"][aria-label="Difficulty"]');
  await track.focus();
  const now = Number(await track.getAttribute('aria-valuenow'));
  const key = level > now ? 'ArrowUp' : 'ArrowDown';
  for (let i = 0; i < Math.abs(level - now); i++) await p.keyboard.press(key);
  await p.waitForTimeout(200);
  await p.locator('[aria-label="Play"]').click({ force: true });
};

// poll rather than sleep: the countdown starts whenever the pit settles
const waitForCountdown = async (p, ms) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = await p.evaluate(countdownShowing);
    if (v) return { at: Date.now() - t0, first: v };
    await p.waitForTimeout(400);
  }
  return null;
};

(async () => {
  const b = await chromium.launch();
  const errs = [];

  // a) hardest: the two circles block the pit, so the round must end
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await openAt(p, 10);
  const hard = await waitForCountdown(p, 26000);

  // b) default: an ordinary round must NOT turn into a timer
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  q.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await openAt(q, 5);
  const easy = await waitForCountdown(q, 22000);

  const fillsWhenHard = !!hard;
  const quietWhenDefault = easy === null;

  console.log('difficulty 10 ->', hard ? `countdown started after ${hard.at}ms, first digit ${hard.first}` : 'never started');
  console.log('difficulty 5  ->', easy ? `countdown started after ${easy.at}ms, WRONG` : 'no countdown, as intended');
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(fillsWhenHard && quietWhenDefault && errs.length === 0);
  console.log(pass ? 'PASS GUARD-015' : 'FAIL GUARD-015');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
