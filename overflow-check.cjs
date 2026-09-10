const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 || r.left < -1) {
        bad.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,60), right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width), text: (el.textContent||'').trim().slice(0,40) });
      }
    });
    return { docW, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 12) };
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
