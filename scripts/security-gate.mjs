#!/usr/bin/env node
// AUDIT-01 permanent build gate (M2 ride-along + L2/M5/L4/L6/M3 assertions).
// Fails loudly: pipeline compromise must break the build, not ship.
// Backslash-free by design: string ops only, no regex literals.
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const bad = [];
const note = (m) => bad.push(m);

const htmlFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.slice(-5) === '.html') htmlFiles.push(p);
  }
})(DIST);

// Facade embed host allowlist (AUDIT-01 L2). Bare bases; any subdomain ok.
const HOSTS = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'vimeo.com',
  'tiktok.com', 'spotify.com', 'apple.com', 'audiomack.com', 'twitter.com'];
function hostOk(h) {
  h = h.toLowerCase();
  if (h.slice(0, 4) === 'www.') h = h.slice(4);
  for (const b of HOSTS) if (h === b || h.slice(-b.length - 1) === '.' + b) return true;
  return false;
}

const CLOSE = '<' + '/script';
for (const f of htmlFiles) {
  const s = readFileSync(f, 'utf8');
  const low = s.toLowerCase();
  // M5: zero gravatar requests served
  if (low.includes('gravatar.com')) note('M5 gravatar ref in ' + f);
  // L4: no javascript: sink survives into served html
  if (low.includes('href="javascript:') || low.includes('"url":"javascript:')) note('L4 javascript: url in ' + f);
  // M3: CSP meta baseline on every page
  if (!s.includes('http-equiv="Content-Security-Policy"')) note('M3 CSP meta missing in ' + f);
  // M2: every inlined-JSON script block must JSON.parse cleanly (a literal
  // breakout would truncate the block at the hostile close tag and fail here)
  // and must carry no literal close tag and no javascript: payload.
  let rest = s, idx = 0;
  while (true) {
    const open = rest.indexOf('<script', idx);
    if (open === -1) break;
    const tagEnd = rest.indexOf('>', open);
    if (tagEnd === -1) { note('M2 unclosed script tag in ' + f); break; }
    const tag = rest.slice(open, tagEnd + 1);
    const isJson = tag.includes('type="application/json"') || tag.includes('type="application/ld+json"');
    const close = rest.indexOf(CLOSE, tagEnd + 1);
    if (close === -1) { note('M2 unclosed script block in ' + f); break; }
    if (isJson) {
      const inner = rest.slice(tagEnd + 1, close);
      const innerLow = inner.toLowerCase();
      if (innerLow.includes(CLOSE.toLowerCase())) note('M2 literal close tag inside JSON in ' + f);
      if (innerLow.includes('javascript:')) note('M2 javascript: inside JSON in ' + f);
      try { JSON.parse(inner); }
      catch (e) { note('M2 JSON block does not parse in ' + f + ' (' + String(e.message || e).slice(0, 80) + ')'); }
    }
    idx = close + CLOSE.length;
  }
  // L2: every facade data-src matches a known provider host
  const parts = s.split('data-src="');
  for (let k = 1; k < parts.length; k++) {
    const v = parts[k].slice(0, parts[k].indexOf('"'));
    let host = '';
    try { host = new URL(v).hostname; }
    catch (e) { note('L2 malformed data-src ' + v + ' in ' + f); continue; }
    if (!hostOk(host)) note('L2 unknown embed host ' + host + ' in ' + f);
  }
}

// L6: manifest stays target-relative (no per-target generation, zero drift)
const mfPath = join(DIST, 'manifest.webmanifest');
if (!existsSync(mfPath)) note('L6 dist manifest missing');
else {
  const mf = JSON.parse(readFileSync(mfPath, 'utf8'));
  for (const k of ['start_url', 'scope']) {
    if (typeof mf[k] !== 'string' || mf[k].slice(0, 1) === '/') note('L6 manifest ' + k + ' not relative: ' + mf[k]);
  }
  for (const ic of mf.icons || []) {
    if (typeof ic.src !== 'string' || ic.src.slice(0, 1) === '/') note('L6 manifest icon not relative: ' + ic.src);
    if (!existsSync(join(DIST, ic.src))) note('L6 manifest icon missing from dist: ' + ic.src);
  }
}

// M5: self-hosted author photo ships with the build
if (!existsSync(join(DIST, 'img', 'author.png'))) note('M5 dist img/author.png missing');

if (bad.length) {
  console.error('security-gate: FAIL ' + bad.length);
  for (const b of bad) console.error(' - ' + b);
  process.exit(1);
}
console.log('security-gate: OK (' + htmlFiles.length + ' html, manifest, embeds, csp)');
