const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    const q = s => document.querySelector(s);
    const r = el => { if(!el) return null; const b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width) }; };
    const mast = q('.masthead');
    return {
      scrollW: document.documentElement.scrollWidth,
      mastChildren: mast ? [...mast.children].map(c => ({ cls: c.className.toString().slice(0,30), ...({ ...(() => { const b = c.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right) }; })() }) })) : null,
      browseBtn: r(q('#browse-trigger')),
      searchBtn: r(q('#search-trigger')),
      themeBtn: r(q('#theme-toggle')),
      nameplate: r(q('.nameplate'))
    };
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
