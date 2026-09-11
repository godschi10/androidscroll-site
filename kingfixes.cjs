const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  // browse sheet position check
  await p.click('#browse-trigger'); await p.waitForTimeout(400);
  const sheetTop = await p.evaluate(() => Math.round(document.getElementById('browse-sheet').getBoundingClientRect().top));
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3.1-sheet-390.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // search overlay check
  await p.click('#search-trigger'); await p.waitForTimeout(400);
  const searchTop = await p.evaluate(() => { const r = document.querySelector('.search-box').getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right) }; });
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3.1-search-390.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // theme 3-state cycle
  const states = [];
  for (let i = 0; i < 3; i++) {
    states.push(await p.evaluate(() => document.getElementById('theme-toggle').getAttribute('aria-label')));
    await p.click('#theme-toggle'); await p.waitForTimeout(250);
  }
  const finalTheme = await p.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), pref: document.documentElement.getAttribute('data-theme-pref') }));
  // blowout guard recheck
  const overflow = await p.evaluate(() => { const dw = document.documentElement.clientWidth; let bad = 0; document.querySelectorAll('body *').forEach(el => { const cs = getComputedStyle(el); if (cs.position==='fixed'||cs.position==='absolute') return; if (el.getBoundingClientRect().right > dw + 1 && el.getBoundingClientRect().width > 0) bad++; }); return { scrollW: document.documentElement.scrollWidth, bad }; });
  console.log(JSON.stringify({ sheetTop, searchTop, states, finalTheme, overflow }, null, 1));
  await b.close();
})();
