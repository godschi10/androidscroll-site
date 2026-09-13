# Changelog

## 0.5.0 — 2026-09-13 — comments system (first-party: component + Worker + D1)
- **`src/components/Comments.astro` (new, 438 lines):** click-to-load comment thread, zero third-party JS. States idle → loading (skeleton) → empty | list | error (retry). Submit form (name required, email optional for reply notices, website optional), nested reply rendering, reaction rail (like/heart/fire/laugh), and the author badge (`is_author`, display-only — matches the post author's name passed as `authorName`). API base is a single `apiBase` prop → one-line rollback.
- **Mount (`src/pages/[...slug].astro`):** `<Comments postId postSlug initialCount authorName="G-will Chijioke" />` inside the article shell after the related-posts section; build-time WP comment count seeds the button label.
- **Worker rail:** `androidscroll-comments` live at `androidscroll-comments.gwill.workers.dev` — GET `/api/comments?post=`, POST submit (rate-limited, write-time sanitization via hand-rolled tokenizer allowlist, `AUTO_APPROVE=false` → everything holds for moderation), POST `/api/comments/:id/react` (toggle, ip_hash identity), reports + moderation Bearer/HMAC rails, KV thread cache with ETag, cron retention sweep.
- **D1 store:** `androidscroll-comments` (id 8d0e1e48-…) — comments / reactions / moderation_log / rate_limits / reports per brief §3.3. Raw email and IP never stored (sha256 hashes only).
- **Backfill:** all 52 real WP comments imported with WP ids preserved as comment ids, `parent_id` from WP parent, `status='approved'`, `created_at` = WP `date_gmt`, `content_raw` = WP rendered HTML tag-stripped to text, `content_html` = Worker sanitizer output, `ip_hash=NULL`, `email_hash=NULL` (REST exposes no emails). The 54-vs-52 delta reconciled: `x-wp-total: 54` counts 2 ping/trackback entries the public REST list filters out (`type=ping` forbidden unauthenticated; per-post probes across all 21 published posts+pages sum to exactly 52). Only real comments imported.

## 0.4.32 — 2026-09-13 — embed persistence + Spotify clip cleanup
- **Embed persistence (ArticleChrome.astro):** removed `ifr.loading = 'lazy'` set at play-time in the facade→iframe swap. A lazy iframe that is already offscreen when created can be deferred by the browser until it scrolls into view — for a card the user *just* tapped, that reads as a dead/blank player (embed never loads = "lost persistence"). The iframe is built on explicit user action and inserted in-viewport; eager loading is the correct default. Nothing else in the swap path changed.
- **Spotify radius removal (global.css):** dropped the leftover `border-radius:6px` on `.facade-card.fc-live-spotify iframe` (v0.4.31 add-back). v0.4.30 established the law: **one clip path, on the card** — `.fc-live` has `border-radius:6px;overflow:hidden` and the iframe fills it square. The iframe's own second radius re-created the box-within-a-box white-tip artifact the card clip exists to prevent; the `#121212` iframe background stays (transparent-canvas backing), only the radius goes.
- Version sync: package.json catches up 0.4.28→0.4.32 (0.4.29–0.4.31 shipped as commit-only entries); CHANGELOG carries the combined 0.4.32 note.

## 0.4.28 — 2026-09-12 — embed cards: added X (Twitter) embed
- 8th provider on the style-test article: X (Twitter) facade card after YouTube Music. Embed URL `https://platform.twitter.com/embed/Tweet.html?id=20` — jack's "just setting up my twttr", the most famous public tweet; oEmbed (publish.x.com) confirms it's live; the embed endpoint returns 200 (curl, mobile UA) and is the exact frame `widgets.js` uses, so zero third-party JS until play is preserved.
- `data-embed-ratio="16/9"` per brief (landscape card shell; the tweet frame itself centers inside).
- `public/img/og-x.jpg`: 1200×675 poster, X brand blue `#1DA1F2` with the official white X glyph (real 24×24 logo path), rendered via `scripts/gen-x-poster.py` (SVG→cairosvg→PIL, ink-bbox auto-centering recipe from v0.4.25).
- Badge carries the official X logo SVG; label/title follow the card discipline (`just setting up my twttr — @jack` / `Post · X embed`).
- Also carries the uncommitted v0.4.27 working-tree change: explicit `data-embed-ratio="16/9"` on the YouTube/Vimeo/YouTube-Music cards so all three video cards declare their ratio the way TikTok declares 9/16.

## 0.4.26 — 2026-09-12 — audio player: centered music-note background illustration
- King's ask: the self-hosted audio row (`field note` player) should carry a subtle music-note illustration centered behind the player, like an engraved watermark on the card.
- `public/img/audio-note.svg`: beamed eighth notes over five faint staff lines, mint `#D9F2E8` at 0.18 opacity — colors baked as literals (CSS `var()`/`currentColor` don't cascade into `background-image` SVGs; the first cut rendered black-on-black). Ink recentered in the viewBox (`translate(4 23)`) so the note sits dead-center when the image is placed `center`.
- Wired on `.audio-fig .fc-audio-row` as `background-image: url('/img/audio-note.svg')` + `center/120px no-repeat` longhands — the single `background:` shorthand left `background-image` unparsed in Obscura (CSSOM had the rule, pixels had none); longhands render correctly on the King's acceptance browser.
- Proof (Obscura, 390px, dark theme): note ink + staff pixels measured centered at (178,30) vs row center (179,31); zoomed crop shows the note fully inside the row's visible band, no clipping.
- Also ships the v0.4.25 TikTok poster fix (regenerated, auto-centered `og-tiktok.jpg` + `scripts/gen-tiktok-poster.py`) whose CHANGELOG entry was left uncommitted; version bumped 0.4.25→0.4.26 with it.

## 0.4.25 — 2026-09-12 — TikTok poster: properly drawn, centered music-note art
- King's shot: the TikTok card (ADB quick tip) background showed an off-center, malformed gray note — stems sliced behind the play button, heads clipped at the card bottom, nothing that read as music. Root cause: the v0.4.21 brand-blank `og-tiktok.jpg` was hand-drawn with the glyph ink-center ~165px right of canvas center (measured: bbox x 540–990 of 1200) and unequal noteheads.
- Fix: `scripts/gen-tiktok-poster.py` regenerates the poster deterministically — clean engraving geometry (two equal 95×70 tilted-ellipse heads, vertical stems fused into one slanted beam), TikTok chromatic split (cyan lower-left / red upper-right behind white) for platform context, and measure→translate→re-render auto-centering verified in pixels (final ink center 601,600 of 1200×1200, symmetric 322px margins). Replaces the old jpg in place — no markup change needed; `fc-poster` object-fit:cover keeps it centered on the card.

## 0.4.24 — 2026-09-12 — self-hosted audio figure: dropped the oversized facade-card wrapper
- King's call: the field-note audio row was buried inside a hollow `.facade-card` (min-height 200px, 28px padding, flex-centered) whose poster/scrim/play/title children don't exist for self-hosted audio — a big stretched empty box around one slim row.
- Fix: removed the wrapper in `style-test-article.astro` — `figure.audio-fig` now contains just `.fc-audio-row` + `figcaption`. Re-scoped the row's CSS from `.facade-card .fc-audio-row` to `.audio-fig .fc-audio-row` (margin-top 14→0 — no more padded parent to clear) and gave `.audio-fig .fc-badge` the same static-badge look it had via the old `.facade-card .fc-badge`+`position:static` override. The row's own border/background/radius is now the visible card; `figure` keeps `.prose figure` spacing.

## 0.4.23 — 2026-09-12 — embed cards: no excessive space after play
- King's shot: after clicking play, the card kept its poster min-height/padding while the live iframe (e.g. Spotify's 152px audio player) sat inside — leaving a big empty band under the player.
- Fix: on play, `ArticleChrome` marks the card `.fc-live`; CSS sheds the poster box (`min-height:0`, padding `0`) and the iframe flows in normal layout sized to the **provider's intrinsic box** — `data-embed-height` px for audio players (Spotify 152, Apple Music 270, Audiomack 252), `data-embed-ratio` for portrait video (TikTok 9/16), CSS default 16/9 for plain video. Cards now shrink to fit the live player; no dead space below.

## 0.4.21 — 2026-09-12 — embed posters: REAL platform OG art, self-hosted
- King's call: prefer each platform's **real cover/OG art** over hand-made SVGs; brand-color blanks only where no art exists. Fetched and self-hosted (no hotlinking) into `public/img/` as `og-*.jpg`: **YouTube** (aqz-KE-bpKQ maxresdefault 1280×720), **YouTube Music** (4NRXx6U8ABQ maxresdefault), **Spotify** (Blinding Lights album cover via scdn 300×300), **Apple Music** (Never Gonna Give You Up artwork via iTunes lookup API, 600×600 upscaled URL), **Audiomack** (Got It On Me og:image from the song page, 1200×1200 webp → jpg). **Real art: 5 of 7.**
- Brand-color blanks (no usable art source): **Vimeo** — oEmbed for 76979871 returns 404 (video has no public embed art), plain `#1AB7EA` 1200×675; **TikTok** — no oEmbed artwork available, black 1200×1200 with white music-note glyphs.
- `style-test-article.astro` fc-poster srcs repointed to the 7 jpgs (Vimeo/Audiomack/YouTube-Music swapped off leftover `kb-*` placeholders too). The 7 hand-made `og-*.svg` are retired — not committed, deleted from the tree (they were never in git).

## 0.4.18 — 2026-09-12 — embed cards: right-edge bleed fix
- King's shot: YouTube/Vimeo cards bled to the right screen edge (cut-off corners) while TikTok stayed fine. Root cause, proven in-DOM: `aspect-ratio:16/9` + `min-height:200px` makes the engine compute card width as 200×16/9 = **356px** regardless of container — fits at 390 (358) but overflows 360/320 viewports. Worse: phone engines **ignore `max-width` against ratio-transferred width** (even an inline `288px` didn't clamp it). Fix: dropped `aspect-ratio` from the cards (min-height + vertical padding carry the frame; poster is `cover` so nothing distorts) — width is always the container now. Verified: 320 → all cards 16-304, 360 → 16-344, docW clean at every width; vision-confirmed equal gutters + rounded corners both sides. Standing law: never pair `aspect-ratio` with `min-height` on full-bleed-width elements — and never trust `max-width` to save it.

