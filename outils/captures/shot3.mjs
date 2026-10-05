// Captures : trajet animé, interface complète, mode Évolution.
import { chromium } from 'file:///C:/Users/fabie/Documents/Projets/GCMap/node_modules/playwright/index.mjs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const OUT = path.join(HERE, 'shots');
const BASE = 'http://127.0.0.1:5021';
const steps = process.argv.slice(2);
const want = (name) => !steps.length || steps.includes(name);

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('dialog', (d) => d.accept());
const clickRaw = (id) => page.evaluate((i) => {
  document.activeElement?.blur();
  document.querySelectorAll('.tooltip').forEach((t) => t.remove());
  document.getElementById(i).click();
}, id);

async function openMain(hash) {
  await page.goto(BASE + '/' + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.mygcflowReady === true);
  await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 60000 });
  await page.waitForTimeout(2500);
}

if (want('trail')) {
  await openMain('#style');
  await page.evaluate(async () => { await window.profileManager.loadProfile('Cinématique'); });
  await page.locator('a[href="#tabTrail"]').click();
  await page.waitForTimeout(800);
  if (!(await page.locator('#switchTrail').isChecked())) await page.locator('label[for="switchTrail"]').click();
  await page.locator('#trailPresetFull').click();
  await page.waitForTimeout(800);
  await page.locator('#btnTrailPreview').click();
  await page.mouse.move(500, 300);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, 'ui-trajet.png') });
  await page.locator('#layoutPresets [data-layout="map"]').click();
  await page.mouse.move(600, 400);
  await page.waitForTimeout(2500);
  await page.locator('#mapWithFrames').screenshot({ path: path.join(OUT, 'trajet-apercu.png') });
  await page.locator('#layoutPresets [data-layout="sidebar"]').click();
  await page.locator('#btnTrailPreview').click();
  await page.locator('a[href="#animation"]').click();
  await page.locator('#rhythmModeRate').check({ force: true });
  await page.waitForTimeout(300);
  await page.locator('#inputDaysPerSecond').fill('90');
  await page.locator('#inputDaysPerSecond').blur();
  await page.locator('#layoutPresets [data-layout="map"]').click();
  await page.mouse.move(600, 400);
  await page.waitForTimeout(2000);
  await clickRaw('btnQuickPreview');
  for (const [i, wait] of [[1, 14000], [2, 9000], [3, 9000]]) {
    await page.waitForTimeout(wait);
    await page.locator('#mapWithFrames').screenshot({ path: path.join(OUT, `trajet-${i}.png`) });
  }
  await clickRaw('btnQuickStop');
  await page.waitForTimeout(800);
  await page.locator('#layoutPresets [data-layout="sidebar"]').click();
  console.log('trail ok');
}

if (want('evolution')) {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const dataset of (await (await page.request.get(BASE + '/api/evolution/datasets')).json()).datasets) {
    await page.request.delete(`${BASE}/api/evolution/datasets/${dataset.id}`);
  }
  await page.goto(BASE + '/evolution', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.mygcflowReady === true && window.mygcflowEvolutionLoaded === true);
  const loaded = page.evaluate(() => new Promise((resolve) => {
    window.addEventListener('mygcflow:evolution-loaded', (e) => resolve(e.detail), { once: true });
  }));
  await page.locator('#evolutionCsvInput').setInputFiles(path.join(HERE, 'Zone de démonstration.csv'));
  console.log('evolution loaded', JSON.stringify(await loaded));
  const frame = () => page.evaluate(async () => {
    const app = await import('/static/js/index.js');
    const R = 20037508.34;
    const view = app.getMap().getView();
    view.setCenter([3.25 * R / 180, Math.log(Math.tan((90 + 45.6) * Math.PI / 360)) / Math.PI * R]);
    view.setZoom(8.55);
  });
  for (const theme of ['Évolution Classique', 'Évolution Nuit']) {
    const tag = theme.endsWith('Nuit') ? 'nuit' : 'classique';
    await page.evaluate(async (n) => { await window.profileManager.loadProfile(n); }, theme);
    await page.locator('#layoutPresets [data-layout="sidebar"]').click();
    await frame();
    await page.mouse.move(500, 400);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(OUT, `ui-evolution-${tag}.png`) });
    await page.locator('#layoutPresets [data-layout="map"]').click();
    await frame();
    await page.mouse.move(600, 400);
    await page.waitForTimeout(5000);
    await clickRaw('btnQuickPreview');
    for (const [i, wait] of [[1, 24000], [2, 14000], [3, 12000]]) {
      await page.waitForTimeout(wait);
      await page.locator('#mapWithFrames').screenshot({ path: path.join(OUT, `evolution-${tag}-${i}.png`) });
    }
    await clickRaw('btnQuickStop');
    await page.waitForTimeout(800);
  }
  await page.locator('#layoutPresets [data-layout="sidebar"]').click();
  console.log('evolution ok');
}

await browser.close();
