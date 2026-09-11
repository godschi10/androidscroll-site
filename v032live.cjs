const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const url = 'https://godschi10.github.io/androidscroll-site/';
  // Test A: phone LIGHT — every click must visibly change theme or land system
  const c1 = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  const p1 = await c1.newPage();
  await p1.goto(url, { waitUntil: 'networkidle' });
  const seq1 = [];
  for (let i = 0; i < 4; i++) {
    seq1.push(await p1.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), pref: document.documentElement.getAttribute('data-theme-pref') })));
    await p1.click('#theme-toggle'); await p1.waitForTimeout(150);
  }
  console.log('LIGHT phone cycle:', JSON.stringify(seq1));
  await c1.close();
  // Test B: phone DARK — search overlay foreground clarity
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  const p2 = await c2.newPage();
  await p2.goto(url, { waitUntil: 'networkidle' });
  await p2.click('#search-trigger'); await p2.waitForTimeout(350);
  const cols = await p2.evaluate(() => {
    const box = document.querySelector('.search-box'), scr = document.querySelector('.search-layer .scrim');
    return { boxBg: getComputedStyle(box).backgroundColor, border: getComputedStyle(box).borderColor, scrim: getComputedStyle(scr).backgroundColor };
  });
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3.2-search-dark.png' });
  console.log('DARK search:', JSON.stringify(cols));
  await c2.close();
  // Test C: overflow guard
  const c3 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p3 = await c3.newPage();
  await p3.goto(url, { waitUntil: 'networkidle' });
  const of = await p3.evaluate(() => ({ scrollW: document.documentElement.scrollWidth }));
  console.log('overflow:', JSON.stringify(of));
  await b.close();
})();