## 0.4.17 — 2026-09-12 — media embeds: styled facade cards for 6 providers
- King's shot: video placeholder + audio player read as "not styled or working" — a bare `▶` text line in an empty dark box, and a stock native audio widget.
- Replaced with a full embed system, privacy-first (zero third-party JS until play): styled facade cards — poster art, scrim, provider badge with brand icon, round teal play button (64px, hover scale), title + caption. Click swaps the provider iframe into the card shell. Providers wired: **YouTube** (nocookie), **Vimeo**, **TikTok** (portrait 9/16 card), **Spotify**, **Apple Music**. All embed endpoints verified 200 live before wiring.
- Self-hosted audio: styled field-note row (badge + native control, brand-tinted) instead of a floating bare widget.
- Card discipline: min-height fallback where aspect-ratio drops (200px 16/9, 400px 9/16); play button owns its flex row so it never clips. Verified at 390: all 6 badges render, 5 cards, swap works (iframe replaces innards, shell keeps frame), card 1 vision-passed complete circle + badge + no clipping.

## 0.4.16 — 2026-09-12 — ol pill-to-text breathing room
- King's shot: pills sat too close to the text. Measured: 6px gap (pill right edge nearly touching the first character). Gutter widened 36→44px with the pill offset tracking it — now 14px breathing room, matching the bullet-list rhythm. Proven at 390: pill right 46 → text left 60 = 14px clean; vision-confirmed "comfortable breathing room, not cramped, not touching." Vertical centering from v0.4.15 preserved.

