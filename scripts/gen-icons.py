#!/usr/bin/env python3
"""Generate PWA icons from the inline SVG favicon spec (teal rounded square
+ white corner block). Pure PIL, no network. v0.6.8 manifest work."""
from PIL import Image, ImageDraw
import os

OUT = "/home/ubuntu/androidscroll/build/public/icons"
os.makedirs(OUT, exist_ok=True)
TEAL = (0, 110, 94, 255)      # #006E5E — matches favicon rect fill
WHITE = (255, 255, 255, 255)

def make(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        # full-bleed square (no rounding) — safe-zone art inset ~80%
        d.rectangle([0, 0, size - 1, size - 1], fill=TEAL)
        s = size / 32.0
        # white block from the SVG: x19 y6 w7 h7, scaled into the inner ~70% box
        inset = size * 0.15
        bx, by, bw = 19 * s, 6 * s, 7 * s
        d.rectangle([inset + bx * 0.7, inset + by * 0.7,
                     inset + (bx + bw) * 0.7, inset + (by + bw) * 0.7], fill=WHITE)
    else:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=max(2, round(size * 3 / 32)), fill=TEAL)
        s = size / 32.0
        d.rectangle([round(19 * s), round(6 * s), round(26 * s), round(13 * s)], fill=WHITE)
    return img

make(192).save(f"{OUT}/icon-192.png")
make(512).save(f"{OUT}/icon-512.png")
make(512, maskable=True).save(f"{OUT}/icon-512-maskable.png")
for f in sorted(os.listdir(OUT)):
    p = os.path.join(OUT, f)
    print(f, Image.open(p).size, os.path.getsize(p), "bytes")
