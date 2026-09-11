const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  // theme menu opens with 3 options, tap Dark, verify persisted + glyph
  await p.tap('#theme-toggle'); await p.waitForTimeout(250);
  const menuOpen = await p.evaluate(() => { const m = document.getElementById('theme-menu'); const r = m.getBoundingClientRect(); return { hidden: m.hidden, w: Math.round(r.width), opts: m.querySelectorAll('button').length, visible: r.top >= 40 && r.top < 200 }; });
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.5-theme-menu-dark.png' });
  await p.tap('.theme-menu [data-pref="light"]'); await p.waitForTimeout(250);
  const afterLight = await p.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), pref: document.documentElement.getAttribute('data-theme-pref'), stored: localStorage.getItem('as-theme'), menuClosed: document.getElementById('theme-menu').hidden }));
  await p.tap('#theme-toggle'); await p.waitForTimeout(200);
  await p.tap('.theme-menu [data-pref="system"]'); await p.waitForTimeout(200);
  const afterSys = await p.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('as-theme') }));
  await p.tap('#theme-toggle'); await p.waitForTimeout(200);
  await p.tap('.theme-menu [data-pref="dark"]'); await p.waitForTimeout(200);
  const afterDark = await p.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('as-theme') }));
  console.log('menu:', JSON.stringify(menuOpen));
  console.log('->light:', JSON.stringify(afterLight), '| ->system:', JSON.stringify(afterSys), '| ->dark:', JSON.stringify(afterDark));
  // search in dark now = --paper #0B241D (site-consistent), panel must be lifted vs canvas AND vs scrim
  await p.tap('#search-trigger'); await p.waitForTimeout(400);
  const px = await p.evaluate(() => { const m = getComputedStyle(document.querySelector('.search-box')).backgroundColor.match(/[\d.]+/g); return m.map(Number).slice(0,3); });
  console.log('search panel dark rgb:', px.join(','));
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.5-search-dark.png' });
  await ctx.close(); await b.close();
})();
