# Changelog

## 0.4.0 — 2026-09-11 — homepage FRONT PAGE + C-FULL article
- Homepage v3 (H1 front page, H2 voice): hero strip (H1 halved, one-sentence stand, hairline meta), status TICKER above fold (swipeable 1-line), full ledger moved below LATEST, Top fixes first (first guide ~1000px → 482px), LATEST §01, tiles 1/2/4 cols, terminal compressed, WP-database lie killed ("counts read straight off the build").
- v3.2 bleed fix: `.sec`/`.notify`/`.hero` padding shorthands had zeroed `.wrap` side gutters site-wide since v0.2 — longhands now; article/category layouts swept; pixel proof 0 text rows inside 12px gutters @390. Standing law: no zero-side padding shorthands, ever.
- v3.3 notify contrast (dark): email field 1.14:1 → mint field 15.8:1; button text ink-on-verdict → mint 12.85:1 AAA. Light untouched.
- Header v2.9: compact state no longer changes header height (54→48 delta was the article "dance" reflow loop) — hairline + shadow only, zero layout shift; hysteresis kept.
- Article C-FULL: breadcrumb `<ol>` + BreadcrumbList/BlogPosting JSON-LD, meta row (avatar/time/updated/read/comments), hero-band placeholder, QUICK-ANSWER box (King's voice), mobile `<details>` TOC + desktop sticky spy TOC island, `.prose` body, vanilla lightbox island, video/audio facades, callouts, tags, share (X/WhatsApp/Telegram/copy-link), author bio, related-with-fallback, prev/next, ONE newsletter slot, scaleX progress bar, kitchen-sink style-test route (`/style-test-article/`, noindex).
- PWA: `short_name` "Scroll" → "AndroidScroll" (one word, together).
- Footer v2.7: paper = grid sibling, true 2×2 mobile, one-row desktop. Brand C1 v2.8: seamless single-path robot, real C1 favicon set wired.
- Header/meta chain: v1.2 Scroll DEEP #006E5E (dark remap #00C896) + round eyes; v1.3 single dynamic `#tc-base` (first-match fix); v2.1 edge-to-edge `html` canvas bg + safe-area; v2.3B reverted `viewport-fit=cover` (covered meta strip in tabs).

## 0.1.0 — 2026-09-10
- First clickable Astro prototype: Header (masthead band + sticky compact state, Browse sheet with real 19-shelf tree + honest counts, search overlay, theme toggle, Law-8 ad toggles), Homepage (wireframe §01 spine: dateline hero "Master your Android.", flagship FIX-rail, pillar map, quick answers, money-tree verdict band, latest + most-read rail, EEAT trust band, notify stub), Footer (sitemap columns, notify stub, legal, Matomo consent note, site-wide ad toggle OFF state).
- Fonts self-hosted: Fraunces (variable), Manrope (variable), IBM Plex Mono 400/500/600 — latin woff2, font-display swap, zero external requests.
- Thin stubs so every link resolves: 13 article pages (canonical slugs), 19 category pages (12 empty = designed noindex state), 8 static pages, latest, 404.
- `scripts/relativize.mjs` post-process rewrites hrefs/src/url() relative → unzipped dist is clickable from file://.
- GitHub Pages workflow (`deploy-pages`) publishes CI-built `dist`.
