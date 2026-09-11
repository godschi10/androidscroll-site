/* v0.4 REPRO part A — theme cycle on dark touch phone */
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
  const b = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--renderer-process-limit=1','--disable-gpu','--no-zygote'] });
  const errs = [];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0,120)));
  await p.goto(URL, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(400);
  console.log('A0 initial:', JSON.stringify(await state(p)));
  for (let i=1;i<=3;i++){
    await p.locator('#theme-toggle').tap();
    await p.waitForTimeout(350);
    console.log('A'+i+' after tap'+i+':', JSON.stringify(await state(p)));
    await p.screenshot({ path: S(`repro-cycle-dark-${i}.png`) });
  }
  const prefs = [];
  for (let i=0;i<6;i++){ await p.locator('#theme-toggle').tap(); await p.waitForTimeout(200); prefs.push((await state(p)).pref); }
  console.log('A next-6 prefs:', JSON.stringify(prefs), 'dark-reachable?', prefs.includes('dark'));
  console.log('ERRORS:', JSON.stringify(errs));
  await ctx.close(); await b.close();
})().catch(e => { console.error('FATAL', String(e).slice(0,300)); process.exit(1); });
