// Exporte une courte vidéo avec l'application elle-même (capture rapide).
import { chromium } from 'file:///C:/Users/fabie/Documents/Projets/GCMap/node_modules/playwright/index.mjs';
import path from 'node:path';
import { readdirSync, statSync } from 'node:fs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const VIDEO_DIR = path.join(HERE, 'runtime', 'video');
const BASE = 'http://127.0.0.1:5021';
const [theme = 'Cinématique', rate = '236'] = process.argv.slice(2);

const listVideos = () => {
  try {
    return readdirSync(VIDEO_DIR).filter((n) => /\.(mp4|webm)$/.test(n))
      .map((n) => ({ n, s: statSync(path.join(VIDEO_DIR, n)) }));
  } catch { return []; }
};
const before = new Set(listVideos().map((v) => v.n));

const browser = await chromium.launch({
  args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 968 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 200)); });
page.on('dialog', (d) => d.accept());

await page.goto(BASE + '/#animation', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.mygcflowReady === true);
await page.waitForFunction(async () => (await import('/static/js/index.js')).metadata?.numberOfCaches === 1736, null, { timeout: 60000 });
await page.waitForTimeout(2500);

await page.evaluate(async (n) => { await window.profileManager.loadProfile(n); }, theme);
await page.locator('#rhythmModeRate').check({ force: true });
await page.waitForTimeout(300);
await page.locator('#inputDaysPerSecond').fill(rate);
await page.locator('#inputDaysPerSecond').blur();
await page.locator('#inputExtraEndTime').fill('1');
await page.locator('#inputExtraEndTime').blur();

await page.locator('#recordingConfigTab').click();
await page.locator('#selectRecordMode').selectOption('mediarecorder');
const advanced = page.locator('#recordAdvancedSettings');
if (!(await advanced.evaluate((el) => el.open))) await advanced.locator('summary').click();
await page.locator('#inputRecordFps').fill('30');
await page.locator('#inputRecordBitrate').fill('8');
await page.locator('#inputRecordSlowdown').fill('3');
await page.locator('#inputRecordScaleFactor').fill('1');
await page.locator('#inputRecordScaleFactor').blur();
await page.locator('#cbRecordUpload').check();
await page.locator('#cbRecordDownload').uncheck();
if (await page.locator('#cbRecordNormalize').isEnabled()) await page.locator('#cbRecordNormalize').check();

await page.locator('#layoutPresets [data-layout="map"]').click();
await page.mouse.move(600, 420);
await page.waitForTimeout(5000);
console.log('map box', JSON.stringify(await page.locator('#mapWithFrames').boundingBox()));
console.log('summary', await page.locator('#exportSummary').innerText().catch(() => ''));

await page.evaluate(() => { document.activeElement?.blur(); document.querySelectorAll('.tooltip').forEach((t) => t.remove()); document.getElementById('btnQuickExport').click(); });
const deadline = Date.now() + 8 * 60000;
let found = null;
while (Date.now() < deadline && !found) {
  await page.waitForTimeout(3000);
  const fresh = listVideos().filter((v) => !before.has(v.n) && v.n.endsWith('.mp4') && v.s.size > 1000);
  if (fresh.length) {
    const size = fresh[0].s.size;
    await page.waitForTimeout(4000);
    if (statSync(path.join(VIDEO_DIR, fresh[0].n)).size === size) found = fresh[0].n;
  }
}
console.log('video', found, listVideos().map((v) => `${v.n}:${v.s.size}`).join(' '));
await browser.close();
