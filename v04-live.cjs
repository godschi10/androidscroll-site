const { chromium } = require('playwright');
const URL = 'https://godschi10.github.io/androidscroll-site/';
const lum = (r,g,b) => Math.round(0.2126*r + 0.7152*g + 0.0722*b);
(async () => {
  const b = await chromium.launch();
  let pass = 0, fail = 0;
  for (const phone of ['light','dark']) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme: phone, hasTouch: true, isMobile: true });
    for (const start of ['system','light','dark']) {
      for (const target of ['light','system','dark']) {
        const p = await ctx.newPage();
        await p.goto(URL, { waitUntil: 'domcontentloaded' });
        await p.evaluate(s => localStorage.setItem('as-theme', s), start);
        await p.reload({ waitUntil: 'networkidle' });
        const before = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
        await p.tap('#browse-trigger'); await p.waitForTimeout(200);
        await p.tap('.sheet-theme [data-pref="' + target + '"]'); await p.waitForTimeout(150);
        const after = await p.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), pr: document.documentElement.getAttribute('data-theme-pref'), stored: localStorage.getItem('as-theme') }));
        const expectEff = target === 'system' ? phone : target;
        const legitSame = before === after.t && target === 'system';
        const ok = after.pr === target && after.t === expectEff && after.stored === target;
        if (ok) pass++; else { fail++; console.log('FAIL', phone, start, '->', target, JSON.stringify({ before, after })); }
        await p.close();
      }
    }
    await ctx.close();
  }
  console.log('MATRIX: ' + pass + '/18 pass, ' + fail + ' fail');
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.tap('#search-trigger'); await p.waitForTimeout(300);
  const bg = await p.evaluate(() => getComputedStyle(document.querySelector('.search-box')).backgroundColor.match(/[\d.]+/g).map(Number));
  const L = lum(bg[0],bg[1],bg[2]);
  console.log('DARK search panel rgb(' + bg.slice(0,3).join(',') + ') luminance=' + L + (L >= 230 ? ' OK' : ' FAIL'));
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4-search-dark.png' });
  await ctx.close();
  const ctx2 = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'light', hasTouch:true, isMobile:true });
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: 'networkidle' });
  await p2.tap('#browse-trigger'); await p2.waitForTimeout(300);
  const of = await p2.evaluate(() => document.documentElement.scrollWidth);
  console.log('overflow scrollW:', of);
  await p2.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.4-sheet-light.png' });
  await ctx2.close();
  await b.close();
})().catch(e => { console.error('CRASH', String(e).slice(0,100)); process.exit(1); });
