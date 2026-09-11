const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--disable-gpu','--single-process'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: undefined });
  const page = await ctx.newPage();
  page.on('pageerror', e => { console.log('PAGEERROR:' + e.message.slice(0,200)); process.exitCode = 1; });
  try {
    await page.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForFunction(() => document.getElementById('search-index').textContent, { timeout: 6000 });
    console.log('PAGE_LOADED');
    await take(page); await page.click('#search-trigger'); await page.waitForTimeout(150);
    console.log('OVERLAY_OPEN');
    await take(page); await page.locator('#search-input').focus(); await page.waitForTimeout(150);
    console.log('INPUT_FOCUSED');
    await take(page);
  } catch(e) {
    console.log('CRASH:' + e.message.slice(0,200));
    try { await page.screenshot({ path: '/home/ubuntu/androidscroll/shots/crash-minimal.png', fullPage:false }); console.log('SHOT:crash-minimal.png'); }
    catch(_) {}
  }
  async function take(p) {
    try { await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/minimal-step.png', fullPage:false }); }
    catch(_) {}
  }
  await b.close();
})();
