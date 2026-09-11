const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  // 1) theme toggle cycle on LIVE, system=light phone
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const seq = [];
  for (let i = 0; i < 4; i++) {
    seq.push(await p.evaluate(() => ({ pref: document.documentElement.getAttribute('data-theme-pref'), theme: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('as-theme'), label: document.getElementById('theme-toggle')?.getAttribute('aria-label') })));
    await p.click('#theme-toggle');
    await p.waitForTimeout(200);
  }
  seq.push(await p.evaluate(() => ({ pref: document.documentElement.getAttribute('data-theme-pref'), theme: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('as-theme'), label: document.getElementById('theme-toggle')?.getAttribute('aria-label') })));
  console.log('THEME CYCLE (system=light):');
  seq.forEach(s => console.log(' ', JSON.stringify(s)));
  // any JS errors?
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0,120)));
  await ctx.close();
  // 2) search overlay on DARK phone (King's context)
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errs.push('DARK: ' + String(e).slice(0,120)));
  await p2.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const initTheme = await p2.evaluate(() => ({ pref: document.documentElement.getAttribute('data-theme-pref'), theme: document.documentElement.getAttribute('data-theme') }));
  await p2.click('#search-trigger'); await p2.waitForTimeout(350);
  const colors = await p2.evaluate(() => {
    const box = document.querySelector('.search-box');
    const layer = document.querySelector('.search-layer');
    const scrim = layer.querySelector('.scrim');
    const gs = getComputedStyle(scrim); const bs = getComputedStyle(box);
    return { boxBg: bs.backgroundColor, boxBorder: bs.borderColor, boxTop: bs.borderTopColor, scrimOpacity: gs.opacity, scrimBg: gs.backgroundColor, canvasBg: getComputedStyle(document.body).backgroundColor };
  });
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/repro-search-dark.png' });
  console.log('DARK init:', JSON.stringify(initTheme), 'SEARCH colors:', JSON.stringify(colors, null, 1));
  console.log('JS ERRORS:', JSON.stringify(errs));
  await ctx2.close();
  await b.close();
})();
