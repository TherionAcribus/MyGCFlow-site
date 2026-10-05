import { chromium } from 'file:///C:/Users/fabie/Documents/Projets/GCMap/node_modules/playwright/index.mjs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const OUT = path.join(HERE, 'shots');
const BASE = 'http://127.0.0.1:5021';

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.mygcflowReady === true);
await page.waitForFunction(() => window.mygcflowFirstUseSettled === true);
await page.screenshot({ path: path.join(OUT, '00-vide.png') });

const status = await (await page.request.get(BASE + '/db_status')).json();
console.log('db_status', JSON.stringify(status));
if (!/1[ \u202f\u00a0]?736/.test(await page.locator('#filtersCounter').innerText().catch(() => ''))) {
  await page.locator('#file-input').setInputFiles(path.join(HERE, 'demo-finds.gpx'));
  await page.waitForFunction(async () => {
    const app = await import('/static/js/index.js');
    return app.metadata?.numberOfCaches === 1736;
  }, null, { timeout: 120000 });
}
await page.waitForTimeout(6000);
console.log('counter', await page.locator('#filtersCounter').innerText());
await page.screenshot({ path: path.join(OUT, '01-donnees.png') });

await page.locator('a[href="#style"]').click();
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '02-style.png') });

await page.locator('#btn-manage-profiles').click();
await page.waitForTimeout(4000);
await page.screenshot({ path: path.join(OUT, '03-themes.png') });
console.log('profiles', JSON.stringify(await page.evaluate(() => window.profileManager.profilesList)));

await page.locator('a[href="#animation"]').click();
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '04-animation.png') });

await browser.close();
