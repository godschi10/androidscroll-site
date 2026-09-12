#!/usr/bin/env python3
"""Generate public/img/og-x.jpg — X (Twitter) facade-card poster.
1200x675, brand blue #1DA1F2, centered white X logo (official glyph path).
Deterministic: SVG -> cairosvg -> PIL -> JPEG. Same recipe family as
gen-tiktok-poster.py (v0.4.25): draw vector, measure ink bbox, auto-center.
"""
import io, os
from PIL import Image
import cairosvg

W, H = 1200, 675
BG = "#1DA1F2"          # X brand blue (legacy Twitter bird blue, per King's brief)
LOGO = "#FFFFFF"       # white X glyph
GLYPH_SIZE = 300       # px height of the X mark
# Official X logo path (24x24 viewBox)
X_PATH = ("M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474"
          "l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z")

def render(dx=0.0, dy=0.0):
    scale = GLYPH_SIZE / 24.0
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="{BG}"/>
  <g transform="translate({(W - GLYPH_SIZE)/2 + dx:.2f} {(H - GLYPH_SIZE)/2 + dy:.2f}) scale({scale:.4f})">
    <path d="{X_PATH}" fill="{LOGO}" fill-rule="evenodd"/>
  </g>
</svg>'''
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).convert("RGB")

img = render()
# measure ink bbox (white glyph vs blue bg) and re-center if off
px = img.load()
xs, ys = [], []
for y in range(0, H, 3):
    for x in range(0, W, 3):
        r, g, b = px[x, y]
        if r > 240 and g > 240 and b > 240:
            xs.append(x); ys.append(y)
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
dx, dy = W / 2 - cx, H / 2 - cy
if abs(dx) > 1 or abs(dy) > 1:
    img = render(dx, dy)
    print(f"recentred by ({dx:.1f},{dy:.1f})")

out = os.path.join(os.path.dirname(__file__), "..", "public", "img", "og-x.jpg")
img.save(out, "JPEG", quality=90, optimize=True)
print(f"wrote {os.path.normpath(out)} {img.size}")
