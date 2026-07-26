// GUARD-013: the solo dog flow.
//
// A dog with no ancestors of its own is handed a synthetic child by BreedTree:
// itself, drawn a second time, purely so the learn layer has something to
// reveal. Drawing that as a node hanging off a connector claims the dog descends
// from itself. So for these dogs the node and rod are gone, the reveal comes
// straight out of the big circle, landing the image in its frame finishes the
// round with no Complete button, and what drops back into the pit is a full-size
// blank circle wearing the breed name at 12 charges rather than a badge's 20.
//
// The pair matters and took two attempts to get right:
//   Celtic Hound      both circles solo, so any circle exercises the new path
//   Manchester Terrier both circles have real ancestors, so it must be untouched
// Cockapoo is not usable as a control: it is one of the 54 Chums and never gets
// a mini pit at all. Old English Bulldog is not usable either: both of its
// circles are solo, so it would test the same path twice and pass for the wrong
// reason.
//
// Run with dev server up: node tests/minipit-solo-check.js
const { chromium } = require('playwright');

const layer = () => ({
  open: !!document.querySelector('[aria-label="Learn"]'),
  edges: document.querySelectorAll('[class*="edge"]').length,
  // popped ancestor cards render as <g> with a pick- key; CSS Module class
  // names are hashed, so match on the image the card carries instead
  cards: document.querySelectorAll('[role="dialog"] svg image, svg image[href*="/history"], svg image[href*="breeds"]').length,
  complete: !!document.querySelector('[aria-label="Complete"]'),
});

const pit = () => {
  const svg = document.querySelector('[role="dialog"] svg');
  if (!svg) return null;
  const texts = Array.from(svg.querySelectorAll('text'));
  const named = texts
    .filter((t) => getComputedStyle(t).fontFamily.toLowerCase().includes('luckiest'))
    .map((t) => (t.textContent || '').trim())
    .filter(Boolean);
  return {
    radii: Array.from(svg.querySelectorAll('circle'))
      .map((c) => Math.round(c.getBoundingClientRect().width / 2))
      .filter((r) => r > 10),
    named,
    pcts: texts.filter((t) => /%$/.test((t.textContent || '').trim())).length,
  };
};

const openPit = async (p, breed) => {
  await p.goto('http://localhost:3000/britains-dog-history', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000); // hydration: a click before this is a no-op
  await p.getByRole('button', { name: `View ${breed} family tree` }).click({ timeout: 60000 });
  await p.locator('[aria-label="Start"]').waitFor({ timeout: 30000 });
  await p.locator('[aria-label="Start"]').click({ force: true });
  await p.waitForTimeout(6500); // the drop has to settle before a circle owns a body
};

// A dropped circle lifts to the layer on a single click, but only once it owns a
// body, so try each in turn until the Learn button appears.
const liftACircle = async (p) => {
  const n = await p.evaluate(() => document.querySelectorAll('[role="dialog"] svg circle').length);
  for (let i = 1; i < Math.min(n, 8); i++) {
    await p.locator('[role="dialog"] svg circle').nth(i).click({ force: true });
    await p.waitForTimeout(900);
    if (await p.evaluate(() => !!document.querySelector('[aria-label="Learn"]'))) return i;
  }
  return -1;
};

(async () => {
  const b = await chromium.launch();
  const errs = [];

  // ---- Celtic Hound: the new flow ----
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await openPit(p, 'Celtic Hound');
  const namedBefore = ((await p.evaluate(pit)) || { named: [] }).named.length;
  const idx = await liftACircle(p);
  const l0 = await p.evaluate(layer);

  // the first press of Learn pops a card, rather than spending a step revealing
  // a node that is never drawn
  await p.locator('[aria-label="Learn"]').click({ force: true });
  await p.waitForTimeout(1400);
  const l1 = await p.evaluate(layer);
  const poppedFirstPress = l1.cards > l0.cards;
  const noEdges = l0.edges === 0 && l1.edges === 0;

  // keep pressing until the layer finishes by itself. If a Complete button ever
  // appears this has failed: placement is meant to be the finish.
  let sawComplete = l0.complete || l1.complete;
  let closedItself = false;
  for (let i = 0; i < 8; i++) {
    const st = await p.evaluate(layer);
    if (st.complete) sawComplete = true;
    if (!st.open) { closedItself = true; break; }
    await p.locator('[aria-label="Learn"]').click({ force: true }).catch(() => {});
    await p.waitForTimeout(1600);
  }
  await p.waitForTimeout(4500); // scatter, burst, confetti and close

  const after = await p.evaluate(pit);
  const gotNamedCircle = !!after && after.named.length > namedBefore;
  const gotFullSize = !!after && after.radii.some((r) => r > 40);

  // ---- Manchester Terrier: the old flow, untouched ----
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  q.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await openPit(q, 'Manchester Terrier');
  const qIdx = await liftACircle(q);
  await q.locator('[aria-label="Learn"]').click({ force: true }).catch(() => {});
  await q.waitForTimeout(1600);
  const q1 = await q.evaluate(layer);
  const ancestorsKeepNodes = qIdx !== -1 && q1.edges > 0;
  if (qIdx === -1) console.log('  NOTE: Manchester Terrier pit never opened, control inconclusive');

  console.log('Celtic Hound: lifted circle', idx, '| layer at open', JSON.stringify(l0));
  console.log('  no connector drawn:', noEdges, '| first press popped a card:', poppedFirstPress, l0.cards, '->', l1.cards);
  console.log('  finished on its own:', closedItself, '| Complete never shown:', !sawComplete);
  console.log('  named circle landed:', gotNamedCircle, JSON.stringify(after && after.named), '| full size:', gotFullSize);
  console.log('Manchester Terrier keeps its nodes and connectors:', ancestorsKeepNodes, 'edges', q1.edges);
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');

  const pass = !!(noEdges && poppedFirstPress && closedItself && !sawComplete
    && gotNamedCircle && gotFullSize && ancestorsKeepNodes && errs.length === 0);
  console.log(pass ? 'PASS GUARD-013' : 'FAIL GUARD-013');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
