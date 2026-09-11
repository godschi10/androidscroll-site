/* v0.4 PHASE B VERIFY — phone touch context (hasTouch,isMobile,390x844) vs local dist.
   12 theme transitions = start pref {system|light|dark} x different target, in BOTH
   phone modes (colorScheme dark + light), driven through the NEW segmented control.
   Asserts data-theme + data-theme-pref + localStorage 'as-theme': change-or-legitimately-same.
   Plus: dark .search-box luminance >=230, 3 shots, overflow scrollWidth==390, cycle-button sanity. */
const { chromium } = require('playwright');
const URL = process.argv[2] || 'file:///home/ubuntu/androidscroll/build/dist/index.html';
const TAG = process.argv[3] || 'local';
const S = p => '/home/ubuntu/androidscroll/shots/' + p;
const lum = rgb => { const m = rgb.match(/\d+/g).map(Number); return { r:m[0], g:m[1], b:m[2], avg:(m[0]+m[1]+m[2])/3 }; };
const state = p => p.evaluate(() => ({
  theme: document.documentElement.getAttribute('data-theme'),
  pref: document.documentElement.getAttribute('data-theme-pref'),
  stored: localStorage.getItem('as-theme'),
  activeSeg: document.querySelector('.theme-seg button.is-active')?.dataset.pref || null,
  segAria: document.querySelector('.theme-seg button.is-active')?.getAttribute('aria-checked') || null
}));

