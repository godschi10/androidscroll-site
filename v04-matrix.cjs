const { chromium } = require('playwright');
const URL = 'file:///home/ubuntu/androidscroll/build/dist/index.html';
const lum = (r,g,b) => Math.round(0.2126*r + 0.7152*g + 0.0722*b);
(async () => {
  const b = await chromium.launch();
  let pass = 0, fail = 0;
  for (const phone of ['light','dark']) {
    for (const start of ['system','light','dark']) {
      for (const target of ['light','system','dark']) {
        const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme: phone, hasTouch: true, isMobile: true });
        const p = await ctx.newPage();
        await p.goto(URL, { waitUntil: 'domcontentloaded' });
        await p.evaluate(s => { localStorage.setItem('as-theme', s); }, start);
        await p.reload({ waitUntil: 'networkidle' });
        const before = await p.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), pr: document.documentElement.getAttribute('data-theme-pref') }));
        await p.tap('#browse-trigger'); await p.waitForTimeout(250); await p.click('.sheet-theme [data-pref=\'' + target + '\']');
        await p.waitForTimeout(150);
        const after = await p.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), pr: document.documentElement.getAttribute('data-theme-pref'), stored: localStorage.getItem('as-theme') }));
        const expectEff = target === 'system' ? phone : target;
        const ok = after.pr === target && after.t === expectEff && after.stored === target;
        const legitSame = before.t === after.t; // same look only allowed when target==system matches phone
        if (ok && (!legitSame || target === 'system')) pass++; else { fail++; console.log('FAIL', phone, start, '->', target, JSON.stringify({before, after})); }
        await ctx.close();
      }
    }
  }
  // dark search luminance
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.setItem('as-theme','dark')); await p.reload({ waitUntil: 'networkidle' });
  await p.tap('#search-trigger'); await p.waitForTimeout(300);
  const bg = await p.evaluate(() => { const m = getComputedStyle(document.querySelector('.search-box')).backgroundColor.match(/[\d.]+/g); return m.map(Number); });
  const L = lum(bg[0],bg[1],bg[2]);
  console.log('DARK search panel rgb(' + bg.slice(0,3).join(',') + ') luminance=' + L + (L>=230?' OK':' FAIL'));
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4-search-dark.png' });
  await p.tap('.search-layer .close-x').catch(()=>{});
  await ctx.close();
  // light search + sheet shots
  const ctx2 = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'light', hasTouch:true, isMobile:true });
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: 'networkidle' });
  await p2.tap('#search-trigger'); await p2.waitForTimeout(250);
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4-search-light.png' });
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(200);
  await p2.tap('#browse-trigger'); await p2.waitForTimeout(300);
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4-sheet-light.png' });
  const of = await p2.evaluate(() => document.documentElement.scrollWidth);
  console.log('overflow scrollW:', of);
  console.log('MATRIX:', pass, 'pass /', fail, 'fail (18 total pairs x... =', pass+fail, 'of 18+6? expected 54? )');
  await b.close();
})();
