"""Emit the C1 header lockup SVG: var() fills (theme-adaptive) + class="eye" on the two eye circles (v1.1: round mascot eyes)."""
import sys
sys.path.insert(0, '/home/ubuntu/androidscroll/brand/v2')
from build_concepts import WORD, SIZE, BASE, variants, word_layout, svg_doc
from brandgen import (glyph_svg, glyph_adv, dome, head, rect, circ, stub, shapes_svg,
                      shape_svg, _f)

INK, DEEPV, CUT = 'var(--ink)', 'var(--deep)', 'var(--canvas)'
N_AND = 7  # 'Android'


def c1_shapes_eyes(cx, base, w):
    """Same geometry as c1_shapes, but eye circles carry class="eye"."""
    h = w / 2.0
    flat = base - (w - h)
    solids, eyes, cuts = [], [], []
    for side in (-1, 1):
        solids.append(stub(cx + side * w * 0.30, flat - h * 0.55,
                           -90 + side * 40, w * 0.30, w * 0.13))
    solids.append(head(cx, base, w))  # v2.8 merged — no seam
    es = w * 0.17
    ey = base - w + h * 0.55
    for side in (-1, 1):
        eyes.append(circ(cx + side * w * 0.22, ey, es / 2, cut=True))
    cuts.append(rect(cx - w * 0.19, base - h * 0.62, w * 0.38, h * 0.62 + 0.5, cut=True))
    out = ''.join(shape_svg(s, INK, CUT) for s in solids)
    for s in eyes:
        out += (f'<circle class="eye" cx="{_f(s["cx"])}" cy="{_f(s["cy"])}" '
                f'r="{_f(s["r"])}" fill="{CUT}"/>')
    out += ''.join(shape_svg(s, INK, CUT) for s in cuts)
    return out


items, total = word_layout(WORD, SIZE)
parts = []
for i, (c, dx) in enumerate(items):
    if i == 0:
        continue  # robot-A replaces the 'A'
    # v1.2 King's order: 'Android' (idx 1-6) INK, 'Scroll' (idx 7-12) DEEP var(--deep)
    parts.append(glyph_svg(c, dx, BASE, SIZE, INK if i < N_AND else DEEPV))
a_slot = glyph_adv('A', SIZE)
parts.append(c1_shapes_eyes(a_slot / 2, BASE, a_slot * 0.94))
body = ''.join(parts)
svg = svg_doc(total + 8, 100, f'<g transform="translate(4,0)">{body}</g>')
# header-ready attrs
svg = svg.replace('<svg ', '<svg class="wordmark-lockup" aria-hidden="true" focusable="false" ', 1)
open('/home/ubuntu/androidscroll/brand/v2/header-lockup-c1.svg', 'w').write(svg)
print('bytes:', len(svg))
print('eyes tagged:', svg.count('class="eye"'))
print('var fills:', svg.count('var(--'))
