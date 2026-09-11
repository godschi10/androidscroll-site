"""v1.2 gate: C1 @1400px white bg (cairosvg).
1. column-ink scan: no white gap >25px inside wordmark span
2. all 13 glyph slots >300 ink (per-glyph table)
3. eye roundness (pixels): eye-center paper (>235), bbox diagonal corners ink (<150), both eyes
4. COLOR PROOF (King's order): dominant chromatic cluster in Scroll half ~ (0,110,94)+-25 DEEP;
   ZERO bright-teal (0,168,143)+-25 anywhere; Android half zero green-dominant pixels.
"""
import sys
sys.path.insert(0, '/home/ubuntu/androidscroll/brand/v2')
import cairosvg
from PIL import Image
from build_concepts import WORD, SIZE, BASE, word_layout, c1_shapes
from brandgen import glyph_adv

V2 = '/home/ubuntu/androidscroll/brand/v2'
DEEP = (0, 110, 94)       # #006E5E — King's order Scroll fill (light)
BRIGHT_TEAL = (0, 168, 143)  # #00A88F — must appear NOWHERE
N_AND = 7                 # slots 0-6 Android, 7-12 Scroll

svg = open(f'{V2}/concept1.svg').read()
cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{V2}/concept1_GATE1400.png',
                 output_width=1400, background_color='white')
im = Image.open(f'{V2}/concept1_GATE1400.png').convert('RGB')
W, H = im.size
px = im.load()
print(f'canvas {W}x{H}')

# ---- 1. column-ink scan (luminance ink test, full columns) ----
lum = lambda r, g, b: 0.299 * r + 0.587 * g + 0.114 * b
ink_col = [sum(1 for y in range(H) if lum(*px[x, y][:3]) < 200) for x in range(W)]
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
maxgap = max(gaps) if gaps else 0
print(f'span x=[{x0},{x1}] maxgap={maxgap} gaps>25: {[g for g in gaps if g > 25]}')

# ---- 2. per-glyph ink table ----
items, total = word_layout(WORD, SIZE)
scale = 1400.0 / (total + 8)
ox = 4 * scale
tbl, slot_x = [], []
ok = True
for ch, dx in items:
    ax0 = int(ox + dx * scale)
    ax1 = int(ox + (dx + glyph_adv(ch, SIZE)) * scale)
    n = sum(ink_col[x] for x in range(max(0, ax0), min(W, ax1)))
    tbl.append(f'{ch}:{n}')
    slot_x.append((ax0, ax1))
    if n <= 300:
        ok = False
print('per-glyph:', ' '.join(tbl))
print('ALL>300:', ok)

# ---- 3. eye roundness (pixel test) ----
a_slot = glyph_adv('A', SIZE)
eyes = [s for s in c1_shapes(a_slot / 2, BASE, a_slot * 0.94)
        if 'cx' in s and s.get('cut')]
print(f'eye circles found: {len(eyes)}')
eye_ok = True
for k, e in enumerate(eyes, 1):
    ex = (4 + e['cx']) * scale
    ey = e['cy'] * scale
    r = e['r'] * scale
    cx_i, cy_i = int(round(ex)), int(round(ey))
    cRGB = px[cx_i, cy_i]
    cL = lum(*cRGB[:3])
    corners = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            qx, qy = int(round(ex + sx * r)), int(round(ey + sy * r))
            corners.append(lum(*px[qx, qy][:3]))
    c_ok = cL > 235
    k_ok = all(v < 150 for v in corners)
    eye_ok = eye_ok and c_ok and k_ok
    print(f'  eye{k}: center=({cx_i},{cy_i}) RGB={cRGB[:3]} lum={cL:.0f} paper>235: {c_ok}'
          f' | corners lum={[int(v) for v in corners]} ink<150: {k_ok}')

# ---- 4. color proof ----
def near(p, ref, tol=25):
    return all(abs(p[i] - ref[i]) <= tol for i in range(3))

scroll_rng = (slot_x[N_AND][0], slot_x[-1][1])
android_rng = (slot_x[0][0], slot_x[N_AND - 1][1])
deep_cnt = teal_cnt = 0
cluster = {}
green_android = 0
for x in range(W):
    for y in range(H):
        p = px[x, y][:3]
        mx, mn = max(p), min(p)
        chromatic = (mx - mn) > 30
        if near(p, BRIGHT_TEAL):
            teal_cnt += 1
        if scroll_rng[0] <= x <= scroll_rng[1]:
            if chromatic:
                if near(p, DEEP):
                    deep_cnt += 1
                b = tuple(v // 16 for v in p)
                cluster[b] = cluster.get(b, 0) + 1
        if android_rng[0] <= x <= android_rng[1]:
            if chromatic and p[1] == mx:
                green_android += 1
# dominant chromatic cluster mean in Scroll half
best, best_n = None, 0
for b, n in cluster.items():
    if n > best_n:
        best, best_n = b, n
mean = tuple(int(best[i] * 16 + 8) for i in range(3)) if best else None
print(f'Scroll half x={scroll_rng}: DEEP(+-25) px={deep_cnt} | dominant cluster bucket'
      f' {best} n={best_n} mean~{mean} within DEEP+-25: {near(mean, DEEP) if mean else False}')
print(f'BRIGHT TEAL (0,168,143)+-25 anywhere: {teal_cnt} (must be 0)')
print(f'Android half x={android_rng}: green-dominant chromatic px={green_android} (must be 0)')

color_ok = (deep_cnt > 0 and near(mean, DEEP) and best_n >= deep_cnt * 0.5
            and teal_cnt == 0 and green_android == 0)
gate = maxgap <= 25 and ok and eye_ok and len(eyes) == 2 and color_ok
print('EYES ROUND:', eye_ok)
print('COLOR PROOF:', color_ok)
print('GATE:', 'PASS' if gate else 'FAIL')
