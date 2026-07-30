// GUARD-014: the exit confirmation.
//
// The close X used to end the round the instant it was touched. A mini pit round
// takes a couple of minutes to build up, and losing it to a stray tap in the
// corner is a rotten way to leave, so the X now asks first.
//   a) tapping the X does NOT close the pit, it raises a panel offering yes/no
//   b) No dismisses the panel and the pit is still there, still playable
//   c) Escape while the panel is up answers no rather than closing the pit
//   d) Yes actually leaves
//   e) the panel covers the pit while it is up, so nothing behind it takes a tap
// Run with dev server up: node tests/minipit-exit-check.js
const { chromium } = require('playwright');

const state = () => {
  // the cookie notice is a role=dialog too, so the pit is identified by the
  // close X it always carries rather than by the role alone
  const dlg = document.querySelector('[aria-label="Close the pit"]');
  const ask = document.querySelector('[aria-label="Leave the game?"]');
  const panel = ask ? ask.firstElementChild : null;
  return {
    pitOpen: !!dlg,
    asking: !!ask,
    // the pit must be unreachable behind the panel
    coversPit: !!ask && getComputedStyle(ask).position === 'fixed' && Number(getComputedStyle(ask).zIndex) >= 300,
    yes: !!document.querySelector('[aria-label="Yes, leave the game"]'),
    no: !!document.querySelector('[aria-label="No, keep playing"]'),
    title: panel ? (panel.textContent || '').trim().slice(0, 12) : null,
  };
};

const openPit = async (p) => {
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000); // hydration
  await p.getByRole('button', { name: 'View Celtic Hound family tree' }).click({ timeout: 60000 });
  await p.locator('[aria-label="Play"]').waitFor({ timeout: 30000 });
  await p.locator('[aria-label="Play"]').click({ force: true });
  await p.waitForTimeout(5000); // the X is a physics object, let it settle
};

// the close X is an in-pit body, so click the element rather than a point
const tapClose = async (p) => {
  const el = await p.$('[aria-label="Close the pit"]');
  if (!el) return false;
  await el.click({ force: true });
  return true;
};

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

  await openPit(p);
  const before = await p.evaluate(state);

  const tapped = await tapClose(p);
  await p.waitForTimeout(700);
  const asked = await p.evaluate(state);
  // a) asks rather than closing
  const asksFirst = asked.asking && asked.pitOpen && asked.yes && asked.no;

  // b) No puts us back in the game
  await p.locator('[aria-label="No, keep playing"]').click({ force: true }).catch(() => {});
  await p.waitForTimeout(600);
  const afterNo = await p.evaluate(state);
  const noKeepsPlaying = !afterNo.asking && afterNo.pitOpen;

  // c) Escape answers no rather than closing the pit
  await tapClose(p);
  await p.waitForTimeout(600);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  const afterEsc = await p.evaluate(state);
  const escapeAnswersNo = !afterEsc.asking && afterEsc.pitOpen;

  // d) Yes leaves
  await tapClose(p);
  await p.waitForTimeout(600);
  const reAsked = await p.evaluate(state);
  const yesBtn = await p.$('[aria-label="Yes, leave the game"]');
  if (yesBtn) await yesBtn.click({ force: true });
  await p.waitForTimeout(2500);
  const afterYes = await p.evaluate(state);
  const yesLeaves = !afterYes.pitOpen;

  console.log('tapped the X:', tapped, '| asks before closing:', asksFirst, JSON.stringify(asked));
  console.log('No keeps playing:', noKeepsPlaying, '| Escape answers no:', escapeAnswersNo);
  console.log('Yes leaves:', yesLeaves, '| panel covered the pit:', reAsked.coversPit);
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(before.pitOpen && tapped && asksFirst && noKeepsPlaying && escapeAnswersNo
    && yesLeaves && reAsked.coversPit && errs.length === 0);
  console.log(pass ? 'PASS GUARD-014' : 'FAIL GUARD-014');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
