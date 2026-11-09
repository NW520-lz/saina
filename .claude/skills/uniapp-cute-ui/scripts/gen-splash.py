# 生成启动动画用的像素头像数据，以及原生启动图（纯粉色，与动画页同色，衔接无缝）。
# 运行：python tools/gen-splash.py [头像图片] [uni-app 项目目录]
# 换头像：替换 tools/assets/lize-avatar.png 后重新运行；如果眼睛糊掉了，微调 CROP 让两只眼睛都落在格子里。
import sys
from collections import Counter
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
AVATAR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tools" / "assets" / "lize-avatar.png"
APP = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "李泽经期小管家"

GRID = 30                        # 30×30 格，去掉圆角后约 880 个方块
CROP = (120, 30, 1220, 1130)     # 以脸为中心裁一个正方形（原图 1254×1254）
CORNER = 5                       # 圆角半径，单位：格
COLORS = 40                      # 先减色再取样，像素画更干净
DARK_SHARE = 0.3                 # 格子里占比 ≥30% 的颜色中取最深的，保住眼睛和头发轮廓
BACKGROUND = (0xFF, 0xE9, 0xF1)  # 必须与 pages/splash/splash.vue 的背景色一致
SPLASH_SIZES = {"hdpi": (480, 762), "xhdpi": (720, 1242), "xxhdpi": (1080, 1882)}  # DCloud 要求的尺寸
SYMBOLS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"  # 与 assemble.js 一致
EMPTY = "."


def luminance(rgb):
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b


def in_rounded_square(x, y):
    nearest_x = min(max(x, CORNER - 0.5), GRID - CORNER - 0.5)
    nearest_y = min(max(y, CORNER - 0.5), GRID - CORNER - 0.5)
    return (x - nearest_x) ** 2 + (y - nearest_y) ** 2 <= CORNER ** 2


def pixelate(image):
    """返回 GRID×GRID 的颜色网格，圆角外为 None。"""
    crop = image.convert("RGB").crop(CROP)
    quantized = crop.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    palette = quantized.getpalette()
    pixels = quantized.load()
    cell = crop.width / GRID
    grid = []
    for gy in range(GRID):
        row = []
        for gx in range(GRID):
            if not in_rounded_square(gx, gy):
                row.append(None)
                continue
            x0, y0, x1, y1 = int(gx * cell), int(gy * cell), int((gx + 1) * cell), int((gy + 1) * cell)
            counts = Counter(pixels[x, y] for y in range(y0, y1) for x in range(x0, x1))
            total = sum(counts.values())
            major = [i for i, n in counts.items() if n >= total * DARK_SHARE] or [counts.most_common(1)[0][0]]
            colors = [tuple(palette[i * 3:i * 3 + 3]) for i in major]
            row.append(min(colors, key=luminance))
        grid.append(row)
    return grid


def write_pixels_js(grid, path):
    used = sorted({c for row in grid for c in row if c}, key=luminance)
    index = {c: SYMBOLS[i] for i, c in enumerate(used)}
    rows = ["".join(index[c] if c else EMPTY for c in row) for row in grid]
    palette = ", ".join(f"'#{r:02x}{g:02x}{b:02x}'" for r, g, b in used)
    lines = [
        "// 由 tools/gen-splash.py 生成，请勿手改。换头像后重新运行脚本",
        "// rows 里每个字符是 palette 的下标（0-9a-zA-Z），'.' 表示空格子",
        "export default {",
        f"\tpalette: [{palette}],",
        "\trows: [",
        *[f"\t\t'{row}'," for row in rows],
        "\t]",
        "}",
        "",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
    return sum(row.count(EMPTY) for row in rows), len(used)


def write_splash_images(folder):
    folder.mkdir(parents=True, exist_ok=True)
    for name, size in SPLASH_SIZES.items():
        Image.new("RGB", size, BACKGROUND).save(folder / f"{name}.png", optimize=True)


if __name__ == "__main__":
    grid = pixelate(Image.open(AVATAR))
    empty, colors = write_pixels_js(grid, APP / "pages" / "splash" / "avatar-pixels.js")
    write_splash_images(APP / "static" / "splash")
    print(f"像素头像：{GRID * GRID - empty} 个方块，{colors} 种颜色；原生启动图：{', '.join(SPLASH_SIZES)}")
