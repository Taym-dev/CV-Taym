"""
Generates the keycap legend atlas, the keyboard layout and the boot screen image.

Run with the normal system Python (needs Pillow) before the Blender script:
  python3 blender/make_textures.py

Outputs in blender/build/:
  keycaps.png       atlas with one cell per key (key colour + printed legend)
  keyboard.json     layout: position, width and atlas rectangle of every key
  screen.png        amber boot screen shown on the CRT in the preview renders
"""

import json
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, "build")
os.makedirs(BUILD, exist_ok=True)
random.seed(86)

# Layout ------------------------------------------------------------------------
# (legend, width in key units, kind). kind "gap" is empty space.
# A legend with "\n" prints two characters stacked, like on real number keys.

A, M, G = "alpha", "mod", "gap"
ROWS = [
    [("Esc", 1, M), ("", 1, G), ("F1", 1, M), ("F2", 1, M), ("F3", 1, M), ("F4", 1, M), ("", 0.5, G),
     ("F5", 1, M), ("F6", 1, M), ("F7", 1, M), ("F8", 1, M), ("", 0.5, G),
     ("F9", 1, M), ("F10", 1, M), ("F11", 1, M), ("F12", 1, M)],
    [("~\n`", 1, A), ("!\n1", 1, A), ("@\n2", 1, A), ("#\n3", 1, A), ("$\n4", 1, A), ("%\n5", 1, A),
     ("^\n6", 1, A), ("&\n7", 1, A), ("*\n8", 1, A), ("(\n9", 1, A), (")\n0", 1, A), ("_\n-", 1, A),
     ("+\n=", 1, A), ("Backspace", 2, M)],
    [("Tab", 1.5, M)] + [(c, 1, A) for c in "QWERTYUIOP"] + [("{\n[", 1, A), ("}\n]", 1, A), ("|\n\\", 1.5, A)],
    [("Caps Lock", 1.75, M)] + [(c, 1, A) for c in "ASDFGHJKL"] + [(":\n;", 1, A), ('"\n\'', 1, A), ("Enter", 2.25, M)],
    [("Shift", 2.25, M)] + [(c, 1, A) for c in "ZXCVBNM"] + [("<\n,", 1, A), (">\n.", 1, A), ("?\n/", 1, A), ("Shift", 2.75, M)],
    [("Ctrl", 1.5, M), ("Alt", 1.5, M), ("", 9, A), ("Alt", 1.5, M), ("Ctrl", 1.5, M)],
]

# Numeric keypad to the right of the main block, half a key apart.
NUMPAD = [
    [],
    [("", 0.5, G), ("Num", 1, M), ("/", 1, M), ("*", 1, M), ("-", 1, M)],
    [("", 0.5, G), ("7", 1, A), ("8", 1, A), ("9", 1, A), ("+", 1, M)],
    [("", 0.5, G), ("4", 1, A), ("5", 1, A), ("6", 1, A), (",", 1, M)],
    [("", 0.5, G), ("1", 1, A), ("2", 1, A), ("3", 1, A), ("Enter", 1, M)],
    [("", 0.5, G), ("0", 2, A), (".", 1, A), ("Enter", 1, M)],
]
ROWS = [row + pad for row, pad in zip(ROWS, NUMPAD)]
TOTAL_UNITS = 19.5

# Row centre in key units, measured from the middle of the key block (positive = towards the back).
ROW_Y = [2.75, 1.25, 0.25, -0.75, -1.75, -2.75]

# Atlas -------------------------------------------------------------------------

CELL = 128  # pixels per key unit
MARGIN = 12
W, H = 2048, 1024  # 71 + 21 keys still fit in 7 atlas rows

ALPHA_RGB = (220, 216, 205)
MOD_RGB = (166, 164, 158)
INK = (34, 31, 27)

FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"
font_big = ImageFont.truetype(FONT_PATH, 44, index=1)
font_mid = ImageFont.truetype(FONT_PATH, 32, index=1)
font_small = ImageFont.truetype(FONT_PATH, 24, index=1)

atlas = Image.new("RGB", (W, H), ALPHA_RGB)
draw = ImageDraw.Draw(atlas)


def grain(img, box, strength):
    """Fine speckle so the caps do not look like flat CG colour."""
    x0, y0, x1, y1 = box
    px = img.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            n = random.randint(-strength, strength)
            r, g, b = px[x, y]
            px[x, y] = (r + n, g + n, b + n)


keys = []
ax, ay = 0, 0
for r, row in enumerate(ROWS):
    x_units = -TOTAL_UNITS / 2
    for legend, w, kind in row:
        if kind == G:
            x_units += w
            continue
        cw = round(w * CELL)
        if ax + cw > W:
            ax, ay = 0, ay + CELL
        base = ALPHA_RGB if kind == A else MOD_RGB
        # Every cap aged a little differently.
        shift = random.randint(-6, 4)
        colour = (base[0] + shift, base[1] + shift, base[2] + shift - random.randint(0, 6))
        draw.rectangle([ax, ay, ax + cw - 1, ay + CELL - 1], fill=colour)

        ix0, iy0 = ax + MARGIN, ay + MARGIN
        ix1, iy1 = ax + cw - MARGIN, ay + CELL - MARGIN
        # Legends sit in the upper left, like on most keyboards from that era.
        tx, ty = ix0 + 14, iy0 + 12
        if "\n" in legend:
            top, bottom = legend.split("\n")
            draw.text((tx, ty - 2), top, font=font_mid, fill=INK)
            draw.text((tx, ty + 46), bottom, font=font_mid, fill=INK)
        elif len(legend) == 1:
            draw.text((tx, ty), legend, font=font_big, fill=INK)
        elif legend.startswith("F") and len(legend) <= 3:
            draw.text((tx, ty), legend, font=font_mid, fill=INK)
        elif legend:
            draw.text((tx, iy1 - 40), legend, font=font_small, fill=INK)

        keys.append({
            "legend": legend,
            "width": w,
            "kind": kind,
            "row": r,
            "x": x_units + w / 2,
            "y": ROW_Y[r],
            # UV rectangle (Blender convention, origin bottom left) for the top of the cap.
            "uv": [ix0 / W, 1 - iy1 / H, ix1 / W, 1 - iy0 / H],
            # One point in the cell margin, used for the sides of the cap.
            "side_uv": [(ax + MARGIN / 2) / W, 1 - (ay + MARGIN / 2) / H],
        })
        ax += cw
        x_units += w

