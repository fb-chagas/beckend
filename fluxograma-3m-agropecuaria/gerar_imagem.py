#!/usr/bin/env python3
"""Gera imagem PNG do fluxograma com a logo oficial em SVG/PNG."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent
LOGO_PATH = BASE / "logo-3m-agropecuaria.png"

NAVY = (0, 56, 118)
GREEN = (11, 97, 11)
WHITE = (255, 255, 255)
BG_PAGE = (242, 242, 242)
BG_SECTION_1 = (238, 242, 247)
BG_SECTION_2 = (237, 245, 238)
BG_ROW_ALT = (248, 250, 252)
TEXT_MUTED = (100, 116, 139)
BORDER = (203, 213, 225)

W, H = 1200, 1550
img = Image.new("RGB", (W, H), BG_PAGE)
draw = ImageDraw.Draw(img)

if LOGO_PATH.exists():
    logo = Image.open(LOGO_PATH).convert("RGBA")
    target_w = 320
    ratio = target_w / logo.width
    target_h = int(logo.height * ratio)
    logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    logo_x = (W - target_w) // 2
    img.paste(logo, (logo_x, 40), logo)
    content_top = 40 + target_h + 36
else:
    content_top = 180

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    font_section = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    font_header = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    font_cell = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
except OSError:
    font_title = font_section = font_header = font_cell = ImageFont.load_default()

title = "INVESTIMENTOS"
bbox_t = draw.textbbox((0, 0), title, font=font_title)
w_t = bbox_t[2] - bbox_t[0]
draw.text(((W - w_t) // 2, content_top), title, fill=NAVY, font=font_title)

sections = [
    ("Investimentos em Andamento", NAVY, BG_SECTION_1, NAVY),
    ("Investimentos Previstos com Orçamento", GREEN, BG_SECTION_2, GREEN),
    ("Investimentos Previstos sem Orçamento", NAVY, WHITE, GREEN),
]

cols = ["Valor", "Status", "Prioridade"]
margin_x = 60
section_w = W - margin_x * 2
col_w = section_w // 3
row_h = 44
header_row_h = 40
num_rows = 4
section_header_h = 48

y = content_top + 70

for title_sec, header_color, bg, accent in sections:
    draw.rounded_rectangle(
        [margin_x, y, margin_x + section_w, y + section_header_h],
        radius=8,
        fill=header_color,
    )
    bbox_st = draw.textbbox((0, 0), title_sec, font=font_section)
    st_w = bbox_st[2] - bbox_st[0]
    draw.text((margin_x + (section_w - st_w) // 2, y + 12), title_sec, fill=WHITE, font=font_section)
    y += section_header_h

    content_h = header_row_h + num_rows * row_h + 16
    draw.rounded_rectangle(
        [margin_x, y, margin_x + section_w, y + content_h],
        radius=8,
        fill=bg,
        outline=BORDER,
        width=1,
    )
    draw.rectangle([margin_x, y, margin_x + 5, y + content_h], fill=accent)

    col_y = y + 12
    for i, col in enumerate(cols):
        cx = margin_x + 20 + i * col_w
        draw.text((cx, col_y), col, fill=accent, font=font_header)

    sep_y = y + header_row_h
    draw.line([margin_x + 12, sep_y, margin_x + section_w - 12, sep_y], fill=BORDER, width=1)

    for r in range(num_rows):
        row_y = sep_y + r * row_h
        row_bg = WHITE if r % 2 == 0 else BG_ROW_ALT
        draw.rectangle(
            [margin_x + 12, row_y + 1, margin_x + section_w - 12, row_y + row_h - 1],
            fill=row_bg,
        )
        if r < num_rows - 1:
            draw.line(
                [margin_x + 12, row_y + row_h, margin_x + section_w - 12, row_y + row_h],
                fill=BORDER,
                width=1,
            )
        for i in range(3):
            cx = margin_x + 20 + i * col_w
            draw.text((cx, row_y + 14), "_______________", fill=TEXT_MUTED, font=font_cell)

    y += content_h + 28

out_path = BASE / "fluxograma-investimentos.png"
img.save(out_path, "PNG", optimize=True)
print(out_path)
