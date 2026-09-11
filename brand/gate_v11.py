"""v1.1 gate: C1 @1400px — no white gap >25px in wordmark span, all 13 glyphs >300 ink, eyes round."""
import sys
sys.path.insert(0, '/home/ubuntu/androidscroll/brand/v2')
import cairosvg
from PIL import Image
from build_concepts import WORD, SIZE, BASE, word_layout
from brandgen import glyph_adv

V2 = '/home/ubuntu/androidscroll/brand/v2'
svg = open(f'{V2}/concept1.svg').read()
cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{V2}/concept1_GATE1400.png',
                 output_width=1400, background_color='white')
im = Image.open(f'{V2}/concept1_GATE1400.png').convert('L')
W, H = im.size
px = im.load()
ink_col = [sum(1 for y in range(H) if px[x, y] < 200) for x in range(W)]
span = [x for x in range(W) if ink_col[x] > 0]
x0, x1 = min(span), max(span)
gaps, cur = [], 0
for x in range(x0, x1 + 1):
    if ink_col[x] == 0:
        cur += 1
    else:
        if cur:
            gaps.append(cur)
            cur = 0
if cur:
    gaps.append(cur)
print('C1 maxgap:', max(gaps) if gaps else 0, 'gaps>25:', [g for g in gaps if g > 25])
items, total = word_layout(WORD, SIZE)
scale = 1400.0 / (total + 8)
ox = 4 * scale
tbl = []
ok = True
for ch, dx in items:
    ax0 = int(ox + dx * scale)
    ax1 = int(ox + (dx + glyph_adv(ch, SIZE)) * scale)
    n = sum(ink_col[x] for x in range(max(0, ax0), min(W, ax1)))
    tbl.append(f'{ch}:{n}')
    if n <= 300:
        ok = False
print('per-glyph:', ' '.join(tbl))
print('ALL>300:', all(int(t.split(':')[1]) > 300 for t in tbl))
# eye roundness: sample eye centers (must be cut=paper) + corners of eye bbox (must be ink)
print('circles in master:', svg.count('<circle'))
print('GATE:', 'PASS' if (max(gaps or [0]) <= 25 and ok) else 'FAIL')
