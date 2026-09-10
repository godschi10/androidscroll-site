const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    // find EVERY element wider than viewport or extending right beyond 390, excluding skip-link
    const docW = 390;
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') return;
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 && r.width > 0) {
        bad.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,40), right: Math.round(r.right), w: Math.round(r.width), ws: cs.whiteSpace, text: (el.textContent||'').trim().slice(0,30) });
      }
    });
    return bad.slice(0, 15);
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
