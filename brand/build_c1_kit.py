"""C1 brand kit builder — every format the King asked for, safekeeping set.
Run: python3 build_c1_kit.py  (cwd = brand/v2)
Out: brand/v2/C1-KIT/ + C1-KIT.zip ; prints manifest with sizes."""
import os
import cairosvg
from PIL import Image, ImageDraw

V2 = '/home/ubuntu/androidscroll/brand/v2'
KIT = os.path.join(V2, 'C1-KIT')
INK, DEEP, TEAL = '#10231F', '#006E5E', '#00A88F'
CANVAS, DARKBG = '#F7FAF9', '#071512'
INK_D, TEAL_D = '#E8F5EF', '#00C896'

def svg(kind):
    # kind: lockup-light | lockup-dark | mark | mark-dark | mark-mono | lockup-mono
    if kind == 'lockup-light':
        return open(f'{V2}/concept1.svg').read()
    if kind == 'lockup-dark':
        s = open(f'{V2}/concept1.svg').read()
        # v1.2: light master now carries DEEP (#006E5E) Scroll glyphs; King's order
        # pins dark-mode Scroll to TEAL_D — map DEEP too, don't leak deep-on-dark.
        return s.replace(INK, INK_D).replace(TEAL, TEAL_D).replace(DEEP, TEAL_D)
    if kind == 'mark':
        return open(f'{V2}/concept1-mark.svg').read()
    if kind == 'mark-dark':
        return open(f'{V2}/concept1-mark-dark.svg').read()
    if kind == 'mark-mono':
        s = open(f'{V2}/concept1-mark.svg').read()
        return s.replace(DEEP, '#111111')
    if kind == 'lockup-mono':
        s = open(f'{V2}/concept1.svg').read()
        # v1.2: mono must be single-color — include DEEP in the collapse.
        return s.replace(INK, '#111111').replace(TEAL, '#111111').replace(DEEP, '#111111')
    raise ValueError(kind)

def render(kind, path, w, bg=None):
    s = svg(kind)
    kw = dict(bytestring=s.encode(), write_to=path, output_width=w)
    if bg:
        kw['background_color'] = bg
    else:
        kw['background_color'] = 'transparent'
    cairosvg.svg2png(**kw)

def ensure(d):
    os.makedirs(d, exist_ok=True)

for sub in ('svg', 'png-transparent', 'favicon', 'social', 'backgrounds'):
    ensure(f'{KIT}/{sub}')

# 1) SVG masters (source of truth for everything)
for k, name in (('lockup-light', 'androidscroll-c1-lockup-light.svg'),
                ('lockup-dark', 'androidscroll-c1-lockup-dark.svg'),
                ('mark', 'androidscroll-c1-mark.svg'),
                ('mark-dark', 'androidscroll-c1-mark-dark.svg'),
                ('mark-mono', 'androidscroll-c1-mark-mono-black.svg'),
                ('lockup-mono', 'androidscroll-c1-lockup-mono-black.svg')):
    open(f'{KIT}/svg/{name}', 'w').write(svg(k))

# 2) transparent PNGs (lockup + mark, several widths)
for k, base, widths in (('lockup-light', 'lockup-light', (512, 1024, 2048)),
                        ('lockup-dark', 'lockup-dark', (512, 1024)),
                        ('mark', 'mark', (512, 1024)),
                        ('mark-dark', 'mark-dark', (512,))):
    for w in widths:
        render(k, f'{KIT}/png-transparent/{base}-{w}px.png', w)

# 3) favicon set from the mark (square tile renders)
render('mark', f'{KIT}/favicon/favicon-32.png', 32, bg='transparent')
mark512 = Image.open(f'{KIT}/png-transparent/mark-512px.png')
for size, nm in ((16, 'favicon-16.png'), (32, 'favicon-32.png'),
                 (48, 'favicon-48.png'), (180, 'apple-touch-icon.png'),
                 (192, 'android-chrome-192.png'), (512, 'android-chrome-512.png')):
    im = mark512.resize((size, size), Image.LANCZOS)
    if size == 180:  # apple touch: opaque, deep bg
        bg = Image.new('RGB', (180, 180), DEEP)
        bg.paste(im, (0, 0), im)
        im = bg
    im.save(f'{KIT}/favicon/{nm}')
# favicon.ico multi-size
ico_imgs = [mark512.resize((s, s), Image.LANCZOS) for s in (16, 32, 48)]
ico_imgs[0].save(f'{KIT}/favicon/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)],
                 append_images=ico_imgs[1:])

def paste_center(bg, fg_path, scale=1.0):
    fg = Image.open(fg_path).convert('RGBA')
    w = int(bg.width * scale)
    h = int(fg.height * w / fg.width)
    fg = fg.resize((w, h), Image.LANCZOS)
    bg.paste(fg, ((bg.width - w) // 2, (bg.height - h) // 2), fg)
    return bg

# 4) social
og = Image.new('RGB', (1200, 630), CANVAS)
og = paste_center(og, f'{KIT}/png-transparent/lockup-light-1024px.png', 0.72)
og.save(f'{KIT}/social/og-image-1200x630.png')
ogd = Image.new('RGB', (1200, 630), DARKBG)
ogd = paste_center(ogd, f'{KIT}/png-transparent/lockup-dark-1024px.png', 0.72)
ogd.save(f'{KIT}/social/og-image-dark-1200x630.png')
# profile avatar (circle-safe: mark centered at 70%)
prof = Image.new('RGB', (800, 800), DEEP)
prof = paste_center(prof, f'{KIT}/png-transparent/mark-512px.png', 0.66)
prof.save(f'{KIT}/social/profile-800x800.png')
# banner 1500x500
ban = Image.new('RGB', (1500, 500), CANVAS)
ban = paste_center(ban, f'{KIT}/png-transparent/lockup-light-1024px.png', 0.55)
ban.save(f'{KIT}/social/banner-1500x500.png')
band = Image.new('RGB', (1500, 500), DARKBG)
band = paste_center(band, f'{KIT}/png-transparent/lockup-dark-1024px.png', 0.55)
band.save(f'{KIT}/social/banner-dark-1500x500.png')

# 5) backgrounds (solid brand fields for anything)
Image.new('RGB', (1920, 1080), DEEP).save(f'{KIT}/backgrounds/deep-1920x1080.png')
Image.new('RGB', (1920, 1080), CANVAS).save(f'{KIT}/backgrounds/canvas-light-1920x1080.png')
Image.new('RGB', (1920, 1080), DARKBG).save(f'{KIT}/backgrounds/dark-1920x1080.png')
Image.new('RGB', (1080, 1920), DEEP).save(f'{KIT}/backgrounds/deep-story-1080x1920.png')

# manifest of the kit
print('=== C1-KIT manifest ===')
total = 0
for root, _, files in os.walk(KIT):
    for f in sorted(files):
        p = os.path.join(root, f)
        sz = os.path.getsize(p)
        total += sz
        im_note = ''
        if f.endswith(('.png', '.ico')):
            try:
                im = Image.open(p)
                im_note = f' {im.size} {im.mode}'
            except Exception:
                pass
        print(f'{os.path.relpath(p, KIT)}  {sz}B{im_note}')
print(f'TOTAL {total}B in {KIT}')
