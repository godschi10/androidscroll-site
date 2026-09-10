const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    const out = {};
    const mh = document.querySelector('.masthead');
    const hi = document.querySelector('.header-in');
    const btns = document.querySelectorAll('.masthead .h-btn');
    out.masthead = mh ? { w: Math.round(mh.getBoundingClientRect().width), gap: getComputedStyle(mh).gap, justify: getComputedStyle(mh).justifyContent } : null;
    out.headerIn = hi ? { pad: getComputedStyle(hi).padding, w: Math.round(hi.getBoundingClientRect().width) } : null;
    out.buttons = [...btns].map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent||'').trim().slice(0,14), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }; });
    out.scrollW = document.documentElement.scrollWidth;
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
