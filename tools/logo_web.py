"""Logo da MAW para a web: só o fundo preto vira transparente; o desenho fica idêntico ao original."""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# caixa do desenho em logo_MAW.png (1536x1024) com 24 px de respiro
BOX = (383 - 24, 310 - 24, 1151 + 24, 653 + 24)
# fundo do PNG é ~ (3,3,3); o antialiasing do traço fica acima disso
THRESHOLD = 12


def make_web_logo(original: Image.Image) -> Image.Image:
    rgb = np.asarray(original.convert("RGB").crop(BOX))
    alpha = np.where(rgb.max(axis=2) <= THRESHOLD, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def drawing_pixels_identical(original: Image.Image, web: Image.Image) -> bool:
    # igual pixel a pixel (cor e transparência) a uma regeneração do original: pega cor mudada
    # e também parte do desenho apagada, que uma comparação só dos pixels opacos deixaria passar
    expected = np.asarray(make_web_logo(original))
    out = np.asarray(web.convert("RGBA"))
    return bool(expected.shape == out.shape and np.array_equal(expected, out))


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", default=r"C:\Users\User\MAW\Source\logo_MAW.png")
    p.add_argument("--out", default="src/assets/brand/maw-logo-web.png")
    p.add_argument("--check", action="store_true", help="só confere o --out contra o --source")
    a = p.parse_args(argv)
    original = Image.open(a.source)
    if a.check:
        ok = drawing_pixels_identical(original, Image.open(a.out))
        print("logo intacto" if ok else "LOGO ALTERADO")
        return 0 if ok else 1
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    make_web_logo(original).save(a.out, optimize=True)
    print(f"escrito {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