grain(atlas, (0, 0, W, ay + CELL), 4)
# Ink is never perfectly sharp on a worn cap.
atlas = atlas.filter(ImageFilter.GaussianBlur(0.4))
atlas.save(os.path.join(BUILD, "keycaps.png"))

with open(os.path.join(BUILD, "keyboard.json"), "w") as f:
    json.dump({"rows": len(ROWS), "keys": keys}, f, indent=1)

# Boot screen: green phosphor CRT -------------------------------------------------
# Built in layers: sharp text, two bloom passes, phosphor haze, scanlines,
# a soft vignette and a little noise. The website redoes this live in a shader.

from PIL import ImageChops

SW, SH = 1024, 768
PHOSPHOR = (170, 255, 185)
mono = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 34)
lines = [
    "TA-86 BIOS  v1.04",
    "Geheugen test ..... 640K OK",
    "",
    "C:\\> dir",
    "PORTFOLIO EXE     86.420  24-11-26",
    "",
    "C:\\> start portfolio.exe",
]
text = Image.new("RGB", (SW, SH), (0, 0, 0))
d = ImageDraw.Draw(text)
for i, line in enumerate(lines):
    d.text((92, 118 + i * 54), line, font=mono, fill=PHOSPHOR)
# Block cursor after the command.
cx = 92 + int(d.textlength(lines[-1] + " ", font=mono))
d.rectangle([cx, 118 + 6 * 54 + 6, cx + 20, 118 + 6 * 54 + 40], fill=PHOSPHOR)

near = text.filter(ImageFilter.GaussianBlur(2.5))
far = text.filter(ImageFilter.GaussianBlur(16))
screen = ImageChops.add(text, ImageChops.multiply(near, Image.new("RGB", (SW, SH), (230, 230, 230))))
screen = ImageChops.add(screen, ImageChops.multiply(far, Image.new("RGB", (SW, SH), (150, 150, 150))))
screen = ImageChops.add(screen, ImageChops.multiply(far.filter(ImageFilter.GaussianBlur(30)), Image.new("RGB", (SW, SH), (110, 110, 110))))

# Phosphor never goes fully black: faint green haze, brightest in the middle.
haze = Image.new("L", (SW, SH), 0)
hd = ImageDraw.Draw(haze)
for i in range(40):
    t = i / 40
    hd.ellipse([SW * t * 0.5 - 80, SH * t * 0.5 - 80, SW - SW * t * 0.5 + 80, SH - SH * t * 0.5 + 80], fill=int(0 + 4 * t))
haze = haze.filter(ImageFilter.GaussianBlur(60))
screen = ImageChops.add(screen, Image.merge("RGB", (haze.point(lambda v: v // 4), haze, haze.point(lambda v: v // 2))))

screen = screen.resize((1600, 1200), Image.LANCZOS)
SW, SH = 1600, 1200

# Scanlines: coarse enough to read in a render, like a low resolution tube.
lines_mask = Image.new("RGB", (SW, SH), (255, 255, 255))
ld = ImageDraw.Draw(lines_mask)
for y in range(0, SH, 12):
    for dy, v in ((0, 30), (1, 30), (2, 45), (3, 80), (4, 140), (5, 200), (11, 200)):
        ld.line([(0, y + dy), (SW, y + dy)], fill=(v, v, v))
screen = ImageChops.multiply(screen, lines_mask)

# Rolling refresh band: a soft brighter strip across the tube.
band = Image.new("L", (SW, SH), 0)
ImageDraw.Draw(band).rectangle([0, int(SH * 0.58), SW, int(SH * 0.66)], fill=26)
band = band.filter(ImageFilter.GaussianBlur(40))
screen = ImageChops.add(screen, Image.merge("RGB", (band.point(lambda v: v // 3), band, band.point(lambda v: v // 2))))

# Aperture grille: thin vertical red, green and blue phosphor stripes.
grille = Image.new("RGB", (SW, SH))
gd = ImageDraw.Draw(grille)
for x in range(SW):
    gd.line([(x, 0), (x, SH)], fill=((255, 205, 205), (205, 255, 205), (205, 205, 255))[x % 3])
screen = ImageChops.multiply(screen, grille)

# Vignette: corners of a CRT tube fall off.
vig = Image.new("L", (SW, SH), 0)
vd = ImageDraw.Draw(vig)
vd.rounded_rectangle([90, 75, SW - 90, SH - 75], radius=220, fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(110))
screen = ImageChops.multiply(screen, Image.merge("RGB", (vig, vig, vig)))

noise = Image.effect_noise((SW, SH), 18).convert("RGB")
screen = ImageChops.add(screen, ImageChops.multiply(noise, Image.new("RGB", (SW, SH), (6, 10, 7))))
screen.save(os.path.join(BUILD, "screen.png"))
print("keys:", len(keys), "atlas rows used:", ay // CELL + 1)
