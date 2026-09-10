const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  // full-page screenshot at true mobile width to SEE the blowout
  await p.screenshot({ path: '/home/ubuntu/androidscroll/shots/probe-390-viewport.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
  // measure every section's content width
  const res = await p.evaluate(() => {
    const sections = [...document.querySelectorAll('main section, main > *, .site-footer')];
    return sections.slice(0, 12).map(s => ({
      cls: (s.className||'').toString().slice(0,34) || s.tagName,
      w: Math.round(s.getBoundingClientRect().width),
      right: Math.round(s.getBoundingClientRect().right),
      sw: s.scrollWidth
    }));
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
