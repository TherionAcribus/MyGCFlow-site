// Captures 0.0.9 : couche de zones, panneaux Stats sur la carte, page Statistiques.
import { chromium } from 'file:///C:/Users/fabie/Documents/Projets/GCMap/node_modules/playwright/index.mjs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const OUT = path.join(HERE, 'shots');
const BASE = 'http://127.0.0.1:5021';
const steps = process.argv.slice(2);
const want = (name) => !steps.length || steps.includes(name);
const THEME = process.env.THEME || 'Épure';

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('dialog', (d) => d.accept());
const put = (data) => page.request.put(BASE + '/api/settings', { data });
const app = (body, arg) => page.evaluate(async ({ body, arg }) => {
  const pkg = await import('/static/js/index.js');
  return new Function('pkg', 'arg', body)(pkg, arg);
}, { body, arg });

async function openMain(hash = '') {
  await page.goto(BASE + '/' + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.mygcflowReady === true);
  await page.waitForFunction(() => window.mygcflowFirstUseSettled === true);
  await page.evaluate(() => document.querySelectorAll('.modal.show .btn-close').forEach((b) => b.click()));
}
const layout = (name) => page.evaluate((n) => {
  document.activeElement?.blur();
  document.querySelectorAll('.tooltip').forEach((t) => t.remove());
  document.querySelector(`#layoutPresets [data-layout="${n}"]`).click();
}, name);
async function frame(lonLat, zoom) {
  await app(`const v = pkg.getMap().getView(); v.setCenter(ol.proj.fromLonLat(arg.lonLat)); v.setZoom(arg.zoom);`, { lonLat, zoom });
}

if (want('import')) {
  await openMain();
  if (!/1[ \u202f\u00a0]?736/.test(await page.locator('#filtersCounter').innerText().catch(() => ''))) {
    await page.locator('#file-input').setInputFiles(path.join(HERE, 'demo-finds.gpx'));
    await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 120000 });
  }
  await page.waitForTimeout(4000);
  console.log('counter', await page.locator('#filtersCounter').innerText());
}

if (want('zones')) {
  await put({ zones_display: true, stats: { enabled: true, panels: [] } });
  await openMain('#zones');
  await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 60000 });
  await page.evaluate(async (n) => { await window.profileManager.loadProfile(n); }, THEME);
  await page.locator('a[href="#zones"]').click();
  await page.waitForTimeout(1000);
  if (!(await page.locator('#switchZonesDisplay').isChecked())) await page.locator('#switchZonesDisplay').check();
  if (process.env.PRESET) await page.locator('#zonesPreset').selectOption(process.env.PRESET);
  await page.locator('#zonesLevel').selectOption(process.env.LEVEL || 'subregion');
  if (process.env.SOLO && !(await page.locator('#zonesSolo').isChecked())) await page.locator('#zonesSolo').check({ force: true });
  if (!process.env.SOLO && (await page.locator('#zonesSolo').isChecked())) await page.locator('#zonesSolo').uncheck({ force: true });
  await page.waitForFunction(async () => (await import('/static/js/index.js')).getZoneLayerDebugState().status === 'ready', null, { timeout: 30000 });
  if (process.env.OPACITY) await page.evaluate((v) => {
    const el = document.getElementById('zonesOpacity');
    el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }, process.env.OPACITY);
  await layout('sidebar');
  await frame([4.2, 47.2], 5.6);
  await page.mouse.move(700, 450);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(OUT, `ui-zones${process.env.TAG || ''}.png`) });
  await layout('map');
  await page.waitForTimeout(800);
  await frame([4.2, 47.4], 5.75);
  await page.mouse.move(700, 450);
  await page.waitForTimeout(6000);
  await page.locator('#mapWithFrames').screenshot({ path: path.join(OUT, `zones-carte${process.env.TAG || ''}.png`) });
  console.log('zones', JSON.stringify((await app('return pkg.getZoneLayerDebugState()')).legend));
  await layout('sidebar');
  await put({ zones_display: false });
}

if (want('panels')) {
  await put({ zones_display: false, stats: { enabled: true, panels: [
    { id: 'aaaaaa01', kind: 'grid', metric: 'dt', position: { mode: 'anchor', anchor: 'bottom-left', dx: 16, dy: 16 } },
    { id: 'aaaaaa02', kind: 'line', metric: 'cumulative', position: { mode: 'anchor', anchor: 'top-right', dx: 16, dy: 76, width: 320 } },
    { id: 'aaaaaa03', kind: 'bar', metric: 'cache_type', position: { mode: 'anchor', anchor: 'bottom-right', dx: 16, dy: 16, width: 300 } },
  ] } });
  await openMain('#stats');
  await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 60000 });
  await page.evaluate(async (n) => { await window.profileManager.loadProfile(n); }, process.env.PANELS_THEME || 'Cinématique');
  await page.locator('a[href="#animation"]').click();
  await page.locator('#rhythmModeRate').check({ force: true });
  await page.waitForTimeout(300);
  await page.locator('#inputDaysPerSecond').fill('190');
  await page.locator('#inputDaysPerSecond').blur();
  await layout('map');
  await page.waitForTimeout(800);
  await page.mouse.move(700, 450);
  await page.waitForTimeout(5000);
  await page.locator('#btnQuickPreview').click();
  await page.waitForTimeout(Number(process.env.PANELS_WAIT || 16000));
  await page.locator('#btnQuickPause').click();
  await page.waitForTimeout(300);
  await page.locator('#mapWithFrames').screenshot({ path: path.join(OUT, 'panneaux-stats.png') });
  await page.locator('#btnQuickStop').click();
  await page.waitForTimeout(800);
  await layout('sidebar');
  await put({ stats: { enabled: true, panels: [] } });
}

if (want('ui')) {
  await put({ zones_display: false, stats: { enabled: true, panels: [] } });
  await openMain('#style');
  await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 60000 });
  await page.evaluate(async () => { await window.profileManager.loadProfile('Default'); });
  await layout('sidebar');
  await frame([5.6, 47.6], 5.9);
  await page.locator('a[href="#style"]').click();
  await page.locator('#btn-manage-profiles').click();
  await page.mouse.move(700, 450);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(OUT, 'ui-themes.png') });
}

if (want('statspage')) {
  await page.goto(BASE + '/stats', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.mygcflowStatsReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, 'page-statistiques.png') });
  await page.screenshot({ path: path.join(OUT, 'page-statistiques-full.png'), fullPage: true });
  console.log('stats cards', JSON.stringify((await page.evaluate(() => window.getStatsPageSnapshot?.() ?? null))?.cards?.map((c) => c.title || c.id)));
}

await browser.close();