## 0.4.15 — 2026-09-12 — ol number pills: optical centering
- King's shot: numbered-list pills floated ABOVE the text line. Root cause chain: (1) `top:.15em` anchored the pill to the li box top, not the text band; (2) my first fix used the `1lh` unit, which phone-class engines drop as invalid — the pill never moved (two identical pixel measurements exposed it). Final: `top:calc(.875em - 5px)` — em-based, engine-safe, pixel-measured at 390 to land the pill center within 1.5px of the first line's glyph band center; vision-confirmed "centered on the first line." Lesson recorded: never use `1lh` in this codebase.

## 0.4.14 — 2026-09-12 — article hero discipline: breadcrumbs + author row
- King's shot: hero is beautiful but messy — breadcrumbs wrapped with a dangling `›` onto line two, and the author hung loose beside the 40px avatar.
- Breadcrumbs: single line, never wraps; long current-page title truncates with ellipsis (Home + section always visible). Root cause of the wrap + misalignment was the `li+li::before` pseudo-element separator — its glyph line-metrics doubled li height in phone engines (35px vs 17px). Replaced with REAL `<span class="sep">›</span>` markup — no pseudo-metric quirks in any engine. Verified: 390 + 768 + 1280 all single-line, all items top-aligned (96/96/96, heights 18/18/18), arrows visible.
- Author row: avatar + "By" + name now one centered inline-flex row (32px hero avatar, down from the 40px author-box block) — no more hanging author.

## 0.4.13 — 2026-09-12 — lightbox: scope + blank-image fix
- King's shot: dialog opened (X, arrows, `2 / 5`, caption all live) but the enlarged image painted zero pixels on his phone. Root: `.gl-image{width:auto}` inside a shrink-to-fit flex wrap — circular sizing that collapses to nothing on phone browsers. Fix: wrap is definite-width (`width:100%`, `min-height:40px`) + image is `display:block;width:100%;height:auto;object-fit:contain` — always nonzero, correct aspect. Proven: mobile 390 renders 358×201, desktop all 5 open at wrap-full width.
- Scope (shipped same cycle): lightbox now watches `figure img, .gallery img, .art-hero img, .qa-box img` across the whole article, not just `.prose` descendants — hero + gallery + qa all zoomable. Plus a src guard: never hand the dialog an empty `src` (paints zero px with no broken icon); falls back to resolving the `src` attribute against the document base.

## 0.4.12 — 2026-09-12 — no Copy button on poems
- King found a second Copy button and asked what it was: the decorative `.verse` stanza ("The toast says nothing...") in the kitchen-sink was caught by the copy-button loop that targeted ALL `pre` blocks. Poems are not code — verse now skips button, wrapper, and lang chip. Exactly one Copy per page region: the bash block.

## 0.4.11 — 2026-09-12 — bash block mobile wrap
- King's shot: long command lines were clipped at the right edge on mobile (half-visible `adb install app-release…`). Touch widths now wrap code (pre-wrap + break-word, measured scrollW 358/358 — nothing truncated); desktop ≥1024 keeps the terminal x-scroll. Top padding reserved so lines clear the BASH chip.

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
