# 生成 tabBar 图标（uni-app tabBar 只支持 png/jpg）。运行：python tools/gen-icons.py
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "李泽经期小管家" / "static" / "tab"
SIZE = 81
SCALE = 4  # 先放大绘制再缩小，实现抗锯齿
COLORS = {"": (201, 169, 181, 255), "-active": (255, 107, 154, 255)}


def canvas():
    image = Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def s(*values):
    return [v * SCALE for v in values]


def heart(draw, color):
    draw.ellipse(s(14, 18, 42, 46), fill=color)
    draw.ellipse(s(39, 18, 67, 46), fill=color)
    draw.polygon(s(16, 38, 65, 38, 40.5, 66), fill=color)


def calendar(draw, color):
    draw.rounded_rectangle(s(14, 20, 67, 66), radius=8 * SCALE, outline=color, width=5 * SCALE)
    draw.rectangle(s(14, 20, 67, 33), fill=color)
    draw.rounded_rectangle(s(24, 12, 30, 26), radius=3 * SCALE, fill=color)
    draw.rounded_rectangle(s(51, 12, 57, 26), radius=3 * SCALE, fill=color)
    for x in (26, 38, 50):
        draw.ellipse(s(x, 42, x + 6, 48), fill=color)
        draw.ellipse(s(x, 53, x + 6, 59), fill=color)


def bubble(draw, color):
    draw.rounded_rectangle(s(12, 16, 69, 56), radius=16 * SCALE, fill=color)
    draw.polygon(s(24, 50, 22, 68, 40, 54), fill=color)
    for x in (26, 38, 50):
        draw.ellipse(s(x, 33, x + 6, 39), fill=(255, 255, 255, 255))


def person(draw, color):
    draw.ellipse(s(26, 10, 55, 39), fill=color)
    draw.pieslice(s(14, 42, 67, 92), 180, 360, fill=color)
    draw.ellipse(s(49, 8, 61, 20), fill=color)  # 小发夹


ICONS = {"today": heart, "calendar": calendar, "chat": bubble, "mine": person}

OUT.mkdir(parents=True, exist_ok=True)
for name, painter in ICONS.items():
    for suffix, color in COLORS.items():
        image, draw = canvas()
        painter(draw, color)
        image.resize((SIZE, SIZE), Image.LANCZOS).save(OUT / f"{name}{suffix}.png")
        print("生成", f"{name}{suffix}.png")
