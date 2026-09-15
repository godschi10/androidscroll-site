// gen-content.mjs — P8 AUTO-COUNTS prebuild step (npm `prebuild` hook).
// Regenerates src/data/content.json counts at build time so no number is
// hard-coded: per-post + total comments come from the Worker PUBLIC API,
// post/category/empty-category math is derived from the posts array.
// Node 18+, zero dependencies.
//
// Behavior:
// - Loads src/data/content.json as the base snapshot (words/read_min and all
//   editorial fields are carried over — there is no src/content/ body source
//   to recompute them from).
// - Per post (sequential, cheap for ~13 posts):
//     GET {API}/api/comments/count?post={wpId}  (5s timeout x 3 tries)
// - Sets posts[].comments, totals.comments = sum(per-post).
// - Derives totals.posts / totals.categories / totals.empty_categories
//   (direct-post semantics, matching WP count) and refreshes every
//   category.count + embedded children[].count the same way.
// - Stamps generated (build ISO date) + honest source line.
// - NEVER breaks the build: any fetch failure keeps the previous value and
//   stamps stale:true; exits 0 always (a non-zero exit would block deploy).
//
// Env override: COMMENTS_API_BASE (default = Worker URL in Comments.astro).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'data', 'content.json');
const API = process.env.COMMENTS_API_BASE || 'https://androidscroll-comments.gwill.workers.dev';
const TIMEOUT_MS = 5000;
const TRIES = 3;

function fetchCount(postId) {
  const url = `${API}/api/comments/count?post=${postId}`;
  return new Promise((resolve) => {
    let attempt = 0;
    const tryOnce = () => {
      attempt += 1;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      fetch(url, { signal: ctrl.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`http ${r.status}`);
          return r.json();
        })
        .then((j) => {
          clearTimeout(timer);
          const n = Number(j && j.count);
          if (!Number.isInteger(n) || n < 0) throw new Error('bad shape');
          resolve({ ok: true, count: n });
        })
        .catch((err) => {
          clearTimeout(timer);
          if (attempt < TRIES) tryOnce();
          else resolve({ ok: false, error: String(err && err.message || err) });
        });
    };
    tryOnce();
  });
}

const data = JSON.parse(readFileSync(CONTENT, 'utf8'));

// AUDIT-01 L4a: pipeline compromise must break the build, not ship.
// Every post url stays site-relative; a javascript: (or absolute) url aborts.
const badUrls = data.posts.filter((pl) => typeof pl.url !== "string" || pl.url.indexOf("/") !== 0 || pl.url.indexOf("javascript:") !== -1).map((pl) => String(pl.id) + ":" + String(pl.url));
if (badUrls.length) {
  console.error('[gen-content] FATAL post urls must be site-relative (L4a): ' + badUrls.join(', '));
  process.exit(1);
}
let stale = false;
const failures = [];

// Sequential: kind to the Worker, trivial cost at 13 posts.
for (const p of data.posts) {
  const res = await fetchCount(p.id);
  if (res.ok) {
    p.comments = res.count;
  } else {
    stale = true;
    failures.push(p.id);
    // keep previous p.comments value (stale fallback)
  }
}

const directCount = (slug) => data.posts.filter((p) => (p.cats || []).includes(slug)).length;

for (const c of data.categories) {
  c.count = directCount(c.slug);
  if (Array.isArray(c.children)) {
    for (const k of c.children) k.count = directCount(k.slug);
  }
}

data.totals = {
  posts: data.posts.length,
  categories: data.categories.length,
  comments: data.posts.reduce((s, p) => s + (Number(p.comments) || 0), 0),
  empty_categories: data.categories.filter((c) => directCount(c.slug) === 0).length,
};
data.generated = new Date().toISOString().slice(0, 10);
data.source = `computed at build from snapshot + comments API (${API}, public per-post counts)`;
data.stale = stale;

writeFileSync(CONTENT, JSON.stringify(data, null, 2) + '\n');
console.log(
  `[gen-content] posts=${data.totals.posts} cats=${data.totals.categories} ` +
  `comments=${data.totals.comments} empty_cats=${data.totals.empty_categories} ` +
  `stale=${stale}${failures.length ? ` failed=[${failures.join(',')}]` : ''}`,
);
process.exit(0);
