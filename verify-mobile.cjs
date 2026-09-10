const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('file:///home/ubuntu/androidscroll/build/dist/index.html', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') return;
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 && r.width > 0) bad.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,30), right: Math.round(r.right) });
    });
    return { scrollW: document.documentElement.scrollWidth, docW, bad: bad.slice(0,8) };
  });
  console.log(JSON.stringify(res));
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/v0.2.2-home-390.png', fullPage: true });
  await b.close();
})();
