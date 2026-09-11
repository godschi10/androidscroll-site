const { chromium } = require('playwright');
const path = require('node:path');
const FILE = 'file://' + path.resolve(__dirname, 'dist/index.html');
const OUT = '/home/ubuntu/androidscroll/shots';

const core = () => ({
  scrollW: document.documentElement.scrollWidth,
  bodyScrollW: document.body.scrollWidth,
  overflowEls: [...document.querySelectorAll('*')].filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.right > 391;
  }).map(e => e.tagName + '.' + (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className)).slice(0, 8),
  headerH: Math.round(document.getElementById('site-header').getBoundingClientRect().height),
  headerPos: getComputedStyle(document.getElementById('site-header')).position,
  iconBtns: [...document.querySelectorAll('.site-header .icon-btn')].map(b => b.id),
  btnHotspots: [...document.querySelectorAll('.site-header .icon-btn')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }),
  svgSizes: [...document.querySelectorAll('.site-header .icon-btn svg')].map(s => { const r = s.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }),
  wordSize: getComputedStyle(document.querySelector('.wordmark .word-text')).fontSize,
  wordWeight: getComputedStyle(document.querySelector('.wordmark .word-text')).fontWeight,
  markSize: (() => { const r = document.querySelector('.wordmark .mark').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })(),
  scrollEmColor: getComputedStyle(document.querySelector('.wordmark .word-text em')).color,
  theme: document.documentElement.getAttribute('data-theme'),
  statusLine: !!document.querySelector('.status-line,.ad-flag'),
  compactNow: document.getElementById('site-header').classList.contains('is-compact'),
});

(async () => {
  const b = await chromium.launch();
  const out = {};

  // ---- mobile 390 light ----
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(FILE, { waitUntil: 'load' });
  await m.waitForTimeout(600);
  out.mobile_light = await m.evaluate(core);
  await m.screenshot({ path: OUT + '/v0.3-header-mobile-light.png', fullPage: false });

  // compact state after scroll >8px
  await m.evaluate(() => window.scrollTo(0, 120));
  await m.waitForTimeout(400);
  out.mobile_compact = await m.evaluate(() => ({
    cls: document.getElementById('site-header').classList.contains('is-compact'),
    headerH: Math.round(document.getElementById('site-header').getBoundingClientRect().height),
    shadow: getComputedStyle(document.getElementById('site-header')).boxShadow.slice(0, 60),
  }));
  await m.evaluate(() => window.scrollTo(0, 0));

  // browse sheet opens + ad toggles live in sheet footer
  await m.click('#browse-trigger');
  await m.waitForTimeout(400);
  out.mobile_sheet = await m.evaluate(() => ({
    open: document.getElementById('browse-sheet').classList.contains('is-open'),
    adToggles: [...document.querySelectorAll('#browse-sheet .ad-toggle')].map(x => x.dataset.role),
    footState: document.getElementById('foot-ad-state') ? document.getElementById('foot-ad-state').textContent : null,
  }));
  await m.screenshot({ path: OUT + '/v0.3-sheet-mobile-light.png', fullPage: false });
  await m.click('#browse-close');
  await m.waitForTimeout(300);

  // dark: emulate OS dark → inline script picks it up; then verify toggle swap
  await m.emulateMedia({ colorScheme: 'dark' });
  await m.reload({ waitUntil: 'load' });
  await m.waitForTimeout(600);
  out.mobile_dark = await m.evaluate(core);
  await m.screenshot({ path: OUT + '/v0.3-header-mobile-dark.png', fullPage: false });
  await m.click('#theme-toggle'); // dark → light via button
  await m.waitForTimeout(200);
  out.mobile_toggle_swap = await m.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await m.click('#theme-toggle'); // back to dark
  await m.waitForTimeout(200);
  await m.close();

  // ---- desktop 1280 light ----
  const d = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await d.goto(FILE, { waitUntil: 'load' });
  await d.waitForTimeout(600);
  out.desktop_light = await d.evaluate(() => ({
    ...(() => { const c = core(); return c; })(),
    catLinks: [...document.querySelectorAll('.head-cats a')].map(a => ({ t: a.textContent.trim(), fs: getComputedStyle(a).fontSize, ff: getComputedStyle(a).fontFamily.split(',')[0] })),
  }));
  await d.screenshot({ path: OUT + '/v0.3-header-desktop-light.png', fullPage: false });

  // desktop dark
  await d.emulateMedia({ colorScheme: 'dark' });
  await d.reload({ waitUntil: 'load' });
  await d.waitForTimeout(600);
  out.desktop_dark = await d.evaluate(core);
  await d.screenshot({ path: OUT + '/v0.3-header-desktop-dark.png', fullPage: false });

  // search overlay still works
  await d.click('#search-trigger');
  await d.waitForTimeout(300);
  out.desktop_search = await d.evaluate(() => ({
    open: document.getElementById('search-layer').classList.contains('is-open'),
    results: document.querySelectorAll('#search-results li').length,
  }));
  await d.close();
  await b.close();
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error('PROBE-FAIL', e.message); process.exit(1); });
