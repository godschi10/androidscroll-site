import { chromium } from 'playwright';

const SITES = [
  ['supaste', 'https://www.supaste.com/'],
  ['chesapeake', 'https://chesapeakeplywood.com/'],
  ['cloudflare', 'https://www.cloudflare.com/'],
  ['velt', 'https://velt.dev/'],
  ['consensys', 'https://consensys.io/'],
];

const once = (sel) => `(function(){
  const el = document.querySelector(${JSON.stringify('HEADER_CALC_SELECTOR')});
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { h: Math.round(r.height), pos: cs.position, bg: cs.backgroundColor,
    border: cs.borderBottomWidth + ' ' + cs.borderBottomColor,
    py: cs.paddingTop + '/' + cs.paddingBottom, kids: el.children.length,
    html: el.innerHTML.slice(0, 120) };
})()`;

const browser = await chromium.launch();
for (const [name, url] of SITES) {
  for (const [w, h, label] of [[390, 844, 'mobile390'], [1280, 800, 'desktop1280']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1200);
      const info = await page.evaluate(() => {
        const cands = [
          document.querySelector('header'),
          document.querySelector('[class*="navbar" i]'),
          document.querySelector('nav'),
        ].filter(Boolean);
        const pick = (el) => {
          if (!el) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          // find first big logo/wordmark link + buttons
          const a = [...el.querySelectorAll('a')].find(x => x.querySelector('img,svg') || x.textContent.trim());
          const btns = [...el.querySelectorAll('button,a[role=button],a')];
          const svgs = [...el.querySelectorAll('svg')];
          return {
            sel: el.tagName + '.' + (el.className && typeof el.className === 'string' ? el.className.split(' ').slice(0,3).join('.') : ''),
            h: Math.round(r.height), top: Math.round(r.top), pos: cs.position,
            bg: cs.backgroundColor, bb: cs.borderBottomWidth, shadow: cs.boxShadow !== 'none',
            links: btns.length, svgCount: svgs.length,
            firstSvg: svgs[0] ? Math.round(svgs[0].getBoundingClientRect().width) : null,
            svgStroke: svgs[0] ? getComputedStyle(svgs[0]).stroke : null,
            logoText: a ? a.textContent.trim().slice(0, 40) : null,
            burgerVisible: !!([...el.querySelectorAll('button,[role=button]')].find(b => {
              const br = b.getBoundingClientRect();
              return br.width > 0 && /menu|toggle|open|burger|nav/i.test(b.getAttribute('aria-label') || b.className || '');
            })),
          };
        };
        // pick the topmost visible candidate
        const vis = cands.filter(c => { const r = c.getBoundingClientRect(); return r.height > 0 && r.height < 400 && r.top < 200; });
        vis.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        return pick(vis[0] || cands[0]);
      });
      console.log(name, label, JSON.stringify(info));
    } catch (e) {
      console.log(name, label, 'ERR', String(e).slice(0, 80));
    }
    await page.close();
  }
}
await browser.close();
