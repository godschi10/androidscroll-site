#!/usr/bin/env python3
"""v2.8: regenerate site PWA icons + favicon from the SEAMLESS C1 mark.
Renders concept1-mark.svg via cairosvg onto the deep-green tile."""
import os
import cairosvg
from PIL import Image

V2 = '/home/ubuntu/androidscroll/brand/v2'
OUT = '/home/ubuntu/androidscroll/build/public/icons'
FAV = '/home/ubuntu/androidscroll/build/public'
os.makedirs(OUT, exist_ok=True)

svg = open(f'{V2}/concept1-mark.svg').read()  # tile + robot already in the SVG

# 'any' icons: the mark is a square tile already
for size in (192, 512):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/icon-{size}.png',
                     output_width=size, output_height=size, background_color='transparent')

# maskable: safe-zone padding (content inside inner 80%)
tmp = '/tmp/c1-mark-400.png'
cairosvg.svg2png(bytestring=svg.encode(), write_to=tmp, output_width=400, output_height=400)
m = Image.open(tmp).convert('RGBA')
canvas = Image.new('RGBA', (512, 512), (0, 110, 94, 255))  # DEEP bed
canvas.alpha_composite(m.resize((410, 410), Image.LANCZOS), ((512 - 410) // 2, (512 - 410) // 2))
canvas.convert('RGB').save(f'{OUT}/icon-512-maskable.png')

# favicon set: the mark directly
for size in (16, 32, 48):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{FAV}/favicon-{size}.png',
                     output_width=size, output_height=size, background_color='transparent')
imgs = [Image.open(f'{FAV}/favicon-{s}.png') for s in (16, 32, 48)]
imgs[0].save(f'{FAV}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=imgs[1:])
print('icons written:', sorted(os.listdir(OUT)) + [f for f in sorted(os.listdir(FAV)) if f.startswith('favicon')])
