// One-off CP2 verification: prove the launcher is mounted globally (appears on
// the home page, not just /pick-a-chum), sits bottom-left, opens the selector,
// and does not block the nav / cookie / offer chrome. Saves shots to the CP2
// evidence folder. Requires dev on :3737.

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'agent/checkpoint2-screens');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
const page = await ctx.newPage();

// Home page: the launcher must be present here purely via the global layout mount.
await page.goto('http://localhost:3737/home', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const launcher = page.getByRole('button', { name: 'Pick a Chum' });
console.log('launcher visible on /home:', await launcher.isVisible());
const box = await launcher.boundingBox();
console.log('launcher box (bottom-left expected):', box);
await page.screenshot({ path: join(OUT, 'global-home-01-closed.png') });

// Open -> selector fans up-right from bottom-left.
await launcher.click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, 'global-home-02-selector.png') });

// Pick the Collie -> waiting state on the home page.
await page.getByRole('button', { name: 'Border Collie' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: join(OUT, 'global-home-03-waiting.png') });

await browser.close();
console.log('done');
