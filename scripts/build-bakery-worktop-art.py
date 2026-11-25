"""Render reusable top-view bakery layers (requires Pillow)."""
from pathlib import Path
import math
import random
from PIL import Image, ImageColor, ImageDraw, ImageFilter, ImageOps

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

# Draw ingredient states in the inner cavity of each original bowl.
cavities = {
    "cookie": (.18, .285, .82, .53),
    "cupcake": (.17, .29, .83, .54),
    "bun": (.17, .30, .83, .55),
    "tart": (.18, .30, .82, .55),
}
for name, cavity in cavities.items():
    bowl = Image.open(SETS / name / "bowl.webp").convert("RGBA")
    left, top, right, bottom = [round(f * size) for f, size in zip(cavity, bowl.size * 2)]
    w, h = right - left, bottom - top
    for flags in range(1, 8):
        state = bowl.copy()
        draw = ImageDraw.Draw(state)
        if flags & 4:
            draw.ellipse((left, top + h*.22, right, bottom), fill="#fff3dc")
            draw.arc((left+3, top+h*.24, right-3, bottom), 10, 165, fill="#fffaf0", width=2)
        if flags & 1:
            draw.ellipse((left+w*.09, top+h*.22, left+w*.69, bottom-1), fill="#f2d8ae")
            draw.ellipse((left+w*.12, top+h*.19, left+w*.64, bottom-4), fill="#fff0d3")
            dust = random.Random(34)
            for _ in range(95):
                x, y = dust.random(), dust.random()
                if ((x-.38)/.25)**2 + ((y-.52)/.29)**2 < 1:
                    draw.point((left+x*w, top+y*h), fill="#e0bea0")
        if flags & 2:
            draw.ellipse((left+w*.50, top+h*.29, right-w*.05, bottom-1), fill="#fff8e6")
            draw.ellipse((left+w*.64, top+h*.34, right-w*.12, bottom-h*.17), fill="#eaaa34")
            draw.arc((left+w*.67, top+h*.37, right-w*.15, bottom-h*.24), 205, 290, fill="#ffe098", width=2)
        save(state, name, f"bowl-contents-{flags}")

    tone = {"cookie": (239, 183, 99), "cupcake": (242, 196, 128),
            "bun": (232, 177, 105), "tart": (244, 190, 104)}[name]
    for step in range(5):
        batter = Image.new("RGBA", (192, 192))
        pixels = batter.load()
        noise = random.Random(15 + step)
        for y in range(192):
            for x in range(192):
                dx, dy = (x-95.5)/95, (y-95.5)/95
                distance = math.hypot(dx, dy)
                if distance >= 1:
                    continue
                angle = math.atan2(dy, dx)
                streak = (math.sin(40*distance + 4*angle) + .5 * math.sin(68*distance - 2*angle))
                shade = 13*(.4-dy) - 15*distance**3 + streak*(5-step*.75) + noise.uniform(-3, 3)
                pixels[x, y] = (*[min(255, int(channel + shade)) for channel in tone],
                                min(255, round((1-distance)*4800)))
        if step < 4:
            size = 1-step*.20
            for dx,dy,color in ((-31, -8, "#fff0cc"), (29, 7, "#f5a831"), (-8, 31, "#fff8df")):
                cx, cy = 96+dx, 96+dy
                for r, alpha in ((31, 42), (24, 72), (17, 115)):
                    mark = Image.new("RGBA", batter.size)
                    ImageDraw.Draw(mark).ellipse((cx-r*size, cy-r*size, cx+r*size, cy+r*size), fill=(*ImageColor.getrgb(color),alpha))
                    batter = Image.alpha_composite(batter, mark)
        save(batter, name, f"batter-{step}")

# Use the photographed-style texture from the delivered piparitaikina art.
seed = Image.open(SETS / "cookie" / "dough.webp").convert("RGB")
size = (360, 265)
profile = [(20, 47), (30, 28), (77, 18), (290, 19), (329, 28), (342, 58),
           (340, 213), (330, 235), (302, 248), (68, 245), (35, 237), (19, 215)]
