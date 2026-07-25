// Typing-theatre browser verification (v3). Gate 2 evidence, in a real browser:
//   A. 8-second cap    - time the actual animation loop on the worst-case profile
//                        (Boxer) performing the longest answer (477 chars, which
//                        would run ~20s uncapped), timed in-page with rAF so there
//                        is no polling inflation.
//   B. reduced-motion  - the whole message renders at once, no dots, no stream.
//   C. tap / Enter     - completing mid-performance jumps to the whole message and
//                        re-enables the composer.
//   D. aria-live once  - a MutationObserver proves the live region is set exactly
//                        once, to the whole message, never the character stream.
// Requires the dev server on :3737. Run: node scripts/verify-theatre-v3.mjs
// Exits non-zero if any assertion fails.

import { chromium } from 'playwright';

const URL = 'http://localhost:3737/pick-a-chum';
const LONG = 'hot dog'; // -> 477-char FAQ answer, answered by any dog, no transfer
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(26)}  ::  ${detail}`);
};

// Robust open: wait for hydration, open the launcher, wait for the selector, pick a
// dog, wait for the composer. Then install the live-region mutation log.
const openAndPick = async (page, dogName) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const launcher = page.getByRole('button', { name: 'Pick a Chum' });
  await launcher.waitFor({ state: 'visible' });
  await launcher.click();
  const dog = page.getByRole('button', { name: dogName, exact: true });
  await dog.waitFor({ state: 'visible' });
  await dog.click();
  await page.getByLabel('Type something here').waitFor({ state: 'visible' });
  // Live-region observer: log every value the region is set to.
  await page.evaluate(() => {
    window.__srLog = [];
    const el = document.querySelector('[class*="srOnly"]');
    if (el) new MutationObserver(() => window.__srLog.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
  });
  // In-page rAF probe: for the (first) message, track dots, a typing partial, and
  // the moment the last dog line is revealed whole, measured against t0.
  await page.evaluate(() => {
    // Two clocks: goToDone (GO click -> whole message) includes engine + React
    // latency before the dog starts; dotsToDone (first dots -> whole message) is
    // the theatre itself, which is what the eight-second cap governs.
    window.__probe = { t0: 0, doneAt: 0, sawDots: false, sawPartial: false, finalText: '', dotsAt: 0, doneAbs: 0 };
    const tick = () => {
      const d = document.querySelector('[role="dialog"]');
      if (d && window.__probe.t0) {
        if (d.querySelector('[class*="typingDots"]')) {
          window.__probe.sawDots = true;
          if (!window.__probe.dotsAt) window.__probe.dotsAt = performance.now();
        }
        const lines = [...d.querySelectorAll('[class*="dialogue"]')];
        const last = lines[lines.length - 1];
        if (last) {
          const hidden = last.getAttribute('aria-hidden');
          const len = last.textContent.length;
          if (hidden === 'true' && len > 0) window.__probe.sawPartial = true;
          if (!window.__probe.doneAt && hidden === 'false' && len > 0) {
            window.__probe.doneAt = performance.now() - window.__probe.t0;
            window.__probe.doneAbs = performance.now();
            window.__probe.finalText = last.textContent;
          }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

// Start timing and send in one step so t0 sits right at the GO click.
const sendTimed = async (page, text) => {
  await page.getByLabel('Type something here').fill(text);
  await page.evaluate(() => (window.__probe.t0 = performance.now()));
  await page.getByRole('button', { name: 'Send' }).click();
};

const readProbe = (page) => page.evaluate(() => window.__probe);
const readSr = (page) => page.evaluate(() => window.__srLog.filter((x) => x && x.length));

const browser = await chromium.launch();
try {
  // ---- A + D: 8s cap on worst-case profile, and aria-live-once ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await openAndPick(page, 'Boxer');
    await sendTimed(page, LONG);
    const t0 = Date.now();
    let p;
    do {
      await page.waitForTimeout(50);
      p = await readProbe(page);
    } while (!p.doneAt && Date.now() - t0 < 15000);

    const theatreMs = p.doneAbs - p.dotsAt; // dots -> whole message: the capped span
    const longEnough = p.finalText.length >= 400;
    const underCap = theatreMs > 0 && theatreMs <= 8200;
    record('A. 8s cap (Boxer, real loop)', longEnough && underCap && p.sawDots && p.sawPartial,
      `finalLen=${p.finalText.length} theatre(dots->done)=${Math.round(theatreMs)}ms (uncapped ~20s; cap 8s, must be <=8200) goToDone=${Math.round(p.doneAt)}ms dotsSeen=${p.sawDots} streamed=${p.sawPartial}`);

    const distinct = [...new Set(await readSr(page))];
    record('D. aria-live once/whole', distinct.length === 1 && distinct[0] === p.finalText,
      `distinctAnnouncements=${distinct.length} matchesFinal=${distinct[0] === p.finalText}`);
    await ctx.close();
  }

  // ---- B: reduced-motion renders the whole message instantly, no dots/stream ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await openAndPick(page, 'Border Collie');
    await sendTimed(page, LONG);
    const t0 = Date.now();
    let p;
    do {
      await page.waitForTimeout(20);
      p = await readProbe(page);
    } while (!p.doneAt && Date.now() - t0 < 3000);

    const instant = p.doneAt > 0 && p.doneAt <= 500;
    record('B. reduced-motion instant', instant && !p.sawDots && !p.sawPartial && p.finalText.length >= 400,
      `wholeAt=${Math.round(p.doneAt)}ms (<=500) dotsSeen=${p.sawDots} streamed=${p.sawPartial} finalLen=${p.finalText.length}`);
    const distinct = [...new Set(await readSr(page))];
    record('B2. reduced-motion live once', distinct.length === 1 && distinct[0] === p.finalText,
      `distinctAnnouncements=${distinct.length}`);
    await ctx.close();
  }

  // ---- C: tap-complete and Enter-complete ----
  for (const mode of ['tap', 'enter']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await openAndPick(page, 'Boxer');
    await sendTimed(page, LONG);
    // Wait until mid-performance: a typing partial is on screen.
    const t0 = Date.now();
    let midLen = 0;
    while (Date.now() - t0 < 7000) {
      const s = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        const lines = [...d.querySelectorAll('[class*="dialogue"]')];
        const last = lines[lines.length - 1];
        const input = d.querySelector('input');
        return last ? { hidden: last.getAttribute('aria-hidden'), len: last.textContent.length, disabled: input.disabled } : { hidden: null, len: 0, disabled: null };
      });
      if (s.hidden === 'true' && s.len > 3) { midLen = s.len; break; }
      await page.waitForTimeout(20);
    }
    if (mode === 'tap') await page.locator('[role="dialog"] [class*="thread"]').first().click({ position: { x: 10, y: 10 } });
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const s = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      const lines = [...d.querySelectorAll('[class*="dialogue"]')];
      const last = lines[lines.length - 1];
      const input = d.querySelector('input');
      return { hidden: last.getAttribute('aria-hidden'), len: last.textContent.length, disabled: input.disabled };
    });
    const jumped = s.hidden === 'false' && s.len > midLen && s.len >= 400;
    record(`C. ${mode}-complete`, midLen > 0 && jumped && s.disabled === false,
      `midLen=${midLen} -> finalLen=${s.len} inputReenabled=${s.disabled === false}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
