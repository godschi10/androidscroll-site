const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 500 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/audit-header-mobile.png' });
  const p2 = await b.newPage({ viewport: { width: 1280, height: 400 } });
  await p2.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/audit-header-desktop.png' });
  await b.close();
})();