for step, scale in ((1,.57),(2,.79),(3,1)):
    # Sample inside the source ball so its original transparent edges don't stretch.
    w,h = seed.size
    fill = ImageOps.fit(seed.crop((w*.20,h*.18,w*.80,h*.73)), size).convert("RGBA")
    mask = Image.new("L", size)
    ImageDraw.Draw(mask).polygon([(180+(x-180)*scale,132+(y-132)*scale) for x,y in profile], fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(2.1))
    fill.putalpha(mask)
    save(fill, "cookie", f"dough-sheet-{step}")

for name in ("cookie", "bun"):
    paper = Image.open(SETS / name / "paper.webp").convert("RGBA")
    source = paper.crop((paper.width*.18, paper.height*.24, paper.width*.7, paper.height*.68))
    roll = ImageOps.fit(source, (42, 160)).convert("RGBA")
    skin = Image.new("L", roll.size)
    ImageDraw.Draw(skin).rounded_rectangle((1, 1, 40, 158), 13, fill=255)
    pixels = roll.load()
    for y in range(160):
        for x in range(42):
            r,g,b,_ = pixels[x,y]
            shade = math.sin(x/41*math.pi)*23 - 19
            pixels[x,y] = (min(255,int(r+shade)), min(255,int(g+shade)), min(255,int(b+shade)), skin.getpixel((x,y)))
    save(roll, name, "paper-curl")

# One faucet housing and a rigid handle sheet sharing the same canvas.
housing = Image.new("RGBA", (260, 188))
draw = ImageDraw.Draw(housing)
draw.ellipse((99, 157, 205, 182), fill="#816393")
draw.ellipse((99, 151, 205, 177), fill="#c7a8dc")
draw.rounded_rectangle((118, 73, 181, 166), 19, fill="#a580be")
draw.rounded_rectangle((121, 73, 161, 160), 15, fill="#c6a6dc")
curve = [(27,95),(27,71),(36,51),(51,37),(72,29),(96,30),(117,39),(132,55),(144,80),(147,110),(147,148)]
for width,color,shift in ((34,"#84619e",0),(28,"#b692ce",-1),(20,"#d1b4e6",-3),(8,"#e6d1f1",-5)):
    draw.line([(x+shift,y) for x,y in curve], fill=color, width=width, joint="curve")
draw.rounded_rectangle((9,81,45,105), 7, fill="#b995d4")
draw.ellipse((9,96,45,107), fill="#765589")
draw.ellipse((16,98,38,105), fill="#563c68")
draw.ellipse((146,102,187,140), fill="#74558c")
draw.ellipse((148,101,184,136), fill="#c9a8df")
save(housing, "wash", "faucet-housing")
for step in range(5):
    handle = Image.new("RGBA", housing.size)
    draw = ImageDraw.Draw(handle)
    end = (235-step*4, 90+step*10)
    for width,color,dy in ((23,"#86649c",1),(18,"#c09ed8",0),(6,"#e0c7ee",-4)):
        draw.line((167,118+dy,end[0],end[1]+dy), fill=color, width=width)
        draw.ellipse((end[0]-width/2,end[1]+dy-width/2,end[0]+width/2,end[1]+dy+width/2), fill=color)
    draw.ellipse((151,102,182,134), fill="#b996d0")
    draw.arc((152,103,181,133), 195, 318, fill="#e9d6f4", width=3)
    save(handle, "wash", f"faucet-handle-{step}")

# Reuse the kitchen's tiles and light for the oven's rear wall, with no second oven.
kitchen = Image.open(SETS.parents[2] / "rooms/kitchen.webp")
w,h = kitchen.size
wall = kitchen.crop((w*.54,h*.08,w*.94,h*.43))
wall = ImageOps.fit(wall, (720, 430)).filter(ImageFilter.GaussianBlur(3))
wall = Image.blend(wall.convert("RGB"), Image.new("RGB", wall.size, "#efc9bd"), .27)
wall.save(SETS.parent / "oven-wall.webp", quality=89)
