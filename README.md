# AndroidScroll — prototype (Astro)

Clickable first build: **Header, Homepage, Footer** at flagship quality with real
content from androidscroll.com (13 posts / 19 shelves / 52 comments — honest counts).
Direction A2 "editorial green" (approved), self-hosted fonts, zero external requests.

## Ship

```
npm ci
node scripts/copy-fonts.mjs
NODE_OPTIONS=--max-old-space-size=384 npm run build   # astro build + relativize
```

`dist/` is page-relative (`relativize.mjs`) — unzip anywhere and open `index.html`
from `file://` on a phone; every link, the Browse sheet, search, theme and ad-toggle work.

## Layout

- `src/data/content.json` — generated from WP REST (source of truth for counts/dates)
- `src/styles/global.css` — A2 tokens + every signature (FIX rails, § dividers, verdict band)
- `src/components/Header.astro` — masthead + sticky compact state + Browse sheet + search + theme + Law-8 ad toggles
- `src/pages/` — home, 13 article stubs (canonical slugs), 19 category pages (12 empty = designed noindex), static stubs, latest, 404

## Fonts (OFL, self-hosted, subset latin)

Fraunces (display) · Manrope (body/UI) · IBM Plex Mono (meta/kickers/bylines/counts) — `src/assets/fonts`, copied to `public/fonts` by `scripts/copy-fonts.mjs`.

## Laws honored

Green-only · H1 "Master your Android." · no hamburger (Browse sheet) · ad-toggle OFF = zero height/zero request/zero shift · honest counts · empty categories noindex · EEAT trust band · canonical slugs preserved · Astro + static.

© 2026 AndroidScroll — client asset, zero GWill DNA.
