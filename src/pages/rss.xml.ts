import { SITE, POSTS } from '../data/site';

/* RSS 2.0 from the real WP data (13 posts) — v0.1 shipped a /rss.xml link with
   no feed behind it (the one 404 route on the live prototype). Self-hosted,
   zero external requests, honest dates/counts. */
export function GET() {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
  const items = [...POSTS]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE.url}${p.url}</link>
      <guid isPermaLink="true">${SITE.url}${p.url}</guid>
      <pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
      <category>${esc(p.cat_name)}</category>
    </item>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${SITE.url}/</link>
    <description>${esc(SITE.tagline)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
