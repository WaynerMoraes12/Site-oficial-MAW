"""Ícones do site e do instalador a partir do ícone oficial do app da MAW (o mesmo do .exe e da barra de tarefas).

Nada é redesenhado: o .ico do instalador é uma cópia do oficial, o favicon usa os quadros de 16/32/48 px
que já estão nele, e o apple-touch-icon é o PNG oficial reduzido.
"""
import argparse
import shutil
import sys
from pathlib import Path

from PIL import Image

MAW = Path(r"C:\Users\User\MAW")
FAVICON_SIZES = [(16, 16), (32, 32), (48, 48)]


def write_icons(icon_png: Path, icon_ico: Path, root: Path) -> dict:
    """Grava installer/maw.ico, public/favicon.ico e public/apple-touch-icon.png debaixo de root."""
    installer = root / "installer" / "maw.ico"
    favicon = root / "public" / "favicon.ico"
    apple = root / "public" / "apple-touch-icon.png"
    installer.parent.mkdir(parents=True, exist_ok=True)
    favicon.parent.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(icon_ico, installer)

    with Image.open(icon_ico) as official:
        frames = [official.ico.getimage(size).convert("RGBA") for size in FAVICON_SIZES]
    # o maior quadro vai como base; append_images garante que cada tamanho seja o quadro oficial, sem reamostrar
    frames[-1].save(favicon, format="ICO", sizes=FAVICON_SIZES, append_images=frames[:-1])

    with Image.open(icon_png) as png:
        png.convert("RGBA").resize((180, 180), Image.LANCZOS).save(apple, optimize=True)
    return {"installer": installer, "favicon": favicon, "apple": apple}


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--png", default=str(MAW / "Source" / "icon_MAW.png"))
    p.add_argument("--ico", default=str(MAW / "Builds" / "VisualStudio2022" / "icon.ico"))
    a = p.parse_args(argv)
    out = write_icons(Path(a.png), Path(a.ico), Path("."))
    print("escritos " + ", ".join(str(v) for v in out.values()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
