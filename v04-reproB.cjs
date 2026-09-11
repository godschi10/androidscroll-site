/* v0.4 REPRO part B — overlays in both themes + sheet dark separation */
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8791/index.html';
const S = p => '/home/ubuntu/androidscroll/shots/' + p;
async function run(scheme, tag){
  const b = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--renderer-process-limit=1'] });
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:scheme, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(400);
  await p.locator('#search-trigger').tap(); await p.waitForTimeout(400);
  const geo = await p.evaluate(() => {
    const box = document.querySelector('.search-box');
    const r = box.getBoundingClientRect();
    const top = document.elementFromPoint(Math.round(r.left+r.width/2), Math.round(r.top+30));
    return { panelTopElement: top ? (top.id || String(top.className) || top.tagName) : null,
             overScrim: !!(top && top.classList && top.classList.contains('scrim')),
             boxBg: getComputedStyle(box).backgroundColor, inputColor: getComputedStyle(document.querySelector('.search-box input')).color };
  });
  const px = await p.screenshot({ path: S(`repro-search-${tag}.png`) });
  // sample the actual rendered panel luminance from the screenshot buffer
  const { PNG } = (()=>{ try { return require('pngjs'); } catch { return {}; } })();
  let sample = null;
  if (PNG) { const img = PNG.sync.read(px); const idx=(img.width>>1)*4 + Math.round((geo.boxTop||90)*4); sample='via pngjs'; }
  console.log(`search[${tag}]:`, JSON.stringify(geo));
  // close search, open sheet
  await p.locator('#search-scrim').tap(); await p.waitForTimeout(300);
  await p.locator('#browse-trigger').tap(); await p.waitForTimeout(450);
  const sheet = await p.evaluate(() => {
    const s = document.querySelector('.sheet');
    return { bg: getComputedStyle(s).backgroundColor, topZ: getComputedStyle(s).zIndex,
             sheetTopEl: (document.elementFromPoint(195, 300)||{className:'?'}).className || '?' };
  });
  console.log(`sheet[${tag}]:`, JSON.stringify(sheet));
  await p.screenshot({ path: S(`repro-sheet-${tag}.png`) });
  console.log('scrollWidth:', await p.evaluate(()=>document.documentElement.scrollWidth));
  await ctx.close(); await b.close();
}
(async () => { await run('dark','dark'); await run('light','light'); })().catch(e=>{console.error('FATAL',String(e).slice(0,200));process.exit(1);});