async function setPref(p, pref) {           // drive the segmented control (opens sheet if closed)
  const open = await p.evaluate(() => !document.getElementById('browse-sheet').hidden);
  if (!open) { await p.locator('#browse-trigger').tap(); await p.waitForTimeout(300); }
  await p.locator(`.theme-seg button[data-pref="${pref}"]`).tap();
  await p.waitForTimeout(250);
}

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--renderer-process-limit=1'] });
  const errs = []; let pass = 0, fail = 0; const rows = [];
  const effectOf = (pref, phoneDark) => pref === 'system' ? (phoneDark ? 'dark' : 'light') : pref;

  for (const phone of [{ cs:'dark', dark:true }, { cs:'light', dark:false }]) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:phone.cs, hasTouch:true, isMobile:true });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`${phone.cs}:` + String(e).slice(0,140)));
    await p.goto(URL, { waitUntil:'load' }); await p.waitForTimeout(350);
    for (const start of ['system','light','dark']) {
      await p.evaluate(s => localStorage.setItem('as-theme', s), start);
      await p.reload({ waitUntil:'load' }); await p.waitForTimeout(350);
      const s0 = await state(p);
      const okStart = s0.pref === start && s0.theme === effectOf(start, phone.dark) && s0.stored === start;
      if (!okStart) { rows.push(`SETUP ${phone.cs} start=${start} BAD ${JSON.stringify(s0)}`); fail++; }
      for (const target of ['system','light','dark'].filter(t => t !== start)) {
        await setPref(p, target);
        const s1 = await state(p);
        const wantTheme = effectOf(target, phone.dark);
        const themeOK = s1.theme === wantTheme;
        const prefOK = s1.pref === target && s1.stored === target;
        const segOK = s1.activeSeg === target && s1.segAria === 'true';
        const changed = s1.theme !== s0.theme;
        const legitSame = !changed && wantTheme === s0.theme;   // effect genuinely equal → legitimate no-op
        const ok = themeOK && prefOK && segOK && (changed || legitSame);
        rows.push(`${phone.cs} ${start}->${target}: theme ${s0.theme}->${s1.theme} pref=${s1.pref} stored=${s1.stored} seg=${s1.activeSeg} ${changed ? 'VISIBLE-CHANGE' : legitSame ? 'LEGIT-SAME(effect)' : 'FAIL-nochange'} ${ok ? 'PASS' : 'FAIL'}`);
        ok ? pass++ : fail++;
      }
    }
    // overflow guard (sheet open state too)
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth,
      bodySw: document.body.scrollWidth }));
    rows.push(`${phone.cs} overflow: scrollWidth=${ov.sw} body=${ov.bodySw} ${ov.sw===390?'PASS':'FAIL'}`);
    ov.sw === 390 ? pass++ : fail++;
    await ctx.close();
  }

  // ---- dark-mode search panel luminance + shots ----
  const ctxD = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const pd = await ctxD.newPage();
  pd.on('pageerror', e => errs.push('searchD:' + String(e).slice(0,140)));
  await pd.goto(URL, { waitUntil:'load' }); await pd.waitForTimeout(300);
  const themeNow = await pd.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (themeNow !== 'dark') { await setPref(pd, 'dark'); await pd.evaluate(() => document.getElementById('browse-close').click()); await pd.waitForTimeout(300); }
  else { // close sheet if opened during earlier taps: fresh page, not open
  }
  await pd.locator('#search-trigger').tap(); await pd.waitForTimeout(400);
  const proof = await pd.evaluate(() => {
    const box = document.querySelector('.search-box');
    const cs = getComputedStyle(box);
    const inp = getComputedStyle(document.getElementById('search-input'));
    const meta = getComputedStyle(document.querySelector('.search-meta'));
    const r = box.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width/2, r.top + 60);
    return { bg: cs.backgroundColor, ink: cs.color, inputColor: inp.color,
      metaBorder: meta.borderBottomColor, topRule: cs.borderTopColor,
      topmost: hit ? (hit.className.baseVal !== undefined ? hit.tagName : String(hit.className||hit.id||hit.tagName)) : null };
  });
  const L = lum(proof.bg);
  const lumOK = L.avg >= 230;
  rows.push(`search-dark panel bg=${proof.bg} rgb(${L.r},${L.g},${L.b}) avg-lum=${L.avg.toFixed(1)} ink=${proof.ink} input=${proof.inputColor} metaBorder=${proof.metaBorder} topRule=${proof.topRule} topmost-over-panel=${proof.topmost} ${lumOK ? 'PASS' : 'FAIL'}`);
  lumOK ? pass++ : fail++;
  await pd.screenshot({ path: S(TAG==='live' ? 'v0.4-live-search-dark.png' : 'v0.4-search-dark.png') });
  await pd.keyboard.press('Escape'); await pd.waitForTimeout(300);
  // browse sheet + segmented control, dark
  await pd.locator('#browse-trigger').tap(); await pd.waitForTimeout(350);
  const segVis = await pd.evaluate(() => {
    const el = document.querySelector('.theme-seg');
    const r = el.getBoundingClientRect();
    const act = document.querySelector('.theme-seg button.is-active');
    return { top: Math.round(r.top), h: Math.round(r.height), visible: r.height > 0,
      activeBg: act ? getComputedStyle(act).backgroundColor : null };
  });
  const segOK = segVis.visible && segVis.top >= 0 && segVis.top < 200;
  rows.push(`sheet-dark segmented: top=${segVis.top}px h=${segVis.h} activeBg=${segVis.activeBg} ${segOK ? 'PASS' : 'FAIL'}`);
  segOK ? pass++ : fail++;
  await pd.screenshot({ path: S(TAG==='live' ? 'v0.4-live-sheet-dark.png' : 'v0.4-sheet-dark.png') });
  await ctxD.close();

  // light-mode search shot
  const ctxL = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'light', hasTouch:true, isMobile:true });
  const pl = await ctxL.newPage();
  await pl.goto(URL, { waitUntil:'load' }); await pl.waitForTimeout(300);
  await pl.locator('#search-trigger').tap(); await pl.waitForTimeout(400);
  const Lbg = lum(await pl.evaluate(() => getComputedStyle(document.querySelector('.search-box')).backgroundColor));
  rows.push(`search-light panel bg=rgb(${Lbg.r},${Lbg.g},${Lbg.b})`);
  await pl.screenshot({ path: S(TAG==='live' ? 'v0.4-live-search-light.png' : 'v0.4-search-light.png') });
  await ctxL.close();

  // ---- cycle-button sanity (phone dark): every tap changes pref; effect changes or legitimately-same ----
  const ctxC = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', hasTouch:true, isMobile:true });
  const pc = await ctxC.newPage();
  pc.on('pageerror', e => errs.push('cycle:' + String(e).slice(0,140)));
  let cycOK = true; const seq = [];
  for (const start of ['system','light','dark']) {
    await pc.goto(URL, { waitUntil:'load' }); await pc.evaluate(s => localStorage.setItem('as-theme', s), start);
    await pc.reload({ waitUntil:'load' }); await pc.waitForTimeout(300);
    const a = await state(pc); await pc.locator('#theme-toggle').tap(); await pc.waitForTimeout(300);
    const c = await state(pc);
    const prefChanged = c.pref !== a.pref, vis = c.theme !== a.theme;
    const legit = !vis && effectOf(c.pref, true) === a.theme;
    seq.push(`${start}: ${a.pref}/${a.theme} -> ${c.pref}/${c.theme} ${prefChanged && (vis||legit) ? 'OK' : 'BAD'}`);
    if (!(prefChanged && (vis || legit))) cycOK = false;
  }
  rows.push(`cycle-button 3-starts: ${seq.join(' | ')} ${cycOK ? 'PASS' : 'FAIL'}`);
  cycOK ? pass++ : fail++;
  await ctxC.close();

  console.log('=== v0.4 PHASE B (' + TAG + ') ' + URL + ' ===');
  rows.forEach(r => console.log(r));
  console.log(`TRANSITIONS(12): ${rows.filter(r=>/->/.test(r)&&/theme /.test(r)).filter(r=>r.endsWith('PASS')).length}/12`);
  console.log(`TOTAL pass=${pass} fail=${fail} pageerrors=${JSON.stringify(errs)}`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
