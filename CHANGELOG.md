# Changelog

## 0.1.0 — 2026-09-10
- First clickable Astro prototype: Header (masthead band + sticky compact state, Browse sheet with real 19-shelf tree + honest counts, search overlay, theme toggle, Law-8 ad toggles), Homepage (wireframe §01 spine: dateline hero "Master your Android.", flagship FIX-rail, pillar map, quick answers, money-tree verdict band, latest + most-read rail, EEAT trust band, notify stub), Footer (sitemap columns, notify stub, legal, Matomo consent note, site-wide ad toggle OFF state).
- Fonts self-hosted: Fraunces (variable), Manrope (variable), IBM Plex Mono 400/500/600 — latin woff2, font-display swap, zero external requests.
- Thin stubs so every link resolves: 13 article pages (canonical slugs), 19 category pages (12 empty = designed noindex state), 8 static pages, latest, 404.
- `scripts/relativize.mjs` post-process rewrites hrefs/src/url() relative → unzipped dist is clickable from file://.
- GitHub Pages workflow (`deploy-pages`) publishes CI-built `dist`.
