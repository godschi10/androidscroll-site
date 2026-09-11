import { chromium } from 'playwright';
const SITES = process.argv.slice(2);
const browser = await chromium.launch();
for (const url of SITES) {
  const name = new URL(url).host.split('.')[0];
  for (const [w, h, label] of [[390, 844, 'm'], [1280, 800, 'd']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 20000 });
      await page.waitForTimeout(2500);
      const info = await page.evaluate(() => {
        const cands = [document.querySelector('header'), document.querySelector('[class*="navbar" i]' ), document.querySelector('nav')].filter(Boolean);
        const vis = cands.filter(c => { const r = c.getBoundingClientRect(); return r.height > 0 && r.height < 400 && r.top < 200; });
        vis.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        const el = vis[0] || cands[0];
        if (!el) return null;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        const btns = [...el.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0);
        const svgs = [...el.querySelectorAll('svg')].filter(s => s.getBoundingClientRect().width > 0);
        return { h: Math.round(r.height), pos: cs.position, bg: cs.backgroundColor, bb: cs.borderBottomWidth,
          btnCount: btns.length,
          btnMin: btns.length ? Math.min(...btns.map(b => Math.max(b.getBoundingClientRect().width, b.getBoundingClientRect().height))) : null,
          btnMax: btns.length ? Math.max(...btns.map(b => b.getBoundingClientRect().height)) : null,
          svgCount: svgs.length, svgH: svgs.length ? Math.round(Math.max(...svgs.map(s => s.getBoundingClientRect().height))) : null,
          cta: btns.map(b => (b.textContent || '').trim().slice(0, 24)).filter(Boolean).slice(0, 3) };
      });
      console.log(name, label, JSON.stringify(info));
    } catch (e) { console.log(name, label, 'ERR', String(e).slice(0, 60)); }
    await page.close();
  }
}
await browser.close();
console.log('DONE');
