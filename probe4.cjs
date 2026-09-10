const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('https://godschi10.github.io/androidscroll-site/', { waitUntil: 'networkidle' });
  const res = await p.evaluate(() => {
    // simulate what happens with NO wrapping allowed on header-row children
    const row = document.querySelector('.header-row');
    const out = { row: null, kids: [] };
    if (row) {
      const cs = getComputedStyle(row);
      out.row = { display: cs.display, flexWrap: cs.flexWrap, w: Math.round(row.getBoundingClientRect().width) };
      out.kids = [...row.children].map(c => { const b = c.getBoundingClientRect(); return { cls: (c.className||'').toString().slice(0,16), w: Math.round(b.width), left: Math.round(b.left), right: Math.round(b.right) }; });
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
