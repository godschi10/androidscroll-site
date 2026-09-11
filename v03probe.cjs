const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const h = document.querySelector('.site-header');
    const hr = h.getBoundingClientRect();
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') return;
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 && r.width > 0) bad.push(el.tagName + '.' + (el.className||'').toString().slice(0,20));
    });
    const btns = h ? h.querySelectorAll('button').length : 0;
    const svgs = h ? h.querySelectorAll('svg').length : 0;
    const glyphs = h ? (h.textContent.match(/[☾☀✕☰]/g) || []).length : 0;
    return { scrollW: document.documentElement.scrollWidth, docW, headerH: Math.round(hr.height), btns, svgs, textGlyphs: glyphs, bad: bad.slice(0,5) };
  });
  console.log(JSON.stringify(res));
  await b.close();
})();
