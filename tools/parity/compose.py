#!/usr/bin/env -S uv run --quiet --with pillow python
"""Build a side-by-side live-versus-this-site comparison image from a capture pair.

The parity captures land as two full-page PNGs per page per viewport width, one from
continentaltire.com and one from this site. A reviewer reading a pull request wants them
next to each other at a size a browser renders inline, not two 2 MB files to open in turn.

    tools/parity/compose.py <capture-dir> [--out DIR] [--width N] [--quality N]

<capture-dir> holds live-<W>.png and eds-<W>.png pairs, which is what capture.sh writes.
One composite per width is written to --out, named <slug>-<W>.jpg, with each side labelled
and scaled so the pair fits --width in total.

Heights differ between the two sides, and that difference is often the finding. The shorter
side is padded rather than stretched, so a band that runs taller on one side reads as a
taller band instead of as different type.
"""

import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

LABEL_H = 34
GUTTER = 12
BG = (24, 24, 24)
FG = (255, 255, 255)


def _font(size: int):
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _cap_height(img: Image.Image, limit: int) -> Image.Image:
    """Trim a full-page shot that is too tall to read inline at all."""
    if limit and img.height > limit:
        return img.crop((0, 0, img.width, limit))
    return img


def compose(live: Path, ours: Path, out: Path, total_width: int, quality: int,
            max_height: int, label_left: str, label_right: str) -> tuple[int, int]:
    a = Image.open(live).convert("RGB")
    b = Image.open(ours).convert("RGB")

    a = _cap_height(a, max_height)
    b = _cap_height(b, max_height)

    half = (total_width - GUTTER) // 2
    scale_a = min(1.0, half / a.width)
    scale_b = min(1.0, half / b.width)
    a = a.resize((int(a.width * scale_a), int(a.height * scale_a)), Image.LANCZOS)
    b = b.resize((int(b.width * scale_b), int(b.height * scale_b)), Image.LANCZOS)

    body_h = max(a.height, b.height)
    canvas = Image.new("RGB", (a.width + GUTTER + b.width, body_h + LABEL_H), BG)
    canvas.paste(a, (0, LABEL_H))
    canvas.paste(b, (a.width + GUTTER, LABEL_H))

    draw = ImageDraw.Draw(canvas)
    font = _font(20)
    draw.text((10, 8), label_left, fill=FG, font=font)
    draw.text((a.width + GUTTER + 10, 8), label_right, fill=FG, font=font)

    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return canvas.size


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("capture_dir", type=Path)
    p.add_argument("--out", type=Path, default=None)
    p.add_argument("--width", type=int, default=1400, help="total composite width")
    p.add_argument("--quality", type=int, default=72)
    p.add_argument("--max-height", type=int, default=6000,
                   help="crop a full-page shot taller than this; 0 keeps it whole")
    p.add_argument("--slug", default=None, help="output name prefix; defaults to the directory name")
    p.add_argument("--label-left", default="continentaltire.com")
    p.add_argument("--label-right", default="this site")
    args = p.parse_args()

    src = args.capture_dir
    if not src.is_dir():
        print(f"compose: {src} is not a directory", file=sys.stderr)
        return 2

    out_dir = args.out or src
    slug = args.slug or src.name

    widths = sorted(
        {int(m.group(1)) for f in src.glob("live-*.png")
         if (m := re.fullmatch(r"live-(\d+)\.png", f.name))},
        reverse=True,
    )
    if not widths:
        print(f"compose: no live-<W>.png in {src}", file=sys.stderr)
        return 2

    made = 0
    for w in widths:
        live = src / f"live-{w}.png"
        ours = src / f"eds-{w}.png"
        if not ours.exists():
            print(f"compose: {ours.name} missing, skipping {w}", file=sys.stderr)
            continue
        out = out_dir / f"{slug}-{w}.jpg"
        size = compose(live, ours, out, args.width, args.quality, args.max_height,
                       f"{args.label_left}  {w}px", f"{args.label_right}  {w}px")
        kb = out.stat().st_size // 1024
        print(f"{out}  {size[0]}x{size[1]}  {kb}KB")
        made += 1

    if not made:
        print("compose: nothing written", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
