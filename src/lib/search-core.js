/* AndroidScroll search-core.js — v0.6.18 Direction A "The Desk" scorer (P7 SEARCH26).
 * SINGLE SOURCE: frontmatter `import { buildSynonyms }` (build-time map),
 * browser via `?raw` inlined into <script type="module"> (self-registers on
 * globalThis for Header/search-page scripts), Node query-suite (scorer-test.mjs)
 * imports THIS SAME FILE = zero drift proof. Pure ESM, no deps.
 * Rank contract (v0.6.5 ladder preserved, then Google-level additions):
 *   base: title exact 150 / prefix 110 / substring 70 (whole query)
 *   per-token: inTitle +20, inUrl +12, inExcerpt +8, inCat +6
 *   title-word: exact +34 / prefix +28 / fuzzy(anchored) +15 ; fuzzy-only doc +15
 *   ALL-in-title +40, ALL-anywhere +25
 *   NEW: lede boost (token in first 120 chars of excerpt +4)
 *   NEW: phrase proximity replaces flat +4 (adjacent +18, gap<=2 +8, title or excerpt)
 *   NEW: position-in-title curve (title-word hit at index 0-2 gets +15% min +1)
 *   NEW: data-driven synonym map (buildSynonyms, from the real index) +5 per hit
 *   NEW: IDF cap (term in >half the corpus: token subtotal capped at +8)
 *   rank() = AND (every term must hit somewhere incl. fuzzy/synonym); rankOR() = relaxed.
 *   Stable sort over date-desc INDEX => ties = newer post first (kept).
 */
