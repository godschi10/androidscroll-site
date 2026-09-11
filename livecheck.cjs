const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, docW: document.documentElement.clientWidth }));
  console.log('LIVE:', JSON.stringify(res));
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.2.2-live-390.png', fullPage: true });
  const p2 = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p2.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.2.2-live-1280.png', fullPage: true });
  await b.close();
})();
