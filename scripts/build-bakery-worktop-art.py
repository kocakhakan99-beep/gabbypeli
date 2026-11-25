"""Render reusable top-view bakery layers (requires Pillow)."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw

SETS = Path(__file__).resolve().parents[1] / "assets/gabby/bakery/sets"
PALETTES = {
    "cookie": ("#b74276", "#f58db0"),
    "cupcake": ("#a6459b", "#efa9d6"),
    "bun": ("#a1633e", "#efb17f"),
    "tart": ("#7151a0", "#b994e2"),
}


def blank():
    return Image.new("RGBA", (320, 320))


def save(image, set_name, name):
    image.save(SETS / set_name / f"{name}.webp", lossless=True)


for name, (shade, light) in PALETTES.items():
    bowl = blank()
    draw = ImageDraw.Draw(bowl)
    draw.rounded_rectangle((43, 17, 103, 100), 20, fill=shade)
    draw.rounded_rectangle((217, 17, 277, 100), 20, fill=shade)
    draw.rounded_rectangle((49, 22, 98, 96), 17, fill=light)
    draw.rounded_rectangle((222, 22, 271, 96), 17, fill=light)
    draw.ellipse((17, 37, 303, 304), fill=shade)
    draw.ellipse((20, 27, 300, 293), fill=light)
    draw.ellipse((33, 40, 287, 280), fill="#fff1d9")
    for depth in range(20):
        color = (206 + depth, 145 + 3 * depth, 113 + 3 * depth)
        draw.ellipse((40 + depth, 46 + depth, 280 - depth, 272 - depth), fill=color)
    draw.arc((22, 29, 298, 290), 192, 336, fill="#ffd7ed", width=5)
    save(bowl, name, "bowl-overhead")

    spoon = Image.new("RGBA", (84, 254))
    draw = ImageDraw.Draw(spoon)
    draw.rounded_rectangle((31, 3, 55, 173), radius=11, fill="#a96a39")
    draw.rounded_rectangle((33, 3, 53, 171), radius=10, fill="#e6ad6a")
    for x in (38, 44, 48):
        draw.line((x, 15, x - 1, 139), fill="#dda066", width=2)
    draw.ellipse((5, 142, 80, 249), fill="#a66a43")
    draw.ellipse((6, 140, 78, 243), fill="#edb67a")
    draw.ellipse((15, 150, 69, 232), fill="#cf9157")
    draw.ellipse((22, 158, 66, 231), fill="#dda368")
    draw.arc((13, 146, 70, 235), 132, 300, fill="#f8cf91", width=3)
    draw.rounded_rectangle((33, 5, 53, 35), radius=8, fill=shade)
    draw.line((38, 11, 38, 28), fill=light, width=2)
    save(spoon, name, "spoon-overhead")

# Low-contrast maple pores and planks, shared by the kitchen's work surfaces.
rng = random.Random(42)
width, height = 720, 520
maple = Image.new("RGB", (width, height))
pixels = maple.load()
fibres = [rng.uniform(-5, 5) for _ in range(height)]
for y in range(height):
    for x in range(width):
        wave = math.sin(y * .42 + math.sin(x * .016) * 1.6)
        grain = wave * 2 + fibres[y] * .6 + rng.uniform(-1.4, 1.4)
        join = -9 + y % 130 * 3 if y % 130 < 3 else (y // 130 % 3 - 1) * 4
        light = 4 * (1 - x / width) + grain + join
        pixels[x, y] = (int(240 + light), int(193 + light), int(149 + light))
maple.save(SETS.parent / "worktop-maple.webp", quality=88)
