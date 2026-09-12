#!/usr/bin/env python3
"""Generate og-tiktok.jpg — TikTok poster: clean beamed-eighth-notes glyph on brand black.

v0.4.25 (King): the v0.4.21 blank was hand-drawn with offset ~165px right of center and
malformed heads (right head smaller/lower, beam not fused to stems). This draws proper
engraving-style geometry (equal tilted ellipse heads + vertical stems + fused parallelogram
beam), auto-centers the ink bbox on the 1200x1200 canvas (measure -> translate -> re-render),
and adds the TikTok chromatic split (cyan lower-left / red upper-right) for platform context.
Reproducible: python3 scripts/gen-tiktok-poster.py
"""
import io
import cairosvg
from PIL import Image

SIZE = 1200
CYAN, RED, WHITE, BG = "#25F4EE", "#FE2C55", "#FFFFFF", "#000000"


def note_shapes():
    """One well-drawn beamed pair of eighth notes, upright, local coords (bbox ~ x 375-973, y 356-862)."""
    return f"""
  <ellipse cx="470" cy="800" rx="95" ry="70" transform="rotate(-20 470 800)"/>
  <ellipse cx="745" cy="726" rx="95" ry="70" transform="rotate(-20 745 726)"/>
  <rect x="548" y="430" width="26" height="384"/>
  <rect x="823" y="356" width="26" height="384"/>
  <polygon points="548,424 863,342 863,406 548,488"/>
"""


def svg(offset_x=0.0, offset_y=0.0):
    tr = f' transform="translate({offset_x:.1f} {offset_y:.1f})"' if (offset_x or offset_y) else ""
    shapes = note_shapes()
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">
<rect width="{SIZE}" height="{SIZE}" fill="{BG}"/>
<g{tr}>
  <g fill="{CYAN}" transform="translate(-17 13)" opacity="0.8">{shapes}</g>
  <g fill="{RED}" transform="translate(17 -13)" opacity="0.8">{shapes}</g>
  <g fill="{WHITE}">{shapes}</g>
</g>
</svg>"""


def render(off_x=0.0, off_y=0.0):
    png = cairosvg.svg2png(bytestring=svg(off_x, off_y).encode(), output_width=SIZE, output_height=SIZE)
    return Image.open(io.BytesIO(png)).convert("RGB")


def ink_center(im):
    """Center of all pixels brighter than 60 (chromatic edges included)."""
    xs, ys = [], []
    px = im.load()
    for y in range(0, SIZE, 2):
        for x in range(0, SIZE, 2):
            r, g, b = px[x, y]
            if max(r, g, b) > 60:
                xs.append(x); ys.append(y)
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(xs), max(xs), min(ys), max(ys))


im = render()
cx, cy, box = ink_center(im)
dx, dy = SIZE / 2 - cx, SIZE / 2 - cy
print(f"pass1 ink center ({cx:.0f},{cy:.0f}) bbox {box} -> shift ({dx:+.1f},{dy:+.1f})")
im = render(dx, dy)
cx, cy, box = ink_center(im)
print(f"pass2 ink center ({cx:.1f},{cy:.1f}) bbox {box} err=({SIZE/2-cx:+.1f},{SIZE/2-cy:+.1f})")
assert abs(SIZE / 2 - cx) <= 2 and abs(SIZE / 2 - cy) <= 2, "glyph not centered"

out = "/home/ubuntu/androidscroll/build/public/img/og-tiktok.jpg"
im.save(out, "JPEG", quality=90, subsampling=0)
print("wrote", out)
