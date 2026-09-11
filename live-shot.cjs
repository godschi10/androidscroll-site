const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  await p.tap('#search-trigger'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4.1-live-dark.png' });
  await b.close();
})();
