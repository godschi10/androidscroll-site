import data from './content.json';

export const SITE = {
  name: 'AndroidScroll',
  url: 'https://androidscroll.com',
  tagline: 'Practical Android guides — written for the phone in your hand.',
  dateline: 'Wednesday, 10 September 2026',
  benchline: 'Android 16 on the bench',
  email: 'desk@androidscroll.com',
};

export const POSTS = data.posts;
export const CATS = data.categories;
export const TOTALS = data.totals;

export const bySlug = Object.fromEntries(CATS.map(c => [c.slug, c]));
export const byId = Object.fromEntries(CATS.map(c => [c.id, c]));
export const byPath = Object.fromEntries(CATS.map(c => [c.path, c]));

/** Top-level pillars in house order. */
export const PILLARS = ['troubleshooting-fixes', 'tips-hidden-features', 'guides-how-tos', 'buying-guides']
  .map(s => bySlug[s]);

/** posts in a category incl. descendants */
export function postsIn(cat) {
  const kids = new Set(CATS.filter(c => isDescendant(c, cat)).map(c => c.slug));
  kids.add(cat.slug);
  return POSTS.filter(p => p.cats.some(s => kids.has(s)));
}
/** direct posts only (matches WP count semantics) */
export function postsDirect(cat) {
  return POSTS.filter(p => p.cats.includes(cat.slug));
}
export function isDescendant(c, anc) {
  let p = c.parent;
  while (p) {
    if (p === anc.id) return true;
    p = byId[p]?.parent;
  }
  return false;
}
export function childrenOf(cat) {
  return CATS.filter(c => c.parent === cat.id);
}
export function rootOf(cat) {
  let r = cat;
  while (r.parent && byId[r.parent]) r = byId[r.parent];
  return r;
}
export function descendantsOf(cat) {
  return CATS.filter(c => isDescendant(c, cat));
}

export const fmtDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${mo} ${y}`;
};
export const fmtLong = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const mo = ['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1];
  return `${d} ${mo} ${y}`;
};
export const wordLine = p => (p.words ? `${p.words.toLocaleString('en-US')} words · ${p.read_min} min` : '');
export const mostRead = () => [...POSTS].sort((a, b) => b.comments - a.comments).slice(0, 5);
