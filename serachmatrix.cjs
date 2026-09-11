// v0.6 verification — resilient: fresh context per step, crash-screenshot on any failure.
const { chromium } = require('playwright');
const fs = require('fs');
const shots = '/home/ubuntu/androidscroll/shots';

(async () => {
  const b = await chromium.launch();
  const base = 'file:///home/ubuntu/androidscroll/build/dist/index.html';
  const report = [];
  const S = (name) => shots + '/' + name + '.png';
  const take = async (page, name) => {
    const p = S(name);
    await page.screenshot({ path: p, fullPage: false });
    report.push('SHOT:' + name + '=' + p);
  };

  // Step 1: open overlay + verify basic DOM + count + scrollWidth, no keyboard
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForFunction(() => document.getElementById('search-index').textContent.length > 0, { timeout: 6000 });
      await page.click('#search-trigger');
      await page.waitForFunction(() => !document.getElementById('search-layer').hidden, { timeout: 4000 });
      await page.waitForTimeout(80);
      const ca = await page.evaluate(() => document.activeElement && document.activeElement.id);
      report.push('STEP:open-active=' + ca);
      const n = await page.locator('#search-results li').count();
      report.push('STEP:open-result-count=' + n);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      report.push('STEP:open-scrollWidth=' + sw);
      const status = await page.locator('#search-status').innerText().catch(() => 'ERR-status');
      report.push('STEP:open-status=' + status);
      await take(page, 'v0.6-open');
    } catch (e) {
      await page.screenshot({ path: S('crash-open'), fullPage: false }).catch(()=>{});
      report.push('STEP:open-CRASH:' + e.message.slice(0, 160));
    } finally { await ctx.close(); }
  }

  // Step 2: keyboard navigation on fresh context
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForFunction(() => document.getElementById('search-index').textContent.length > 0, { timeout: 6000 });
      await page.click('#search-trigger');
      await page.waitForFunction(() => !document.getElementById('search-layer').hidden, { timeout: 4000 });
      await page.waitForTimeout(80);
      await page.locator('#search-input').fill('battery');
      await page.waitForTimeout(350);
      const n = await page.locator('#search-results li').count();
      report.push('KEY:n-after-battery=' + n);
      const sr = await page.locator('#search-status').innerText().catch(() => 'ERR');
      report.push('KEY:status-after-battery=' + sr);
      if (n >= 2) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(80);
        const i = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('#search-results li'));
          return items.findIndex(li => li.classList.contains('is-active'));
        });
        report.push('KEY:after-down-active-index=' + i);
        await take(page, 'v0.6-keyboard-highlight');
      }
    } catch (e) {
      await page.screenshot({ path: S('crash-keyboard'), fullPage: false }).catch(()=>{});
      report.push('STEP:keyboard-CRASH:' + e.message.slice(0, 160));
    } finally { await ctx.close(); }
  }

  // Step 3: clear button
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForFunction(() => document.getElementById('search-index').textContent.length > 0, { timeout: 6000 });
      await page.click('#search-trigger');
      await page.waitForFunction(() => !document.getElementById('search-layer').hidden, { timeout: 4000 });
      await page.waitForTimeout(80);
      await page.locator('#search-input').fill('android');
      await page.waitForTimeout(350);
      const clearShown = await page.locator('#search-clear').isVisible();
      report.push('CLEAR:shown-with-text=' + clearShown);
      if (clearShown) {
        await page.locator('#search-clear').click();
        await page.waitForTimeout(80);
        const val = await page.locator('#search-input').inputValue();
        report.push('CLEAR:after-clear-value=' + JSON.stringify(val));
        const status = await page.locator('#search-status').innerText().catch(() => 'ERR');
        report.push('CLEAR:status-after-clear=' + status);
      }
    } catch (e) {
      await page.screenshot({ path: S('crash-clear'), fullPage: false }).catch(()=>{});
      report.push('STEP:clear-CRASH:' + e.message.slice(0, 160));
    } finally { await ctx.close(); }
  }

  // Step 4: Esc closes + focus returns to trigger, on fresh context
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForFunction(() => document.getElementById('search-index').textContent.length > 0, { timeout: 6000 });
      await page.click('#search-trigger');
      await page.waitForFunction(() => !document.getElementById('search-layer').hidden, { timeout: 4000 });
      await page.waitForTimeout(80);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(80);
      const hidden = await page.locator('#search-layer').evaluate(o => o.hidden);
      report.push('ESC:layer-hidden=' + hidden);
      const fid = await page.evaluate(() => { const ae = document.activeElement; return ae ? ae.id : 'null'; });
      report.push('ESC:focus-back=' + fid);
    } catch (e) {
      await page.screenshot({ path: S('crash-esc'), fullPage: false }).catch(()=>{});
      report.push('STEP:esc-CRASH:' + e.message.slice(0, 160));
    } finally { await ctx.close(); }
  }

  // Step 5: no-results block shows contact link
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForFunction(() => document.getElementById('search-index').textContent.length > 0, { timeout: 6000 });
      await page.click('#search-trigger');
      await page.waitForFunction(() => !document.getElementById('search-layer').hidden, { timeout: 4000 });
      await page.waitForTimeout(80);
      await page.locator('#search-input').fill('zzznomatchx');
      await page.waitForTimeout(350);
      const emptyShown = await page.locator('#search-empty').evaluate(e => !e.hidden);
      report.push('NOMATCH:empty-shown=' + emptyShown);
      const linkHref = await page.locator('#search-empty a').getAttribute('href').catch(() => 'ERR');
      report.push('NOMATCH:contact-link-href=' + linkHref);
    } catch (e) {
      await page.screenshot({ path: S('crash-nomatch'), fullPage: false }).catch(()=>{});
      report.push('STEP:nomatch-CRASH:' + e.message.slice(0, 160));
    } finally { await ctx.close(); }
  }

  await b.close();
  console.log(report.join('\n'));
})();
