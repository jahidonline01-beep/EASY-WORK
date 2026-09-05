#!/usr/bin/env python3
import shutil
from pathlib import Path

src = Path("public/icon-512.png")
if not src.exists():
    src = Path("public/logo.png")
if not src.exists():
    src = Path("public/icon.png")
if not src.exists():
    print("No icon source found; skipping")
    raise SystemExit(0)

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

res = Path("android/app/src/main/res")
try:
    from PIL import Image
    im = Image.open(src).convert("RGBA")
    for folder, sz in sizes.items():
        dest_dir = res / folder
        dest_dir.mkdir(parents=True, exist_ok=True)
        out = im.resize((sz, sz), Image.Resampling.LANCZOS)
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            out.save(dest_dir / name, "PNG")
    print("Android launcher icons written")
except Exception as e:
    print("icon convert fallback:", e)
    for folder in sizes:
        dest_dir = res / folder
        dest_dir.mkdir(parents=True, exist_ok=True)
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            shutil.copyfile(src, dest_dir / name)
