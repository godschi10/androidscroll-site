const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    const h = document.querySelector('.site-header');
    const hr = h.getBoundingClientRect();
    const docW = document.documentElement.clientWidth;
    let bad = 0;
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') return;
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 && r.width > 0) bad++;
    });
    return { scrollW: document.documentElement.scrollWidth, headerH: Math.round(hr.height), btns: h.querySelectorAll('button').length, glyphs: (h.textContent.match(/[☾☀✕☰]/g)||[]).length, statusLine: !!h.querySelector('.status-line'), bad };
  });
  console.log('LIVE v0.3:', JSON.stringify(res));
  await b.close();
})();
