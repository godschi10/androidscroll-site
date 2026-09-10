#!/usr/bin/env node
/* Post-process dist so the unzipped folder is clickable from file:// on a phone:
   rewrite absolute "/..." hrefs/srcs (HTML + JSON index + CSS url()) to page-relative.
   Runs after astro build (trailing-slash directory format, build.format=directory). */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist';
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(DIST);

const depthOf = f => f.slice(DIST.length + 1).split('/').length - 1; // dirs below dist root
const prefix = d => (d === 0 ? './' : '../'.repeat(d));

let htmlCount = 0, cssCount = 0, hits = 0;

for (const f of files) {
  if (f.endsWith('.html')) {
    const d = depthOf(f);
    const pre = prefix(d);
    let s = readFileSync(f, 'utf8');
    const before = s;
    // href="/x/" and src="/x/" -> relative (skip absolute http(s) which are canonical/og)
    s = s.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_m, a, b) => `${a}="${pre}${b}"`);
    // search-index JSON urls
    s = s.replace(/"url":"\/(?!\/)/g, `"url":"${pre}`);
    // inlined CSS url(/fonts..)
    s = s.replace(/url\(\/(?!\/)/g, `url(${pre}`);
    if (s !== before) { hits += (before.match(/"(?:href|src)="\/(?!\/)/g) || []).length; writeFileSync(f, s); htmlCount++; }
  } else if (f.endsWith('.css')) {
    const d = depthOf(f);
    // css lives in dist/_astro/ (depth >= 1)
    const pre = prefix(d);
    let s = readFileSync(f, 'utf8');
    const before = s;
    s = s.replace(/url\((['"]?)\/(?!\/)/g, (_m, q) => `url(${q}${pre}`);
    if (s !== before) { writeFileSync(f, s); cssCount++; }
  }
}
console.log(`relativize: ${htmlCount} html files rewritten, ${cssCount} css files rewritten, ~${hits} attrs`);
// sanity: no absolute in-file href/src="/ or url(/fonts left (external canonical/og/JSON-LD allowed)
let leaks = 0;
for (const f of files) {
  if (!/\.(html|css)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8');
  const m = s.match(/(?:href|src)="\/(?!\/)[^"]*"/g);
  if (m) { leaks += m.length; console.log('LEAK', f, m.slice(0, 2)); }
  if (f.endsWith('.css') || /url\(/.test(s)) {
    const u = s.match(/url\((['"]?)\/(?!\/)/g);
    if (u) { leaks += u.length; console.log('CSS-LEAK', f, u.slice(0, 2)); }
  }
}
console.log(leaks === 0 ? 'relativize: no local absolute refs remain' : `relativize: ${leaks} LEAKS`);
process.exit(leaks === 0 ? 0 : 1);
