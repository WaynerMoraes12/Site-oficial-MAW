import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from logo_web import BOX, THRESHOLD, drawing_pixels_identical, make_web_logo  # noqa: E402
from make_icons import write_icons  # noqa: E402

SOURCE = Path(r"C:\Users\User\MAW\Source\logo_MAW.png")


def synthetic_logo() -> Image.Image:
    # fundo quase preto (3,3,3) + um traço roxo dentro da caixa do logo
    a = np.full((1024, 1536, 3), 3, dtype=np.uint8)
    a[400:420, 500:900] = (157, 0, 255)
    a[430, 500:900] = (20, 0, 40)  # borda antialiasing: acima do limiar, fica
    return Image.fromarray(a, "RGB")


class WebLogoTests(unittest.TestCase):
    def test_background_becomes_transparent(self):
        web = make_web_logo(synthetic_logo())
        self.assertEqual(web.mode, "RGBA")
        self.assertEqual(web.size, (BOX[2] - BOX[0], BOX[3] - BOX[1]))
        self.assertEqual(web.getpixel((0, 0))[3], 0)

    def test_drawing_pixels_are_identical_and_opaque(self):
        original = synthetic_logo()
        web = make_web_logo(original)
        self.assertTrue(drawing_pixels_identical(original, web))
        x, y = 600 - BOX[0], 410 - BOX[1]
        self.assertEqual(web.getpixel((x, y)), (157, 0, 255, 255))

    def test_threshold_keeps_dark_edge_pixels(self):
        web = make_web_logo(synthetic_logo())
        self.assertGreater(20, THRESHOLD)
        self.assertEqual(web.getpixel((600 - BOX[0], 430 - BOX[1]))[3], 255)

    def test_detects_altered_pixel(self):
        original = synthetic_logo()
        web = make_web_logo(original)
        web.putpixel((600 - BOX[0], 410 - BOX[1]), (150, 0, 255, 255))
        self.assertFalse(drawing_pixels_identical(original, web))

    def test_detects_erased_part_of_the_drawing(self):
        original = synthetic_logo()
        web = make_web_logo(original)
        # apaga (alpha 0) um bloco do traço: o logo ficou incompleto
        a = np.asarray(web).copy()
        a[400 - BOX[1]:410 - BOX[1], 500 - BOX[0]:700 - BOX[0], 3] = 0
        self.assertFalse(drawing_pixels_identical(original, Image.fromarray(a, "RGBA")))

    def test_catches_a_bug_in_the_generator_that_recolors(self):
        original = synthetic_logo()

        def buggy(img):
            a = np.asarray(make_web_logo(img)).copy()
            a[..., 0] = np.where(a[..., 3] > 0, a[..., 0] // 2, a[..., 0])
            return Image.fromarray(a, "RGBA")

        with mock.patch("logo_web.make_web_logo", buggy):
            self.assertFalse(drawing_pixels_identical(original, buggy(original)))

    def test_catches_a_bug_in_the_generator_that_erases(self):
        original = synthetic_logo()

        def buggy(img):
            a = np.asarray(make_web_logo(img)).copy()
            a[400 - BOX[1]:410 - BOX[1], 500 - BOX[0]:700 - BOX[0], 3] = 0
            return Image.fromarray(a, "RGBA")

        with mock.patch("logo_web.make_web_logo", buggy):
            self.assertFalse(drawing_pixels_identical(original, buggy(original)))

    @unittest.skipUnless(SOURCE.exists(), "logo original da MAW não encontrado")
    def test_real_logo(self):
        original = Image.open(SOURCE).convert("RGB")
        self.assertTrue(drawing_pixels_identical(original, make_web_logo(original)))


def synthetic_app_icon(tmp: Path) -> tuple[Path, Path]:
    # ícone do app: quadrado arredondado preto com um traço roxo, em PNG 1024 e em .ico com vários tamanhos
    a = np.zeros((1024, 1024, 4), dtype=np.uint8)
    a[64:960, 64:960] = (3, 3, 3, 255)
    a[400:600, 150:870] = (157, 0, 255, 255)
    png = tmp / "icon_MAW.png"
    ico = tmp / "icon.ico"
    Image.fromarray(a, "RGBA").save(png)
    Image.fromarray(a, "RGBA").save(ico, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (256, 256)])
    return png, ico


class IconTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.png, self.ico = synthetic_app_icon(self.tmp)

    def test_installer_uses_the_official_app_icon_unchanged(self):
        out = write_icons(self.png, self.ico, self.tmp / "site")
        self.assertEqual(out["installer"].read_bytes(), self.ico.read_bytes())

    def test_tab_icon_frames_are_the_official_ones(self):
        out = write_icons(self.png, self.ico, self.tmp / "site")
        with Image.open(self.ico) as official, Image.open(out["favicon"]) as web:
            self.assertEqual(sorted(web.info["sizes"]), [(16, 16), (32, 32), (48, 48)])
            for size in [(16, 16), (32, 32), (48, 48)]:
                self.assertTrue(np.array_equal(np.asarray(web.ico.getimage(size)), np.asarray(official.ico.getimage(size))), size)

    def test_apple_touch_icon_is_the_official_png_at_180(self):
        out = write_icons(self.png, self.ico, self.tmp / "site")
        with Image.open(out["apple"]) as apple:
            self.assertEqual(apple.size, (180, 180))


if __name__ == "__main__":
    unittest.main()
