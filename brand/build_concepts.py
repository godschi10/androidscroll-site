"""Build AndroidScroll v2 concept SVG masters + all PIL/convert mocks.
Usage: python3 build_concepts.py
Outputs: concept{1,2,3}.svg, concept{1,2,3}-mark.svg, and 15 mock PNGs.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brandgen import (word_layout, glyph_svg, word_svg, dome, head, rect, circ, stub,
                      head_shapes, shapes_svg, notch_tile_svg, svg_doc,
                      run_svg, _f, INK, DEEP, TEAL, MINT, CANVAS, DARKBG,
                      INK_D, TEAL_D, BAND, BAND_D)
from PIL import Image, ImageDraw

V2 = '/home/ubuntu/androidscroll/brand/v2'
SIZE = 100          # design em-size for lockups
BASE = 86           # baseline y in lockup space (cap-top 17.4)
WORD = 'AndroidScroll'


def variants(mode):
    """fill scheme per header mode."""
    if mode == 'light':
        return dict(ink=INK, teal=TEAL, tile=DEEP, cut=CANVAS, dome=TEAL)
    return dict(ink=INK_D, teal=TEAL_D, tile=TEAL_D, cut=DARKBG, dome=MINT)


# ------------------------------------------------------------------ C1 robot-A
def c1_head(x0, y, w, v, scale=1.0, favicon=False):
    """Robot head shaped as an 'A' (tombstone arch + square eyes + counter).
    x0,y = slot left / baseline. All in lockup units (size100)."""
    ww = w * scale
    cx = x0 + ww / 2
    dome_top = y - (ww * 0.5 + y * 0)  # computed by caller; here direct:
    return None  # not used; see c1_shapes


def c1_shapes(cx, base, w, eye_cut=True):
    h = w / 2.0
    top = base - w - 0  # arch: dome top such that flat side at base - (w - h)
    flat = base - (w - h)
    shapes = []
    # antennae off the arch shoulders
    for side in (-1, 1):
        shapes.append(stub(cx + side * w * 0.30, flat - h * 0.55,
                           -90 + side * 40, w * 0.30, w * 0.13))
    shapes.append(head(cx, base, w))  # v2.8: merged dome+body — no AA seam line
    if eye_cut:
        es = w * 0.17
        ey = base - w + h * 0.55
        for side in (-1, 1):
            shapes.append(circ(cx + side * w * 0.22, ey, es / 2, cut=True))
        # A counter between feet (overshoots the baseline by 0.5u so its bottom
        # edge never coincides with the body edge — kills the seam, King v2.8)
        shapes.append(rect(cx - w * 0.19, base - h * 0.62, w * 0.38, h * 0.62 + 0.5, cut=True))
    return shapes


def build_c1(mode):
    v = variants(mode)
    items, total = word_layout(WORD, SIZE)
    parts = []
    # wordmark minus the 'A'
    body, _ = word_svg(WORD, 0, BASE, SIZE, v['ink'], skip=None)
    # rebuild: skip 'A' then draw robot-A
    parts2 = []
    x = 0.0
    offs = {i: dx for i, (c, dx) in enumerate(items)}
    a_adv = total and None
    # word SVG without first A glyph
    itemsA, _ = items[0][0], None
    # simpler: draw each char except index0 'A' in ink; but Scroll half is teal
    n_and = 7  # 'Android'
    for i, (c, dx) in enumerate(items):
        # v1.2 King's order: 'Android' (idx 1-6) INK, 'Scroll' (idx 7-12) DEEP
        # #006E5E in light mode. Use the DEEP constant explicitly — v['tile']
        # happens to equal DEEP in light mode, but the spec pins Scroll to the
        # literal deep-brand-green, not to "whatever the tile is". Dark mode is
        # UNCHANGED from v1.0 (Android INK_D, Scroll TEAL_D via v['teal']).
        if i == 0:
            continue
        if mode == 'light':
            fill = v['ink'] if i < n_and else DEEP
        else:
            fill = v['ink'] if i < n_and else v['teal']
        parts2.append(glyph_svg(c, dx, BASE, SIZE, fill))
    a_adv_w = glyph_svg('A', 0, 0, 0, '') and None
    from brandgen import glyph_adv
    a_slot = glyph_adv('A', SIZE)
    cx = a_slot / 2
    parts2.append(shapes_svg(c1_shapes(cx, BASE, a_slot * 0.94), v['ink'], v['cut']))
    body = ''.join(parts2)
    w = total
    return svg_doc(w + 8, 100, f'<g transform="translate(4,0)">{body}</g>'), w, v


def build_c1_mark(v):
    """favicon tile: deep rounded square + canvas robot head."""
    s = 120
    cx = 60
    w = 74
    base = 96
    outer = (f'M{_f(12 + 20)},{_f(8)} H112 V112 H8 V28 A20,20 0 0 1 28,8 Z')
    body = (f'<path d="{outer}" fill="{v["tile"]}"/>' +
            shapes_svg(c1_shapes(cx, base, w), v['cut'], v['tile']))
    return svg_doc(s, s, body)


# ------------------------------------------------------------------ C2 fused
def c2_mark_body(v, s=120):
    """notch tile + robot dome/antennae rising from its top edge."""
    tile_x, tile_y, ts = 18, 34, 84
    body = notch_tile_svg(tile_x, tile_y, ts, v['tile'], v['cut'])
    cx = tile_x + ts / 2
    dw = 44
    shapes = []
    for side in (-1, 1):
        shapes.append(stub(cx + side * dw * 0.24, tile_y - dw * 0.5 + 4,
                           -90 + side * 42, dw * 0.30, dw * 0.16))
    shapes.append(dome(cx, tile_y - dw / 2, dw))
    es = dw * 0.19
    for side in (-1, 1):
        shapes.append(rect(cx + side * dw * 0.24 - es / 2,
                           tile_y - es / 2 - es, es, es, cut=True))
    body += shapes_svg(shapes, v['dome'], v['cut'])
    return body


def build_c2(mode):
    v = variants(mode)
    body = c2_mark_body(v)
    items, total = word_layout(WORD, SIZE)
    n_and = 7
    for i, (c, dx) in enumerate(items):
        fill = v['ink'] if i < n_and else v['teal']
        body += glyph_svg(c, dx, BASE, SIZE, fill)
    W = total + 150
    return svg_doc(W, 120,
                   f'<g transform="translate(0,16)">{body.replace("</svg>","")}</g>'), total, v


def build_c2_mark(v):
    return svg_doc(120, 120, c2_mark_body(v))


# ------------------------------------------------------------------ C3 i-robot
def c3_i_robot(cx, v, size=SIZE):
    """robot dome-as-tittle over the i stem; returns svg fragment."""
    w = 34
    base_flat = BASE - 55.0   # just above x-height stem top (BASE-52.6)
    shapes = []
    for side in (-1, 1):
        shapes.append(stub(cx + side * w * 0.22, base_flat - w * 0.5 + 3,
                           -90 + side * 42, w * 0.28, w * 0.15))
    shapes.append(dome(cx, base_flat - w / 2, w))
    es = w * 0.20
    for side in (-1, 1):
        shapes.append(rect(cx + side * w * 0.23 - es / 2,
                           base_flat - w * 0.28 - es / 2, es, es, cut=True))
    return shapes_svg(shapes, v['teal'], v['cut'])


def build_c3(mode):
    v = variants(mode)
    items, total = word_layout(WORD, SIZE)
    n_and = 7
    body = ''
    for i, (c, dx) in enumerate(items):
        fill = v['ink'] if i < n_and else v['teal']
        body += glyph_svg(c, dx, BASE, SIZE, fill)
    ix = items[5][1]  # 'i' offset in Android
    from brandgen import glyph_adv
    cx = ix + glyph_adv('i', SIZE) / 2
    body += c3_i_robot(cx, v)
    return svg_doc(total + 8, 100, f'<g transform="translate(4,0)">{body}</g>'), total, v


def build_c3_mark(v):
    """notch tile abstract face: bar cut + eye cuts + antenna tip dots above."""
    s = 120
    body = notch_tile_svg(8, 8, 104, v['tile'], v['cut'])
    es = 16
    for side in (-1, 1):
        x = 60 + side * 26 - es / 2
        body += f'<rect x="{_f(x)}" y="{_f(30)}" width="{es}" height="{es}" fill="{v["cut"]}"/>'
    for side in (-1, 1):
        x = 60 + side * 34 - 6
        body += f'<rect x="{_f(x)}" y="0" width="12" height="12" fill="{v["dome"]}"/>'
    return svg_doc(s, s, body)


# ------------------------------------------------------------------ rasterize
def r(svg, path, px):
    run_svg(svg, path, px, px)


def header_mock(name, mode, compose):
    W, H = 390, 54
    bg = CANVAS if mode == 'light' else DARKBG
    img = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(img)
    compose(img, d, mode)
    img.save(os.path.join(V2, name))
    return img


def icon_squares(d, mode, x0=234, size=36, gap=6):
    band = BAND if mode == 'light' else BAND_D
    col = '#52635F' if mode == 'light' else '#B6CCC6'
    for i in range(3):
        x = x0 + i * (size + gap)
        d.rounded_rectangle([x, (54 - size) // 2, x + size, (54 - size) // 2 + size],
                            radius=8, fill=band)
        cx, cy = x + size / 2, 27
        if i == 0:
            for k, yy in enumerate((21, 27, 33)):
                d.line([(cx - 7, yy), (cx + 7 - (4 if k == 2 else 0), yy)], fill=col, width=3)
        elif i == 1:
            d.ellipse([cx - 8, cy - 8, cx + 4, cy + 4], outline=col, width=3)
            d.line([(cx + 4, cy + 2), (cx + 9, cy + 8)], fill=col, width=3)
        else:
            d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], outline=col, width=3)


def word_png(v_mode, size_px, color_mode, concept):
    """rasterize the concept wordmark+mark strip at height scale size_px
    (size_px = font-size equivalent). Returns RGBA image."""
    builders = {'1': build_c1, '2': build_c2, '3': build_c3}
    svg, total, v = builders[concept](color_mode)
    # height of content box = 100 units -> scale so text (size 100u) -> size_px
    px_w = int(round((total + 150 if concept == '2' else total + 8) * size_px / SIZE))
    px_h = int(round(100 * size_px / SIZE if concept != '2' else 120 * size_px / 100))
    tmp = os.path.join(V2, f'_tmp_{concept}_{color_mode}.svg')
    with open(tmp, 'w') as fh:
        fh.write(svg)
    out = tmp.replace('.svg', '.png')
    from brandgen import run_svg
    run_svg(svg, out, px_w, px_h)
    im = Image.open(out).convert('RGBA')
    os.remove(tmp); os.remove(out)
    return im


def place(img, d, im, x, base_y, em_px, concept):
    """paste rasterized wordmark (word_png already sizes it to em_px;
    no rescaling here) with baseline at base_y."""
    w, h = im.width, im.height
    full = 120 if concept == '2' else 100
    base_off = (86 + 16) if concept == '2' else 86
    y = int(base_y - h * base_off / full)
    img.paste(im, (x, y), im)
    return x + w


# ------------------------------------------------------------- build all
def main():
    # ---- master SVGs (deliverables) ----
    for c, b in (('1', build_c1), ('2', build_c2), ('3', build_c3)):
        svg, total, v = b('light')
        open(os.path.join(V2, f'concept{c}.svg'), 'w').write(svg)
    for c, fn in (('1', build_c1_mark), ('2', build_c2_mark), ('3', build_c3_mark)):
        v = variants('light')
        open(os.path.join(V2, f'concept{c}-mark.svg'), 'w').write(fn(v))
        vd = variants('dark')
        open(os.path.join(V2, f'concept{c}-mark-dark.svg'), 'w').write(fn(vd))

    # ---- favicons (32) + enlarged pixel-test card ----
    marks = {'1': build_c1_mark, '2': build_c2_mark, '3': build_c3_mark}
    for c, fn in marks.items():
        svg = fn(variants('light'))
        p32 = os.path.join(V2, f'_fav{c}.png')
        run_svg(svg, p32, 32, 32)
        big = os.path.join(V2, f'_fav{c}96.png')
        run_svg(svg, big, 96, 96)
        im32 = Image.open(p32).convert('RGBA')
        im96 = Image.open(big).convert('RGBA').resize((64, 64), Image.NEAREST)
        card = Image.new('RGBA', (128, 72), (255, 255, 255, 255))
        card.paste(Image.new('RGBA', (16, 16), (240, 240, 240, 255)), (0, 0))
        card.alpha_composite(im32, (2, 18))
        card.alpha_composite(im96, (48, 4))
        d = ImageDraw.Draw(card)
        d.text((4, 54), '32px  |  4x pixels', fill=(120, 120, 120, 255))
        card.convert('RGB').save(os.path.join(V2, f'concept{c}-favicon.png'))
        os.remove(p32); os.remove(big)

    # ---- PWA 512 + circle-crop check ----
    for c, fn in marks.items():
        svg = fn(variants('dark'))
        mp = os.path.join(V2, f'_pwa{c}.png')
        run_svg(svg, mp, 300, 300)
        im = Image.new('RGBA', (512, 512), DEEP)
        m = Image.open(mp).convert('RGBA')
        im.alpha_composite(m, (106, 106))
        im.convert('RGB').save(os.path.join(V2, f'concept{c}-pwa.png'))
        # circle-crop check: keep only inscribed circle -> nothing may vanish
        mask = Image.new('L', (512, 512), 0)
        ImageDraw.Draw(mask).ellipse([51, 51, 461, 461], fill=255)  # 80% safe zone
        circ = im.convert('RGB').copy()
        circ.putalpha(mask)
        # diff: mark bbox must lie inside circle
        bb = m.getbbox()
        outside = 0
        px = m.load()
        cx0, cy0 = 256 - 150, 256 - 150
        for yy in range(bb[1], bb[3]):
            for xx in range(bb[0], bb[2]):
                if px[xx, yy][3] > 10:
                    dx, dy = xx + cx0 - 256, yy + cy0 - 256
                    if (dx * dx + dy * dy) > 205 * 205:
                        outside += 1
        print(f'C{c} pwa mark bbox {bb} outside-80%circle px: {outside}')
        os.remove(mp)

    # ---- headers ----
    def compose_generic(concept, mode):
        def fn(img, d, mode=mode):
            im = word_png(mode, 24, mode, concept)
            place(img, d, im, 16, 34, 24, concept)
            icon_squares(d, mode)
        return fn
    for c in '123':
        header_mock(f'concept{c}-header-light.png', 'light', compose_generic(c, 'light'))
        header_mock(f'concept{c}-header-dark.png', 'dark', compose_generic(c, 'dark'))

    # ---- lockup 1400 hero ----
    for c in '123':
        img = Image.new('RGB', (1400, 420), CANVAS)
        d = ImageDraw.Draw(img)
        im = word_png('light', 96, 'light', c)
        w, h = im.width, im.height
        im2 = im
        img.paste(im2, ((1400 - w) // 2, (420 - h) // 2 - 14), im2)
        d.rectangle([(1400 - w) // 2, (420 + h) // 2 + 18,
                     (1400 + w) // 2, (420 + h) // 2 + 20], fill=TEAL)
        img.save(os.path.join(V2, f'concept{c}-lockup.png'))
    print('build done')


if __name__ == '__main__':
    main()
