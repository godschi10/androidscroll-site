# Changelog

## 0.4.10 — 2026-09-12 — copy button: real button + no code overlap
- King's shot: the Copy control was a transparent ghost AND covered the tail of every code line. Restyled solid teal fill + dark text (clear affordance) and reserved a bottom band in the code block so the button always sits below the code, never on it (verified: 14px clear).

## 0.4.9 — 2026-09-12 — code blocks: highlighting + scroll-anchor fix
- Code blocks had no syntax highlighting and multiple bugs. Added: a dependency-free bash micro-tokenizer (commands teal, flags/numbers/strings/comments tinted — no Prism, no jQuery) applied to `language-bash/sh/shell/console` blocks.
- Copy button + language chip were absolutely positioned INSIDE the x-scrolling `<pre>`, so they slid off-screen with long code — moved to a non-scrolling `.code-wrap` wrapper (verified: button stays at right=366 while code scrolls 40px).
- Table inline `INSTALL_FAILED_*` tokens were breaking mid-word — now `white-space:nowrap` in cells (table scrolls, tokens stay whole).

## 0.4.8 — 2026-09-12 — list marker breathing room
- Ol step-pill (26px box) sat in a 24px gutter — touching the text on every numbered step (King's shot). Gutter now 36px both list types, pill at -36: 16px clean gap (measured: pill 16→36, text at 52). Ul diamond re-synced to the shared indent; nested lists align. Zero overflow held @390.

## 0.4.7 — 2026-09-11 — TOC clarity
- Mobile TOC read as a bare grey bar the user couldn't identify. Now a labeled disclosure card: "In this guide (N)" with § marker + rotating chevron, paper bg + deep left rule, distinct from body.
- Widget TOC (`.toc-side`) hard-hidden below 1024 via CSS `display:none` — JS can no longer leak a stray aside onto mobile; desktop sticky aside keeps `display:block` at ≥1024.

## 0.4.6 — 2026-09-11 — real hero art, placeholder band killed
- The hero placeholder band (bordered box + accent bar + centered caps) read as a dead CTA to the King and two vision passes — frame tweaks couldn't save it. Deleted: all 13 articles now carry real field-manual SVG hero illustrations mapped per topic (storage/unknown-sources/toast/success/terminal), eager + captioned. Device shots replace them with the body port.

## 0.4.5 — 2026-09-11 — meta landscape + test-page parity
- Landscape/tablet (640–899px) got the desktop row but not the width — wrapped ragged. Column discipline now runs to 899px; full labels kept (diet stays mobile-only).
- style-test-article carried a stale hardcoded copy of the old meta (the "didn't change" the King saw) — mirrored to meta-facts/diet markup. Lesson: test route mirrors the template, always.

## 0.4.4 — 2026-09-11 — meta facts diet
- Mobile facts were 2 lines with an orphaned "· 0 comments" (the "too long" the King saw). Labels abbreviated on mobile ("Published"/" read" hidden), and when the Updated pill exists the published date rests (desktop + JSON-LD keep it). Facts now one line @390: pill · min · comments.

## 0.4.3 — 2026-09-11 — article meta two-line discipline
- `.meta-bar` flex-wrap shattered into 3 ragged lines @390 (author @420, orphaned date @440, rest @486). Facts now grouped in `.meta-facts` with middot separators; mobile stacks two deliberate lines (author, facts). Desktop untouched.

## 0.4.2 — 2026-09-11 — verdict-band score stat
- `.vb-score` was a baseline row: giant 0 with the label hanging off its 110px baseline (the "didn't move an inch" the King saw — my v0.4.1 fixed the CATEGORY zero, this is the HOMEPAGE money-tree one). Stacked stat now: number over label, left-aligned with band content (x=36/36 @390).
- Standing clarity: two zeroes exist — category empty-hero count vs homepage verdict score. Name them in reports.

## 0.4.1 — 2026-09-11 — empty-shelf count alignment
- Category `.cat-hero` had the same zero-side padding shorthand (gutters dead, giant "0" at x=0) — longhand now; empty-state composed centered (tabular-nums zero + centered launch pill), deliberate at any future count.
- Probe note: `file://` hangs Obscura on island module scripts — article/category probes serve dist over local HTTP.

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
