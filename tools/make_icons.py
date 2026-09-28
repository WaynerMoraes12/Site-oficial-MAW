"""Favicon, apple-touch-icon e o .ico do instalador a partir de um recorte quadrado do logo original."""
import argparse
import sys
from pathlib import Path

from PIL import Image

# quadrado 800x800 centrado no desenho (logo_MAW.png 1536x1024): recorte puro, sem pintar nada
SQUARE = (367, 81, 1167, 881)


def square_icon(original: Image.Image) -> Image.Image:
    return original.convert("RGB").crop(SQUARE)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", default=r"C:\Users\User\MAW\Source\logo_MAW.png")
    a = p.parse_args(argv)
    square = square_icon(Image.open(a.source))
    Path("public").mkdir(exist_ok=True)
    Path("installer").mkdir(exist_ok=True)
    square.resize((64, 64), Image.LANCZOS).save("public/favicon.png", optimize=True)
    square.resize((180, 180), Image.LANCZOS).save("public/apple-touch-icon.png", optimize=True)
    square.save("installer/maw.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("escritos public/favicon.png, public/apple-touch-icon.png, installer/maw.ico")
    return 0


if __name__ == "__main__":
    sys.exit(main())
