/* v0.4 REPRO — phone touch context, dark + light colorScheme, local build == live v0.3.2 */
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8791/index.html';
const S = p => '/home/ubuntu/androidscroll/shots/' + p;
const state = p => p.evaluate(() => ({
  theme: document.documentElement.getAttribute('data-theme'),
  pref: document.documentElement.getAttribute('data-theme-pref'),
  stored: localStorage.getItem('as-theme'),
  aria: document.getElementById('theme-toggle').getAttribute('aria-label'),
  glyph: [...document.querySelectorAll('#theme-toggle svg')].find(s => getComputedStyle(s).display !== 'none')?.getAttribute('class')
}));
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const errs = [];
  // ---- A: DARK phone, touch taps on theme-toggle, shot after each ----
  let ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  let p = await ctx.newPage();
  p.on('pageerror', e => errs.push('A:'+String(e).slice(0,100)));
  await p.goto(URL, { waitUntil:'networkidle' });
  console.log('A0 initial:', JSON.stringify(await state(p)));
  for (let i=1;i<=3;i++){
    await p.locator('#theme-toggle').tap();
    await p.waitForTimeout(350);
    console.log('A'+i+' after tap'+i+':', JSON.stringify(await state(p)));
    await p.screenshot({ path: S(`repro-cycle-dark-${i}.png`) });
  }
  const prefs = [];
  for (let i=0;i<6;i++){ await p.locator('#theme-toggle').tap(); await p.waitForTimeout(250); prefs.push((await state(p)).pref); }
  console.log('A cycle prefs over 6 more taps:', JSON.stringify(prefs), ' -> dark reachable?', prefs.includes('dark'));
  await ctx.close();
  // ---- B: DARK phone, search overlay anatomy proof ----
  ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  p = await ctx.newPage();
  p.on('pageerror', e => errs.push('B:'+String(e).slice(0,100)));
  await p.goto(URL, { waitUntil:'networkidle' });
  await p.locator('#search-trigger').tap(); await p.waitForTimeout(400);
  const proof = await p.evaluate(() => {
    const box = document.querySelector('.search-box');
    const r = box.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width/2, r.top + 8);
    const scrim = document.querySelector('.search-layer .scrim');
    return {
      topmostAtPanelCenter: hit ? (hit.className||hit.id||hit.tagName) : null,
      scrimIsOnTopOfPanel: !!(hit && hit.classList && hit.classList.contains('scrim')),
      scrimZ: getComputedStyle(scrim).zIndex, boxZ: getComputedStyle(box).zIndex,
      boxBg: getComputedStyle(box).backgroundColor,
      scrimBg: getComputedStyle(scrim).backgroundColor, scrimOpacity: getComputedStyle(scrim).opacity
    };
  });
  console.log('B search dark anatomy:', JSON.stringify(proof));
  await p.screenshot({ path: S('repro-search-dark.png') });
  await ctx.close();
  // ---- C: LIGHT phone, search + sheet ----
  ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'light', hasTouch:true, isMobile:true });
  p = await ctx.newPage();
  p.on('pageerror', e => errs.push('C:'+String(e).slice(0,100)));
  await p.goto(URL, { waitUntil:'networkidle' });
  await p.locator('#search-trigger').tap(); await p.waitForTimeout(400);
  await p.screenshot({ path: S('repro-search-light.png') });
  await p.locator('#search-scrim').tap(); await p.waitForTimeout(250);
  await p.locator('#browse-trigger').tap(); await p.waitForTimeout(400);
  await p.screenshot({ path: S('repro-sheet-light.png') });
  await ctx.close();
  // ---- D: DARK phone, browse sheet ----
  ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  p = await ctx.newPage();
  p.on('pageerror', e => errs.push('D:'+String(e).slice(0,100)));
  await p.goto(URL, { waitUntil:'networkidle' });
  await p.locator('#browse-trigger').tap(); await p.waitForTimeout(400);
  await p.screenshot({ path: S('repro-sheet-dark.png') });
  console.log('D overflow scrollWidth:', await p.evaluate(() => document.documentElement.scrollWidth));
  await ctx.close();
  console.log('JS ERRORS:', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
