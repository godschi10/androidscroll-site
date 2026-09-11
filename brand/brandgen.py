"""AndroidScroll v2 — shared geometry engine (clean final).
Glyphs baked from self-hosted Archivo var (wght 800) -> SVG path data.
Rasterization: ImageMagick convert (internal MSVG renderer, verified).
Robot = square-notch restatement: dome + 2 square eyes + 2 straight antennae.
y-down coordinates; baselines = y of text baseline.
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
try:
    from fontTools.svgLib.path import SVGPathPen
except ImportError:
    from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import RecordingPen
import math
import os

FONT_SRC = '/home/ubuntu/androidscroll/build/public/fonts/archivo-var-latin.woff2'
TTF800 = '/tmp/archivo800.ttf'

if not os.path.exists(TTF800):
    _f0 = TTFont(FONT_SRC)
    instancer.instantiateVariableFont(_f0, {'wght': 800}, inplace=False).save(TTF800)

_F = TTFont(TTF800)
_UPEM = _F['head'].unitsPerEm
_CMAP = _F.getBestCmap()
_HM = _F['hmtx']
_GS = _F.getGlyphSet()
CAP = _F['OS/2'].sCapHeight / _UPEM
XH = _F['OS/2'].sxHeight / _UPEM
TRACK = -0.03

INK = '#10231F'; DEEP = '#006E5E'; TEAL = '#00A88F'; MINT = '#D9F2E8'
CANVAS = '#F7FAF9'; BAND = '#EDF6F3'; DARKBG = '#071512'
INK_D = '#E8F5EF'; TEAL_D = '#00C896'; BAND_D = '#0E2A23'


def _f(v):
    return f'{v:.3f}'.rstrip('0').rstrip('.')


def _fmt(pen_value):
    """format RecordingPen ops -> SVG path d (font units, y-up).
    TrueType quadratic runs (2+ off-curve controls, implied on-curve
    midpoints between consecutive controls) are expanded to one SVG Q
    segment per span. Emitting a raw run as a single Q is INVALID SVG
    (Q takes exactly control+endpoint) and cairosvg drops/garbles the
    path — observed: 'S' (runs up to 9 pts) rendered ~92px ink."""
    out = []
    cur = None
    start = None
    for op, args in pen_value:
        if op == 'moveTo':
            cur = args[0]; start = cur
            out.append('M' + ' '.join(_f(c) for c in cur))
        elif op == 'lineTo':
            cur = args[0]
            out.append('L' + ' '.join(_f(c) for c in cur))
        elif op == 'curveTo':
            out.append('C' + ' '.join(_f(c) for a in args for c in a))
            cur = args[-1]
        elif op == 'qCurveTo':
            pts = [p for p in args]
            end = pts[-1] if pts[-1] is not None else start
            controls = pts[:-1] if pts[-1] is not None else pts
            if not controls:
                out.append('L' + ' '.join(_f(c) for c in end))
                cur = end
                continue
            pending = None
            for c in controls:
                if pending is None:
                    pending = c
                else:
                    mid = ((pending[0] + c[0]) / 2.0,
                           (pending[1] + c[1]) / 2.0)
                    out.append('Q' + ' '.join(_f(v) for v in (*pending, *mid)))
                    pending = c
            out.append('Q' + ' '.join(_f(v) for v in (*pending, *end)))
            cur = end
        elif op == 'closePath':
            out.append('Z')
            cur = start
    return ' '.join(out)


def _subpaths(ch):
    pen = RecordingPen()
    _GS[_CMAP[ord(ch)]].draw(pen)
    subs, cur = [], []
    for op, args in pen.value:
        if op == 'moveTo' and cur:
            subs.append(cur); cur = []
        cur.append((op, args))
    if cur:
        subs.append(cur)
    return subs


def glyph_path(ch):
    return ' '.join(_fmt(s) for s in _subpaths(ch))


def glyph_adv(ch, size):
    return _HM[_CMAP[ord(ch)]][0] / _UPEM * size


def _xform(x, baseline, size):
    s = size / _UPEM
    return f'translate({_f(x)} {_f(baseline)}) scale({_f(s)} {_f(-s)})'


def glyph_svg(ch, x, baseline, size, fill):
    return (f'<path transform="{_xform(x, baseline, size)}" '
            f'd="{glyph_path(ch)}" fill="{fill}"/>')


def glyph_svg_no_tittle(ch, x, baseline, size, fill):
    """Skip subpaths with font-space ymin > 0.56em (the i-dot; font y-up)."""
    keep = [s for s in _subpaths(ch)
            if min(y for op, a in s for y in [p[1] for p in a]) <= 0.56 * _UPEM]
    d = ' '.join(_fmt(s) for s in keep)
    return (f'<path transform="{_xform(x, baseline, size)}" '
            f'd="{d}" fill="{fill}"/>')


def word_layout(text, size):
    out, x = [], 0.0
    for ch in text:
        out.append((ch, x))
        x += glyph_adv(ch, size) + TRACK * size
    return out, x - TRACK * size


def word_svg(text, x0, baseline, size, fill, skip=None, fills=None):
    """Full wordmark as SVG paths.
    skip: str or set of chars to omit (caller draws them another way).
    fills: optional dict {char: fill} for per-glyph override (e.g. two-tone).
    Returns (svg_string, total_width)."""
    sk = set(skip or ())
    items, total = word_layout(text, size)
    parts = []
    for ch, dx in items:
        if ch in sk:
            continue
        f = (fills or {}).get(ch, fill)
        parts.append(glyph_svg(ch, x0 + dx, baseline, size, f))
    return ''.join(parts), total


def head_shapes(cx, base, w, eye_cut=True, mouth_cut=False):
    """Canonical robot head, square-notch style: dome over a body band down to
    `base`, two angled antennae off the shoulders, optional square eye cuts
    (drawn with bg color by shapes_svg cut flag). w = head width, h = body band
    height (= w/2), dome radius = w/2 sitting on the band top."""
    h = w / 2.0
    shapes = []
    for side in (-1, 1):
        shapes.append(stub(cx + side * w * 0.30, base - w - h * 0.05,
                           -90 + side * 40, w * 0.30, w * 0.13))
    shapes.append(dome(cx, base - h, w))
    shapes.append(rect(cx - w / 2, base - h, w, h))
    if eye_cut:
        es = w * 0.17
        ey = base - h * 0.5
        for side in (-1, 1):
            shapes.append(rect(cx + side * w * 0.22 - es / 2, ey - es / 2, es, es, cut=True))
    if mouth_cut:
        shapes.append(rect(cx - w * 0.10, base - h * 0.32, w * 0.20, h * 0.18, cut=True))
    return shapes


# ---------------- robot primitives ----------------
def dome(cx, top, w):
    return {'kind': 'dome', 'cx': cx, 'top': top, 'w': w}


def head(cx, base, w):
    """Merged dome+body (King v2.8: eliminates the AA seam line where two shapes
    met). Tombstone: sides up from base to the centerline, semicircle over."""
    return {'kind': 'head', 'cx': cx, 'base': base, 'w': w}


def rect(x, y, w, h, cut=False):
    return {'kind': 'rect', 'x': x, 'y': y, 'w': w, 'h': h, 'cut': cut}


def circ(cx, cy, r, cut=False):
    """Round eye cut (Android-mascot eyes are circular, not square)."""
    return {'kind': 'circ', 'cx': cx, 'cy': cy, 'r': r, 'cut': cut}


def stub(x, y, angle_deg, ln, t):
    a = math.radians(angle_deg)
    return {'kind': 'stub', 'x': x, 'y': y, 'dx': ln * math.cos(a),
            'dy': ln * math.sin(a), 't': t}


def shape_svg(sh, fill, bg):
    c = bg if sh.get('cut') else fill
    k = sh['kind']
    if k == 'rect':
        return (f'<rect x="{_f(sh["x"])}" y="{_f(sh["y"])}" '
                f'width="{_f(sh["w"])}" height="{_f(sh["h"])}" fill="{c}"/>')
    if k == 'circ':
        return (f'<circle cx="{_f(sh["cx"])}" cy="{_f(sh["cy"])}" '
                f'r="{_f(sh["r"])}" fill="{c}"/>')
    if k == 'dome':
        x0, x1 = sh['cx'] - sh['w'] / 2, sh['cx'] + sh['w'] / 2
        yb = sh['top'] + sh['w'] / 2
        r = _f(sh['w'] / 2)
        return (f'<path d="M{_f(x0)},{_f(yb)} A{r},{r} 0 0 1 {_f(x1)},{_f(yb)} Z" '
                f'fill="{c}"/>')
    if k == 'head':
        x0, x1 = sh['cx'] - sh['w'] / 2, sh['cx'] + sh['w'] / 2
        yb = sh['base'] - sh['w'] / 2
        r = _f(sh['w'] / 2)
        return (f'<path d="M{_f(x0)},{_f(sh["base"])} V{_f(yb)} '
                f'A{r},{r} 0 0 1 {_f(x1)},{_f(yb)} V{_f(sh["base"])} Z" '
                f'fill="{c}"/>')
    if k == 'stub':
        ang = math.atan2(sh['dy'], sh['dx'])
        px, py = math.sin(ang) * sh['t'] / 2, -math.cos(ang) * sh['t'] / 2
        pts = [(sh['x'] - px, sh['y'] - py), (sh['x'] + px, sh['y'] + py),
               (sh['x'] + px + sh['dx'], sh['y'] + py + sh['dy']),
               (sh['x'] - px + sh['dx'], sh['y'] - py + sh['dy'])]
        return ('<polygon points="' + ' '.join(f'{_f(a)},{_f(b)}' for a, b in pts) +
                f'" fill="{c}"/>')
    raise ValueError(k)


def shapes_svg(shapes, fill, bg):
    """cuts last so they bite; antennae stubs first so dome covers roots."""
    solids = [s for s in shapes if not s.get('cut')]
    cuts = [s for s in shapes if s.get('cut')]
    return ''.join(shape_svg(s, fill, bg) for s in solids) + \
           ''.join(shape_svg(s, fill, bg) for s in cuts)


# ---------------- corner-notch tile = EXACT site .mark geometry ----------------
# Header.astro 24-unit paths, mapped linearly onto (x0,y0,s):
#   outer: M4 0 H24 V24 H0 V4 A4 4 0 0 1 4 0 Z
#   inner: M24 10 H14 A4 4 0 0 0 10 14 V24 H16 V17 A1 1 0 0 1 17 16 H24 Z
#   bar:   rect 15 3.5 6 2.4
def notch_tile_svg(x0, y0, s, tile_fill, cut_fill):
    k = s / 24.0
    def P(*pts):
        return ' '.join(f'{_f(x0 + a * k)},{_f(y0 + b * k)}' for a, b in pts)
    r4 = _f(4 * k); r1 = _f(1 * k)
    outer = (f'M {P((4,0))} H {_f(x0 + 24 * k)} V {_f(y0 + 24 * k)} '
             f'H {_f(x0)} V {_f(y0 + 4 * k)} A {r4},{r4} 0 0 1 {P((4,0))} Z')
    inner = (f'M {P((24,10))} H {_f(x0 + 14 * k)} A {r4},{r4} 0 0 0 '
             f'{P((10,14))} V {_f(y0 + 24 * k)} H {_f(x0 + 16 * k)} '
             f'V {_f(y0 + 17 * k)} A {r1},{r1} 0 0 1 {P((17,16))} '
             f'H {_f(x0 + 24 * k)} Z')
    bar = (f'<rect x="{_f(x0 + 15 * k)}" y="{_f(y0 + 3.5 * k)}" '
           f'width="{_f(6 * k)}" height="{_f(2.4 * k)}" fill="{cut_fill}"/>')
    return (f'<path d="{outer}" fill="{tile_fill}"/>'
            f'<path d="{inner}" fill="{cut_fill}"/>' + bar)


def svg_doc(w, h, body, bg=None):
    b = f'<rect width="{_f(w)}" height="{_f(h)}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{_f(w)}" '
            f'height="{_f(h)}" viewBox="0 0 {_f(w)} {_f(h)}">{b}{body}</svg>')


def run_svg(svg, out_png, px_w, px_h):
    # cairosvg renders real SVG semantics; ImageMagick MSVG silently drops arc/path
    # primitives (observed: half the wordmark vanished at 128px renders).
    import cairosvg
    cairosvg.svg2png(bytestring=svg.encode(), write_to=out_png,
                     output_width=px_w, output_height=px_h, background_color='transparent')
