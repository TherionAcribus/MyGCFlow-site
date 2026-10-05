// Capture la carte seule, en cours d'animation, pour chaque thème fourni.
import { chromium } from 'file:///C:/Users/fabie/Documents/Projets/GCMap/node_modules/playwright/index.mjs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const OUT = path.join(HERE, 'shots');
const BASE = 'http://127.0.0.1:5021';
const only = process.argv.slice(2);
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('dialog', (d) => d.accept());

await page.goto(BASE + '/#animation', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.mygcflowReady === true);
await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 60000 });
await page.waitForTimeout(2500);

await page.locator('#rhythmModeRate').check({ force: true });
await page.waitForTimeout(300);
await page.locator('#inputDaysPerSecond').fill('190');
await page.locator('#inputDaysPerSecond').blur();

await page.locator('#inputExtraEndTime').fill('0');
await page.locator('#inputExtraEndTime').blur();
await page.locator('#layoutPresets [data-layout="map"]').click();
await page.waitForTimeout(800);
console.log('map box', JSON.stringify(await page.locator('#mapWithFrames').boundingBox()));

const names = await page.evaluate(() => window.profileManager.profilesList);
for (const name of names) {
  if (only.length && !only.includes(slug(name))) continue;
  await page.evaluate(async (n) => { await window.profileManager.loadProfile(n); }, name);
  await page.waitForTimeout(5000); // tuiles du fond
  await page.locator('#btnQuickPreview').click();
  await page.waitForTimeout(15500);
  await page.locator('#btnQuickPause').click();
  await page.waitForTimeout(150);
  await page.locator('#mapWithFrames').screenshot({ path: path.join(OUT, `theme-${slug(name)}.png`) });
  await page.locator('#btnQuickStop').click();
  await page.waitForTimeout(800);
  console.log('ok', name);
}
await browser.close();
