const { chromium } = require('playwright');
const SITES = [
  ['supaste', 'https://www.supaste.com/'],
  ['chesapeake', 'https://chesapeakeplywood.com/'],
  ['cloudflare', 'https://www.cloudflare.com/'],
  ['velt', 'https://velt.dev/'],
];
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [name, url] of SITES) {
    out[name] = {};
    for (const [w, h, label] of [[390, 844, 'm'], [1280, 800, 'd']]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(2000);
        out[name][label] = await page.evaluate(() => {
          const cands = [document.querySelector('header'), document.querySelector('[class*="navbar" i]'), document.querySelector('nav')].filter(Boolean);
          const vis = cands.filter(c => { const r = c.getBoundingClientRect(); return r.height > 20 && r.height < 300 && r.top < 150; });
          vis.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
          const el = vis[0];
          if (!el) return null;
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
          const btns = [...el.querySelectorAll('button, a')].filter(b => b.getBoundingClientRect().width > 0);
          const heights = btns.map(b => Math.round(b.getBoundingClientRect().height)).filter(h => h > 10);
          const svgs = [...el.querySelectorAll('svg')].filter(s => s.getBoundingClientRect().width > 0);
          return { h: Math.round(r.height), pos: cs.position, bg: cs.backgroundColor, borderBottom: cs.borderBottomWidth,
                   btnCount: btns.length, btnMinH: heights.length ? Math.min(...heights) : null, btnMaxH: heights.length ? Math.max(...heights) : null,
                   svgCount: svgs.length, svgH: svgs.length ? Math.round(svgs[0].getBoundingClientRect().height) : null };
        });
      } catch (e) { out[name][label] = 'ERR ' + e.message.slice(0, 60); }
      await page.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})();
