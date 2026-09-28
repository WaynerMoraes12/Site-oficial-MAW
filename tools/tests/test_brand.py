import sys
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from logo_web import BOX, THRESHOLD, drawing_pixels_identical, make_web_logo  # noqa: E402
from make_icons import square_icon  # noqa: E402

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

    @unittest.skipUnless(SOURCE.exists(), "logo original da MAW não encontrado")
    def test_real_logo(self):
        original = Image.open(SOURCE).convert("RGB")
        self.assertTrue(drawing_pixels_identical(original, make_web_logo(original)))


class IconTests(unittest.TestCase):
    def test_square_icon_is_square_crop(self):
        icon = square_icon(synthetic_logo())
        self.assertEqual(icon.size[0], icon.size[1])
        self.assertEqual(icon.size, (800, 800))


if __name__ == "__main__":
    unittest.main()
