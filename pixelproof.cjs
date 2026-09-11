const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  await p.tap('#search-trigger'); await p.waitForTimeout(400);
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4.1-search-dark.png' });
  await ctx.close();
  const ctx2 = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'light', hasTouch:true, isMobile:true });
  const p2 = await ctx2.newPage();
  await p2.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  await p2.tap('#search-trigger'); await p2.waitForTimeout(400);
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4.1-search-light.png' });
  await ctx2.close();
  await b.close();
  // sample the panel pixel
  const { execSync } = require('child_process');
  console.log('shots taken');
})();
