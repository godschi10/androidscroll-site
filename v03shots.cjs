const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  // mobile light
  let p = await b.newPage({ viewport: { width: 390, height: 300 } });
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3-header-mobile-light.png' });
  // mobile dark
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3-header-mobile-dark.png' });
  await p.close();
  // desktop light + dark
  p = await b.newPage({ viewport: { width: 1280, height: 300 } });
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3-header-desktop-light.png' });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.3-header-desktop-dark.png' });
  await b.close();
  console.log('shots done');
})();