export function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export function levLE(a, b, max) { /* bounded Levenshtein, returns dist if <=max else max+1 */
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = [];
  for (let j = 0; j <= b.length; j++) prev.push(j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let rowMin = i, d;
    for (let j = 1; j <= b.length; j++) {
      d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(d); if (d < rowMin) rowMin = d;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
/* fuzzy MUST stay first-letter-anchored: 'battery' vs 'matter' (dist 2) leaks otherwise */
function fuzzyHit(tok, word) {
  if (!tok || !word || tok[0] !== word[0]) return false;
  const m = tok.length >= 6 ? 2 : (tok.length >= 4 ? 1 : 0);
  return m > 0 && levLE(tok, word, m) <= m;
}

/* Data-driven synonym/category boost map — generated AT BUILD from the real
 * index (buildSynonyms(POSTS)). No invented taxonomy:
 *  (1) stem families: title/excerpt/cat words (len>=5) sharing a 4-char stem map
 *      to each other (drain<->draining, overheat<->overheating, charge<->charging…);
 *  (2) category-word -> frequent co-occurring title words (freq>=2 in that
 *      category), so category queries boost member vocabulary honestly. */
export function buildSynonyms(posts) {
  const map = {};
  const add = (k, v) => {
    if (!k || !v || k === v) return;
    if (!map[k]) map[k] = [];
    if (map[k].indexOf(v) < 0) map[k].push(v);
  };
  const byStem = {};
  for (const post of posts) {
    const seen = {};
    const words = norm(post.title + ' ' + (post.excerpt || '') + ' ' + (post.cat || post.cat_name || '')).split(' ');
    for (const w of words) {
      if (w.length >= 5 && !seen[w]) {
        seen[w] = 1;
        const st = w.slice(0, 4);
        if (!byStem[st]) byStem[st] = [];
        if (byStem[st].indexOf(w) < 0) byStem[st].push(w);
      }
    }
  }
  for (const st of Object.keys(byStem)) {
    const vs = byStem[st];
    if (vs.length > 1) for (const a of vs) for (const b of vs) add(a, b);
  }
  const groups = {};
  for (const post of posts) {
    const c = norm(post.cat || post.cat_name || '');
    if (!c) continue;
    if (!groups[c]) groups[c] = [];
    groups[c].push(post);
  }
  for (const c of Object.keys(groups)) {
    const freq = {};
    for (const post of groups[c]) {
      const tseen = {};
      for (const w of norm(post.title).split(' ')) {
        if (w.length >= 4 && !tseen[w]) { tseen[w] = 1; freq[w] = (freq[w] || 0) + 1; }
      }
    }
    const top = Object.keys(freq).filter(x => freq[x] >= 2 && c.indexOf(x) < 0);
    for (const cw of c.split(' ').filter(x => x.length >= 4))
      for (const t of top.slice(0, 6)) add(cw, t);
  }
  return map;
}

export function makeSearch(INDEX, SYN) {
  SYN = SYN || {};
  const N = INDEX.length;
  const docs = INDEX.map(p => {
    const nt = norm(p.title), ns = norm(p.url || ''), nx = norm(p.excerpt || ''), nc = norm(p.cat || '');
    return { p, nt, ns, nx, nc, lede: nx.slice(0, 120), tw: nt.split(' '), xw: nx.split(' ') };
  });
  const HALF = N / 2;
  /* token set for live prefix completions: titles + cat names, built once */
  const tokFreq = {};
  for (const d of docs) {
    const seen = {};
    for (const w of (d.nt + ' ' + d.nc).split(' ')) {
      if (w.length >= 3 && !seen[w]) { seen[w] = 1; tokFreq[w] = (tokFreq[w] || 0) + 1; }
    }
  }
  const tokList = Object.keys(tokFreq);

  function wordPos(words, tok) { /* first index where word matches tok (exact/prefix/substr/fuzzy) or -1 */
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w === tok || w.indexOf(tok) === 0 || w.indexOf(tok) >= 0 || fuzzyHit(tok, w)) return i;
    }
    return -1;
  }
  function scoreDoc(d, terms, df) {
    const q = terms.join(' ');
    let s = 0, allTitle = true, allAnywhere = true, allPos = true;
    if (q) {
      if (d.nt === q) s += 150; else if (d.nt.indexOf(q) === 0) s += 110; else if (d.nt.indexOf(q) >= 0) s += 70;
    }
    for (const tok of terms) {
      let ts = 0;
      const inT = d.nt.indexOf(tok) >= 0, inS = d.ns.indexOf(tok) >= 0,
        inX = d.nx.indexOf(tok) >= 0, inC = d.nc.indexOf(tok) >= 0;
      if (inT) ts += 20; else allTitle = false;
      if (inS) ts += 12;
      if (inX) ts += 8;
      if (inC) ts += 6;
      if (d.lede.indexOf(tok) >= 0) ts += 4; /* lede/first-sentence boost */
      let present = inT || inS || inX || inC, wi = -1;
      if (inT) {
        for (let i = 0; i < d.tw.length; i++) {
          const w = d.tw[i];
          if (w === tok) { ts += 34; wi = i; break; }
          if (w.indexOf(tok) === 0) { ts += 28; wi = i; break; }
          if (fuzzyHit(tok, w)) { ts += 15; wi = i; break; }
        }
      }
      if (!present) {
        let fz = false;
        for (const w of d.tw) { if (fuzzyHit(tok, w)) { fz = true; break; } }
        if (fz) { ts += 15; present = true; }
      }
      /* synonym boost: expansion hits count as presence */
      for (const syn of (SYN[tok] || [])) {
        if (d.nt.indexOf(syn) >= 0 || d.nx.indexOf(syn) >= 0 || d.nc.indexOf(syn) >= 0) { ts += 5; present = true; break; }
      }
      if (!present) { allAnywhere = false; allPos = false; }
      /* position-in-title curve: front-loaded title words rank like intitle emphasis */
      if (wi >= 0 && wi <= 2) ts += Math.max(1, Math.ceil(ts * 0.15));
      if (df[tok] > HALF) ts = Math.min(ts, 8); /* IDF cap kills android-query inflation */
      s += ts;
    }
    if (terms.length && allTitle) s += 40;
    if (terms.length && allAnywhere) s += 25;
    /* phrase proximity bonus (replaces flat +4): adjacent +18, gap<=2 +8 */
    if (terms.length > 1 && allPos) {
      let best = Infinity;
      for (let t = 0; t < terms.length - 1; t++) {
        const a1 = wordPos(d.tw, terms[t]), b1 = wordPos(d.tw, terms[t + 1]);
        if (a1 >= 0 && b1 >= 0) best = Math.min(best, Math.abs(b1 - a1));
        const a2 = wordPos(d.xw, terms[t]), b2 = wordPos(d.xw, terms[t + 1]);
        if (a2 >= 0 && b2 >= 0) best = Math.min(best, Math.abs(b2 - a2));
      }
      if (best === 1) s += 18; else if (best === 2) s += 8;
    }
    return { s, and: allAnywhere };
  }
  function dfOf(terms) {
    const df = {};
    for (const tok of terms) {
      let c = 0;
      for (const d of docs) {
        if (d.nt.indexOf(tok) >= 0 || d.ns.indexOf(tok) >= 0 || d.nx.indexOf(tok) >= 0 || d.nc.indexOf(tok) >= 0) c++;
      }
      df[tok] = c;
    }
    return df;
  }
  const asTerms = q => Array.isArray(q) ? q : norm(q).split(' ').filter(Boolean);
  function rank(q, opts) {
    const terms = asTerms(q);
    if (!terms.length) return [];
    const df = dfOf(terms), out = [];
    for (const d of docs) {
      const r = scoreDoc(d, terms, df);
      if (r.and && r.s > 0) out.push([d.p, r.s]);
    }
    out.sort((a, b) => b[1] - a[1]);
    if (opts && opts.withScores) return out;
    return out.map(x => x[0]);
  }
  function rankOR(q, opts) { /* relaxed-OR retry: any term present */
    const terms = asTerms(q);
    if (!terms.length) return [];
    const df = dfOf(terms), out = [];
    for (const d of docs) {
      const r = scoreDoc(d, terms, df);
      if (r.s > 0) out.push([d.p, r.s]);
    }
    out.sort((a, b) => b[1] - a[1]);
    if (opts && opts.withScores) return out;
    return out.map(x => x[0]);
  }
  function complete(prefixRaw, cap) {
    cap = cap || 5;
    const bits = norm(prefixRaw).split(' ').filter(Boolean);
    const last = bits[bits.length - 1] || '';
    if (last.length < 2) return { suggestions: [], total: 0 };
    const hits = tokList.filter(t => t.indexOf(last) === 0 && t !== last);
    hits.sort((a, b) => (tokFreq[b] - tokFreq[a]) || (a < b ? -1 : 1));
    return { suggestions: hits.slice(0, cap), total: hits.length };
  }
  function didYouMean(q) {
    const terms = asTerms(q);
    const vocab = {};
    for (const d of docs) {
      for (const w of d.tw) if (w.length >= 4) vocab[w] = 1;
      for (const w of d.xw) if (w.length >= 5) vocab[w] = 1;
    }
    const words = Object.keys(vocab);
    const fixed = []; let changed = false;
    for (const tok of terms) {
      let known = tok.length < 4;
      if (!known) for (const d of docs) {
        if (d.nt.indexOf(tok) >= 0 || d.nx.indexOf(tok) >= 0 || d.nc.indexOf(tok) >= 0) { known = true; break; }
      }
      if (known) { fixed.push(tok); continue; }
      let best = null, bd = 3;
      for (const w of words) {
        const dd = levLE(tok, w, 2);
        if (dd < bd) { bd = dd; best = w; }
      }
      if (best) { fixed.push(best); changed = true; } else fixed.push(tok);
    }
    if (!changed) return null;
    return { suggestion: fixed.join(' '), count: rank(fixed).length };
  }
  return { rank, rankOR, complete, didYouMean, norm, newest: n => INDEX.slice(0, n || 3) };
}

/* Query-scoped filter counts (P13 Direction A): honest per-category counts over
 * an already-ranked list — every chip count is drawn from the live result set,
 * so the chips always sum to the list length. Key = p.cat || p.cat_name. */
export function countByCat(list) {
  const counts = {};
  for (const p of list || []) {
    const c = p.cat || p.cat_name || 'Unfiled';
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

/* browser self-registration: the ?raw-inlined <script type="module"> runs this,
 * exposing the same api to Header/search-page module scripts via globalThis. */
if (typeof globalThis !== 'undefined') {
  globalThis.makeSearch = makeSearch;
  globalThis.buildSynonyms = buildSynonyms;
  globalThis.SearchCore = { makeSearch, buildSynonyms, norm, levLE, countByCat };
}
