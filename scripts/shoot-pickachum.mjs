// Checkpoint 2 QA evidence: capture the Pick a Chum visual states at desktop
// (1280) and mobile (390) widths and save them for review. Requires the dev
// server running on :3737. Run: node scripts/shoot-pickachum.mjs

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'agent/checkpoint2-screens');
mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:3737/pick-a-chum';

const VIEWPORTS = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const browser = await chromium.launch();
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce', // instant text-on for deterministic shots
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    async function shoot(tag) {
      await page.screenshot({ path: join(OUT, `${vp.name}-${tag}.png`) });
      console.log(`  ${vp.name}-${tag}.png`);
    }

    // 1. Closed launcher over the page.
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await shoot('01-closed');

    // 2. Radial selector.
    await page.getByRole('button', { name: 'Pick a Chum' }).click();
    await page.waitForTimeout(300);
    await shoot('02-selector');

    // 3. Silent waiting state (Collie selected).
    await page.getByRole('button', { name: 'Border Collie' }).click();
    await page.waitForTimeout(300);
    await shoot('03-waiting');

    // 4. Response HUD (a transfer: "Sausages." -> Labrador).
    await page.getByLabel('Type something here').fill('Sausages.');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByText('Ask something else').waitFor({ timeout: 8000 });
    await page.waitForTimeout(200);
    await shoot('04-response-transfer');

    // 5. Commercial on a fresh Collie session (a transfer left the Labrador
    // active above; the Collie is the MVP responder). Close, reopen, pick Collie.
    await page.getByText('Close').click();
    await page.getByRole('button', { name: 'Pick a Chum' }).click();
    await page.getByRole('button', { name: 'Border Collie' }).click();
    await page.getByLabel('Type something here').fill('Hello, how much is the game?');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByText('Get the 30% discount code').waitFor({ timeout: 8000 });
    await page.waitForTimeout(200);
    await shoot('05-response-discount');

    await context.close();
  }
} finally {
  await browser.close();
}
console.log('done');
