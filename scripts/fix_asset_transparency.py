#!/usr/bin/env python3
"""Re-crop game sprites from template-sheet.jpg and strip baked checkerboard backgrounds."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "assets/builder/template-sheet.jpg"

# Bounding boxes from sat_mask.png on the 808×1024 template (left, top, right, bottom).
CROPS: dict[str, tuple[int, int, int, int]] = {
    "assets/builder/wing-rocket.png": (345, 230, 417, 276),
    "assets/builder/wing-angel.png": (446, 200, 549, 266),
    "assets/builder/wing-bat.png": (558, 206, 684, 257),
    "assets/builder/wing-butterfly.png": (693, 200, 785, 267),
    "assets/builder/core-green.png": (336, 292, 428, 368),
    "assets/builder/core-star.png": (458, 292, 537, 368),
    "assets/builder/core-blue.png": (575, 292, 667, 368),
    "assets/builder/core-rocket.png": (704, 287, 773, 369),
    "assets/builder/blaster-ray.png": (336, 388, 430, 448),
    "assets/builder/blaster-tri.png": (492, 388, 562, 465),
    "assets/builder/blaster-yellow.png": (578, 391, 661, 465),
    "assets/builder/blaster-missile.png": (692, 384, 792, 448),
    "assets/enemies/bug-ladybug.png": (317, 904, 401, 977),
    "assets/enemies/bug-bee.png": (437, 898, 520, 981),
    "assets/enemies/bug-purple.png": (564, 911, 655, 975),
    "assets/enemies/bug-brown.png": (689, 903, 769, 985),
}

OUT_SIZE = {
    "assets/builder/": 128,
    "assets/enemies/": 96,
}


def is_light_bg(r: int, g: int, b: int, a: int, light_min: int) -> bool:
    if a < 10:
        return True
    return r >= light_min and g >= light_min and b >= light_min


def is_dark_bg(r: int, g: int, b: int, a: int, dark_max: int, dark_spread: int) -> bool:
    if a < 10:
        return True
    mx, mn = int(max(r, g, b)), int(min(r, g, b))
    return mx <= dark_max and (mx - mn) <= dark_spread


def flood_background(arr: np.ndarray, mask_fn) -> np.ndarray:
    h, w = arr.shape[:2]
    seen = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def seed(y: int, x: int) -> None:
        if mask_fn(y, x) and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))

    for x in range(w):
        seed(0, x)
        seed(h - 1, x)
    for y in range(h):
        seed(y, 0)
        seed(y, w - 1)

    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and mask_fn(ny, nx):
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def strip_checkerboard(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), copy=True)
    light_min, dark_max, dark_spread = 190, 115, 65

    def light(y: int, x: int) -> bool:
        r, g, b, a = arr[y, x]
        return is_light_bg(int(r), int(g), int(b), int(a), light_min)

    def dark(y: int, x: int) -> bool:
        r, g, b, a = arr[y, x]
        return is_dark_bg(int(r), int(g), int(b), int(a), dark_max, dark_spread)

    bg = flood_background(arr, light) | flood_background(arr, dark)
    arr[bg, 3] = 0
    return Image.fromarray(arr)


def is_fringe_color(r: int, g: int, b: int) -> bool:
    """Near-neutral light pixels from checkerboard / matte removal."""
    mx, mn = max(r, g, b), min(r, g, b)
    if mn < 178:
        return False
    if mx - mn > 45:
        return False
    return True


def defringe(arr: np.ndarray, max_passes: int = 16) -> None:
    h, w = arr.shape[:2]
    for _ in range(max_passes):
        a = arr[:, :, 3]
        kill = np.zeros((h, w), dtype=bool)
        for y in range(h):
            for x in range(w):
                if a[y, x] == 0:
                    continue
                r, g, b = (int(arr[y, x, 0]), int(arr[y, x, 1]), int(arr[y, x, 2]))
                if not is_fringe_color(r, g, b):
                    continue
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        if dy == 0 and dx == 0:
                            continue
                        ny, nx = y + dy, x + dx
                        if ny < 0 or ny >= h or nx < 0 or nx >= w or a[ny, nx] == 0:
                            kill[y, x] = True
                            break
                    if kill[y, x]:
                        break
        if not kill.any():
            break
        arr[kill, 3] = 0


def trim_and_pad(im: Image.Image, size: int) -> Image.Image:
    arr = np.array(im)
    ys, xs = np.where(arr[:, :, 3] > 8)
    if len(xs) == 0:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    pad = max(2, int(max(x1 - x0, y1 - y0) * 0.06))
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(arr.shape[1] - 1, x1 + pad)
    y1 = min(arr.shape[0] - 1, y1 + pad)
    cropped = im.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size
    scale = min((size - 8) / cw, (size - 8) / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return out


def scrub_near_white(arr: np.ndarray) -> None:
    """Remove leftover checkerboard specks (nearly neutral white)."""
    h, w = arr.shape[:2]
    for y in range(h):
        for x in range(w):
            if arr[y, x, 3] == 0:
                continue
            r, g, b = (int(arr[y, x, 0]), int(arr[y, x, 1]), int(arr[y, x, 2]))
            mn, mx = min(r, g, b), max(r, g, b)
            if mn >= 205 and (mx - mn) <= 28:
                arr[y, x, 3] = 0


def keep_largest_component(im: Image.Image, min_relative: float = 0.12) -> Image.Image:
    """Drop stray fringe islands; keep the main sprite silhouette."""
    arr = np.array(im.convert("RGBA"), copy=True)
    a = arr[:, :, 3] > 20
    h, w = a.shape
    seen = np.zeros((h, w), dtype=bool)
    best: list[tuple[int, int]] = []

    for y in range(h):
        for x in range(w):
            if not a[y, x] or seen[y, x]:
                continue
            q: deque[tuple[int, int]] = deque([(y, x)])
            seen[y, x] = True
            coords = [(y, x)]
            while q:
                cy, cx = q.popleft()
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
                        coords.append((ny, nx))
            if len(coords) > len(best):
                best = coords

    if not best:
        return im
    mask = np.zeros((h, w), dtype=bool)
    for y, x in best:
        mask[y, x] = True
    drop = a & ~mask
    main_area = len(best)
    seen[:] = False
    for y in range(h):
        for x in range(w):
            if not a[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)])
            seen[y, x] = True
            coords = [(y, x)]
            while q:
                cy, cx = q.popleft()
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
                        coords.append((ny, nx))
            if len(coords) < main_area * min_relative:
                for cy, cx in coords:
                    arr[cy, cx, 3] = 0
    arr[drop, 3] = 0
    return Image.fromarray(arr)


def process_crop(sheet: Image.Image, box: tuple[int, int, int, int], out_size: int, *, solo: bool) -> Image.Image:
    im = strip_checkerboard(sheet.crop(box))
    arr = np.array(im)
    defringe(arr)
    scrub_near_white(arr)
    if solo:
        im = keep_largest_component(Image.fromarray(arr))
    else:
        im = Image.fromarray(arr)
    return trim_and_pad(im, out_size)


def out_size_for(rel_path: str) -> int:
    for prefix, sz in OUT_SIZE.items():
        if rel_path.startswith(prefix):
            return sz
    return 128


def main() -> None:
    if not SHEET.is_file():
        raise SystemExit(f"Missing template sheet: {SHEET}")
    sheet = Image.open(SHEET)
    for rel, box in CROPS.items():
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        out = process_crop(sheet, box, out_size_for(rel), solo=rel.startswith("assets/enemies/"))
        out.save(dest, optimize=True)
        arr = np.array(out)
        opaque = int((arr[:, :, 3] > 200).sum())
        transparent = int((arr[:, :, 3] < 10).sum())
        print(f"{rel}: transparent={transparent} opaque={opaque}")


if __name__ == "__main__":
    main()
